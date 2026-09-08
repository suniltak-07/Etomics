# EatOmics

Meal subscription platform for wellness-focused meal plans. Customers browse plans, check out with vouchers, and manage subscriptions; admins manage plans, customers, vouchers, payments, and reports.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **Zod** + **React Hook Form** for validation/forms
- **TanStack Query** + **Redux Toolkit** for client state/data
- **Vitest** + Testing Library for unit tests
- **Playwright** for e2e smoke tests
- In-memory mock data layer (`src/mocks/seed.ts`) for catalog/checkout until those APIs are wired
- **OFOOD** backend for authentication (`http://ofood-alb-604405684.ap-south-1.elb.amazonaws.com`)

## Getting started

```bash
npm install
npm run prepare   # husky git hooks
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` to configure environments:

```
# Optional — app `/api/*` origin (defaults to current host / localhost:3000)
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# NEXT_PUBLIC_API_BASE_URL=https://your-dev-app.vercel.app

# Upstream OFOOD (server-only proxy target; same ALB for dev and prod for now)
OFOOD_API_BASE_URL=http://ofood-alb-604405684.ap-south-1.elb.amazonaws.com
```

## Authentication

Login, signup, logout, session refresh, and `/me` are proxied to the OFOOD Authentication API. After a successful login, users are routed by role:

| Backend role    | Portal                |
| --------------- | --------------------- |
| `ROLE_CUSTOMER` | `/customer/dashboard` |
| `ROLE_ADMIN`    | `/admin/dashboard`    |

Access tokens are short-lived; the HttpOnly `OFOOD_REFRESH_TOKEN` cookie is stored on this app’s domain so `/api/auth/me` and `/api/auth/refresh` can rotate tokens.

## Architecture

```
src/
  app/          # Next.js routes (public, auth, customer, admin)
  features/     # Domain modules (plans, vouchers, auth, checkout, …)
  portals/      # Role-specific UI shells and pages (admin, customer)
  lib/          # Shared utilities (pricing, permissions, auth, api)
  mocks/        # Seed data + in-memory store
  components/   # Shared UI primitives
  store/        # Redux store
  types/        # Shared entities and enums
```

- **`features/`** — domain logic: schemas, services, hooks, feature components
- **`portals/`** — admin and customer portal layouts, navigation, and page compositions
- **`lib/`** — cross-cutting concerns such as `pricingEngine`, permissions, session helpers, and API clients

## Scripts

| Script                 | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start Next.js development server     |
| `npm run build`        | Production build                     |
| `npm run start`        | Start production server              |
| `npm run lint`         | ESLint                               |
| `npm run typecheck`    | TypeScript (`tsc --noEmit`)          |
| `npm test`             | Vitest unit tests (CI-friendly)      |
| `npm run test:watch`   | Vitest watch mode                    |
| `npm run test:e2e`     | Playwright e2e (needs `npm run dev`) |
| `npm run format`       | Prettier write                       |
| `npm run format:check` | Prettier check                       |
| `npm run prepare`      | Install Husky hooks                  |

Pre-commit runs **lint-staged** (Prettier + ESLint on staged files).

## Routes map

### Public

| Path            | Description    |
| --------------- | -------------- |
| `/`             | Marketing home |
| `/plans`        | Plan catalog   |
| `/plans/[slug]` | Plan detail    |
| `/about`        | About          |
| `/contact`      | Contact        |

### Auth

| Path               | Description    |
| ------------------ | -------------- |
| `/login`           | Sign in        |
| `/signup`          | Register       |
| `/forgot-password` | Password reset |

### Customer

| Path                           | Description            |
| ------------------------------ | ---------------------- |
| `/customer`                    | Customer home redirect |
| `/customer/dashboard`          | Dashboard              |
| `/customer/plans`              | Browse plans           |
| `/customer/checkout`           | Checkout wizard        |
| `/customer/subscriptions`      | My subscriptions       |
| `/customer/subscriptions/[id]` | Subscription detail    |
| `/customer/orders`             | Orders                 |
| `/customer/payments`           | Payments               |
| `/customer/addresses`          | Delivery addresses     |
| `/customer/profile`            | Profile                |
| `/customer/notifications`      | Notifications          |
| `/customer/settings`           | Settings               |

### Admin

| Path                        | Description          |
| --------------------------- | -------------------- |
| `/admin`                    | Admin entry          |
| `/admin/dashboard`          | Dashboard            |
| `/admin/plans`              | Plan list            |
| `/admin/plans/new`          | Create plan          |
| `/admin/plans/[id]`         | Plan detail          |
| `/admin/plans/[id]/edit`    | Edit plan            |
| `/admin/customers`          | Customers            |
| `/admin/customers/[id]`     | Customer detail      |
| `/admin/subscriptions`      | Subscriptions        |
| `/admin/vouchers`           | Vouchers             |
| `/admin/vouchers/new`       | Create voucher       |
| `/admin/vouchers/[id]/edit` | Edit voucher         |
| `/admin/payments`           | Payments             |
| `/admin/cities`             | Operating cities     |
| `/admin/pincodes`           | Serviceable pincodes |
| `/admin/delivery-persons`   | Delivery team        |
| `/admin/reports`            | Reports              |
| `/admin/settings`           | Settings             |

### Serviceability

Seeded active cities: **Bengaluru**, **Mumbai**, **Pune**.

Try customer pincodes such as `560038`, `560034`, `400050`, `411057`. Unserviceable example: `999999`.
