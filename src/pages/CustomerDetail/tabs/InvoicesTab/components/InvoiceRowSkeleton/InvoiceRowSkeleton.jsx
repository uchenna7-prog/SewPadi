import styles from "./InvoiceRowSkeleton.module.css"
import 'react-loading-skeleton/dist/skeleton.css'
import Skeleton from 'react-loading-skeleton'


export function InvoiceRowSkeleton() {
  return (
    <div className={styles.invoiceRow} style={{ pointerEvents: 'none' }}>

      <Skeleton
        width={68}
        height={68}
        borderRadius={12}
        baseColor="var(--surface2)"
        highlightColor="var(--border)"
      />

      <div className={styles.invoiceRowInfo}>
        <Skeleton
          width={130}
          height={14}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
          style={{ marginBottom: 6 }}
        />
        <Skeleton
          width={70}
          height={11}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
      </div>

      <div className={styles.invoiceRowRight} style={{ alignItems: 'flex-end', gap: 6 }}>
        <Skeleton
          width={72}
          height={20}
          borderRadius={20}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
        <Skeleton
          width={60}
          height={14}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
      </div>
    </div>
  )
}
