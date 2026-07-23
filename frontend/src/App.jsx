import { NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Records from './pages/Records';
import Notifications from './pages/Notifications';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/patients', label: 'Patients' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/records', label: 'Medical Records' },
  { to: '/notifications', label: 'Notifications' },
];

export default function App() {
  const [apiOk, setApiOk] = useState(null);

  useEffect(() => {
    let alive = true;
    const ping = () =>
      api.health().then(() => alive && setApiOk(true)).catch(() => alive && setApiOk(false));
    ping();
    const id = setInterval(ping, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">H+</div>
          <div>
            <h1>HealthCareHub</h1>
            <p>AWS Microservices Admin</p>
          </div>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>
            <span className={`status-dot ${apiOk ? 'ok' : 'bad'}`} />
            API {apiOk === null ? 'checking…' : apiOk ? 'online' : 'offline'}
          </div>
          <div style={{ marginTop: '0.4rem' }}>Local gateway :8080 · UI :3000</div>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/records" element={<Records />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </main>
    </div>
  );
}
