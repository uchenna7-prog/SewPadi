
export function DeleteConfirmModal({ customer, onConfirm, onCancel }) {
  
  if (!customer) return null
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.deleteSheet}>
        <div className={styles.deleteIconWrap}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--danger)' }}>person_remove</span>
        </div>
        <h4 className={styles.deleteTitle}>Remove This Customer?</h4>
        <p className={styles.deleteMessage}>
          You're about to permanently remove <strong>{customer.name}</strong> from your customer list.
          This action cannot be undone — all their details will be lost forever.
        </p>
        <p className={styles.deleteWarning}>Are you absolutely sure you want to continue?</p>
        <div className={styles.deleteActions}>
          <button className={styles.deleteCancelBtn} onClick={onCancel}>No, Keep Customer</button>
          <button className={styles.deleteConfirmBtn} onClick={onConfirm}>
            <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 6 }}>delete_forever</span>
            Yes, Delete Customer
          </button>
        </div>
      </div>
    </div>
  )
}

