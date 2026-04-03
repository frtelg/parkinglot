"use client";

import { useCallback, useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from "react";

import styles from "@/components/parking-lot-app.module.css";
import { type Comment, type Item, type ItemView } from "@/lib/schemas";

type ParkingLotAppProps = {
  initialItems: Item[];
  initialSelectedDetail: ItemDetail | null;
};

type ItemDetail = {
  item: Item;
  comments: Comment[];
};

type ItemsResponse = {
  items: Item[];
};

type ItemResponse = {
  item: Item;
};

type ReorderItemsResponse = {
  items: Item[];
};

type ItemDetailResponse = ItemDetail;

type CommentResponse = {
  comment: Comment;
};

type ItemCreatedEvent = {
  type: "item-created";
  itemId: string;
  view: ItemView;
};

const viewLabels: Record<ItemView, string> = {
  active: "Active",
  resolved: "Resolved",
  archived: "Archived",
};

const emptyMessages: Record<ItemView, string> = {
  active: "Nothing is parked right now. Add the next thing you are juggling.",
  resolved: "Resolved work will collect here once something is finished.",
  archived: "Archived items will wait here when they stop deserving attention.",
};

const authorTypeLabels: Record<Comment["authorType"], string> = {
  human: "Human",
  agent: "Agent",
  system: "System",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusTone(item: Item) {
  if (item.archivedAt) {
    return styles.archivedBadge;
  }

  return item.status === "resolved" ? styles.resolvedBadge : styles.activeBadge;
}

function getStatusLabel(item: Item) {
  if (item.archivedAt) {
    return "Archived";
  }

  return item.status === "resolved" ? "Resolved" : "Active";
}

function getCommentAuthorLabel(comment: Comment) {
  return comment.authorLabel ?? authorTypeLabels[comment.authorType];
}

function hasCommentBeenEdited(comment: Comment) {
  return comment.updatedAt !== comment.createdAt;
}

function reorderItems(items: Item[], sourceId: string, targetId: string) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed");
  }

  return payload as T;
}

async function fetchItemDetail(itemId: string) {
  return requestJson<ItemDetailResponse>(`/api/items/${itemId}`);
}

