# Admin UI (React)

The **HealthCareHub Admin** dashboard lives in `frontend/` and is built with **Vite + React**.

## Screens

| Page | Purpose |
|------|---------|
| Dashboard | Counts + recent appointments + architecture snapshot |
| Patients | Register / list / deactivate patients |
| Appointments | Book / cancel; triggers notification-service |
| Medical Records | Create / archive clinical notes |
| Notifications | Live event feed from notification-service |

## How it talks to APIs

- Browser calls same-origin paths: `/patients`, `/appointments`, `/records`, `/notifications`
- **Docker**: frontend NGINX proxies those paths → `api-gateway`
- **Vite dev**: `vite.config.js` proxies to `http://localhost:8080`

## Run options

### Full stack (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000

### Hot reload UI only

```bash
# terminal 1
docker compose up patient-service appointment-service records-service notification-service api-gateway

# terminal 2
cd frontend && npm install && npm run dev
```

Open http://localhost:5173
