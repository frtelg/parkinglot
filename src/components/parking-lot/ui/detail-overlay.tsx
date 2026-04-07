import type { ReactNode } from "react";

import styles from "@/components/parking-lot-app.module.css";

type DetailOverlayProps = {
  children: ReactNode;
  onClose: () => void;
};

export function DetailOverlay({ children, onClose }: DetailOverlayProps) {
  return (
    <section className={styles.detailOverlay}>
      <button type="button" className={styles.overlayScrim} aria-label="Close detail" onClick={onClose} />

      <section className={styles.detailPanel}>
        <div className={styles.mobileToolbar}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Back to overview
          </button>
        </div>

        {children}
      </section>
    </section>
  );
}
