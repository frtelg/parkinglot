import styles from "@/components/parking-lot-app.module.css";

export function ParkingLotHero() {
  return (
    <section className={styles.hero}>
      <div>
        <p className={styles.kicker}>Local-first control tower</p>
        <h1 className={styles.title}>Keep the next item in view.</h1>
        <p className={styles.subtitle}>
          Review active work, open detail only when you need it, and move finished threads out of the
          way.
        </p>
      </div>
      <div className={styles.heroNote}>
        <span className={styles.heroLabel}>Runtime</span>
        <strong>Local machine only</strong>
        <span className={styles.heroHint}>Comments, lifecycle actions, and data stay on this device.</span>
      </div>
    </section>
  );
}
