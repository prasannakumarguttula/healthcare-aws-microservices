# Deploy HealthCareHub to AWS

## Prerequisites

1. AWS account + IAM user/role with rights for VPC, ECS, ECR, DynamoDB, S3, Cognito, IAM, SNS, ALB
2. AWS CLI configured (`aws configure`)
3. Terraform >= 1.5
4. Docker

## Step 1 — Infrastructure

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

Save outputs:

```bash
terraform output
```

## Step 2 — Push container images

From repo root (Linux/macOS):

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh dev
```

Windows PowerShell:

```powershell
.\scripts\deploy.ps1 -Environment dev
```

## Step 3 — Verify

```bash
API=$(terraform -chdir=infrastructure/terraform/environments/dev output -raw api_base_url)
curl "$API/patients"
```

## Cost note (dev)

Expect low single-digit USD/day when idle if you:

- Use `desired_count = 1` and small Fargate tasks (256 CPU / 512 MB)
- NAT Gateway is the main idle cost — destroy when not demoing:

```bash
terraform destroy
```

## GitHub Actions

Add repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Push to `main` builds images and force-deploys ECS (after Terraform has created the cluster once).
