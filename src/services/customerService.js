// src/services/customerService.js
// ─────────────────────────────────────────────────────────────
// All Firestore calls for customers live here.
// Data path: users/{uid}/customers/{customerId}
//
// Photo storage: Cloudinary URL stored in `data.photo`.
// Legacy documents may contain a base64 string in `photo` —
// the UI renders both transparently via <img src={customer.photo} />.
// ─────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── Path helpers ──────────────────────────────────────────────

function customersRef(uid) {
  return collection(db, 'users', uid, 'customers')
}

function customerDoc(uid, customerId) {
  return doc(db, 'users', uid, 'customers', customerId)
}

// ── Internal guard ────────────────────────────────────────────

/**
 * Throws if `data.photo` is a base64 string.
 * All profile photos must be uploaded to Cloudinary first;
 * the caller should pass the resulting URL as `data.photo`.
 */
function rejectBase64Photo(data) {
  if (typeof data.photo === 'string' && data.photo.startsWith('data:image')) {
    throw new Error(
      '[customerService] base64 profile photos are no longer supported. ' +
      'Upload to Cloudinary first and pass the URL as data.photo.'
    )
  }
}

// ── CRUD ─────────────────────────────────────────────────────

export async function addCustomer(uid, data) {
  rejectBase64Photo(data)
  const ref = await addDoc(customersRef(uid), {
    ...data,
    // Normalise: null if no photo rather than undefined
    photo:     data.photo ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getCustomer(uid, customerId) {
  const snap = await getDoc(customerDoc(uid, customerId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getAllCustomers(uid) {
  const q    = query(customersRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateCustomer(uid, customerId, data) {
  rejectBase64Photo(data)
  await updateDoc(customerDoc(uid, customerId), {
    ...data,
    photo:     data.photo ?? null,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCustomer(uid, customerId) {
  await deleteDoc(customerDoc(uid, customerId))
  // NOTE: Cloudinary deletion from the client requires a signed request.
  // Add a Cloud Function call here later if needed.
}

// ── Real-time listener ────────────────────────────────────────
// Sorted client-side to avoid a Firestore composite index requirement
// (server timestamps are briefly null after addDoc on the optimistic snapshot).

export function subscribeToCustomers(uid, callback, onError) {
  const q = query(customersRef(uid))

  return onSnapshot(
    q,
    (snap) => {
      const customers = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0
          const bTime = b.createdAt?.toMillis?.() ?? 0
          return bTime - aTime
        })
      callback(customers)
    },
    (err) => {
      console.error('[customerService] snapshot error:', err)
      onError?.(err)
    }
  )
}