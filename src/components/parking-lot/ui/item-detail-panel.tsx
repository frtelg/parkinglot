import type { FormEventHandler, RefObject } from "react";

import type { Comment, Item } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { getItemPresentation } from "../parking-lot-utils";
import type { SnoozeChoice } from "../types";
import { CommentsSection } from "./comments-section";
import { DetailDescriptionPreview } from "./detail-description-preview";
import { ItemMetadataGrid } from "./item-metadata-grid";
import { SnoozePanel } from "./snooze-panel";

type ItemDetailPanelProps = {
  item: Item;
  comments: Comment[];
  detailRegionId: string;
  detailHeadingRef: RefObject<HTMLHeadingElement | null>;
  draftTitle: string;
  draftDetails: string;
  pendingAction: string | null;
  selectedSnoozeChoice: SnoozeChoice;
  snoozeDate: string;
  snoozeTime: string;
  commentBody: string;
  commentAuthorType: Comment["authorType"];
  commentAuthorLabel: string;
  authorTypeLabels: Record<Comment["authorType"], string>;
  editingCommentId: string | null;
  editingCommentBody: string;
  commentComposerRef: RefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
  onSaveItem: FormEventHandler<HTMLFormElement>;
  onDraftTitleChange: (value: string) => void;
  onDraftDetailsChange: (value: string) => void;
  onResolve: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onSelectSnoozeChoice: (choice: SnoozeChoice) => void;
  onSnoozeDateChange: (value: string) => void;
  onSnoozeTimeChange: (value: string) => void;
  onSnooze: () => void;
  onJumpToComposer: () => void;
  onCreateComment: FormEventHandler<HTMLFormElement>;
  onCommentBodyChange: (value: string) => void;
  onCommentAuthorTypeChange: (value: Comment["authorType"]) => void;
  onCommentAuthorLabelChange: (value: string) => void;
  onClearCommentComposer: () => void;
  onStartCommentEdit: (comment: Comment) => void;
  onEditingCommentBodyChange: (value: string) => void;
  onSaveComment: (commentId: string) => void;
  onCancelCommentEdit: () => void;
  onDeleteComment: (commentId: string) => void;
};

const toneClassNames = {
  active: styles.activeBadge,
  resolved: styles.resolvedBadge,
  snoozed: styles.snoozedBadge,
  archived: styles.archivedBadge,
};

export function ItemDetailPanel({
  item,
  comments,
  detailRegionId,
  detailHeadingRef,
  draftTitle,
  draftDetails,
  pendingAction,
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
  onClose,
  onSaveItem,
  onDraftTitleChange,
  onDraftDetailsChange,
  onResolve,
  onArchive,
  onUnarchive,
  onSelectSnoozeChoice,
  onSnoozeDateChange,
  onSnoozeTimeChange,
  onSnooze,
  onJumpToComposer,
  onCreateComment,
  onCommentBodyChange,
  onCommentAuthorTypeChange,
  onCommentAuthorLabelChange,
  onClearCommentComposer,
  onStartCommentEdit,
  onEditingCommentBodyChange,
  onSaveComment,
  onCancelCommentEdit,
  onDeleteComment,
}: ItemDetailPanelProps) {
  const itemPresentation = getItemPresentation(item);

  return (
    <>
      <div className={styles.panelHeader}>
        <div>
          <h2 id={detailRegionId} ref={detailHeadingRef} tabIndex={-1}>
            Item detail
          </h2>
          <p>Keep the item focused without losing the thread around it.</p>
        </div>
        <div className={styles.detailHeaderActions}>
          <span className={`${styles.badge} ${toneClassNames[itemPresentation.tone]}`}>{itemPresentation.label}</span>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <form className={styles.detailForm} onSubmit={onSaveItem}>
        <label className={styles.field}>
          <span>Title</span>
          <input value={draftTitle} onChange={(event) => onDraftTitleChange(event.target.value)} maxLength={120} required />
        </label>

        <label className={styles.field}>
          <span>Details</span>
          <textarea value={draftDetails} onChange={(event) => onDraftDetailsChange(event.target.value)} maxLength={4000} rows={8} />
        </label>

        <DetailDescriptionPreview details={draftDetails} />

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryButton} disabled={pendingAction === "save-item"}>
            {pendingAction === "save-item" ? "Saving..." : "Save changes"}
          </button>

          {!item.archivedAt && item.status === "active" ? (
            <button type="button" className={styles.secondaryButton} disabled={pendingAction === "resolve-item"} onClick={onResolve}>
              {pendingAction === "resolve-item" ? "Resolving..." : "Resolve"}
            </button>
          ) : null}

          {!item.archivedAt ? (
            <button type="button" className={styles.secondaryButton} disabled={pendingAction === "archive-item"} onClick={onArchive}>
              {pendingAction === "archive-item" ? "Archiving..." : "Archive"}
            </button>
          ) : (
            <button type="button" className={styles.secondaryButton} disabled={pendingAction === "unarchive-item"} onClick={onUnarchive}>
              {pendingAction === "unarchive-item" ? "Restoring..." : "Unarchive"}
            </button>
          )}
        </div>

        {!item.archivedAt && item.status === "active" && !item.snoozedUntil ? (
          <SnoozePanel
            selectedChoice={selectedSnoozeChoice}
            date={snoozeDate}
            time={snoozeTime}
            pendingAction={pendingAction}
            onSelectChoice={onSelectSnoozeChoice}
            onDateChange={onSnoozeDateChange}
            onTimeChange={onSnoozeTimeChange}
            onSnooze={onSnooze}
          />
        ) : null}
      </form>

      <ItemMetadataGrid item={item} />

      <CommentsSection
        comments={comments}
        commentBody={commentBody}
        commentAuthorType={commentAuthorType}
        commentAuthorLabel={commentAuthorLabel}
        pendingAction={pendingAction}
        authorTypeLabels={authorTypeLabels}
        editingCommentId={editingCommentId}
        editingCommentBody={editingCommentBody}
        commentComposerRef={commentComposerRef}
        onJumpToComposer={onJumpToComposer}
        onCreateComment={onCreateComment}
        onCommentBodyChange={onCommentBodyChange}
        onCommentAuthorTypeChange={onCommentAuthorTypeChange}
        onCommentAuthorLabelChange={onCommentAuthorLabelChange}
        onClearCommentComposer={onClearCommentComposer}
        onStartCommentEdit={onStartCommentEdit}
        onEditingCommentBodyChange={onEditingCommentBodyChange}
        onSaveComment={onSaveComment}
        onCancelCommentEdit={onCancelCommentEdit}
        onDeleteComment={onDeleteComment}
      />
    </>
  );
}
