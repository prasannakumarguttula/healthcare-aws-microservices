# Initialize local git and push to GitHub (run once after cloning or from local copy)
# Usage: .\scripts\init-git-and-push.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Remote = "https://github.com/prasannakumarguttula/healthcare-aws-microservices.git"

if (-not (Test-Path .git)) {
  git init
  git branch -M main
}

git remote remove origin 2>$null
git remote add origin $Remote

git add .
git status
git commit -m "feat: HealthCareHub AWS microservices + React admin UI"
git pull origin main --allow-unrelated-histories --no-edit 2>$null
git push -u origin main

Write-Host "Pushed to $Remote"
