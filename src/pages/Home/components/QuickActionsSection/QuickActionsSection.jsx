import { QUICK_ACTIONS } from "../../datas"
import styles from "./QuickActionsSection.module.css"


export function QuickActionsSection({ onNavigate }) {
  return (

    <section className={styles.quickActionsDesktop}>

      <h3 className={styles.sectionTitle}>Quick Actions</h3>

      <div className={styles.statsGrid}>

        {QUICK_ACTIONS.map(action => (
          <div key={action.label} className={styles.actionCard} onClick={() => onNavigate(action.route)}>
            
            <div className={styles.statIconWrap}>
              <span className="mi" style={{ fontSize: '1.75rem', color: 'var(--icon-color)' }}>
                {action.icon}
              </span>
            </div>

            <div className={styles.actionCardText}>
              <div className={styles.actionLabel}>{action.label}</div>
            </div>

          </div>
        ))}

      </div>

    </section>
  )
}
