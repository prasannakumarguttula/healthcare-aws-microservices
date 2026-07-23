# Build, push to ECR, and force ECS deployment (Windows PowerShell)
param(
  [string]$Environment = "dev",
  [string]$AwsRegion = $env:AWS_REGION
)

if (-not $AwsRegion) { $AwsRegion = "us-east-1" }
$Project = if ($env:PROJECT_NAME) { $env:PROJECT_NAME } else { "healthcare-hub" }
$Root = Split-Path -Parent $PSScriptRoot
$TfDir = Join-Path $Root "infrastructure\terraform\environments\$Environment"
$Services = @("patient-service", "appointment-service", "records-service", "notification-service")

Write-Host "==> Deploying HealthCareHub ($Environment) in $AwsRegion"

$AccountId = aws sts get-caller-identity --query Account --output text
$EcrBase = "$AccountId.dkr.ecr.$AwsRegion.amazonaws.com"

Write-Host "==> Logging in to ECR"
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $EcrBase

foreach ($Svc in $Services) {
  $Repo = "$Project/$Environment/$Svc"
  $Image = "${EcrBase}/${Repo}:latest"
  Write-Host "==> Building $Svc -> $Image"
  docker build -t $Image (Join-Path $Root "services\$Svc")
  docker push $Image
}

if (Test-Path $TfDir) {
  $Cluster = terraform -chdir=$TfDir output -raw ecs_cluster_name 2>$null
  if ($Cluster) {
    foreach ($Svc in $Services) {
      Write-Host "==> Forcing new deployment: $Svc"
      aws ecs update-service --cluster $Cluster --service $Svc --force-new-deployment --region $AwsRegion --no-cli-pager | Out-Null
    }
    Write-Host "==> API base URL:"
    terraform -chdir=$TfDir output -raw api_base_url
  }
}

Write-Host "==> Done"
