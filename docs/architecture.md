# Architecture — Phase 1

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
- Central API client (`src/lib/api-client.ts`) with Bearer auth support
- Zod-validated public env (`src/lib/env.ts`)
- Auth route group `(auth)`: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected `/account` page (identity only)
- Middleware session cookie gate for `/account` and auth pages

### `apps/api` (NestJS)

- Global prefix `api` + URI versioning → `/api/v1/...`
- Config module with Zod env validation (including JWT secrets)
- Global validation pipe, exception filter, response interceptor
- Swagger at `/api/docs` with Bearer auth
- Prisma + Redis infrastructure modules
- Health endpoint: `GET /api/v1/health`
- **Identity module**: register, login, refresh, logout, me, forgot/reset password
- Global JWT + Roles + Permissions + Throttler guards

## Packages

| Package         | Role                                   |
| --------------- | -------------------------------------- |
| `shared-types`  | API response + auth identity contracts |
| `config`        | Base TypeScript configs                |
| `eslint-config` | Shared ESLint flat configs             |

## Data foundations

- **PostgreSQL** via Prisma — identity models: User, Role, Permission, UserRole, RolePermission, RefreshToken, PasswordResetToken, AuditLog
- **Redis** via `ioredis` — connectivity ready for future rate-limit/cache usage
- Seed creates roles (`CUSTOMER`, `PROVIDER`, `BUSINESS`, `ADMIN`) and permissions (`user.read`, `user.manage`)

## Identity & access

- Access JWT (short-lived) + refresh JWT (hashed at rest, rotated on refresh)
- Default registration role: `CUSTOMER`
- Password reset without email: non-production responses may include `resetToken`
- Audit log records auth and password-reset events

## Future domains (not implemented)

Users profiles, Providers, Services, Bookings, Payments, Reviews, Notifications, Search, Admin.

## Local development topology

1. `docker compose up -d postgres redis`
2. `pnpm db:migrate` / `pnpm db:seed` when schema changes
3. `pnpm dev:api` / `pnpm dev:web`
