## 1. Detail Overlay Keyboard Dismissal

- [x] 1.1 Update `src/components/parking-lot-app.tsx` to register an `Escape` key handler only while an item detail overlay is open.
- [x] 1.2 Route the `Escape` key handler through the existing `closeDetail` workflow so keyboard dismissal matches the current close controls.

## 2. Verification

- [x] 2.1 Add or update UI tests to cover closing the detail overlay with `Escape` and leaving the overview unchanged when no detail is open.
- [x] 2.2 Run the relevant test command for the parking lot app and confirm the keyboard dismissal behavior passes.
