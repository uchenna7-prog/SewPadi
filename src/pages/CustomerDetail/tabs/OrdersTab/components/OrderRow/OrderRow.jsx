import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, ORDER_STAGES } from '../../../../../../datas/orderDatas'
import { formatShortDate } from '../../utils'
import OrderMosaic from '../../../../../../components/OrderMosaic/OrderMosaic'
import styles from './OrderRow.module.css'


export function OrderRow({ order, ordersInGroup, index, onTap }) {

  const statusKey    = order.status || 'pending'
  const statusLabel  = ORDER_STATUS_LABELS[statusKey] ?? ORDER_STATUS_LABELS.pending
  const statusStyle  = ORDER_STATUS_STYLES[statusKey] ?? ORDER_STATUS_STYLES.pending
  const stageInfo    = ORDER_STAGES.find(s => s.value === order.stage)
  const items        = order.items || []
  const itemCount    = items.length
  const displayPrice = order.totalAmount != null ? order.totalAmount : order.price
  const priceText    = displayPrice != null ? `₦${Number(displayPrice).toLocaleString()}` : '—'
  const dueDateRaw   = order.dueRaw || order.dueDate
  const isLastInGroup = index === ordersInGroup.length - 1

  return (
    <div
      className={`${styles.orderRow} ${isLastInGroup ? styles.orderRow_last : ''}`}
      onClick={() => onTap(order)}
    >
      <OrderMosaic items={items} />

      <div className={styles.orderRowInfo}>
        <div className={styles.orderRowDescription}>{order.desc}</div>
        {itemCount > 0 && (
          <div className={styles.orderRowMeta}>
            <span className={styles.orderRowMetaText}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        )}
        {stageInfo && (
          <div className={styles.orderRowStage}>
            <span className="material-icons">{stageInfo.icon}</span>
            <span>{stageInfo.label}</span>
          </div>
        )}
      </div>

      <div className={styles.orderRowRight}>
        <div className={styles.orderRowPrice}>{priceText}</div>
        <span className={styles.orderStatusBadge} style={statusStyle}>
          {statusLabel}
        </span>
        {dueDateRaw && (
          <div className={styles.orderRowDueDate}>
            Due {formatShortDate(dueDateRaw)}
          </div>
        )}
      </div>
    </div>
  )
}