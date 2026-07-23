import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const emptyForm = { patientId: '', type: 'consultation', diagnosis: '', notes: '', providerName: '' };

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

  useEffect(() => { load(); }, []);

  function patientName(id) {
    const p = patients.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : id.slice(0, 8) + '…';
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
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

  return (
    <div>
      <div className="page-header">
        <div><h2>Medical records</h2><p>Clinical notes (records-service).</p></div>
        <button className="btn" type="button" onClick={() => setOpen(true)} disabled={patients.length === 0}>+ Add record</button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}
      <div className="panel">
        <div className="panel-header"><h3>Clinical chart</h3><button className="btn secondary" type="button" onClick={load}>Refresh</button></div>
        {loading ? <div className="empty">Loading…</div> : items.length === 0 ? <div className="empty">No records.</div> : (
          <table>
            <thead><tr><th>Patient</th><th>Type</th><th>Diagnosis</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td><strong>{patientName(r.patientId)}</strong></td>
                  <td><span className="badge info">{r.type}</span></td>
                  <td>{r.diagnosis || '—'}<div className="muted">{(r.notes || '').slice(0, 80)}</div></td>
                  <td><span className={`badge ${r.status === 'active' ? 'success' : 'warning'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {open && (
        <Modal title="Add medical record" onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit}>
            <div className="field"><label>Patient</label>
              <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Select…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div className="field"><label>Diagnosis</label><input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
            <div className="field"><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="modal-actions">
              <button className="btn secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
