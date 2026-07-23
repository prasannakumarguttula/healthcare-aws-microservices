# Push full local tree to GitHub
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$Remote = "https://github.com/prasannakumarguttula/healthcare-aws-microservices.git"
if (-not (Test-Path .git)) { git init; git branch -M main }
git remote remove origin 2>$null
git remote add origin $Remote
git add .
git commit -m "feat: HealthCareHub AWS microservices + React admin UI" 2>$null
git pull origin main --allow-unrelated-histories --no-edit 2>$null
git push -u origin main
Write-Host "Pushed to $Remote"
