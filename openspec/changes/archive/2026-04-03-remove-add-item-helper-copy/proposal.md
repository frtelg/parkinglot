## Why

The current collapsed add-item CTA includes helper copy that does not add meaningful guidance and only increases visual noise. This is worth cleaning up now because the CTA is already visually distinct, so the redundant sentence makes the overview feel busier without improving clarity.

## What Changes

- Remove the non-value-add helper sentence from the collapsed add-item CTA state.
- Keep the add-item button and inline create form behavior unchanged.
- Preserve any useful expanded-state guidance only if it still helps the open form state.
- Leave item creation logic, API behavior, and persistence unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `parking-lot-items`: refine the add-item overview presentation so the collapsed CTA does not include redundant helper copy that competes with the primary action.

## Impact

- Affected code: `src/components/parking-lot-app.tsx`, related tests, and possibly minor styles
- Affected behavior: collapsed add-item CTA presentation in the overview
- No API, schema, dependency, or database changes
