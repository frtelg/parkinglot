## Context

The overview currently renders the add-item entry point as a bordered summary surface followed by a form card when expanded. In the current visual system, that collapsed summary block shares too much of the same structure and tone as other overview surfaces, which makes it easy to read as another item-like row instead of the primary creation control. The implementation already has the right behavior: a collapsed trigger opens the form, the form submits through the existing create flow, and the view refreshes after success. The design work is therefore about clarifying the affordance without changing data flow or item creation logic.

## Goals / Non-Goals

**Goals:**
- Make the collapsed add-item affordance clearly different from list items.
- Increase visual prominence of the add-item action through accent color treatment.
- Preserve the existing progressive disclosure flow and create-item submission behavior.
- Keep the change local to the overview UI markup and styles.

**Non-Goals:**
- Redesign the full create form or the broader overview layout.
- Change API contracts, storage, validation, or create-item business logic.
- Introduce a new onboarding flow, modal, or floating action button pattern.

## Decisions

### Use a dedicated button-first collapsed state
The collapsed add-item affordance will become a compact call-to-action button with a short supporting label instead of a card-like summary container. This directly addresses the current confusion by removing the visual resemblance to an item row.

Alternative considered: keep the summary card and only recolor it. This was rejected because stronger color alone would not fully solve the structural ambiguity; it would still read like a list surface.

### Keep the expanded create form inline below the trigger
When the user activates the button, the existing create form will still expand inline in the overview area. This preserves the current interaction model, avoids introducing modal state, and keeps the change small.

Alternative considered: open the form in the detail overlay or a modal. This was rejected because it would introduce a larger interaction change for a problem that is mostly presentational.

### Add accent styling that is distinct from neutral controls
The add-item button will use accent color styling that is more pronounced than the existing neutral primary button treatment, while still respecting the application's dark local-first visual language. The styling should remain accessible in default, hover, focus, and disabled states.

Alternative considered: reuse the existing `primaryButton` style unchanged. This was rejected because the current neutral styling does not create enough visual separation from the rest of the interface.

## Risks / Trade-offs

- [Accent button becomes visually too dominant] → Keep the accent treatment localized to the add-item trigger rather than promoting all primary controls to the same intensity.
- [Button-only collapsed state loses context] → Retain a short nearby label or helper copy so the purpose stays clear without recreating a full card.
- [Mobile layout gets cramped] → Ensure the trigger and any supporting copy stack cleanly under the existing mobile breakpoints.
- [Style drift from the rest of the interface] → Reuse existing spacing, radii, and focus conventions so the new CTA stands out without feeling disconnected.
