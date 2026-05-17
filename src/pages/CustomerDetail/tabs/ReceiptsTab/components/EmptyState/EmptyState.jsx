import styles from "./EmptyState.module.css"


export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>receipt</span>
      <p className={styles.emptyStateTitle}>No receipts yet</p>
      <p className={styles.emptyStateSubtitle}>
        Tap <strong>+</strong> to generate a receipt from a recorded payment,
        or open a payment on the Payments tab.
      </p>
    </div>
  )
}

