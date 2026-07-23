/**
 * Local smoke test against API gateway (http://localhost:8080)
 * Run: node scripts/smoke-test.js
 */
const BASE = process.env.API_BASE || 'http://localhost:8080';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  return data;
}

(async () => {
  console.log('Smoke test against', BASE);

  const health = await req('GET', '/health');
  console.log('gateway health:', health);

  const patient = await req('POST', '/patients', {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: `ada.${Date.now()}@example.com`,
    dateOfBirth: '1815-12-10',
    phone: '+1-555-0100',
    bloodType: 'O+',
    allergies: ['penicillin'],
  });
  console.log('created patient:', patient.id, patient.mrn);

  const appt = await req('POST', '/appointments', {
    patientId: patient.id,
    doctorName: 'Dr. Turing',
    specialty: 'Cardiology',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    reason: 'Annual checkup',
  });
  console.log('created appointment:', appt.id);

  const record = await req('POST', '/records', {
    patientId: patient.id,
    type: 'consultation',
    diagnosis: 'Healthy',
    notes: 'Vitals normal. Follow-up in 6 months.',
    providerName: 'Dr. Turing',
    vitals: { bp: '120/80', hr: 72 },
  });
  console.log('created record:', record.id);

  const notifications = await req('GET', '/notifications?limit=5');
  console.log('notifications count:', notifications.count);

  console.log('\nAll smoke checks passed.');
})().catch((err) => {
  console.error('SMOKE TEST FAILED:', err.message);
  process.exit(1);
});
