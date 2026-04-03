## Context

The parking lot app renders item detail as an overlay above the overview list. Today the overlay can be dismissed with the scrim, the mobile back button, and the desktop close button, all of which route through the existing `closeDetail` function in `src/components/parking-lot-app.tsx`.

The missing behavior is keyboard dismissal. Because the detail view is implemented entirely in the client component and already has a single close path, the change can stay local to the overlay state management in `ParkingLotApp`.

## Goals / Non-Goals

**Goals:**
- Allow the user to close the item detail overlay with the `Escape` key while a detail view is open.
- Reuse the existing close workflow so keyboard dismissal produces the same cleared selection and status messaging as the current UI controls.
- Scope the listener so it is active only when the detail overlay is present.

**Non-Goals:**
- Changing overview navigation, item loading, or lifecycle actions.
- Adding a broader keyboard shortcut system.
- Introducing new focus restoration behavior beyond the current close interaction.

## Decisions

Use a React effect tied to the open detail state to register a `keydown` listener on `window`.
Rationale: the overlay is conditionally rendered from `selectedId`, and a listener registered only while detail is open is the smallest change that matches the requested behavior. An always-on listener would be harder to reason about and could accidentally affect the overview.

Route `Escape` handling through the existing `closeDetail` function.
Rationale: `closeDetail` already clears the selected item, closes the mobile overlay state, resets drafts, and updates the live status message. Reusing it keeps keyboard dismissal behavior aligned with button-based dismissal and avoids duplicate close logic.

Ignore non-`Escape` keys and do not add special handling for focused form controls.
Rationale: the request is specifically about leaving the detail view from the keyboard. Letting `Escape` close from anywhere inside the detail overlay makes the behavior predictable and avoids adding narrower rules that the current UI does not otherwise expose.

## Risks / Trade-offs

- `Escape` may dismiss the detail view while the user is editing a field inside the overlay -> Mitigation: keep the change intentionally aligned with explicit overlay dismissal and avoid mixing in additional per-field behavior in this change.
- A global listener could affect the app when no detail is open -> Mitigation: register the listener only while `selectedId` is set and clean it up when the overlay closes.
- Keyboard dismissal could drift from button dismissal if close logic is duplicated -> Mitigation: call `closeDetail` directly from the key handler.

## Migration Plan

No migration is required. The change is client-side only and ships as part of the existing application.

Rollback is straightforward: remove the `Escape` key listener while leaving the existing close controls unchanged.

## Open Questions

No open questions. The requested interaction maps cleanly to the existing overlay close behavior.
