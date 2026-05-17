import { useState } from "react"
import styles from "./StatCard.module.css"


export function StatCard({ card, navigate }) {

  const [showTip, setShowTip] = useState(false)
  const isEmpty = card.value === 0

  return (

    <div className={styles.statCard} onClick={() => navigate(card.route)}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

        <div className={styles.statIconWrap}>
          <span className="mi" style={{ fontSize: '1.75rem', color: 'var(--icon-color)' }}>
            {card.desktopIcon}
          </span>
        </div>

        {card.tooltip && (
          <div style={{ position: 'relative' }}>

            <span
              className="mi"
              style={{ fontSize: '0.9rem', color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}
              onClick={e => { 
                e.stopPropagation()
                setShowTip(v => !v) 
              }}
            >
              info
            </span>
            {showTip && (
              <div
                style={{
                  position: 'absolute', top: '22px', right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: '8px', padding: '8px 10px',
                  fontSize: '0.68rem', fontWeight: 500, color: 'var(--text2)',
                  width: '160px', lineHeight: 1.45, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
                onClick={e => e.stopPropagation()}
              >
                {card.tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.statValue} style={{ marginTop: '12px', color: isEmpty ? 'var(--text3)' : 'var(--text)', opacity: isEmpty ? 0.45 : 1 }}>
        {card.value}
      </div>
      
      <div className={styles.statLabel}>{card.label}</div>
      {card.sub && <div className={styles.statSub} style={{ color: card.subColor }}>{card.sub}</div>}
    
    </div>
  )
}
