import styles from "../styles/Template9.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatMoney } from "../../../utils/moneyUtils"

export function InvoiceTemplate9({ invoice, customer, invoiceBrandSettings }) {
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
  const useTax = invoice.taxRate != null ? invoice.taxRate > 0 : (showTax && invoiceBrandSettingsTaxRate > 0)
  const taxRate = invoice.taxRate != null ? invoice.taxRate : invoiceBrandSettingsTaxRate
  const taxAmount = parseFloat(invoice.taxAmount) || calcTax(subtotal, taxRate, useTax)
  const grandTotal = invoice.totalAmount != null
    ? parseFloat(invoice.totalAmount)
    : subtotal + shippingFee - discountAmount + taxAmount

  const discountLabel = discountType === 'percent'
    ? `Discount (${discountValue}%)`
    : discountType === 'flat'
      ? 'Discount'
      : 'Discount'


  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.logoArea}>

          <div className={styles.logoCircle}>
            {invoiceBrandSettings.logo
              ? <img src={invoiceBrandSettings.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
               : <span className="mi" style={{ fontSize : 13, color : 'var(--brand-on-primary)' }}>checkroom</span>
            }
          </div>

          <div>
            <div className={styles.companyName}>{(invoiceBrandSettings.name || invoiceBrandSettings.ownerName || 'YOUR invoiceBrandSettings').toUpperCase()}</div>
            {invoiceBrandSettings.tagline && <div className={styles.tagline}>{invoiceBrandSettings.tagline}</div>}
          </div>

        </div>
        
        <div className={styles.headerRight}>
          {invoiceBrandSettings.address && <div>{invoiceBrandSettings.address}</div>}
        </div>

        <div className={styles.headerRight}>
          {invoiceBrandSettings.phone && <div>{invoiceBrandSettings.phone}</div>}
          {invoiceBrandSettings.email && <div>{invoiceBrandSettings.email}</div>}
          {invoiceBrandSettings.website && <div>{invoiceBrandSettings.website}</div>}
        </div>

      </div>

      <div className={styles.invoiceRow}>
        <div className={styles.invoiceLeft}>
          <span className={styles.invoiceWord}>INVOICE </span>
          <span className={styles.invoiceNum}>#{invoice.number}</span>
        </div>
        <div className={styles.invoiceRight}>
          <div><span className={styles.label}>ISSUE DATE </span> {invoice.date}</div>
          <div><span className={styles.label}>DUE DATE </span> {dueDate}</div>
        </div>
      </div>
      <div className={styles.infoRow}>
        {invoiceBrandSettings.accountBank && (
          <div>
            <div className={styles.infoLabel}>PAYMENT</div>
            <strong>{invoiceBrandSettings.accountBank}</strong><br />
            {invoiceBrandSettings.accountName && <span>{invoiceBrandSettings.accountName}<br /></span>}
            {invoiceBrandSettings.accountNumber && <span>Acct : {invoiceBrandSettings.accountNumber}</span>}
          </div>
        )}
        <div>
          <div className={styles.infoLabel}>BILL FROM</div>
          {invoiceBrandSettings.name || invoiceBrandSettings.ownerName}<br />
          {invoiceBrandSettings.phone   && <div>{invoiceBrandSettings.phone}</div>}
          {invoiceBrandSettings.address}
        </div>
        <div>
          <div className={`${styles.infoLabel} ${styles.infoLabelRight}`}>BILL TO</div>
          {customer.name}<br />
          {customer.phone}<br />
          {customer.address}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.orderDescriptionRow}>

          <div className={styles.orderText}>ORDER:</div>
          <div className={styles.orderDescLabel}>{invoice.orderDesc || 'Garment Order'}</div>
  
        </div>
        <table className={styles.table}>

          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.colDesc}>Item Description</th>
              <th className={styles.colPrice}>Unit Price</th>
              <th className={styles.colQty}>Qty</th>
              <th className={styles.colTotal}>Total</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {invoice.items?.map((item, i) => {
              const qty = item.qty ?? 1;
              const unitPrice = parseFloat(item.price) || 0;
              const lineAmount = qty * unitPrice;

              return (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.colDesc}>{item.name}</td>
                  <td className={styles.colPrice}>{ formatMoney(currency, unitPrice)}</td>
                  <td className={styles.colQty}>{qty}</td>
                  <td className={styles.colTotal}>{ formatMoney(currency, lineAmount)}</td>
                </tr>
              );
            })}
          </tbody>
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
  
  
        </div>

        <div className={styles.totalBar} style={{ background : accentColor }}>
          <span>TOTAL</span>
          <span className={styles.summaryTotalVal}>{ formatMoney(currency, grandTotal)}</span>
        </div>

        
      </div>
      
      
      <div className={styles.thankYou}>{invoiceBrandSettings.footer || 'THANK YOU FOR YOUR BUSINESS'}</div>
    </div>
  )
}
