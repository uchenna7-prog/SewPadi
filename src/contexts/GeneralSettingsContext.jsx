import { createContext, useContext, useState, useEffect } from 'react'


const STORAGE_KEY        = 'sewpadi_general_settings'
const THEME_TRANSITION_MS = 350

export const DEFAULTS = {
  theme:      'light',
  dateFormat: 'DD/MM/YYYY',

  measureUnit:   'in',
  measureFormat: 'decimal',

  invoicePrefix:   'INV',
  invoiceCurrency: '₦',
  invoiceTemplate: 'invoiceTemplate1',
  invoiceDueDays:  7,
  invoiceShowTax:  false,
  invoiceTaxRate:  0,
  invoiceFooter:   'Thank you for your patronage 🙏',

  receiptPrefix:   'RCP',
  receiptCurrency: '₦',
  receiptTemplate: 'receiptTemplate1',
  receiptShowTax:  false,
  receiptTaxRate:  0,
  receiptFooter:   'Thank you for your patronage 🙏',

  defaultDepositPercent:      50,
  autoArchiveCompletedOrders: false,

  notifyOverdueTasks:      true,
  notifyUpcomingBirthdays: true,
  notifyUnpaidInvoices:    true,

  agentEnabled: false,

  agentAutoInvoice:          false,
  agentAutoInvoiceTimeframe: '1day',

  agentAutoReceipt: false,

  agentBirthdayMessages:   false,
  agentBirthdayNoticeDays: 1,

  agentFollowUp:           false,
  agentFollowUpInactivity: '30days',

  agentPaymentReminder:     false,
  agentPaymentReminderDays: 1,

  agentDailyBrief: true,
}


function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {
    return { ...DEFAULTS }
  }
  return { ...DEFAULTS }
}

function saveToLocalStorage(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

function resolveTheme(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme, animated) {
  const resolvedTheme = resolveTheme(theme)

  if (!animated) {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    return
  }

  const existingStyle = document.getElementById('__theme-transition__')
  existingStyle?.remove()

  const transitionStyle = document.createElement('style')
  transitionStyle.id = '__theme-transition__'
  transitionStyle.textContent = `
    *, *::before, *::after {
      transition:
        background-color ${THEME_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
        background       ${THEME_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
        border-color     ${THEME_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
        color            ${THEME_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow       ${THEME_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
  `

  document.head.appendChild(transitionStyle)
  document.documentElement.setAttribute('data-theme', resolvedTheme)

  const removalTimer = setTimeout(() => transitionStyle.remove(), THEME_TRANSITION_MS + 50)

  return () => {
    clearTimeout(removalTimer)
    transitionStyle.remove()
  }
}


const GeneralSettingsContext = createContext(null)

export function GeneralSettingsProvider({ children }) {

  const [settings, setSettings] = useState(loadFromLocalStorage)

  useEffect(() => {
    applyTheme(settings.theme, false)
  }, [])

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const resolvedTheme = resolveTheme(settings.theme)

    let cleanup
    if (currentTheme !== resolvedTheme) {
      cleanup = applyTheme(settings.theme, true)
    }

    if (settings.theme !== 'system') return cleanup

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => applyTheme('system', true)
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      cleanup?.()
    }
  }, [settings.theme])

  useEffect(() => {
    saveToLocalStorage(settings)
  }, [settings])


  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function updateManySettings(partial) {
    setSettings(prev => ({ ...prev, ...partial }))
  }

  function resetSettings() {
    setSettings({ ...DEFAULTS })
  }

  return (
    <GeneralSettingsContext.Provider value={{
      generalSettings:          settings,
      updateGeneralSetting:     updateSetting,
      updateManyGeneralSettings: updateManySettings,
      resetGeneralSettings:     resetSettings,
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