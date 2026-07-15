# Architecture — Phase 1 + Phase 2 + Phase 3 + Phase 4

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
- Provider workspace `(provider)`: `/provider/onboarding`, `/provider/profile`, `/provider/profile/edit`, `/provider/availability`, `/provider/services`
- Tenant provider / selector / organization form foundation
- Middleware session cookie gate for `/account`, `/organization/*`, `/provider/*`, and auth pages

### `apps/api` (NestJS)

- Global prefix `api` + URI versioning → `/api/v1/...`
- Config module with Zod env validation (including JWT secrets)
- Global validation pipe, exception filter, response interceptor
- Swagger at `/api/docs` with Bearer auth
- Prisma + Redis infrastructure modules
- Health endpoint: `GET /api/v1/health`
- **Identity module**: register (account types), login, refresh, logout, me, forgot/reset password
- **Tenancy module**: tenants list/current/switch, organization create, TenantGuard
- **Providers module**: profiles, availability, verification submit/review, public profiles
- **Services module**: categories, service CRUD, draft/publish workflow, media/tags/locations/FAQs/requirements
- Global JWT + Roles + Permissions + Throttler guards
- Shared **StorageModule** (`STORAGE_PORT`) for future Cloudinary / S3 adapters

## Packages

| Package         | Role                                                         |
| --------------- | ------------------------------------------------------------ |
| `shared-types`  | API response + auth + tenancy + provider + service contracts |
| `config`        | Base TypeScript configs                                      |
| `eslint-config` | Shared ESLint flat configs                                   |

## Data foundations

- **PostgreSQL** via Prisma — identity, tenancy, provider, and service catalog models:
  - Identity: User, Role, Permission, UserRole, RolePermission, RefreshToken, PasswordResetToken, AuditLog
  - Tenancy: Tenant, Organization, Membership (`User.activeTenantId`)
  - Providers: Provider, ProviderQualification, ProviderCertification, ProviderLanguage, ProviderAvailability, ProviderVerification
  - Services: Category, Service, ServiceMedia, ServiceTag, ServiceLocation, ServiceFaq, ServiceRequirement
- **Redis** via `ioredis` — connectivity ready for future rate-limit/cache usage
- Seed creates roles, permissions (including `service.*` / `category.*`), and a starter category tree

### Provider domain notes

- A **Provider** is not a user account. Users authenticate; providers perform work.
- One provider profile per `(userId, tenantId)`:
  - Independent provider → individual tenant
  - Business-employed provider → business tenant
- Verification statuses: `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`
- Metrics (`averageRating`, `completedJobs`, etc.) are stored for future booking/review phases
- Media fields store URLs; `StoragePort` abstracts future S3/Cloudinary uploads

### Service catalog notes

- Each **Service** belongs to exactly one **Provider**
- Status workflow: `DRAFT` → `PUBLISHED` → `PAUSED` / `ARCHIVED`
- Only **VERIFIED** providers may publish; unverified providers may save drafts
- Pricing models: `FIXED`, `HOURLY`, `DAILY`, `QUOTE_REQUIRED`
- Categories support unlimited nesting via `parentId`
- Slugs are SEO-friendly and unique per provider; regenerated on title change only while draft/paused
- Nested resources: media, tags, locations, FAQs, customer requirements
- Search / Meilisearch indexing is intentionally deferred

## Identity & access

- Access JWT (short-lived, includes optional `tid` active tenant claim) + refresh JWT (hashed at rest, rotated on refresh)
- Registration `accountType`: `CUSTOMER` | `PROVIDER` | `BUSINESS`
  - Customer/Provider → individual tenant + OWNER membership
  - Business → business tenant + organization + OWNER membership
- Active tenant resolved server-side: `X-Tenant-Id` header → JWT `tid` → `User.activeTenantId` (membership always validated)
- Provider permissions: `provider.read`, `provider.manage`, `provider.verification.submit`, `provider.verification.review` (admin)
- Service permissions: `service.read`, `service.manage`, `category.read`, `category.manage` (admin)
- Password reset without email: non-production responses may include `resetToken`
- Audit log records auth, tenant, organization, membership, provider, and service events

## Tenancy API

