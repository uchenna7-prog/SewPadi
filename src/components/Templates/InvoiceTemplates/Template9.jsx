import styles from "../styles/Template9.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatCurrency } from "../../../utils/formatCurrency"

export function InvoiceTemplate9({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.invoiceDueDays)
  const accentColor = brand.colour || '#1C1814'
  const { currency, showTax, invoiceTaxRate: brandTaxRate } = brand

  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee    = parseFloat(invoice.shippingFee)    || 0
  const discountAmount = parseFloat(invoice.discountAmount) || 0
  const discountType   = invoice.discountType   || null 
  const discountValue  = parseFloat(invoice.discountValue)  || 0
  const useTax         = invoice.taxRate != null ? invoice.taxRate > 0 : (showTax && brandTaxRate > 0)
  const taxRate        = invoice.taxRate != null ? invoice.taxRate : brandTaxRate
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

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.logoArea}>

          <div className={styles.logoCircle}>
            {brand.logo
              ? <img src={brand.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
               : <span className="mi" style={{ fontSize : 13, color : 'var(--brand-on-primary)' }}>checkroom</span>
            }
          </div>

          <div>
            <div className={styles.companyName}>{(brand.name || brand.ownerName || 'YOUR BRAND').toUpperCase()}</div>
            {brand.tagline && <div className={styles.tagline}>{brand.tagline}</div>}
          </div>

        </div>
        
        <div className={styles.headerRight}>
          {brand.address && <div>{brand.address}</div>}
        </div>

        <div className={styles.headerRight}>
          {brand.phone && <div>{brand.phone}</div>}
          {brand.email && <div>{brand.email}</div>}
          {brand.website && <div>{brand.website}</div>}
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
        {brand.accountBank && (
          <div>
            <div className={styles.infoLabel}>PAYMENT</div>
            <strong>{brand.accountBank}</strong><br />
            {brand.accountName && <span>{brand.accountName}<br /></span>}
            {brand.accountNumber && <span>Acct : {brand.accountNumber}</span>}
          </div>
        )}
        <div>
          <div className={styles.infoLabel}>BILL FROM</div>
          {brand.name || brand.ownerName}<br />
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.address}
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
                  <td className={styles.colPrice}>{ formatCurrency(currency, unitPrice)}</td>
                  <td className={styles.colQty}>{qty}</td>
                  <td className={styles.colTotal}>{ formatCurrency(currency, lineAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={styles.summaryBlock}>
  
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Subtotal</span>
            <span className={styles.summaryVal}>{ formatCurrency(currency, subtotal)}</span>
          </div>
  
          {shippingFee > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Shipping &amp; Delivery</span>
              <span className={styles.summaryVal}>{ formatCurrency(currency, shippingFee)}</span>
            </div>
          )}
  
          {discountAmount > 0 && (
            <div className={styles.summaryRow}>
              <span className={`${styles.summaryKey} ${styles.summaryKeyDiscount}`}>{discountLabel}</span>
              <span className={`${styles.summaryVal} ${styles.summaryValDiscount}`}>−{ formatCurrency(currency, discountAmount)}</span>
            </div>
          )}
  
          {useTax && taxAmount > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>VAT ({taxRate}%)</span>
              <span className={styles.summaryVal}>{ formatCurrency(currency, taxAmount)}</span>
            </div>
          )}
  
  
        </div>

        <div className={styles.totalBar} style={{ background : accentColor }}>
          <span>TOTAL</span>
          <span className={styles.summaryTotalVal}>{ formatCurrency(currency, grandTotal)}</span>
        </div>

        
      </div>
      
      
      <div className={styles.thankYou}>{brand.invoiceFooter || 'THANK YOU FOR YOUR BUSINESS'}</div>
    </div>
  )
}
