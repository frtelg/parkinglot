import type { Comment } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { CommentCard } from "./comment-card";

type CommentListProps = {
  comments: Comment[];
  editingCommentId: string | null;
  editingCommentBody: string;
  pendingAction: string | null;
  onStartEdit: (comment: Comment) => void;
  onEditingCommentBodyChange: (value: string) => void;
  onSaveComment: (commentId: string) => void;
  onCancelEdit: () => void;
  onDeleteComment: (commentId: string) => void;
};

export function CommentList({
  comments,
  editingCommentId,
  editingCommentBody,
  pendingAction,
  onStartEdit,
  onEditingCommentBodyChange,
  onSaveComment,
  onCancelEdit,
  onDeleteComment,
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className={styles.emptyState}>
        No comments yet. Add the first breadcrumb that explains what changed or why it matters.
      </div>
    );
  }

  return (
    <ol className={styles.commentList}>
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          isEditing={editingCommentId === comment.id}
          editingCommentBody={editingCommentBody}
          isSaving={pendingAction === `save-comment-${comment.id}`}
          isDeleting={pendingAction === `delete-comment-${comment.id}`}
          onStartEdit={onStartEdit}
          onEditingCommentBodyChange={onEditingCommentBodyChange}
          onSave={(event) => {
            event.preventDefault();
            onSaveComment(comment.id);
          }}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDeleteComment(comment.id)}
        />
      ))}
    </ol>
  );
}
