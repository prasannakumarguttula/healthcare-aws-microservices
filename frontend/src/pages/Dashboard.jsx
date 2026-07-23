import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    records: 0,
    notifications: 0,
  });
  const [recentAppts, setRecentAppts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [patients, appointments, records, notifications] = await Promise.all([
          api.listPatients(),
          api.listAppointments(),
          api.listRecords(),
          api.listNotifications(),
        ]);
        if (!alive) return;
        setStats({
          patients: patients.count ?? patients.data?.length ?? 0,
          appointments: appointments.count ?? appointments.data?.length ?? 0,
          records: records.count ?? records.data?.length ?? 0,
          notifications: notifications.count ?? notifications.data?.length ?? 0,
        });
        setRecentAppts((appointments.data || []).slice(0, 5));
        setError('');
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Operations dashboard</h2>
          <p>Live view across patient, appointment, records, and notification services.</p>
        </div>
        <div className="toolbar">
          <Link className="btn secondary" to="/patients">
            Manage patients
          </Link>
          <Link className="btn" to="/appointments">
            Book appointment
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}. Is docker compose running?</div>}

      <div className="stats">
        <div className="stat-card">
          <div className="label">Patients</div>
          <div className="value">{loading ? '—' : stats.patients}</div>
        </div>
        <div className="stat-card">
          <div className="label">Appointments</div>
          <div className="value">{loading ? '—' : stats.appointments}</div>
        </div>
        <div className="stat-card">
          <div className="label">Medical records</div>
          <div className="value">{loading ? '—' : stats.records}</div>
        </div>
        <div className="stat-card">
          <div className="label">Notifications</div>
          <div className="value">{loading ? '—' : stats.notifications}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h3>Upcoming / recent appointments</h3>
          </div>
          {recentAppts.length === 0 ? (
            <div className="empty">No appointments yet. Create a patient, then book one.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>When</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.doctorName}</strong>
                      <div className="muted" style={{ fontSize: '0.82rem' }}>
                        {a.specialty}
                      </div>
                    </td>
                    <td className="mono">{new Date(a.scheduledAt).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${a.status === 'scheduled' ? 'success' : 'warning'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Architecture snapshot</h3>
          </div>
          <div className="list-card">
            <h4>Microservices</h4>
            <p className="muted">
              patient · appointment · records · notification on ECS Fargate (AWS) or Docker Compose (local)
            </p>
          </div>
          <div className="list-card">
            <h4>Data plane</h4>
            <p className="muted">DynamoDB tables per service · S3 for clinical documents · SNS for alerts</p>
          </div>
          <div className="list-card">
            <h4>Edge</h4>
            <p className="muted">ALB path routing in AWS · NGINX gateway locally · Cognito-ready auth</p>
          </div>
        </div>
      </div>
    </div>
  );
}
