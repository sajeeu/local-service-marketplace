# Architecture — Phase 1 + Phase 2

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
- Central API client (`src/lib/api-client.ts`) with Bearer auth and optional `X-Tenant-Id`
- Zod-validated public env (`src/lib/env.ts`)
- Auth route group `(auth)`: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected `/account` page (identity + tenant selector)
- Protected `/organization/create` for business organization upgrade
- Tenant provider / selector / organization form foundation
- Middleware session cookie gate for `/account`, `/organization/*`, and auth pages

### `apps/api` (NestJS)

- Global prefix `api` + URI versioning → `/api/v1/...`
- Config module with Zod env validation (including JWT secrets)
- Global validation pipe, exception filter, response interceptor
- Swagger at `/api/docs` with Bearer auth
- Prisma + Redis infrastructure modules
- Health endpoint: `GET /api/v1/health`
- **Identity module**: register (account types), login, refresh, logout, me, forgot/reset password
- **Tenancy module**: tenants list/current/switch, organization create, TenantGuard
- Global JWT + Roles + Permissions + Throttler guards

## Packages

| Package         | Role                                    |
| --------------- | --------------------------------------- |
| `shared-types`  | API response + auth + tenancy contracts |
| `config`        | Base TypeScript configs                 |
| `eslint-config` | Shared ESLint flat configs              |

## Data foundations

- **PostgreSQL** via Prisma — identity + tenancy models:
  - Identity: User, Role, Permission, UserRole, RolePermission, RefreshToken, PasswordResetToken, AuditLog
  - Tenancy: Tenant, Organization, Membership (`User.activeTenantId`)
- **Redis** via `ioredis` — connectivity ready for future rate-limit/cache usage
- Seed creates roles (`CUSTOMER`, `PROVIDER`, `BUSINESS`, `ADMIN`) and permissions including tenant/organization codes

## Identity & access

- Access JWT (short-lived, includes optional `tid` active tenant claim) + refresh JWT (hashed at rest, rotated on refresh)
- Registration `accountType`: `CUSTOMER` | `PROVIDER` | `BUSINESS`
  - Customer/Provider → individual tenant + OWNER membership
  - Business → business tenant + organization + OWNER membership
- Active tenant resolved server-side: `X-Tenant-Id` header → JWT `tid` → `User.activeTenantId` (membership always validated)
- Password reset without email: non-production responses may include `resetToken`
- Audit log records auth, tenant, organization, and membership events

## Tenancy API

| Method | Path                      | Purpose                                  |
| ------ | ------------------------- | ---------------------------------------- |
| `GET`  | `/api/v1/tenants`         | List memberships                         |
| `GET`  | `/api/v1/tenants/current` | Active tenant context                    |
| `POST` | `/api/v1/tenants/switch`  | Switch active tenant                     |
| `POST` | `/api/v1/organizations`   | Create owned business org (one per user) |

## Future domains (not implemented)

Provider profiles, Staff invitations, Services, Bookings, Payments, Reviews, Notifications, Search, Admin dashboards.

## Local development topology

1. `docker compose up -d postgres redis`
2. `pnpm db:migrate` / `pnpm db:seed` when schema changes
3. `pnpm dev:api` / `pnpm dev:web`
