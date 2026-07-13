# Architecture — Phase 0

## Modular monolith

The Local Service Marketplace is a modular monolith. Frontend and backend live in one repository with clear boundaries so domains can later be extracted if needed.

```
apps/web  →  HTTP  →  apps/api  →  PostgreSQL
                         ↓
                       Redis
```

Shared packages contain **contracts and tooling only** — never business logic.

## Apps

### `apps/web` (Next.js App Router)

- Server Components by default
- Tailwind CSS + shadcn/ui primitives
- Central API client (`src/lib/api-client.ts`)
- Zod-validated public env (`src/lib/env.ts`)
- Route group stubs for future `(auth)`, `(dashboard)`, `(provider)`, `(admin)`

### `apps/api` (NestJS)

- Global prefix `api` + URI versioning → `/api/v1/...`
- Config module with Zod env validation
- Global validation pipe, exception filter, response interceptor
- Swagger at `/api/docs`
- Prisma (`infrastructure/database`) and Redis (`infrastructure/redis`) abstractions
- Health endpoint: `GET /api/v1/health`
- Empty module folders for future domains under `src/modules/`

## Packages

| Package         | Role                                 |
| --------------- | ------------------------------------ |
| `shared-types`  | API response / health contract types |
| `config`        | Base TypeScript configs              |
| `eslint-config` | Shared ESLint flat configs           |

## Data foundations

- **PostgreSQL** via Prisma — schema exists with **no marketplace models** in Phase 0
- **Redis** via `ioredis` — connection + ping only (no cache/queue logic yet)

## Future domains (not implemented)

Identity, Users, Providers, Services, Bookings, Payments, Reviews, Notifications, Search, Admin.

## Local development topology

Recommended daily flow:

1. `docker compose up -d postgres redis`
2. `pnpm dev:api` / `pnpm dev:web`

Optional: `docker compose --profile full up --build` runs api + web containers as well.
