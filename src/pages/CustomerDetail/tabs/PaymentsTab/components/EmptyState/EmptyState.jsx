import styles from "./EmptyState.module.css"

export function EmptyState(){

    return(
        
        <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.3 }}>payments</span>
            <p>No payments recorded yet.</p>
            <span className={styles.emptyStateHint}>Tap + to record a payment</span>
        </div>

    )



}