// src/services/brandService.js

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL }      from 'firebase/storage'
import { db, storage }                           from '../firebase'
import { DEFAULT_COLOUR_ID }                     from '../config/brandPalette'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function brandDocRef(uid) {
  return doc(db, 'users', uid, 'publicProfile', 'brand')
}

// ─────────────────────────────────────────────────────────────
// Logo — Firebase Storage
// ─────────────────────────────────────────────────────────────

/**
 * Upload a logo file to Firebase Storage and return its public download URL.
 *
 * Storage path: users/{uid}/brandLogo
 * Must match the path used in Profile.jsx → BrandModal → handleLogoChange.
 *
 * The caller saves the returned URL via updateSetting('brandLogo', url),
 * which propagates it to localStorage and Firestore automatically.
 *
 * @param {File}   file - The image file selected by the user.
 * @param {string} uid  - The authenticated user's UID.
 * @returns {Promise<string>} Resolves with the public download URL.
 */
export async function uploadBrandLogo(file, uid) {
  if (!file || !uid) throw new Error('uploadBrandLogo: file and uid are required')

  const logoRef = ref(storage, `users/${uid}/brandLogo`)
  await uploadBytes(logoRef, file)
  return getDownloadURL(logoRef)
}

// ─────────────────────────────────────────────────────────────
// Brand — Firestore
// ─────────────────────────────────────────────────────────────

/**
 * Persist all brand settings to Firestore, including the logo URL.
 * Called automatically by SettingsContext 1.5 s after any setting changes.
 *
 * @param {string} uid      - The authenticated user's UID.
 * @param {object} settings - Full settings object from SettingsContext.
 */
export async function saveBrandToFirestore(uid, settings) {
  if (!uid) return

  await setDoc(brandDocRef(uid), {
    // ── Visual identity ──
    brandName:      settings.brandName      || '',
    brandTagline:   settings.brandTagline   || '',
    brandColourId:  settings.brandColourId  || DEFAULT_COLOUR_ID,
    brandColour:    settings.brandColour    || '#D4AF37',
    brandLogo:      settings.brandLogo      || null,   // ← Firebase Storage URL

    // ── Contact ──
    brandPhone:     settings.brandPhone     || '',
    brandEmail:     settings.brandEmail     || '',
    brandAddress:   settings.brandAddress   || '',
    brandWebsite:   settings.brandWebsite   || '',

    // ── Business info ──
    brandFoundedYear:       settings.brandFoundedYear       || '',
    brandTurnaround:        settings.brandTurnaround        || '',
    brandServiceArea:       settings.brandServiceArea       || '',
    brandAvailability:      settings.brandAvailability      || 'open',
    brandAvailableUntil:    settings.brandAvailableUntil    || '',
    brandStyleStatement:    settings.brandStyleStatement    || '',
    brandFeaturedTechnique: settings.brandFeaturedTechnique || '',
    brandMilestone:         settings.brandMilestone         || '',
    brandSocials:           settings.brandSocials           || [],

    updatedAt: serverTimestamp(),
  })
}

/**
 * Read brand settings from Firestore.
 * Used by the public Portfolio page (unauthenticated access).
 *
 * @param {string} uid - The tailor's UID (from the public portfolio URL).
 * @returns {Promise<object|null>} Brand data or null if not found.
 */
export async function getBrandFromFirestore(uid) {
  if (!uid) return null
  const snap = await getDoc(brandDocRef(uid))
  return snap.exists() ? snap.data() : null
}