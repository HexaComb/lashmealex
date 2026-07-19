# ADR 0001: Ticket-isolated branches and ClickUp status transitions

- Status: Accepted
- Date: 2026-07-18
- Decision ticket: [CU-86e2dcnhh](https://app.clickup.com/t/86e2dcnhh)

## Context

Lashmealex changes need a traceable path from their ClickUp ticket through the branch, commits, pull request, verification, and final completion state. The repository workflow calls the final state "Done," while this ClickUp list uses `Shipped` as its only done-type status.

## Decision

- Each implementation or standalone documentation task has one ClickUp ticket, one dedicated branch, one cohesive commit series, and one pull request.
- Branches begin from current `main` and use `codex/CU-{ticket-id}-{short-description}`.
- The ClickUp sequence is **In Development** when work starts, **In Review** on pull-request creation, then **Shipped** after merge to `main` or explicit user-directed closure.
- `Shipped` is the Lashmealex list's terminal equivalent to the repository guidance's "Done" state.

## Consequences

The workflow prevents unrelated changes from sharing a pull request, creates a reliable audit trail, and resolves the status-name mismatch without changing the list configuration. It also requires a separate ticket for repository-wide process or documentation work that is not part of a product ticket.
