import styles from "../styles/Template7.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatCurrency } from "../../../utils/formatCurrency"

export function InvoiceTemplate7({ invoice, customer, brand }) {
  const dueDate = getDueDate(invoice, brand.invoiceDueDays)
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

        <div className={styles.logoCircle} style={{ borderColor : accentColor }}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width : "45px", height : "45px", objectFit : 'contain', borderRadius : '50%' }} />
             : <span className="mi" style={{ fontSize : 13, color : accentColor }}>checkroom</span>
          }
        </div>

        <div className={styles.titleGroup}>
          <span className={styles.invoiceWord}>INVOICE</span>
          <span className={styles.invoiceNumber}>#{invoice.number}</span>
        </div>

        <div className={styles.dateBlock}>

          <div className={styles.dateLabel}>ISSUE DATE</div>
          <div className={styles.dateValue} style={{ color : accentColor }}>{invoice.date}</div>
          <div className={styles.dateLabel} style={{ marginTop : 2 }}>DUE DATE</div>
          <div className={styles.dateValue} style={{ color : accentColor }}>{dueDate}</div>

        </div>

      </div>

      <div className={styles.divider} />

      <div className={styles.fromTo}>

        <div className={styles.fromToBlock}>

          <div className={styles.fromLabel}>FROM :</div>
          <div className={styles.fromDivider} />
          {[
            ['NAME :', brand.ownerName || brand.name],
            ['COMPANY :', (brand.name || '')],
            ['PHONE :', (brand.phone || '')],
            ['EMAIL :', (brand.email || '')],
            ['ADDRESS :', (brand.address || '')]
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l} className={styles.infoRow}>
              <span className={styles.infoKey}>{l}</span>
              <span className={styles.infoValue}>{v}</span>
            </div>
          ))}
        </div>

        <div className={styles.fromToBlock}>
          <div className={styles.toLabel}>TO :</div>
          <div className={styles.fromDivider} />
          {[
            ['NAME :', (customer.name || '')],
            ['PHONE :', (customer.phone || '')],
            ['ADDRESS :', (customer.address || '')],
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l} className={styles.infoRow}>
              <span className={styles.infoKey}>{l}</span>
              <span className={styles.infoValue}>{v}</span>
            </div>
          ))}
        </div>

      </div>

      <div className={styles.divider} />

      <div className={styles.forLabel}>FOR :</div>

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
                  <td className={styles.colSn}>{i + 1}</td>
                  <td className={styles.colDesc}>{item.name}</td>
                  <td className={styles.colQty}>{qty}</td>
                  <td className={styles.colPrice}>{ formatCurrency(currency, unitPrice)}</td>
                  <td className={styles.colTotal} style={{ color : accentColor }}>
                    { formatCurrency(currency, lineAmount)}
                  </td>
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
      


      <div className={styles.footer}>
        {brand.accountBank && (
        
        <div className={styles.footerLeft}>
          
           <div>
            <h3 className={styles.footerLabel}>Payment Information:</h3>

            {brand.accountBank && (
              <div>Bank Name: {brand.accountBank}</div>
            )}

            {brand.accountNumber && (
              <div>Account Number: {brand.accountNumber}</div>
            )}

            {brand.accountName && (
              <div>Account Name: {brand.accountName}</div>
            )}
            
          </div>

        </div>
      )}

      {brand.invoiceFooter && (
        <div className={styles.footerRight}>
          <h3 className={styles.footerLabel} style={{color :"var(--brand-primary-dark)"}}>Notes:</h3>{brand.invoiceFooter}
        </div>
      )}

      </div>
     
    </div>
  )
}
