# Teeway CRM

A sales CRM for a golf-cart business: client pipeline, cart catalogue, quotes, orders and invoices — with invoices pushed to [TOConline](https://www.toconline.pt/), the Portuguese accounting platform, rather than re-keyed by hand.

Next.js and TypeScript on the front, PostgreSQL and Prisma behind it. Built solo.

## Why it exists

Small businesses that sell configurable, quoted products usually run on a spreadsheet plus a separate invoicing tool, and the seam between the two is where the errors live: a quote is accepted, someone retypes it as an order, someone retypes it again as an invoice, and the numbers drift.

This models the whole path as one object graph — **client → quote → order → invoice** — so a document is derived from the stage before it instead of transcribed from it.

## What it does

**Pipeline.** Clients move through `LEAD → CONTACTED → BUDGET_SENT → WON / LOST`, with a timestamped activity log and follow-up reminders per client.

**Catalogue.** Cart models with pricing, activate/deactivate rather than delete, so historical documents keep referring to something real.

**Quotes → orders → invoices.** Line-item documents with per-line and whole-document discounts (percentage or fixed), each with its own status lifecycle.

**Branded PDFs.** Quotes and invoices render through dedicated document routes to printable, brand-consistent pages — templates in `reference/` came from the company's existing brand guide.

**Accounting integration.** Invoices sync to TOConline, with separate sandbox and production environments and a stored connection per install.

**Auth and roles.** NextAuth with credentials, `ADMIN` and `STAFF` roles, user management and pricing settings in-app.

## Stack

- **Framework** — Next.js (App Router, Turbopack), TypeScript, React
- **Data** — PostgreSQL, Prisma (schema + migrations), seed script
- **UI** — Tailwind CSS, shadcn/ui, Base UI, lucide, sonner, next-themes (dark mode)
- **Forms & validation** — react-hook-form with Zod resolvers
- **Auth** — NextAuth, bcrypt password hashing
- **Tests** — Vitest

## Layout

```
prisma/
  schema.prisma       full domain model — users, clients, catalogue, documents
  migrations/         versioned SQL migrations
  seed.ts
src/
  app/(app)/          authenticated application routes
  app/(documents)/    print-oriented PDF routes for quotes and invoices
  app/api/auth/       NextAuth handler
  components/         domain components, grouped by area
  auth.ts             session and authorisation config
reference/            brand guide and document templates
```

## Running it

```bash
cp .env.example .env      # set DATABASE_URL and auth secrets
npm install
npx prisma migrate dev    # create schema
npx prisma db seed        # optional starter data
npm run dev
```

Tests: `npm test`

## Notes

The domain model was designed first and the interface followed from it — the reason quotes, orders and invoices share line-item structure instead of each inventing their own.

TOConline credentials are per-install and configured in-app; nothing sensitive is committed.
