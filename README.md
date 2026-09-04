# Bombay Sweets — Pickup Ordering System

A Next.js 16 pickup-ordering system: customer menu/cart/checkout with Stripe
payments, secure order tracking, email notifications, and an admin portal
for managing orders, menu, and settings. Pickup only — there is no delivery
functionality anywhere in this codebase.

## Running locally

```bash
npm install
npm run dev
```

Copy `.env` (see [Environment variables](#environment-variables) below) into
place first — the app won't start without a working `DATABASE_URL`.

Create your first admin account:

```bash
npm run create-admin
```

This runs entirely on your own machine and prompts for an email/password —
nothing is sent anywhere but your own database.

## Architecture notes

- **Database-driven, not hardcoded.** The restaurant's name, address, hours,
  phone, and timezone all live in the `Restaurant` table (`prisma/schema.prisma`);
  pickup rules and tax rate live in `BusinessSettings`. Nothing in `lib/` or
  `app/api/` hardcodes "Bombay Sweets" — every place that needs the
  restaurant's name (admin login, admin nav, the Stripe checkout line item,
  notification emails) reads it from the database via
  `lib/business/queries.ts#getRestaurantName()` or
  `lib/notifications/restaurantInfo.ts`.
- **Single-tenant.** One deployment = one restaurant, one database. This is
  a deliberate choice, not a limitation to work around — see "Reusing this
  for a different restaurant" below.
- **Single currency.** `lib/payments/currency.ts` hardcodes `RESTAURANT_CURRENCY`
  (`"cad"`). If you clone this for a restaurant outside Canada, change that
  constant.

## Reusing this for a different restaurant

This codebase is built so that launching it for a *different* restaurant is
a clone-and-configure job, not a code change:

1. **Clone the repo** and create a **new, separate database** (don't point a
   second restaurant at the same Neon/Postgres instance as an existing one —
   there is no multi-tenant isolation between restaurants).
2. Run the Prisma migrations against the new database (`npx prisma migrate deploy`),
   then seed a `Restaurant` row and a `BusinessSettings` row with that
   restaurant's real name, address, hours, timezone, and tax rate.
3. Add the real menu (categories, items, modifiers) — either by hand through
   the admin portal, or with a one-off seed script.
4. Set the [environment variables](#environment-variables) below for the new
   restaurant's own Stripe account, Resend account/verified sending domain,
   and freshly-generated secrets. **Never reuse secrets (`SESSION_SECRET`,
   `TRACKING_TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`) across two restaurants'
   deployments.**
5. Update `lib/payments/currency.ts` if the new restaurant isn't in CAD.
6. Deploy as its own separate Vercel project, with its own cron
   (`vercel.json` already defines the daily sweep) and its own Stripe
   webhook endpoint pointing at that deployment's `/api/stripe/webhook`.
7. Create the first admin account with `npm run create-admin`.

None of this requires touching business logic — it's new data + new
environment variables + a separate deployment.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string (pooled) |
| `SESSION_SECRET` | Yes | Encrypts admin session cookies — generate a fresh random value per deployment |
| `STRIPE_SECRET_KEY` | Yes, for checkout to work | Stripe API key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Yes, for payments to confirm | Signing secret for a webhook endpoint registered against **this deployment's own URL** — `/api/stripe/webhook`, listening for `checkout.session.completed` and `checkout.session.expired` |
| `CRON_SECRET` | Yes | Authorizes Vercel's scheduled call to `/api/cron/expire-abandoned-orders` |
| `TRACKING_TOKEN_ENCRYPTION_KEY` | Yes | AES-256-GCM key (32 random bytes, base64) used to recover customer tracking tokens for notification links. Must stay identical across Development/Preview/Production for one deployment (it decrypts the same database), and must be unique per restaurant/deployment |
| `EMAIL_PROVIDER_API_KEY` | For notifications | Resend API key |
| `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME` | For notifications | Must be a domain verified in that Resend account |
| `NOTIFICATIONS_ENABLED` | For notifications | Must be the literal string `"true"` — and even then, only reaches a real customer inbox when `VERCEL_ENV === "production"` (see `lib/env.ts`) |
| `NOTIFICATION_TEST_EMAIL` | Recommended | Where Development/Preview notifications redirect to instead of a real customer |

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
