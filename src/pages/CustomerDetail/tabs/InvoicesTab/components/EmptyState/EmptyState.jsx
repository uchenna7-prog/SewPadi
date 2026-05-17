import styles from "./EmptyState.module.css"

export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>receipt_long</span>
      <p className={styles.emptyStateTitle}>No invoices yet</p>
      <p className={styles.emptyStateSubtitle}>
        Tap the <strong>+</strong> button to create your first invoice from an existing order.
      </p>
    </div>
  )
}