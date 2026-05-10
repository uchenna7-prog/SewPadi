// src/pages/CustomerDetail/tabs/PaymentsTab/PaymentsTab.jsx

import { useState, useEffect, useRef } from 'react'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../../components/Header/Header'
import styles from './PaymentsTab.module.css'


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const PAYMENT_STATUSES = [
  { value: 'not_paid', label: 'Not Paid',     color: '#dc2626', background: 'rgba(239,68,68,0.12)',  borderColor: 'rgba(239,68,68,0.3)'  },
  { value: 'part',     label: 'Part Payment', color: '#c2410c', background: 'rgba(251,146,60,0.12)', borderColor: 'rgba(251,146,60,0.3)' },
  { value: 'paid',     label: 'Paid',         color: '#15803d', background: 'rgba(34,197,94,0.12)',  borderColor: 'rgba(34,197,94,0.3)'  },
]


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatMoney(amount) {
  if (amount === null || amount === undefined || amount === '') return '—'
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getStatusMeta(value) {
  return PAYMENT_STATUSES.find(s => s.value === value) ?? PAYMENT_STATUSES[0]
}

function buildOrderItemsMap(orders) {
  const map = {}
  for (const order of (orders || [])) {
    if (order.id && order.items?.length > 0) map[order.id] = order.items
  }
  return map
}

function groupPaymentsByDate(payments) {
  return payments.reduce((groups, payment) => {
    const date = payment.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(payment)
    return groups
  }, {})
}

function getTotalPaid(installments) {
  return (installments || []).reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
}

function getProgressPercent(totalPaid, fullPrice, status) {
  if (fullPrice <= 0) return 0
  const raw = (totalPaid / fullPrice) * 100
  return status === 'part' ? Math.min(99, raw) : Math.min(100, raw)
}

function resolvePaymentStatus(enteredAmount, orderPrice, selectedPaymentType) {
  const entered = parseFloat(enteredAmount) || 0
  const full    = parseFloat(orderPrice)    || 0
  if (full > 0) return entered >= full ? 'paid' : 'part'
  return selectedPaymentType === 'full' ? 'paid' : 'part'
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ items = [], size = 'md', fallbackIcon = 'payments', fallbackColor }) {
  const images     = items.map(item => item.imgSrc ?? null).filter(Boolean)
  const totalItems = items.length
  const isSm       = size === 'sm'
  const outerCls   = isSm ? styles.mosaicOuter_sm : styles.mosaicOuter
  const innerCls   = isSm ? styles.mosaicInner_sm : styles.mosaicInner

  if (images.length === 0) {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <span className="mi" style={{ fontSize: isSm ? '1rem' : '1.5rem', color: fallbackColor || 'var(--text3)' }}>
            {fallbackIcon}
          </span>
        </div>
      </div>
    )
  }

  if (totalItems === 1) {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <img src={images[0]} alt="" className={styles.mosaicSingleImage} />
        </div>
      </div>
    )
  }

  if (totalItems === 2) {
    return (
      <div className={outerCls}>
        <div className={`${innerCls} ${styles.mosaicSplit}`}>
          <div className={styles.mosaicLeft}>
            <img src={images[0]} alt="" className={styles.mosaicPanelImg} />
          </div>
          <div className={styles.mosaicDividerV} />
          <div className={styles.mosaicRight}>
            <div className={styles.mosaicCell}>
              {images[1]
                ? <img src={images[1]} alt="" className={styles.mosaicPanelImg} />
                : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  const extraCount = totalItems > 3 ? totalItems - 3 : 0
  return (
    <div className={outerCls}>
      <div className={`${innerCls} ${styles.mosaicSplit}`}>
        <div className={styles.mosaicLeft}>
          {images[0]
            ? <img src={images[0]} alt="" className={styles.mosaicPanelImg} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.mosaicDividerV} />
        <div className={styles.mosaicRight}>
          <div className={styles.mosaicCell}>
            {images[1]
              ? <img src={images[1]} alt="" className={styles.mosaicPanelImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.mosaicDividerH} />
          <div className={`${styles.mosaicCell} ${extraCount > 0 ? styles.mosaicCell_overlay : ''}`}>
            {images[2]
              ? <img src={images[2]} alt="" className={styles.mosaicPanelImg} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extraCount > 0 && <div className={styles.mosaicOverlay}>+{extraCount}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// INLINE PAYMENT FORM
// ─────────────────────────────────────────────────────────────

function InlinePaymentForm({ order, onSave, saving }) {
  const [paymentType, setPaymentType] = useState('full')
  const [amount,      setAmount]      = useState('')
  const [method,      setMethod]      = useState('cash')
  const [notes,       setNotes]       = useState('')

  const fullPrice = parseFloat(order?.totalAmount ?? order?.price) || 0

  function handleAmountChange(value) {
    setAmount(value)
    if (fullPrice > 0) {
      const entered = parseFloat(value) || 0
      setPaymentType(entered > 0 && entered < fullPrice ? 'part' : 'full')
    }
  }

  function handleSave() {
    if (!amount || saving) return
    const finalStatus = resolvePaymentStatus(amount, fullPrice, paymentType)
    onSave({
      orderId:      order.id,
      orderDesc:    order.desc,
      orderPrice:   order.totalAmount ?? order.price ?? null,
      orderItems:   order.items ?? [],
      status:       finalStatus,
      notes:        notes.trim(),
      installments: [{ amount: parseFloat(amount), method, date: getTodayLabel(), time: getTimeLabel(), id: Date.now() }],
      date:         getTodayLabel(),
    })
  }

  return (
    <div className={styles.inlineFormCard}>

      {fullPrice > 0 && (
        <div className={styles.inlineOrderTotal}>
          <span className={styles.inlineOrderTotalLabel}>Order value</span>
          <span className={styles.inlineOrderTotalValue}>{formatMoney(fullPrice)}</span>
        </div>
      )}

      <label className={styles.fieldLabel}>Payment Type</label>
      <div className={styles.chipRow} style={{ marginBottom: 20 }}>
        <button
          className={`${styles.typeChip} ${paymentType === 'full' ? styles.typeChipActive : ''}`}
          style={paymentType === 'full' ? { borderColor: '#22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.12)' } : {}}
          onClick={() => setPaymentType('full')}
        >
          Full Payment
        </button>
        <button
          className={`${styles.typeChip} ${paymentType === 'part' ? styles.typeChipActive : ''}`}
          style={paymentType === 'part' ? { borderColor: '#fb923c', color: '#fb923c', background: 'rgba(251,146,60,0.12)' } : {}}
          onClick={() => setPaymentType('part')}
        >
          Part Payment
        </button>
      </div>

      <label className={styles.fieldLabel}>
        {paymentType === 'part' ? 'Amount Paid (₦)' : 'Amount (₦)'}
      </label>
      <input
        type="number"
        className={styles.textInput}
        placeholder={fullPrice > 0 ? `of ${formatMoney(fullPrice)}` : '0.00'}
        inputMode="decimal"
        value={amount}
        onChange={e => handleAmountChange(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <label className={styles.fieldLabel}>Payment Method</label>
      <div className={styles.methodChipRow} style={{ marginBottom: 20 }}>
        {['cash', 'transfer', 'card', 'other'].map(m => (
          <button
            key={m}
            className={`${styles.methodChip} ${method === m ? styles.methodChipActive : ''}`}
            onClick={() => setMethod(m)}
          >
            {capitalise(m)}
          </button>
        ))}
      </div>

      <label className={styles.fieldLabel}>
        Notes <span className={styles.fieldLabelOptional}>(optional)</span>
      </label>
      <textarea
        className={styles.textareaInput}
        placeholder="Any extra details…"
        value={notes}
        rows={2}
        onChange={e => setNotes(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <div className={styles.inlineFormDivider} />

      <button
        className={styles.inlineSaveButton}
        onClick={handleSave}
        disabled={!amount || saving}
      >
        {saving
          ? <><div className={styles.inlineSpinner} />Saving…</>
          : <><span className="material-icons" style={{ fontSize: '1.1rem' }}>payments</span>Record Payment</>
        }
      </button>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ADD PAYMENT MODAL
// ─────────────────────────────────────────────────────────────

function AddPaymentModal({ isOpen, onClose, orders, payments, onSave }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [search,          setSearch]          = useState('')
  const [saving,          setSaving]          = useState(false)
  const expandedRef                           = useRef(null)

  useEffect(() => {
    if (!isOpen) { setSelectedOrderId(null); setSearch(''); setSaving(false) }
  }, [isOpen])

  useEffect(() => {
    if (selectedOrderId && expandedRef.current) {
      setTimeout(() => expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
    }
  }, [selectedOrderId])

  const orderIdsWithPayments = new Set(payments.map(p => String(p.orderId)))
  const eligibleOrders       = orders.filter(order => !orderIdsWithPayments.has(String(order.id)))
  const showSearch           = eligibleOrders.length > 5

  const filteredOrders = eligibleOrders.filter(order => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (order.desc   || '').toLowerCase().includes(q) ||
      (order.due    || '').toLowerCase().includes(q) ||
      (order.status || '').toLowerCase().includes(q) ||
      (order.items  || []).some(i => (i.name || '').toLowerCase().includes(q))
    )
  })

  function handleToggleOrder(order) {
    setSelectedOrderId(prev => prev === order.id ? null : order.id)
  }

  async function handleSave(paymentData) {
    setSaving(true)
    try { await onSave(paymentData); onClose() }
    catch { setSaving(false) }
  }

  const showAllHavePayments = eligibleOrders.length === 0
  const showNoSearchMatch   = eligibleOrders.length > 0 && filteredOrders.length === 0

  return (
    <div className={`${styles.pickerOverlay} ${isOpen ? styles.pickerOverlay_open : ''}`}>
      <Header
        type="back"
        title="New Payment"
        onBackClick={saving ? undefined : onClose}
      />

      {showAllHavePayments && (
        <div className={styles.pickerEmpty}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>assignment</span>
          <p>All orders already have a payment recorded.</p>
          <p>Open an existing payment to add an instalment.</p>
        </div>
      )}

      {showNoSearchMatch && (
        <div className={styles.pickerEmpty}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>search_off</span>
          <p>No orders match your search</p>
        </div>
      )}

      {!showAllHavePayments && (
        <div className={styles.pickerScrollBody}>
          <div style={{ padding: '20px' }}>

            <p className={styles.stepHeading}>1. Select Order</p>

            {showSearch && (
              <div className={styles.clothSearchBar}>
                <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
                <input
                  type="text"
                  className={styles.clothSearchInput}
                  placeholder="Search orders…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search.length > 0 && (
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 0 }}
                    onClick={() => setSearch('')}
                  >
                    <span className="mi" style={{ fontSize: '1rem' }}>close</span>
                  </button>
                )}
              </div>
            )}

            <div className={styles.clothPickerList}>
              {filteredOrders.map(order => {
                const isSelected = selectedOrderId === order.id
                return (
                  <div key={order.id}>
                    <div
                      className={`
                        ${styles.clothPickerItem}
                        ${isSelected ? styles.clothPickerItem_selected : ''}
                        ${saving && isSelected ? styles.clothPickerItem_saving : ''}
                      `}
                      onClick={() => !saving && handleToggleOrder(order)}
                    >
                      <OrderMosaic items={order.items || []} size="sm" fallbackIcon="content_cut" />
                      <div className={styles.clothInfo}>
                        <h5>{order.desc || 'Untitled Order'}</h5>
                        {order.due
                          ? <span style={{ color: '#ef4444' }}>Due {order.due}</span>
                          : <span>No due date</span>
                        }
                      </div>
                      <div className={`${styles.clothCheckCircle} ${isSelected ? styles.clothCheckCircle_checked : ''}`}>
                        {isSelected && <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>}
                      </div>
                    </div>

                    {isSelected && (
                      <div ref={expandedRef} className={styles.accordionBody}>
                        <p className={styles.stepHeading} style={{ marginTop: 0, marginBottom: 16 }}>
                          2. Payment Details
                        </p>
                        <InlinePaymentForm order={order} onSave={handleSave} saving={saving} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ADD INSTALLMENT MODAL
// ─────────────────────────────────────────────────────────────

function AddInstallmentModal({ payment, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')

  const totalPaid = getTotalPaid(payment.installments)
  const remaining = (parseFloat(payment.orderPrice) || 0) - totalPaid

  function handleSave() {
    if (!amount || parseFloat(amount) <= 0) return
    onSave(parseFloat(amount), method)
    onClose()
  }

  return (
    <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.bottomSheet}>
        <div className={styles.bottomSheetHandle} />
        <div className={styles.bottomSheetHeader}>
          <div className={styles.bottomSheetTitle}>Record Payment</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>
        <div className={styles.bottomSheetBody}>
          {remaining > 0 && (
            <div className={styles.remainingBalanceBadge}>
              Balance remaining: <strong>{formatMoney(remaining)}</strong>
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Amount Received (₦)</label>
            <input
              type="number"
              className={styles.textInput}
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payment Method</label>
            <div className={styles.methodChipRow}>
              {['cash', 'transfer', 'card', 'other'].map(m => (
                <button
                  key={m}
                  className={`${styles.methodChip} ${method === m ? styles.methodChipActive : ''}`}
                  onClick={() => setMethod(m)}
                >
                  {capitalise(m)}
                </button>
              ))}
            </div>
          </div>
          <button
            className={styles.confirmActionBtn}
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// PAYMENT DETAIL MODAL
// ─────────────────────────────────────────────────────────────

function PaymentDetail({ payment, onClose, onDelete, onStatusChange, onAddInstallment }) {
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


// ─────────────────────────────────────────────────────────────
// PAYMENTS TAB — main export
// ─────────────────────────────────────────────────────────────

export default function PaymentsTab({
  orders          = [],
  payments        = [],
  showToast,
  onSavePayment,
  onUpdatePayment,
  onDeletePayment,
  onInvoicePaid,
}) {
  const [modalOpen,      setModalOpen]      = useState(false)
  const [viewingPayment, setViewingPayment] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)

  useEffect(() => {
    if (!viewingPayment) return
    const updated = payments.find(p => p.id === viewingPayment.id)
    setViewingPayment(updated ?? null)
  }, [payments])

  useEffect(() => {
    const handler = () => setModalOpen(true)
    document.addEventListener('openPaymentModal', handler)
    return () => document.removeEventListener('openPaymentModal', handler)
  }, [])

  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupPaymentsByDate(payments)

  async function handleSavePayment(paymentData) {
    try {
      await onSavePayment(paymentData)
      showToast('Payment recorded ✓')
      if (paymentData.status === 'paid')       onInvoicePaid?.(paymentData.orderId, 'paid')
      else if (paymentData.status === 'part')  onInvoicePaid?.(paymentData.orderId, 'part_paid')
    } catch {
      showToast('Failed to save payment.')
      throw new Error('save failed')
    }
  }

  async function handleStatusChange(paymentId, newStatus) {
    try {
      await onUpdatePayment(paymentId, { status: newStatus })
    } catch {
      showToast('Failed to update status.')
    }
  }

  async function handleAddInstallment(paymentId, amount, method) {
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return

    const newInstallment      = { amount, method, date: getTodayLabel(), time: getTimeLabel(), id: Date.now() }
    const updatedInstallments = [...(payment.installments || []), newInstallment]
    const totalPaid           = getTotalPaid(updatedInstallments)
    const fullPrice           = parseFloat(payment.orderPrice) || 0
    const newStatus           = fullPrice > 0 && totalPaid >= fullPrice ? 'paid' : payment.status

    try {
      await onUpdatePayment(paymentId, { installments: updatedInstallments, status: newStatus })
      if (newStatus === 'paid') {
        showToast('Payment complete! Marked as Paid ✓')
        onInvoicePaid?.(payment.orderId, 'paid')
      } else {
        showToast('Payment recorded ✓')
        onInvoicePaid?.(payment.orderId, 'part_paid')
      }
    } catch {
      showToast('Failed to record payment.')
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    try {
      await onDeletePayment(deleteTarget.id)
      showToast('Payment deleted')
    } catch {
      showToast('Failed to delete.')
    }
    setDeleteTarget(null)
    setViewingPayment(null)
  }

  return (
    <>
      {/* tabContent wrapper ensures the empty state can flex:1 to fill
          the available height and stay centred regardless of how tall
          the customer-detail header above the tab bar is. */}
      <div className={styles.tabContent}>
        {payments.length === 0 && (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.3 }}>payments</span>
            <p>No payments recorded yet.</p>
            <span className={styles.emptyStateHint}>Tap + to record a payment</span>
          </div>
        )}

        {Object.entries(groupedByDate).map(([date, datePayments]) => (
          <div key={date} className={styles.dateGroup}>
            <div className={styles.dateGroupLabel}>{date}</div>
            <div className={styles.dateGroupDivider} />

            {datePayments.map((payment, index) => {
              const statusMeta   = getStatusMeta(payment.status)
              const isLast       = index === datePayments.length - 1
              const installments = payment.installments || []
              const totalPaid    = getTotalPaid(installments)
              const fullPrice    = parseFloat(payment.orderPrice) || 0
              const progressPct  = getProgressPercent(totalPaid, fullPrice, payment.status)
              const orderItems   = orderItemsMap[payment.orderId] ?? []

              return (
                <div
                  key={payment.id}
                  className={`${styles.paymentRow} ${isLast ? styles.paymentRowLast : ''}`}
                  onClick={() => setViewingPayment(payment)}
                >
                  <OrderMosaic items={orderItems} size="md" fallbackIcon="payments" fallbackColor={statusMeta.color} />

                  <div className={styles.paymentRowInfo}>
                    <div className={styles.paymentRowTitle}>{payment.orderDesc || 'Payment'}</div>
                    <div className={styles.paymentRowMeta}>
                      <span
                        className={styles.paymentStatusBadge}
                        style={{ color: statusMeta.color, background: statusMeta.background, borderColor: statusMeta.borderColor }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className={styles.paymentRowRight}>
                    <div className={styles.paymentRowAmount}>
                      {fullPrice > 0 ? formatMoney(totalPaid) : formatMoney(installments[0]?.amount)}
                    </div>
                    {fullPrice > 0 && totalPaid < fullPrice && (
                      <div className={styles.paymentRowSubAmount}>of {formatMoney(fullPrice)}</div>
                    )}
                    {fullPrice > 0 && (
                      <div className={styles.miniProgressTrack}>
                        <div className={styles.miniProgressFill} style={{ width: `${progressPct}%`, background: statusMeta.color }} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={orders}
        payments={payments}
        onSave={handleSavePayment}
      />

      {viewingPayment && (
        <PaymentDetail
          payment={viewingPayment}
          onClose={() => setViewingPayment(null)}
          onDelete={() => setDeleteTarget(viewingPayment)}
          onStatusChange={handleStatusChange}
          onAddInstallment={handleAddInstallment}
        />
      )}

      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete Payment?"
        message="This can't be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

PaymentsTab.openModal = () => {
  document.dispatchEvent(new Event('openPaymentModal'))
}
