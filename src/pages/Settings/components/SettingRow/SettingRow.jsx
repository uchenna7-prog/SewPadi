import styles from "./SettingRow.module.css"

export function SettingRow({ 
  icon, 
  label, 
  sub, 
  value, 
  children, 
  onClick, 
  chevron, 
  divider=true, 
  locked=false, 
  danger=false 
}) {
  return (

    <div
      className={`
        ${styles.row} 
        ${onClick && !locked ? styles.rowTappable: ''} 
        ${locked ? styles.rowLocked: ''}
        ${!divider ? styles.noDivider: ''}
        `}
      onClick={locked?undefined:onClick}
    >
      <div className={styles.rowIcon}>

        <span className="mi" style={{ fontSize:'1.15rem', color: danger ? '#ef4444' : undefined }}>{icon}</span>

      </div>

      <div className={styles.rowText}>

        <div className={styles.rowLabel} style={{ color: danger ? '#ef4444' : undefined }}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}

      </div>

      <div className={styles.rowRight}>

        {locked ? 
          <span className="mi" style={{ fontSize:'1.1rem',color:'var(--accent)',opacity:0.7 }}>lock</span>
          :
          <>
            {value && <span className={styles.rowValue}>{value}</span>}
            {children}
            {chevron && <span className="mi" style={{ fontSize:'1rem',color:'var(--text3)',marginLeft:6 }}>chevron_right</span>}
          </>
        }

      </div>

    </div>
  )
}
