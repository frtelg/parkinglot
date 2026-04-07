## 1. Persistence And Lifecycle Model

- [x] 1.1 Add local persistence for snooze timing metadata, including a migration that leaves existing items unsnoozed by default.
- [x] 1.2 Update item domain logic so active, snoozed, resolved, and archived views are derived consistently, expired snoozes automatically return items to Active during reads, and waking items rejoin the end of the active manual order.

## 2. Shared API And Workflow Surface

- [x] 2.1 Extend schemas, contracts, REST routes, and MCP tool definitions to support a `snoozed` lifecycle view plus a dedicated snooze mutation that accepts a future wake-up time.
- [x] 2.2 Add domain and route tests covering snooze validation, snoozed-list filtering, automatic wake-up after expiry, and consistent behavior across REST and MCP entry points.

## 3. Application UI

- [x] 3.1 Update the overview and detail UI to expose a Snoozed tab, show snoozed item state clearly, and let a user snooze an active item for a future period.
- [x] 3.2 Refresh client-side loading and status messaging so snoozed items leave Active immediately, appear in Snoozed, and return to Active after expiry when the app reloads or refreshes data.
- [x] 3.3 Add or update UI tests covering the snooze action, snoozed-list visibility, detail behavior across lifecycle tabs, and automatic reappearance in Active after the snooze period ends.
