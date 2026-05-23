# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                 # local Next.js dev server
npm run build               # production Next.js build (Vercel)
npm run lint                # ESLint
npm run typecheck           # TypeScript type-check (no emit)

# Convex
npm run convex:dev          # local Convex backend + codegen
npm run convex:deploy       # deploy Convex functions/schema
npm run migrate:d1          # import D1 SQL export / seed.sql into Convex (see scripts/)
```

Schema source of truth is `convex/schema.ts`. Server-side data access uses `fetchQuery` / `fetchMutation` from `convex/nextjs` via thin wrappers in `src/lib/catalog.ts`, `src/lib/cart.ts`, and `src/lib/orders.ts`.

## Architecture

This is a **Next.js 16 app** intended for **Vercel**, with **Convex** as the database and **Cloudflare R2** (S3-compatible API) for product images. No test suite exists; verify correctness by running `npm run typecheck` and `npm run lint`.

### Convex

- Functions live in `convex/` (`products.ts`, `carts.ts`, `orders.ts`, `migrations/importD1.ts`).
- Each row keeps a string `id` field (D1 UUID) indexed as `by_externalId` for cart IDs, slugs, and webhooks.
- Admin mutations require `ADMIN_INTERNAL_SECRET` (set in Vercel and Convex env). Next.js passes it only from server actions after `requireAdmin()`.
- `NEXT_PUBLIC_CONVEX_URL` must be set for `fetchQuery` / `fetchMutation`.

### Product images (R2)

- `src/lib/product-images.ts` — S3 client for R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`).
- `getProductImagePath(key)` — app-local URL `/images/...`
- `src/app/images/[...key]/route.ts` — streams objects from R2.

### Data model

Five Convex tables, all prices in **cents**:

- `products` — variant-level rows grouped by `parentProductId`
- `orders` / `orderItems` — `status`: `pending`, `paid`, `shipped`, `fulfilled`; `fulfillmentStatus` defaults to `unfulfilled`
- `carts` / `cartItems` — unique email per cart; `status`: `active`, `converted`, `abandoned`

### Server utilities (`src/lib/`)

- `catalog.ts`, `cart.ts`, `orders.ts` — Convex-backed wrappers for pages and actions
- `convex.ts` — `getAdminSecret()`, timestamp helpers
- `stripe.ts` — Stripe client (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- `admin-auth.ts` — cookie sessions (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`)
- `money.ts` — cent formatting
- `cart-constants.ts` — cart validation and normalization

### Server actions

- `src/app/admin/actions.ts` — admin mutations (Convex + R2 uploads)
- `src/app/cart/actions.ts` — cart and checkout
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook → Convex orders

### Routing

- **Storefront**: `/`, `/shop`, `/products/[slug]`, `/wishlist`
- **Admin**: `/admin`, `/admin/login`, `/admin/products/[slug]`, `/admin/carts`, `/admin/carts/[id]`

### Key conventions

- Use `revalidatePath()` after mutations.
- Never store prices as floats; use integer cents.
- Normalize emails before storage and lookups.

### Migrating from D1

1. Export production D1: `wrangler d1 export lashmealex-d1 --remote --output=d1-export.sql` (requires Cloudflare credentials).
2. Set `ADMIN_INTERNAL_SECRET` and `NEXT_PUBLIC_CONVEX_URL`.
3. Run: `npm run migrate:d1 -- --file=d1-export.sql --clear`

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
