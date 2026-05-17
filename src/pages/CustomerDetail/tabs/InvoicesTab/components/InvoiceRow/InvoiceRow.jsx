
import { getInvoiceTotal } from "../../utils"
import { formatMoney } from "../../../../../../utils/moneyUtils"
import { INVOICE_STATUS_LABELS,INVOICE_STATUS_STYLES } from "../../../../../../datas/invoiceDatas"
import OrderMosaic from "../../../../../../components/OrderMosaic/OrderMosaic"
import styles from "./InvoiceRow.module.css"


export function InvoiceRow({ invoice, currency, onTap, isLast, orderItems }) {

  const total = getInvoiceTotal(invoice)
  const statusKey  = invoice.status || 'unpaid'
  const badgeLabel = INVOICE_STATUS_LABELS[statusKey] || invoice.status
  const badgeStyle = INVOICE_STATUS_STYLES[statusKey] || INVOICE_STATUS_STYLES.unpaid
  const itemCount  = invoice.items?.length > 0 ? invoice.items.length : (invoice.qty || null)

  return (
    <div
      className={`${styles.invoiceRow} ${isLast ? styles.invoiceRowLast : ''}`}
      onClick={onTap}
    >
      <OrderMosaic items={orderItems} size="md" />

      <div className={styles.invoiceRowInfo}>
        <div className={styles.invoiceRowTitle}>{invoice.orderDesc || 'Order'}</div>
        {itemCount && (
          <div className={styles.invoiceRowItemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      <div className={styles.invoiceRowRight}>
        <span className={styles.invoiceStatusBadge} style={badgeStyle}>
          {badgeLabel}
        </span>
        <div className={styles.invoiceRowAmount}>
          {formatMoney(currency, total, 0, 0)}
        </div>
      </div>
    </div>
  )
}
