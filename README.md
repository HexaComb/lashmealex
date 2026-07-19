# Lashmealex

Next.js storefront and owner admin, deployed on **Vercel**, with **Convex** for data and product image storage.

## Structure

- `src/` — Next.js App Router (storefront, admin, API routes)
- `convex/` — database schema and server functions
- `seed.sql` — sample catalog for local import
- `.env.example` — required environment variables

## Getting Started

```bash
pnpm install
cp .env.example .env.local
# Fill in Convex URL (from `pnpm convex:dev`), admin secrets, Stripe keys, and Resend settings

pnpm convex:dev      # terminal 1: Convex backend
pnpm dev             # terminal 2: Next.js
```

Open `http://localhost:3000`.

## Deploy

1. Create a Convex project: `npx convex deploy` and set `NEXT_PUBLIC_CONVEX_URL` on Vercel.
2. Set Convex env vars (`ADMIN_INTERNAL_SECRET`, etc.) to match Vercel.
3. Connect the repo to Vercel; `pnpm build` is the build command.
4. Configure Stripe, Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), and admin secrets on Vercel (see `.env.example`).

## Verification

```bash
pnpm lint
pnpm typecheck
```

## Notes

- Catalog is variant-level (each lash variant is its own sellable row).
- Deprecated Medusa backend remains in `apps/.backend_deprecated` for reference only.
