## Context

The current parking lot UI already uses a responsive master-detail structure, but it still behaves like detail is the default state. Server rendering preloads the first active item, the client initializes selection immediately, and the always-expanded add-item card plus large hero consume visual attention that the overview list should own.

This change is a focused UX refinement rather than a new product capability. The main constraints are to preserve the existing local-first architecture, keep the behavior consistent across desktop and mobile, and avoid expanding scope into new data models or APIs.

## Goals / Non-Goals

**Goals:**
- Remove automatic detail opening on initial load and on lifecycle view switches.
- Make the overview list the full-screen primary workspace until explicit selection opens a detail overlay.
- Convert the create-item UI to progressive disclosure so it no longer dominates the sidebar.
- Reduce the hero footprint and overall surface intensity to create a quieter visual hierarchy.
- Keep the change within existing UI state and API boundaries.

**Non-Goals:**
- Redesigning item content structure, comments, or lifecycle operations.
- Introducing new navigation models such as modal-only detail or route-per-item detail screens.
- Changing REST endpoints, persistence, or domain schemas.
- Adding new filtering, sorting, or search behavior.

## Decisions

### Stop bootstrapping a selected item from the server
Remove the server-side initial detail preload and let the client start with no selected item.

Rationale:
- This is the clearest way to satisfy the requirement that detail opens only after an explicit click.
- It avoids shipping hidden selection state that the UI then has to suppress.

Alternatives considered:
- Keep preloading detail and simply hide the panel until clicked: this preserves unnecessary work and complicates state rules.

### Treat view switches as selection-clearing navigation
Whenever the user switches between Active, Resolved, and Archived, clear the current item selection and show the empty-detail state until another item is chosen.

Rationale:
- This keeps the interaction model consistent: detail is always a consequence of item selection, not view navigation.
- It avoids edge cases where per-view remembered selection feels like implicit reopening.

Alternatives considered:
- Preserve last selection per view: convenient, but contradicts the user’s explicit interaction rule.

### Replace split view with a full-screen list and detail overlay
Use the list as the full-width primary workspace and present item detail as an overlay layered above it after explicit selection.

Rationale:
- This matches the revised user feedback more directly than a quieter split view.
- A full-width list makes item scanning primary, while an overlay keeps detail contextual and temporary.

Alternatives considered:
- Keep the quieter split view: still leaves persistent detail structure on screen when the requested mental model is list first, detail over it.

### Collapse item creation behind a compact trigger
Replace the always-open create card with a compact add-item affordance that reveals the full composer only when the user chooses to create something.

Rationale:
- This directly improves list prominence and lowers visual clutter.
- The existing create form can be reused with a small amount of local UI state rather than reworked into a different flow.

Alternatives considered:
- Move the full composer below the list: still leaves too much chrome in the main overview column.
- Keep it expanded and just tone it down: improves styling but not prominence.

### Quiet the page shell through CSS refinement rather than structural churn
Use smaller hero typography, less dominant supporting copy, reduced gradient emphasis, and calmer surface treatments instead of rearchitecting the page.

Rationale:
- The request is about prominence and quietness, not feature scope.
- Most of the desired outcome can be achieved with targeted layout and styling changes in the existing component structure.

Alternatives considered:
- Remove the hero entirely: stronger simplification, but more than the user asked for.

## Risks / Trade-offs

- [Full-screen overlays can feel heavier than side panes] -> Keep the overlay anchored to the same page, include an immediate close affordance, and preserve the underlying list context visually.
- [Collapsible create UI may hide discoverability] -> Keep the add-item trigger persistently visible and place it near the top of the overview column.
- [Reducing hero emphasis too far could weaken product framing] -> Keep a small headline and minimal support copy instead of removing the hero.
- [Changing selection rules may affect mobile expectations] -> Reuse the same explicit-selection rule on mobile and keep the existing back/open mechanics aligned with it.

## Migration Plan

1. Remove initial selected-detail bootstrapping from the page entry and client state initialization.
2. Update view-switch and item-load behavior so selection is explicit and cleared on view changes.
3. Add progressive disclosure state for the create-item composer.
4. Refine CSS hierarchy for hero, list layout, overlay detail panel, create affordance, and quieter panels.
5. Validate desktop and mobile behavior manually, especially item opening, overlay dismissal, view switching, and create-item flow.

Rollback strategy:
- Revert the UI refinement change set to restore preselected detail, always-open creation, and existing visual styling.

## Open Questions

- None at proposal time; the key interaction choices for split view, progressive creation, and selection clearing are already resolved.
