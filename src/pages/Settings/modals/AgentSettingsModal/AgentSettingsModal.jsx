// src/pages/Settings/modals/AgentSettingsModal/AgentSettingsModal.jsx

import { useState } from 'react'
import { useGeneralSettings } from '../../../../contexts/GeneralSettingsContext'
import styles from './AgentSettingsModal.module.css'

// ── Duration units ────────────────────────────────────────────────────────────
// Each unit has a min/max so the input stays sensible

const UNITS = [
  { value: 'seconds', label: 'seconds', singular: 'second', min: 10,  max: 59  },
  { value: 'minutes', label: 'minutes', singular: 'minute', min: 1,   max: 59  },
  { value: 'hours',   label: 'hours',   singular: 'hour',   min: 1,   max: 23  },
  { value: 'days',    label: 'days',    singular: 'day',    min: 1,   max: 30  },
  { value: 'weeks',   label: 'weeks',   singular: 'week',   min: 1,   max: 12  },
  { value: 'months',  label: 'months',  singular: 'month',  min: 1,   max: 12  },
]

function unitMeta(unitValue) {
  return UNITS.find(u => u.value === unitValue) || UNITS[3]
}

// ── DurationInput ─────────────────────────────────────────────────────────────
// value: { amount: number, unit: string }
// onChange: (newValue) => void

