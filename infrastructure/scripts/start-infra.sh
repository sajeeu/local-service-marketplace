#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Starting PostgreSQL, Redis, and Meilisearch..."
docker compose up -d postgres redis meilisearch

echo "Waiting for healthy services..."
until docker compose exec -T postgres pg_isready -U postgres -d local_service_marketplace >/dev/null 2>&1; do
  sleep 1
done
until docker compose exec -T redis redis-cli ping >/dev/null 2>&1; do
  sleep 1
done
until curl -fsS http://localhost:7700/health >/dev/null 2>&1; do
  sleep 1
done

echo "Infrastructure is ready."
echo "  PostgreSQL:   localhost:5433"
echo "  Redis:        localhost:6379"
echo "  Meilisearch:  localhost:7700"
