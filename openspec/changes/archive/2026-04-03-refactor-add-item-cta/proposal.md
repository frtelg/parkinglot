## Why

The current add-item entry point reads too much like another item in the overview, which makes the primary creation action easy to misinterpret. This is worth addressing now because item capture should stay obvious without competing with the list itself.

## What Changes

- Refactor the add-item entry point in the overview so the collapsed state is a compact button instead of a card-like summary block.
- Give the add-item button a more intentional accent treatment so it stands out as the primary creation action.
- Preserve the existing progressive disclosure pattern by keeping the full create form hidden until the user chooses to add an item.
- Keep item creation behavior, validation, and submission flow unchanged while updating the presentation and affordance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `parking-lot-items`: refine the overview creation affordance so the collapsed add-item control is visually distinct from list items and uses accent styling to make the action easier to find.

## Impact

- Affected code: `src/components/parking-lot-app.tsx`, `src/components/parking-lot-app.module.css`
- Affected behavior: overview presentation of the add-item control in the web UI
- No API, schema, database, or dependency changes
