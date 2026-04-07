"use client";

import styles from "@/components/parking-lot-app.module.css";

import type { ParkingLotAppProps } from "./parking-lot/types";
import { CreateItemSection } from "./parking-lot/ui/create-item-section";
import { DetailOverlay } from "./parking-lot/ui/detail-overlay";
import { ErrorBanner } from "./parking-lot/ui/error-banner";
import { ItemDetailPanel } from "./parking-lot/ui/item-detail-panel";
import { ItemList } from "./parking-lot/ui/item-list";
import { ParkingLotHero } from "./parking-lot/ui/parking-lot-hero";
import { ViewTabs } from "./parking-lot/ui/view-tabs";
import { useParkingLotController } from "./parking-lot/use-parking-lot-controller";

export function ParkingLotApp(props: ParkingLotAppProps) {
  const {
    statusMessage,
    error,
    dismissError,
    workspaceBusy,
    listRegionId,
    items,
    view,
    isViewLoading,
    openView,
    createFormId,
    isCreateFormOpen,
    createTitle,
    createDetails,
    pendingAction,
    toggleCreateForm,
    setCreateTitle,
    setCreateDetails,
    handleCreateItem,
    cancelCreateForm,
    selectedId,
    canReorderActiveItems,
    draggedItemId,
    dropTargetId,
    handleItemClick,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    closeDetail,
    visibleDetail,
    detailRegionId,
    detailHeadingRef,
    isDetailLoading,
    draftTitle,
    draftDetails,
    selectedSnoozeChoice,
    snoozeDate,
    snoozeTime,
    commentBody,
    commentAuthorType,
    commentAuthorLabel,
    authorTypeLabels,
    editingCommentId,
    editingCommentBody,
    commentComposerRef,
    handleSaveItem,
    setDraftTitle,
    setDraftDetails,
    handleResolve,
    handleArchive,
    handleUnarchive,
    applySnoozePreset,
    handleSnoozeDateChange,
    handleSnoozeTimeChange,
    handleSnooze,
    jumpToCommentComposer,
    handleCreateComment,
    setCommentBody,
    setCommentAuthorType,
    setCommentAuthorLabel,
    resetCommentComposer,
    startCommentEdit,
    setEditingCommentBody,
    handleSaveComment,
    cancelCommentEdit,
    handleDeleteComment,
  } = useParkingLotController(props);

  return (
    <main className={styles.shell}>
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      <ParkingLotHero />

      {error ? <ErrorBanner error={error} onDismiss={dismissError} /> : null}

      <section className={styles.workspace} aria-busy={workspaceBusy}>
        <section className={styles.overviewPanel} aria-labelledby={listRegionId}>
          <div className={styles.panelHeader}>
            <div>
              <h2 id={listRegionId}>Overview</h2>
              <p>Track what is live, done, or parked for later.</p>
            </div>
            <span className={styles.itemCount}>{items.length} items</span>
          </div>

          <ViewTabs view={view} isViewLoading={isViewLoading} onSelect={openView} />

          <CreateItemSection
            formId={createFormId}
            isOpen={isCreateFormOpen}
            title={createTitle}
            details={createDetails}
            pendingAction={pendingAction}
            onToggle={toggleCreateForm}
            onTitleChange={(event) => setCreateTitle(event.target.value)}
            onDetailsChange={(event) => setCreateDetails(event.target.value)}
            onSubmit={handleCreateItem}
            onCancel={cancelCreateForm}
          />

          <ItemList
            view={view}
            items={items}
            selectedId={selectedId}
            isViewLoading={isViewLoading}
            canReorder={canReorderActiveItems}
            draggedItemId={draggedItemId}
            dropTargetId={dropTargetId}
            onItemClick={handleItemClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        </section>

        {selectedId ? (
          <DetailOverlay onClose={closeDetail}>
            {!visibleDetail ? (
              <div className={styles.detailEmptyState}>
                <h2 id={detailRegionId} ref={detailHeadingRef} tabIndex={-1}>
                  Loading item detail
                </h2>
                <p>{isDetailLoading ? "Pulling the latest comments and metadata from local storage." : "Select an item to view its details."}</p>
              </div>
            ) : (
              <ItemDetailPanel
                item={visibleDetail.item}
                comments={visibleDetail.comments}
                detailRegionId={detailRegionId}
                detailHeadingRef={detailHeadingRef}
                draftTitle={draftTitle}
                draftDetails={draftDetails}
                pendingAction={pendingAction}
                selectedSnoozeChoice={selectedSnoozeChoice}
                snoozeDate={snoozeDate}
                snoozeTime={snoozeTime}
                commentBody={commentBody}
                commentAuthorType={commentAuthorType}
                commentAuthorLabel={commentAuthorLabel}
                authorTypeLabels={authorTypeLabels}
                editingCommentId={editingCommentId}
                editingCommentBody={editingCommentBody}
                commentComposerRef={commentComposerRef}
                onClose={closeDetail}
                onSaveItem={handleSaveItem}
                onDraftTitleChange={setDraftTitle}
                onDraftDetailsChange={setDraftDetails}
                onResolve={handleResolve}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onSelectSnoozeChoice={applySnoozePreset}
                onSnoozeDateChange={handleSnoozeDateChange}
                onSnoozeTimeChange={handleSnoozeTimeChange}
                onSnooze={handleSnooze}
                onJumpToComposer={jumpToCommentComposer}
                onCreateComment={handleCreateComment}
                onCommentBodyChange={setCommentBody}
                onCommentAuthorTypeChange={setCommentAuthorType}
                onCommentAuthorLabelChange={setCommentAuthorLabel}
                onClearCommentComposer={resetCommentComposer}
                onStartCommentEdit={startCommentEdit}
                onEditingCommentBodyChange={setEditingCommentBody}
                onSaveComment={(commentId) => {
                  void handleSaveComment(commentId);
                }}
                onCancelCommentEdit={cancelCommentEdit}
                onDeleteComment={(commentId) => {
                  void handleDeleteComment(commentId);
                }}
              />
            )}
          </DetailOverlay>
        ) : null}
      </section>
    </main>
  );
}
