# Architecture — Phase 1–5

## Modular monolith

The Local Service Marketplace is a modular monolith. Frontend and backend live in one repository with clear boundaries so domains can later be extracted if needed.

```
apps/web  →  HTTP  →  apps/api  →  PostgreSQL
                         ↓
                       Redis
                         ↓
                    Meilisearch (read index)
```

Shared packages contain **contracts and tooling only** — never business logic.

## Apps

### `apps/web` (Next.js App Router)

- Server Components by default
- Tailwind CSS + shadcn/ui primitives
- Central API client (`src/lib/api-client.ts`) with Bearer auth and optional `X-Tenant-Id`
- Discovery: `/`, `/search`, `/search/map`, `/category/[slug]`, `/service/[id]`, `/provider/[id]`
- Auth route group `(auth)` and provider workspace `(provider)`
- Middleware session cookie gate for protected routes

### `apps/api` (NestJS)

- Global prefix `api` + URI versioning → `/api/v1/...`
- Config with Zod env validation (JWT + Meilisearch)
- Prisma + Redis + Meilisearch
- Health: `GET /api/v1/health` (app, database, redis, meilisearch)
- Modules: Identity, Tenancy, Providers, Services, Search
- Domain events via `@nestjs/event-emitter` for search index sync
- Swagger at `/api/docs`

## Search domain

PostgreSQL is the source of truth. Meilisearch holds derived indexes (`services`, `providers`).

- Index only **PUBLISHED** services with active providers and categories
- Sync on publish/update/pause/archive, category updates, provider profile/verification changes
- Admin full reindex: `POST /api/v1/admin/search/reindex` (`search.manage`)
- Geo via `_geo` / `_geoRadius` / `_geoPoint`
- `SearchQueryStat` stores anonymous popular queries (no PII)
- `RecentlyViewedService` tracks authenticated views

### Search API

| Method | Path                              | Purpose                          |
| ------ | --------------------------------- | -------------------------------- |
| `GET`  | `/api/v1/search`                  | Full-text + filters + sort + geo |
| `GET`  | `/api/v1/search/categories/:slug` | Category browse                  |
| `GET`  | `/api/v1/search/providers`        | Provider search                  |
| `GET`  | `/api/v1/search/autocomplete`     | Suggestions                      |
| `GET`  | `/api/v1/search/popular`          | Popular queries                  |
| `GET`  | `/api/v1/search/recent`           | Recently viewed (auth)           |
| `POST` | `/api/v1/search/views/:serviceId` | Track view (auth)                |
| `GET`  | `/api/v1/search/services/:id`     | Public service detail            |
| `POST` | `/api/v1/admin/search/reindex`    | Rebuild indexes                  |

## Data models (search additions)

- `SearchQueryStat` — `normalizedQuery`, `displayQuery`, `count`, `lastSearchedAt`
- `RecentlyViewedService` — unique `(userId, serviceId)` with `viewedAt`

## Future domains (not yet implemented)

- Bookings & scheduling
- Payments / Stripe Connect
- Reviews & messaging
- Notifications
