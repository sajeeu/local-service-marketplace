# Start local PostgreSQL, Redis, and Meilisearch for development.
# Usage (from repo root, PowerShell):
#   .\infrastructure\scripts\start-infra.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")

Write-Host "Starting PostgreSQL, Redis, and Meilisearch..."
docker compose up -d postgres redis meilisearch

Write-Host "Waiting for healthy services..."
do {
  Start-Sleep -Seconds 1
  $pg = docker compose exec -T postgres pg_isready -U postgres -d local_service_marketplace 2>$null
} while ($LASTEXITCODE -ne 0)

do {
  Start-Sleep -Seconds 1
  $redis = docker compose exec -T redis redis-cli ping 2>$null
} while ($LASTEXITCODE -ne 0)

do {
  Start-Sleep -Seconds 1
  try {
    $meili = Invoke-WebRequest -Uri "http://localhost:7700/health" -UseBasicParsing -TimeoutSec 2
    $meiliOk = $meili.StatusCode -eq 200
  } catch {
    $meiliOk = $false
  }
} while (-not $meiliOk)

Write-Host "Infrastructure is ready."
Write-Host "  PostgreSQL:   localhost:5433"
Write-Host "  Redis:        localhost:6379"
Write-Host "  Meilisearch:  localhost:7700"
