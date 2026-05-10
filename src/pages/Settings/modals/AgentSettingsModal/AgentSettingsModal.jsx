// src/pages/Settings/modals/AgentSettingsModal/AgentSettingsModal.jsx

import { useState, useEffect } from 'react'
import { useGeneralSettings } from '../../../../contexts/GeneralSettingsContext'
import styles from './AgentSettingsModal.module.css'

// ── Timeframe options ─────────────────────────────────────────────────────────

const TIMEFRAME_OPTIONS = [
  { value: '30min',    label: '30 minutes' },
  { value: '1hr',      label: '1 hour'     },
  { value: '6hr',      label: '6 hours'    },
  { value: '1day',     label: '1 day'      },
  { value: '2days',    label: '2 days'     },
  { value: 'app_open', label: 'Next app open' },
]

const INACTIVITY_OPTIONS = [
  { value: '14days',  label: '14 days'  },
  { value: '30days',  label: '30 days'  },
  { value: '45days',  label: '45 days'  },
  { value: '60days',  label: '2 months' },
  { value: '90days',  label: '3 months' },
]

const BIRTHDAY_NOTICE_OPTIONS = [
  { value: 0, label: 'On the day'    },
  { value: 1, label: '1 day before'  },
  { value: 2, label: '2 days before' },
  { value: 3, label: '3 days before' },
]

const REMINDER_DAYS_OPTIONS = [
  { value: 1, label: '1 day before due'  },
  { value: 2, label: '2 days before due' },
  { value: 3, label: '3 days before due' },
  { value: 0, label: 'On the due date'   },
]

// ── Sub-components ────────────────────────────────────────────────────────────

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

function SelectPill({ options, value, onChange }) {
  return (
    <div className={styles.pillRow}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.pill} ${value === opt.value ? styles.pillActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

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
    agentBirthdayNoticeDays:   generalSettings.agentBirthdayNoticeDays,
    agentFollowUp:             generalSettings.agentFollowUp,
    agentFollowUpInactivity:   generalSettings.agentFollowUpInactivity,
    agentPaymentReminder:      generalSettings.agentPaymentReminder,
    agentPaymentReminderDays:  generalSettings.agentPaymentReminderDays,
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

        {/* Dim overlay hint when master is off */}
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
            <SelectPill
              options={TIMEFRAME_OPTIONS}
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
            <FieldLabel>Prepare draft</FieldLabel>
            <SelectPill
              options={BIRTHDAY_NOTICE_OPTIONS}
              value={local.agentBirthdayNoticeDays}
              onChange={v => set('agentBirthdayNoticeDays', v)}
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
            <SelectPill
              options={INACTIVITY_OPTIONS}
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
            <FieldLabel>Draft reminder</FieldLabel>
            <SelectPill
              options={REMINDER_DAYS_OPTIONS}
              value={local.agentPaymentReminderDays}
              onChange={v => set('agentPaymentReminderDays', v)}
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
          <p>The agent only drafts — it never sends anything. You stay in full control of all messages, invoices, and receipts.</p>
        </div>

        <div style={{ height: 32 }} />
      </div>

      {/* ── Save button ── */}
      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={handleSave}>
          Save
        </button>
      </div>

    </div>
  )
}
