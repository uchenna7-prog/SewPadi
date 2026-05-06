import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { saveBrandToFirestore } from '../services/brandService'


const STORAGE_KEY = 'tailorflow_profile_settings'


export const DEFAULTS = {

  brandName:      '',
  brandTagline:   '',
  brandColourId:  'classic-warm-black',
  brandColour: "#1C1814",
  brandLogo:      null, 
  brandPhone:     '',
  brandEmail:     '',
  brandAddress:   '',
  brandWebsite:   '',

  brandFoundedYear:       '',
  brandTurnaround:        '',
  brandServiceArea:       '',
  brandAvailability:      'open',
  brandAvailableUntil:    '',
  brandStyleStatement:    '',
  brandFeaturedTechnique: '',
  brandMilestone:         '',
  brandSocials:           [],

  accountBank:   '',
  accountNumber: '',
  accountName:   '',

}


function loadProfileSettings() {
  let saved = {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } 
  catch {
    
  }

  const profileSettings = { ...DEFAULTS, ...saved }

  if (profileSettings.brandLogo?.startsWith('data:')) {
    profileSettings.brandLogo = null
  }

  if (!profileSettings.brandColourId || profileSettings.brandColourId.startsWith('#')) {
    profileSettings.brandColourId = DEFAULTS.brandColourId
  }

  return profileSettings
}



const ProfileSettingsContext = createContext(null)

export function ProfileSettingsProvider({ children }) {
  
  const { user } = useAuth()
  const [profileSettings, setProfileSettings] = useState(loadProfileSettings)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileSettings))
      localStorage.removeItem('tailorflow_brand_logo') 
    } 
    catch {
      
    }
  }, [profileSettings])


  useEffect(() => {

    if (!user?.uid) return

    const timer = setTimeout(() => {
      saveBrandToFirestore(user.uid, profileSettings).catch()
    }, 1500)

    return () => clearTimeout(timer)
  }, [user?.uid, profileSettings])


  function updateProfileSetting(key, value) {
    setProfileSettings(prev => ({ ...prev, [key]: value }))
  }

  function updateManyProfileSettings(partial) {
    setProfileSettings(prev => ({ ...prev, ...partial }))
  }

  function resetProfileSettings() {
    setProfileSettings({ ...DEFAULTS })
  }

  return (
    <ProfileSettingsContext.Provider value={
      { 
      profileSettings, 
      updateProfileSetting, 
      updateManyProfileSettings, 
      resetProfileSettings 
      }
    }>
      {children}
    </ProfileSettingsContext.Provider>
  )
}

export function useProfileSettings() {
  const ctx = useContext(ProfileSettingsContext)
  if (!ctx) throw new Error('useProfileSettings must be used inside ProfileSettingsProvider')
  return ctx
}
