import styles from './ConfirmSheet.module.css'

export default function ConfirmSheet({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) {
  if (!open) return null
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>

      <div className={styles.sheet}>

        <h4>{title}</h4>
        <p>{message}</p>
        <div className={styles.actions}>

          <button className={styles.btnDel} onClick={onConfirm}>Delete</button>
          <button className={styles.btnCancel} onClick={onCancel}>Cancel</button>
          
        </div>

      </div>

    </div>
  )
}
