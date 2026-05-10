// src/pages/CustomerDetail/tabs/ReceiptTab/ReceiptTab.jsx

import { useState, useEffect, useRef } from 'react'
import ReceiptViewer from '../../../../components/ReceiptViewer/ReceiptViewer'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../../components/Header/Header'
import styles from './ReceiptsTab.module.css'


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatMoney(currency = '₦', amount) {
  const number = parseFloat(amount) || 0
  return `${currency}${number.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function getCurrency() {
  try {
    const settings = JSON.parse(localStorage.getItem('tailorflow_general_settings') || '{}')
    return settings.invoiceCurrency || '₦'
  } catch {
    return '₦'
  }
}

function groupReceiptsByDate(receipts) {
  return receipts.reduce((groups, receipt) => {
    const date = receipt.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(receipt)
    return groups
  }, {})
}

function buildOrderItemsMap(orders) {
  const map = {}
  for (const order of orders) {
    if (order.id && order.items?.length > 0) {
      map[order.id] = order.items
    }
  }
  return map
}

function getPaymentStatus(receipt) {
  const thisPayment  = (receipt.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid    = receipt.cumulativePaid != null ? parseFloat(receipt.cumulativePaid) : thisPayment
  const orderTotal   = parseFloat(receipt.totalAmount ?? receipt.orderPrice) || totalPaid
  const isPaidInFull = totalPaid >= orderTotal && orderTotal > 0

  return {
    thisPayment,
    isPaidInFull,
    label: isPaidInFull ? 'Paid in Full' : 'Part Payment',
    badgeStyle: isPaidInFull
      ? { background: 'rgba(34,197,94,0.12)',  color: '#15803d', borderColor: 'rgba(34,197,94,0.3)'  }
      : { background: 'rgba(251,146,60,0.12)', color: '#c2410c', borderColor: 'rgba(251,146,60,0.3)' },
  }
}

function getTotalPaid(installments) {
  return (installments || []).reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
}

function capitalise(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function isPaymentFullyReceipted(payment, receipts) {
  const installments = payment?.installments || []
  if (installments.length === 0) return false

  const receiptedIds = new Set(
    receipts
      .filter(r => String(r.paymentId) === String(payment.id))
      .flatMap(r => r.installmentIds || [])
  )

  return installments.every(inst => receiptedIds.has(String(inst.id)))
}


// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ items = [], size = 'md' }) {
  const images     = items.map(item => item.imgSrc ?? null).filter(Boolean)
  const totalItems = items.length
  const isSm       = size === 'sm'

  const outerCls = isSm ? styles.mosaicOuter_sm : styles.mosaicOuter
  const innerCls = isSm ? styles.mosaicInner_sm : styles.mosaicInner

  if (images.length === 0) {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <span className="mi" style={{ fontSize: isSm ? '1rem' : '1.4rem', color: 'var(--text3)' }}>
            receipt_long
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
                : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
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
            : <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.mosaicDividerV} />
        <div className={styles.mosaicRight}>
          <div className={styles.mosaicCell}>
            {images[1]
              ? <img src={images[1]} alt="" className={styles.mosaicPanelImg} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.mosaicDividerH} />
          <div className={`${styles.mosaicCell} ${extraCount > 0 ? styles.mosaicCell_overlay : ''}`}>
            {images[2]
              ? <img src={images[2]} alt="" className={styles.mosaicPanelImg} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extraCount > 0 && (
              <div className={styles.mosaicOverlay}>+{extraCount}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// INLINE INSTALLMENT LIST
// ─────────────────────────────────────────────────────────────

function InlineInstallmentList({ order, payment, receipts, generating, onSelectPayment }) {
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
              {/* ── Row 1: badge · amount · action ── */}
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

              {/* ── Row 2: balance · date + method ── */}
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


// ─────────────────────────────────────────────────────────────
// ACCORDION BODY — smooth height animation (Radix-style)
// ─────────────────────────────────────────────────────────────

function AccordionBody({ isOpen, children, scrollRef }) {
  const innerRef  = useRef(null)
  const [height, setHeight] = useState(0)
  const [visible, setVisible] = useState(false)
  const rafRef    = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Mount immediately so we can measure, but keep height:0
      setVisible(true)
      // One rAF to let the DOM paint, then set the measured height
      rafRef.current = requestAnimationFrame(() => {
        if (innerRef.current) {
          setHeight(innerRef.current.scrollHeight)
        }
        // Pass the scroll ref up so the modal can scroll to it
        if (scrollRef) scrollRef.current = innerRef.current
      })
    } else {
      // Collapse: animate back to 0, then unmount
      setHeight(0)
      const timer = setTimeout(() => setVisible(false), 380)
      return () => clearTimeout(timer)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  return (
    <div
      style={{
        height: height,
        overflow: 'hidden',
        transition: 'height 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div ref={innerRef} className={styles.accordionBody}>
        {children}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// RECEIPT PICKER MODAL
// ─────────────────────────────────────────────────────────────

function ReceiptPickerModal({ isOpen, onClose, orders, payments, receipts, onSelectPayment, generating }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [search,          setSearch]          = useState('')
  const expandedRef                           = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedOrderId(null)
      setSearch('')
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedOrderId && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 60)
    }
  }, [selectedOrderId])

  const ordersNeedingReceipt = orders.filter(order => {
    const payment = payments.find(p => String(p.orderId) === String(order.id))
    if (!payment) return false
    return !isPaymentFullyReceipted(payment, receipts)
  })

  const showSearch     = ordersNeedingReceipt.length > 5
  const filteredOrders = ordersNeedingReceipt.filter(order => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (order.desc    || '').toLowerCase().includes(q) ||
      (order.due     || '').toLowerCase().includes(q) ||
      (order.takenAt || '').toLowerCase().includes(q) ||
      (order.items   || []).some(i => (i.name || '').toLowerCase().includes(q))
    )
  })

  function handleToggleOrder(order) {
    setSelectedOrderId(prev => prev === order.id ? null : order.id)
  }

  const showAllReceiptsGenerated = ordersNeedingReceipt.length === 0
  const showNoSearchMatch        = ordersNeedingReceipt.length > 0 && filteredOrders.length === 0

  return (
    <div className={`${styles.pickerOverlay} ${isOpen ? styles.pickerOverlay_open : ''}`}>

      <Header
        type="back"
        title="New Receipt"
        onBackClick={generating ? undefined : onClose}
      />

      {/* ── Empty states — outside scroll body, centred in remaining space ── */}
      {showAllReceiptsGenerated && (
        <div className={styles.pickerEmpty}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>receipt_long</span>
          <p style={{ fontWeight: 700, color: 'var(--text2)' }}>All receipts generated</p>
          <p>Every recorded payment already has a receipt. Record a new payment first to generate another.</p>
        </div>
      )}

      {showNoSearchMatch && (
        <div className={styles.pickerEmpty}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>search_off</span>
          <p>No orders match your search</p>
        </div>
      )}

      {/* ── Scrollable list — only rendered when there are items to show ── */}
      {!showAllReceiptsGenerated && (
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
                const isSelected  = selectedOrderId === order.id
                const payment     = payments.find(p => String(p.orderId) === String(order.id))
                const installs    = payment?.installments || []
                const paid        = getTotalPaid(installs)
                const price       = parseFloat(order.totalAmount ?? order.price) || 0
                const isFullyPaid = price > 0 && paid >= price

                const receiptedIds = new Set(
                  receipts
                    .filter(r => String(r.paymentId) === String(payment?.id))
                    .flatMap(r => r.installmentIds || [])
                )
                const pendingCount = installs.filter(i => !receiptedIds.has(String(i.id))).length
                const installCount = installs.length

                return (
                  <div key={order.id}>
                    <div
                      className={`${styles.clothPickerItem} ${isSelected ? styles.clothPickerItem_selected : ''}`}
                      onClick={() => handleToggleOrder(order)}
                    >
                      <OrderMosaic items={order.items || []} size="sm" />

                      <div className={styles.clothInfo}>
                        <h5>{order.desc || 'Untitled Order'}</h5>
                        <span style={{ color: isFullyPaid ? '#15803d' : '#fb923c' }}>
                          {installCount} {installCount === 1 ? 'payment' : 'payments'} ·{' '}
                          {pendingCount === installCount
                            ? 'No receipts yet'
                            : `${pendingCount} pending`
                          }
                        </span>
                      </div>

                      <div className={`${styles.clothCheckCircle} ${isSelected ? styles.clothCheckCircle_checked : ''}`}>
                        <span
                          className="mi"
                          style={{
                            fontSize: '0.9rem',
                            color: isSelected ? 'inherit' : 'var(--text3)',
                            display: 'block',
                            transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        >
                          expand_more
                        </span>
                      </div>
                    </div>

                    <AccordionBody isOpen={isSelected} scrollRef={expandedRef}>
                      <InlineInstallmentList
                        order={order}
                        payment={payment}
                        receipts={receipts}
                        generating={generating}
                        onSelectPayment={onSelectPayment}
                      />
                    </AccordionBody>
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
// RECEIPT CARD
// ─────────────────────────────────────────────────────────────

function ReceiptCard({ receipt, currency, onTap, isLast, orderItems }) {
  const { thisPayment, isPaidInFull, label, badgeStyle } = getPaymentStatus(receipt)
  const itemCount = receipt.items?.length > 0 ? receipt.items.length : (receipt.qty || null)

  return (
    <div
      className={`${styles.receiptRow} ${isLast ? styles.receiptRowLast : ''}`}
      onClick={onTap}
    >
      <OrderMosaic items={orderItems} size="md" />

      <div className={styles.receiptRowInfo}>
        <div className={styles.receiptRowTitle}>{receipt.orderDesc || 'Payment'}</div>
        {itemCount && (
          <div className={styles.receiptRowItemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      <div className={styles.receiptRowRight}>
        <span className={styles.receiptStatusBadge} style={badgeStyle}>
          {label}
        </span>
        <div className={styles.receiptRowAmount}>
          {formatMoney(currency, thisPayment)}
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>receipt</span>
      <p className={styles.emptyStateTitle}>No receipts yet</p>
      <p className={styles.emptyStateSubtitle}>
        Tap <strong>+</strong> to generate a receipt from a recorded payment,
        or open a payment on the Payments tab.
      </p>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// RECEIPT TAB — main export
// ─────────────────────────────────────────────────────────────

export default function ReceiptTab({
  receipts         = [],
  orders           = [],
  payments         = [],
  customer,
  onDelete,
  onGenerateReceipt,
  showToast,
}) {
  const [viewingReceipt, setViewingReceipt] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [pickerOpen,     setPickerOpen]     = useState(false)
  const [generating,     setGenerating]     = useState(null)

  const currency      = getCurrency()
  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupReceiptsByDate(receipts)

  useEffect(() => {
    const openPicker = () => setPickerOpen(true)
    document.addEventListener('openReceiptModal', openPicker)
    return () => document.removeEventListener('openReceiptModal', openPicker)
  }, [])

  async function handleSelectPayment(payment, installment) {
    setGenerating(installment.id)
    try {
      await onGenerateReceipt(payment, installment)
      setGenerating(null)
    } catch {
      setGenerating(null)
      showToast('Failed to generate receipt. Try again.')
    }
  }

  function handleConfirmDelete() {
    onDelete(deleteTarget)
    showToast('Receipt deleted')
    setDeleteTarget(null)
    if (viewingReceipt?.id === deleteTarget) setViewingReceipt(null)
  }

  return (
    <>
      <div className={styles.tabContent}>
        {receipts.length === 0 && <EmptyState />}

        {receipts.length > 0 && Object.entries(groupedByDate).map(([date, dateReceipts]) => (
          <div key={date} className={styles.dateGroup}>
            <div className={styles.dateGroupLabel}>{date}</div>
            <div className={styles.dateGroupDivider} />

            {dateReceipts.map((receipt, index) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                currency={currency}
                isLast={index === dateReceipts.length - 1}
                onTap={() => setViewingReceipt(receipt)}
                orderItems={orderItemsMap[receipt.orderId] ?? receipt.orderItems ?? []}
              />
            ))}
          </div>
        ))}
      </div>

      <ReceiptPickerModal
        isOpen={pickerOpen}
        onClose={() => {
          if (generating) return
          setPickerOpen(false)
        }}
        orders={orders}
        payments={payments}
        receipts={receipts}
        onSelectPayment={handleSelectPayment}
        generating={generating}
      />

      {viewingReceipt && (
        <ReceiptViewer
          receipt={viewingReceipt}
          customer={customer}
          onClose={() => setViewingReceipt(null)}
          onDelete={(id) => setDeleteTarget(id)}
          showToast={showToast}
        />
      )}

      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete this receipt?"
        message="This can't be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
