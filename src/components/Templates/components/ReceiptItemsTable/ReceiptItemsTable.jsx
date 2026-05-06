import { calcTax } from "../../utils/receiptUtils"
import styles from "./ReceiptItemsTable.module.css"
import { formatCurrency } from "../../../../utils/formatCurrency"
import { useBrandTokens } from "../../../../hooks/useBrandTokens"
import { useRef } from "react"

export function ItemsTable({ receipt, brand }) {

  const tableRef = useRef()

  useBrandTokens(brand.colourId, tableRef)

  const { currency, showTax, invoiceTaxRate: brandTaxRate } = brand

  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  // Prefer frozen values from the receipt object; fall back to brand/calc
  const shippingFee    = parseFloat(receipt.shippingFee)    || 0
  const discountAmount = parseFloat(receipt.discountAmount) || 0
  const discountType   = receipt.discountType   || null   // 'percent' | 'flat' | null
  const discountValue  = parseFloat(receipt.discountValue)  || 0
  const useTax         = receipt.taxRate != null ? receipt.taxRate > 0 : (showTax && brandTaxRate > 0)
  const taxRate        = receipt.taxRate != null ? receipt.taxRate : brandTaxRate
  const taxAmount      = parseFloat(receipt.taxAmount) || calcTax(subtotal, taxRate, useTax)
  const grandTotal     = receipt.totalAmount != null
    ? parseFloat(receipt.totalAmount)
    : subtotal + shippingFee - discountAmount + taxAmount

  const discountLabel = discountType === 'percent'
    ? `Discount (${discountValue}%)`
    : 'Discount'

  const hasExtras = shippingFee > 0 || discountAmount > 0 || (useTax && taxAmount > 0)

  return (
    <div className={styles.table} ref={tableRef}>

      {/* Order descriptor */}
      <div className={styles.orderDescriptionRow}>
        <div className={styles.orderText}>ORDER:</div>
        <div className={styles.orderDescLabel}>{receipt.orderDesc || 'Garment Order'}</div>
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
        {receipt.items?.length > 0 && (
          <tbody className={styles.itemsBody}>
            {receipt.items.map((item, idx) => {
              const qty        = item.qty ?? 1
              const unitPrice  = parseFloat(item.price) || 0
              const lineAmount = qty * unitPrice
              return (
                <tr key={idx} className={styles.itemRow}>
                  <td className={`${styles.colItem} ${styles.itemName}`}>{item.name}</td>
                  <td className={`${styles.colPrice} ${styles.itemUnitPrice}`}>{ formatCurrency(currency, unitPrice)}</td>
                  <td className={`${styles.colQty} ${styles.itemQty}`}>{qty}</td>
                  <td className={`${styles.colAmount} ${styles.itemLineAmount}`}>{ formatCurrency(currency, lineAmount)}</td>
                </tr>
              )
            })}
          </tbody>
        )}
      </table>

      {/* ── Full-width summary section ── */}
      <div className={styles.summarySection}>

        {/* Breakdown rows — only shown when there are extras beyond subtotal */}
        {hasExtras && (
          <div className={styles.breakdownBlock}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownKey}>Subtotal</span>
              <span className={styles.breakdownVal}>{ formatCurrency(currency, subtotal)}</span>
            </div>

            {shippingFee > 0 && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownKey}>Shipping &amp; Delivery</span>
                <span className={styles.breakdownVal}>{ formatCurrency(currency, shippingFee)}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className={styles.breakdownRow}>
                <span className={`${styles.breakdownKey} ${styles.breakdownKeyDiscount}`}>{discountLabel}</span>
                <span className={`${styles.breakdownVal} ${styles.breakdownValDiscount}`}>−{ formatCurrency(currency, discountAmount)}</span>
              </div>
            )}

            {useTax && taxAmount > 0 && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownKey}>VAT ({taxRate}%)</span>
                <span className={styles.breakdownVal}>{ formatCurrency(currency, taxAmount)}</span>
              </div>
            )}
          </div>
        )}

        {/* Grand total bar — always shown, full width */}
        <div className={styles.orderTotalWrap}>
          <div className={styles.orderTotalLabel}>Order Total</div>
          <div className={styles.orderTotalValue}>{ formatCurrency(currency, grandTotal)}</div>
        </div>

      </div>

    </div>
  )
}
