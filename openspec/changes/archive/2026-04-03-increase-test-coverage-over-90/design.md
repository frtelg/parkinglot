## Context

The repository currently relies on a small Node test suite that exercises the running Next.js app and MCP entrypoint end to end. That gives some confidence in the happy path, but it leaves most application branches unmeasured, does not produce a coverage report, and is fragile because it depends on a running dev server and a Node version compatible with the native `better-sqlite3` build.

The codebase is small and centered on library modules under `src/lib/`, route handlers under `src/app/api/items/`, and a single interactive UI in `src/components/parking-lot-app.tsx`. Reaching greater than 90% coverage should come primarily from unit tests around pure or mostly pure logic, with a smaller layer of integration tests preserving confidence in the full stack behavior. The change also requires explicit unit coverage for every exported function and every exported component in scope.

## Goals / Non-Goals

**Goals:**
- Produce repeatable coverage metrics for local development and CI.
- Raise coverage above 90% for statements, branches, functions, and lines on the targeted application code.
- Shift most verification to fast unit tests for `src/lib/*`, route modules, and MCP-facing logic.
- Add direct unit tests for every exported function and every exported component, covering each exported surface's intended behavior rather than only smoke rendering.
- Preserve a small number of end-to-end style tests for cross-layer behavior.
- Make test execution less sensitive to unrelated local processes and environment drift.

**Non-Goals:**
- Achieve 100% coverage for generated files, framework glue, or trivial wrappers.
- Replace every integration test with mocks.
- Redesign the application architecture solely for testing.
- Add broad browser UI automation unless unit and module coverage cannot reach the threshold.

## Decisions

### Use the built-in Node test runner and native coverage first
The project already uses `node --test`, and the runtime constraint in `package.json` already requires modern Node. The first choice is to extend that toolchain with Node's coverage support instead of adopting a separate framework immediately. This keeps the test stack minimal and reduces migration cost.

Alternatives considered:
- Add Vitest immediately: better mocking ergonomics, but it introduces more tooling change than is necessary for this repo size.
- Add Jest: mature, but heavier and less aligned with the current Node-native setup.

### Concentrate unit tests around module seams, not component snapshots
Most business behavior lives in `src/lib/*` and route handlers that can be invoked directly with controlled inputs. The design will favor direct tests of schemas, item/comment operations, route handler responses, API error shaping, MCP adapter behavior, and exported component behavior, instead of broad snapshot tests for the UI.

Alternatives considered:
- Heavy React snapshot coverage: easy to add, but weak at asserting meaningful behavior and brittle across UI changes.
- Browser-first coverage: useful for user journeys, but too slow and coarse to efficiently drive branch coverage above 90%.

### Isolate storage and process boundaries for deterministic tests
Current failures show that native-module ABI mismatches and competing `next dev` processes can break the suite. The implementation should prefer tests that import modules directly, use isolated temporary databases, and avoid booting the full dev server unless a scenario truly requires it.

Alternatives considered:
- Keep coverage work centered on existing integration tests: simpler in the short term, but too fragile to sustain a strict coverage gate.
- Mock storage entirely: faster, but would miss real SQLite-backed behavior that is central to the project.

### Enforce coverage on application code rather than framework output
Coverage thresholds should target first-party source files that represent product behavior. Framework-generated files, dev-only outputs, and incidental bootstrapping should be excluded so the coverage gate reflects actual engineering value.

Alternatives considered:
- Global repository-wide threshold including all files: easier to configure, but misleading because it penalizes framework scaffolding and generated output.
- No enforced threshold, report only: weaker because it does not prevent regressions.

## Risks / Trade-offs

- [Coverage target drives low-value tests] → Mitigation: prioritize branch-heavy business logic and route behavior before adding superficial assertions.
- [Requirement to test every export increases test count] → Mitigation: keep tests behavior-focused, colocate helpers where useful, and avoid duplicate assertions across layers.
- [Native SQLite setup still causes test instability] → Mitigation: standardize on the repo's supported Node version and keep most tests in-process with isolated temporary databases.
- [Route tests become too tightly coupled to implementation details] → Mitigation: assert observable request/response behavior and persisted outcomes rather than internal helper calls.
- [UI remains the least-covered area] → Mitigation: cover stateful client logic where practical, but explicitly focus the threshold on targeted core application code if full UI coverage is not cost-effective.

## Migration Plan

1. Add coverage scripts and reporting configuration.
2. Expand unit tests until every exported function and exported component in scope has direct behavioral coverage.
3. Add direct route handler tests with isolated database setup.
4. Reduce reliance on booted `next dev` flows to a small smoke layer.
5. Enable strict coverage thresholds once the suite consistently exceeds 90%.

Rollback strategy: remove the strict threshold from the test script while keeping any useful new tests if the gate proves too brittle during rollout.

## Open Questions

- Whether any exported UI entrypoints require a lightweight React-focused test dependency to satisfy the every-component unit-test requirement cleanly.
- Whether Node's native coverage output alone is sufficient for the team's preferred reporting format, or if an additional coverage reporter is needed.
