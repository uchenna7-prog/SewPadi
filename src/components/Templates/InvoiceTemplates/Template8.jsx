import styles from "../styles/Template8.module.css"
import { getDueDate, calcTax } from "../utils/invoiceUtils"
import { formatMoney } from "../../../utils/moneyUtils"


export function InvoiceTemplate8({ invoice, customer, invoiceBrandSettings }) {


  const dueDate = getDueDate(invoice, invoiceBrandSettings.dueDays)
  const accentColor = invoiceBrandSettings.colour || '#1C1814'
  const { currency, showTax, invoiceTaxRate: invoiceBrandSettingsTaxRate } = invoiceBrandSettings

  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee = parseFloat(invoice.shippingFee) || 0
  const discountAmount = parseFloat(invoice.discountAmount) || 0
  const discountType = invoice.discountType || null
  const discountValue  = parseFloat(invoice.discountValue)  || 0
  const useTax  = invoice.taxRate != null ? invoice.taxRate > 0 : (showTax && invoiceBrandSettingsTaxRate > 0)
  const taxRate = invoice.taxRate != null ? invoice.taxRate : invoiceBrandSettingsTaxRate
  const taxAmount = parseFloat(invoice.taxAmount) || calcTax(subtotal, taxRate, useTax)
  const grandTotal = invoice.totalAmount != null
    ? parseFloat(invoice.totalAmount)
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

            {invoiceBrandSettings.logo
              ? <img src={invoiceBrandSettings.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
              : <span className="mi" style={{ fontSize: 16, color: 'var(--brand-primary)' }}>checkroom</span>
            }

          </div>
          <div>
            <div className={styles.invoiceBrandSettingsName}>{invoiceBrandSettings.name || invoiceBrandSettings.ownerName}</div>
            {invoiceBrandSettings.tagline && <div className={styles.invoiceBrandSettingsSub}>{invoiceBrandSettings.tagline}</div>}
          </div>
        </div>

        <div className={styles.invoiceBox} style={{ background: accentColor }}>
          <div className={styles.invoiceTitle}>INVOICE</div>
          <div className={styles.invoiceMeta}>
            <div><span>Invoice No</span><span>#{invoice.number}</span></div>
            <div><span>Issue Date</span><span>{invoice.date}</span></div>
            <div><span>Due Date</span><span>{dueDate}</span></div>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.orderDescriptionRow}>
          <div className={styles.orderText}>ORDER:</div>
          <div className={styles.orderDescLabel}>{invoice.orderDesc || 'Garment Order'}</div>
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
            {invoice.items?.map((item, i) => {
              const qty        = item.qty ?? 1
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

        <div className={styles.summaryBlock}>

          {hasExtras && (
            <>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Subtotal</span>
                <span className={styles.summaryVal}>{formatMoney(currency, subtotal)}</span>
              </div>

              {shippingFee > 0 && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Shipping &amp; Delivery</span>
                  <span className={styles.summaryVal}>{formatMoney(currency, shippingFee)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span className={`${styles.summaryKey} ${styles.summaryKeyDiscount}`}>{discountLabel}</span>
                  <span className={`${styles.summaryVal} ${styles.summaryValDiscount}`}>−{formatMoney(currency, discountAmount)}</span>
                </div>
              )}

              {useTax && taxAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>VAT ({taxRate}%)</span>
                  <span className={styles.summaryVal}>{formatMoney(currency, taxAmount)}</span>
                </div>
              )}

              <div className={styles.summaryDivider} />
            </>
          )}

          <div className={styles.summaryTotalRow}>
            <span className={styles.summaryTotalKey}>Total Due</span>
            <span className={styles.summaryTotalVal}>{formatMoney(currency, grandTotal)}</span>
          </div>

        </div>
      </div>

      {/* ── Bottom: customer box + payment info ── */}
      <div className={styles.bottom}>
        <div className={styles.box} style={{ background: accentColor }}>
          <div className={styles.boxTitle}>Invoice To</div>
          <div className={styles.boxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.boxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.boxAddr}>{customer.address}</div>}
        </div>

        {invoiceBrandSettings.accountBank && (
          <div className={styles.paymentInfo}>
            <div className={styles.paymentLabel}>Payment Information</div>
            {invoiceBrandSettings.accountNumber && <div>Account No: {invoiceBrandSettings.accountNumber}</div>}
            {invoiceBrandSettings.accountBank   && <div>Bank: {invoiceBrandSettings.accountBank}</div>}
            {invoiceBrandSettings.accountName   && <div>Account Name: {invoiceBrandSettings.accountName}</div>}
          </div>
        )}
      </div>

      {invoiceBrandSettings.footer && (
        <div className={styles.thankYouFooter}>
          <div className={styles.thankYouLine} />
          <div className={styles.thankYouText}>{invoiceBrandSettings.footer}</div>
          <div className={styles.thankYouLine} />
        </div>
      )}

    </div>
  )
}