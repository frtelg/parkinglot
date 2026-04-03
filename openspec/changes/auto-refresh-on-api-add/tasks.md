## 1. Automatic Overview Refresh

- [x] 1.1 Add a lightweight SSE endpoint or notification channel that emits item-created events for local clients.
- [x] 1.2 Subscribe the client overview to item-created events and re-fetch the current lifecycle view when an external item is added.
- [x] 1.3 Ensure the SSE subscription reconnects safely and stops cleanly when the component unmounts.
- [x] 1.4 Update the refresh path so externally-created items appear in the list without clearing the current detail state or auto-opening the new item.

## 2. Validation

- [x] 2.1 Verify that an item created through `/api/items` outside the current window appears automatically in the Active overview.
- [x] 2.2 Verify that the SSE-driven refresh does not unexpectedly close or auto-open detail while the user is reading another item.
