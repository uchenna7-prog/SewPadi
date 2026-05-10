import { useState, useRef } from 'react'
import { useGeneralSettings } from '../../contexts/GeneralSettingsContext'
import { useBrand } from '../../contexts/BrandContext'

import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import BottomNav from '../../components/BottomNav/BottomNav'

import { Toggle } from './components/Toggle/Toggle'
import { SettingRow } from './components/SettingRow/SettingRow'
import { SectionHeader } from './components/SectionHeader/SectionHeader'

import { TemplateModal } from './modals/TemplateModal/TemplateModal'
import { ReceiptSettingsModal } from './modals/ReceiptSettingsModal/ReceiptSettingsModal'
import { InvoiceSettingsModal } from './modals/InvoiceSettingsModal/InvoiceSettingsModal'
import { AgentSettingsModal } from './modals/AgentSettingsModal/AgentSettingsModal'

import styles from './Settings.module.css'


export default function Settings({ onMenuClick }) {
  const { generalSettings, updateGeneralSetting, updateManyGeneralSettings, resetGeneralSettings } = useGeneralSettings()
  const { brand } = useBrand()

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef(null)

  function showToast(message) {
    setToastMessage(message)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2400)
  }

  // ── Modal visibility ───────────────────────────────────────────────────────
  const [isTemplateModalOpen,     setIsTemplateModalOpen]     = useState(false)
  const [isInvoiceModalOpen,      setIsInvoiceModalOpen]      = useState(false)
  const [isReceiptModalOpen,      setIsReceiptModalOpen]      = useState(false)
  const [isAgentModalOpen,        setIsAgentModalOpen]        = useState(false)

  // ── Confirm sheet visibility ───────────────────────────────────────────────
  const [isClearDataConfirmOpen,      setIsClearDataConfirmOpen]      = useState(false)
  const [isResetSettingsConfirmOpen,  setIsResetSettingsConfirmOpen]  = useState(false)

  // ── Derived values ─────────────────────────────────────────────────────────
  const isDarkMode = generalSettings.theme === 'dark'

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleTemplateSelect(selectedTemplates) {
    updateManyGeneralSettings({
      invoiceTemplate: selectedTemplates.invoiceTemplate,
      receiptTemplate: selectedTemplates.receiptTemplate,
    })
    showToast('Template selected')
  }

  function handleClearAllData() {
    localStorage.clear()
    setIsClearDataConfirmOpen(false)
    showToast('Cleared')
  }

  function handleResetAllSettings() {
    resetGeneralSettings()
    setIsResetSettingsConfirmOpen(false)
    showToast('Settings reset')
  }

  function getSelectedTemplates() {
    const invoiceTemplate = generalSettings.invoiceTemplate
    const receiptTemplate = generalSettings.receiptTemplate
    const invoiceTemplateNumber = invoiceTemplate.replace('invoiceTemplate', '')
    const receiptTemplateNumber = receiptTemplate.replace('receiptTemplate', '')
    if (invoiceTemplateNumber === receiptTemplateNumber) {
      return 'Templates ' + (receiptTemplateNumber || invoiceTemplateNumber)
    }
    return ''
  }

  function getAgentSub() {
    if (!generalSettings.agentEnabled) return 'Off'
    const active = [
      generalSettings.agentAutoInvoice      && 'Invoices',
      generalSettings.agentAutoReceipt      && 'Receipts',
      generalSettings.agentBirthdayMessages && 'Birthdays',
      generalSettings.agentFollowUp         && 'Follow-ups',
      generalSettings.agentPaymentReminder  && 'Reminders',
      generalSettings.agentDailyBrief       && 'Daily brief',
    ].filter(Boolean)
    if (active.length === 0) return 'On — no tasks enabled'
    return 'On · ' + active.join(', ')
  }

  return (
    <div className={styles.settingsPage}>

      <Header onMenuClick={onMenuClick} />

      <div className={styles.settingsScrollArea}>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <SectionHeader icon="palette" label="Appearance" />

        <SettingRow
          icon="dark_mode"
          label="Dark Mode"
          sub={isDarkMode ? 'Dark theme active' : 'Light theme active'}
        >
          <Toggle
            value={isDarkMode}
            onChange={isOn => updateGeneralSetting('theme', isOn ? 'dark' : 'light')}
          />
        </SettingRow>

        {/* ── Invoice & Receipt ────────────────────────────────────────────── */}
        <SectionHeader icon="receipt_long" label="Invoice & Receipt" />

        <SettingRow
          icon="tune"
          label="Invoice Settings"
          sub={`${generalSettings.invoiceCurrency} · ${generalSettings.invoicePrefix} · Due ${generalSettings.invoiceDueDays}d`}
          onClick={() => setIsInvoiceModalOpen(true)}
          chevron
        />

        <SettingRow
          icon="request_quote"
          label="Receipt Settings"
          sub="Prefix, footer text and receipt defaults"
          onClick={() => setIsReceiptModalOpen(true)}
          chevron
        />

        <SettingRow
          icon="description"
          label="Templates"
          sub="Choose your preferred invoice and receipt designs"
          value={getSelectedTemplates()}
          onClick={() => setIsTemplateModalOpen(true)}
          chevron
        />

        {/* ── Agent ───────────────────────────────────────────────────────── */}
        <SectionHeader icon="smart_toy" label="Agent" />

        <SettingRow
          icon="smart_toy"
          label="Agent Settings"
          sub={getAgentSub()}
          onClick={() => setIsAgentModalOpen(true)}
          chevron
        />

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <SectionHeader icon="notifications" label="Notifications" />

        <SettingRow
          icon="alarm"
          label="Overdue Tasks"
          sub="Alert when tasks pass their due date"
        >
          <Toggle
            value={generalSettings.notifyOverdueTasks}
            onChange={isOn => updateGeneralSetting('notifyOverdueTasks', isOn)}
          />
        </SettingRow>

        <SettingRow
          icon="cake"
          label="Customer Birthdays"
          sub="Remind you a day before"
        >
          <Toggle
            value={generalSettings.notifyUpcomingBirthdays}
            onChange={isOn => updateGeneralSetting('notifyUpcomingBirthdays', isOn)}
          />
        </SettingRow>

        <SettingRow
          icon="money_off"
          label="Unpaid Invoices"
          sub="Alert for invoices past due date"
        >
          <Toggle
            value={generalSettings.notifyUnpaidInvoices}
            onChange={isOn => updateGeneralSetting('notifyUnpaidInvoices', isOn)}
          />
        </SettingRow>

        {/* ── Data ─────────────────────────────────────────────────────────── */}
        <SectionHeader icon="storage" label="Data" />

        <SettingRow
          icon="restart_alt"
          label="Reset All Settings"
          sub="Restore defaults. Your customers and orders are safe."
          onClick={() => setIsResetSettingsConfirmOpen(true)}
          chevron
          danger
        />

        <SettingRow
          icon="delete_forever"
          label="Clear All Data"
          sub="Permanently delete everything"
          onClick={() => setIsClearDataConfirmOpen(true)}
          chevron
          divider={false}
          danger
        />

        <div style={{ height: 32 }} />

      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      <TemplateModal
        isOpen={isTemplateModalOpen}
        currentInvoiceTemplate={generalSettings.invoiceTemplate || 'invoiceTemplate1'}
        currentReceiptTemplate={generalSettings.receiptTemplate || 'receiptTemplate1'}
        colourId={brand.colourId}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={handleTemplateSelect}
      />

      {isInvoiceModalOpen && (
        <InvoiceSettingsModal
          onBack={() => setIsInvoiceModalOpen(false)}
          showToast={showToast}
        />
      )}

      {isReceiptModalOpen && (
        <ReceiptSettingsModal
          onBack={() => setIsReceiptModalOpen(false)}
          showToast={showToast}
        />
      )}

      {isAgentModalOpen && (
        <AgentSettingsModal
          onBack={() => setIsAgentModalOpen(false)}
          showToast={showToast}
        />
      )}

      {/* ── Confirm Sheets ────────────────────────────────────────────────── */}
      <ConfirmSheet
        open={isClearDataConfirmOpen}
        title="Delete All Data?"
        onConfirm={handleClearAllData}
        onCancel={() => setIsClearDataConfirmOpen(false)}
      />

      <ConfirmSheet
        open={isResetSettingsConfirmOpen}
        title="Reset All Settings?"
        onConfirm={handleResetAllSettings}
        onCancel={() => setIsResetSettingsConfirmOpen(false)}
      />

      <Toast message={toastMessage} />
      <BottomNav />

    </div>
  )
}
