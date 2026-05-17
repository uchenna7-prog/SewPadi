import { useState } from "react"
import { AddInstallmentModal } from "../AddInstallmentModal/AddInstallmentModal"
import { getTotalPaid,getProgressPercent,capitalise } from "../../utils"
import { formatMoney } from "../../../../../../utils/moneyUtils"
import { PAYMENT_STATUSES } from "../../../../../../datas/paymentDatas"
import Header from "../../../../../../components/Header/Header"
import styles from "./PaymentDetailsModal.module.css"


export function PaymentDetailsModal({ payment, onClose, onDelete, onStatusChange, onAddInstallment }) {
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)

  const installments    = payment.installments || []
  const fullPrice       = parseFloat(payment.orderPrice) || 0
  const totalPaid       = getTotalPaid(installments)
  const isPaid          = payment.status === 'paid'
  const isNowFullyPaid  = fullPrice > 0 && totalPaid >= fullPrice
  const hasInstallments = installments.length > 0
  const progressPercent = getProgressPercent(totalPaid, fullPrice, payment.status)

  return (
    <div className={styles.fullScreenModal}>
      <Header
        type="back"
        title="Payment Details"
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.modalBody}>

        <div className={styles.detailInfoCard}>
          <div className={styles.detailInfoRow}>
            <span className={styles.detailInfoLabel}>Order</span>
            <span className={styles.detailInfoValue}>{payment.orderDesc || '—'}</span>
          </div>
          {fullPrice > 0 && (
            <div className={styles.detailInfoRow}>
              <span className={styles.detailInfoLabel}>Order Value</span>
              <span className={styles.detailInfoValue}>{formatMoney(fullPrice)}</span>
            </div>
          )}
          <div className={styles.detailInfoRow}>
            <span className={styles.detailInfoLabel}>Date Created</span>
            <span className={styles.detailInfoValue}>{payment.date}</span>
          </div>
          {payment.notes && (
            <div className={styles.detailInfoRow}>
              <span className={styles.detailInfoLabel}>Notes</span>
              <span className={styles.detailInfoValue}>{payment.notes}</span>
            </div>
          )}
        </div>

        {fullPrice > 0 && hasInstallments && (
          <div className={styles.breakdownCard}>
            <label className={styles.fieldLabel} style={{ marginBottom: 12, display: 'block' }}>Payment Breakdown</label>
            <div className={styles.breakdownRow}>
              <span>Order Value</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatMoney(fullPrice)}</span>
            </div>

            {installments.map((inst, idx) => {
              const paidBefore   = getTotalPaid(installments.slice(0, idx))
              const paidAfter    = paidBefore + (parseFloat(inst.amount) || 0)
              const balanceAfter = Math.max(0, fullPrice - paidAfter)
              const methodLabel  = inst.method ? capitalise(inst.method) : ''

              return (
                <div key={inst.id ?? idx} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Payment {idx + 1}{installments.length > 1 ? ` of ${installments.length}` : ''}{methodLabel ? ` · ${methodLabel}` : ''}{inst.date ? ` · ${inst.date}` : ''}{inst.time ? ` · ${inst.time}` : ''}
                    </span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(251,146,60,0.14)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 20, padding: '1px 7px' }}>
                      {idx + 1}/{installments.length}
                    </span>
                  </div>

                  {idx > 0 && (
                    <div className={styles.breakdownRow} style={{ marginBottom: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>Balance Before</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                        {formatMoney(paidBefore > 0 ? fullPrice - paidBefore : fullPrice)}
                      </span>
                    </div>
                  )}
                  <div className={styles.breakdownRow} style={{ marginBottom: 4 }}>
                    <span>Amount Paid</span>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>{formatMoney(inst.amount)}</span>
                  </div>
                  <div className={styles.breakdownRow} style={{ marginBottom: 0 }}>
                    <span>Balance After</span>
                    <span style={{ color: balanceAfter > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                      {balanceAfter > 0 ? formatMoney(balanceAfter) : 'Fully Paid ✓'}
                    </span>
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: 16 }}>
              <div className={styles.paymentProgressTrack}>
                <div className={styles.paymentProgressFill} style={{ width: `${progressPercent}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>{formatMoney(totalPaid)} paid</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 600 }}>{formatMoney(fullPrice)} total</span>
              </div>
            </div>
          </div>
        )}

        {(!fullPrice || !hasInstallments) && hasInstallments && (
          <div className={styles.breakdownCard}>
            <div className={styles.installmentList}>
              {installments.map((inst, idx) => (
                <div key={inst.id ?? idx} className={styles.installmentRow}>
                  <div className={styles.installmentIconOuter}>
                    <div className={styles.installmentIconInner}>
                      <span className="mi" style={{ fontSize: '1rem', color: '#22c55e' }}>payments</span>
                    </div>
                  </div>
                  <div className={styles.installmentRowInfo}>
                    <div className={styles.installmentAmount}>{formatMoney(inst.amount)}</div>
                    <div className={styles.installmentDate}>
                      {inst.date}{inst.time ? ` · ${inst.time}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={styles.installmentReceivedBadge}>Received</span>
                    {inst.method && (
                      <span className={styles.installmentMethodBadge} style={{ textTransform: 'capitalize' }}>
                        {inst.method}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.fieldGroup} style={{ marginTop: 18 }}>
          <label className={styles.fieldLabel}>Payment Status</label>
          {hasInstallments && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>
              {isNowFullyPaid
                ? '✓ All payments received — status upgraded to Paid.'
                : 'Part payments recorded. Only Part Payment is available.'}
            </div>
          )}
          <div className={styles.chipRow}>
            {PAYMENT_STATUSES.map(s => {
              const isLocked = hasInstallments && (isNowFullyPaid ? s.value !== 'paid' : s.value !== 'part')
              const isActive = isNowFullyPaid ? s.value === 'paid' : payment.status === s.value
              return (
                <button
                  key={s.value}
                  className={`${styles.typeChip} ${isActive ? styles.typeChipActive : ''}`}
                  style={{
                    ...(isActive ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}),
                    ...(isLocked ? { opacity: 0.3, cursor: 'not-allowed' } : {}),
                  }}
                  disabled={isLocked}
                  onClick={() => !isLocked && onStatusChange(payment.id, s.value)}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {!isPaid && (
          <button className={styles.addInstallmentBtn} onClick={() => setShowInstallmentModal(true)}>
            <span className="mi" style={{ fontSize: '1.1rem' }}>add_circle_outline</span>
            Record Another Payment
          </button>
        )}

      </div>

      {showInstallmentModal && (
        <AddInstallmentModal
          payment={payment}
          onClose={() => setShowInstallmentModal(false)}
          onSave={(amt, meth) => onAddInstallment(payment.id, amt, meth)}
        />
      )}
    </div>
  )
}
