## Context

The Active view currently relies on `updated_at DESC, created_at DESC` ordering in `src/lib/items.ts`, and that behavior is reflected in the current `parking-lot-items` spec and README. The requested change replaces recency-first ordering for active items with a user-controlled order that can be rearranged through drag-and-drop and must survive page reloads and local restarts.

Because ordering must persist, this change cannot stay in the UI layer. The item persistence model needs an explicit order field, the list query needs to read from it, and the application needs a write path that updates positions after a drag-and-drop interaction.

## Goals / Non-Goals

**Goals:**
- Allow active items to be reordered directly from the Active overview using drag-and-drop.
- Persist the chosen order locally so it survives refreshes, restarts, and unrelated item updates.
- Keep Active view ordering deterministic even as items are created, edited, commented on, resolved, archived, and unarchived.

**Non-Goals:**
- Reordering resolved or archived views.
- Introducing cross-device sync or collaboration semantics for ordering.
- Replacing the existing detail overlay, comment flows, or lifecycle actions.

## Decisions

Store an explicit numeric sort position on each item.
Rationale: the current schema has no durable ordering field, so relying on timestamps would keep reshuffling the list whenever activity occurs. A dedicated position column makes user intent durable and queryable.

Restrict manual ordering to active items and keep resolved or archived views on their current non-manual ordering behavior.
Rationale: the user asked specifically to order active items. Limiting scope keeps the change smaller and avoids inventing new semantics for completed work lists.

Add a dedicated reorder mutation instead of overloading generic item updates.
Rationale: drag-and-drop reordering is a list-level operation that may affect multiple items at once. A reorder-specific write path keeps item editing and ordering concerns separate and makes testing clearer.

Append newly created active items to the persisted active order by default.
Rationale: once the user has established an explicit sequence, new items should not unexpectedly jump ahead just because they are recent. Appending preserves the user-managed queue.

When an archived or resolved item returns to the active view, place it at the end of the active order unless an existing active position is intentionally preserved by implementation.
Rationale: returning an item to active work should make it visible without disturbing the established sequence more than necessary.

## Risks / Trade-offs

- [Schema migration complexity] -> Add a backward-compatible local migration that initializes order values for existing active items from their current recency order.
- [Drag-and-drop can add interaction complexity] -> Keep the first version focused on straightforward pointer-based reordering in the Active list and preserve existing click-to-open behavior.
- [Bulk position rewrites can touch multiple rows] -> Use a single reorder operation that updates all affected positions consistently inside one persistence transaction.
- [Activity timestamps will no longer control visible order for active items] -> Document that manual order is now the primary Active view ordering rule.

## Migration Plan

Add a new persistent order column for items and initialize existing active rows based on the current `updated_at DESC, created_at DESC` sequence so current users keep a stable starting order after upgrading.

Update list queries and reorder writes to use the new column for active items. Rollback would remove the UI reorder path and restore active ordering to recency, but no external migration is required because the app is local-first and single-user.

## Open Questions

No blocking open questions. The first implementation can use a simple persisted numeric order model and a reorder-specific mutation path.
