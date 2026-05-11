import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useProfileSettings } from './ProfileSettingsContext'
import { useGeneralSettings } from './GeneralSettingsContext'
import { DEFAULT_COLOUR_ID } from '../config/brandPalette'


// ─────────────────────────────────────────────────────────────
// Personal info loader (mirrors Profile.jsx)
// ─────────────────────────────────────────────────────────────

const PERSONAL_KEY = 'sewpadi_personal'

function loadPersonal() {
  try {
    const raw = localStorage.getItem(PERSONAL_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}


const BrandContext = createContext(null)

export function BrandProvider({ children }) {


  const { profileSettings } = useProfileSettings()
  const { generalSettings } = useGeneralSettings()
  const [personal, setPersonal] = useState(loadPersonal)

  // Re-read personal info whenever the window gains focus
  // or when localStorage changes (e.g. saved from Profile modal)
  useEffect(() => {

    const refresh = () => setPersonal(loadPersonal())
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const refreshPersonal = useCallback(() => setPersonal(loadPersonal()), [])


  const brand = {

    name:       profileSettings.brandName     || '',
    tagline:    profileSettings.brandTagline  || '',
    colourId:   profileSettings.brandColourId || DEFAULT_COLOUR_ID,  
    colour:     profileSettings.brandColour   || '#1C1814',
    logo:       profileSettings.brandLogo     || null,
    phone:      profileSettings.brandPhone    || '',
    email:      profileSettings.brandEmail    || '',
    address:    profileSettings.brandAddress  || '',
    website:    profileSettings.brandWebsite  || '',


    foundedYear:       profileSettings.brandFoundedYear       || '',
    turnaround:        profileSettings.brandTurnaround        || '',
    serviceArea:       profileSettings.brandServiceArea       || '',
    availability:      profileSettings.brandAvailability      || 'open',
    availableUntil:    profileSettings.brandAvailableUntil    || '',
    styleStatement:    profileSettings.brandStyleStatement    || '',
    featuredTechnique: profileSettings.brandFeaturedTechnique || '',
    milestone:         profileSettings.brandMilestone         || '',
    socials:           profileSettings.brandSocials           || [],
    signature:         profileSettings.brandSignature         || null,
    paymentTerms:      profileSettings.brandPaymentTerms      || '',


    accountBank:   profileSettings.accountBank   || '',
    accountNumber: profileSettings.accountNumber || '',
    accountName:   profileSettings.accountName   || '',


    ownerName:       personal.fullName   || '',
    ownerEmail:      personal.email      || '',
    ownerPhone:      personal.phone      || '',
    ownerCity:       personal.city       || '',
    ownerCountry:    personal.country    || '',
    ownerSex:        personal.sex        || '',
    ownerBirthMonth: personal.birthMonth || '',
    ownerBirthDay:   personal.birthDay   || '',


    invoiceCurrency:   generalSettings.invoiceCurrency || '₦',
    invoicePrefix:     generalSettings.invoicePrefix   || 'INV',
    invoiceDueDays:    generalSettings.invoiceDueDays  || 7,
    invoiceShowTax:    generalSettings.invoiceShowTax  || false,
    invoiceTaxRate:    generalSettings.invoiceTaxRate  || 0,
    invoiceFooter:     generalSettings.invoiceFooter   || 'Thank you for your patronage 🙏',
    invoiceTemplate:   generalSettings.invoiceTemplate || 'invoiceTemplate1',

    receiptCurrency:   generalSettings.receiptCurrency || '₦',
    receiptPrefix:     generalSettings.receiptPrefix   || 'RCP',
    receiptShowTax:    generalSettings.receiptShowTax  || false,
    receiptTaxRate:    generalSettings.receiptTaxRate  || 0,
    receiptFooter:     generalSettings.receiptFooter   || 'Thank you for your patronage 🙏',
    receiptTemplate:   generalSettings.receiptTemplate || 'receiptTemplate1',
  

  }

  return (
    <BrandContext.Provider value={{ brand, personal, refreshPersonal }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used inside BrandProvider')
  return ctx
}