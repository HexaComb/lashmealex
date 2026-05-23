# 🤖 AI Agent Guidelines & Software Engineering Best Practices

This document serves as the single source of truth for code standards, architectural decisions, and interaction protocols for all engineers and AI tooling working on this project. Adherence to these guidelines ensures maintainability, predictability, and collaboration efficiency.

## ⚙️ I. Development Workflow & Tooling (For All Engineers)

These rules govern *how* work gets done and committed.

### A. Commit Hygiene (Atomic Commits)
*   **Atomicity is King:** Every commit must represent one logical, isolated change (e.g., "Fix X bug," "Implement Y feature," "Refactor Z class"). Never mix unrelated changes.
*   **Commit Message Format:** Use a structured, descriptive message following the [Conventional Commits](https://www.conventionalcommits.org/) standard (e.g., `feat: add user authentication endpoint` or `fix(api): resolve null pointer in service layer`).
*   **Commit Frequency:** Commit small, tested changes frequently.

### B. Code Structure & Isolation
*   **Separation of Concerns:** Keep backend logic, frontend UI components, and configuration files strictly separated.
*   **Scaffolding:** When adding major features, follow a phased approach:
    1.  Commit 1: Scaffolding/API Contracts (e.g., defining interfaces or mock endpoints).
    2.  Commit 2: Core Business Logic/Backend Implementation.
    3.  Commit 3: Storefront/UI Integration & Testing.
    4.  Commit 4: Cleanup and Refactoring.

## ✨ II. Code Quality & Style Guide (For All Engineers)

*   **Readability Over Cleverness:** Code should be immediately understandable by a developer unfamiliar with the module. Prefer explicit over implicit.
*   **Documentation:**
    *   **Public APIs/Functions:** Must include a docstring detailing **What** it does, **Why** it exists (context), **Parameters** (`@param`), **Returns** (`@return`), and **Raises** (`@throws`).
    *   **READMEs:** Every directory containing core logic must have a `README.md` explaining its purpose and how to run tests/examples.
*   **Testing:** No code can be merged without corresponding unit/integration tests that achieve >80% coverage.

## 🧠 III. AI Agent Interaction Protocols (For LLMs & Agents)

This section dictates how AI agents should operate to maintain code integrity.

### A. Mandate of Confirmation
*   **No Blind Edits:** An AI agent must **never** unilaterally modify source code. All proposed changes must be presented to a human reviewer first.
*   **Change Preview:** When proposing edits, the agent *must* use `view_diff` or provide a clear, inline patch format showing only the additions/removals.

### B. Task Decomposition
*   **Plan First:** For complex tasks, the agent must generate an explicit, step-by-step execution plan and await confirmation before writing any code or running any commands.
*   **Tool Usage Documentation:** If the agent needs to use a specific tool (e.g., `read_file`, `grep_search`), it must state *why* that tool is necessary for the current step.

### C. Handling Ambiguity
*   If the context is insufficient to complete a task safely, the agent must halt execution and ask a clarifying question, citing the ambiguity. **Guessing is prohibited.**

### D. Deployment Restrictions
*   **Never Deploy:** An AI agent must **never** deploy the application or infrastructure on behalf of the user. All deployments must be explicitly initiated and handled by the user.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
