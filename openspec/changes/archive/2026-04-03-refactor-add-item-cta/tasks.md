## 1. Overview CTA Refactor

- [x] 1.1 Replace the collapsed add-item summary markup in `src/components/parking-lot-app.tsx` with a button-first call to action plus concise supporting copy.
- [x] 1.2 Keep the expanded create form inline and preserve the existing open, close, submit, and cancel behavior for item creation.

## 2. Visual Styling

- [x] 2.1 Update `src/components/parking-lot-app.module.css` so the add-item trigger no longer shares a card-like presentation with overview surfaces.
- [x] 2.2 Add accent styling for the add-item button, including hover, focus, disabled, and mobile layouts, without changing the styling of other primary actions.

## 3. Verification

- [x] 3.1 Update or add component tests that cover the new collapsed add-item presentation and the existing expand/collapse flow.
- [x] 3.2 Run the relevant test suite and confirm the add-item control remains visually distinct from list items while item creation still works.
