import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  phone: '',
  bloodType: '',
  allergies: '',
};

export default function Patients() {
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
      const res = await api.listPatients();
      setPatients(res.data || []);
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

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.createPatient({
        ...form,
        allergies: form.allergies
          ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });
      setOpen(false);
      setForm(emptyForm);
      setSuccess('Patient registered successfully.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id) {
    if (!confirm('Deactivate this patient?')) return;
    try {
      await api.deletePatient(id);
      setSuccess('Patient deactivated.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Patients</h2>
          <p>Register and manage patient master data (patient-service).</p>
        </div>
        <button className="btn" type="button" onClick={() => setOpen(true)}>
          + Register patient
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="panel">
        <div className="panel-header">
          <h3>Patient directory</h3>
          <button className="btn secondary" type="button" onClick={load}>
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="empty">Loading…</div>
        ) : patients.length === 0 ? (
          <div className="empty">No patients yet. Register the first patient to begin.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>MRN</th>
                <th>Contact</th>
                <th>DOB</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>
                      {p.firstName} {p.lastName}
                    </strong>
                    {p.bloodType && (
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        Blood {p.bloodType}
                      </div>
                    )}
                  </td>
                  <td className="mono">{p.mrn}</td>
                  <td>
                    <div>{p.email}</div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      {p.phone || '—'}
                    </div>
                  </td>
                  <td>{p.dateOfBirth}</td>
                  <td>
                    <span className={`badge ${p.status === 'active' ? 'success' : 'danger'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {p.status === 'active' && (
                      <button className="btn danger" type="button" onClick={() => deactivate(p.id)}>
                        Deactivate
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
        <Modal title="Register patient" onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit}>
            <div className="field-row">
              <div className="field">
                <label>First name</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Last name</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Date of birth</label>
                <input
                  required
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Blood type</label>
                <select
                  value={form.bloodType}
                  onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                >
                  <option value="">—</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Allergies (comma-separated)</label>
                <input
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  placeholder="penicillin, latex"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Register'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
