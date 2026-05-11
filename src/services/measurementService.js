// ─────────────────────────────────────────────────────────────
// Data path: users/{uid}/customers/{customerId}/measurements/{id}
// Measurements live as a subcollection under each customer.
//
// Image storage: Cloudinary (storageUrl per image, stored in imgSrcs[]).
// Legacy documents may contain base64 in imgSrcs[] or imgSrc — the UI
// renders both transparently via measurement.imgSrcs?.[0] ?? measurement.imgSrc.
// ─────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function measurementsRef(uid, customerId) {
  return collection(db, 'users', uid, 'customers', customerId, 'measurements')
}

function measurementDoc(uid, customerId, measurementId) {
  return doc(db, 'users', uid, 'customers', customerId, 'measurements', measurementId)
}

/**
 * Add a new measurement record.
 *
 * `data.imgSrcs` must be an array of Cloudinary URLs (or an empty array).
 * Base64 strings are rejected to keep Firestore document sizes small.
 * The caller (MeasurementsTab / MeasureModal) must upload to Cloudinary
 * first via uploadToCloudinary() and only pass the resulting URLs here.
 */
export async function addMeasurement(uid, customerId, data) {
  // Guard: reject any base64 images that might slip through
  const hasBase64 = (data.imgSrcs ?? []).some(
    src => typeof src === 'string' && src.startsWith('data:image')
  )
  if (hasBase64 || (typeof data.imgSrc === 'string' && data.imgSrc.startsWith('data:image'))) {
    throw new Error(
      '[measurementService] addMeasurement: base64 images are no longer supported. ' +
      'Upload to Cloudinary first and pass the URLs in imgSrcs[].'
    )
  }

  const ref = await addDoc(measurementsRef(uid, customerId), {
    ...data,
    // Normalise: always store imgSrcs array; imgSrc is the convenience cover
    imgSrcs:   data.imgSrcs   ?? [],
    imgSrc:    data.imgSrcs?.[0] ?? data.imgSrc ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteMeasurement(uid, customerId, measurementId) {
  await deleteDoc(measurementDoc(uid, customerId, measurementId))
  // NOTE: Cloudinary deletion from the client requires a signed request.
  // Add a Cloud Function call here later if needed.
}

export function subscribeToMeasurements(uid, customerId, callback, onError) {
  const q = query(measurementsRef(uid, customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { console.error('[measurementService]', err); onError?.(err) }
  )
}
