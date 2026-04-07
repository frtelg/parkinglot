import { useCallback, useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from "react";

import type { Comment, Item, ItemView } from "@/lib/schemas";

import { authorTypeLabels, snoozeChoiceLabels, viewLabels } from "./parking-lot-constants";
import { fetchItemDetail, requestJson } from "./parking-lot-api";
import {
  buildSnoozedUntil,
  formatTimestamp,
  getInitialSnoozeFields,
  getDefaultSnoozeDateTime,
  reorderItems,
} from "./parking-lot-utils";
import type {
  CommentResponse,
  ItemDetail,
  ItemResponse,
  ItemsResponse,
  ParkingLotAppProps,
  ReorderItemsResponse,
  SnoozeChoice,
} from "./types";
import { useItemEvents } from "./use-item-events";

export function useParkingLotController({ initialItems, initialSelectedDetail }: ParkingLotAppProps) {
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
  const [selectedSnoozeChoice, setSelectedSnoozeChoice] = useState<SnoozeChoice>("later-today");
  const [snoozeDate, setSnoozeDate] = useState(() => getInitialSnoozeFields().date);
  const [snoozeTime, setSnoozeTime] = useState(() => getInitialSnoozeFields().time);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const commentComposerRef = useRef<HTMLTextAreaElement>(null);
  const suppressNextOpenRef = useRef(false);
  const listRegionId = useId();
  const detailRegionId = useId();
  const createFormId = useId();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const visibleDetail = selectedDetail?.item.id === selectedId ? selectedDetail : null;
  const canReorderActiveItems = view === "active" && pendingAction !== "reorder-items";
  const workspaceBusy = isViewLoading || isDetailLoading || pendingAction !== null;

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      detailHeadingRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedId]);

  useEffect(() => {
    if (!visibleDetail || visibleDetail.item.archivedAt || visibleDetail.item.status !== "active" || visibleDetail.item.snoozedUntil) {
      return;
    }

    const nextFields = getInitialSnoozeFields();
    setSelectedSnoozeChoice("later-today");
    setSnoozeDate(nextFields.date);
    setSnoozeTime(nextFields.time);
  }, [visibleDetail]);

  const syncDrafts = useCallback((item: Item | null) => {
    setDraftTitle(item?.title ?? "");
    setDraftDetails(item?.details ?? "");
  }, []);

  const resetCommentComposer = useCallback(() => {
    setCommentBody("");
    setCommentAuthorType("human");
    setCommentAuthorLabel("");
  }, []);

  const cancelCommentEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentBody("");
  }, []);

  const closeDetail = useCallback(() => {
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
  }, [cancelCommentEdit, selectedId, syncDrafts]);

  const handleMatchingItemCreated = useCallback(() => {
    void refreshItemsForView(view);
  }, [refreshItemsForView, view]);

  useItemEvents({ view, onMatchingItemCreated: handleMatchingItemCreated });

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

  async function handleSnooze() {
    if (!selectedItem) {
      return;
    }

    setPendingAction("snooze-item");

    try {
      const snoozedUntil = buildSnoozedUntil(snoozeDate, snoozeTime);
      const data = await requestJson<ItemResponse>(`/api/items/${selectedItem.id}/snooze`, {
        method: "POST",
        body: JSON.stringify({ snoozedUntil }),
      });

      await loadView("snoozed", { status: `Snoozed ${data.item.title} until ${formatTimestamp(snoozedUntil)}.` });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to snooze item");
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

  function applySnoozePreset(choice: SnoozeChoice) {
    setSelectedSnoozeChoice(choice);

    if (choice === "custom") {
      return;
    }

    const nextDate = getDefaultSnoozeDateTime(choice);
    const nextFields = {
      date: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`,
      time: `${String(nextDate.getHours()).padStart(2, "0")}:${String(nextDate.getMinutes()).padStart(2, "0")}`,
    };
    setSnoozeDate(nextFields.date);
    setSnoozeTime(nextFields.time);
  }

  function handleSnoozeDateChange(value: string) {
    setSelectedSnoozeChoice("custom");
    setSnoozeDate(value);
  }

  function handleSnoozeTimeChange(value: string) {
    setSelectedSnoozeChoice("custom");
    setSnoozeTime(value);
  }

  function startCommentEdit(comment: Comment) {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
  }

  function dismissError() {
    setError(null);
  }

  function toggleCreateForm() {
    setIsCreateFormOpen((current) => !current);
  }

  function cancelCreateForm() {
    setCreateTitle("");
    setCreateDetails("");
    setIsCreateFormOpen(false);
  }

  function jumpToCommentComposer() {
    commentComposerRef.current?.focus();
  }

  function openView(nextView: ItemView) {
    void loadView(nextView, { status: `${viewLabels[nextView]} view opened.` });
  }

  return {
    listRegionId,
    detailRegionId,
    createFormId,
    detailHeadingRef,
    commentComposerRef,
    view,
    items,
    selectedId,
    visibleDetail,
    isCreateFormOpen,
    createTitle,
    createDetails,
    draftTitle,
    draftDetails,
    commentBody,
    commentAuthorType,
    commentAuthorLabel,
    editingCommentId,
    editingCommentBody,
    error,
    statusMessage,
    isViewLoading,
    isDetailLoading,
    pendingAction,
    workspaceBusy,
    selectedSnoozeChoice,
    snoozeDate,
    snoozeTime,
    draggedItemId,
    dropTargetId,
    canReorderActiveItems,
    authorTypeLabels,
    snoozeChoiceLabels,
    dismissError,
    openView,
    toggleCreateForm,
    cancelCreateForm,
    setCreateTitle,
    setCreateDetails,
    handleCreateItem,
    handleItemClick,
    closeDetail,
    setDraftTitle,
    setDraftDetails,
    handleSaveItem,
    handleResolve,
    handleArchive,
    handleUnarchive,
    applySnoozePreset,
    handleSnoozeDateChange,
    handleSnoozeTimeChange,
    handleSnooze,
    jumpToCommentComposer,
    setCommentBody,
    setCommentAuthorType,
    setCommentAuthorLabel,
    resetCommentComposer,
    handleCreateComment,
    startCommentEdit,
    setEditingCommentBody,
    cancelCommentEdit,
    handleSaveComment,
    handleDeleteComment,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
