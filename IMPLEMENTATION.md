# lashmealex Implementation Plan

## Document Status

- Status: Draft for review
- Last updated: 2026-04-08
- Project type: SSR ecommerce storefront for a local eyelash and beauty business
- Primary goal: Sell beauty products online with pickup at the salon, while preserving branding and improving SEO

## What We Know

- Business name: `lashmealex`
- Existing site: `https://lashmealex.glossgenius.com/`
- Existing site role: remains the primary booking destination
- Business type: local beauty / lash salon in Fresno, CA
- Products: beauty products, especially lash-related items
- Checkout expectations: Apple Pay and Venmo
- Fulfillment: pickup at physical location
- Business operations: owner must be able to log in, manage inventory, and perform product CRUD
- SEO matters: product pages and local business pages should be crawlable and indexable
- Stack preference: Vue is familiar, but the build should favor maintainability and agent productivity

## Current Brand Inputs From Existing Site

These are the initial brand tokens we should preserve and refine in the new design system:

- Primary accent pink: `#FF7BEF`
- Secondary slate: `#5A5E6D`
- Tertiary slate: `#727587`
- Dark background: `#2C2E32`
- Darker background: `#1B1D21`
- Cover image exists on the current site and should be reviewed for reuse
- Current positioning is clearly local and service-based, so the product store should still feel tied to the salon rather than a generic cosmetics shop

Important note:

- The current site already exposes local business data and service information. The new app should preserve and improve that, not replace it with a purely ecommerce-first experience.
- The new store should operate as a sister site to the existing GlossGenius booking site.
- Appointment booking should continue to route users to the existing GlossGenius experience.

## Recommended Architecture

### Recommendation

Use `Next.js` for the storefront and `Medusa` for commerce backend + admin.

### Why This Is The Best Fit

- `Next.js` gives us SSR, route-level metadata, strong SEO primitives, and broad ecosystem support.
- `Medusa` gives us a commerce backend, admin dashboard, product catalog, inventory, orders, regions, and extensibility without platform fees.
- The Medusa admin gives the owner a usable back office for product CRUD and stock management without us building a full custom admin from scratch.
- Medusa supports manual fulfillment flows, which fits pickup orders well.
- This stack is currently more maintainable by AI agents than a mostly custom Vue build because:
  - examples and integrations are easier to find,
  - React and Next have more mature commerce starter patterns,
  - Medusa’s default storefront path is Next-based,
  - a large portion of the needed functionality already exists out of the box.

### Why Not Lead With Vue / Nuxt

Nuxt could absolutely work, but it would increase custom integration effort for commerce flows, checkout, account management, and long-term agent productivity. Since the main requirement is maintainability plus fast delivery, not framework familiarity, `Next.js + Medusa` is the pragmatic choice.

## High-Level System Design

### Frontend

- `Next.js` App Router
- SSR / static pre-rendering where appropriate
- Product listing pages
- Product detail pages
- Cart and checkout
- Pickup selection and pickup instructions
- Booking CTA modules that hand users off to GlossGenius
- CMS-like editable marketing sections stored in code first, then optionally moved to content management later
- Structured metadata for SEO and social sharing

### Backend

- `Medusa` server
- `PostgreSQL` database
- Medusa admin for owner login and product/inventory CRUD
- Manual fulfillment flow for pickup orders
- Order state management for pickup ready / picked up

### Payments

- `Stripe` for card payments and Apple Pay
- `PayPal` integration for Venmo availability in checkout

Important payment note:

- Apple Pay is straightforward through Stripe.
- Venmo usually comes through the PayPal/Venmo path, so this will likely require either a Medusa PayPal provider integration or a small custom payment provider module if an off-the-shelf package is not sufficient.
- This is still materially cheaper than adopting a hosted commerce platform with recurring platform fees.

### Deployment

- Storefront on `Vercel`
- Medusa backend on `Railway`, `Render`, or similar Node-friendly host
- `PostgreSQL` on managed hosting such as Neon, Railway Postgres, or Supabase Postgres
- Convex file storage for product images in production

## SEO Strategy

SEO should be built into the architecture, not added later.

### Core SEO Requirements

- SSR product pages with clean URLs
- Unique metadata per product and category page
- XML sitemap generation
- `robots.txt`
- Canonical URLs
- Open Graph and Twitter metadata
- Product schema via JSON-LD
- Local business schema via JSON-LD
- Pickup / location details on relevant pages
- Fast image delivery with responsive sizes and compression
- Strong internal linking between home, shop, product, about, contact, and pickup info pages

