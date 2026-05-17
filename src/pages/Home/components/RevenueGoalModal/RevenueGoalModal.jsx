import styles from "./RevenueGoalModal.module.css"


export function RevenueGoalModal({ onSave, onClose }) {

  const [period, setPeriod] = useState('monthly')
  const [goalInput, setGoalInput] = useState('')
  const [currency, setCurrency] = useState('₦')

  const handleSave = () => {

    const amount = Number(goalInput.replace(/,/g, ''))
    if (!amount || amount <= 0) return
    onSave({ period, goal: amount, currency })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>

      <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>

        <div className={styles.modalHandle} />

        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Set Revenue Goal</h2>
          <p className={styles.modalSub}>Choose your tracking period and target amount</p>
        </div>

        <div className={styles.modalSection}>

          <div className={styles.modalSectionLabel}>Track by</div>

          <div className={styles.periodTabs}>
            {['weekly','monthly','yearly'].map(p => (
              <button key={p}
                className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
                onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

        </div>

        <div className={styles.modalSection}>

          <div className={styles.modalSectionLabel}>Revenue target</div>

          <div className={styles.goalInputRow}>

            <select className={styles.currencySelect} value={currency} onChange={e => setCurrency(e.target.value)}>

              <option value="₦">₦ NGN</option>
              <option value="$">$ USD</option>
              <option value="£">£ GBP</option>
              <option value="€">€ EUR</option>

            </select>
            <input className={styles.goalInput} type="number" placeholder="e.g. 500000"
              value={goalInput} onChange={e => setGoalInput(e.target.value)} min="1" />

          </div>

        </div>

        <div className={styles.periodHint}>
          {period === 'weekly'  && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>date_range</span>Resets every Monday</>}
          {period === 'monthly' && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>calendar_month</span>Resets on the 1st of each month</>}
          {period === 'yearly'  && <><span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: '5px' }}>event_repeat</span>Resets on January 1st each year</>}
        </div>

        <button className={styles.modalSaveBtn} onClick={handleSave}
          disabled={!goalInput || Number(goalInput) <= 0}>Save Goal</button>
        <button className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
        
      </div>
    </div>
  )
}
