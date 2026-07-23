# Security Checklist (HIPAA-minded demo)

This project is for **learning / portfolio**. Real healthcare workloads require a Business Associate Agreement (BAA) with AWS and a full compliance program.

## Controls represented in this architecture

| Control | How we address it |
|---------|-------------------|
| Encryption at rest | DynamoDB SSE, S3 SSE-S3 / KMS |
| Encryption in transit | TLS on ALB / API Gateway |
| Network isolation | Private subnets for ECS tasks |
| Identity | Cognito User Pools + IAM task roles |
| Least privilege | Per-service IAM policies |
| Audit | CloudWatch Logs, optional CloudTrail |
| Data minimization | Soft-delete / archive; no PHI in app logs (aim) |

## Do not do in production demos with real data

- Store real patient PHI
- Commit AWS keys
- Open security groups to `0.0.0.0/0` on data planes
- Log full request bodies containing medical notes

## Recommended hardening next steps

1. WAF on API Gateway / ALB
2. AWS KMS CMKs for DynamoDB and S3
3. VPC endpoints for DynamoDB, S3, ECR, Logs
4. GuardDuty + Security Hub
5. Secrets Manager for any third-party API keys
6. MFA for Cognito clinical users