function DurationInput({ value, onChange }) {
  const meta = unitMeta(value.unit)

  function handleAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') { onChange({ ...value, amount: '' }); return }
    const n = Math.min(Math.max(parseInt(raw, 10), meta.min), meta.max)
    onChange({ ...value, amount: n })
  }

  function handleAmountBlur() {
    // Snap to min if left empty
    if (value.amount === '' || value.amount < meta.min) {
      onChange({ ...value, amount: meta.min })
    }
  }

  function handleUnitChange(e) {
    const newMeta = unitMeta(e.target.value)
    // Clamp current amount into new unit's range
    const clamped = Math.min(Math.max(Number(value.amount) || newMeta.min, newMeta.min), newMeta.max)
    onChange({ amount: clamped, unit: e.target.value })
  }

  const displayUnit = Number(value.amount) === 1 ? meta.singular : meta.label

  return (
    <div className={styles.durationRow}>
      {/* Number input */}
      <div className={styles.durationAmountWrap}>
        <input
          type="number"
          inputMode="numeric"
          className={styles.durationAmount}
          value={value.amount}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
          min={meta.min}
          max={meta.max}
        />
      </div>

      {/* Unit selector */}
      <div className={styles.durationUnitWrap}>
        <select
          className={styles.durationUnit}
          value={value.unit}
          onChange={handleUnitChange}
        >
          {UNITS.map(u => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
        <span className="material-icons" style={{ fontSize: 16, color: 'var(--text3)', pointerEvents: 'none' }}>
          expand_more
        </span>
      </div>

      {/* Live preview label */}
      <span className={styles.durationPreview}>
        {value.amount || meta.min} {displayUnit}
      </span>
    </div>
  )
}

// ── AgentToggle ───────────────────────────────────────────────────────────────

function AgentToggle({ value, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

// ── FeatureBlock ──────────────────────────────────────────────────────────────

function FeatureBlock({ icon, title, sub, enabled, onToggle, children }) {
  return (
    <div className={`${styles.featureBlock} ${!enabled ? styles.featureBlockOff : ''}`}>
      <div className={styles.featureTop}>
        <div className={styles.featureLeft}>
          <div className={styles.featureIconWrap}>
            <span className="material-icons" style={{ fontSize: 18 }}>{icon}</span>
          </div>
          <div>
            <p className={styles.featureTitle}>{title}</p>
            <p className={styles.featureSub}>{sub}</p>
          </div>
        </div>
        <AgentToggle value={enabled} onChange={onToggle} />
      </div>
      {enabled && children && (
        <div className={styles.featureBody}>{children}</div>
      )}
    </div>
  )
}

function FieldLabel({ children }) {
  return <p className={styles.fieldLabel}>{children}</p>
}

// ── Main component ────────────────────────────────────────────────────────────

export function AgentSettingsModal({ onBack, showToast }) {
  const { generalSettings, updateManyGeneralSettings } = useGeneralSettings()

  const [local, setLocal] = useState({
    agentEnabled:              generalSettings.agentEnabled,
    agentAutoInvoice:          generalSettings.agentAutoInvoice,
    agentAutoInvoiceTimeframe: generalSettings.agentAutoInvoiceTimeframe,
    agentAutoReceipt:          generalSettings.agentAutoReceipt,
    agentBirthdayMessages:     generalSettings.agentBirthdayMessages,
    agentBirthdayNotice:       generalSettings.agentBirthdayNotice,
    agentFollowUp:             generalSettings.agentFollowUp,
    agentFollowUpInactivity:   generalSettings.agentFollowUpInactivity,
    agentPaymentReminder:      generalSettings.agentPaymentReminder,
    agentPaymentReminderBefore: generalSettings.agentPaymentReminderBefore,
    agentDailyBrief:           generalSettings.agentDailyBrief,
  })

  function set(key, value) {
    setLocal(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    updateManyGeneralSettings(local)
    showToast('Agent settings saved')
    onBack()
  }

  const masterOff = !local.agentEnabled

  return (
    <div className={styles.modal}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <span className="material-icons" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
        <span className={styles.headerTitle}>Agent Settings</span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Scroll area ── */}
      <div className={styles.scrollArea}>

        {/* Master toggle card */}
        <div className={styles.masterCard}>
          <div className={styles.masterLeft}>
            <div className={styles.masterIconRing}>
              <span className="material-icons" style={{ fontSize: 22 }}>smart_toy</span>
              {local.agentEnabled && <span className={styles.masterPulse} />}
            </div>
            <div>
              <p className={styles.masterTitle}>Agent</p>
              <p className={styles.masterSub}>
                {local.agentEnabled
                  ? 'Active — working in the background'
                  : 'Off — no autonomous actions'}
              </p>
            </div>
          </div>
          <AgentToggle
            value={local.agentEnabled}
            onChange={v => set('agentEnabled', v)}
          />
        </div>

        {masterOff && (
          <p className={styles.disabledHint}>
            <span className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>info</span>
            Turn the agent on to configure what it can do.
          </p>
        )}

        {/* ── Features ── */}
        <div className={`${styles.featureList} ${masterOff ? styles.featureListDimmed : ''}`}>

          {/* Auto Invoice */}
          <FeatureBlock
            icon="receipt_long"
            title="Auto-generate invoices"
            sub="Drafts invoices for orders that have none"
            enabled={local.agentAutoInvoice}
            onToggle={v => set('agentAutoInvoice', v)}
          >
            <FieldLabel>Act after order has been uninvoiced for</FieldLabel>
            <DurationInput
              value={local.agentAutoInvoiceTimeframe}
              onChange={v => set('agentAutoInvoiceTimeframe', v)}
            />
          </FeatureBlock>

          {/* Auto Receipt */}
          <FeatureBlock
            icon="payments"
            title="Auto-generate receipts"
            sub="Drafts receipts whenever a payment is recorded"
            enabled={local.agentAutoReceipt}
            onToggle={v => set('agentAutoReceipt', v)}
          />

          {/* Birthday messages */}
          <FeatureBlock
            icon="cake"
            title="Birthday messages"
            sub="Drafts a message for customers with upcoming birthdays"
            enabled={local.agentBirthdayMessages}
            onToggle={v => set('agentBirthdayMessages', v)}
          >
            <FieldLabel>Prepare draft this long before the birthday</FieldLabel>
            <DurationInput
              value={local.agentBirthdayNotice}
              onChange={v => set('agentBirthdayNotice', v)}
            />
          </FeatureBlock>

          {/* Follow-up messages */}
          <FeatureBlock
            icon="person_search"
            title="Follow-up messages"
            sub="Drafts a message for customers who haven't ordered in a while"
            enabled={local.agentFollowUp}
            onToggle={v => set('agentFollowUp', v)}
          >
            <FieldLabel>Draft follow-up after customer is inactive for</FieldLabel>
            <DurationInput
              value={local.agentFollowUpInactivity}
              onChange={v => set('agentFollowUpInactivity', v)}
            />
          </FeatureBlock>

          {/* Payment reminders */}
          <FeatureBlock
            icon="notification_important"
            title="Payment reminders"
            sub="Drafts a reminder when an invoice is approaching its due date"
            enabled={local.agentPaymentReminder}
            onToggle={v => set('agentPaymentReminder', v)}
          >
            <FieldLabel>Draft reminder this long before the due date</FieldLabel>
            <DurationInput
              value={local.agentPaymentReminderBefore}
              onChange={v => set('agentPaymentReminderBefore', v)}
            />
          </FeatureBlock>

          {/* Daily brief */}
          <FeatureBlock
            icon="summarize"
            title="Daily brief"
            sub="Summarises everything the agent did when you open the app"
            enabled={local.agentDailyBrief}
            onToggle={v => set('agentDailyBrief', v)}
          />

        </div>

        {/* Draft-only notice */}
        <div className={styles.notice}>
          <span className="material-icons" style={{ fontSize: 15, flexShrink: 0 }}>lock</span>
          <p>The agent only drafts — it never sends anything. You stay in full control.</p>
        </div>

        <div style={{ height: 32 }} />
      </div>

      {/* ── Save ── */}
      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
      </div>

    </div>
  )
}
