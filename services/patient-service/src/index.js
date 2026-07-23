const express = require('express');
const cors = require('cors');
const { createStore } = require('./store');

const app = express();
const store = createStore();
const PORT = process.env.PORT || 3001;
const SERVICE = process.env.SERVICE_NAME || 'patient-service';

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

function validatePatient(body) {
  const errors = [];
  if (!body.firstName || typeof body.firstName !== 'string') errors.push('firstName is required');
  if (!body.lastName || typeof body.lastName !== 'string') errors.push('lastName is required');
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('valid email is required');
  if (!body.dateOfBirth) errors.push('dateOfBirth is required (YYYY-MM-DD)');
  return errors;
}

app.post('/patients', async (req, res) => {
  try {
    const errors = validatePatient(req.body || {});
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    const patient = await store.create(req.body);
    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

app.get('/patients', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const patients = await store.findAll({ limit, status: req.query.status });
    res.json({ count: patients.length, data: patients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list patients' });
  }
});

app.get('/patients/:id', async (req, res) => {
  try {
    const patient = await store.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get patient' });
  }
});

app.put('/patients/:id', async (req, res) => {
  try {
    const { id, mrn, createdAt, ...patch } = req.body || {};
    const updated = await store.update(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Patient not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

app.delete('/patients/:id', async (req, res) => {
  try {
    const updated = await store.softDelete(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deactivated', patient: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(JSON.stringify({
    message: `${SERVICE} listening`,
    port: PORT,
    store: process.env.USE_LOCAL_STORE === 'true' ? 'local' : 'dynamodb',
  }));
});
