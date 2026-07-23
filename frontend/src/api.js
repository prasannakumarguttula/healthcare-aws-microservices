const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && data.error) ||
      (data && data.details && data.details.join(', ')) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Prefer /api/health so SPA nginx never returns index.html as "ok"
  health: () => request('/api/health').catch(() => request('/health')),


  listPatients: () => request('/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (body) =>
    request('/patients', { method: 'POST', body: JSON.stringify(body) }),
  updatePatient: (id, body) =>
    request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  listAppointments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/appointments${q ? `?${q}` : ''}`);
  },
  createAppointment: (body) =>
    request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateAppointment: (id, body) =>
    request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  cancelAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),

  listRecords: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/records${q ? `?${q}` : ''}`);
  },
  createRecord: (body) =>
    request('/records', { method: 'POST', body: JSON.stringify(body) }),
  archiveRecord: (id) => request(`/records/${id}`, { method: 'DELETE' }),

  listNotifications: () => request('/notifications?limit=50'),
};
