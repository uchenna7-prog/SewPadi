import styles from "../styles/Template3.module.css"
import { getDueDate,calcTax } from "../utils/invoiceUtils"
import { formatMoney } from "../../../utils/moneyUtils"


export function InvoiceTemplate3({ invoice, customer, invoiceBrandSettings }) {

  const dueDate  = getDueDate(invoice, invoiceBrandSettings.dueDays)
  const barColor = invoiceBrandSettings.colour || '#1C1814'

  const { currency, showTax, invoiceTaxRate: invoiceBrandSettingsTaxRate } = invoiceBrandSettings

  const subtotal = invoice.items?.length > 0
    ? invoice.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee = parseFloat(invoice.shippingFee)    || 0
  const discountAmount = parseFloat(invoice.discountAmount) || 0
  const discountType   = invoice.discountType   || null 
  const discountValue  = parseFloat(invoice.discountValue)  || 0
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
      
      <div className={styles.bar}/>

        <div className={styles.body}>

          <div className={styles.headerSplit}>
              
            <div className={styles.title}>INVOICE</div>

            <div style={{ textAlign : 'right', fontSize : 9 }}>

              <div className={styles.invoiceInfos}>

                <span>ISSUE DATE </span>
                <span><strong>{invoice.date}</strong></span> 
                
              </div>

              <div className={styles.invoiceInfos}>

                <span>DUE DATE </span>
                <span><strong>{dueDate}</strong></span>
                
              </div>

              <div className={styles.invoiceInfos}>

                <span>INVOICE # </span>
                <span><strong>{invoice.number}</strong></span>
                
              </div>
            </div>

          </div>
          <div className={styles.metaRow}>

            <div  className={styles.metaItem} >

              <div className={styles.metaLabel}>BILL FROM</div>
              <div className={styles.metaVal}>{invoiceBrandSettings.name}</div>
              {invoiceBrandSettings.phone   && <div className={styles.metaSub}>{invoiceBrandSettings.phone}</div>}
              {invoiceBrandSettings.address && <div className={styles.metaSub}>{invoiceBrandSettings.address}</div>}
             

            </div>

            <div className={styles.metaItem}  style={{ textAlign : 'right' }}>

              <div className={styles.metaLabel}>BILL TO</div>
              <div className={styles.metaVal}>{customer.name}</div>
              {customer.phone   && <div className={styles.metaSub}>{customer.phone}</div>}
              {customer.address && <div className={styles.metaSub}>{customer.address}</div>}

            </div>

          </div>



        <div>


          <div className={styles.table}>

            <div className={styles.orderDescriptionRow}>
              <div className={styles.orderText}>ORDER:</div>
              <div className={styles.orderDescLabel}>{invoice.orderDesc || 'Garment Order'}</div>
      
            </div>
            
            <table
              className={styles.tableEl}
              style={{ borderColor : barColor }}
            >
              <thead>
                <tr className={styles.tableHeader} style={{ borderColor : barColor }}>
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

          </div>

         
        </div>

        {invoiceBrandSettings.accountBank && (
          
          <div className={styles.footer}>
            <div className={styles.footerSection}>
              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Information :</strong><br />

              <div>

                {invoiceBrandSettings.accountBank && (
                  <div>Bank Name: {invoiceBrandSettings.accountBank}</div>
                )}

                {invoiceBrandSettings.accountNumber && (
                  <div>Account Number: {invoiceBrandSettings.accountNumber}</div>
                )}

                {invoiceBrandSettings.accountName && (
                  <div>Account Name: {invoiceBrandSettings.accountName}</div>
                )}
                
              </div>
              
            </div>
            {invoiceBrandSettings.footer && (
              <div className={styles.footerSection}>
                <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Notes :</strong><br />{invoiceBrandSettings.footer}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  )
}
