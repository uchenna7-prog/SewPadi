import { useState } from "react"
import { getTodayReadable } from "../../utils"
import Header from "../../../../../../components/Header/Header"
import styles from "./AddOrderModal.module.css"


const VISIBLE_MEASUREMENT_LIMIT = 3


export function AddOrderModal({ isOpen, onClose, measurements, onSave, taxRate, taxEnabled }) {

  const [selectedItems, setSelectedItems] = useState([])
  const [clothSearchText, setClothSearchText] = useState('')
  const [orderDesc, setOrderDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')
  const [pricingError, setPricingError] = useState('')
  const [shippingFee, setShippingFee] = useState('')
  const [discountValue, setDiscountValue] = useState('')
  const [discountType, setDiscountType] = useState('fixed')

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

    const itemId = String(measurement.id)
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

  const shippingAmount = parseFloat(shippingFee) || 0
  const rawDiscountInput = parseFloat(discountValue) || 0
  const discountAmount  = discountType === 'percent'
    ? Math.round(subtotal * (Math.min(rawDiscountInput, 100) / 100) * 100) / 100
    : Math.min(rawDiscountInput, subtotal)
  const discountedSubtotal = subtotal - discountAmount
  const taxMultiplier = taxEnabled ? (taxRate / 100) : 0
  const taxAmount = Math.round(discountedSubtotal * taxMultiplier * 100) / 100
  const grandTotal = discountedSubtotal + shippingAmount + taxAmount

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
      desc: orderDesc.trim() || (hasItems ? selectedItems.map(i => i.name).join(', ') : 'New Order'),
      price: subtotal,
      items: selectedItems.map(item => ({
        id:     item.id,
        name:   item.name,
        imgSrc: item.imgSrc || null,
        price:  parseFloat(item.price) || 0,
        qty:    parseInt(item.qty, 10) || 1,
      })),
      qty: totalQty,
      due: dueDateDisplay,
      dueRaw: dueDate,
      notes: notes.trim(),
      priority,
      measurementIds: selectedItems.map(i => i.id),
      status: 'pending',
      stage: null,
      takenAt: getTodayReadable(),
      shippingFee: shippingAmount,
      discountType: discountAmount > 0 ? discountType : null,
      discountValue: discountAmount > 0 ? rawDiscountInput : 0,
      discountAmount: discountAmount,
      taxRate: taxEnabled ? taxRate : 0,
      taxAmount: taxAmount,
      totalAmount: grandTotal,
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
