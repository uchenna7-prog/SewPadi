import { calcTax } from "../../utils/invoiceUtils"
import { formatMoney } from "../../../../utils/moneyUtils"
import { useBrandTokens } from "../../../../hooks/useBrandTokens"
import { useRef } from "react"
import styles from "./InvoiceItemsTable.module.css"


export function ItemsTable({ invoice, invoiceBrandSettings}) {

  const tableRef = useRef()

  useBrandTokens(invoiceBrandSettings.colourId, tableRef)

  const { currency, showTax, invoiceTaxRate:invoiceTaxRate } = invoiceBrandSettings

  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee    = parseFloat(invoice.shippingFee)    || 0
  const discountAmount = parseFloat(invoice.discountAmount) || 0
  const discountType   = invoice.discountType   || null 
  const discountValue  = parseFloat(invoice.discountValue)  || 0
  const useTax         = invoice.taxRate != null ? invoice.taxRate > 0 : (showTax &&invoiceTaxRate > 0)
  const taxRate        = invoice.taxRate != null ? invoice.taxRate :invoiceTaxRate
  const taxAmount      = parseFloat(invoice.taxAmount) || calcTax(subtotal, taxRate, useTax)
  const grandTotal     = invoice.totalAmount != null
    ? parseFloat(invoice.totalAmount)
    : subtotal + shippingFee - discountAmount + taxAmount


  const discountLabel = discountType === 'percent'
    ? `Discount (${discountValue}%)`
    : discountType === 'flat'
      ? 'Discount'
      : 'Discount'

  return (
    <div className={styles.table} ref={tableRef}>

      
      <div className={styles.orderDescriptionRow}>
        <div className={styles.orderText}>ORDER:</div>
        <div className={styles.orderDescLabel}>{invoice.orderDesc || 'Garment Order'}</div>
      </div>

      <table className={styles.tableEl}>
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.colItem}>Item</th>
            <th className={styles.colPrice}>Unit Price</th>
            <th className={styles.colQty}>Qty</th>
            <th className={styles.colAmount}>Amount</th>
          </tr>
        </thead>
        {invoice.items?.length > 0 && (
          <tbody className={styles.itemsBody}>
            {invoice.items.map((item, idx) => {
              const qty        = item.qty ?? 1
              const unitPrice  = parseFloat(item.price) || 0
              const lineAmount = qty * unitPrice
              return (
                <tr key={idx} className={styles.itemRow}>
                  <td className={`${styles.colItem} ${styles.itemName}`}>{item.name}</td>
                  <td className={`${styles.colPrice} ${styles.itemUnitPrice}`}>{ formatMoney(currency, unitPrice)}</td>
                  <td className={`${styles.colQty} ${styles.itemQty}`}>{qty}</td>
                  <td className={`${styles.colAmount} ${styles.itemLineAmount}`}>{ formatMoney(currency, lineAmount)}</td>
                </tr>
              )
            })}
          </tbody>
        )}
      </table>

    
      <div className={styles.summaryBlock}>

        <div className={styles.summaryRow}>
          <span className={styles.summaryKey}>Subtotal</span>
          <span className={styles.summaryVal}>{ formatMoney(currency, subtotal)}</span>
        </div>

        {shippingFee > 0 && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Shipping &amp; Delivery</span>
            <span className={styles.summaryVal}>{ formatMoney(currency, shippingFee)}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className={styles.summaryRow}>
            <span className={`${styles.summaryKey} ${styles.summaryKeyDiscount}`}>{discountLabel}</span>
            <span className={`${styles.summaryVal} ${styles.summaryValDiscount}`}>−{ formatMoney(currency, discountAmount)}</span>
          </div>
        )}

        {useTax && taxAmount > 0 && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>VAT ({taxRate}%)</span>
            <span className={styles.summaryVal}>{ formatMoney(currency, taxAmount)}</span>
          </div>
        )}

        <div className={styles.summaryDivider} />

        <div className={styles.summaryTotalRow}>
          <span className={styles.summaryTotalKey}>Total Due</span>
          <span className={styles.summaryTotalVal}>{ formatMoney(currency, grandTotal)}</span>
        </div>

      </div>

    </div>
  )
}
