import styles from "@/components/parking-lot-app.module.css";

type ErrorBannerProps = {
  error: string;
  onDismiss: () => void;
};

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className={styles.errorBanner} role="alert">
      <div>
        <strong>Something needs attention.</strong>
        <p>{error}</p>
      </div>
      <button type="button" className={styles.dismissButton} onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
