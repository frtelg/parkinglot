import type { DragEventHandler } from "react";

import type { Item } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { formatTimestamp, getItemPresentation } from "../parking-lot-utils";

type ItemCardProps = {
  item: Item;
  isSelected: boolean;
  canReorder: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onClick: () => void;
  onDragStart: DragEventHandler<HTMLButtonElement>;
  onDragOver: DragEventHandler<HTMLButtonElement>;
  onDrop: DragEventHandler<HTMLButtonElement>;
  onDragEnd: DragEventHandler<HTMLButtonElement>;
};

const toneClassNames = {
  active: styles.activeBadge,
  resolved: styles.resolvedBadge,
  snoozed: styles.snoozedBadge,
  archived: styles.archivedBadge,
};

export function ItemCard({
  item,
  isSelected,
  canReorder,
  isDragging,
  isDropTarget,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ItemCardProps) {
  const itemPresentation = getItemPresentation(item);

  return (
    <button
      type="button"
      draggable={canReorder}
      aria-grabbed={isDragging}
      className={[
        isSelected ? styles.selectedCard : styles.itemCard,
        canReorder ? styles.reorderableCard : "",
        isDragging ? styles.draggingCard : "",
        isDropTarget && !isDragging ? styles.dropTargetCard : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className={styles.itemCardHeader}>
        <strong>{item.title}</strong>
        <span className={`${styles.badge} ${toneClassNames[itemPresentation.tone]}`}>{itemPresentation.label}</span>
      </div>
      <p>{item.details || "No extra details yet."}</p>
      <span className={styles.itemMeta}>Updated {formatTimestamp(item.updatedAt)}</span>
    </button>
  );
}
