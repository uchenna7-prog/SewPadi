import styles from "./UrgentStrip.module.css"


export function UrgentStrip({ items, navigate }) {

  if (!items || items.length === 0) return null
  
  return (
    <div className={styles.urgentStrip}>

      <div className={styles.urgentStripHeader}>
        <span className={`mi ${styles.urgentStripHeaderIcon}`}>warning_amber</span>
        <span className={styles.urgentStripTitle}>Needs attention</span>
      </div>

      <div className={styles.urgentStripItems}>

        {items.map((item, i) => (
          <button key={i} className={styles.urgentItem} onClick={() => navigate(item.route)}>

            <span className={`mi ${styles.urgentItemIcon}`}>{item.icon}</span>
            <span className={styles.urgentItemText}>{item.text}</span>
            <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)', marginLeft: 'auto', flexShrink: 0 }}>chevron_right</span>
          
          </button>
        ))}

      </div>
    </div>
  )
}

