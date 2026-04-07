import type { ItemView } from "@/lib/schemas";

import styles from "@/components/parking-lot-app.module.css";

import { viewLabels } from "../parking-lot-constants";

type ViewTabsProps = {
  view: ItemView;
  isViewLoading: boolean;
  onSelect: (view: ItemView) => void;
};

export function ViewTabs({ view, isViewLoading, onSelect }: ViewTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Item views">
      {(Object.keys(viewLabels) as ItemView[]).map((nextView) => (
        <button
          key={nextView}
          id={`tab-${nextView}`}
          type="button"
          role="tab"
          aria-controls={`panel-${nextView}`}
          aria-selected={view === nextView}
          className={view === nextView ? styles.activeTab : styles.tab}
          disabled={isViewLoading}
          onClick={() => onSelect(nextView)}
        >
          {viewLabels[nextView]}
        </button>
      ))}
    </div>
  );
}
