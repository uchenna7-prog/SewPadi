
import { useState, useEffect, useRef } from 'react'
import { ORDER_STATUS_STYLES, ORDER_STATUS_LABELS } from '../../../../../../datas/orderDatas'
import { getCurrency,formatMoney } from '../../../../../../utils/moneyUtils'
import OrderMosaic from '../../../../../../components/OrderMosaic/OrderMosaic'
import Header from '../../../../../../components/Header/Header'
import styles from './AddInvoiceModal.module.css'


export function AddInvoiceModal({
  isOpen,
  onClose,
  orders,
  invoices,
  onGenerateSelected,
  generatingIds,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [search, setSearch]      = useState('')
  const step2Ref  = useRef(null)
  const currency  = getCurrency()

  const showSearch = orders.length > 5


  useEffect(() => {

    if (!isOpen) {
      setSelectedIds(new Set())
      setSearch('')
    }
  }, [isOpen])


  useEffect(() => {
    if (selectedIds.size === 1 && step2Ref.current) {
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
    }
  }, [selectedIds.size])


  const invoicedOrderIds  = new Set(invoices.map(inv => String(inv.orderId)))
  const nonInvoicedOrders = orders.filter(order => !invoicedOrderIds.has(String(order.id)))

  const filtered = nonInvoicedOrders.filter(order => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (order.desc    || '').toLowerCase().includes(q) ||
      (order.status  || '').toLowerCase().includes(q) ||
      (order.due     || '').toLowerCase().includes(q) ||
      (order.takenAt || '').toLowerCase().includes(q) ||
      (order.items   || []).some(i => (i.name || '').toLowerCase().includes(q))
    )
  })

  const selectedOrders  = nonInvoicedOrders.filter(o => selectedIds.has(o.id))
  const isAnyGenerating = generatingIds.size > 0

  const showAllInvoiced   = nonInvoicedOrders.length === 0
  const showNoSearchMatch = nonInvoicedOrders.length > 0 && filtered.length === 0


  function toggleOrder(order) {
    if (generatingIds.size > 0) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(order.id) ? next.delete(order.id) : next.add(order.id)
      return next
    })
  }


  return (
    <div className={`${styles.pickerOverlay} ${isOpen ? styles.pickerOverlay_open : ''}`}>
      <Header
        type="back"
        title="New Invoice"
        onBackClick={onClose}
      />

      {showAllInvoiced && (
        <div className={styles.pickerEmpty}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>receipt_long</span>
          <p>All orders already have invoices.</p>
        </div>
      )}

      {showNoSearchMatch && (
        <div className={styles.pickerEmpty}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--text3)' }}>search_off</span>
          <p>No orders match your search</p>
        </div>
      )}

      {!showAllInvoiced && (
        <div className={styles.pickerScrollBody}>
          <div style={{ padding: '20px' }}>

            <p className={styles.stepHeading}>1. Select Orders</p>

            {showSearch && (
              <div className={styles.clothSearchBar}>
                <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
                <input
                  type="text"
                  placeholder="Search orders…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={styles.clothSearchInput}
                />
                {search.length > 0 && (
                  <button
                    className={styles.clothSearchClear}
                    onClick={() => setSearch('')}
                  >
                    <span className="mi" style={{ fontSize: '1rem' }}>close</span>
                  </button>
                )}
              </div>
            )}

            <div className={styles.clothPickerList}>
              {filtered.map(order => {
                const isSelected   = selectedIds.has(order.id)
                const isGenerating = generatingIds.has(order.id)
                const statusKey    = order.status || 'pending'
                const badgeLabel   = ORDER_STATUS_LABELS[statusKey] ?? order.status
                const badgeStyle   = ORDER_STATUS_STYLES[statusKey] ?? ORDER_STATUS_STYLES.pending

                return (
                  <div
                    key={order.id}
                    className={`
                      ${styles.clothPickerItem}
                      ${isSelected   ? styles.clothPickerItem_selected   : ''}
                      ${isGenerating ? styles.clothPickerItem_generating : ''}
                    `}
                    onClick={() => toggleOrder(order)}
                  >
                    <OrderMosaic items={order.items || []} size="sm" />

                    <div className={styles.clothInfo}>
                      <h5>{order.desc || 'Untitled Order'}</h5>
                      <span className={styles.orderStatusBadge} style={badgeStyle}>
                        {badgeLabel}
                      </span>
                    </div>

                    <div className={`${styles.clothCheckCircle} ${isSelected ? styles.clothCheckCircle_checked : ''}`}>
                      {isGenerating
                        ? <div className={styles.pickerSpinner} />
                        : isSelected
                          ? <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>
                          : null
                      }
                    </div>
                  </div>
                )
              })}
            </div>

  
            {selectedOrders.length > 0 && (
              <div ref={step2Ref}>
                <p className={styles.stepHeading} style={{ marginTop: 24 }}>
                  {`2. Generate Invoice${selectedOrders.length > 1 ? 's' : ''}`}
                </p>

                <div className={styles.generateCard}>
                  {selectedOrders.map((order, idx) => {
                    const isGenerating = generatingIds.has(order.id)
                    const isLast       = idx === selectedOrders.length - 1

                    return (
                      <div
                        key={order.id}
                        className={`${styles.generateOrderRow} ${isLast ? styles.generateOrderRow_last : ''}`}
                      >
                        <OrderMosaic items={order.items || []} size="sm" />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={styles.generateOrderName}>
                            {order.desc || 'Untitled Order'}
                          </div>
                          {order.price != null && (
                            <div className={styles.generateOrderPrice}>
                              {formatMoney(currency, order.price, 0, 0)}
                            </div>
                          )}
                        </div>

                        {isGenerating && (
                          <div className={styles.generateRowSpinnerWrap}>
                            <div className={styles.pickerSpinner} />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className={styles.generateDivider} />

                  <button
                    className={styles.generateInlineButton}
                    onClick={() => onGenerateSelected(selectedOrders)}
                    disabled={isAnyGenerating}
                  >
                    {isAnyGenerating ? (
                      <>
                        <div className={styles.pickerSpinnerWhite} />
                        Generating…
                      </>
                    ) : (
                      <>
                        <span className="material-icons" style={{ fontSize: '1.1rem', color:"var(--text)" }}>receipt_long</span>
                        {selectedOrders.length > 1
                          ? `Generate ${selectedOrders.length} Invoices`
                          : 'Generate Invoice'
                        }
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}