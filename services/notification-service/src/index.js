const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3004;
const SERVICE = process.env.SERVICE_NAME || 'notification-service';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';
const USE_LOCAL = process.env.USE_LOCAL_STORE === 'true' || !SNS_TOPIC_ARN;
const notifications = [];

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE, mode: USE_LOCAL ? 'local-log' : 'sns', timestamp: new Date().toISOString() });
});

async function publishSns(message) {
  const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
  const client = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  await client.send(new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Subject: message.subject || 'HealthCareHub Notification',
    Message: JSON.stringify(message),
  }));
}

app.post('/notifications', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.type || !body.message) {
      return res.status(400).json({ error: 'type and message are required' });
    }
    const notification = {
      id: uuidv4(), type: body.type, channel: body.channel || 'email',
      recipient: body.recipient || null, subject: body.subject || 'HealthCareHub',
      message: body.message, metadata: body.metadata || {}, status: 'queued',
      createdAt: new Date().toISOString(),
    };
    if (USE_LOCAL) {
      notification.status = 'logged';
      notifications.unshift(notification);
      if (notifications.length > 200) notifications.pop();
      console.log(JSON.stringify({ event: 'notification.sent', ...notification }));
    } else {
      await publishSns(notification);
      notification.status = 'published';
      notifications.unshift(notification);
    }
    res.status(201).json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.get('/notifications', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const data = notifications.slice(0, limit);
  res.json({ count: data.length, data });
});

app.get('/notifications/:id', (req, res) => {
  const item = notifications.find((n) => n.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Notification not found' });
  res.json(item);
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(JSON.stringify({ message: `${SERVICE} listening`, port: PORT, mode: USE_LOCAL ? 'local-log' : 'sns' }));
});
