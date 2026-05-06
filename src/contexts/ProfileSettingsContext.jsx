// src/contexts/ProfileSettingsContext.jsx

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { saveBrandToFirestore } from '../services/brandService'

// ─────────────────────────────────────────────────────────────
// STORAGE KEY
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tailorflow_profile_settings'

// ─────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────

export const DEFAULTS = {
  // Brand identity
  brandName:     '',
  brandTagline:  '',
  brandColourId: 'classic-warm-black',
  brandColour:   '#1C1814',
  brandLogo:     null,   // Firebase Storage URL or null

  // Business contact
  brandPhone:   '',
  brandEmail:   '',
  brandAddress: '',
  brandWebsite: '',

  // Business info
  brandFoundedYear:       '',
  brandTurnaround:        '',
  brandServiceArea:       '',
  brandAvailability:      'open',
  brandAvailableUntil:    '',
  brandStyleStatement:    '',
  brandFeaturedTechnique: '',
  brandMilestone:         '',
  brandSocials:           [],
  brandSignature:         null,   // Firebase Storage URL or null
  brandPaymentTerms:      '',

  // Account / payment details
  accountBank:   '',
  accountNumber: '',
  accountName:   '',
}

// ─────────────────────────────────────────────────────────────
// LOAD FROM LOCALSTORAGE
// ─────────────────────────────────────────────────────────────

function loadProfileSettings() {
  let saved = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } catch {
    // Corrupted storage — start fresh
  }

  const profileSettings = { ...DEFAULTS, ...saved }

  // Migration: base64 logos are no longer supported — only Firebase Storage URLs
  if (profileSettings.brandLogo?.startsWith('data:')) {
    profileSettings.brandLogo = null
  }

  // Migration: base64 signatures are no longer supported — only Firebase Storage URLs
  if (profileSettings.brandSignature?.startsWith('data:')) {
    profileSettings.brandSignature = null
  }

  // Migration: brandColourId must be a palette ID, not a raw hex
  if (!profileSettings.brandColourId || profileSettings.brandColourId.startsWith('#')) {
    profileSettings.brandColourId = DEFAULTS.brandColourId
  }

  return profileSettings
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const ProfileSettingsContext = createContext(null)

export function ProfileSettingsProvider({ children }) {
  const { user } = useAuth()
  const [profileSettings, setProfileSettings] = useState(loadProfileSettings)

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileSettings))
      localStorage.removeItem('tailorflow_brand_logo') // clean up old key
    } catch {
      // Ignore storage quota errors
    }
  }, [profileSettings])

  // Sync brand fields to Firestore, debounced 1.5s to avoid hammering on every keystroke
  useEffect(() => {
    if (!user?.uid) return
    const timer = setTimeout(() => {
      saveBrandToFirestore(user.uid, profileSettings).catch(console.error)
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
    <ProfileSettingsContext.Provider value={{
      profileSettings,
      updateProfileSetting,
      updateManyProfileSettings,
      resetProfileSettings,
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