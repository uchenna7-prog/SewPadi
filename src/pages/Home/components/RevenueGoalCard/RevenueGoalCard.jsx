import styles from "./RevenueGoalCard.module.css"


export function RevenueGoalCard({ goal, earned, goalPercent, delta, isUp, onOpen }) {

  const periodName = goal.period === 'weekly' ? 'week' : goal.period === 'monthly' ? 'month' : 'year'
  const deltaColor = isUp ? '#15803d' : '#ef4444'
  const deltaIcon = isUp ? 'arrow_upward' : 'arrow_downward'

  return (
    <div className={styles.revenueCard} onClick={onOpen}>

      <div className={styles.revenueCardLeft}>

        <div className={styles.revenueLabel}>{periodLabel(goal.period)}</div>
        <div className={styles.revenueAmount}>
          {goal.currency}{earned.toLocaleString()}
        </div>

        <div className={styles.revenueTarget}>
          Goal: {goal.currency}{goal.goal.toLocaleString()}
        </div>
        {delta !== 0 && (
          <div className={styles.revenueVs}>

            <span className="mi" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginRight: '3px', color: deltaColor }}>
              {deltaIcon}
            </span>

            <span style={{ color: deltaColor, fontSize: '0.72rem', fontWeight: 700 }}>
              {goal.currency}{Math.abs(delta).toLocaleString()}
            </span>

            <span style={{ color: 'var(--text3)', fontSize: '0.7rem', marginLeft: '3px' }}>
              vs last {periodName}
            </span>

          </div>
        )}
      </div>

      <div className={styles.revenueDonutWrap}>
        <RevenueDonut percentage ={goalPercent} />
      </div>
      
    </div>
  )
}
