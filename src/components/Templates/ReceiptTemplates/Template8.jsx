import styles from "../styles/Template8.module.css"
import { calcTax } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { formatMoney } from "../../../utils/moneyUtils"


const METHOD_EMOJI = {
  cash:     '💵',
  transfer: '🏦',
  card:     '💳',
}

function methodEmoji(method) {
  return METHOD_EMOJI[(method || '').toLowerCase()] ?? '🧾'
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '—'
}


export function ReceiptTemplate8({ receipt, customer, receiptBrandSettings }) {

  const accentColor = receiptBrandSettings.colour || '#1C1814'
  const { currency, showTax, receiptTaxRate: receiptBrandSettingsTaxRate } = receiptBrandSettings

  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee = parseFloat(receipt.shippingFee) || 0
  const discountAmount = parseFloat(receipt.discountAmount) || 0
  const discountType = receipt.discountType || null
  const discountValue  = parseFloat(receipt.discountValue)  || 0
  const useTax = receipt.taxRate != null ? receipt.taxRate > 0 : (showTax && receiptBrandSettingsTaxRate > 0)
  const taxRate = receipt.taxRate != null ? receipt.taxRate : receiptBrandSettingsTaxRate
  const taxAmount = parseFloat(receipt.taxAmount) || calcTax(subtotal, taxRate, useTax)
  const grandTotal = receipt.totalAmount != null
    ? parseFloat(receipt.totalAmount)
    : subtotal + shippingFee - discountAmount + taxAmount

  const discountLabel = discountType === 'percent'
    ? `Discount (${discountValue}%)`
    : 'Discount'

  const hasExtras = shippingFee > 0 || discountAmount > 0 || (useTax && taxAmount > 0)

  return (
    <div className={styles.template}>

      <div className={styles.header}>
        <div className={styles.logoArea}>

          <div className={styles.logoCircle}>

            {receiptBrandSettings.logo
              ? <img src={receiptBrandSettings.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
              : <span className="mi" style={{ fontSize: 16, color: 'var(--brand-primary)' }}>checkroom</span>
            }
          </div>

          <div>
            <div className={styles.receiptBrandSettingsName}>{receiptBrandSettings.name || receiptBrandSettings.ownerName}</div>
            {receiptBrandSettings.tagline && <div className={styles.receiptBrandSettingsSub}>{receiptBrandSettings.tagline}</div>}
          </div>

        </div>

        <div className={styles.receiptBox} style={{ background: accentColor }}>
          <div className={styles.receiptTitle}>RECEIPT</div>
          <div className={styles.receiptMeta}>
            <div><span>Receipt No</span><span>#{receipt.number}</span></div>
            <div><span>Issue Date</span><span>{receipt.date}</span></div>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.orderDescriptionRow}>
          <div className={styles.orderText}>ORDER:</div>
          <div className={styles.orderDescLabel}>{receipt.orderDesc || 'Garment Order'}</div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.colSn}>SN</th>
              <th className={styles.colDesc}>Item Description</th>
              <th className={styles.colPrice}>Unit Price</th>
              <th className={styles.colQty}>Qty</th>
              <th className={styles.colTotal}>Total</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {receipt.items?.map((item, i) => {
              const qty = item.qty ?? 1
              const unitPrice  = parseFloat(item.price) || 0
              const lineAmount = qty * unitPrice
              return (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.colSn}>{i + 1}</td>
                  <td className={styles.colDesc}>{item.name}</td>
                  <td className={styles.colPrice}>{formatMoney(currency, unitPrice)}</td>
                  <td className={styles.colQty}>{qty}</td>
                  <td className={styles.colTotal}>{formatMoney(currency, lineAmount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className={styles.summarySection}>
          {hasExtras && (
            <div className={styles.breakdownBlock}>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownKey}>Subtotal</span>
                <span className={styles.breakdownVal}>{formatMoney(currency, subtotal)}</span>
              </div>

              {shippingFee > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownKey}>Shipping &amp; Delivery</span>
                  <span className={styles.breakdownVal}>{formatMoney(currency, shippingFee)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={`${styles.breakdownKey} ${styles.breakdownKeyDiscount}`}>{discountLabel}</span>
                  <span className={`${styles.breakdownVal} ${styles.breakdownValDiscount}`}>−{formatMoney(currency, discountAmount)}</span>
                </div>
              )}

              {useTax && taxAmount > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownKey}>VAT ({taxRate}%)</span>
                  <span className={styles.breakdownVal}>{formatMoney(currency, taxAmount)}</span>
                </div>
              )}
            </div>
          )}

          <div className={styles.orderTotalWrap}>
            <div className={styles.orderTotalLabel}>Order Total</div>
            <div className={styles.orderTotalValue}>{formatMoney(currency, grandTotal)}</div>
          </div>
        </div>

        <ReceiptPaymentSummary receipt={receipt} receiptBrandSettings={receiptBrandSettings} />

      </div>

      <div className={styles.bottom}>
        <div className={styles.box} style={{ background: accentColor }}>
          <div className={styles.boxTitle}>Receipt to</div>
          <div className={styles.boxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.boxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.boxAddr}>{customer.address}</div>}
        </div>

        {receiptBrandSettings.accountBank && (
          <div className={styles.paymentInfo}>
            <div className={styles.paymentLabel}>Payment Details</div>
            {receiptBrandSettings.name && <div>Received By: {receiptBrandSettings.name}</div>}
          </div>
        )}
      </div>

      {receiptBrandSettings.footer && (
        <div className={styles.thankYouFooter}>
          <div className={styles.thankYouLine} />
          <div className={styles.thankYouText}>{receiptBrandSettings.footer}</div>
          <div className={styles.thankYouLine} />
        </div>
      )}

    </div>
  )
}