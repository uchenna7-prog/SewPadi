import styles from "./CustomerInsightsCard.module.css"


export function CustomerInsightsCard({ totalCustomers, newThisMonth, topCustomer, topCustomerMeta, onNavigate }) {
  
    return (
    <div className={styles.customerCard} onClick={onNavigate}>
      <div className={styles.customerCardHeader}>
        <span className={styles.customerCardSectionLabel}>Customer Insights</span>
        <span className="mi" style={{ fontSize: '0.95rem', color: 'var(--text3)' }}>chevron_right</span>
      </div>

      <div className={styles.customerHeroBlock}>
        <div className={styles.customerHeroNumber}>{totalCustomers.toLocaleString()}</div>
        <div className={styles.customerHeroLabel}>Total Customers</div>
      </div>

      <div className={styles.customerCardRule} />

      <div className={styles.customerStatStack}>
        <div className={styles.customerStatRow}>
          <span className={styles.customerStatLbl}>Top Customer</span>
          <div className={styles.customerTopVal}>
            <span style={{ color: 'var(--accent)' }}>{topCustomer.name}</span>
            {topCustomerMeta && (
              <span className={styles.customerTopMeta}>{topCustomerMeta}</span>
            )}
          </div>
        </div>
        <div className={styles.customerStatRow}>
          <span className={styles.customerStatLbl}>New This Month</span>
          <span className={styles.customerStatVal}>{newThisMonth}</span>
        </div>
      </div>
    </div>
  )
}