# Lashmealex Project Context

Lashmealex is a SEO-optimized e-commerce storefront and owner admin for a beauty salon. The web surface is a **Next.js app deployed on Vercel**, backed by **Convex** for data, server functions, and product image storage.

## Project Overview

- **Framework:** Next.js App Router
- **Hosting:** Vercel for the web surface
- **Backend:** Convex functions and schema in `convex/`
- **Storage:** Convex file storage for product images
- **Styling:** Tailwind CSS v4, Framer Motion for animations
- **Key Features:** Variant-level product catalog, owner admin, cart recovery, Stripe checkout, and local pickup fulfillment.

## Core Mandates & Conventions

- **Convex First:** Product, cart, order, and image data are managed through Convex.
- **Vercel First:** Do not add hosting/runtime dependencies for other frontend deployment targets.
- **Image Storage:** Product uploads use Convex file storage. Legacy `imageUrl` values are fallback-only for older rows.
- **SEO & Performance:** Maintain Next.js Metadata API and structured JSON-LD data.
- **Product Model:** Products are modeled at the sellable variant level. Each `products` row represents a unique variant.

## Development Workflow

- `pnpm dev`: Start the local Next.js development server.
- `pnpm build`: Build the Vercel-targeted Next.js app.
- `pnpm convex:dev`: Start the local Convex backend and codegen.
- `pnpm convex:deploy`: Deploy Convex functions and schema.
- `pnpm lint`: Run ESLint.
- `pnpm typecheck`: Run TypeScript type-checking.

## Key Directory Structure

- `src/app/`: Next.js App Router routes.
- `src/components/`: Shared UI components.
- `src/context/`: Client providers.
- `src/lib/`: Server utilities and Convex-backed wrappers.
- `convex/`: Schema, functions, and migrations.
- `scripts/`: One-off migration tooling.

## Git Conventions

- Prefer small, focused commits that do one thing well.
- Stage files logically related to a single change.
- Use Conventional Commits, such as `feat: migrate product images to convex storage`.
