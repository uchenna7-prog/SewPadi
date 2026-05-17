import { ORDER_STATUS_STYLES } from "../../../../datas/orderDatas"
import styles from "./StatusPill.module.css"


export function StatusPill({ status }) {

  const s   = (status || 'pending').toLowerCase()
  const sty = ORDER_STATUS_STYLES[s] || ORDER_STATUS_STYLES.pending
  return (
    <span className={styles.statusPill}
      style={{ background: sty.bg, color: sty.color, borderColor: sty.border }}>
      {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}