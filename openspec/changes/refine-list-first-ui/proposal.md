## Why

The current interface gives too much weight to the hero and always-open create flow, while also preloading item detail before the user explicitly selects anything. The next iteration should make the item list the clear primary surface, require an intentional click before opening detail, and reduce the overall visual noise.

## What Changes

- Refine the parking lot UI so the overview list is the dominant element on first load across desktop and mobile.
- Change item detail behavior so no item is auto-opened on initial load or when switching between Active, Resolved, and Archived views.
- Keep the desktop split-view layout, but show detail only after the user clicks an item from the list.
- Replace the always-expanded new-item composer with a compact add-item affordance that expands on demand.
- Reduce the size and emphasis of the hero section and tone down bright or highly elevated surfaces to create a quieter interface.

## Capabilities

### New Capabilities

### Modified Capabilities
- `parking-lot-items`: adjust the overview/detail workflow so detail opens only from explicit item selection, the list is more prominent by default, and the create flow becomes progressively disclosed.

## Impact

- Affects `src/app/page.tsx` initial selection bootstrapping.
- Affects `src/components/parking-lot-app.tsx` selection, view-switch, mobile-detail, and create-composer behavior.
- Affects `src/components/parking-lot-app.module.css` layout, hierarchy, and surface styling for hero, sidebar, list cards, and create UI.
- Requires a delta spec for `parking-lot-items` to capture the updated interaction requirements.