| Method | Path                      | Purpose                                  |
| ------ | ------------------------- | ---------------------------------------- |
| `GET`  | `/api/v1/tenants`         | List memberships                         |
| `GET`  | `/api/v1/tenants/current` | Active tenant context                    |
| `POST` | `/api/v1/tenants/switch`  | Switch active tenant                     |
| `POST` | `/api/v1/organizations`   | Create owned business org (one per user) |

## Provider API

| Method   | Path                                       | Purpose                                         |
| -------- | ------------------------------------------ | ----------------------------------------------- |
| `GET`    | `/api/v1/providers/me`                     | Ensure/get private profile (active tenant)      |
| `PATCH`  | `/api/v1/providers/me`                     | Update own profile + professional data          |
| `GET`    | `/api/v1/providers`                        | List providers in active tenant                 |
| `PATCH`  | `/api/v1/providers/:id`                    | Update provider (self / business admin / admin) |
| `GET`    | `/api/v1/providers/:id`                    | Public profile (no private fields)              |
| `GET`    | `/api/v1/providers/me/availability`        | List weekly availability                        |
| `POST`   | `/api/v1/providers/me/availability`        | Create availability slot                        |
| `PATCH`  | `/api/v1/providers/me/availability/:id`    | Update availability slot                        |
| `DELETE` | `/api/v1/providers/me/availability/:id`    | Delete availability slot                        |
| `POST`   | `/api/v1/providers/me/verification`        | Submit verification document metadata           |
| `PATCH`  | `/api/v1/admin/providers/:id/verification` | Admin approve / reject / suspend                |

## Service Catalog API

| Method   | Path                                    | Purpose                                       |
| -------- | --------------------------------------- | --------------------------------------------- |
| `GET`    | `/api/v1/categories`                    | List active categories (public)               |
| `GET`    | `/api/v1/categories/tree`               | Active category tree (public)                 |
| `POST`   | `/api/v1/admin/categories`              | Create category (admin)                       |
| `PATCH`  | `/api/v1/admin/categories/:id`          | Update category (admin)                       |
| `DELETE` | `/api/v1/admin/categories/:id`          | Delete empty category (admin)                 |
| `POST`   | `/api/v1/services`                      | Create draft service                          |
| `GET`    | `/api/v1/services/me`                   | List managed services                         |
| `GET`    | `/api/v1/services/:id`                  | Get managed service                           |
| `PATCH`  | `/api/v1/services/:id`                  | Update service                                |
| `DELETE` | `/api/v1/services/:id`                  | Delete non-published service                  |
| `PATCH`  | `/api/v1/services/:id/publish`          | Publish (verified provider + required fields) |
| `PATCH`  | `/api/v1/services/:id/pause`            | Pause published service                       |
| `PATCH`  | `/api/v1/services/:id/archive`          | Archive service                               |
| `POST`   | `/api/v1/services/:id/media`            | Add media                                     |
| `PATCH`  | `/api/v1/services/:id/media/:mediaId`   | Update media                                  |
| `DELETE` | `/api/v1/services/:id/media/:mediaId`   | Delete media                                  |
| `POST`   | `/api/v1/services/:id/tags`             | Add tag                                       |
| `DELETE` | `/api/v1/services/:id/tags/:tagId`      | Delete tag                                    |
| `POST`   | `/api/v1/services/:id/faqs`             | Add FAQ                                       |
| `PATCH`  | `/api/v1/services/:id/faqs/:faqId`      | Update FAQ                                    |
| `DELETE` | `/api/v1/services/:id/faqs/:faqId`      | Delete FAQ                                    |
| `POST`   | `/api/v1/services/:id/requirements`     | Add requirement                               |
| `PATCH`  | `/api/v1/services/:id/requirements/:id` | Update requirement                            |
| `DELETE` | `/api/v1/services/:id/requirements/:id` | Delete requirement                            |
| `POST`   | `/api/v1/services/:id/locations`        | Add location                                  |
| `PATCH`  | `/api/v1/services/:id/locations/:id`    | Update location                               |
| `DELETE` | `/api/v1/services/:id/locations/:id`    | Delete location                               |

## Future domains (not implemented)

Staff invitations, Bookings, Payments, Reviews, Notifications, Search, Admin dashboards, calendar sync, cloud file uploads.

## Local development topology

1. `docker compose up -d postgres redis`
2. `pnpm db:migrate` / `pnpm db:seed` when schema changes
3. `pnpm dev:api` / `pnpm dev:web`
