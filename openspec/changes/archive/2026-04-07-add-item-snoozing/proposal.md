## Why

The current lifecycle model only lets an item stay active, move to resolved, or disappear into archive, which makes it awkward to temporarily put work aside without losing track of when it should matter again. Snoozing gives the user a deliberate way to pause an active item, keep it visible in a separate list, and let it return to active work automatically when the snooze period ends.

## What Changes

- Add a snooze lifecycle flow for active items so a user can pause an item until a chosen future time.
- Add a separate Snoozed list that shows items waiting for their wake-up time instead of mixing them into Active or Archived.
- Automatically return expired snoozed items to the Active list without requiring manual restore work.
- Extend the shared REST and MCP surfaces so snoozed items and snooze actions behave consistently outside the web UI.

## Capabilities

### New Capabilities

### Modified Capabilities
- `parking-lot-items`: Add a snoozed lifecycle state in the overview and detail workflow, including automatic return to Active after the snooze period expires.
- `parking-lot-api`: Extend item list and lifecycle APIs to support snoozed items and snooze requests with a future wake-up time.
- `agent-workflow-integration`: Extend shared agent and MCP workflows so agents can list and snooze items with the same lifecycle semantics as the application.

## Impact

- Affected code: item persistence and lifecycle logic in `src/lib/items.ts`, local schema and migrations in `src/lib/database.ts`, item schemas/contracts, API routes, MCP tool definitions, and `src/components/parking-lot-app.tsx`
- Affected behavior: lifecycle tabs, item detail actions, item list filtering, and automatic re-entry into the Active queue after snooze expiry
- Likely local data model change to store snooze timing metadata and normalize expired snoozed items during reads
- No external service dependency required