### Local SEO Requirements

- Dedicated contact / location page
- NAP consistency: business name, address, phone
- Pickup instructions page or section
- Booking links should point to the current GlossGenius booking flow
- Fresno location references where appropriate, without keyword stuffing
- Optional future additions:
  - FAQ content
  - reviews/testimonials
  - service pages that cross-link to product pages

## Functional Scope

### Customer-Facing Features

- Home page aligned with existing brand
- Shop page with filters
- Product detail pages
- Cart
- Checkout
- Apple Pay support
- Venmo support
- Pickup-only fulfillment at launch
- Order confirmation page
- Order confirmation email
- Basic contact and salon information
- Persistent "Book Appointment" CTA that links to GlossGenius

### Admin Features

- Admin login for owner
- Product CRUD
- Product image management
- Inventory management
- Price updates
- Order management
- Mark order as ready for pickup
- Mark order as picked up

### Deferred / Nice-To-Have Features

- Customer accounts
- Discount codes
- Bundles / kits
- Gift cards
- Loyalty / referral
- Blog / editorial content
- Deeper booking integration beyond handoff to the current salon booking system

## Data Model Direction

### Product

- Title
- Slug
- Description
- Short description
- Price
- Compare-at price
- SKU
- Inventory quantity
- Category
- Brand
- Images
- Featured flag
- Active / draft status

### Product Metadata

- Lash type
- Style
- Length
- Curl
- Material
- Reusable / single-use
- Pickup notes if needed

### Order

- Customer contact info
- Payment status
- Fulfillment status
- Pickup status
- Pickup name
- Pickup instructions
- Order notes

## UX / Brand Direction

The new site should feel more premium and editorial than the existing booking page while keeping obvious continuity with the current brand.

### Visual Direction

- Keep the bright pink as the signature accent
- Avoid a generic beauty-template look
- Use a more polished dark editorial palette with selective pink highlights
- Emphasize product photography and salon trust signals
- Blend product selling with local salon credibility
- Make booking and shopping feel like two connected flows from the same brand

### Proposed IA

- `/`
- `/shop`
- `/products/[slug]`
- `/about`
- `/book`
- `/pickup`
- `/contact`
- `/cart`
- `/checkout`

### Booking Handoff Strategy

- The new storefront will not replace the current booking system.
- `Book Appointment` actions should deep-link users to `https://lashmealex.glossgenius.com/`
- The home page, navigation, footer, and relevant product/brand sections should all provide clear paths to booking services.
- The `/book` route can exist as a branded handoff page with service context, trust copy, and a strong CTA into GlossGenius.

## Technical Decisions To Lock Early

### Decision 1

- Framework: `Next.js`

### Decision 2

- Commerce backend: `Medusa`

### Decision 3

- Database: `PostgreSQL`

### Decision 4

- Payment setup:
  - `Stripe` for Apple Pay and standard card flows
  - `PayPal/Venmo` integration for Venmo checkout

### Decision 5

- Fulfillment model: pickup only for V1

### Decision 6

- Auth model:
  - Medusa admin user for owner
  - customer accounts optional, not required for V1

## Risks And Open Questions

### Risk 1: Venmo Integration Complexity

- Apple Pay is low risk.
- Venmo is achievable, but it is the most likely area to require custom payment integration work.

Mitigation:

- Treat Venmo as a dedicated milestone.
- If needed, ship Apple Pay + cards first in staging while finishing Venmo before production launch.

### Risk 2: Brand Assets

- We currently have color values and image URLs from the live site, but not a formal brand kit.

Mitigation:

- Add a brand discovery pass before UI implementation.
- Confirm logo assets, preferred typography, and photography rights.

### Risk 3: Pickup UX

- Pickup sounds simple, but order state clarity matters.

Mitigation:

- Keep fulfillment pickup-only in V1.
- Add clear order states: `paid`, `ready for pickup`, `picked up`.

### Risk 4: Scope Drift

- There is a natural temptation to combine booking, products, CMS, loyalty, and content in one phase.
- There is also a risk of accidentally duplicating booking functionality that already exists on GlossGenius.

Mitigation:

- Keep V1 narrowly focused on products + pickup + payments + SEO.
- Treat booking as a handoff flow, not a rebuilt subsystem.

## Milestones

Each milestone should be treated as a review gate.

