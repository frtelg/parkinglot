import type { ChangeEventHandler, FormEventHandler } from "react";

import styles from "@/components/parking-lot-app.module.css";

type CreateItemSectionProps = {
  formId: string;
  isOpen: boolean;
  title: string;
  details: string;
  pendingAction: string | null;
  onToggle: () => void;
  onTitleChange: ChangeEventHandler<HTMLInputElement>;
  onDetailsChange: ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
};

export function CreateItemSection({
  formId,
  isOpen,
  title,
  details,
  pendingAction,
  onToggle,
  onTitleChange,
  onDetailsChange,
  onSubmit,
  onCancel,
}: CreateItemSectionProps) {
  return (
    <div className={styles.createSection}>
      <div className={styles.createLead}>
        <button
          type="button"
          className={styles.createCtaButton}
          aria-expanded={isOpen}
          aria-controls={formId}
          onClick={onToggle}
        >
          {isOpen ? "Close composer" : "Add item"}
        </button>

        {isOpen ? <p className={styles.createHint}>The inline form is open below.</p> : null}
      </div>

      {isOpen ? (
        <form id={formId} className={styles.createCard} onSubmit={onSubmit}>
          <label className={styles.field}>
            <span>Title</span>
            <input
              value={title}
              onChange={onTitleChange}
              placeholder="Ship phase 2 comments"
              maxLength={120}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Details</span>
            <textarea
              value={details}
              onChange={onDetailsChange}
              placeholder="What needs to happen next?"
              maxLength={4000}
              rows={4}
            />
          </label>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton} disabled={pendingAction === "create-item"}>
              {pendingAction === "create-item" ? "Adding..." : "Save item"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
