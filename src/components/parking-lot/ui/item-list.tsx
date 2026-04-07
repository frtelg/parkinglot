import type { Item, ItemView } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { emptyMessages, viewLabels } from "../parking-lot-constants";
import { ItemCard } from "./item-card";

type ItemListProps = {
  view: ItemView;
  items: Item[];
  selectedId: string | null;
  isViewLoading: boolean;
  canReorder: boolean;
  draggedItemId: string | null;
  dropTargetId: string | null;
  onItemClick: (item: Item) => void;
  onDragStart: (itemId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver: (itemId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (itemId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
};

export function ItemList({
  view,
  items,
  selectedId,
  isViewLoading,
  canReorder,
  draggedItemId,
  dropTargetId,
  onItemClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ItemListProps) {
  return (
    <div id={`panel-${view}`} className={styles.list} role="tabpanel" aria-labelledby={`tab-${view}`}>
      {isViewLoading ? <div className={styles.loadingState}>Loading {viewLabels[view].toLowerCase()} items...</div> : null}

      {!isViewLoading && items.length === 0 ? <div className={styles.emptyState}>{emptyMessages[view]}</div> : null}

      {!isViewLoading
        ? items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              canReorder={canReorder}
              isDragging={draggedItemId === item.id}
              isDropTarget={dropTargetId === item.id}
              onClick={() => onItemClick(item)}
              onDragStart={(event) => onDragStart(item.id, event)}
              onDragOver={(event) => onDragOver(item.id, event)}
              onDrop={(event) => onDrop(item.id, event)}
              onDragEnd={onDragEnd}
            />
          ))
        : null}
    </div>
  );
}
