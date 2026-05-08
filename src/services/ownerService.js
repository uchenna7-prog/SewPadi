// src/services/ownerService.js

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Save the tailor/owner's personal info to Firestore.
 * Path: users/{uid}/profile/personal
 */
export async function saveOwnerToFirestore(uid, owner) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'profile', 'personal')
  await setDoc(ref, {
    fullName:   owner.fullName   || '',
    email:      owner.email      || '',
    phone:      owner.phone      || '',
    city:       owner.city       || '',
    country:    owner.country    || '',
    sex:        owner.sex        || '',
    birthMonth: owner.birthMonth || '',
    birthDay:   owner.birthDay   || '',
    updatedAt:  serverTimestamp(),
  }, { merge: true })
}

/**
 * Load the tailor/owner's personal info from Firestore.
 * Returns null if not found or on error.
 */
export async function loadOwnerFromFirestore(uid) {
  if (!uid) return null
  try {
    const ref  = doc(db, 'users', uid, 'profile', 'personal')
    const snap = await getDoc(ref)
    if (snap.exists()) return snap.data()
    return null
  } catch (err) {
    console.error('[ownerService] loadOwnerFromFirestore failed:', err)
    return null
  }
}
