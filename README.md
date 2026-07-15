# Local Service Marketplace

Multi-tenant local service marketplace connecting customers and service providers. This repository is a **modular monolith** monorepo.

> **Phase 5** delivers Search & Discovery (Meilisearch indexing, full-text/geo/faceted search, autocomplete, popular searches, recently viewed, and customer discovery pages). Bookings and payments come next.

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
| Search       | Meilisearch                                         |
| Packages     | pnpm workspaces                                     |
| Infra        | Docker Compose, GitHub Actions                      |

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker Desktop (for PostgreSQL, Redis, and Meilisearch)

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

PostgreSQL, Redis, and Meilisearch (recommended for daily development):

```bash
# PowerShell
.\infrastructure\scripts\start-infra.ps1

# or
docker compose up -d postgres redis meilisearch
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

Defaults point at local Docker Postgres (`localhost:5433`) / Redis / Meilisearch (`localhost:7700`) and `http://localhost:3001`.

> Host port **5433** is used for PostgreSQL to avoid clashing with other local Postgres instances on `5432`. Inside Docker Compose the database still listens on `5432`.

### 4. Database migrate and seed

```bash
pnpm db:migrate
pnpm db:seed
```

Identity, tenancy, provider, catalog, and search models live in Prisma. Seed creates system roles, permissions (including `search.manage`), and a starter category tree.

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
- Discovery: `/`, `/search`, `/search/map`, `/category/[slug]`, `/service/[id]`, `/provider/[id]`
- Auth: `/login`, `/register`, `/account`
- Organization: `/organization/create`
- Provider workspace: `/provider/services`
- Search API: `/api/v1/search`, `/api/v1/search/autocomplete`, `/api/v1/search/popular`
- Admin reindex: `POST /api/v1/admin/search/reindex`

## Environment variables

### API (`apps/api/.env`)

| Variable                    | Purpose                               |
| --------------------------- | ------------------------------------- |
| `NODE_ENV`                  | `development` / `test` / `production` |
| `PORT`                      | API port (default `3001`)             |
| `DATABASE_URL`              | PostgreSQL connection string          |
| `REDIS_URL`                 | Redis connection string               |
| `CORS_ORIGINS`              | Comma-separated allowed origins       |
| `JWT_ACCESS_SECRET`         | Access token signing secret (≥32)     |
| `JWT_REFRESH_SECRET`        | Refresh token signing secret (≥32)    |
| `JWT_ACCESS_EXPIRES_IN`     | Access token TTL (default `15m`)      |
| `JWT_REFRESH_EXPIRES_IN`    | Refresh token TTL (default `7d`)      |
| `BCRYPT_SALT_ROUNDS`        | Password hash cost (default `12`)     |
| `PASSWORD_RESET_EXPIRES_IN` | Reset token TTL (default `1h`)        |
| `MEILISEARCH_HOST`          | Meilisearch URL (default localhost)   |
| `MEILISEARCH_API_KEY`       | Meilisearch API / master key          |

Placeholders for future providers (Stripe, AWS, Cloudinary) are documented in `.env.example`.

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
| `pnpm test`        | Run API + web tests                |
| `pnpm db:generate` | Generate Prisma client             |
| `pnpm db:migrate`  | Run Prisma migrate (dev)           |
| `pnpm db:seed`     | Seed roles and permissions         |
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
