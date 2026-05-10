import styles from "../styles/Template10.module.css"
import { calcTax } from "../utils/receiptUtils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { formatCurrency } from "../../../utils/formatCurrency"


export function ReceiptTemplate10({ receipt, customer, brand }) {
  const accentColor = brand.colour || '#1C1814'
  const { currency, showTax, receiptTaxRate: brandTaxRate } = brand

  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  // Prefer frozen values from the receipt object; fall back to brand/calc
  const shippingFee    = parseFloat(receipt.shippingFee)    || 0
  const discountAmount = parseFloat(receipt.discountAmount) || 0
  const discountType   = receipt.discountType   || null   // 'percent' | 'flat' | null
  const discountValue  = parseFloat(receipt.discountValue)  || 0
  const useTax         = receipt.taxRate != null ? receipt.taxRate > 0 : (showTax && brandTaxRate > 0)
  const taxRate        = receipt.taxRate != null ? receipt.taxRate : brandTaxRate
  const taxAmount      = parseFloat(receipt.taxAmount) || calcTax(subtotal, taxRate, useTax)
  const grandTotal     = receipt.totalAmount != null
    ? parseFloat(receipt.totalAmount)
    : subtotal + shippingFee - discountAmount + taxAmount

  const discountLabel = discountType === 'percent'
    ? `Discount (${discountValue}%)`
    : 'Discount'

  const hasExtras = shippingFee > 0 || discountAmount > 0 || (useTax && taxAmount > 0)

 


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
            <span className={styles.companyName}>{(brand.name || brand.ownerName || '').toUpperCase()}</span>
          </div>
          {brand.tagline  && <div className={styles.companySub}>{brand.tagline}</div>}
          {brand.address  && <div className={styles.companyAddress}>{brand.address}</div>}
        </div>
        <div className={styles.receiptTitle} style={{ color : accentColor }}>RECEIPT</div>
      </div>

      <div className={styles.numberBar}>
        <span>RECEIPT # {receipt.number}</span><span>|</span>
        <span>DATE : {receipt.date}</span>
      </div>

      <div className={styles.billShip}>
        <div>
          <span className={styles.billLabel}>Received From :</span>
          <div><strong>{customer.name}</strong></div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.email   && <div>{customer.email}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        <div>
          <span className={styles.billLabel}>Received By :</span>
          <div><strong>{brand.name || brand.ownerName}</strong></div>
          {brand.phone   && <div>{brand.phone}</div>}
          {brand.email   && <div>{brand.email}</div>}
          {brand.address && <div>{brand.address}</div>}
        </div>
      </div>
      
       <div className={styles.tableWrapper}>

        <div className={styles.orderDescriptionRow}>
          <div className={styles.orderText}>ORDER:</div>
          <div className={styles.orderDescLabel}>{receipt.orderDesc || 'Garment Order'}</div>
  
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
            {receipt.items?.map((item, i) => {
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

        <div >

          {/* Breakdown rows — only shown when there are extras beyond subtotal */}
          {hasExtras && (
            <div className={styles.breakdownBlock}>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownKey}>Subtotal</span>
                <span className={styles.breakdownVal}>{ formatCurrency(currency, subtotal)}</span>
              </div>
  
              {shippingFee > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownKey}>Shipping &amp; Delivery</span>
                  <span className={styles.breakdownVal}>{ formatCurrency(currency, shippingFee)}</span>
                </div>
              )}
  
              {discountAmount > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={`${styles.breakdownKey} ${styles.breakdownKeyDiscount}`}>{discountLabel}</span>
                  <span className={`${styles.breakdownVal} ${styles.breakdownValDiscount}`}>−{ formatCurrency(currency, discountAmount)}</span>
                </div>
              )}
  
              {useTax && taxAmount > 0 && (
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownKey}>VAT ({taxRate}%)</span>
                  <span className={styles.breakdownVal}>{ formatCurrency(currency, taxAmount)}</span>
                </div>
              )}
            </div>
          )}
  
          {/* Grand total bar — always shown, full width */}
          <div className={styles.orderTotalWrap}>
            <div className={styles.orderTotalLabel}>Order Total</div>
            <div className={styles.orderTotalValue}>{ formatCurrency(currency, grandTotal)}</div>
          </div>

          

        </div>

        <ReceiptPaymentSummary receipt={receipt} brand={brand} />

      </div>
      

      {/* Footer + corner pushed to bottom together */}
      <div style={{ marginTop : 'auto' }}>
        <div className={styles.footer}>
          <div>
            {brand.accountBank && (
              <>
                <div className={styles.thankYou}>Payment Details</div>
                {brand.name && <div>Received By  : {brand.name}</div>}
              </>
            )}
            <div
              className={styles.paymentNote}
              style={{ fontWeight : 900, color : "var(--brand-primary-dark)" }}
            >
              {brand.receiptFooter}
            </div>
          </div>
          <div className={styles.signArea}>
            <div className={styles.signLine} />
            <div className={styles.signLabel}>Signature</div>
          </div>
        </div>

        {/* SVG corner — replaces clip-path div which html2canvas can't render */}
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