export function ParkingLotApp({ initialItems, initialSelectedDetail }: ParkingLotAppProps) {
  const [view, setView] = useState<ItemView>("active");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(() => initialSelectedDetail?.item.id ?? null);
  const [selectedDetail, setSelectedDetail] = useState<ItemDetail | null>(initialSelectedDetail);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDetails, setCreateDetails] = useState("");
  const [draftTitle, setDraftTitle] = useState(() => initialSelectedDetail?.item.title ?? "");
  const [draftDetails, setDraftDetails] = useState(() => initialSelectedDetail?.item.details ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [commentAuthorType, setCommentAuthorType] = useState<Comment["authorType"]>("human");
  const [commentAuthorLabel, setCommentAuthorLabel] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Active view loaded.");
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(Boolean(initialSelectedDetail));
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const commentComposerRef = useRef<HTMLTextAreaElement>(null);
  const suppressNextOpenRef = useRef(false);
  const listRegionId = useId();
  const detailRegionId = useId();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const visibleDetail = selectedDetail?.item.id === selectedId ? selectedDetail : null;
  const canReorderActiveItems = view === "active" && pendingAction !== "reorder-items";

  useEffect(() => {
    if (!isMobileDetailOpen || !selectedId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      detailHeadingRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isMobileDetailOpen, selectedId]);

  const closeDetail = useCallback(() => {
    setIsMobileDetailOpen(false);
    setEditingCommentId(null);
    setEditingCommentBody("");
    setSelectedId(null);
    setSelectedDetail(null);
    setDraftTitle("");
    setDraftDetails("");
    setStatusMessage("Returned to overview.");
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      closeDetail();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDetail, selectedId]);

  function syncDrafts(item: Item | null) {
    setDraftTitle(item?.title ?? "");
    setDraftDetails(item?.details ?? "");
  }

  function resetCommentComposer() {
    setCommentBody("");
    setCommentAuthorType("human");
    setCommentAuthorLabel("");
  }

  function cancelCommentEdit() {
    setEditingCommentId(null);
    setEditingCommentBody("");
  }

  const refreshItemsForView = useCallback(async (nextView: ItemView) => {
    const data = await requestJson<ItemsResponse>(`/api/items?view=${nextView}`);

    setItems(data.items);

    if (!selectedId) {
      return;
    }

    const selectedStillVisible = data.items.some((item) => item.id === selectedId);

    if (selectedStillVisible) {
      return;
    }

    setSelectedId(null);
    setSelectedDetail(null);
    syncDrafts(null);
    cancelCommentEdit();
    setIsMobileDetailOpen(false);
  }, [selectedId]);

  useEffect(() => {
    let isDisposed = false;
    let reconnectTimer: number | null = null;
    let source: EventSource | null = null;

    function cleanupSource() {
      if (source) {
        source.close();
        source = null;
      }
    }

    function scheduleReconnect() {
      if (isDisposed || reconnectTimer !== null) {
        return;
      }

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 1500);
    }

    function connect() {
      cleanupSource();
      const nextSource = new EventSource("/api/items/events");
      source = nextSource;

      nextSource.addEventListener("item-created", (event) => {
        const payload = JSON.parse((event as MessageEvent<string>).data) as ItemCreatedEvent;

        if (payload.view !== view) {
          return;
        }

        void refreshItemsForView(view);
      });

      nextSource.onerror = () => {
        cleanupSource();
        scheduleReconnect();
      };
    }

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }

      cleanupSource();
    };
  }, [refreshItemsForView, view]);

  async function loadView(nextView: ItemView, options?: { status?: string }) {
    setError(null);
    setIsViewLoading(true);

    try {
      setView(nextView);
      await refreshItemsForView(nextView);
      setSelectedId(null);
      setSelectedDetail(null);
      syncDrafts(null);
      cancelCommentEdit();
      setIsMobileDetailOpen(false);

      setStatusMessage(options?.status ?? `${viewLabels[nextView]} view updated.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load items");
    } finally {
      setIsViewLoading(false);
    }
  }

  async function loadSelectedItem(item: Item) {
    setError(null);
    setSelectedId(item.id);
    syncDrafts(item);
    cancelCommentEdit();
    setIsDetailLoading(true);
    setIsMobileDetailOpen(true);

    try {
      const detail = await fetchItemDetail(item.id);
      setSelectedDetail(detail);
      syncDrafts(detail.item);
      setStatusMessage(`Opened ${item.title}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load item details");
      setSelectedDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function refreshSelectedItem(status: string) {
    if (!selectedId) {
      await loadView(view, { status });
      return;
    }

    setError(null);
    setIsDetailLoading(true);

    try {
      const detail = await fetchItemDetail(selectedId);
      setSelectedDetail(detail);
      syncDrafts(detail.item);
      setStatusMessage(status);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh item details");
      setSelectedDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("create-item");

    try {
      const data = await requestJson<ItemResponse>("/api/items", {
        method: "POST",
        body: JSON.stringify({
          title: createTitle,
          details: createDetails,
        }),
      });

      setCreateTitle("");
      setCreateDetails("");
      setIsCreateFormOpen(false);
      await loadView("active", { status: `Created ${data.item.title}.` });
      await loadSelectedItem(data.item);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create item");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem) {
      return;
    }

    setPendingAction("save-item");

    try {
      const data = await requestJson<ItemResponse>(`/api/items/${selectedItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: draftTitle, details: draftDetails }),
      });

      await refreshSelectedItem(`Saved ${data.item.title}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save item");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleResolve() {
    if (!selectedItem) {
      return;
    }

    setPendingAction("resolve-item");

    try {
      const data = await requestJson<ItemResponse>(`/api/items/${selectedItem.id}/resolve`, {
        method: "POST",
      });

      await loadView("resolved", { status: `Resolved ${data.item.title}.` });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to resolve item");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleArchive() {
    if (!selectedItem) {
      return;
    }

    setPendingAction("archive-item");

    try {
      const data = await requestJson<ItemResponse>(`/api/items/${selectedItem.id}/archive`, {
        method: "POST",
      });

      await loadView("archived", { status: `Archived ${data.item.title}.` });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to archive item");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUnarchive() {
    if (!selectedItem) {
      return;
    }

    setPendingAction("unarchive-item");

    try {
      const data = await requestJson<ItemResponse>(`/api/items/${selectedItem.id}/unarchive`, {
        method: "POST",
      });

      await loadView(data.item.status, {
        status: `Returned ${data.item.title} to ${viewLabels[data.item.status]}.`,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to unarchive item");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem) {
      return;
    }

    setPendingAction("create-comment");

    try {
      await requestJson<CommentResponse>(`/api/items/${selectedItem.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          body: commentBody,
          authorType: commentAuthorType,
          authorLabel: commentAuthorLabel,
        }),
      });

      resetCommentComposer();
      await refreshSelectedItem("Comment added.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to add comment");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveComment(commentId: string) {
    if (!selectedItem) {
      return;
    }

    setPendingAction(`save-comment-${commentId}`);

    try {
      await requestJson<CommentResponse>(`/api/items/${selectedItem.id}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ body: editingCommentBody }),
      });

      cancelCommentEdit();
      await refreshSelectedItem("Comment updated.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update comment");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!selectedItem) {
      return;
    }

    setPendingAction(`delete-comment-${commentId}`);

    try {
      await requestJson<CommentResponse>(`/api/items/${selectedItem.id}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (editingCommentId === commentId) {
        cancelCommentEdit();
      }

      await refreshSelectedItem("Comment removed from the timeline.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete comment");
    } finally {
      setPendingAction(null);
    }
  }

  async function persistActiveOrder(nextItems: Item[], previousItems: Item[]) {
    setPendingAction("reorder-items");
    setError(null);

    try {
      const data = await requestJson<ReorderItemsResponse>("/api/items/reorder", {
        method: "POST",
        body: JSON.stringify({ itemIds: nextItems.map((item) => item.id) }),
      });

      setItems(data.items);
      setStatusMessage("Active order updated.");
    } catch (caughtError) {
      setItems(previousItems);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reorder active items");
    } finally {
      setPendingAction(null);
    }
  }

  function handleItemClick(item: Item) {
    if (suppressNextOpenRef.current) {
      return;
    }

    void loadSelectedItem(item);
  }

  function handleDragStart(itemId: string, event: DragEvent<HTMLButtonElement>) {
    if (!canReorderActiveItems) {
      return;
    }

    setDraggedItemId(itemId);
    setDropTargetId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDragOver(itemId: string, event: DragEvent<HTMLButtonElement>) {
    if (!canReorderActiveItems || !draggedItemId || draggedItemId === itemId) {
      return;
    }

    event.preventDefault();
    if (dropTargetId !== itemId) {
      setDropTargetId(itemId);
    }
  }

  function handleDragEnd() {
    setDraggedItemId(null);
    setDropTargetId(null);
  }

  function handleDrop(itemId: string, event: DragEvent<HTMLButtonElement>) {
    if (!canReorderActiveItems || !draggedItemId) {
      return;
    }

    event.preventDefault();
    const previousItems = items;
    const nextItems = reorderItems(items, draggedItemId, itemId);
    setDraggedItemId(null);
    setDropTargetId(null);

    if (nextItems === previousItems) {
      return;
    }

    suppressNextOpenRef.current = true;
    window.setTimeout(() => {
      suppressNextOpenRef.current = false;
    }, 0);

    setItems(nextItems);
    void persistActiveOrder(nextItems, previousItems);
  }

  return (
    <main className={styles.shell}>
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Local-first control tower</p>
          <h1 className={styles.title}>Keep the next item in view.</h1>
          <p className={styles.subtitle}>
            Review active work, open detail only when you need it, and move finished threads out of
            the way.
          </p>
        </div>
        <div className={styles.heroNote}>
          <span className={styles.heroLabel}>Runtime</span>
          <strong>Local machine only</strong>
          <span className={styles.heroHint}>Comments, lifecycle actions, and data stay on this device.</span>
        </div>
      </section>

      {error ? (
        <div className={styles.errorBanner} role="alert">
          <div>
            <strong>Something needs attention.</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className={styles.dismissButton}
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <section className={styles.workspace} aria-busy={isViewLoading || isDetailLoading || pendingAction !== null}>
        <section className={styles.overviewPanel} aria-labelledby={listRegionId}>
          <div className={styles.panelHeader}>
            <div>
              <h2 id={listRegionId}>Overview</h2>
              <p>Track what is live, done, or parked for later.</p>
            </div>
            <span className={styles.itemCount}>{items.length} items</span>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Item views">
            {(Object.keys(viewLabels) as ItemView[]).map((nextView) => (
              <button
                key={nextView}
                id={`tab-${nextView}`}
                type="button"
                role="tab"
                aria-controls={`panel-${nextView}`}
                aria-selected={view === nextView}
                className={view === nextView ? styles.activeTab : styles.tab}
                disabled={isViewLoading}
                onClick={() => {
                  void loadView(nextView, { status: `${viewLabels[nextView]} view opened.` });
                }}
              >
                {viewLabels[nextView]}
              </button>
            ))}
          </div>

          <div className={styles.createSection}>
            <div className={styles.createSummary}>
              <div>
                <h3>Add a new item</h3>
                <p>Keep capture close without letting it outrank the list.</p>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                aria-expanded={isCreateFormOpen}
                onClick={() => setIsCreateFormOpen((current) => !current)}
              >
                {isCreateFormOpen ? "Close" : "Add item"}
              </button>
            </div>

            {isCreateFormOpen ? (
              <form className={styles.createCard} onSubmit={handleCreateItem}>
                <label className={styles.field}>
                  <span>Title</span>
                  <input
                    value={createTitle}
                    onChange={(event) => setCreateTitle(event.target.value)}
                    placeholder="Ship phase 2 comments"
                    maxLength={120}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Details</span>
                  <textarea
                    value={createDetails}
                    onChange={(event) => setCreateDetails(event.target.value)}
                    placeholder="What needs to happen next?"
                    maxLength={4000}
                    rows={4}
                  />
                </label>

                <div className={styles.actions}>
                  <button type="submit" className={styles.primaryButton} disabled={pendingAction === "create-item"}>
                    {pendingAction === "create-item" ? "Adding..." : "Save item"}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setCreateTitle("");
                      setCreateDetails("");
                      setIsCreateFormOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>

          <div id={`panel-${view}`} className={styles.list} role="tabpanel" aria-labelledby={`tab-${view}`}>
            {isViewLoading ? <div className={styles.loadingState}>Loading {viewLabels[view].toLowerCase()} items...</div> : null}

            {!isViewLoading && items.length === 0 ? (
              <div className={styles.emptyState}>{emptyMessages[view]}</div>
            ) : null}

            {!isViewLoading
              ? items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    draggable={canReorderActiveItems}
                    aria-grabbed={draggedItemId === item.id}
                    className={[
                      item.id === selectedId ? styles.selectedCard : styles.itemCard,
                      canReorderActiveItems ? styles.reorderableCard : "",
                      draggedItemId === item.id ? styles.draggingCard : "",
                      dropTargetId === item.id && draggedItemId !== item.id ? styles.dropTargetCard : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleItemClick(item)}
                    onDragStart={(event) => handleDragStart(item.id, event)}
                    onDragOver={(event) => handleDragOver(item.id, event)}
                    onDrop={(event) => handleDrop(item.id, event)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className={styles.itemCardHeader}>
                      <strong>{item.title}</strong>
                      <span className={`${styles.badge} ${getStatusTone(item)}`}>{getStatusLabel(item)}</span>
                    </div>
                    <p>{item.details || "No extra details yet."}</p>
                    <span className={styles.itemMeta}>Updated {formatTimestamp(item.updatedAt)}</span>
                  </button>
                ))
              : null}
          </div>
        </section>

        {selectedId ? (
          <section className={styles.detailOverlay} aria-labelledby={detailRegionId}>
            <button type="button" className={styles.overlayScrim} aria-label="Close detail" onClick={closeDetail} />

            <section className={styles.detailPanel}>
              <div className={styles.mobileToolbar}>
                <button type="button" className={styles.secondaryButton} onClick={closeDetail}>
                  Back to overview
                </button>
              </div>

              {selectedId && !visibleDetail ? (
                <div className={styles.detailEmptyState}>
                  <h2 id={detailRegionId} ref={detailHeadingRef} tabIndex={-1}>
                    Loading item detail
                  </h2>
                  <p>{isDetailLoading ? "Pulling the latest comments and metadata from local storage." : "Select an item to view its details."}</p>
                </div>
              ) : visibleDetail ? (
                <>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2 id={detailRegionId} ref={detailHeadingRef} tabIndex={-1}>
                        Item detail
                      </h2>
                      <p>Keep the item focused without losing the thread around it.</p>
                    </div>
                    <div className={styles.detailHeaderActions}>
                      <span className={`${styles.badge} ${getStatusTone(visibleDetail.item)}`}>
                        {getStatusLabel(visibleDetail.item)}
                      </span>
                      <button type="button" className={styles.secondaryButton} onClick={closeDetail}>
                        Close
                      </button>
                    </div>
                  </div>

                  <form className={styles.detailForm} onSubmit={handleSaveItem}>
                    <label className={styles.field}>
                      <span>Title</span>
                      <input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        maxLength={120}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Details</span>
                      <textarea
                        value={draftDetails}
                        onChange={(event) => setDraftDetails(event.target.value)}
                        maxLength={4000}
                        rows={8}
                      />
                    </label>

                    <div className={styles.actions}>
                      <button type="submit" className={styles.primaryButton} disabled={pendingAction === "save-item"}>
                        {pendingAction === "save-item" ? "Saving..." : "Save changes"}
                      </button>

                      {!visibleDetail.item.archivedAt && visibleDetail.item.status === "active" ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={pendingAction === "resolve-item"}
                          onClick={handleResolve}
                        >
                          {pendingAction === "resolve-item" ? "Resolving..." : "Resolve"}
                        </button>
                      ) : null}

                      {!visibleDetail.item.archivedAt ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={pendingAction === "archive-item"}
                          onClick={handleArchive}
                        >
                          {pendingAction === "archive-item" ? "Archiving..." : "Archive"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={pendingAction === "unarchive-item"}
                          onClick={handleUnarchive}
                        >
                          {pendingAction === "unarchive-item" ? "Restoring..." : "Unarchive"}
                        </button>
                      )}
                    </div>
                  </form>

                  <dl className={styles.metaGrid}>
                    <div>
                      <dt>Created</dt>
                      <dd>{formatTimestamp(visibleDetail.item.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{formatTimestamp(visibleDetail.item.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt>Resolved at</dt>
                      <dd>{visibleDetail.item.resolvedAt ? formatTimestamp(visibleDetail.item.resolvedAt) : "Not resolved"}</dd>
                    </div>
                    <div>
                      <dt>Archived at</dt>
                      <dd>{visibleDetail.item.archivedAt ? formatTimestamp(visibleDetail.item.archivedAt) : "Not archived"}</dd>
                    </div>
                  </dl>

                  <section className={styles.commentsSection} aria-labelledby="comment-timeline-heading">
                    <div className={styles.commentsHeader}>
                      <div>
                        <h3 id="comment-timeline-heading">Comment timeline</h3>
                        <p>Persistent context stays attached to the item instead of living in side channels.</p>
                      </div>
                      <button type="button" className={styles.secondaryButton} onClick={() => commentComposerRef.current?.focus()}>
                        Jump to composer
                      </button>
                    </div>

                    <form className={styles.commentComposer} onSubmit={handleCreateComment}>
                      <label className={styles.field}>
                        <span>New comment</span>
                        <textarea
                          ref={commentComposerRef}
                          value={commentBody}
                          onChange={(event) => setCommentBody(event.target.value)}
                          placeholder="Leave the next bit of context here."
                          maxLength={4000}
                          rows={4}
                          required
                        />
                      </label>

                      <div className={styles.inlineFields}>
                        <label className={styles.field}>
                          <span>Author type</span>
                          <select
                            value={commentAuthorType}
                            onChange={(event) => setCommentAuthorType(event.target.value as Comment["authorType"])}
                          >
                            {Object.entries(authorTypeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={styles.field}>
                          <span>Optional label</span>
                          <input
                            value={commentAuthorLabel}
                            onChange={(event) => setCommentAuthorLabel(event.target.value)}
                            placeholder="Alex, Planner Bot, etc."
                            maxLength={80}
                          />
                        </label>
                      </div>

                      <div className={styles.actions}>
                        <button type="submit" className={styles.primaryButton} disabled={pendingAction === "create-comment"}>
                          {pendingAction === "create-comment" ? "Posting..." : "Add comment"}
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={resetCommentComposer}>
                          Clear
                        </button>
                      </div>
                    </form>

                    {visibleDetail.comments.length === 0 ? (
                      <div className={styles.emptyState}>
                        No comments yet. Add the first breadcrumb that explains what changed or why it matters.
                      </div>
                    ) : (
                      <ol className={styles.commentList}>
                        {visibleDetail.comments.map((comment) => {
                          const isEditing = editingCommentId === comment.id;
                          const isSaving = pendingAction === `save-comment-${comment.id}`;
                          const isDeleting = pendingAction === `delete-comment-${comment.id}`;

                          return (
                            <li key={comment.id} className={styles.commentCard}>
                              <div className={styles.commentHeader}>
                                <div>
                                  <strong>{getCommentAuthorLabel(comment)}</strong>
                                  <div className={styles.commentMeta}>
                                    <span>{authorTypeLabels[comment.authorType]}</span>
                                    <span>{formatTimestamp(comment.createdAt)}</span>
                                    {hasCommentBeenEdited(comment) ? <span>Edited {formatTimestamp(comment.updatedAt)}</span> : null}
                                  </div>
                                </div>
                                <div className={styles.commentActions}>
                                  <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingCommentBody(comment.body);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    disabled={isDeleting}
                                    onClick={() => {
                                      void handleDeleteComment(comment.id);
                                    }}
                                  >
                                    {isDeleting ? "Removing..." : "Remove"}
                                  </button>
                                </div>
                              </div>

                              {isEditing ? (
                                <form
                                  className={styles.commentEditForm}
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleSaveComment(comment.id);
                                  }}
                                >
                                  <label className={styles.field}>
                                    <span>Edit comment</span>
                                    <textarea
                                      value={editingCommentBody}
                                      onChange={(event) => setEditingCommentBody(event.target.value)}
                                      maxLength={4000}
                                      rows={4}
                                      required
                                    />
                                  </label>

                                  <div className={styles.actions}>
                                    <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                                      {isSaving ? "Saving..." : "Save comment"}
                                    </button>
                                    <button type="button" className={styles.secondaryButton} onClick={cancelCommentEdit}>
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <p className={styles.commentBody}>{comment.body}</p>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>
                </>
              ) : null}
            </section>
          </section>
        ) : null}
      </section>
    </main>
  );
}
