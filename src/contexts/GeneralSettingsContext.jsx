// src/contexts/GeneralSettingsContext.jsx

import { createContext, useContext, useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// STORAGE KEY
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tailorflow_general_settings'

// ─────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────

export const DEFAULTS = {
  // Appearance
  theme:      'light',
  dateFormat: 'DD/MM/YYYY',

  // Measurements
  measureUnit:   'in',
  measureFormat: 'decimal',

  // Invoices
  invoicePrefix:   'INV',
  invoiceCurrency: '₦',
  invoiceTemplate: 'invoiceTemplate1',
  invoiceDueDays:  7,
  invoiceShowTax:  false,
  invoiceTaxRate:  0,
  invoiceFooter:   'Thank you for your patronage 🙏',

  // Receipts
  receiptPrefix:   'RCP',
  receiptCurrency: '₦',
  receiptTemplate: 'receiptTemplate1',
  receiptShowTax:  false,
  receiptTaxRate:  0,
  receiptFooter:   'Thank you for your patronage 🙏',

  // Orders
  defaultDepositPercent:      50,
  autoArchiveCompletedOrders: false,

  // Notifications
  notifyOverdueTasks:      true,
  notifyUpcomingBirthdays: true,
  notifyUnpaidInvoices:    true,

  // ── Agent ────────────────────────────────────────────────────────────────
  // Master switch
  agentEnabled: false,

  // Auto-generate invoice: drafts an invoice when an order has none
  // after the tailor's chosen timeframe
  agentAutoInvoice:          false,
  agentAutoInvoiceTimeframe: '1day', // '30min' | '1hr' | '6hr' | '1day' | '2days' | 'app_open'

  // Auto-generate receipt: drafts a receipt whenever a payment is recorded
  agentAutoReceipt: false,

  // Birthday messages: drafts a message for customers with upcoming birthdays
  agentBirthdayMessages:   false,
  agentBirthdayNoticeDays: 1, // 0 = on the day, 1 = 1 day before, etc.

  // Follow-up messages: drafts a message for customers inactive for X days
  agentFollowUp:           false,
  agentFollowUpInactivity: '30days', // '14days' | '30days' | '45days' | '60days' | '90days'

  // Payment reminders: drafts a reminder when an invoice is approaching due date
  agentPaymentReminder:     false,
  agentPaymentReminderDays: 1, // 0 = on due date, 1 = 1 day before, etc.

  // Daily brief: summarises what the agent did when the tailor opens the app
  agentDailyBrief: true,
}

// ─────────────────────────────────────────────────────────────
// LOAD FROM LOCALSTORAGE
// ─────────────────────────────────────────────────────────────

function loadGeneralSettings() {
  let saved = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } catch {
    // Corrupted storage — start fresh
  }
  return { ...DEFAULTS, ...saved }
}

// ─────────────────────────────────────────────────────────────
// THEME HELPER
// ─────────────────────────────────────────────────────────────

// How it works:
// CSS variables don't animate — when data-theme flips,
// colors change instantly. To fix this we:
// 1. Inject a <style> that forces background/color transitions on ALL elements
// 2. Apply the new data-theme attribute
// 3. After the transition duration, remove the <style> so normal
//    interaction transitions (hover, active, etc.) are unaffected.

const TRANSITION_DURATION = 350 // ms — matches the style below

function applyTheme(theme, animate = true) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved    = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  if (!animate) {
    document.documentElement.setAttribute('data-theme', resolved)
    return
  }

  const style = document.createElement('style')
  style.id = '__theme-transition__'
  style.textContent = `
    *, *::before, *::after {
      transition:
        background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
        background ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
        border-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
        color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
  `

  document.getElementById('__theme-transition__')?.remove()
  document.head.appendChild(style)

  document.documentElement.setAttribute('data-theme', resolved)

  const timer = setTimeout(() => {
    style.remove()
  }, TRANSITION_DURATION + 50)

  return () => {
    clearTimeout(timer)
    style.remove()
  }
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const GeneralSettingsContext = createContext(null)

export function GeneralSettingsProvider({ children }) {

  const [generalSettings, setGeneralSettings] = useState(loadGeneralSettings)

  // On first mount — apply theme instantly (no animation on page load)
  useEffect(() => {
    applyTheme(generalSettings.theme, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme with animation whenever it changes after mount
  useEffect(() => {
    let cleanup

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved    = generalSettings.theme === 'system'
      ? (prefersDark ? 'dark' : 'light')
      : generalSettings.theme

    const current = document.documentElement.getAttribute('data-theme')

    if (current !== resolved) {
      cleanup = applyTheme(generalSettings.theme, true)
    }

    if (generalSettings.theme !== 'system') return cleanup

    const mq      = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system', true)
    mq.addEventListener('change', handler)
    return () => {
      mq.removeEventListener('change', handler)
      cleanup?.()
    }
  }, [generalSettings.theme])

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generalSettings))
    } catch {
      // Ignore storage quota errors
    }
  }, [generalSettings])

  function updateGeneralSetting(key, value) {
    setGeneralSettings(prev => ({ ...prev, [key]: value }))
  }

  function updateManyGeneralSettings(partial) {
    setGeneralSettings(prev => ({ ...prev, ...partial }))
  }

  function resetGeneralSettings() {
    setGeneralSettings({ ...DEFAULTS })
  }

  return (
    <GeneralSettingsContext.Provider value={{
      generalSettings,
      updateGeneralSetting,
      updateManyGeneralSettings,
      resetGeneralSettings,
    }}>
      {children}
    </GeneralSettingsContext.Provider>
  )
}

export function useGeneralSettings() {
  const ctx = useContext(GeneralSettingsContext)
  if (!ctx) throw new Error('useGeneralSettings must be used inside GeneralSettingsProvider')
  return ctx
}
