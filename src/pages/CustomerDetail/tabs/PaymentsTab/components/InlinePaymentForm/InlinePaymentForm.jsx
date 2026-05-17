
import { useState } from 'react'
import { resolvePaymentStatus,getTodayLabel,getTimeLabel,capitalise } from "../../utils"
import { formatMoney,getCurrency } from "../../../../../../utils/moneyUtils"
import styles from "./InlinePaymentForm.module.css"


export function InlinePaymentForm({ order, onSave, saving }) {
  const [paymentType, setPaymentType] = useState('full')
  const [amount,      setAmount]      = useState('')
  const [method,      setMethod]      = useState('cash')
  const [notes,       setNotes]       = useState('')
  const currency = getCurrency()

  const fullPrice = parseFloat(order?.totalAmount ?? order?.price) || 0

  function handleAmountChange(value) {
    setAmount(value)
    if (fullPrice > 0) {
      const entered = parseFloat(value) || 0
      setPaymentType(entered > 0 && entered < fullPrice ? 'part' : 'full')
    }
  }

  function handleSave() {
    if (!amount || saving) return
    const finalStatus = resolvePaymentStatus(amount, fullPrice, paymentType)
    onSave({
      orderId:      order.id,
      orderDesc:    order.desc,
      orderPrice:   order.totalAmount ?? order.price ?? null,
      orderItems:   order.items ?? [],
      status:       finalStatus,
      notes:        notes.trim(),
      installments: [{ amount: parseFloat(amount), method, date: getTodayLabel(), time: getTimeLabel(), id: Date.now() }],
      date:         getTodayLabel(),
    })
  }

  return (
    <div className={styles.inlineFormCard}>

      {fullPrice > 0 && (
        <div className={styles.inlineOrderTotal}>
          <span className={styles.inlineOrderTotalLabel}>Order value</span>
          <span className={styles.inlineOrderTotalValue}>{formatMoney(currency, fullPrice)}</span>
        </div>
      )}

      <label className={styles.fieldLabel}>Payment Type</label>
      <div className={styles.chipRow} style={{ marginBottom: 20 }}>
        <button
          className={`${styles.typeChip} ${paymentType === 'full' ? styles.typeChipActive : ''}`}
          style={paymentType === 'full' ? { borderColor: '#22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.12)' } : {}}
          onClick={() => setPaymentType('full')}
        >
          Full Payment
        </button>
        <button
          className={`${styles.typeChip} ${paymentType === 'part' ? styles.typeChipActive : ''}`}
          style={paymentType === 'part' ? { borderColor: '#fb923c', color: '#fb923c', background: 'rgba(251,146,60,0.12)' } : {}}
          onClick={() => setPaymentType('part')}
        >
          Part Payment
        </button>
      </div>

      <label className={styles.fieldLabel}>
        {paymentType === 'part' ? 'Amount Paid (₦)' : 'Amount (₦)'}
      </label>
      <input
        type="number"
        className={styles.textInput}
        placeholder={fullPrice > 0 ? `of ${formatMoney(currency, fullPrice)}` : '0.00'}
        inputMode="decimal"
        value={amount}
        onChange={e => handleAmountChange(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <label className={styles.fieldLabel}>Payment Method</label>
      <div className={styles.methodChipRow} style={{ marginBottom: 20 }}>
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

      <label className={styles.fieldLabel}>
        Notes <span className={styles.fieldLabelOptional}>(optional)</span>
      </label>
      <textarea
        className={styles.textareaInput}
        placeholder="Any extra details…"
        value={notes}
        rows={2}
        onChange={e => setNotes(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <div className={styles.inlineFormDivider} />

      <button
        className={styles.inlineSaveButton}
        onClick={handleSave}
        disabled={!amount || saving}
      >
        {saving
          ? <><div className={styles.inlineSpinner} />Saving…</>
          : <><span className="material-icons" style={{ fontSize: '1.1rem' }}>payments</span>Record Payment</>
        }
      </button>
    </div>
  )
}