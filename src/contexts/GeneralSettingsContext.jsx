import { createContext, useContext, useState, useEffect } from 'react'
import { saveBrandToFirestore } from '../services/brandService'


const STORAGE_KEY = 'tailorflow_general_settings'


export const DEFAULTS = {

    theme:      'light',
    dateFormat: 'DD/MM/YYYY',

    invoicePrefix:    'INV',
    invoiceCurrency:  '₦',
    invoiceTemplate:  'invoiceTemplate1',
    invoiceDueDays:   7,
    invoiceShowTax:   false,
    invoiceTaxRate:   0,
    invoiceFooter:    'Thank you for your patronage 🙏',

    receiptPrefix:    'RCP',
    receiptCurrency:  '₦',
    receiptTemplate:  'receiptTemplate1',
    receiptTemplate:  'receiptTemplate1',
    receiptShowTax:   false,
    receiptTaxRate:   0,
    receiptFooter:    'Thank you for your patronage 🙏',


    notifyOverdueTasks:       true,
    notifyUpcomingBirthdays:  true,
    notifyUnpaidInvoices:     true,
}


function loadGeneralSettings() {

  let saved = {}

    try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
    } 
    catch {
    
    }

    const generalSettings = { ...DEFAULTS, ...saved }


  return generalSettings
}


function applyTheme(theme) {

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved    = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  document.documentElement.setAttribute('data-theme', resolved)
}


const GeneralSettingsContext = createContext(null)

export function GeneralSettingsProvider({ children }) {

  const [generalSettings, setGeneralSettings] = useState(loadGeneralSettings)


  useEffect(() => {

    applyTheme(generalSettings.theme)

    if (generalSettings.theme !== 'system') return
    const mq      = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [generalSettings.theme])


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
    <GeneralSettingsContext.Provider value={
        { 
            generalSettings, 
            updateGeneralSetting, 
            updateManyGeneralSettings, 
            resetGeneralSettings 
        }
        }>
      {children}
    </GeneralSettingsContext.Provider>
  )
}

export function useGeneralSettings() {
  const ctx = useContext(GeneralSettingsContext)
  if (!ctx) throw new Error('useGeneralSettings must be used inside GeneralSettingsProvider')
  return ctx
}
