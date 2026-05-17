import { formatMoney,getCurrency } from "../../../../../../utils/moneyUtils"
import { capitalise,getTotalPaid } from "../../utils"
import styles from "./InlineInstallmentList.module.css"


export function InlineInstallmentList({ order, payment, receipts, generating, onSelectPayment }) {
  const currency     = getCurrency()
  const installments = payment?.installments || []
  const fullPrice    = parseFloat(payment?.orderPrice) || 0
  const totalPaid    = getTotalPaid(installments)
  const isFullyPaid  = fullPrice > 0 && totalPaid >= fullPrice
  const balance      = fullPrice > 0 ? Math.max(0, fullPrice - totalPaid) : 0

  const receiptedInstallmentIds = new Set(
    receipts
      .filter(r => String(r.paymentId) === String(payment?.id))
      .flatMap(r => r.installmentIds || [])
  )

  if (!payment) {
    return (
      <div className={styles.inlineEmptyNotice}>
        <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>error_outline</span>
        <span>No payment record found for this order.</span>
      </div>
    )
  }

  return (
    <div className={styles.inlineFormCard}>

      <div className={styles.inlineOrderStats}>
        <div className={styles.inlineOrderStat}>
          <span className={styles.inlineOrderStatLabel}>Total</span>
          <span className={styles.inlineOrderStatValue}>{formatMoney(currency, fullPrice)}</span>
        </div>
        <div className={styles.inlineOrderStatDivider} />
        <div className={styles.inlineOrderStat}>
          <span className={styles.inlineOrderStatLabel}>Paid</span>
          <span className={styles.inlineOrderStatValue} style={{ color: '#15803d' }}>
            {formatMoney(currency, totalPaid)}
          </span>
        </div>
        <div className={styles.inlineOrderStatDivider} />
        <div className={styles.inlineOrderStat}>
          <span className={styles.inlineOrderStatLabel}>{isFullyPaid ? 'Status' : 'Balance'}</span>
          <span className={styles.inlineOrderStatValue} style={{ color: isFullyPaid ? '#15803d' : '#ef4444' }}>
            {isFullyPaid ? 'Paid in Full' : formatMoney(currency, balance)}
          </span>
        </div>
      </div>

      <div className={styles.inlineFormDivider} />

      <p className={styles.stepHeading} style={{ marginTop: 0, marginBottom: 12 }}>
        2. Select Payment
      </p>

      <div className={styles.installmentPickerList}>
        {installments.map((inst, index) => {
          const isReceipted  = receiptedInstallmentIds.has(String(inst.id))
          const isGenerating = generating === inst.id

          const paidBefore = getTotalPaid(installments.slice(0, index))
          const paidAfter  = paidBefore + (parseFloat(inst.amount) || 0)
          const balAfter   = fullPrice > 0 ? Math.max(0, fullPrice - paidAfter) : null

          return (
            <div
              key={inst.id ?? index}
              className={`
                ${styles.installmentPickerCard}
                ${isReceipted  ? styles.installmentPickerCard_receipted  : ''}
                ${isGenerating ? styles.installmentPickerCard_generating : ''}
              `}
              onClick={() => !isGenerating && !isReceipted && onSelectPayment(payment, inst)}
            >
       
              <div className={styles.installmentTopRow}>
                <div className={styles.installmentNumber}>
                  <span>{index + 1}</span>
                </div>

                <span className={styles.installmentAmount}>
                  {formatMoney(currency, inst.amount)}
                </span>

                <div className={styles.installmentAction}>
                  {isGenerating ? (
                    <div className={styles.actionTagGenerating}>
                      <div className={styles.actionSpinner} />
                      <span>Generating</span>
                    </div>
                  ) : isReceipted ? (
                    <div className={styles.actionTagReceipited}>
                      <span className="mi" style={{ fontSize: '0.9rem' }}>receipt_long</span>
                      <span>Receipted</span>
                    </div>
                  ) : (
                    <div className={styles.actionTagGenerate}>
                      <span className="mi" style={{ fontSize: '0.9rem' }}>add_circle</span>
                      <span>Generate</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.installmentBottomRow}>
                {balAfter !== null && (
                  <span className={styles.installmentBalance}>
                    Balance after:{' '}
                    <span style={{ color: balAfter > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                      {balAfter > 0 ? formatMoney(currency, balAfter) : 'Fully Paid'}
                    </span>
                  </span>
                )}

                <div className={styles.installmentMeta}>
                  {inst.date && (
                    <span className={styles.installmentDate}>
                      <span className="mi" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginRight: 3 }}>calendar_today</span>
                      {inst.date}
                    </span>
                  )}
                  {inst.method && (
                    <span className={styles.installmentMethodPill}>
                      <span className="mi" style={{ fontSize: '0.65rem', verticalAlign: 'middle', marginRight: 3 }}>
                        {inst.method === 'transfer' ? 'swap_horiz' : inst.method === 'card' ? 'credit_card' : 'payments'}
                      </span>
                      {capitalise(inst.method)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
