## 1. CTA Copy Cleanup

- [x] 1.1 Remove the collapsed-state helper sentence from the add-item CTA area in `src/components/parking-lot-app.tsx`.
- [x] 1.2 Preserve the existing add-item button behavior and any useful expanded-state helper text when the inline form is open.

## 2. Verification

- [x] 2.1 Update component tests so they assert the collapsed CTA no longer renders the redundant helper copy while the open-state behavior still works.
- [x] 2.2 Run the relevant test coverage for the add-item flow and confirm the CTA remains usable after the copy removal.
