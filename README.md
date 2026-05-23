# Lashmealex

Next.js storefront and owner admin, deployed on **Vercel**, with **Convex** for data and **Cloudflare R2** for product images.

## Structure

- `src/` — Next.js App Router (storefront, admin, API routes)
- `convex/` — database schema and server functions
- `scripts/migrate-d1-to-convex.ts` — one-off D1 → Convex import
- `seed.sql` — sample catalog for local import
- `.env.example` — required environment variables

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in Convex URL (from `npm run convex:dev`), admin secrets, Stripe, and R2 keys

npm run convex:dev   # terminal 1: Convex backend
npm run dev          # terminal 2: Next.js

# Seed local Convex from seed.sql (with Convex dev running):
npm run migrate:d1 -- --file=seed.sql --clear
```

Open `http://localhost:3000`.

## Deploy

1. Create a Convex project: `npx convex deploy` and set `NEXT_PUBLIC_CONVEX_URL` on Vercel.
2. Set Convex env vars (`ADMIN_INTERNAL_SECRET`, etc.) to match Vercel.
3. Connect the repo to Vercel; `npm run build` is the build command.
4. Configure R2 S3 credentials and Stripe secrets on Vercel (see `.env.example`).

## Verification

```bash
npm run lint
npm run typecheck
```

## Notes

- Catalog is variant-level (each lash variant is its own sellable row).
- Deprecated Medusa backend remains in `apps/.backend_deprecated` for reference only.
