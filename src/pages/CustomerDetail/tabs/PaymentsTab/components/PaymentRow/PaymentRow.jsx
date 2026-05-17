import { getTotalPaid, getStatusMeta, getProgressPercent } from '../../utils'
import { formatMoney } from '../../../../../../utils/moneyUtils'
import OrderMosaic from '../../../../../../components/OrderMosaic/OrderMosaic'
import styles from './PaymentRow.module.css'


export function PaymentRow({ payment, index, datePayments, orderItemsMap, onTap }) {

  const statusMeta   = getStatusMeta(payment.status)
  const isLast       = index === datePayments.length - 1
  const installments = payment.installments || []
  const totalPaid    = getTotalPaid(installments)
  const fullPrice    = parseFloat(payment.orderPrice) || 0
  const progressPct  = getProgressPercent(totalPaid, fullPrice, payment.status)
  const orderItems   = orderItemsMap[payment.orderId] ?? []

  return (
    <div
      className={`${styles.paymentRow} ${isLast ? styles.paymentRowLast : ''}`}
      onClick={() => onTap(payment)}
    >
      <OrderMosaic items={orderItems} size="md" fallbackIcon="payments" fallbackColor={statusMeta.color} />

      <div className={styles.paymentRowInfo}>
        <div className={styles.paymentRowTitle}>{payment.orderDesc || 'Payment'}</div>
        <div className={styles.paymentRowMeta}>
          <span
            className={styles.paymentStatusBadge}
            style={{ color: statusMeta.color, background: statusMeta.background, borderColor: statusMeta.borderColor }}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      <div className={styles.paymentRowRight}>
        <div className={styles.paymentRowAmount}>
          {fullPrice > 0 ? formatMoney(totalPaid) : formatMoney(installments[0]?.amount)}
        </div>
        {fullPrice > 0 && totalPaid < fullPrice && (
          <div className={styles.paymentRowSubAmount}>of {formatMoney(fullPrice)}</div>
        )}
        {fullPrice > 0 && (
          <div className={styles.miniProgressTrack}>
            <div className={styles.miniProgressFill} style={{ width: `${progressPct}%`, background: statusMeta.color }} />
          </div>
        )}
      </div>
    </div>
  )
}