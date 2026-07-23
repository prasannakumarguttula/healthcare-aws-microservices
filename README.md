# HealthCareHub — AWS Microservices Platform

A production-style **healthcare microservices** platform built on **AWS**.
Designed for DevOps / cloud portfolio demos: IaC, containers, CI/CD, and HIPAA-minded architecture patterns.

**Repo:** https://github.com/prasannakumarguttula/healthcare-aws-microservices

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Admin UI      │  React (port 3000)
                    │   CloudFront    │ (optional)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │  Cognito JWT authorizer
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌───────▼────┐  ┌──────▼───────┐
     │  Patient   │  │Appointment │  │   Records    │
     │  Service   │  │  Service   │  │   Service    │
     │ (ECS Fargate)│ │(ECS Fargate)│ │ (ECS Fargate)│
     └─────┬──────┘  └──────┬─────┘  └──────┬───────┘
           │                │               │
     ┌─────▼──────┐  ┌──────▼─────┐  ┌──────▼───────┐
     │ DynamoDB   │  │ DynamoDB   │  │ DynamoDB + S3│
     │ patients   │  │appointments│  │ medical docs │
     └────────────┘  └────────────┘  └──────────────┘
                             │
                    ┌────────▼────────┐
                    │ Notification    │ ← SNS / SES
                    │ Service (ECS)   │
                    └─────────────────┘
```

### Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| **patient-service** | 3001 | Patient registration, profile, demographics |
| **appointment-service** | 3002 | Book / reschedule / cancel appointments |
| **records-service** | 3003 | Clinical notes, prescriptions, document metadata |
| **notification-service** | 3004 | Email/SMS alerts via SNS (appointment reminders) |
| **api-gateway** (local) | 8080 | Reverse proxy / routing for local Docker |
| **frontend** (admin UI) | 3000 | React admin dashboard for staff demos |

### AWS Building Blocks

| Layer | Services |
|-------|----------|
| Compute | ECS Fargate, ECR |
| Networking | VPC, ALB, Security Groups, NAT |
| API | ALB path routing (+ Cognito ready) |
| Data | DynamoDB, S3 (PHI documents — encrypted) |
| Auth | Cognito User Pools |
| Messaging | SNS |
| Observability | CloudWatch Logs & Metrics |
| IaC | Terraform |
| CI/CD | GitHub Actions → ECR → ECS |

## Project Structure

```
healthcare-aws-microservices/
├── frontend/                # React admin UI (Vite)
├── services/
│   ├── patient-service/
│   ├── appointment-service/
│   ├── records-service/
│   └── notification-service/
├── gateway/                 # Local NGINX API gateway
├── infrastructure/
│   └── terraform/
│       ├── modules/
│       └── environments/
├── scripts/
├── docs/
├── docker-compose.yml
└── .github/workflows/
```

## Quick Start (Local)

### Prerequisites

- Docker Desktop / Podman
- Node.js 20+ (optional)
- AWS CLI + Terraform 1.5+ (for cloud deploy)

### Run everything locally

```bash
cd healthcare-aws-microservices
docker compose up --build
```

Open the **admin UI**: http://localhost:3000

| Endpoint | URL |
|----------|-----|
| **Admin UI** | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Patient API | http://localhost:8080/patients |
| Appointments | http://localhost:8080/appointments |
| Records | http://localhost:8080/records |
| Health | http://localhost:8080/health |

### Frontend only (hot reload)

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:5173 (proxies API to :8080)

### Sample API calls

```bash
curl -X POST http://localhost:8080/patients \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com","dateOfBirth":"1815-12-10","phone":"+1-555-0100"}'

curl http://localhost:8080/patients
```

## Deploy to AWS (dev)

```bash
aws configure
cd infrastructure/terraform/environments/dev
terraform init && terraform apply
# from repo root:
./scripts/deploy.sh dev   # or .\scripts\deploy.ps1 on Windows
```

See `docs/deploy-aws.md` for details.

## Security

Demo only — not for real PHI. See `docs/security.md`.

## Tech Stack

- **Backend:** Node.js 20, Express
- **Frontend:** React 18, Vite
- **Containers:** Docker multi-stage builds
- **Local:** Docker Compose + NGINX gateway
- **AWS:** ECS Fargate, ALB, ECR, DynamoDB, S3, Cognito, SNS
- **IaC:** Terraform
- **CI/CD:** GitHub Actions

## License

MIT — for learning and portfolio use.
