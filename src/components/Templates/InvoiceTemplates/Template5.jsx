import styles from "../styles/Template5.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatMoney } from "../../../utils/moneyUtils"


export function InvoiceTemplate5({ invoice, customer, invoiceBrandSettings }) {

  const dueDate = getDueDate(invoice, invoiceBrandSettings.dueDays)
  const { currency, showTax, invoiceTaxRate: invoiceBrandSettingsTaxRate } = invoiceBrandSettings

  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee = parseFloat(invoice.shippingFee) || 0
  const discountAmount = parseFloat(invoice.discountAmount) || 0
  const discountType = invoice.discountType || null 
  const discountValue  = parseFloat(invoice.discountValue) || 0
  const useTax  = invoice.taxRate != null ? invoice.taxRate > 0 : (showTax && invoiceBrandSettingsTaxRate > 0)
  const taxRate  = invoice.taxRate != null ? invoice.taxRate : invoiceBrandSettingsTaxRate
  const taxAmount  = parseFloat(invoice.taxAmount) || calcTax(subtotal, taxRate, useTax)
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

      <div className={styles.top}>

        <div className={styles.title}>Invoice</div>

        <div className={styles.topRight}>
          <div>{invoice.date}</div>
          <div>
            <strong>Invoice #</strong>
            <strong>  {invoice.number}</strong>
            
            </div>
        </div>

      </div>

      <div className={styles.divider} />

      <div className={styles.billedTo}>

        <div className={styles.billedLabel}>Billed to</div>
        <div><strong>{customer.name}</strong></div>
        {customer.phone   && <div>{customer.phone}</div>}
        {customer.address && <div>{customer.address}</div>}

      </div>

      <div className={styles.divider} />

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
        <tbody>
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
      


      <div className={styles.footer}>
       
        {invoiceBrandSettings.accountBank ? (
          
          <div className={styles.footerItem}>
            
            <div className={styles.footerLabel}>Payment Information</div>
            <div>{invoiceBrandSettings.name || invoiceBrandSettings.ownerName}</div>
            {invoiceBrandSettings.accountBank   && <div>Bank Name : {invoiceBrandSettings.accountBank}</div>}
            {invoiceBrandSettings.accountNumber && <div>Account No : {invoiceBrandSettings.accountNumber}</div>}
            {invoiceBrandSettings.accountName   && <div>Name : {invoiceBrandSettings.accountName}</div>}

          </div>
        )  : <div />}
        <div className={styles.footerItem} style={{ textAlign : 'right' }}>
          <div><strong>{invoiceBrandSettings.name || invoiceBrandSettings.ownerName}</strong></div>
          {invoiceBrandSettings.phone   && <div>{invoiceBrandSettings.phone}</div>}
          {invoiceBrandSettings.email   && <div>{invoiceBrandSettings.email}</div>}
          {invoiceBrandSettings.address && <div>{invoiceBrandSettings.address}</div>}
        </div>
      </div>
    </div>
  )
}
