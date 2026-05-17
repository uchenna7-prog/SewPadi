import styles from "../styles/Template6.module.css"
import { calcTax } from "../utils/receiptUtils"
import { resolveCumulativePaid,buildPaymentRows } from "../../ReceiptViewer/utils"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { formatMoney } from "../../../utils/moneyUtils"


const METHOD_EMOJI = {
  cash:     '💵',
  transfer: '🏦',
  card:     '💳',
}

function methodEmoji(method) {
  return METHOD_EMOJI[(method || '').toLowerCase()] ?? '🧾'
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '—'
}


export function ReceiptTemplate6({ receipt, customer, receiptBrandSettings }) {

  const accentColor = receiptBrandSettings.colour || '#1C1814'
  const { currency, showTax, receiptTaxRate: receiptBrandSettingsTaxRate } = receiptBrandSettings
  
    const subtotal = receipt.items?.length > 0
      ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
      : 0
  
    const shippingFee = parseFloat(receipt.shippingFee) || 0
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
  

  const tax   = calcTax(grandTotal, taxRate, showTax)

  const paymentRows = buildPaymentRows(receipt)

  const previouslyPaid = paymentRows
    .filter(p => !p._isCurrent)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const thisPaymentTotal = paymentRows
    .filter(p => p._isCurrent)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const balanceRemaining = parseFloat(receipt.balance) >= 0
    ? parseFloat(receipt.balance)
    : Math.max(0, grandTotal - resolveCumulativePaid(receipt))
  const isFullyPaid      = receipt.isFullPayment ?? (balanceRemaining <= 0)

  const currentRows = paymentRows.filter(p => p._isCurrent)
  const currentMethods = [...new Set(currentRows.map(p => capitalize(p.method || '')))]
  const methodString = currentMethods.length <= 1
    ? (currentMethods[0] || 'This')
    : currentMethods.slice(0, -1).join(', ') + ' & ' + currentMethods.at(-1)


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
          <span className={styles.bannerTitle}>RECEIPT</span>
        </div>
        <div className={styles.receiptBrandSettingsInBanner}>

          <div>
            <div className={styles.receiptBrandSettingsName} style={{ color : "var(--brand-on-primary)" }} >{receiptBrandSettings.name || receiptBrandSettings.ownerName}</div>
            <div className={styles.receiptBrandSettingsSub}>TAILOR SHOP</div>
          </div>
        </div>
      </div>
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>Receipt To</div>
          <div className={styles.metaName}>{customer.name}</div>
          {customer.phone   && <div className={styles.metaAddress}>{customer.phone}</div>}
          {customer.address && <div className={styles.metaAddress}>{customer.address}</div>}
        </div>
        <div style={{ textAlign : 'right' }}>
          <div><span className={styles.metaKey}>Receipt#</span> <strong>{receipt.number}</strong></div>
          <div><span className={styles.metaKey}>Date </span> <strong>{receipt.date}</strong></div>
        
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
              <th className={styles.colSn}>SN</th>
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

        <div>

          {/* Breakdown rows — only shown when there are extras beyond subtotal */}
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

        {paymentRows.length > 0 && (
        <div className={styles.historySection}>

          <div className={styles.sectionLabel} 
          style={{ color :  'var(--brand-primary)' }}>
            Payment History
          </div>

          {paymentRows.map((payment, index) => {
            const isCurrent = payment._isCurrent
            const method    = payment.method || ''

            return (
              <div key={payment.id ?? index} className={styles.paymentRow}
              style={{ borderBottom :  '1px dashed #ebebeb' }}>

                <span className={styles.emoji}>{methodEmoji(method)}</span>

                <div className={styles.paymentMeta}>
                  <div className={styles.paymentMethod} 
                  style={{ color  : 'var(--brand-primary)' }}>
                    {capitalize(method)}
                    {isCurrent && <span className={styles.latestBadge}>Latest</span>}
                  </div>
                  <div className={styles.paymentDate}>{payment.date}</div>
                </div>

                <span className={`${styles.paymentAmount} ${isCurrent ? styles.amountCurrent : ''}`}
                style={{ color  : 'var(--brand-primary)' }}>
                  { formatMoney(currency, payment.amount)}
                </span>

              </div>
            )
          })}

        </div>
      )}
        
      </div>
      
      <div className={styles.divider} />
      <div className={styles.bottom}>
        <div style={{ flex : 1 }}>
          <div className={styles.thankYou}>{receiptBrandSettings.footer || 'Thank you for your business'}</div>
          {receiptBrandSettings.accountBank && (
            <>
              <div className={styles.paymentLabel}>Payment Details:</div>
              <div className={styles.paymentInfo}>

                {receiptBrandSettings.name && (
                  <div>Received By: {receiptBrandSettings.name}</div>
                )}

              </div>
            </>
          )}
          {(receiptBrandSettings.phone || receiptBrandSettings.email) && (
            <>
              <div className={styles.label}>Contact</div>
              <div className={styles.text}>
                {receiptBrandSettings.phone && <span>{receiptBrandSettings.phone}<br /></span>}
                {receiptBrandSettings.email && <span>{receiptBrandSettings.email}</span>}
              </div>
            </>
          )}
        </div>
        <div className={styles.rightColumn}>

          <div className={styles.totalsSection}>
          
            {showTax && taxRate > 0 && (
              <div className={styles.totalsRow}>
                <span className={styles.totalsKey}>Tax ({taxRate}%)</span>
                <span className={styles.totalsVal}>{ formatMoney(currency, tax)}</span>
              </div>
            )}
    
            {paymentRows.length > 0 && previouslyPaid > 0 && (
              <div className={styles.totalsRow}>
                <span className={styles.totalsKey}
                style={{ color :  'var(--brand-primary)' }}>
                  Previously Paid
                </span>
                <span className={styles.totalsVal}
                style={{ color :  'var(--brand-primary)' }}>
                  { formatMoney(currency, previouslyPaid)}</span>
              </div>
            )}
    
            {paymentRows.length > 0 && thisPaymentTotal > 0 && (
              <div className={styles.totalsRow}>
                <span className={styles.totalsKey}
                style={{ color :  'var(--brand-primary)' }}>
                  This Payment
                </span>
                <span className={`${styles.totalsVal} ${styles.amountPaid}`}>
                  + { formatMoney(currency, thisPaymentTotal)}
                </span>
              </div>
            )}
    
            <div className={styles.totalsDivider} 
            style={{ borderBottom :  '1.5px solid var(--brand-primary-dark)' }}/>
    
            <div className={styles.totalPaidRow}>
              <span className={styles.totalPaidKey}
              style={{ color  : 'var(--brand-primary)' }}
              >
                Total Paid</span>
              <span className={styles.totalPaidVal} >
                { formatMoney(currency, thisPaymentTotal + previouslyPaid)}
              </span>
            </div>
    
            {!isFullyPaid ? (
              <div className={styles.balanceCallout}>
                <div>
    
                  <div className={styles.balanceLabel}>Balance</div>
                  
                </div>
                <span className={styles.balanceAmount}>{ formatMoney(currency, balanceRemaining)}</span>
              </div>
            ) : (
              <div className={styles.paidCallout}>
                <div>
                  <div className={styles.paidLabel}>✓ PAID IN FULL</div>
                </div>
                <span className={styles.paidAmount}>{ formatMoney(currency, grandTotal)}</span>
              </div>
            )}
    
          </div>
         
          <div className={styles.signBlock}>
            <div className={styles.signLine} />
            <div className={styles.SignLabel}>Authorised Sign</div>
          </div>
        </div>
      </div>

     
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
