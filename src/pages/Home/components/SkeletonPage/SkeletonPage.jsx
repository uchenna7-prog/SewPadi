import styles from "./SkeletonPage.module.css"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'


export function SkeletonPage() {
  return (
    <div className={styles.skeletonPage}>
      <div className={styles.skHero}>
        <Skeleton width={80}  height={12} borderRadius={4} />
        <Skeleton width={160} height={32} borderRadius={6} style={{ marginTop: 6 }} />
        <Skeleton width={240} height={11} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width={100} height={10} borderRadius={4} style={{ marginTop: 6, opacity: 0.5 }} />
      </div>
      <div className={styles.skeletonStatsGrid}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={styles.skeletonStatCard}>
            <Skeleton width={24} height={24} borderRadius={4} />
            <Skeleton width={48} height={28} borderRadius={5} style={{ marginTop: 12 }} />
            <Skeleton width={72} height={10} borderRadius={4} style={{ marginTop: 8 }} />
            <Skeleton width={56} height={9}  borderRadius={4} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
      <div className={styles.skeletonFullCard}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width={90}  height={10} borderRadius={4} />
          <Skeleton width={130} height={28} borderRadius={5} />
          <Skeleton width={80}  height={10} borderRadius={4} />
        </div>
        <Skeleton width={88} height={88} circle />
      </div>
      <div className={styles.skeletonFullCard} style={{ flexDirection: 'column', gap: 12 }}>
        <Skeleton width={110} height={10} borderRadius={4} />
        <Skeleton width={80}  height={36} borderRadius={5} />
        <Skeleton height={1} borderRadius={0} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width={80} height={11} borderRadius={4} />
          <Skeleton width={60} height={11} borderRadius={4} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width={90} height={11} borderRadius={4} />
          <Skeleton width={24} height={11} borderRadius={4} />
        </div>
      </div>
      {[0, 1].map(s => (
        <div key={s} className={styles.skeletonSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Skeleton width={140} height={11} borderRadius={4} />
            <Skeleton width={44}  height={11} borderRadius={4} />
          </div>
          <Skeleton height={1} borderRadius={0} style={{ width: 'calc(100% + 40px)', marginLeft: -20 }} />
          {[0, 1, 2].map(i => (
            <div key={i} className={styles.skeletonListItem}>
              <Skeleton width={80} height={80} borderRadius={12} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Skeleton width="70%" height={13} borderRadius={4} />
                <Skeleton width="50%" height={10} borderRadius={4} />
                <Skeleton width="60%" height={10} borderRadius={4} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
