## Why

The item detail overlay can be closed with on-screen controls, but it cannot be dismissed from the keyboard. Adding an `Escape` shortcut makes the detail workflow faster and more consistent for keyboard-driven use.

## What Changes

- Add keyboard dismissal for the item detail overlay when an item detail view is open.
- Treat the keyboard shortcut as equivalent to the existing close action so the user returns to the overview with the same state and status messaging.
- Limit the shortcut to the active detail overlay so it does not affect the overview when no detail view is open.

## Capabilities

### New Capabilities
- `detail-view-keyboard-dismissal`: Allow users to close the item detail overlay with the keyboard while preserving the current overview workflow.

### Modified Capabilities

## Impact

- Affected code: `src/components/parking-lot-app.tsx`
- Affected behavior: detail overlay interaction and keyboard accessibility
- No API, persistence, or dependency changes
