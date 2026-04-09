import type { FormEventHandler, RefObject } from "react";

import type { Comment } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { CommentComposer } from "./comment-composer";
import { CommentList } from "./comment-list";

type CommentsSectionProps = {
  comments: Comment[];
  commentBody: string;
  commentAuthorType: Comment["authorType"];
  commentAuthorLabel: string;
  pendingAction: string | null;
  authorTypeLabels: Record<Comment["authorType"], string>;
  editingCommentId: string | null;
  editingCommentBody: string;
  commentComposerRef: RefObject<HTMLTextAreaElement | null>;
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

export function CommentsSection({
  comments,
  commentBody,
  commentAuthorType,
  commentAuthorLabel,
  pendingAction,
  authorTypeLabels,
  editingCommentId,
  editingCommentBody,
  commentComposerRef,
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
}: CommentsSectionProps) {
  return (
    <section className={styles.commentsSection} aria-labelledby="comment-timeline-heading">
      <div className={styles.commentsHeader}>
        <div>
          <h3 id="comment-timeline-heading">Comment timeline</h3>
          <p>Persistent context stays attached to the item instead of living in side channels.</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={onJumpToComposer}>
          Write a comment
        </button>
      </div>

      <CommentComposer
        commentBody={commentBody}
        commentAuthorType={commentAuthorType}
        commentAuthorLabel={commentAuthorLabel}
        pendingAction={pendingAction}
        authorTypeLabels={authorTypeLabels}
        composerRef={commentComposerRef}
        onSubmit={onCreateComment}
        onCommentBodyChange={onCommentBodyChange}
        onCommentAuthorTypeChange={onCommentAuthorTypeChange}
        onCommentAuthorLabelChange={onCommentAuthorLabelChange}
        onClear={onClearCommentComposer}
      />

      <CommentList
        comments={comments}
        editingCommentId={editingCommentId}
        editingCommentBody={editingCommentBody}
        pendingAction={pendingAction}
        onStartEdit={onStartCommentEdit}
        onEditingCommentBodyChange={onEditingCommentBodyChange}
        onSaveComment={onSaveComment}
        onCancelEdit={onCancelCommentEdit}
        onDeleteComment={onDeleteComment}
      />
    </section>
  );
}
