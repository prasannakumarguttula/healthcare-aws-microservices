# Architecture — HealthCareHub

## Goals

- Demonstrate **microservices** decomposition for a healthcare domain
- Deploy on **AWS** with production-like networking and managed services
- Keep local developer experience simple via **Docker Compose**
- Use **Infrastructure as Code** (Terraform) for repeatable environments

## Domain Services

### Patient Service
Owns patient master data: demographics, contact info, MRN-style IDs.  
Other services reference `patientId` but do not own patient records.

### Appointment Service
Owns scheduling lifecycle: book, reschedule, cancel, list by patient/doctor.  
Calls Patient Service for existence checks and Notification Service after booking.

### Records Service
Owns clinical documentation metadata and links to document storage (S3).  
Never returns raw PHI blobs without authorization checks (demo: basic checks).

### Notification Service
Decouples messaging (appointment reminders, record updates).  
Locally logs notifications; in AWS publishes to SNS (and optionally SES/SMS).

## Communication Patterns

| Pattern | Usage |
|---------|--------|
| Sync HTTP | Service-to-service validation (appointment → patient) |
| Async SNS | Notifications after domain events |
| API Gateway | External client entry + auth |

## Data Strategy

- **DynamoDB** single-table or per-service tables (this project uses one table per service)
- **S3** for document objects (encrypted, private)
- Local mode uses in-memory Maps for zero-dependency demos

## Network Topology (AWS)

```
Internet → ALB (public) → ECS tasks (private subnets)
                         → NAT for outbound (ECR, SNS, etc.)
DynamoDB / S3 / Cognito via VPC endpoints or public AWS endpoints + SG rules
```

## Deployment Flow

1. GitHub Actions builds Docker images
2. Pushes to ECR
3. Terraform (or deploy script) updates ECS task definitions
4. ECS rolling deploy with health checks
