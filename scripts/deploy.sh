#!/usr/bin/env bash
# Build, push to ECR, and force ECS deployment for all microservices.
set -euo pipefail

ENVIRONMENT="${1:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT="${PROJECT_NAME:-healthcare-hub}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/infrastructure/terraform/environments/${ENVIRONMENT}"

SERVICES=(patient-service appointment-service records-service notification-service)

echo "==> Deploying HealthCareHub (${ENVIRONMENT}) in ${AWS_REGION}"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_BASE}"

if [[ -d "${TF_DIR}" ]]; then
  SNS_TOPIC_ARN="$(terraform -chdir="${TF_DIR}" output -raw sns_topic_arn 2>/dev/null || true)"
  PATIENTS_TABLE="$(terraform -chdir="${TF_DIR}" output -raw patients_table 2>/dev/null || true)"
  APPOINTMENTS_TABLE="$(terraform -chdir="${TF_DIR}" output -raw appointments_table 2>/dev/null || true)"
  RECORDS_TABLE="$(terraform -chdir="${TF_DIR}" output -raw records_table 2>/dev/null || true)"
  RECORDS_BUCKET="$(terraform -chdir="${TF_DIR}" output -raw records_bucket 2>/dev/null || true)"
  CLUSTER="$(terraform -chdir="${TF_DIR}" output -raw ecs_cluster_name 2>/dev/null || true)"
fi

for SVC in "${SERVICES[@]}"; do
  REPO="${PROJECT}/${ENVIRONMENT}/${SVC}"
  IMAGE="${ECR_BASE}/${REPO}:latest"
  echo "==> Building ${SVC} -> ${IMAGE}"
  docker build -t "${IMAGE}" "${ROOT_DIR}/services/${SVC}"
  docker push "${IMAGE}"
done

if [[ -n "${CLUSTER:-}" ]]; then
  for SVC in "${SERVICES[@]}"; do
    echo "==> Forcing new deployment: ${SVC}"
    aws ecs update-service \
      --cluster "${CLUSTER}" \
      --service "${SVC}" \
      --force-new-deployment \
      --region "${AWS_REGION}" \
      --no-cli-pager >/dev/null
  done
  echo "==> ECS services updating. ALB:"
  terraform -chdir="${TF_DIR}" output -raw api_base_url || true
else
  echo "==> Images pushed. Run terraform apply first if ECS is not yet created."
fi

echo "==> Done"
