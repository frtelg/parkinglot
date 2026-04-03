## Why

The UI only refreshes when the current window performs the action itself, so items added through the API from another client or process stay invisible until the user manually reloads or switches views. That breaks the local multi-window workflow the app already supports and makes the overview feel stale.

## What Changes

- Add automatic overview refresh when new items are created through the API by another local client or process.
- Update the client refresh behavior so the current lifecycle view can pick up externally-created items without disrupting the current reading flow.
- Preserve explicit detail opening rules while allowing the overview list to stay current in the background.

## Capabilities

### New Capabilities

### Modified Capabilities
- `parking-lot-items`: extend overview behavior so newly created items added through the API become visible automatically without requiring manual refresh.

## Impact

- Affects `src/components/parking-lot-app.tsx` refresh behavior and background synchronization logic.
- Adds a lightweight server-sent events stream so the client can react to external item creation without polling.
- Requires a delta spec for `parking-lot-items` describing automatic overview refresh behavior.
