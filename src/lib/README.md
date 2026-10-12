# Server utilities

- `catalog.ts`, `cart.ts`, `orders.ts` — thin wrappers around Convex `fetchQuery` / `fetchMutation`
- `convex.ts` — admin secret and timestamp helpers
- `stripe.ts` — Stripe configuration
- `site.ts` — current hostname constant (`SITE.displayDomain`, `SITE.fallbackUrl`)
- `brand-keys.ts` — cookie, storage, and analytics key names
- `admin-auth.ts` — password cookie sessions for `/admin`
- `money.ts` — cent-to-display formatting
- `cart-constants.ts` — cart validation constants
