import styles from "../styles/Template8.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatCurrency } from "../../../utils/formatCurrency"


export function InvoiceTemplate8({ invoice, customer, brand }) {
  const dueDate    = getDueDate(invoice, brand.invoiceDueDays)
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

        <div className={styles.logoArea}>
          {brand.logo
            ? <img src={brand.logo} alt="" style={{ width : "45px", height : "45px", objectFit : 'contain' }} />
             : <span className="mi" style={{ fontSize : 20, color : '#333' }}>checkroom</span>
          }
          <div>
            <div className={styles.brandName}>{brand.name || brand.ownerName}</div>
            {brand.tagline && <div className={styles.brandSub}>{brand.tagline}</div>}
          </div>

        </div>

        <div className={styles.invoiceBox} style={{ background : accentColor }}>

          <div className={styles.invoiceTitle}>INVOICE</div>
          <div className={styles.invoiceMeta}>

            <div>
              <span>Invoice No</span><span>#{invoice.number}</span>
            </div>
            <div>
              <span>Issue Date</span><span>{invoice.date}</span>
            </div>
            <div>
               <span>Due Date</span><span>{dueDate}</span>
            </div>

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
            const qty = item.qty ?? 1;
            const unitPrice = parseFloat(item.price) || 0;
            const lineAmount = qty * unitPrice;

            return (
              <tr key={i} className={styles.tableRow}>
                <td className={styles.colSn}>{i + 1}</td>
                <td className={styles.colDesc}>{item.name}</td>
                <td className={styles.colPrice}>{ formatCurrency(currency, unitPrice)}</td>
                <td className={styles.colQty}>{qty}</td>
                <td className={styles.colTotal}>{ formatCurrency(currency, lineAmount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
      <div className={styles.divider} />

      <div className={styles.bottom}>

        <div className={styles.box} style={{ background : accentColor }}>

          <div className={styles.boxTitle}>Invoice To</div>
          <div className={styles.boxName}>{customer.name}</div>
          {customer.phone   && <div className={styles.boxAddr}>{customer.phone}</div>}
          {customer.address && <div className={styles.boxAddr}>{customer.address}</div>}

        </div>
        {brand.accountBank && (
          <div className={styles.paymentInfo}>
            <div className={styles.paymentLabel}>Payment Infomation</div>
            {brand.accountNumber && <div>Account No: {brand.accountNumber}</div>}
            {brand.accountBank   && <div>Bank: {brand.accountBank}</div>}
            {brand.accountName   && <div>Account Name: {brand.accountName}</div>}
          </div>
        )}
        
        
      </div>

      {brand.invoiceFooter && (
        <div className={styles.thankYouFooter}>
          <div className={styles.thankYouLine} />
          <div className={styles.thankYouText}>{brand.invoiceFooter}</div>
          <div className={styles.thankYouLine} />
        </div>
      )}

    </div>
  )
}