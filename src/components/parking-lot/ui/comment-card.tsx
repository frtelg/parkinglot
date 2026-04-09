import type { FormEventHandler } from "react";

import type { Comment } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { authorTypeLabels } from "../parking-lot-constants";
import { formatTimestamp, getCommentAuthorLabel, hasCommentBeenEdited } from "../parking-lot-utils";

type CommentCardProps = {
  comment: Comment;
  isEditing: boolean;
  editingCommentBody: string;
  isSaving: boolean;
  isDeleting: boolean;
  onStartEdit: (comment: Comment) => void;
  onEditingCommentBodyChange: (value: string) => void;
  onSave: FormEventHandler<HTMLFormElement>;
  onCancelEdit: () => void;
  onDelete: () => void;
};

export function CommentCard({
  comment,
  isEditing,
  editingCommentBody,
  isSaving,
  isDeleting,
  onStartEdit,
  onEditingCommentBodyChange,
  onSave,
  onCancelEdit,
  onDelete,
}: CommentCardProps) {
  return (
    <li className={styles.commentCard}>
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
          <button type="button" className={styles.secondaryButton} onClick={() => onStartEdit(comment)}>
            Edit
          </button>
          <button type="button" className={styles.dangerButton} disabled={isDeleting} onClick={onDelete}>
            {isDeleting ? "Removing..." : "Delete comment"}
          </button>
        </div>
      </div>

      {isEditing ? (
        <form className={styles.commentEditForm} onSubmit={onSave}>
          <label className={styles.field}>
            <span>Edit comment</span>
            <textarea
              value={editingCommentBody}
              onChange={(event) => onEditingCommentBodyChange(event.target.value)}
              maxLength={4000}
              rows={4}
              required
            />
          </label>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save comment"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className={styles.commentBody}>{comment.body}</p>
      )}
    </li>
  );
}
