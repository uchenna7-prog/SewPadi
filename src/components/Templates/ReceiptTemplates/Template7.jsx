import styles from "../styles/Template7.module.css"
import { calcTax } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { formatMoney } from "../../../utils/moneyUtils"

export function ReceiptTemplate7({ receipt, customer, receiptBrandSettings }) {
  const accentColor = receiptBrandSettings.colour || '#1C1814'
  const { currency, showTax, receiptTaxRate: receiptBrandSettingsTaxRate } = receiptBrandSettings

  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee = parseFloat(receipt.shippingFee)    || 0
  const discountAmount = parseFloat(receipt.discountAmount) || 0
  const discountType = receipt.discountType   || null 
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

        <div className={styles.logoCircle} style={{ borderColor : accentColor }}>
          {receiptBrandSettings.logo
            ? <img src={receiptBrandSettings.logo} alt="" style={{ width: "100%", height: "100%", objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
             : <span className="mi" style={{ fontSize : 13, color : accentColor }}>checkroom</span>
          }
        </div>

        <div className={styles.titleGroup}>
          <span className={styles.receiptWord}>RECEIPT</span>
          <span className={styles.receiptNumber}>#{receipt.number}</span>
        </div>

        <div className={styles.dateBlock}>

          <div className={styles.dateLabel}>ISSUE DATE</div>
          <div className={styles.dateValue} style={{ color : accentColor }}>{receipt.date}</div>

        </div>

      </div>

      <div className={styles.divider} />

      <div className={styles.fromTo}>

        <div className={styles.fromToBlock}>

          <div className={styles.fromLabel}>FROM</div>
          <div className={styles.fromDivider} />
          {[
            ['NAME :', receiptBrandSettings.ownerName || receiptBrandSettings.name],
            ['COMPANY :', (receiptBrandSettings.name || '')],
            ['PHONE :', (receiptBrandSettings.phone || '')],
            ['EMAIL :', (receiptBrandSettings.email || '')],
            ['ADDRESS :', (receiptBrandSettings.address || '')]
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l} className={styles.infoRow}>
              <span className={styles.infoKey}>{l}</span>
              <span className={styles.infoValue}>{v}</span>
            </div>
          ))}
        </div>

        <div className={styles.fromToBlock}>
          <div className={styles.toLabel}>TO</div>

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


      <div className={styles.forLabel}>FOR</div>


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
              <th className={styles.colQty}>Qty</th>
              <th className={styles.colPrice}>Unit Price</th>
              <th className={styles.colTotal}>Total</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {receipt.items?.map((item, i) => {
              const qty = item.qty ?? 1;
              const unitPrice = parseFloat(item.price) || 0;
              const lineAmount = qty * unitPrice;

              return (
                <tr key={i} className={styles.tableRow}>
                  <td className={styles.colSn}>{i + 1}</td>
                  <td className={styles.colDesc}>{item.name}</td>
                  <td className={styles.colQty}>{qty}</td>
                  <td className={styles.colPrice}>{ formatMoney(currency, unitPrice)}</td>
                  <td className={styles.colTotal} style={{ color : accentColor }}>
                    { formatMoney(currency, lineAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div>
        
          
          {hasExtras && (
            <div className={styles.breakdownBlock}>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownKey}>Subtotal</span>
                <span className={styles.breakdownVal}>{ formatMoney(currency, subtotal)}</span>
              </div>
  
              {shippingFee > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownKey}>Shipping &amp; Delivery</span>
                  <span className={styles.breakdownVal}>{ formatMoney(currency, shippingFee)}</span>
                </div>
              )}
  
              {discountAmount > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={`${styles.breakdownKey} ${styles.breakdownKeyDiscount}`}>{discountLabel}</span>
                  <span className={`${styles.breakdownVal} ${styles.breakdownValDiscount}`}>−{ formatMoney(currency, discountAmount)}</span>
                </div>
              )}
  
              {useTax && taxAmount > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownKey}>VAT ({taxRate}%)</span>
                  <span className={styles.breakdownVal}>{ formatMoney(currency, taxAmount)}</span>
                </div>
              )}
            </div>
          )}
  
          {/* Grand total bar — always shown, full width */}
          <div className={styles.orderTotalWrap}>
            <div className={styles.orderTotalLabel}>Order Total</div>
            <div className={styles.orderTotalValue}>{ formatMoney(currency, grandTotal)}</div>
          </div>

        </div>

         <ReceiptPaymentSummary receipt={receipt} receiptBrandSettings={receiptBrandSettings} />
         
      </div>
    
      
      <div className={styles.footer}>
        {receiptBrandSettings.accountBank && (
        
        <div className={styles.footerLeft}>
          
           <div>
            <h3 className={styles.footerLabel}>Payment Details:</h3>

            {receiptBrandSettings.name && (
              <div>Received By: {receiptBrandSettings.name}</div>
            )}
            
          </div>

        </div>
      )}

      {receiptBrandSettings.footer && (
        <div className={styles.footerRight}>
          <h3 className={styles.footerLabel} style={{color :"var(--brand-primary-dark)"}}>Notes:</h3>{receiptBrandSettings.footer}
        </div>
      )}

      </div>
     
    </div>
  )
}
