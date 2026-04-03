## 1. Persistence And Ordering Model

- [x] 1.1 Add persistent storage for active-item sort position, including a local migration that seeds existing active items from the current recency order.
- [x] 1.2 Update item listing and lifecycle-related item persistence logic so Active items use the stored sort position, new or reactivated active items join the end of the active order, and non-active views keep their existing ordering behavior.

## 2. Reorder Write Path

- [x] 2.1 Add a dedicated reorder operation in the item domain and API layer that accepts the user-defined active-item sequence and persists the updated positions atomically.
- [x] 2.2 Add direct tests for reorder persistence, migration behavior, and the rule that later edits or comments do not reshuffle manually ordered active items.

## 3. Active View Drag And Drop

- [x] 3.1 Update the Active overview UI to support drag-and-drop reordering without breaking the existing click-to-open detail behavior.
- [x] 3.2 Persist drag-and-drop changes through the reorder write path and refresh local UI state so the saved order survives reloads and restarts.
- [x] 3.3 Add or update component and route tests covering drag-and-drop reorder behavior, persistence after reload, and the unchanged ordering behavior of resolved and archived views.