### Milestone 0: Planning And Discovery

- Status: `In Progress`
- Confirm stack and deployment model
- Confirm V1 scope
- Confirm whether current cover image and existing brand assets can be reused
- Confirm business copy, pickup address, hours, and contact details
- Confirm primary booking URLs and preferred booking CTA copy

Exit criteria:

- Approved implementation plan
- Approved V1 scope
- Approved stack choice

### Milestone 1: Project Bootstrap

- Status: `Pending`
- Initialize Next.js storefront
- Initialize Medusa backend
- Configure local Postgres
- Configure environment variables
- Verify storefront can fetch products from backend
- Set up linting, formatting, and CI basics

Exit criteria:

- Local dev environment works end to end
- Admin login works
- Storefront talks to Medusa

### Milestone 2: Brand System And Core UI

- Status: `Pending`
- Build design tokens from current branding
- Create typography, spacing, color, and component primitives
- Implement homepage shell
- Implement navigation and footer
- Implement mobile-first responsive layout

Exit criteria:

- Brand-approved UI foundation exists
- Shared components are stable enough for the rest of the app
- Booking handoff components are approved

### Milestone 3: Catalog And Product Experience

- Status: `Pending`
- Create shop page
- Create product detail page
- Add image gallery, pricing, and product metadata
- Add category structure and filtering
- Add related products / cross-sell sections
- Add contextual booking handoff placements where appropriate

Exit criteria:

- Products are fully browsable from storefront
- Product pages are SSR and indexable
- Booking pathways are visible without interfering with shopping

### Milestone 4: Cart, Checkout, And Pickup Flow

- Status: `Pending`
- Implement cart
- Implement checkout UI
- Add pickup-only fulfillment option
- Add pickup policy and pickup instructions
- Add order confirmation page and email content

Exit criteria:

- Test order can be placed end to end in staging
- Pickup flow is clear to customer and owner

### Milestone 5: Payments

- Status: `Pending`
- Integrate Stripe
- Enable Apple Pay
- Integrate PayPal/Venmo flow
- Validate webhook handling
- Validate refund / cancel basics in admin

Exit criteria:

- Apple Pay works on supported devices
- Venmo path is operational
- Payment states sync correctly into orders

### Milestone 6: Admin Operations

- Status: `Pending`
- Configure owner admin user
- Validate product CRUD
- Validate inventory CRUD
- Validate order workflow for pickup readiness and pickup completion
- Add any minimal admin customizations if gaps are found

Exit criteria:

- Owner can independently manage products and stock
- Owner can manage pickup orders without engineering help

### Milestone 7: SEO And Performance Hardening

- Status: `Pending`
- Add metadata system
- Add sitemap and robots
- Add JSON-LD for product and local business
- Optimize images and loading strategy
- Validate Core Web Vitals
- Validate crawlability and canonical behavior
- Ensure booking handoff pages support brand and local SEO without duplicating thin content

Exit criteria:

- Lighthouse and manual SEO checks pass agreed threshold
- Pages are production-ready for indexing

### Milestone 8: QA, Launch Prep, And Deployment

- Status: `Pending`
- Set up production infrastructure
- Configure domains and SSL
- Configure production environment variables
- Run smoke tests
- Validate checkout, pickup, emails, and admin flows
- Prepare rollback and support notes

Exit criteria:

- Production deployment is ready
- Launch checklist is complete

## Suggested V1 Build Order

1. Planning and stack approval
2. Bootstrap backend and storefront
3. Establish brand system
4. Build catalog and product pages
5. Implement cart and pickup flow
6. Finish payments
7. Harden SEO and performance
8. Launch

## Suggested Success Criteria For V1

- Products can be added, edited, and removed by the owner without code changes
- Inventory can be updated from admin
- Customers can browse and purchase products for pickup
- Apple Pay works
- Venmo works
- Product pages are indexable and fast
- Booking traffic is preserved through clear handoff to GlossGenius
- The site feels like a premium extension of the existing lashmealex brand

## Recommendation Summary

If we optimize for low recurring platform fees, SEO, pickup orders, and maintainability by AI agents, the best V1 path is:

- `Next.js` storefront
- `Medusa` backend and admin
- `PostgreSQL`
- `Stripe` for Apple Pay
- `PayPal/Venmo` for Venmo
- pickup-only fulfillment for launch

This gives us a strong base without locking the business into a high-fee hosted commerce platform or forcing us to build an admin from scratch.
