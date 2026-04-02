## 1. Phase 1: Local MVP Core

- [x] 1.1 Bootstrap the application stack, TypeScript configuration, and local development scripts for a single full-stack web app
- [x] 1.2 Add the local persistence layer and create the initial schema for items and comments, including authorship and soft-delete metadata
- [x] 1.3 Define shared domain types and validation rules for item, comment, and lifecycle payloads
- [x] 1.4 Implement item domain services for create, read, update, list, resolve, archive, and unarchive behavior without hard deletion
- [x] 1.5 Add REST endpoints for item CRUD, lifecycle actions, and lifecycle-view filtering
- [x] 1.6 Build the responsive overview layout with separate Active, Resolved, and Archived views and clear lifecycle visual states
- [x] 1.7 Build the item creation, editing, and detail flows with lifecycle actions and low-friction interactions
- [x] 1.8 Ensure the Active view defaults to most-recently-updated ordering and that resolved and archived items stay out of the default view
- [x] 1.9 Validate the end-to-end item workflow for active, resolved, archived, and unarchived items across desktop and mobile layouts

## 2. Phase 2: Comments And UX Hardening

- [x] 2.1 Implement comment domain services for creating, editing, soft-deleting, and listing item comments with authorship metadata
- [x] 2.2 Add REST endpoints for comment create, edit, and soft-delete actions
- [x] 2.3 Build the chronological comment timeline UI with edit and soft-delete actions
- [x] 2.4 Add loading, empty, and error states that keep the interface understandable under common edge cases
- [x] 2.5 Improve mobile navigation, focus handling, labels, and state announcements for accessible day-to-day use
- [x] 2.6 Add API tests covering lifecycle transitions, Active/Resolved/Archived views, comment editing, and comment soft deletion
- [x] 2.7 Validate offline local usage and single-user multi-window behavior without data corruption

## 3. Phase 3: Agent And Portability Layer

- [x] 3.1 Document local-only runtime expectations, local data location, and the boundary that keeps future hosted/native clients viable
- [x] 3.2 Refine shared domain services so REST, MCP, and future clients reuse the same core item and comment semantics
- [x] 3.3 Create agent-agnostic skill definitions for reading, creating, updating, resolving, archiving, unarchiving, and commenting on items with read/write access by default
- [x] 3.4 Implement an MCP adapter that exposes the same item and comment operations through structured tools
- [x] 3.5 Document the API and agent integration contracts so future hosted and native clients can reuse the same core semantics
- [x] 3.6 Refine visual hierarchy, spacing, interaction feedback, and contributor documentation for long-term maintainability
