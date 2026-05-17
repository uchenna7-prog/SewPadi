import styles from './EmptyState.module.css'

export function EmptyState() {

  return (
    <div className={styles.emptyState}>
      <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>straighten</span>
      <p>No garment measurements added yet.</p>
      <span className={styles.emptyStateHint}>Tap + to add the first one</span>
    </div>
  )
}