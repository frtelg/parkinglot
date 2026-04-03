## Context

The repository does not yet contain an application codebase, so this change needs to define an initial architecture instead of extending an existing stack. The product goal is a lightweight but polished parking lot application that helps users manage parallel work with a visual overview, item detail workflow, comments, lifecycle controls, and automation-friendly access for AI agents.

The app needs both a user-facing interface and a machine-facing API. Because the requested workflow is centered on quick capture and low-friction review, the first version should optimize for local simplicity, fast iteration, full offline-capable local use after setup, and a responsive master-detail experience rather than multi-user complexity or enterprise workflow features.

## Goals / Non-Goals

**Goals:**
- Deliver a single local-first web application with both UI and REST API.
- Model item lifecycle explicitly: active, resolved, and archived.
- Support comments as persistent context on each item.
- Provide a fast, scannable overview with separate Active, Resolved, and Archived views plus a clear detail panel optimized for desktop and mobile.
- Expose stable API contracts that can also be used by shared agent skills, an MCP adapter, and future hosted or native clients.
- Keep the first implementation operational in a local development environment with minimal infrastructure and no required external services.
- Preserve architectural boundaries so server hosting and future macOS, iOS, and Android clients remain straightforward follow-on work.

**Non-Goals:**
- Multi-user collaboration, presence, or per-user permissions in the first version.
- Realtime synchronization across browsers.
- Complex workflow concepts such as priorities, due dates, labels, text search, or board drag-and-drop unless later requested.
- Building dedicated macOS, iOS, or Android clients in v1.
- Choosing a future desktop-wrapper or native-mobile stack now.
- Long-term hosted infrastructure decisions beyond a clean upgrade path from local persistence.

## Decisions

### Treat local-only operation as a hard v1 runtime requirement
Run the first version entirely on one machine, with local persistence and no required external network services for normal operation.

Rationale:
- This matches the confirmed v1 requirement and keeps the initial setup simple.
- Local-only operation reduces operational overhead while the workflow is still being shaped.

Alternatives considered:
- Hosted-first deployment: useful later, but unnecessary for the initial personal workflow use case.

### Use a single TypeScript full-stack app with Next.js
Build the first version as a Next.js application using React and TypeScript, with App Router pages for the UI and route handlers for the REST API.

Rationale:
- A single app keeps the initial codebase small and reduces coordination overhead between frontend and backend.
- Route handlers satisfy the REST requirement without standing up a second server.
- React is well-suited for a visual, interactive master-detail workflow.
- Next.js makes responsive UI, server-side reads, and future deployment options straightforward.

Alternatives considered:
- Separate React frontend plus Node API: clearer separation, but unnecessary overhead for an initial greenfield app.
- Remix or plain Vite plus Express: viable, but provides less convention for a quick full-stack bootstrap in this repo.

### Use SQLite-backed relational persistence with an upgrade path
Store items and comments in SQLite for the first version, with a schema that can migrate to Postgres later with minimal domain changes.

Suggested core model:
- `items`: `id`, `title`, `details`, `status`, `archived_at`, `resolved_at`, `created_at`, `updated_at`
- `comments`: `id`, `item_id`, `body`, `author_type`, `author_label`, `deleted_at`, `created_at`, `updated_at`

Rationale:
- SQLite keeps local setup simple and removes the need for external services during initial implementation.
- The relational model cleanly represents one-to-many comments and lifecycle timestamps.
- Separate `status` and archive metadata avoid ambiguous state transitions.

Alternatives considered:
- JSON file storage: simpler at first, but weaker for filtering, validation, and future API evolution.
- Postgres from day one: stronger production story, but too much setup cost for an initial local-first version.

### Model lifecycle as explicit item state plus archive metadata
Represent item lifecycle using a non-archived working state (`active` or `resolved`) plus an archive flag/timestamp.

Behavioral rules:
- New items start as `active`.
- Resolving an item changes working state to `resolved`.
- Archiving an item sets archive metadata without deleting item data or comments.
- Unarchiving restores the item to its prior working state.

Rationale:
- This supports the user requirement that archived does not necessarily mean resolved.
- Preserving the prior working state avoids lossy transitions.

Alternatives considered:
- Single enum with `active`, `resolved`, `archived`: simpler schema, but loses whether an archived item had been resolved before archive.

### Use a responsive master-detail interface
Design the UI around a list-first overview with a detail pane on larger screens and a stacked navigation flow on smaller screens.

UI shape:
- Desktop: left-side overview list, right-side detail panel.
- Mobile: overview list transitions to a dedicated detail screen or sheet.
- Top-level item views are separated into Active, Resolved, and Archived.
- The default view is Active, ordered by most recently updated first.
- Item rows/cards show title, current state, recent activity, and subtle visual priority cues.
- Item detail shows title, details, lifecycle actions, and comment timeline in a stable layout.

Rationale:
- This directly matches the requested click-from-list-to-details workflow.
- Master-detail minimizes navigation cost for users switching across many active items.
- Responsive adaptation preserves usability without creating separate products.

Alternatives considered:
- Kanban board first: visually appealing, but not necessary for the requested requirements and may add noise for a simple parking lot.
- Modal-only details: faster to build, but weaker for comments and extended item context.

