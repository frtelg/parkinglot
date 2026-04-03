## Why

The Active view currently orders items by recent activity, which makes it hard to keep a deliberate working sequence when several active threads matter at once. Persisted drag-and-drop ordering lets the user shape the active queue to match how they want to work and keep that order across reloads and restarts.

## What Changes

- Allow users to reorder active items directly in the overview with drag-and-drop.
- Persist the active-item order so the chosen sequence remains stable across refreshes, app restarts, and later detail or comment activity.
- Update the Active view ordering rules so manual order takes precedence over recency when a persisted order exists.

## Capabilities

### New Capabilities

### Modified Capabilities
- `parking-lot-items`: Change Active view ordering from recency-first to persisted user-controlled ordering with drag-and-drop interaction.

## Impact

- Affected code: active item persistence and ordering in `src/lib/items.ts`, item schemas, item API routes, and `src/components/parking-lot-app.tsx`
- Affected behavior: Active overview ordering and interaction model
- Likely local data model change to persist item position
- No external service dependency required
