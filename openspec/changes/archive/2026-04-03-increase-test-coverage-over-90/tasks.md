## 1. Coverage Setup

- [x] 1.1 Add a dedicated coverage test script that runs the suite with coverage enabled and reports statement, branch, function, and line metrics for targeted first-party source files.
- [x] 1.2 Configure coverage inclusion and exclusion so framework output, generated files, and other non-target code do not count toward the enforced threshold.
- [x] 1.3 Enforce a greater-than-90% threshold in the coverage workflow and document any required Node version assumptions for reliable local execution.

## 2. Library Unit Tests

- [x] 2.1 Add direct unit tests for validation and schema modules under `src/lib/` covering both accepted and rejected inputs.
- [x] 2.2 Add unit tests for item and comment domain operations under `src/lib/` covering normal flows, conflict cases, and branch-heavy edge conditions.
- [x] 2.3 Add unit tests for shared API and MCP helper modules under `src/lib/` to verify observable outputs and error shaping.
- [x] 2.4 Audit targeted source files and create direct unit tests for every exported function that does not yet have explicit behavioral coverage.

## 3. Route and Adapter Tests

- [x] 3.1 Add direct tests for the item API route handlers under `src/app/api/items/` using isolated temporary databases instead of a booted dev server.
- [x] 3.2 Add direct tests for comment, archive, resolve, unarchive, and event-related route handlers covering successful and failing responses.
- [x] 3.3 Expand MCP adapter tests so tool dispatch, validation failures, and shared item/comment semantics are covered without relying on broad end-to-end setup.
- [x] 3.4 Add direct unit tests for every exported component and app entry component in scope, covering rendering and interaction behavior through their public interfaces.

## 4. Integration Hardening

- [x] 4.1 Keep a minimal set of cross-layer smoke tests for item lifecycle and comment workflows through public interfaces.
- [x] 4.2 Refactor the existing integration-oriented tests to avoid collisions with already-running local `next dev` processes where practical.
- [x] 4.3 Run the full coverage workflow, close the remaining gaps, and confirm the enforced metrics stay above 90%.
