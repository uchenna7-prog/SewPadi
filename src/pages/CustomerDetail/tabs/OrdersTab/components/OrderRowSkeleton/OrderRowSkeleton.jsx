import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import styles from "./OrderRowSkeleton.module.css"


export function OrderRowSkeleton() {
  return (
    <div className={styles.orderRow} style={{ pointerEvents: 'none' }}>
    
      <Skeleton
        width={80}
        height={80}
        borderRadius={12}
        baseColor="var(--surface2)"
        highlightColor="var(--border)"
      />

      <div className={styles.orderRowInfo}>
        <Skeleton
          width={140}
          height={14}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
          style={{ marginBottom: 6 }}
        />
        <Skeleton
          width={80}
          height={11}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
          style={{ marginBottom: 6 }}
        />
        <Skeleton
          width={60}
          height={11}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
      </div>

      <div className={styles.orderRowRight} style={{ alignItems: 'flex-end', gap: 6 }}>
        <Skeleton
          width={70}
          height={14}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
        <Skeleton
          width={60}
          height={20}
          borderRadius={20}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
      </div>
    </div>
  )
}
