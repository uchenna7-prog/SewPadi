

import { SectionHeader } from "../SectionHeader/SectionHeader"
import { StatusPill } from "../StatusPill/StatusPill"
import { MetaRow } from "../MetaRow/MetaRow"
import { formatDateShort } from "../../utils"
import { ORDER_STAGES } from "../../../../datas/orderDatas"
import OrderMosaic from "../../../../components/OrderMosaic/OrderMosaic"
import styles from "./RecentOrdersSection.module.css"


export function RecentOrdersSection({ orders, onSeeAll, onSelectOrder}) {
  return (
    <section className={styles.section}>
      <SectionHeader title="Recent Orders" onSeeAll={onSeeAll} />
      <div className={styles.listSection}>
        <div className={styles.listDivider} />
        {orders.map((order, index) => {
          const isLast     = index === orders.length - 1
          const priceLabel = order.price != null ? `₦${Number(order.price).toLocaleString()}` : '—'
          const stageObj   = ORDER_STAGES.find(s => s.value === order.stage)
          const dueDateStr = order.dueRaw || order.dueDate
          const dueDateLabel = dueDateStr ? `Due ${formatDateShort(dueDateStr)}`
                             : order.due  ? `Due ${order.due}`
                             : null

          return (
            <div
              key={order.id}
              className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}
              onClick={() => onSelectOrder(order)}
            >
              <OrderMosaic items={order.items || []} />
              <div className={styles.listInfo}>
                <div className={styles.listDesc}>{order.desc ?? 'Order'}</div>
                <MetaRow icon="person" text={order.customerName || '—'}  />
                {stageObj && (
                  <div className={styles.listStageLine}>
                    <span className="mi" style={{ fontSize: '0.78rem' }}>{stageObj.icon}</span>
                    {stageObj.label}
                  </div>
                )}
              </div>
              <div className={styles.listRight}>
                <div className={styles.listPrice}>{priceLabel}</div>
                {order.qty > 1 && <div className={styles.listQty}>{order.qty} items</div>}
                <StatusPill status={order.status} />
                {dueDateLabel && <div className={styles.listDueRight}>{dueDateLabel}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
