import { getTotalPaid,capitalise } from "../../utils"
import { formatMoney } from "../../../../../../utils/moneyUtils"
import styles from "./AddInstallmentModal.module.css"


export function AddInstallmentModal({ payment, onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')

  const totalPaid = getTotalPaid(payment.installments)
  const remaining = (parseFloat(payment.orderPrice) || 0) - totalPaid

  function handleSave() {
    if (!amount || parseFloat(amount) <= 0) return
    onSave(parseFloat(amount), method)
    onClose()
  }

  return (
    <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.bottomSheet}>
        <div className={styles.bottomSheetHandle} />
        <div className={styles.bottomSheetHeader}>
          <div className={styles.bottomSheetTitle}>Record Payment</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex' }}>
            <span className="mi" style={{ fontSize: '1.4rem' }}>close</span>
          </button>
        </div>
        <div className={styles.bottomSheetBody}>
          {remaining > 0 && (
            <div className={styles.remainingBalanceBadge}>
              Balance remaining: <strong>{formatMoney(remaining)}</strong>
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Amount Received (₦)</label>
            <input
              type="number"
              className={styles.textInput}
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payment Method</label>
            <div className={styles.methodChipRow}>
              {['cash', 'transfer', 'card', 'other'].map(m => (
                <button
                  key={m}
                  className={`${styles.methodChip} ${method === m ? styles.methodChipActive : ''}`}
                  onClick={() => setMethod(m)}
                >
                  {capitalise(m)}
                </button>
              ))}
            </div>
          </div>
          <button
            className={styles.confirmActionBtn}
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}
