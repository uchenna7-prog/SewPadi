import styles from "../styles/Template6.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatMoney } from "../../../utils/moneyUtils"


export function InvoiceTemplate6({ invoice, customer, invoiceBrandSettings }) {
  const dueDate = getDueDate(invoice, invoiceBrandSettings.dueDays)
  const accentColor = invoiceBrandSettings.colour || '#1C1814'
  const { currency, showTax, invoiceTaxRate: invoiceBrandSettingsTaxRate } = invoiceBrandSettings

  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee = parseFloat(invoice.shippingFee) || 0
  const discountAmount = parseFloat(invoice.discountAmount) || 0
  const discountType = invoice.discountType  || null 
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
      <div className={styles.headerZone}>
        <svg
          style={{ position : 'absolute', inset : 0, width : '100%', height : '100%' }}
          viewBox="0 0 400 72"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 400,0 400,28 0,72" fill={accentColor} />
        </svg>
        <div style={{ position : 'absolute', top : 10, left : 18, zIndex : 1 }}>
          <span className={styles.bannerTitle}>INVOICE</span>
        </div>
        <div className={styles.invoiceBrandSettingsInBanner}>

          <div>
            <div className={styles.invoiceBrandSettingsName} style={{ color : "var(--brand-on-primary)" }} >{invoiceBrandSettings.name || invoiceBrandSettings.ownerName}</div>
            <div className={styles.invoiceBrandSettingsSub}>TAILOR SHOP</div>
          </div>
        </div>
      </div>
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>Invoice To</div>
          <div className={styles.metaName}>{customer.name}</div>
          {customer.phone   && <div className={styles.metaAddress}>{customer.phone}</div>}
          {customer.address && <div className={styles.metaAddress}>{customer.address}</div>}
        </div>
        <div style={{ textAlign : 'right' }}>
          <div><span className={styles.metaKey}>Invoice#</span> <strong>{invoice.number}</strong></div>
          <div><span className={styles.metaKey}>Date</span> <strong>{invoice.date}</strong></div>
          <div><span className={styles.metaKey}>Due</span> <strong>{dueDate}</strong></div>
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
            const qty = item.qty ?? 1;
            const unitPrice = parseFloat(item.price) || 0;
            const lineAmount = qty * unitPrice;

            return (
              <tr key={i} className={styles.tableRow}>
                <td className={styles.colSn}>{i + 1}</td>
                <td className={styles.colDesc}>{item.name}</td>
                <td className={styles.colPrice}>{ formatMoney(currency, unitPrice)}</td>
                <td className={styles.colQty}>{qty}</td>
                <td className={styles.colTotal}>{ formatMoney(currency, lineAmount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

      <div className={styles.divider} />
      <div className={styles.bottom}>
        <div style={{ flex : 1 }}>
          <div className={styles.thankYou}>{invoiceBrandSettings.footer || 'Thank you for your business'}</div>
          {invoiceBrandSettings.accountBank && (
            <>
              <div className={styles.paymentLabel}>Payment Information :</div>
              <div className={styles.paymentInfo}>
                {invoiceBrandSettings.accountNumber && <span>Account Number : {invoiceBrandSettings.accountNumber}<br /></span>}
                {invoiceBrandSettings.accountBank   && <span>Bank : {invoiceBrandSettings.accountBank}<br/></span>}
                {invoiceBrandSettings.accountName   && <span>Account Name : {invoiceBrandSettings.accountName}<br /></span>}
              </div>
            </>
          )}
          {(invoiceBrandSettings.phone || invoiceBrandSettings.email) && (
            <>
              <div className={styles.label}>Contact</div>
              <div className={styles.text}>
                {invoiceBrandSettings.phone && <span>{invoiceBrandSettings.phone}<br /></span>}
                {invoiceBrandSettings.email && <span>{invoiceBrandSettings.email}</span>}
              </div>
            </>
          )}
        </div>
        <div className={styles.rightColumn}>
         
          {/* ── Right-aligned summary block ── */}
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
               

          <div className={styles.signBlock}>
            <div className={styles.signLine} />
            <div className={styles.SignLabel}>Authorised Sign</div>
          </div>
        </div>
      </div>
                {/* Corner accent — in normal flow so PDF capture always includes it */}
      <div style={{ display : 'flex', justifyContent : 'flex-end', marginTop : 'auto' }}>
        <svg
          style={{ display : 'block', width : 68, height : 58 }}
          viewBox="0 0 68 58"
        >
          <polygon points="68,0 68,58 0,58" fill={accentColor} />
        </svg>
      </div>
      
    </div>
  )
}
