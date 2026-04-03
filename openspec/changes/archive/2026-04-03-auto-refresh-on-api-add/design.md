## Context

The app already supports multiple local windows and local API access, but the client only refreshes its overview when the active window performs the action itself. A new item created through `/api/items` by another tab, CLI, or local integration is persisted correctly, yet the current UI continues showing stale list data until the user triggers another fetch.

This change should keep the list current without regressing the calmer list-first interaction model that was just introduced. The refresh should be lightweight, should not steal focus, and should not automatically open item detail.

## Goals / Non-Goals

**Goals:**
- Automatically surface newly created items from external API activity in the current UI.
- Keep the current lifecycle view stable while refreshing list data in the background.
- Preserve explicit click-to-open detail behavior.
- Use the lightest push mechanism that matches one-way server-to-client update needs.

**Non-Goals:**
- Real-time sync for every possible item or comment mutation unless required for new-item visibility.
- Cross-machine synchronization or external pub/sub infrastructure.
- Auto-opening or auto-highlighting external items in a way that steals focus from the user.

## Decisions

### Use SSE for one-way overview freshness notifications
Add a server-sent events endpoint that broadcasts item-creation notifications to connected local clients.

Rationale:
- The app only needs server-to-client notifications, so SSE is a better fit than WebSocket.
- It avoids background polling noise while remaining simpler than a bidirectional socket layer.

Alternatives considered:
- Polling: smaller to implement, but less logical for a freshness-only push use case and creates unnecessary repeated requests.
- WebSocket: more infrastructure and connection state than required for one-way notifications.

### Refresh only the list while preserving the current detail state
When the SSE stream reports a new item event, refresh the items collection for the current view but avoid clearing or auto-opening detail unless the selected item disappears.

Rationale:
- The user asked for automatic refresh of added items, not disruptive navigation.
- This keeps the overview current while respecting the explicit-selection interaction model.

Alternatives considered:
- Re-run the full view loader on every poll: simpler, but would clear selection and feel jumpy.

### Prefer active-view value while remaining safe in other views
The SSE event should trigger a refresh for the current lifecycle view, but the most visible outcome is that new API-created active items show up while the user is on the Active view.

Rationale:
- New item creation naturally affects the Active view first.
- Keeping the same polling mechanism for all views avoids divergent code paths.

Alternatives considered:
- Refresh only Active clients: simpler, but creates inconsistent freshness rules between lifecycle views.

## Risks / Trade-offs

- [SSE connections can drop or reconnect] -> Use the browser EventSource client and tolerate reconnect by treating each event as a signal to re-fetch current list data.
- [Background refresh could overwrite local transient UI state] -> Limit automatic refresh to overview items and keep detail/draft state stable unless required.
- [Selected detail may become stale relative to the list] -> Accept that trade-off for now because the requested scope is list refresh for new items, not full live sync.

## Migration Plan

1. Add a lightweight SSE endpoint and notification fan-out for item creation.
2. Subscribe the client overview to item-created events and re-fetch the current lifecycle view on receipt.
3. Ensure refresh updates overview items without forcing detail open or resetting the current view.
4. Validate that externally-created items appear automatically and that normal local editing still works.

Rollback strategy:
- Remove the SSE subscription/endpoint and restore manual-refresh-only behavior.

## Open Questions

- None at proposal time; SSE is the preferred one-way push mechanism for this scope.
