## Why

The project has only a small set of end-to-end style tests, no coverage reporting, and no practical way to enforce a coverage target. Adding broad unit test coverage now will make refactoring safer and establish a measurable quality bar for the core application logic.

## What Changes

- Add automated coverage reporting for the repository test suite.
- Expand unit test coverage across core library modules, API route handlers, and MCP-facing logic.
- Add unit tests for every exported function and every component, with assertions that cover each exported surface's full intended behavior.
- Define a repeatable path to reach and maintain greater than 90% coverage for statements, branches, functions, and lines on the targeted codebase.
- Keep the existing integration-style tests, but rebalance the suite so most behavioral verification runs through focused unit tests.

## Capabilities

### New Capabilities
- `test-coverage-enforcement`: Measure, report, and enforce high automated test coverage for the project's core application behavior.

### Modified Capabilities

## Impact

- Affected code: `test/*.test.mjs`, `src/lib/*`, `src/app/api/items/**/*.ts`, `src/app/api/items/events/route.ts`, all exported components under `src/components/` and `src/app/`, and related test/config files.
- Tooling: test runner configuration, coverage output generation, and CI/local developer workflow for validating coverage.
- Dependencies: may require adding a test-focused dependency only if the built-in Node test tooling is insufficient for reliable coverage and unit isolation.
