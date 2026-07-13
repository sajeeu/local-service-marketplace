#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

echo "Waiting for healthy services..."
until docker compose exec -T postgres pg_isready -U postgres -d local_service_marketplace >/dev/null 2>&1; do
  sleep 1
done
until docker compose exec -T redis redis-cli ping >/dev/null 2>&1; do
  sleep 1
done

echo "Infrastructure is ready."
echo "  PostgreSQL: localhost:5433"
echo "  Redis:      localhost:6379"
