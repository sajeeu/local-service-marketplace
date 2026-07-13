# Local Service Marketplace

Multi-tenant local service marketplace connecting customers and service providers. This repository is a **modular monolith** monorepo.

> **Phase 0** establishes project foundation only — no marketplace domain features yet.

## Architecture

```
/
├── apps/
│   ├── web/          # Next.js (App Router) frontend
│   └── api/          # NestJS backend + Prisma + Redis
├── packages/
│   ├── shared-types/ # Shared API contracts / types
│   ├── config/       # Shared TypeScript configs
│   └── eslint-config/# Shared ESLint configs
├── infrastructure/
│   ├── docker/       # Dockerfiles
│   └── scripts/      # Local infra helpers
├── docs/
└── .github/workflows/
```

## Technology stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Frontend     | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend      | NestJS, TypeScript, Prisma                          |
| Database     | PostgreSQL                                          |
| Cache / jobs | Redis                                               |
| Packages     | pnpm workspaces                                     |
| Infra        | Docker Compose, GitHub Actions                      |

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker Desktop (for PostgreSQL and Redis)

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

PostgreSQL and Redis only (recommended for daily development):

```bash
# PowerShell
.\infrastructure\scripts\start-infra.ps1

# or
docker compose up -d postgres redis
```

Full stack in Docker (optional):

```bash
docker compose --profile full up --build
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Defaults point at local Docker Postgres (`localhost:5433`) / Redis and `http://localhost:3001`.

> Host port **5433** is used for PostgreSQL to avoid clashing with other local Postgres instances on `5432`. Inside Docker Compose the database still listens on `5432`.

### 4. Generate Prisma client

```bash
pnpm db:generate
```

> Phase 0 has no marketplace models. Migrations will be introduced when domain schemas are added.

### 5. Run applications

```bash
# Both apps
pnpm dev

# Or separately
pnpm dev:api   # http://localhost:3001
pnpm dev:web   # http://localhost:3000
```

- API health: `http://localhost:3001/api/v1/health`
- Swagger: `http://localhost:3001/api/docs`
- Web: `http://localhost:3000`

## Environment variables

### API (`apps/api/.env`)

| Variable       | Purpose                               |
| -------------- | ------------------------------------- |
| `NODE_ENV`     | `development` / `test` / `production` |
| `PORT`         | API port (default `3001`)             |
| `DATABASE_URL` | PostgreSQL connection string          |
| `REDIS_URL`    | Redis connection string               |
| `CORS_ORIGINS` | Comma-separated allowed origins       |

Placeholders for future providers (JWT, Stripe, AWS, Cloudinary, Meilisearch) are documented in `.env.example`.

### Web (`apps/web/.env.local`)

| Variable              | Purpose                          |
| --------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL` | API base URL including `/api/v1` |

## Development commands

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm install`     | Install all workspace dependencies |
| `pnpm dev`         | Run web + api in parallel          |
| `pnpm build`       | Build shared types, api, and web   |
| `pnpm lint`        | Lint apps and packages             |
| `pnpm format`      | Format with Prettier               |
| `pnpm typecheck`   | TypeScript checks                  |
| `pnpm test`        | Run tests (placeholder-ready)      |
| `pnpm db:generate` | Generate Prisma client             |
| `pnpm db:migrate`  | Run Prisma migrate (dev)           |
| `pnpm db:studio`   | Open Prisma Studio                 |

## Code quality

- ESLint (shared package configs)
- Prettier
- Husky + lint-staged (pre-commit)

## CI/CD

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — lint, typecheck, test, build on PRs and `main`
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — deployment placeholder (no live deploy yet)

## Documentation

- [Architecture notes](docs/architecture.md)

## Security notes

- Never commit real secrets — use `.env` files locally and secret managers in production
- Environment variables are validated at API startup
- Errors returned to clients are sanitized; details stay in server logs
