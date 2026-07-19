# Lashmealex ClickUp Ticket Execution Plan

## Purpose and status snapshot

This plan inventories the complete Lashmealex ClickUp list as reviewed on 2026-07-18. It separates work that is already completed from the remaining delivery sequence, and requires one ticket, one branch, and one pull request for every implementation or standalone documentation change.

| Status | Tickets |
| --- | ---: |
| Shipped | 4 |
| In Review | 2 |
| In Development | 0 |
| Backlog | 10 |

## Completed and active work

| Ticket | Scope | Branch / outcome | Status |
| --- | --- | --- | --- |
| [CU-86e2dcjw0](https://app.clickup.com/t/86e2dcjw0) | Product SEO metadata | `codex/86e2dcjw0-product-seo-metadata`; PR #4 merged to `main` | Shipped |
| [CU-86e2dcm4u](https://app.clickup.com/t/86e2dcm4u) | Hero-product featured fallback | `codex/CU-86e2dcm4u-hero-product-featured-fallback`; PR #6 merged to `main` | Shipped |
| [CU-86e2dcn2g](https://app.clickup.com/t/86e2dcn2g) | Agent ClickUp workflow guidance | `codex/CU-86e2dcn2g-document-ticket-statuses`; PR #5 merged to `main` | Shipped |
| [CU-86e2dcmjf](https://app.clickup.com/t/86e2dcmjf) | ClickUp/GitHub linking convention | `fd58e6d` merged directly to `main` before the current isolation rule; status reconciled to Shipped | Shipped |
| [CU-86e2dcjq9](https://app.clickup.com/t/86e2dcjq9) | Clean homepage design | Keep its existing implementation/PR isolated; review before any dependent homepage changes | In Review |
| [CU-86e2dcnhh](https://app.clickup.com/t/86e2dcnhh) | This execution plan and ADR | `codex/CU-86e2dcnhh-ticket-plan-adr`; draft PR #7 | In Review |

## Delivery sequence

### 1. Revenue and fulfillment integrity

| Ticket | Why first | Required outcome |
| --- | --- | --- |
| [CU-86e2dcjzx](https://app.clickup.com/t/86e2dcjzx) — Harden Stripe payment-state handling | Urgent: a completed Checkout session can currently be treated as paid without verifying payment status. | Persist and reconcile lifecycle events; create paid orders only after confirmed payment; cover webhooks with tests. |
| [CU-86e2dcjzy](https://app.clickup.com/t/86e2dcjzy) — Prevent overselling | Urgent: inventory is neither rechecked nor decremented atomically after payment. Depends on the payment-state model. | Atomically validate/decrement inventory once per paid Stripe session and handle unfulfillable paid orders safely. |

### 2. Customer-data security

| Ticket | Why next | Required outcome |
| --- | --- | --- |
| [CU-86e2dcjzz](https://app.clickup.com/t/86e2dcjzz) — Secure cart and order data | High: cart IDs can expose or modify PII, and analytics sends PII before consent. | Scoped cart access, no browser PII leakage, no PII analytics events, consent enforcement, and authorization tests. |

### 3. Repeatable engineering gate

| Ticket | Why next | Required outcome |
| --- | --- | --- |
| [CU-86e2dck00](https://app.clickup.com/t/86e2dck00) — Test, type-check, and CI release gate | High: the current typecheck is affected by stale generated files and no reliable automated release gate exists. | Clean-state typecheck; CI lint/typecheck/build; critical payment, inventory, security, and storefront tests. |

### 4. Customer-facing checkout readiness

| Ticket | Dependency and scope | Required outcome |
| --- | --- | --- |
| [CU-86e2dcjw2](https://app.clickup.com/t/86e2dcjw2) — Contact and Shipping & Pickup pages | Establishes accurate operational content and fixes footer destinations. Obtain the business's verified pickup details. | Reachable contact and shipping/pickup pages with working desktop/mobile footer links. |
| [CU-86e2dck01](https://app.clickup.com/t/86e2dck01) — Legal, returns, privacy, and pickup policies | Depends on verified operational details from the contact/pickup work and business/legal-owner review. | Accurate linked policy pages whose claims match checkout, email, and analytics behavior. |
| [CU-86e2dcjw1](https://app.clickup.com/t/86e2dcjw1) — Cart-to-checkout QA | Run after payment, inventory, policy, and fulfillment changes. Requires explicit authorization for safe test-order/refund activity. | Repeatable end-to-end checklist validating checkout, payment, confirmation, stock, and fulfillment behavior. |

### 5. Product and admin usability

| Ticket | Implementation focus |
| --- | --- |
| [CU-86e2dcm4v](https://app.clickup.com/t/86e2dcm4v) — Restore featured-product controls | Read `isFeatured` from product create/update form data and verify persistence. |
| [CU-86e2dcm4w](https://app.clickup.com/t/86e2dcm4w) — Fix Orders navigation active state | Derive the active state from the current admin route. |
| [CU-86e2dcjw3](https://app.clickup.com/t/86e2dcjw3) — Strengthen salon and pickup conversion information | After the homepage-design review, add verified address, hours, contact, directions, and differentiated appointment/pickup paths. |

## Per-ticket execution workflow

1. Confirm the ticket description, acceptance criteria, dependencies, and any authority needed before starting.
2. Create `codex/CU-{ticket-id}-{short-description}` from current `main` and set the matching ticket to **In Development**.
3. Limit changes, documentation, verification, commits, and pull request to that single ticket.
4. Run the checks relevant to the changed code; record results and limitations on the ticket.
5. Open a draft pull request containing `CU-{ticket-id}`, then move the ticket to **In Review**.
6. Move the ticket to **Shipped** only after merge to `main` or explicit user-directed closure.

## Authority boundaries

No ticket authorizes production deployment, real card charges, sending real email, refunds, or production-data mutation without explicit user approval. Legal and policy text also requires business/legal-owner review before publishing.
