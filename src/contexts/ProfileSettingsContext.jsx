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

// ─────────────────────────────────────────────────────────────
// SANITISE — strip invalid values after loading from storage
// ─────────────────────────────────────────────────────────────

function sanitise(settings) {
  const out = { ...DEFAULTS, ...settings }

  // Drop base64 blobs — too large for localStorage and stale after reload
  if (out.brandLogo?.startsWith('data:'))      out.brandLogo      = null
  if (out.brandSignature?.startsWith('data:')) out.brandSignature = null

  // Legacy colour IDs stored as hex strings
  if (!out.brandColourId || out.brandColourId.startsWith('#')) {
    out.brandColourId = DEFAULTS.brandColourId
  }

  return out
}

// ─────────────────────────────────────────────────────────────
// LOAD FROM LOCALSTORAGE (synchronous — safe for useState init)
// ─────────────────────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return sanitise(JSON.parse(raw))
  } catch {
    // Corrupted storage — fall through to defaults
  }
  return null // null signals "nothing in storage yet"
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const ProfileSettingsContext = createContext(null)

export function ProfileSettingsProvider({ children }) {
  const { user } = useAuth()

  // Start from localStorage if it exists; otherwise wait for Firestore
  const [profileSettings, setProfileSettings] = useState(() => loadFromStorage() ?? { ...DEFAULTS })
  const [isLoading, setIsLoading] = useState(!loadFromStorage())

  // Track whether this is the very first render so the save effect doesn't
  // fire before we've finished loading data from Firestore.
  const isInitialised = useRef(false)

  // ── 1. LOAD ────────────────────────────────────────────────
  // Runs once when the user is available.
  // If localStorage already had data we skip Firestore on boot (fast path).
  useEffect(() => {
    if (!user?.uid) return

    const cached = loadFromStorage()
    if (cached) {
      // Already hydrated from storage — mark ready immediately
      isInitialised.current = true
      setIsLoading(false)
      return
    }

    // Nothing cached — fetch from Firestore
    let cancelled = false

    async function fetchFromFirestore() {
      try {
        const [brand, personal] = await Promise.all([
          getBrandDataFromFirestore(user.uid),
          getPersonalInfosFromFirestore(user.uid),
        ])

        if (cancelled) return

        const merged = sanitise({ ...personal, ...brand })
        setProfileSettings(merged)

        // Persist to localStorage so next boot is instant
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        } catch {
          // Quota exceeded — carry on without caching
        }
      } catch (err) {
        if (!cancelled) return
      } finally {
        if (!cancelled) {
          isInitialised.current = true
          setIsLoading(false)
        }
      }
    }

    fetchFromFirestore()
    return () => { cancelled = true }
  }, [user?.uid]) // ← only re-run if the logged-in user changes

  // ── 2. PERSIST TO LOCALSTORAGE ────────────────────────────
  // Runs on every settings change, but not before init is complete.
  useEffect(() => {
    if (!isInitialised.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileSettings))
    } catch {
      // Ignore quota errors
    }
  }, [profileSettings])

  // ── 3. SYNC TO FIRESTORE (debounced) ──────────────────────
  // Waits 1.5 s after the last change before writing — avoids hammering
  // Firestore on every keystroke.
  useEffect(() => {
    if (!isInitialised.current) return
    if (!user?.uid) return

    const timer = setTimeout(() => {
      // Split into the two service calls that mirror your data shape
      saveBrandDataToFirestore(user.uid, profileSettings).catch(
        
      )
      savePersonalInfosToFirestore(user.uid, profileSettings).catch(
        
      )
    }, 1500)

    return () => clearTimeout(timer)
  }, [user?.uid, profileSettings])

  // ── UPDATERS ──────────────────────────────────────────────

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
      isLoading,
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