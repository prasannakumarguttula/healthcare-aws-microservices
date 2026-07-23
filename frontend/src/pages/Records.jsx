import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const emptyForm = {
  patientId: '',
  type: 'consultation',
  diagnosis: '',
  notes: '',
  providerName: '',
  prescription: '',
};

export default function Records() {
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [records, pts] = await Promise.all([api.listRecords(), api.listPatients()]);
      setItems(records.data || []);
      setPatients((pts.data || []).filter((p) => p.status === 'active'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function patientName(id) {
    const p = patients.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : id.slice(0, 8) + '…';
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.createRecord(form);
      setOpen(false);
      setForm(emptyForm);
      setSuccess('Medical record created.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function archive(id) {
    if (!confirm('Archive this record?')) return;
    try {
      await api.archiveRecord(id);
      setSuccess('Record archived.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Medical records</h2>
          <p>Clinical notes and metadata (records-service + S3 document keys).</p>
        </div>
        <button
          className="btn"
          type="button"
          onClick={() => setOpen(true)}
          disabled={patients.length === 0}
        >
          + Add record
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="panel">
        <div className="panel-header">
          <h3>Clinical chart</h3>
          <button className="btn secondary" type="button" onClick={load}>
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty">No medical records yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Type</th>
                <th>Diagnosis / notes</th>
                <th>Provider</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{patientName(r.patientId)}</strong>
                  </td>
                  <td>
                    <span className="badge info">{r.type}</span>
                  </td>
                  <td>
                    <div>{r.diagnosis || '—'}</div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                      {(r.notes || '').slice(0, 80)}
                      {(r.notes || '').length > 80 ? '…' : ''}
                    </div>
                  </td>
                  <td>{r.providerName || '—'}</td>
                  <td>
                    <span className={`badge ${r.status === 'active' ? 'success' : 'warning'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'active' && (
                      <button className="btn danger" type="button" onClick={() => archive(r.id)}>
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title="Add medical record" onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Patient</label>
              <select
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {['consultation', 'lab', 'imaging', 'prescription', 'discharge', 'vaccination'].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="field">
                <label>Provider</label>
                <input
                  value={form.providerName}
                  onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                  placeholder="Dr. Turing"
                />
              </div>
            </div>
            <div className="field">
              <label>Diagnosis</label>
              <input
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Prescription</label>
              <input
                value={form.prescription}
                onChange={(e) => setForm({ ...form, prescription: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
