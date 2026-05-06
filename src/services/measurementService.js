
// ─────────────────────────────────────────────────────────────
// Data path: users/{uid}/customers/{customerId}/measurements/{id}
// Measurements live as a subcollection under each customer.
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

export async function addMeasurement(uid, customerId, data) {
  const ref = await addDoc(measurementsRef(uid, customerId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteMeasurement(uid, customerId, measurementId) {
  await deleteDoc(measurementDoc(uid, customerId, measurementId))
}

export function subscribeToMeasurements(uid, customerId, callback, onError) {
  const q = query(measurementsRef(uid, customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { console.error('[measurementService]', err); onError?.(err) }
  )
}
