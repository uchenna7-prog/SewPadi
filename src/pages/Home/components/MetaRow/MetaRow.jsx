import styles from "./MetaRow.module.css"


export function MetaRow({ icon, text, textStyle }) {
  return (
    <div className={styles.listMeta}>
      <span className="mi" style={{ fontSize: '0.78rem', color: 'var(--text3)', verticalAlign: 'middle' }}>
        {icon}
      </span>
      <span className={styles.listMetaText}>{text}</span>
    </div>
  )
}