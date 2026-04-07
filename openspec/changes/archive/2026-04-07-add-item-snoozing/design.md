## Context

The current application treats item lifecycle as a combination of `status` (`active` or `resolved`) and `archived_at`, with overview filtering derived directly from those fields in `src/lib/items.ts`. The UI, REST layer, and MCP layer all assume the only visible views are Active, Resolved, and Archived.

Snoozing changes more than presentation. The system needs a new way to represent "active, but intentionally hidden until later", it needs a Snoozed overview that does not rely on client-side filtering, and it needs expired snoozes to reappear in Active without a background job because the app is local-first and single-user.

## Goals / Non-Goals

**Goals:**
- Let a user snooze an active item until a chosen future time.
- Show snoozed items in a dedicated Snoozed list instead of Active.
- Return expired snoozed items to Active automatically during normal reads, without a scheduler or external worker.
- Keep REST, MCP, and UI lifecycle semantics aligned.

**Non-Goals:**
- Snoozing resolved or archived items.
- Cross-device reminders, notifications, or push alerts when snooze expires.
- Building a background daemon that wakes items up while the app is closed.
- Adding recurring snooze rules or calendar-style scheduling.

## Decisions

Represent snoozing with dedicated timestamp fields rather than a new stored status enum.
Rationale: the current status enum is narrow and already separates active versus resolved while archive is modeled independently. Keeping snooze as timestamp-driven metadata avoids expanding every status check into a four-state enum and makes automatic wake-up a derived rule: an item is snoozed only while `snoozed_until` is in the future.

Restrict snoozing to items that are currently active and not archived.
Rationale: the requested behavior is specifically to remove work from Active temporarily and add it back later. Allowing snooze on resolved or archived items would introduce unclear return semantics and increase scope without a user need.

Normalize expired snoozes opportunistically during item reads and list queries.
Rationale: the app runs locally without a persistent worker. Before listing items or reading an item, the domain layer can clear any expired `snoozed_until` values and append those items back to the end of the active order. This gives the user the requested automatic return behavior without inventing background infrastructure.

Treat snoozing as a temporary removal from the active manual order, then append the item when it wakes.
Rationale: preserving an old active position across a period where the rest of the Active list can be reordered creates order conflicts. Appending on wake-up keeps ordering deterministic and matches the user-visible expectation that the item gets added back to Active.

Expose snooze through a dedicated lifecycle mutation and a new `snoozed` view on shared APIs.
Rationale: snoozing is not a generic item edit. A specific mutation keeps validation clear, and a first-class view avoids each client having to reimplement time-based filtering on top of the full item list.

## Risks / Trade-offs

- [Automatic wake-up only happens during reads] -> Normalize expired snoozes in every list and detail read path so the state self-heals as soon as the user or agent touches the app again.
- [Local migration changes persisted item records] -> Add a backward-compatible migration that introduces nullable snooze columns and leaves existing items unsnoozed.
- [Time-based behavior can be flaky in tests] -> Cover the domain logic with deterministic clock-controlled tests around snooze expiry and view transitions.
- [Adding another overview tab increases UI density] -> Keep the Snoozed list behavior parallel to the existing lifecycle tabs and avoid adding unrelated UI chrome.

## Migration Plan

Add nullable snooze metadata columns to the local `items` table and default all existing rows to a non-snoozed state. Update read paths to normalize expired snoozes before filtering or returning items, then extend the UI, REST routes, and MCP tools to surface the new lifecycle view and mutation.

Rollback would remove the UI and API snooze affordances and ignore the stored snooze metadata. Because the app is local-first and single-user, no external migration coordination is required.

## Open Questions

No blocking open questions. The first implementation can accept a future timestamp through the shared APIs and use a simple local UI control to choose the snooze period.
