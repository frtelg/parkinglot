## 1. Selection And Layout Behavior

- [x] 1.1 Remove server and client bootstrapping that auto-selects and preloads the first item on initial load.
- [x] 1.2 Update lifecycle view switching so Active, Resolved, and Archived open with no selected detail until the user clicks an item.
- [x] 1.3 Replace the split detail pane with a detail overlay layered above the full-screen list view.
- [x] 1.4 Verify overlay open and dismiss behavior still works with explicit-selection-only rules on desktop and mobile.

## 2. List-First Interface Refinement

- [x] 2.1 Replace the always-expanded new-item card with a compact add-item trigger that expands and collapses the composer on demand.
- [x] 2.2 Reduce the hero section footprint and supporting emphasis so it no longer competes with the overview list.
- [x] 2.3 Tone down overview and detail surface styling to create a quieter hierarchy while keeping states and actions readable.

## 3. Validation

- [ ] 3.1 Manually validate the list-first overlay flow on desktop: initial load, item click, overlay close, view switch, create item, and return to list.
- [ ] 3.2 Manually validate the same overlay flow on mobile, including opening detail from the list and dismissing back to the overview.
