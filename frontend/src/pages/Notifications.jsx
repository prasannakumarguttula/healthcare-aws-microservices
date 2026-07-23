import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await api.listNotifications();
      setItems(res.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p>Event feed from notification-service (local log or AWS SNS).</p>
        </div>
        <button className="btn secondary" type="button" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <h3>Recent events</h3>
          <span className="muted">Auto-refresh every 10s</span>
        </div>
        {loading && items.length === 0 ? (
          <div className="empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty">
            No notifications yet. Book or cancel an appointment to generate events.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Channel</th>
                <th>Subject / message</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id}>
                  <td>
                    <span className="badge info">{n.type}</span>
                  </td>
                  <td>{n.channel}</td>
                  <td>
                    <strong>{n.subject}</strong>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                      {n.message}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${n.status === 'logged' || n.status === 'published' ? 'success' : 'warning'}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="mono">{new Date(n.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
