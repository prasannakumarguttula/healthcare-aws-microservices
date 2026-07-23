import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, appointments: 0, records: 0, notifications: 0 });
  const [recentAppts, setRecentAppts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [patients, appointments, records, notifications] = await Promise.all([
          api.listPatients(), api.listAppointments(), api.listRecords(), api.listNotifications(),
        ]);
        if (!alive) return;
        setStats({
          patients: patients.count ?? 0,
          appointments: appointments.count ?? 0,
          records: records.count ?? 0,
          notifications: notifications.count ?? 0,
        });
        setRecentAppts((appointments.data || []).slice(0, 5));
        setError('');
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Operations dashboard</h2>
          <p>Live view across patient, appointment, records, and notification services.</p>
        </div>
        <div className="toolbar">
          <Link className="btn secondary" to="/patients">Manage patients</Link>
          <Link className="btn" to="/appointments">Book appointment</Link>
        </div>
      </div>
      {error && <div className="error-banner">{error}. Is docker compose running?</div>}
      <div className="stats">
        {[['Patients', stats.patients], ['Appointments', stats.appointments], ['Medical records', stats.records], ['Notifications', stats.notifications]].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <div className="label">{label}</div>
            <div className="value">{loading ? '—' : value}</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-header"><h3>Recent appointments</h3></div>
        {recentAppts.length === 0 ? (
          <div className="empty">No appointments yet.</div>
        ) : (
          <table>
            <thead><tr><th>Doctor</th><th>When</th><th>Status</th></tr></thead>
            <tbody>
              {recentAppts.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.doctorName}</strong><div className="muted">{a.specialty}</div></td>
                  <td className="mono">{new Date(a.scheduledAt).toLocaleString()}</td>
                  <td><span className={`badge ${a.status === 'scheduled' ? 'success' : 'warning'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
