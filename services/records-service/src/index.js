const express = require('express');
const cors = require('cors');
const { createStore } = require('./store');

const app = express();
const store = createStore();
const PORT = process.env.PORT || 3003;
const SERVICE = process.env.SERVICE_NAME || 'records-service';
const PATIENT_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
const S3_BUCKET = process.env.S3_BUCKET || 'healthcare-records-local';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE, s3Bucket: S3_BUCKET, timestamp: new Date().toISOString() });
});

async function patientExists(patientId) {
  try {
    const res = await fetch(`${PATIENT_URL}/patients/${patientId}`);
    return res.ok;
  } catch {
    return process.env.USE_LOCAL_STORE === 'true' ? null : false;
  }
}

const ALLOWED_TYPES = new Set(['consultation', 'lab', 'imaging', 'prescription', 'discharge', 'vaccination']);

function validateRecord(body) {
  const errors = [];
  if (!body.patientId) errors.push('patientId is required');
  if (body.type && !ALLOWED_TYPES.has(body.type)) {
    errors.push(`type must be one of: ${[...ALLOWED_TYPES].join(', ')}`);
  }
  return errors;
}

app.post('/records', async (req, res) => {
  try {
    const errors = validateRecord(req.body || {});
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    const exists = await patientExists(req.body.patientId);
    if (exists === false) return res.status(400).json({ error: 'Patient not found', patientId: req.body.patientId });
    if (req.body.documentName) {
      req.body.documentKey = `patients/${req.body.patientId}/${Date.now()}-${req.body.documentName}`;
    }
    const record = await store.create(req.body);
    res.status(201).json({
      ...record,
      storageHint: record.documentKey ? `s3://${S3_BUCKET}/${record.documentKey}` : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

app.get('/records', async (req, res) => {
  try {
    const data = await store.findAll({
      patientId: req.query.patientId,
      type: req.query.type,
      limit: Math.min(parseInt(req.query.limit || '50', 10), 100),
    });
    res.json({ count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list records' });
  }
});

app.get('/records/:id', async (req, res) => {
  try {
    const record = await store.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get record' });
  }
});

app.put('/records/:id', async (req, res) => {
  try {
    const allowed = ['type', 'diagnosis', 'notes', 'prescription', 'vitals', 'providerName', 'documentKey', 'status'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    const updated = await store.update(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Record not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

app.delete('/records/:id', async (req, res) => {
  try {
    const updated = await store.update(req.params.id, { status: 'archived' });
    if (!updated) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record archived', record: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to archive record' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(JSON.stringify({ message: `${SERVICE} listening`, port: PORT, s3Bucket: S3_BUCKET }));
});
