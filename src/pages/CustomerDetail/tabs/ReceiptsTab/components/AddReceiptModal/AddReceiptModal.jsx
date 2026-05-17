import { useEffect,useRef,useState} from "react"
import { InlineInstallmentList } from "../InlineInstallmentList/InlineInstallmentList"
import { getTotalPaid } from "../../utils"
import OrderMosaic from "../../../../../../components/OrderMosaic/OrderMosaic"
import Header from "../../../../../../components/Header/Header"
import styles from "./AddReceiptModal.module.css"


export function AddReceiptModal({ isOpen, onClose, orders, payments, receipts, onSelectPayment, generating }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [search, setSearch] = useState('')
  const expandedRef  = useRef(null)

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
                        {isSelected
                          ? <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>
                          : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>expand_more</span>
                        }
                      </div>
                    </div>

                    {isSelected && (
                      <div ref={expandedRef} className={styles.accordionBody}>
                        <InlineInstallmentList
                          order={order}
                          payment={payment}
                          receipts={receipts}
                          generating={generating}
                          onSelectPayment={onSelectPayment}
                        />
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
