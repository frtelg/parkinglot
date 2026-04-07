import type { Item } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { formatTimestamp } from "../parking-lot-utils";

type ItemMetadataGridProps = {
  item: Item;
};

export function ItemMetadataGrid({ item }: ItemMetadataGridProps) {
  return (
    <dl className={styles.metaGrid}>
      <div>
        <dt>Created</dt>
        <dd>{formatTimestamp(item.createdAt)}</dd>
      </div>
      <div>
        <dt>Updated</dt>
        <dd>{formatTimestamp(item.updatedAt)}</dd>
      </div>
      <div>
        <dt>Resolved at</dt>
        <dd>{item.resolvedAt ? formatTimestamp(item.resolvedAt) : "Not resolved"}</dd>
      </div>
      <div>
        <dt>Snoozed until</dt>
        <dd>{item.snoozedUntil ? formatTimestamp(item.snoozedUntil) : "Not snoozed"}</dd>
      </div>
      <div>
        <dt>Archived at</dt>
        <dd>{item.archivedAt ? formatTimestamp(item.archivedAt) : "Not archived"}</dd>
      </div>
    </dl>
  );
}
