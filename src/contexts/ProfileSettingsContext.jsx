import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  saveBrandDataToFirestore,
  getBrandDataFromFirestore,
  savePersonalInfosToFirestore,
  getPersonalInfosFromFirestore,
} from '../services/profileService'


const STORAGE_KEY = 'sewpadi_profile_settings'

export const DEFAULTS = {
  personalFullName:   '',
  personalEmail:      '',
  personalPhone:      '',
  personalCity:       '',
  personalCountry:    '',
  personalSex:        '',
  personalBirthMonth: '',
  personalBirthDay:   '',

  brandName:     '',
  brandTagline:  '',
  brandColourId: 'classic-warm-black',
  brandColour:   '#1C1814',
  brandLogo:     null,

  brandPhone:   '',
  brandEmail:   '',
  brandAddress: '',
  brandWebsite: '',

  brandFoundedYear:       '',
  brandTurnaround:        '',
  brandServiceArea:       '',
  brandAvailability:      'open',
  brandAvailableUntil:    '',
  brandStyleStatement:    '',
  brandFeaturedTechnique: '',
  brandMilestone:         '',
  brandSocials:           [],
  brandSignature:         null,
  brandPaymentTerms:      '',

  accountBank:   '',
  accountNumber: '',
  accountName:   '',
}


function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {
    return null
  }
  return null
}

function saveToLocalStorage(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore quota errors
  }
}


const ProfileSettingsContext = createContext(null)

export function ProfileSettingsProvider({ children }) {

  const { user } = useAuth()

  const cachedSettings              = loadFromLocalStorage()
  const [settings, setSettings]     = useState(cachedSettings ?? { ...DEFAULTS })
  const [isLoading, setIsLoading]   = useState(!cachedSettings)
  const hasLoadedFromFirestore      = useRef(false)


  useEffect(() => {
    if (!user?.uid) return

    if (loadFromLocalStorage()) {
      hasLoadedFromFirestore.current = true
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadFromFirestore() {
      try {
        const [brandData, personalData] = await Promise.all([
          getBrandDataFromFirestore(user.uid),
          getPersonalInfosFromFirestore(user.uid),
        ])
        if (cancelled) return

        const merged = { ...DEFAULTS, ...personalData, ...brandData }
        setSettings(merged)
        saveToLocalStorage(merged)
      } finally {
        if (!cancelled) {
          hasLoadedFromFirestore.current = true
          setIsLoading(false)
        }
      }
    }

    loadFromFirestore()
    return () => { cancelled = true }
  }, [user?.uid])


  useEffect(() => {
    if (!hasLoadedFromFirestore.current) return
    saveToLocalStorage(settings)
  }, [settings])


  useEffect(() => {
    if (!hasLoadedFromFirestore.current) return
    if (!user?.uid) return

    const debounceTimer = setTimeout(() => {
      saveBrandDataToFirestore(user.uid, settings).catch(() => {})
      savePersonalInfosToFirestore(user.uid, settings).catch(() => {})
    }, 1500)

    return () => clearTimeout(debounceTimer)
  }, [user?.uid, settings])


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
    <ProfileSettingsContext.Provider value={{
      profileSettings: settings,
      isLoading,
      updateProfileSetting:      updateSetting,
      updateManyProfileSettings: updateManySettings,
      resetProfileSettings:      resetSettings,
    }}>
      {children}
    </ProfileSettingsContext.Provider>
  )
}

export function useProfileSettings() {
  const ctx = useContext(ProfileSettingsContext)
  if (!ctx) throw new Error('useProfileSettings must be used inside ProfileSettingsProvider')
  return ctx
}