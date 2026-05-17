

import { SectionHeader } from "../SectionHeader/SectionHeader"
import { MetaRow } from "../MetaRow/MetaRow"
import { formatDate } from "../../utils"
import { TASK_CATEGORY_ICONS,TASK_STATUS_STYLES } from "../../../../datas/taskDatas"
import styles from "./RecentTasksSection.module.css"


export function RecentTasksSection({ tasks, onSeeAll }) {

  return (

    <section className={styles.section}>
      <SectionHeader title="Recent Tasks" onSeeAll={onSeeAll} styles={styles} />
      <div className={styles.listSection}>
        <div className={styles.listDivider} />
        {tasks.map((task, index) => {
          const isLast   = index === tasks.length - 1
          const isOverdue = isTaskOverdue(task)

          const iconColor  = isOverdue ? '#ef4444' : task.done ? '#15803d' : '#818cf8'
          const outerStyle = isOverdue
            ? { borderColor: 'rgba(239,68,68,0.35)',  background: 'rgba(239,68,68,0.05)' }
            : task.done
            ? { borderColor: 'rgba(21,128,61,0.3)',   background: 'rgba(21,128,61,0.04)' }
            : {}

          const statusKey   = isOverdue ? 'overdue' : task.done ? 'completed' : 'pending'
          const statusStyle = TASK_STATUS_STYLES[statusKey]
          const statusLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1)

          return (
            <div key={task.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>
              <div className={styles.listOuter} style={outerStyle}>
                <div className={styles.listInner}>
                  <span className="mi" style={{ fontSize: '1.3rem', color: iconColor }}>
                    {TASK_CATEGORY_ICONS[task.category] || 'assignment'}
                  </span>
                </div>
              </div>
              <div className={styles.listInfo}>
                <div className={styles.listDesc}>{task.desc}</div>
                {task.customerName && <MetaRow icon="person" text={task.customerName} />}
                <span
                  className={styles.statusPill}
                  style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}
                >
                  {statusLabel}
                </span>
                {task.dueDate && (
                  <div className={styles.listDue}>Due {formatDate(task.dueDate)}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
