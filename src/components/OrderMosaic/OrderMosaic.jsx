// src/components/OrderMosaic/OrderMosaic.jsx

import styles from './OrderMosaic.module.css'

/**
 * OrderMosaic
 *
 * Reusable mosaic thumbnail for an order's items.
 *
 * Props:
 *  items     — array of order item objects ({ imgSrc, name, ... })
 *  size      — 'md' (default, 80×80 outer / 58×58 inner) | 'sm' (56×56 / 40×40)
 *  overdue   — bool: tints border/bg red and shows alarm icon when no images
 *  className — optional extra class on the outer wrapper
 */
export default function OrderMosaic({ items = [], size = 'md', overdue = false, className = '' }) {
  const covers     = items.map(i => i.imgSrc ?? null).filter(Boolean)
  const total      = items.length
  const hasImages  = covers.length > 0

  const outerCls = [
    styles.outer,
    styles[`outer_${size}`],
    overdue ? styles.outer_overdue : '',
    className,
  ].filter(Boolean).join(' ')

  const innerCls = [
    styles.inner,
    styles[`inner_${size}`],
  ].join(' ')

  /* ── No images ── */
  if (!hasImages) {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <span className="mi" style={{ fontSize: size === 'sm' ? '1rem' : '1.3rem', color: overdue ? '#ef4444' : 'var(--text3)' }}>
            {overdue ? 'alarm_on' : 'content_cut'}
          </span>
        </div>
      </div>
    )
  }

  /* ── Single image ── */
  if (total === 1) {
    return (
      <div className={outerCls}>
        <div className={innerCls}>
          <img src={covers[0]} alt="" className={styles.singleImg} />
        </div>
      </div>
    )
  }

  /* ── Two items ── */
  if (total === 2) {
    return (
      <div className={outerCls}>
        <div className={`${innerCls} ${styles.splitInner}`}>
          <div className={styles.left}>
            <img src={covers[0]} alt="" className={styles.panelImg} />
          </div>
          <div className={styles.dividerV} />
          <div className={styles.right}>
            <div className={styles.cell}>
              {covers[1]
                ? <img src={covers[1]} alt="" className={styles.panelImg} />
                : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Three or more ── */
  const extra = total > 3 ? total - 3 : 0
  return (
    <div className={outerCls}>
      <div className={`${innerCls} ${styles.splitInner}`}>
        <div className={styles.left}>
          {covers[0]
            ? <img src={covers[0]} alt="" className={styles.panelImg} />
            : <span className="mi" style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>checkroom</span>
          }
        </div>
        <div className={styles.dividerV} />
        <div className={styles.right}>
          <div className={styles.cell}>
            {covers[1]
              ? <img src={covers[1]} alt="" className={styles.panelImg} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
          </div>
          <div className={styles.dividerH} />
          <div className={`${styles.cell} ${extra > 0 ? styles.cellOverlay : ''}`}>
            {covers[2]
              ? <img src={covers[2]} alt="" className={styles.panelImg} />
              : <span className="mi" style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>checkroom</span>
            }
            {extra > 0 && <div className={styles.overlay}>+{extra}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}