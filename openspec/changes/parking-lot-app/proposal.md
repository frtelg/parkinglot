## Why

Knowledge work now spans multiple parallel tasks, especially when AI tools increase the number of active threads. A lightweight local-first parking lot application gives users a clear visual overview of active work so they can reduce cognitive load, preserve context, and decide what to continue, resolve, or drop, while preserving a clean path to future hosted and native clients.

## What Changes

- Add a local-first parking lot application that runs fully on one machine with local persistence and no required external services in v1.
- Add a parking lot workflow for creating, viewing, editing, resolving, archiving, and unarchiving work items without supporting hard deletion in v1.
- Add a visual-first user interface with separate Active, Resolved, and Archived views, plus a navigable item detail experience optimized for desktop and mobile layouts.
- Add comment support so users and agents can attach running context to each item, including comment editing and soft deletion.
- Add a REST API for item CRUD, item listing, comment create/edit/soft-delete operations, and explicit lifecycle transitions.
- Add agent-agnostic integration surfaces, including shared skills and MCP support where needed, so different AI agents can operate on the parking lot consistently with read/write access by default.
- Preserve stable API and domain boundaries so future server-hosted, macOS, iOS, and Android clients can reuse the same core contracts.

## Capabilities

### New Capabilities
- `parking-lot-items`: Manage parking lot items, their lifecycle states, and the primary overview/detail experience.
- `parking-lot-comments`: Attach and read comment history on individual parking lot items.
- `parking-lot-api`: Expose REST endpoints for item and comment operations.
- `agent-workflow-integration`: Provide agent-agnostic skills and MCP-facing integration for interacting with the parking lot.

### Modified Capabilities

## Impact

- Adds a new end-user workflow centered on local work-item tracking and detail navigation.
- Introduces new backend domain models, local persistence, REST endpoints, and application state transitions.
- Introduces frontend views and interaction patterns for Active, Resolved, and Archived item management plus item discussion.
- Adds shared AI-agent integration assets so external agents can create, update, comment on, resolve, archive, unarchive, and inspect parking lot items safely.
- Establishes API-first boundaries so the app can later move from local-only operation to hosted and native-client usage without redefining core item behavior.
