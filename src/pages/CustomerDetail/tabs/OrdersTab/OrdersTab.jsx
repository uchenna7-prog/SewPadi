import { useState, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useOrders }   from '../../../../contexts/OrdersContext'
import { useAuth }     from '../../../../contexts/AuthContext'
import { useGeneralSettings } from '../../../../contexts/GeneralSettingsContext'
import ConfirmSheet    from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header          from '../../../../components/Header/Header'
import styles          from './OrdersTab.module.css'


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const PRIORITY_BANNER_CONFIG = {
  normal: { className: styles.priorityBanner_normal, label: 'Normal Priority' },
  urgent: { className: styles.priorityBanner_urgent, label: 'Urgent ★'        },
  vip:    { className: styles.priorityBanner_vip,    label: 'VIP ★'           },
}

const STATUSES = [
  { value: 'pending',     label: 'Pending'     },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed'   },
  { value: 'delivered',   label: 'Delivered'   },
  { value: 'cancelled',   label: 'Cancelled'   },
]

const STAGES = [
  { value: 'measurement_taken', label: 'Measurement Taken', icon: 'straighten',    color: '#a16207' },
  { value: 'fabric_ready',      label: 'Fabric Ready',      icon: 'layers',        color: '#a16207' },
  { value: 'cutting',           label: 'Cutting',           icon: 'content_cut',   color: '#2563eb' },
  { value: 'weaving',           label: 'Weaving',           icon: 'texture',       color: '#2563eb' },
  { value: 'sewing',            label: 'Sewing',            icon: 'send',          color: '#2563eb' },
  { value: 'embroidery',        label: 'Embroidery',        icon: 'auto_awesome',  color: '#2563eb' },
  { value: 'fitting',           label: 'Fitting',           icon: 'accessibility', color: '#2563eb' },
  { value: 'adjustments',       label: 'Adjustments',       icon: 'tune',          color: '#2563eb' },
  { value: 'finishing',         label: 'Finishing',         icon: 'dry_cleaning',  color: '#2563eb' },
  { value: 'quality_check',     label: 'Quality Check',     icon: 'fact_check',    color: '#2563eb' },
  { value: 'ready',             label: 'Ready',             icon: 'check_circle',  color: '#15803d' },
]

const STAGE_AUTO_STATUS = {
  measurement_taken: 'pending',
  fabric_ready:      'pending',
  cutting:           'in-progress',
  weaving:           'in-progress',
  sewing:            'in-progress',
  embroidery:        'in-progress',
  fitting:           'in-progress',
  adjustments:       'in-progress',
  finishing:         'in-progress',
  quality_check:     'in-progress',
  ready:             'completed',
}

const VISIBLE_MEASUREMENT_LIMIT = 3


// ─────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────

function formatFirestoreDate(timestamp) {
  if (!timestamp) return 'Unknown Date'
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }
  if (typeof timestamp === 'string') return timestamp
  return 'Unknown Date'
}

function formatShortDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function getTodayReadable() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}


// ─────────────────────────────────────────────────────────────
// SKELETON — mirrors the real order row layout
// ─────────────────────────────────────────────────────────────

