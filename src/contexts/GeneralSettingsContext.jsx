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

function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved    = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  document.documentElement.setAttribute('data-theme', resolved)
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const GeneralSettingsContext = createContext(null)

export function GeneralSettingsProvider({ children }) {
  const [generalSettings, setGeneralSettings] = useState(loadGeneralSettings)

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(generalSettings.theme)

    if (generalSettings.theme !== 'system') return
    const mq      = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
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