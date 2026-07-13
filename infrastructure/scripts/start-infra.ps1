# Start local PostgreSQL and Redis for development.
# Usage (from repo root, PowerShell):
#   .\infrastructure\scripts\start-infra.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")

Write-Host "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

Write-Host "Waiting for healthy services..."
do {
  Start-Sleep -Seconds 1
  $pg = docker compose exec -T postgres pg_isready -U postgres -d local_service_marketplace 2>$null
} while ($LASTEXITCODE -ne 0)

do {
  Start-Sleep -Seconds 1
  $redis = docker compose exec -T redis redis-cli ping 2>$null
} while ($LASTEXITCODE -ne 0)

Write-Host "Infrastructure is ready."
Write-Host "  PostgreSQL: localhost:5433"
Write-Host "  Redis:      localhost:6379"
