import styles from "../styles/Template9.module.css"
import { calcTax } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { formatMoney } from "../../../utils/moneyUtils"

export function ReceiptTemplate9({ receipt, customer, receiptBrandSettings }) {

  const { currency, showTax, receiptTaxRate: receiptBrandSettingsTaxRate } = receiptBrandSettings

  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee = parseFloat(receipt.shippingFee) || 0
  const discountAmount = parseFloat(receipt.discountAmount) || 0
  const discountType = receipt.discountType || null 
  const discountValue  = parseFloat(receipt.discountValue)  || 0
  const useTax  = receipt.taxRate != null ? receipt.taxRate > 0 : (showTax && receiptBrandSettingsTaxRate > 0)
  const taxRate  = receipt.taxRate != null ? receipt.taxRate : receiptBrandSettingsTaxRate
  const taxAmount  = parseFloat(receipt.taxAmount) || calcTax(subtotal, taxRate, useTax)
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

        <div className={styles.logoArea}>

          <div className={styles.logoCircle}>
            {receiptBrandSettings.logo
              ? <img src={receiptBrandSettings.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
               : <span className="mi" style={{ fontSize : 13, color : 'var(--brand-on-primary)' }}>checkroom</span>
            }
          </div>

          <div>
            
            <div className={styles.companyName}>{(receiptBrandSettings.name || receiptBrandSettings.ownerName || 'YOUR receiptBrandSettings').toUpperCase()}</div>
            {receiptBrandSettings.tagline && <div className={styles.tagline}>{receiptBrandSettings.tagline}</div>}

          </div>

        </div>
        
        <div className={styles.headerRight}>
          {receiptBrandSettings.address && <div>{receiptBrandSettings.address}</div>}
        </div>

        <div className={styles.headerRight}>
          {receiptBrandSettings.phone && <div>{receiptBrandSettings.phone}</div>}
          {receiptBrandSettings.email && <div>{receiptBrandSettings.email}</div>}
          {receiptBrandSettings.website && <div>{receiptBrandSettings.website}</div>}
        </div>

      </div>

      <div className={styles.receiptRow}>
        <div className={styles.receiptLeft}>
          <span className={styles.receiptWord}>receipt </span>
          <span className={styles.receiptNum}>#{receipt.number}</span>
        </div>
        <div className={styles.receiptRight}>
          <div><span className={styles.label}>ISSUE DATE </span> {receipt.date}</div>

        </div>
      </div>
      <div className={styles.infoRow}>
        {receiptBrandSettings.accountBank && (
          <div>
            <div className={styles.infoLabel}>PAYMENT</div>
            <strong>{receiptBrandSettings.accountBank}</strong><br />
            {receiptBrandSettings.accountName && <span>{receiptBrandSettings.accountName}<br /></span>}
            {receiptBrandSettings.accountNumber && <span>Acct : {receiptBrandSettings.accountNumber}</span>}
          </div>
        )}
        <div>
          <div className={styles.infoLabel}>RECEIVED BY</div>
          {receiptBrandSettings.name || receiptBrandSettings.ownerName}<br />
          {receiptBrandSettings.phone   && <div>{receiptBrandSettings.phone}</div>}
          {receiptBrandSettings.address}
        </div>
        <div>
          <div className={`${styles.infoLabel} ${styles.infoLabelRight}`}>RECEIVED FROM</div>
          {customer.name}<br />
          {customer.phone}<br />
          {customer.address}
        </div>
      </div>
         <div className={styles.tableWrapper}>

          <div className={styles.orderDescriptionRow}>
            <div className={styles.orderText}>ORDER:</div>
            <div className={styles.orderDescLabel}>{receipt.orderDesc || 'Garment Order'}</div>
    
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
              {receipt.items?.map((item, i) => {
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

            <div className={styles.orderTotalWrap}>
              <div className={styles.orderTotalLabel}>Order Total</div>
              <div className={styles.orderTotalValue}>{ formatMoney(currency, grandTotal)}</div>
            </div>

            

          </div>

          <ReceiptPaymentSummary receipt={receipt} receiptBrandSettings={receiptBrandSettings} />
          
        </div>
      
       
      
      <div className={styles.thankYou}>{receiptBrandSettings.footer || 'THANK YOU FOR YOUR BUSINESS'}</div>
    </div>
  )
}
