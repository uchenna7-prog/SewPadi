import styles from "../styles/Template10.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatCurrency } from "../../../utils/formatCurrency"

export function InvoiceTemplate10({ invoice, customer, brand }) {
  const dueDate     = getDueDate(invoice, brand.invoiceDueDays)
  const accentColor = brand.colour || '#1C1814'
  const { currency, showTax, invoiceTaxRate: brandTaxRate } = brand

  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee    = parseFloat(invoice.shippingFee)    || 0
  const discountAmount = parseFloat(invoice.discountAmount) || 0
  const discountType   = invoice.discountType   || null   // 'percent' | 'flat' | null
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

        <div>
          <div className={styles.logoRow}>
            <div className={styles.logoSquare}>
              {brand.logo
                ? <img src={brand.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span className="mi" style={{ fontSize: 14, color: 'var(--brand-primary)' }}>checkroom</span>
              }
            </div>
            
            <div>
               <span className={styles.companyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</span>
                {brand.tagline && <div className={styles.companySub}>{brand.tagline}</div>}

            </div>
           
          </div>
         
          {brand.address && <div className={styles.companyAddress}>{brand.address}</div>}
        </div>
        <div className={styles.invoiceTitle} style={{ color : accentColor }}>INVOICE</div>
      </div>
      <div className={styles.numberBar}>
        <span>INVOICE # {invoice.number}</span><span>|</span>
        <span>DATE: {invoice.date}</span><span>|</span>
        <span>DUE: {dueDate}</span>
      </div>
      <div className={styles.billShip}>
        <div>
          <span className={styles.billLabel}>Bill To :</span>
          <div><strong>{customer.name}</strong></div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.email   && <div>{customer.email}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div>
          <span className={styles.billLabel}>From :</span>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.phone && <div>{brand.phone}</div>}
          {brand.email && <div>{brand.email}</div>}
          {brand.address  && <div>{brand.address}</div>}
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
            <th className={styles.colDesc}>Item Description</th>
            <th className={styles.colQty}>Qty</th>
            <th className={styles.colPrice}>Unit Price</th>
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
                <td className={styles.colQty}>{qty}</td>
                <td className={styles.colPrice}>{ formatCurrency(currency, unitPrice)}</td>
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
 
      <div style={{ marginTop : 'auto' }}>
        <div className={styles.footer}>
          <div>
            {brand.accountBank && (
              <>
                <div className={styles.thankYou}>Payment Information</div>
                <div>
                  {brand.accountNumber && <div>Account Number : {brand.accountNumber}</div>}
                  {brand.accountBank   && <div>Bank : {brand.accountBank}</div>}
                  {brand.accountName   && <div>Account Name : {brand.accountName}</div>}
                </div>
              </>
            )}
            <div className={styles.paymentNote} style={{ fontWeight : 900, color : "var(--brand-primary-dark)" }}>
              {brand.invoiceFooter}
            </div>
          </div>
          <div className={styles.signArea}>
            <div className={styles.signLine} />
            <div className={styles.signLabel}>Signature</div>
          </div>

        </div>
        <div style={{ display : 'flex', justifyContent : 'flex-end' }}>
          <svg
            style={{ display : 'block', width : 50, height : 50 }}
            viewBox="0 0 50 50"
          >
            <polygon points="50,0 50,50 0,50" fill={accentColor} opacity="0.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
