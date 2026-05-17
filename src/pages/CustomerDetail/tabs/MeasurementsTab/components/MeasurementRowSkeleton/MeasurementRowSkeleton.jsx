
import styles from "./MeasurementRowSkeleton.module.css"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'


export function MeasurementRowSkeleton() {
  return (
    <div className={styles.measurementRow} style={{ pointerEvents: 'none' }}>
      <div className={styles.thumbnailContainer}>
        <Skeleton
          width={58}
          height={58}
          borderRadius={10}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
      </div>
      <div className={styles.measurementRowInfo}>
        <Skeleton
          width={120}
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
        />
      </div>
    </div>
  )
}

