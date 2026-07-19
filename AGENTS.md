# Agent Guide

This file defines how people and AI agents should work in this repository. Follow the rules that are relevant to the task; repository-specific instructions override general habits.

## Project at a glance

Lashmealex is a Next.js 16 e-commerce storefront and owner admin deployed on Vercel.

- `src/app/` — App Router pages, server actions, and API routes
- `src/components/` — shared React UI
- `src/context/` — client-side providers
- `src/lib/` — server utilities and Convex-backed application logic
- `convex/` — Convex schema, queries, mutations, actions, and shared utilities
- `public/` — static assets

The application uses Convex for application data and product-image storage, Stripe for checkout, and Resend for transactional email.

## Work tracking and branches

Every implementation task must be tied to a ClickUp ticket.

1. Search ClickUp for a ticket that matches the requested work before starting.
2. If a matching ticket exists, update it with the clarified scope and relevant progress.
3. If no matching ticket is found, create one before beginning implementation.
4. Use one dedicated branch per ClickUp ticket. Name it with the repository's `codex/` prefix and include the ticket identifier when available.
5. When the requested work moves to another ClickUp ticket, tell the user that the work should continue on that ticket's branch before making changes.

Do not combine unrelated tickets in one branch, commit, or pull request.

## Before making changes

- Inspect the relevant code, documentation, and local conventions first.
- Check `git status` before editing. Treat existing uncommitted work as user-owned unless it is clearly part of the current ticket.
- For a complex, ambiguous, risky, or cross-cutting task, present a short implementation plan and obtain approval before changing code.
- For any code or configuration change, show a focused proposed patch or diff and obtain approval before applying it.
- Do not invent requirements. Ask a focused question when the answer cannot be safely inferred from the ticket or repository.
- Never expose, copy, log, or commit secrets from `.env*`, deployment settings, or third-party credentials.

## Implementation standards

- Use TypeScript and keep code explicit, small, and readable.
- Keep concerns separated: UI in components/routes, business logic in `src/lib/`, and persistence/business operations in `convex/`.
- Prefer existing utilities and patterns over introducing a parallel abstraction.
- Do not store monetary values as floats. Prices are integer cents.
- Normalize customer emails before storage and lookup.
- Preserve the variant-level product model: each `products` row represents a sellable variant.
- Use `revalidatePath()` after mutations when cached Next.js routes need refreshing.
- Keep changes narrowly scoped to the ticket. Do not refactor unrelated code without documenting the reason and obtaining approval.
- Add or update documentation when behavior, setup, configuration, or public developer-facing APIs change.

## Next.js and UI

- Use the App Router conventions already established in `src/app/`.
- Keep server-only logic, secrets, and privileged operations out of client components.
- Preserve metadata and structured data when changing storefront routes; SEO is a product requirement.
- Keep the existing visual system and Tailwind conventions consistent. Do not introduce a new styling framework without approval.
- Maintain accessible semantics, keyboard interaction, and useful loading/error states for user-facing changes.

## Convex

Before editing any file in `convex/`, read `convex/_generated/ai/guidelines.md`. Its rules override other Convex guidance.

- Treat `convex/schema.ts` as the data-model source of truth.
- Keep generated files in `convex/_generated/` machine-managed; do not edit them manually.
- Use Convex for products, carts, orders, and product-image storage.
- Keep admin mutations protected. Secrets must only be used from server-side code after authorization is verified.
- Preserve the existing external-ID indexes and webhook idempotency behavior unless the ticket explicitly changes them.
- Treat `imageUrl` as a legacy fallback; new product images belong in Convex file storage.
- Schema changes or data migrations require an explicit migration plan and approval before execution.

## Stripe, email, and security

- Verify Stripe webhook signatures before processing events.
- Keep checkout, payment, order-state, and email changes idempotent where possible.
- Do not send real emails, charge cards, deploy, rotate credentials, or modify production data without explicit user authorization.
- Do not weaken authentication, authorization, validation, webhook verification, or secret handling just to make a task pass.

## Verification

Run the checks relevant to the files changed:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

- Run `pnpm lint` and `pnpm typecheck` for normal TypeScript changes.
- Run `pnpm build` for routing, configuration, dependency, or production-behavior changes when practical.
- Run focused automated tests when they exist, and add coverage for new logic when a suitable test setup is present.
- If a check is not run or cannot run, report that clearly with the reason. Do not claim verification that did not occur.

## Git and handoff

- Make small, cohesive commits using Conventional Commits, such as `feat(cart): add checkout validation`.
- Do not stage unrelated existing changes.
- Do not amend, reset, force-push, deploy, or delete material data unless the user explicitly requests it.
- Before handoff, summarize the ticket, changed files, verification performed, and any known limitations or follow-up work.