### Preserve an API-first boundary for future hosted and native clients
Keep domain services and API contracts independent from the web UI so the same item and comment behavior can later be consumed by a hosted deployment or dedicated macOS, iOS, and Android clients.

Rationale:
- This directly supports the confirmed requirement to keep the app local-only for now while staying ready for broader deployment targets later.
- Stable contracts reduce rewrite risk if a future client is not built with the same UI technology.

Alternatives considered:
- Tightly coupling business rules to the web layer: faster initially, but creates avoidable migration work later.

### Expose explicit REST endpoints around resources and actions
Provide resource endpoints for CRUD and comment creation, plus focused action endpoints for lifecycle transitions.

Initial endpoint shape:
- `GET /api/items`
- `POST /api/items`
- `GET /api/items/:id`
- `PATCH /api/items/:id`
- `POST /api/items/:id/comments`
- `PATCH /api/items/:id/comments/:commentId`
- `DELETE /api/items/:id/comments/:commentId`
- `POST /api/items/:id/resolve`
- `POST /api/items/:id/archive`
- `POST /api/items/:id/unarchive`

Filtering support on collection reads:
- `view=active|resolved|archived`

Rationale:
- This keeps the API easy to understand for both UI code and AI agents.
- Action endpoints make lifecycle transitions explicit instead of overloading generic patch semantics.

Alternatives considered:
- Pure REST via `PATCH /api/items/:id`: possible, but less discoverable for agents and weaker for future auditability.

### Use shared service functions beneath both UI/API and agent integrations
Implement item and comment behavior in a domain service layer that is called by REST handlers and any MCP adapter.

Rationale:
- Shared domain services keep business rules consistent across direct API use and agent-driven workflows.
- MCP should act as a transport adapter, not a second implementation of item logic.

Alternatives considered:
- Calling REST endpoints from the MCP server: simple, but introduces unnecessary loopback coupling inside the same repo.

### Support single-user multi-window local usage without realtime guarantees
Assume one local user may open multiple windows or tabs, and design persistence plus data reads so this does not corrupt data, while not promising full realtime synchronization in v1.

Rationale:
- This matches the expected local usage pattern.
- It keeps the implementation pragmatic while still protecting data integrity.

Alternatives considered:
- Single-window assumption only: too restrictive for normal local browser usage.
- Full realtime sync: valuable later, but unnecessary for v1.

### Keep item removal conservative and comment removal recoverable
Do not implement hard deletion for items in v1. Allow comments to be edited and soft-deleted instead of permanently destroyed.

Rationale:
- Archiving already satisfies the main item-removal use case without losing context.
- Soft-deleting comments preserves context and auditability while still allowing cleanup.

Alternatives considered:
- Hard delete for items and comments: simpler to reason about in code, but weaker for context preservation.

### Add agent-facing integrations in two layers
Provide:
- Agent-agnostic skill definitions that describe how to create, inspect, update, resolve, archive, unarchive, and comment on items.
- An MCP adapter exposing equivalent structured operations for agents that need tool transport instead of direct HTTP access.

Rationale:
- Different agents integrate in different ways; documenting shared workflows and exposing tool operations covers both paths.
- This preserves a single product surface while avoiding agent-specific behavior in core application code.

Alternatives considered:
- Skills only: insufficient for runtimes that depend on MCP.
- MCP only: misses lightweight agent environments that can work directly from skill instructions plus HTTP.

### Keep authentication out of the first version
Do not introduce authentication until a real multi-user or remote-hosted use case demands it.

Rationale:
- The current request is focused on personal workflow clarity and agent interoperability, not account management.
- Avoiding auth reduces implementation time and keeps the first version easier to validate.

Alternatives considered:
- Add local-only auth anyway: not justified by the current requirements.

## Risks / Trade-offs

- [SQLite may become limiting in a multi-user hosted deployment] -> Keep the schema and data-access layer portable so storage can move to Postgres later.
- [Action endpoints increase route count] -> Keep lifecycle transitions explicit and centralize transition rules in a service layer to avoid drift.
- [Local-only v1 can tempt web-layer shortcuts] -> Keep API and domain boundaries explicit even before hosting is needed.
- [A highly polished UX can expand scope quickly] -> Start with a strong master-detail foundation, careful spacing, responsive states, and accessibility before adding decorative complexity.
- [MCP support may diverge from REST behavior] -> Reuse the same domain service methods and response schemas under both adapters.
- [No auth means data is only suitable for trusted/local environments initially] -> Treat authentication as a follow-up capability once deployment context is defined.
- [Soft-deleted comments can complicate comment rendering] -> Define a single default behavior for hidden versus visible deleted comments and reuse it across UI and API responses.

## Migration Plan

1. Bootstrap the application shell, database schema, and local development environment.
2. Implement domain services and REST endpoints for items, comments, and lifecycle actions.
3. Implement the responsive UI against the same API contracts.
4. Add shared agent skills and MCP adapter on top of the domain service layer.
5. Validate offline local workflows, multi-window integrity, manual item flows, and automated API tests before broader rollout.

Rollback strategy:
- Because this is a net-new application, rollback is equivalent to not deploying the new app or reverting the introducing change set.
- Keep database migrations reversible during early development.

## Open Questions

- The soft-delete presentation for comments remains an implementation detail: deleted comments may be hidden from the normal timeline or shown as lightweight placeholders, but the underlying record must remain recoverable.
