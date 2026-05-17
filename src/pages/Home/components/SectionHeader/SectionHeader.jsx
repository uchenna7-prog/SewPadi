
import styles from "./SectionHeader.module.css"

export function SectionHeader({ title, onSeeAll }) {
  return (
    <div className={styles.sectionHeader}>

      <h3 className={styles.sectionTitle}>{title}</h3>
      {onSeeAll && (
        <button className={styles.seeAllBtn} onClick={onSeeAll}>See all</button>
      )}

    </div>
  )
}