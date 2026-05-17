import styles from "./EmptyRevenueCard.module.css"


export function EmptyRevenueCard({ onOpen }) {
  return (

    <div className={styles.revenueCard} onClick={onOpen} style={{ justifyContent: 'flex-start', gap: '20px' }}>

      <div className={styles.revenueEmptyIconWrap}>

        <span className="mi" style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>ads_click</span>
        
      </div>

      <div className={styles.revenueCardLeft} style={{ gap: '2px' }}>

        <div className={styles.revenueEmptyTitle}>Set your first goal</div>
        <div className={styles.revenueEmptySub}>Tap here to track your shop's revenue growth</div>

      </div>

    </div>
  )
}