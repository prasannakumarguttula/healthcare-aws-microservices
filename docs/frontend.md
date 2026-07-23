# Admin UI (React)

The **HealthCareHub Admin** dashboard lives in `frontend/` (Vite + React).

## Screens

| Page | Purpose |
|------|---------|
| Dashboard | Counts + recent appointments |
| Patients | Register / list / deactivate |
| Appointments | Book / cancel (+ notifications) |
| Medical Records | Create / archive notes |
| Notifications | Live event feed |

## Run

```bash
docker compose up --build
# open http://localhost:3000
```

Hot reload:

```bash
cd frontend && npm install && npm run dev
```
