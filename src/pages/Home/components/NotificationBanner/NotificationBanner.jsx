
import styles from "./NotificationBanner.module.css"


export function NotificationBanner({ onEnable, onDismiss }) {
  
  return (
    <div className={styles.NotificationBanner}>

      <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)', flexShrink: 0 }}>notifications</span>
      
      <div className={styles.NotificationBannerText}>

        <div className={styles.NotificationBannerTitle}>Enable Notifications</div>
        <div className={styles.NotificationBannerSub}>Get alerts for orders, invoices &amp; birthdays</div>
      
      </div>

      <div className={styles.NotificationBannerActions}>

        <button className={styles.NotificationBannerEnable} onClick={onEnable}>Allow</button>
        <button className={styles.NotificationBannerDismiss} onClick={onDismiss}>Not now</button>
        
      </div>

    </div>
  )
}
