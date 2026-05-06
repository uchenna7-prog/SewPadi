import { calcTax } from '../../utils/invoiceUtils'
import { resolveCumulativePaid, buildPaymentRows } from '../../../ReceiptViewer/utils'
import { formatCurrency } from '../../../../utils/formatCurrency'
import styles from './ReceiptPaymentSummary.module.css'


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


export function ReceiptPaymentSummary({ receipt, brand, isTemplate5 = false }) {

  const { currency, showTax, taxRate: brandTaxRate } = brand

  // ── Order totals — prefer frozen values saved on the receipt ─────────────
  const subtotal = receipt.items?.length > 0
    ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
    : 0

  const shippingFee    = parseFloat(receipt.shippingFee)    || 0
  const discountAmount = parseFloat(receipt.discountAmount) || 0
  const discountType   = receipt.discountType  || null
  const discountValue  = parseFloat(receipt.discountValue)  || 0
  const useTax         = receipt.taxRate != null ? receipt.taxRate > 0 : (showTax && brandTaxRate > 0)
  const taxRate        = receipt.taxRate != null ? receipt.taxRate : brandTaxRate
  const taxAmount      = parseFloat(receipt.taxAmount) || calcTax(subtotal, taxRate, useTax)

  // grandTotal is the true order total including shipping, discount, and tax
  const grandTotal = receipt.totalAmount != null
    ? parseFloat(receipt.totalAmount)
    : subtotal + shippingFee - discountAmount + taxAmount

  // ── Build payment rows ────────────────────────────────────────────────────
  const paymentRows = buildPaymentRows(receipt)

  const previouslyPaid = paymentRows
    .filter(p => !p._isCurrent)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const thisPaymentTotal = paymentRows
    .filter(p => p._isCurrent)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const totalPaid = thisPaymentTotal + previouslyPaid

  // Balance is always grandTotal minus everything paid, never against subtotal
  const balanceRemaining = parseFloat(receipt.balance) >= 0
    ? parseFloat(receipt.balance)
    : Math.max(0, grandTotal - resolveCumulativePaid(receipt))

  const isFullyPaid = receipt.isFullPayment ?? (balanceRemaining <= 0)

  // ── "This Receipt" label ─────────────────────────────────────────────────
  const currentRows    = paymentRows.filter(p => p._isCurrent)
  const currentMethods = [...new Set(currentRows.map(p => capitalize(p.method || '')))]
  const methodString   = currentMethods.length <= 1
    ? (currentMethods[0] || 'This')
    : currentMethods.slice(0, -1).join(', ') + ' & ' + currentMethods.at(-1)


  return (
    <div className={styles.container}>

      {/* ── Payment History ──────────────────────────────────────────── */}
      {paymentRows.length > 0 && (
        <div className={styles.historySection}>

          <div className={styles.sectionLabel}
            style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
            Payment History
          </div>

          {paymentRows.map((payment, index) => {
            const isCurrent = payment._isCurrent
            const method    = payment.method || ''

            return (
              <div key={payment.id ?? index} className={styles.paymentRow}
                style={{ borderBottom: isTemplate5 ? '1px solid rgba(255,255,255,0.35)' : '1px dashed #ebebeb' }}>

                <span className={styles.emoji}>{methodEmoji(method)}</span>

                <div className={styles.paymentMeta}>
                  <div className={styles.paymentMethod}
                    style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
                    {capitalize(method)}
                    {isCurrent && <span className={styles.latestBadge}>Latest</span>}
                  </div>
                  <div className={styles.paymentDate}>{payment.date}</div>
                </div>

                <span className={`${styles.paymentAmount} ${isCurrent ? styles.amountCurrent : ''}`}
                  style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
                  {formatCurrency(currency, payment.amount)}
                </span>

              </div>
            )
          })}

        </div>
      )}

      {/* ── Totals Summary ───────────────────────────────────────────── */}
      <div className={styles.totalsSection}>

        {useTax && taxAmount > 0 && (
          <div className={styles.totalsRow}>
            <span className={styles.totalsKey}>Tax ({taxRate}%)</span>
            <span className={styles.totalsVal}>{formatCurrency(currency, taxAmount)}</span>
          </div>
        )}

        {paymentRows.length > 0 && previouslyPaid > 0 && (
          <div className={styles.totalsRow}>
            <span className={styles.totalsKey}
              style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
              Previously Paid
            </span>
            <span className={styles.totalsVal}
              style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
              {formatCurrency(currency, previouslyPaid)}
            </span>
          </div>
        )}

        {paymentRows.length > 0 && thisPaymentTotal > 0 && (
          <div className={styles.totalsRow}>
            <span className={styles.totalsKey}
              style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
              This Payment
            </span>
            <span className={`${styles.totalsVal} ${styles.amountPaid}`}>
              + {formatCurrency(currency, thisPaymentTotal)}
            </span>
          </div>
        )}

        <div className={styles.totalsDivider}
          style={{ borderBottom: isTemplate5 ? '1.5px solid var(--brand-on-primary)' : '1.5px solid var(--brand-primary-dark)' }} />

        <div className={styles.totalPaidRow}>
          <span className={styles.totalPaidKey}
            style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : 'var(--brand-primary)' }}>
            Total Paid
          </span>
          <span className={styles.totalPaidVal}
            style={{ color: isTemplate5 ? 'var(--brand-on-primary)' : '' }}>
            {formatCurrency(currency, totalPaid)}
          </span>
        </div>

        {!isFullyPaid ? (
          <div className={styles.balanceCallout}>
            <div>
              <div className={styles.balanceLabel}>Balance</div>
            </div>
            <span className={styles.balanceAmount}>{formatCurrency(currency, balanceRemaining)}</span>
          </div>
        ) : (
          <div className={styles.paidCallout}>
            <div>
              <div className={styles.paidLabel}>✓ PAID IN FULL</div>
            </div>
            <span className={styles.paidAmount}>{formatCurrency(currency, grandTotal)}</span>
          </div>
        )}

      </div>

    </div>
  )
}