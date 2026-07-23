const express = require('express');
const cors = require('cors');
const { createStore } = require('./store');

const app = express();
const store = createStore();
const PORT = process.env.PORT || 3002;
const SERVICE = process.env.SERVICE_NAME || 'appointment-service';
const PATIENT_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({
      service: SERVICE,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    }));
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE, timestamp: new Date().toISOString() });
});

async function patientExists(patientId) {
  try {
    const res = await fetch(`${PATIENT_URL}/patients/${patientId}`);
    return res.ok;
  } catch {
    // Local demos may not have network; allow when store is local and patient check fails hard
    return process.env.USE_LOCAL_STORE === 'true' ? null : false;
  }
}

async function notify(payload) {
  try {
    await fetch(`${NOTIFICATION_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(JSON.stringify({ service: SERVICE, warn: 'notification_failed', message: err.message }));
  }
}

function validateAppointment(body) {
  const errors = [];
  if (!body.patientId) errors.push('patientId is required');
  if (!body.doctorName) errors.push('doctorName is required');
  if (!body.scheduledAt || Number.isNaN(Date.parse(body.scheduledAt))) {
    errors.push('scheduledAt must be a valid ISO datetime');
  }
  return errors;
}

app.post('/appointments', async (req, res) => {
  try {
    const errors = validateAppointment(req.body || {});
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    const exists = await patientExists(req.body.patientId);
    if (exists === false) {
      return res.status(400).json({ error: 'Patient not found', patientId: req.body.patientId });
    }

    const appt = await store.create(req.body);

    await notify({
      type: 'appointment.booked',
      channel: 'email',
      recipient: req.body.patientId,
      subject: 'Appointment confirmed',
      message: `Your appointment with ${appt.doctorName} is scheduled at ${appt.scheduledAt}`,
      metadata: { appointmentId: appt.id, patientId: appt.patientId },
    });

    res.status(201).json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.get('/appointments', async (req, res) => {
  try {
    const data = await store.findAll({
      patientId: req.query.patientId,
      status: req.query.status,
      limit: Math.min(parseInt(req.query.limit || '50', 10), 100),
    });
    res.json({ count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list appointments' });
  }
});

app.get('/appointments/:id', async (req, res) => {
  try {
    const appt = await store.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get appointment' });
  }
});

app.patch('/appointments/:id', async (req, res) => {
  try {
    const allowed = ['doctorName', 'specialty', 'scheduledAt', 'durationMinutes', 'reason', 'location', 'notes', 'status'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    const updated = await store.update(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });

    if (patch.status === 'cancelled' || patch.scheduledAt) {
      await notify({
        type: patch.status === 'cancelled' ? 'appointment.cancelled' : 'appointment.rescheduled',
        channel: 'email',
        recipient: updated.patientId,
        subject: patch.status === 'cancelled' ? 'Appointment cancelled' : 'Appointment rescheduled',
        message: `Appointment ${updated.id} is now ${updated.status} at ${updated.scheduledAt}`,
        metadata: { appointmentId: updated.id },
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

app.delete('/appointments/:id', async (req, res) => {
  try {
    const updated = await store.update(req.params.id, { status: 'cancelled' });
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    await notify({
      type: 'appointment.cancelled',
      channel: 'email',
      recipient: updated.patientId,
      subject: 'Appointment cancelled',
      message: `Appointment ${updated.id} has been cancelled`,
      metadata: { appointmentId: updated.id },
    });
    res.json({ message: 'Appointment cancelled', appointment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(JSON.stringify({
    message: `${SERVICE} listening`,
    port: PORT,
    patientUrl: PATIENT_URL,
  }));
});
