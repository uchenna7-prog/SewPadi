
import { formatMoney } from "../../../../../../utils/moneyUtils"
import { getPaymentStatus } from "../../utils"
import OrderMosaic from "../../../../../../components/OrderMosaic/OrderMosaic"
import styles from "./ReceiptRow.module.css"


export function ReceiptRow({ receipt, currency, onTap, isLast, orderItems }) {
  const { thisPayment, isPaidInFull, label, badgeStyle } = getPaymentStatus(receipt)
  const itemCount = receipt.items?.length > 0 ? receipt.items.length : (receipt.qty || null)

  return (
    <div
      className={`${styles.receiptRow} ${isLast ? styles.receiptRowLast : ''}`}
      onClick={onTap}
    >
      <OrderMosaic items={orderItems} size="md" />

      <div className={styles.receiptRowInfo}>
        <div className={styles.receiptRowTitle}>{receipt.orderDesc || 'Payment'}</div>
        {itemCount && (
          <div className={styles.receiptRowItemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      <div className={styles.receiptRowRight}>
        <span className={styles.receiptStatusBadge} style={badgeStyle}>
          {label}
        </span>
        <div className={styles.receiptRowAmount}>
          {formatMoney(currency, thisPayment)}
        </div>
      </div>
    </div>
  )
}
