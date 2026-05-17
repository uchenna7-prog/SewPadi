import { useEffect,useRef,useState } from "react"
import { InlinePaymentForm } from "../InlinePaymentForm/InlinePaymentForm"
import OrderMosaic from "../../../../../../components/OrderMosaic/OrderMosaic"
import styles from "./AddPaymentModal.module.css"
import Header from "../../../../../../components/Header/Header"


export function AddPaymentModal({ isOpen, onClose, orders, payments, onSave }) {

  
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