function OrderRowSkeleton() {
  return (
    <div className={styles.orderRow} style={{ pointerEvents: 'none' }}>
      {/* Mosaic thumbnail */}
      <Skeleton width={80} height={80} borderRadius={12} />

      {/* Info column */}
      <div className={styles.orderRowInfo}>
        <Skeleton width={140} height={14} borderRadius={6} style={{ marginBottom: 6,background:"var(--bg)" }} />
        <Skeleton width={80}  height={11} borderRadius={6} style={{ marginBottom: 6,background:"var(--bg)" }} />
        <Skeleton width={60}  height={11} borderRadius={6} />
      </div>

      {/* Right column — price + badge */}
      <div className={styles.orderRowRight} style={{ alignItems: 'flex-end', gap: 6 ,background:"var(--bg)"}}>
        <Skeleton width={70} height={14} borderRadius={6} />
        <Skeleton width={60} height={20} borderRadius={20} />
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ORDER MOSAIC THUMBNAIL
// ─────────────────────────────────────────────────────────────

function OrderMosaic({ items }) {
  const images     = items.map(item => item.imgSrc ?? null).filter(Boolean)
  const totalItems = items.length
  const hasImages  = images.length > 0

  const placeholderIcon = (
    <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>
      content_cut
    </span>
  )

  if (!hasImages) {
    return (
      <div className={styles.mosaicContainer}>
        <div className={styles.mosaicBox}>{placeholderIcon}</div>
      </div>
    )
  }

  if (totalItems === 1) {
    return (
      <div className={styles.mosaicContainer}>
        <div className={styles.mosaicBox}>
          <img src={images[0]} alt="" className={styles.mosaicSingleImage} />
        </div>
      </div>
    )
  }

  if (totalItems === 2) {
    return (
      <div className={styles.mosaicContainer}>
        <div className={`${styles.mosaicBox} ${styles.mosaicBox_split}`}>
          <div className={styles.mosaicPanel_left}>
            <img src={images[0]} alt="" className={styles.mosaicPanelImage} />
          </div>
          <div className={styles.mosaicDivider_vertical} />
          <div className={styles.mosaicPanel_right}>
            <div className={styles.mosaicCell}>
              {images[1]
                ? <img src={images[1]} alt="" className={styles.mosaicPanelImage} />
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
    <div className={styles.mosaicContainer}>
      <div className={`${styles.mosaicBox} ${styles.mosaicBox_split}`}>
        <div className={styles.mosaicPanel_left}>
          {images[0]
            ? <img src={images[0]} alt="" className={styles.mosaicPanelImage} />
            : <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.mosaicDivider_vertical} />
        <div className={styles.mosaicPanel_right}>
          <div className={styles.mosaicCell}>
            {images[1]
              ? <img src={images[1]} alt="" className={styles.mosaicPanelImage} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.mosaicDivider_horizontal} />
          <div className={`${styles.mosaicCell} ${extraCount > 0 ? styles.mosaicCell_hasOverlay : ''}`}>
            {images[2]
              ? <img src={images[2]} alt="" className={styles.mosaicPanelImage} />
              : <span className="mi" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>checkroom</span>
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
// ORDER FORM MODAL
// ─────────────────────────────────────────────────────────────

function OrderModal({ isOpen, onClose, measurements, onSave, taxRate, taxEnabled }) {

  const [selectedItems,   setSelectedItems]   = useState([])
  const [clothSearchText, setClothSearchText] = useState('')
  const [orderDesc,       setOrderDesc]       = useState('')
  const [dueDate,         setDueDate]         = useState('')
  const [priority,        setPriority]        = useState('normal')
  const [notes,           setNotes]           = useState('')
  const [pricingError,    setPricingError]    = useState('')
  const [shippingFee,     setShippingFee]     = useState('')
  const [discountValue,   setDiscountValue]   = useState('')
  const [discountType,    setDiscountType]    = useState('fixed')

  function resetForm() {
    setSelectedItems([])
    setClothSearchText('')
    setOrderDesc('')
    setDueDate('')
    setPriority('normal')
    setNotes('')
    setPricingError('')
    setShippingFee('')
    setDiscountValue('')
    setDiscountType('fixed')
  }

  function toggleItemSelection(measurement) {
    const itemId   = String(measurement.id)
    const coverImg = measurement.imgSrcs?.[0] ?? measurement.imgSrc ?? null
    setSelectedItems(prev => {
      const alreadySelected = prev.find(item => item.id === itemId)
      if (alreadySelected) return prev.filter(item => item.id !== itemId)
      return [...prev, { id: itemId, price: '', qty: '', name: measurement.name, imgSrc: coverImg }]
    })
    setPricingError('')
  }

  function updateItemField(itemId, field, value) {
    setSelectedItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, [field]: value } : item)
    )
    setPricingError('')
  }

  const subtotal = selectedItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) || 0) * (parseInt(item.qty, 10) || 0)
  }, 0)

  const shippingAmount     = parseFloat(shippingFee) || 0
  const rawDiscountInput   = parseFloat(discountValue) || 0
  const discountAmount     = discountType === 'percent'
    ? Math.round(subtotal * (Math.min(rawDiscountInput, 100) / 100) * 100) / 100
    : Math.min(rawDiscountInput, subtotal)
  const discountedSubtotal = subtotal - discountAmount
  const taxMultiplier      = taxEnabled ? (taxRate / 100) : 0
  const taxAmount          = Math.round(discountedSubtotal * taxMultiplier * 100) / 100
  const grandTotal         = discountedSubtotal + shippingAmount + taxAmount

  const totalQty = selectedItems.reduce((sum, item) => {
    return sum + (parseInt(item.qty, 10) || 0)
  }, 0) || 1

  const hasItems    = selectedItems.length > 0
  const isSearching = clothSearchText.trim().length > 0

  const visibleMeasurements = isSearching
    ? measurements.filter(m =>
        m.name.toLowerCase().includes(clothSearchText.toLowerCase())
      )
    : measurements.slice(0, VISIBLE_MEASUREMENT_LIMIT)

  const hiddenCount     = isSearching ? 0 : Math.max(0, measurements.length - VISIBLE_MEASUREMENT_LIMIT)
  const taxPercentLabel = taxEnabled ? `${taxRate}%` : null

  function handleSave() {
    const hasDesc = orderDesc.trim()
    if (!hasItems && !hasDesc) return

    if (hasItems) {
      const incomplete = selectedItems.find(
        item => !(parseFloat(item.price) > 0) || !(parseInt(item.qty, 10) > 0)
      )
      if (incomplete) {
        setPricingError(`Please enter both price and quantity for "${incomplete.name}".`)
        return
      }
    }

    let dueDateDisplay = ''
    if (dueDate) {
      dueDateDisplay = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    }

    onSave({
      desc:           orderDesc.trim() || (hasItems ? selectedItems.map(i => i.name).join(', ') : 'New Order'),
      price:          subtotal,
      items:          selectedItems.map(item => ({
        id:     item.id,
        name:   item.name,
        imgSrc: item.imgSrc || null,
        price:  parseFloat(item.price) || 0,
        qty:    parseInt(item.qty, 10) || 1,
      })),
      qty:            totalQty,
      due:            dueDateDisplay,
      dueRaw:         dueDate,
      notes:          notes.trim(),
      priority,
      measurementIds: selectedItems.map(i => i.id),
      status:         'pending',
      stage:          null,
      takenAt:        getTodayReadable(),
      shippingFee:      shippingAmount,
      discountType:     discountAmount > 0 ? discountType : null,
      discountValue:    discountAmount > 0 ? rawDiscountInput : 0,
      discountAmount:   discountAmount,
      taxRate:          taxEnabled ? taxRate : 0,
      taxAmount:        taxAmount,
      totalAmount:      grandTotal,
    })

    resetForm()
    onClose()
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  return (
    <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlay_open : ''}`}>
      <Header
        type="back"
        title="New Order"
        onBackClick={handleClose}
        customActions={[{ label: 'Place Order', onClick: handleSave }]}
      />

      <div className={styles.formScrollBody}>
        <div style={{ padding: '20px' }}>

          <p className={styles.stepHeading}>1. Select Clothes</p>

          {measurements.length > VISIBLE_MEASUREMENT_LIMIT && (
            <div className={styles.clothSearchBar}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>search</span>
              <input
                type="text"
                placeholder="Search cloth type…"
                value={clothSearchText}
                onChange={e => setClothSearchText(e.target.value)}
                className={styles.clothSearchInput}
              />
              {clothSearchText.length > 0 && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 0 }}
                  onClick={() => setClothSearchText('')}
                >
                  <span className="mi" style={{ fontSize: '1rem' }}>close</span>
                </button>
              )}
            </div>
          )}

          <div className={styles.clothPickerList}>
            {visibleMeasurements.map(measurement => {
              const isSelected = selectedItems.find(i => i.id === String(measurement.id))
              const coverImg   = measurement.imgSrcs?.[0] ?? measurement.imgSrc ?? null

              return (
                <div
                  key={measurement.id}
                  className={`${styles.clothPickerItem} ${isSelected ? styles.clothPickerItem_selected : ''}`}
                  onClick={() => toggleItemSelection(measurement)}
                >
                  <div className={styles.clothThumb}>
                    {coverImg
                      ? <img src={coverImg} alt={measurement.name} />
                      : <span className="mi" style={{ fontSize: '1.1rem' }}>checkroom</span>
                    }
                  </div>
                  <div className={styles.clothInfo}>
                    <h5>{measurement.name}</h5>
                    <span>{measurement.fields?.length || 0} measurements</span>
                  </div>
                  <div className={`${styles.clothCheckCircle} ${isSelected ? styles.clothCheckCircle_checked : ''}`}>
                    {isSelected && <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {hiddenCount > 0 && (
            <div className={styles.clothHiddenHint}>
              <div className={styles.clothHiddenHintDots}>
                <span /><span /><span />
              </div>
              <span className={styles.clothHiddenHintText}>
                More results available — use the search bar above
              </span>
            </div>
          )}

          {isSearching && visibleMeasurements.length === 0 && (
            <div className={styles.clothEmptySearch}>
              <span className="mi" style={{ fontSize: '1.6rem' }}>search_off</span>
              <span>No results for "<strong>{clothSearchText}</strong>"</span>
            </div>
          )}

          {hasItems && (
            <>
              <p className={styles.stepHeading} style={{ marginTop: 24 }}>
                2. Price &amp; Quantity Per Item
              </p>

              <div className={styles.pricingCard}>
                {selectedItems.map((item, idx) => {
                  const lineAmount = (parseFloat(item.price) || 0) * (parseInt(item.qty, 10) || 0)
                  const showAmount = lineAmount > 0
                  const isLast     = idx === selectedItems.length - 1

                  return (
                    <div key={item.id} className={`${styles.pricingItem} ${isLast ? styles.pricingItem_last : ''}`}>
                      <div className={styles.pricingItemMeta}>
                        <div className={styles.pricingThumb}>
                          {item.imgSrc
                            ? <img src={item.imgSrc} alt="" />
                            : <span className="mi" style={{ fontSize: '0.85rem' }}>checkroom</span>
                          }
                        </div>
                        <span className={styles.pricingItemName}>{item.name}</span>
                        {showAmount && (
                          <span className={styles.pricingItemAmount}>
                            ₦{lineAmount.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className={styles.pricingInputRow}>
                        <div className={styles.pricingFieldPrice}>
                          <label className={styles.fieldLabel}>
                            Price (₦) <span className={styles.requiredStar}>*</span>
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="0"
                            className={styles.pricingInput}
                            value={item.price}
                            onChange={e => updateItemField(item.id, 'price', e.target.value)}
                          />
                        </div>

                        <div className={styles.pricingFieldQty}>
                          <label className={styles.fieldLabel}>
                            Qty <span className={styles.requiredStar}>*</span>
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="1"
                            min="1"
                            className={styles.pricingInput}
                            value={item.qty}
                            onChange={e => updateItemField(item.id, 'qty', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {pricingError && (
                  <div className={styles.pricingError}>
                    <span className="mi" style={{ fontSize: '0.9rem' }}>error_outline</span>
                    {pricingError}
                  </div>
                )}

                <div className={styles.orderTotalRow}>
                  <span>Subtotal (Qty: {totalQty})</span>
                  <span style={{ color: 'var(--text2)' }}>₦{subtotal.toLocaleString()}</span>
                </div>
              </div>

              <p className={styles.stepHeading} style={{ marginTop: 24 }}>
                3. Discount &amp; Charges
              </p>

              <div className={styles.chargesCard}>
                <div className={styles.chargeRow}>
                  <div className={styles.chargeRowLeft}>
                    <div className={styles.chargeIconBox}>
                      <span className="mi" style={{ fontSize: '1rem' }}>local_shipping</span>
                    </div>
                    <div>
                      <div className={styles.chargeRowLabel}>Shipping Fee</div>
                      <div className={styles.chargeRowSub}>Delivery cost charged to the customer</div>
                    </div>
                  </div>
                  <div className={styles.chargeInputWrapper}>
                    <span className={styles.chargeInputPrefix}>₦</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      className={styles.chargeInput}
                      value={shippingFee}
                      onChange={e => setShippingFee(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.chargeDivider} />

                <div className={styles.chargeRow}>
                  <div className={styles.chargeRowLeft}>
                    <div className={styles.chargeIconBox}>
                      <span className="mi" style={{ fontSize: '1rem' }}>sell</span>
                    </div>
                    <div>
                      <div className={styles.chargeRowLabel}>Discount</div>
                      <div className={styles.chargeRowSub}>Deducted from the order subtotal</div>
                    </div>
                  </div>
                  <div className={styles.discountInputGroup}>
                    <div className={styles.discountTypeToggle}>
                      <button
                        className={`${styles.discountTypeBtn} ${discountType === 'fixed' ? styles.discountTypeBtn_active : ''}`}
                        onClick={() => setDiscountType('fixed')}
                      >₦</button>
                      <button
                        className={`${styles.discountTypeBtn} ${discountType === 'percent' ? styles.discountTypeBtn_active : ''}`}
                        onClick={() => setDiscountType('percent')}
                      >%</button>
                    </div>
                    <div className={styles.chargeInputWrapper} style={{ width: 80 }}>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        className={styles.chargeInput}
                        value={discountValue}
                        onChange={e => setDiscountValue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {taxEnabled && (
                  <>
                    <div className={styles.chargeDivider} />
                    <div className={styles.chargeRow}>
                      <div className={styles.chargeRowLeft}>
                        <div className={styles.chargeIconBox}>
                          <span className="mi" style={{ fontSize: '1rem' }}>receipt</span>
                        </div>
                        <div>
                          <div className={styles.chargeRowLabel}>
                            Tax
                            <span className={styles.taxBadge}>{taxPercentLabel} VAT</span>
                          </div>
                          <div className={styles.chargeRowSub}>Applied to subtotal after discount</div>
                        </div>
                      </div>
                      <div className={styles.chargeReadOnly}>
                        ₦{taxAmount.toLocaleString()}
                        <span className={styles.lockIcon}>
                          <span className="mi" style={{ fontSize: '0.8rem' }}>lock</span>
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.chargeTotalBlock}>
                  <div className={styles.chargeSummaryRow}>
                    <span className={styles.chargeSummaryLabel}>Subtotal</span>
                    <span className={styles.chargeSummaryValue}>₦{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className={styles.chargeSummaryRow}>
                      <span className={`${styles.chargeSummaryLabel} ${styles.chargeSummaryLabel_discount}`}>
                        Discount{discountType === 'percent' && rawDiscountInput > 0 ? ` (${rawDiscountInput}%)` : ''}
                      </span>
                      <span className={`${styles.chargeSummaryValue} ${styles.chargeSummaryValue_discount}`}>
                        −₦{discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {shippingAmount > 0 && (
                    <div className={styles.chargeSummaryRow}>
                      <span className={styles.chargeSummaryLabel}>Shipping</span>
                      <span className={styles.chargeSummaryValue}>₦{shippingAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {taxEnabled && taxAmount > 0 && (
                    <div className={styles.chargeSummaryRow}>
                      <span className={styles.chargeSummaryLabel}>Tax ({taxPercentLabel})</span>
                      <span className={styles.chargeSummaryValue}>₦{taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={styles.chargeTotalDivider} />
                  <div className={styles.chargeTotalRow}>
                    <span>Grand Total</span>
                    <span>₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <p className={styles.stepHeading} style={{ marginTop: 24 }}>
            {hasItems ? '4' : '2'}. Final Details
          </p>

          <div className={styles.detailsCard}>
            <label className={styles.fieldLabel}>Order Description</label>
            <input
              type="text"
              className={styles.underlineInput}
              placeholder="e.g. Full Native Set"
              value={orderDesc}
              onChange={e => setOrderDesc(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className={styles.fieldLabel}>Due Date</label>
                <input
                  type="date"
                  className={styles.underlineInput}
                  style={{ marginBottom: 0 }}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.fieldLabel}>Total Qty</label>
                <div className={styles.underlineInput} style={{ borderBottomColor: 'var(--border)', opacity: 0.8 }}>
                  {totalQty}
                </div>
              </div>
            </div>

            <label className={styles.fieldLabel}>Priority</label>
            <div className={styles.priorityChipRow}>
              {['normal', 'urgent', 'vip'].map(p => (
                <button
                  key={p}
                  className={`${styles.priorityChip} ${priority === p ? styles[`priorityChip_${p}`] : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <label className={styles.fieldLabel} style={{ marginTop: 20 }}>Notes</label>
            <textarea
              className={styles.notesTextarea}
              placeholder="Fabric color, styles, etc..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ORDER DETAIL PANEL
// ─────────────────────────────────────────────────────────────

function OrderDetail({ order, measurements, onClose, onDelete, onStatusChange, onStageChange, onGenerateInvoice, onShareReviewLink }) {
  if (!order) return null

  const priorityBanner  = PRIORITY_BANNER_CONFIG[order.priority] ?? PRIORITY_BANNER_CONFIG.normal
  const placedOnDate    = order.takenAt || order.date || formatFirestoreDate(order.createdAt)
  const currentStage    = STAGES.find(s => s.value === order.stage)

  const subtotal        = Number(order.price          || 0)
  const shippingFee     = Number(order.shippingFee    || 0)
  const discountAmount  = Number(order.discountAmount || 0)
  const taxAmount       = Number(order.taxAmount      || 0)
  const taxRate         = Number(order.taxRate        || 0)
  const totalAmount     = Number(order.totalAmount    || subtotal)

  const hasCharges      = shippingFee > 0 || discountAmount > 0 || taxAmount > 0
  const taxPercentLabel = taxRate > 0 ? `${taxRate}%` : null
  const discountLabel   = order.discountType === 'percent' && order.discountValue > 0
    ? `${order.discountValue}% off`
    : null

  return (
    <div className={`${styles.detailPanel} ${styles.detailPanel_open}`}>
      <Header
        type="back"
        title={order.desc}
        onBackClick={onClose}
        customActions={[
          { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
        ]}
      />

      <div className={styles.detailScrollBody}>

        <span className={`${styles.priorityBanner} ${priorityBanner.className}`}>
          {priorityBanner.label}
        </span>

        <div className={styles.infoGrid}>
          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Grand Total</div>
            <div className={styles.infoGridValue}>₦{totalAmount.toLocaleString()}</div>
          </div>
          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Status</div>
            <div className={styles.infoGridValue} style={{ textTransform: 'capitalize' }}>
              {STATUSES.find(s => s.value === order.status)?.label ?? 'Pending'}
            </div>
          </div>
          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Current Stage</div>
            <div className={styles.infoGridValue} style={{ fontSize: '0.85rem' }}>
              {currentStage
                ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="mi" style={{ fontSize: '1rem' }}>{currentStage.icon}</span>
                    {currentStage.label}
                  </span>
                )
                : <span style={{ color: 'var(--text3)', fontWeight: 500, fontSize: '0.8rem' }}>Not set</span>
              }
            </div>
          </div>
          <div className={styles.infoGridCell}>
            <div className={styles.infoGridLabel}>Due</div>
            <div className={styles.infoGridValue} style={{ fontSize: '0.85rem', color: order.due ? 'var(--danger)' : 'var(--text3)' }}>
              {order.due || '—'}
            </div>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionCardLabel}>Selected Garments</div>
            {order.items.map((item, index) => (
              <div key={index} className={styles.garmentRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={styles.garmentThumb}>
                    {item.imgSrc
                      ? <img src={item.imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span className="mi">checkroom</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.name}</div>
                    {item.qty > 1 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600 }}>
                        {item.qty} pcs × ₦{Number(item.price || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)' }}>
                  ₦{((item.qty ?? 1) * Number(item.price || 0)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasCharges && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionCardLabel}>Discount &amp; Charges</div>

            <div className={styles.detailChargeRow}>
              <span className={styles.detailChargeLabel}>Subtotal</span>
              <span className={styles.detailChargeValue}>₦{subtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div className={styles.detailChargeRow}>
                <span className={styles.detailChargeLabel}>
                  <span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: 4 }}>sell</span>
                  Discount{discountLabel ? ` (${discountLabel})` : ''}
                </span>
                <span className={`${styles.detailChargeValue} ${styles.detailChargeValue_discount}`}>
                  −₦{discountAmount.toLocaleString()}
                </span>
              </div>
            )}

            {shippingFee > 0 && (
              <div className={styles.detailChargeRow}>
                <span className={styles.detailChargeLabel}>
                  <span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: 4 }}>local_shipping</span>
                  Shipping
                </span>
                <span className={styles.detailChargeValue}>₦{shippingFee.toLocaleString()}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className={styles.detailChargeRow}>
                <span className={styles.detailChargeLabel}>
                  <span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: 4 }}>receipt</span>
                  Tax {taxPercentLabel && `(${taxPercentLabel} VAT)`}
                </span>
                <span className={styles.detailChargeValue}>₦{taxAmount.toLocaleString()}</span>
              </div>
            )}

            <div className={styles.detailChargeDivider} />

            <div className={styles.detailChargeTotalRow}>
              <span>Grand Total</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {order.notes && (
          <div className={styles.notesCard}>
            <div className={styles.sectionCardLabel}>Notes</div>
            <p>{order.notes}</p>
          </div>
        )}

        <div className={styles.sectionCard} style={{ marginTop: 16 }}>
          <div className={styles.sectionCardLabel}>Change Stage</div>
          <div className={styles.stageChipRow}>
            {STAGES.map(stageItem => (
              <button
                key={stageItem.value}
                className={`${styles.stageChip} ${order.stage === stageItem.value ? styles.stageChip_active : ''}`}
                onClick={() => onStageChange(order.id, order.stage === stageItem.value ? null : stageItem.value)}
              >
                <span className="mi" style={{ fontSize: '0.85rem' }}>{stageItem.icon}</span>
                {stageItem.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionCardLabel}>Change Status</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUSES.map(statusItem => (
              <button
                key={statusItem.value}
                className={`${styles.statusButton} ${order.status === statusItem.value ? styles.statusButton_active : ''}`}
                onClick={() => onStatusChange(order.id, statusItem.value)}
              >
                {statusItem.label}
              </button>
            ))}
          </div>
        </div>

        {(order.status === 'completed' || order.status === 'delivered') && (
          <button
            className={styles.shareReviewButton}
            onClick={() => onShareReviewLink(order)}
          >
            <span className="material-icons" style={{ fontSize: '1.15rem' }}>rate_review</span>
            Share Review Link via WhatsApp
            <span className="material-icons" style={{ fontSize: '1rem', marginLeft: 'auto', color: '#22c55e' }}>open_in_new</span>
          </button>
        )}

        <button
          className={styles.generateInvoiceButton}
          onClick={() => onGenerateInvoice(order.id)}
          style={{ marginTop: 16 }}
        >
          <span className="material-icons" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: 6 }}>receipt_long</span>
          Generate Invoice
        </button>

        <div className={styles.detailFooterDates}>
          Order Taken: {placedOnDate}
          {order.due && <> &nbsp;•&nbsp; Due: {order.due}</>}
          &nbsp;•&nbsp; Qty: {order.qty}
        </div>

      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// MAIN ORDERS TAB
// ─────────────────────────────────────────────────────────────

export default function OrdersTab({ customerId, orders, loading, measurements, showToast, onGenerateInvoice }) {
  const { addOrder, deleteOrder, updateOrderStatus, updateOrderStage } = useOrders()
  const { user } = useAuth()
  const { generalSettings } = useGeneralSettings()

  const taxEnabled = generalSettings.invoiceShowTax ?? false
  const taxRate    = generalSettings.invoiceTaxRate ?? 0

  const [isModalOpen,   setIsModalOpen]   = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderToDelete, setOrderToDelete] = useState(null)

  useEffect(() => {
    const openModal = () => setIsModalOpen(true)
    document.addEventListener('openOrderModal', openModal)
    return () => document.removeEventListener('openOrderModal', openModal)
  }, [])

  async function handleSaveOrder(orderData) {
    try {
      await addOrder(customerId, orderData)
      showToast('Order placed ✓')
    } catch {
      showToast('Failed to place order')
    }
  }

  async function handleDeleteConfirm() {
    if (!orderToDelete) return
    try {
      await deleteOrder(customerId, orderToDelete.id)
      showToast('Order deleted')
    } catch {
      showToast('Failed to delete order')
    }
    setOrderToDelete(null)
    setSelectedOrder(null)
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrderStatus(customerId, orderId, newStatus)
      setSelectedOrder(prev =>
        prev && String(prev.id) === String(orderId) ? { ...prev, status: newStatus } : prev
      )
    } catch {
      showToast('Failed to update status')
    }
  }

  async function handleStageChange(orderId, newStage) {
    try {
      await updateOrderStage(customerId, orderId, newStage)
      const autoStatus = newStage ? STAGE_AUTO_STATUS[newStage] : null
      if (autoStatus) {
        await updateOrderStatus(customerId, orderId, autoStatus)
        setSelectedOrder(prev =>
          prev && String(prev.id) === String(orderId)
            ? { ...prev, stage: newStage, status: autoStatus }
            : prev
        )
      } else {
        setSelectedOrder(prev =>
          prev && String(prev.id) === String(orderId)
            ? { ...prev, stage: newStage }
            : prev
        )
      }
    } catch {
      showToast('Failed to update stage')
    }
  }

  function handleShareReviewLink(order) {
    const reviewToken  = order.reviewToken || crypto.randomUUID()
    const reviewUrl    = `https://tailorflow-62b0a.web.app/review/${user?.uid}/${reviewToken}`
    const customerName = order.customerName || 'there'
    const message = encodeURIComponent(
      `Hi ${customerName}! 🙏 Thank you for your order.\n\n` +
      `We'd love to hear your feedback — it only takes a minute:\n${reviewUrl}\n\n` +
      `Your review means a lot to us! ⭐`
    )
    const rawPhone   = order.customerPhone || ''
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '')
    let waPhone = cleanPhone
    if (cleanPhone.startsWith('+'))      waPhone = cleanPhone.replace('+', '')
    else if (cleanPhone.startsWith('0')) waPhone = `234${cleanPhone.slice(1)}`
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${message}`
      : `https://wa.me/?text=${message}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  // ── Skeleton state ────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.orderGroup}>
        {[1, 2, 3].map(i => <OrderRowSkeleton key={i} />)}
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <>
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>shopping_basket</span>
          <p>No active orders yet.</p>
        </div>

        <OrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          measurements={measurements}
          onSave={handleSaveOrder}
          taxRate={taxRate}
          taxEnabled={taxEnabled}
        />
      </>
    )
  }

  // ── Populated list ────────────────────────────────────────
  const ordersByDate = orders.reduce((groups, order) => {
    const dateKey = order.takenAt || formatFirestoreDate(order.createdAt) || order.date || 'Unknown Date'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(order)
    return groups
  }, {})

  return (
    <>
      {Object.entries(ordersByDate).map(([date, ordersInGroup]) => (
        <div key={date} className={styles.orderGroup}>
          <div className={styles.orderGroupDate}>{date}</div>
          <div className={styles.orderGroupDivider} />

          {ordersInGroup.map((order, index) => {
            const statusInfo    = STATUSES.find(s => s.value === order.status) ?? STATUSES[0]
            const stageInfo     = STAGES.find(s => s.value === order.stage)
            const items         = order.items || []
            const itemCount     = items.length
            const displayPrice  = order.totalAmount != null ? order.totalAmount : order.price
            const priceText     = displayPrice != null ? `₦${Number(displayPrice).toLocaleString()}` : '—'
            const dueDateRaw    = order.dueRaw || order.dueDate
            const isLastInGroup = index === ordersInGroup.length - 1

            return (
              <div
                key={order.id}
                className={`${styles.orderRow} ${isLastInGroup ? styles.orderRow_last : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                <OrderMosaic items={items} />

                <div className={styles.orderRowInfo}>
                  <div className={styles.orderRowDescription}>{order.desc}</div>
                  {itemCount > 0 && (
                    <div className={styles.orderRowMeta}>
                      <span className={styles.orderRowMetaText}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  )}
                  {stageInfo && (
                    <div className={styles.orderRowStage}>
                      <span >{stageInfo.icon}</span>
                      <span >{stageInfo.label}</span>
                    </div>
                  )}
                </div>

                <div className={styles.orderRowRight}>
                  <div className={styles.orderRowPrice}>{priceText}</div>
                  <span className={`${styles.orderStatusBadge} ${styles[`orderStatusBadge_${(order.status || 'pending').replace('-', '_')}`]}`}>
                    {statusInfo.label}
                  </span>
                  {dueDateRaw && (
                    <div className={styles.orderRowDueDate}>
                      Due {formatShortDate(dueDateRaw)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        measurements={measurements}
        onSave={handleSaveOrder}
        taxRate={taxRate}
        taxEnabled={taxEnabled}
      />

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          measurements={measurements}
          onClose={() => setSelectedOrder(null)}
          onDelete={() => setOrderToDelete(selectedOrder)}
          onStatusChange={handleStatusChange}
          onStageChange={handleStageChange}
          onShareReviewLink={handleShareReviewLink}
          onGenerateInvoice={(orderId) => {
            setSelectedOrder(null)
            onGenerateInvoice(orderId)
          }}
        />
      )}

      <ConfirmSheet
        open={!!orderToDelete}
        title="Delete Order?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOrderToDelete(null)}
      />
    </>
  )
}