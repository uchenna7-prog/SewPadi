export function EditCustomerModal({ customer, onSave, onClose }) {

  const [form, setForm] = useState({
    name:     customer.name     || '',
    phone:    customer.phone    || '',
    email:    customer.email    || '',
    address:  customer.address  || '',
    birthday: customer.birthday || '',
    sex:      customer.sex      || '',
    notes:    customer.notes    || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) return
    setSaving(true)
    try { 
      await onSave(form); 
      onClose() 
    }
    finally { 
      setSaving(false) 
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalSheet}>
        <div className={styles.modalHeader}>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            <span className="mi">close</span>
          </button>
          <span className={styles.modalTitle}>Edit Customer</span>
          <button
            className={styles.modalSaveBtn}
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.phone.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Full Name *</label>
            <input className={styles.modalInput} value={form.name} onChange={set('name')} placeholder="Customer name" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Phone Number *</label>
            <input className={styles.modalInput} value={form.phone} onChange={set('phone')} placeholder="Phone number" type="tel" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Gender</label>
            <div className={styles.modalSexRow}>
              {['Male', 'Female'].map(option => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.modalSexChip} ${form.sex === option ? styles.modalSexChipActive : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, sex: prev.sex === option ? '' : option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Email Address</label>
            <input className={styles.modalInput} value={form.email} onChange={set('email')} placeholder="Email (optional)" type="email" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Birthday</label>
            <input className={styles.modalInput} value={form.birthday} onChange={set('birthday')} placeholder="MM-DD" maxLength={5} />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Address</label>
            <input className={styles.modalInput} value={form.address} onChange={set('address')} placeholder="Address (optional)" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Notes</label>
            <textarea className={`${styles.modalInput} ${styles.modalTextarea}`} value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" rows={3} />
          </div>
        </div>
      </div>
    </div>
  )
}