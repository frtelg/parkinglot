import type { FormEventHandler, RefObject } from "react";

import type { Comment } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

type CommentComposerProps = {
  commentBody: string;
  commentAuthorType: Comment["authorType"];
  commentAuthorLabel: string;
  pendingAction: string | null;
  authorTypeLabels: Record<Comment["authorType"], string>;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCommentBodyChange: (value: string) => void;
  onCommentAuthorTypeChange: (value: Comment["authorType"]) => void;
  onCommentAuthorLabelChange: (value: string) => void;
  onClear: () => void;
};

export function CommentComposer({
  commentBody,
  commentAuthorType,
  commentAuthorLabel,
  pendingAction,
  authorTypeLabels,
  composerRef,
  onSubmit,
  onCommentBodyChange,
  onCommentAuthorTypeChange,
  onCommentAuthorLabelChange,
  onClear,
}: CommentComposerProps) {
  return (
    <form className={styles.commentComposer} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span>New comment</span>
        <textarea
          ref={composerRef}
          value={commentBody}
          onChange={(event) => onCommentBodyChange(event.target.value)}
          placeholder="Leave the next bit of context here."
          maxLength={4000}
          rows={4}
          required
        />
      </label>

      <div className={styles.inlineFields}>
        <label className={styles.field}>
          <span>Author type</span>
          <select value={commentAuthorType} onChange={(event) => onCommentAuthorTypeChange(event.target.value as Comment["authorType"])}>
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
            onChange={(event) => onCommentAuthorLabelChange(event.target.value)}
            placeholder="Alex, Planner Bot, etc."
            maxLength={80}
          />
        </label>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton} disabled={pendingAction === "create-comment"}>
          {pendingAction === "create-comment" ? "Posting..." : "Add comment"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onClear}>
          Clear
        </button>
      </div>
    </form>
  );
}
