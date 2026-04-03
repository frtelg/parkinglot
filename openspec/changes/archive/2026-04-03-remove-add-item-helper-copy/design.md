## Context

The add-item entry point was recently refactored into a button-first CTA with supporting helper copy. The CTA itself already communicates the action clearly, so the collapsed-state sentence now adds explanation without adding decision-making value. This change is only about reducing interface noise in the resting state, not about changing creation behavior or the broader layout.

## Goals / Non-Goals

**Goals:**
- Remove redundant helper text from the collapsed add-item CTA state.
- Keep the CTA button visually distinct and easy to find without depending on explanatory copy.
- Preserve the current inline open, close, and submit behavior for the create form.

**Non-Goals:**
- Redesign the add-item CTA itself.
- Change create-item validation, persistence, or API behavior.
- Remove expanded-state guidance if that still helps orient the user once the form is open.

## Decisions

### Remove only the collapsed-state helper sentence
The collapsed-state helper copy will be removed while leaving the CTA button in place. This is the smallest change that addresses the user concern and avoids reopening the larger CTA design question.

Alternative considered: remove both collapsed and expanded helper copy. This was rejected because the request is specifically about the collapsed sentence and the expanded-state line can still provide immediate orientation.

### Keep layout changes minimal
The implementation should avoid reshaping the CTA area beyond what is necessary after the text removal. If the layout still looks balanced without additional changes, styling should remain untouched.

Alternative considered: rebalance spacing or replace the removed text with new microcopy. This was rejected because the goal is to reduce noise, not replace one line of copy with another.

## Risks / Trade-offs

- [CTA feels too sparse after copy removal] → Keep the existing visual emphasis on the button so the action remains obvious.
- [Expanded and collapsed states become inconsistent] → Limit the removal to the collapsed state intentionally and verify the open-state helper still reads cleanly.
- [Tests become stale from exact text assertions] → Update component tests to assert the new, quieter collapsed state directly.
