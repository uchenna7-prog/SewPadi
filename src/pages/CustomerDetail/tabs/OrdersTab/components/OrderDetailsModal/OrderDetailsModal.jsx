import styles from './OrderDetailsModal.module.css'
import { ORDER_STAGES, ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, PRIORITY_BANNER_CONFIG } from '../../../../../../datas/orderDatas'
import { formatFirestoreDate } from '../../utils'
import Header from '../../../../../../components/Header/Header'


export function OrderDetailsModal({
  order,
  measurements,
  onClose,
  onDelete,
  onStatusChange,
  onStageChange,
  onGenerateInvoice,
  onShareReviewLink,
}) {

  if (!order) return null

  const priorityBanner  = PRIORITY_BANNER_CONFIG[order.priority] ?? PRIORITY_BANNER_CONFIG.normal
  const placedOnDate    = order.takenAt || order.date || formatFirestoreDate(order.createdAt)
  const currentStage    = ORDER_STAGES.find(s => s.value === order.stage)

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

  const statusKey   = order.status || 'pending'
  const statusLabel = ORDER_STATUS_LABELS[statusKey] ?? ORDER_STATUS_LABELS.pending

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

        <span className={`${styles.priorityBanner} ${styles[priorityBanner.className]}`}>
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
              {statusLabel}
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
            {ORDER_STAGES.map(stageItem => (
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
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <button
                key={value}
                className={`${styles.statusButton} ${order.status === value ? styles.statusButton_active : ''}`}
                onClick={() => onStatusChange(order.id, value)}
              >
                {label}
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