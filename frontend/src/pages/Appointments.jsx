import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const emptyForm = { patientId: '', doctorName: '', specialty: 'General', scheduledAt: '', reason: '', location: 'Main Clinic' };

export default function Appointments() {
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
      const [appts, pts] = await Promise.all([api.listAppointments(), api.listPatients()]);
      setItems(appts.data || []);
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
      await api.createAppointment({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() });
      setOpen(false);
      setForm(emptyForm);
      setSuccess('Appointment booked.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id) {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.cancelAppointment(id);
      setSuccess('Appointment cancelled.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Appointments</h2><p>Schedule visits via appointment-service.</p></div>
        <button className="btn" type="button" onClick={() => setOpen(true)} disabled={patients.length === 0}>+ Book appointment</button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}
      <div className="panel">
        <div className="panel-header"><h3>Schedule</h3><button className="btn secondary" type="button" onClick={load}>Refresh</button></div>
        {loading ? <div className="empty">Loading…</div> : items.length === 0 ? <div className="empty">No appointments.</div> : (
          <table>
            <thead><tr><th>Patient</th><th>Doctor</th><th>When</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td><strong>{patientName(a.patientId)}</strong></td>
                  <td>{a.doctorName}<div className="muted">{a.specialty}</div></td>
                  <td className="mono">{new Date(a.scheduledAt).toLocaleString()}</td>
                  <td><span className={`badge ${a.status === 'scheduled' ? 'success' : 'danger'}`}>{a.status}</span></td>
                  <td>{a.status === 'scheduled' && <button className="btn danger" type="button" onClick={() => cancel(a.id)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {open && (
        <Modal title="Book appointment" onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit}>
            <div className="field"><label>Patient</label>
              <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Select…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div className="field"><label>Doctor</label><input required value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} /></div>
            <div className="field"><label>Date & time</label><input required type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
            <div className="modal-actions">
              <button className="btn secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Booking…' : 'Book'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
