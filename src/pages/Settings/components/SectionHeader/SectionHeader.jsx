import styles from "./SectionHeader.module.css"

export function SectionHeader({ icon, label, premium = false }) {
  return (
    <div className={styles.sectionHeader}>

      <span className="mi" style={{ fontSize:'1.1rem',color:'var(--accent)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
      {premium && (
        <span className={styles.premiumBadge}>

          <span className="mi" style={{ fontSize:'0.7rem' }}>workspace_premium</span>PRO

        </span>
      )}
      
    </div>
  )
}