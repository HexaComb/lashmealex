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
4. For repository-wide process or documentation work that does not belong to a product ticket, create a standalone ticket and clearly tell the user that it is separate before making changes.
5. Create or switch to the ticket's dedicated branch before editing or committing. Start it from `main` unless the ticket explicitly depends on another branch.
6. Keep each ticket isolated: do not commit, push, or open a PR containing another ticket's work. If the wrong base branch is used, isolate the branch before pushing.
7. Open the pull request from that ticket's branch and include its `CU-{task_id}` reference in the branch name, commit, and PR title or description.
8. Update the associated ClickUp ticket status at meaningful workflow transitions:
   - Set **In Development** when implementation begins.
   - Set **In Review** immediately after creating a pull request.
   - Set **Done** only after the pull request merges to `main` or the user explicitly directs closure.

Do not combine unrelated tickets in one branch, commit, or pull request.

### ClickUp and GitHub linking

When the ClickUp GitHub integration is connected to this repository's ClickUp Space, it automatically links a branch, commit, or pull request that includes a valid ClickUp task reference.

- Name branches `codex/CU-{task_id}-{short-description}`. For example: `codex/CU-86e2dcjw0-product-seo-metadata`.
- Include `CU-{task_id}` in the pull request title or description as well, so the task remains linked even if the branch name changes.
- Use the same task reference in commit messages when practical.
- Configure ClickUp GitHub automations to move linked tasks to **In Review** when a pull request opens and **Done** when it merges to `main`, if the workspace plan supports those automations.

## Agent workflow

When given a task, follow this end-to-end process. Each step maps to a specific tool or action.

### 1. Explore and understand

- Search the codebase for relevant files, conventions, and existing patterns before writing anything.
- Read the files that will be changed and their surrounding context.
- Identify the website's visual or structural conventions when the task touches UI or email.

### 2. Create or find the ClickUp ticket

- Use `clickup_clickup_search` to check for an existing ticket that matches the work.
- If none found, use `clickup_clickup_create_task` to create one in the **Lashmealex** space (space ID: `90176482789`, default list ID: `901715340178`).
  - Include a clear description with problem, solution, files changed, and verification steps.
- Record the `task_id` returned — it is needed for branch naming, commits, and PR.

### 3. Create the feature branch

```bash
git checkout -b codex/CU-{task_id}-{short-description}
```

Example: `git checkout -b codex/CU-86e2dgtf4-order-email-redesign`

### 4. Set ticket to In Development

```
clickup_clickup_update_task → status: "in development"
```

### 5. Implement the changes

- Follow the codebase conventions documented in this file.
- Keep changes narrowly scoped to the ticket.

### 6. Verify

```bash
pnpm lint
pnpm typecheck
```

Run `pnpm build` when the change touches routing, configuration, or production behavior.

### 7. Commit

```bash
git add <files>
git commit -m "feat(scope): description

Optional body.

CU-{task_id}"
```

Use Conventional Commits (`feat`, `fix`, `refactor`, `chore`, etc.). Always include `CU-{task_id}` in the commit message.

### 8. Push and create PR

```bash
git push -u origin codex/CU-{task_id}-{short-description}
gh pr create --title "feat(scope): description — CU-{task_id}" --body-file <body-file> --base main
```

- Write the PR body to a temp file first to avoid shell escaping issues with markdown content.
- Include `CU-{task_id}` in the PR title.
- The PR body should describe what changed, before/after when relevant, files changed, and verification performed.

### 9. Set ticket to In Review

```
clickup_clickup_update_task → status: "in review"
```

### 10. Handoff

Summarize to the user:
- ClickUp ticket link
- PR link
- What changed
- Verification performed
- Any known limitations or follow-up work

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
