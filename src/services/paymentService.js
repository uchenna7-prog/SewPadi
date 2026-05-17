import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function paymentsRef(uid, customerId) {
  return collection(db, 'users', uid, 'customers', customerId, 'payments')
}

function paymentDoc(uid, customerId, paymentId) {
  return doc(db, 'users', uid, 'customers', customerId, 'payments', paymentId)
}

export function subscribeToPayments(uid, customerId, onData, onError) {
  const q = query(paymentsRef(uid, customerId))
  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0
          const bTime = b.createdAt?.toMillis?.() ?? 0
          return bTime - aTime
        })
      onData(data)
    },
    onError
  )
}

export async function createPayment(uid, customerId, data) {
  return addDoc(paymentsRef(uid, customerId), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updatePayment(uid, customerId, paymentId, data) {
  return updateDoc(paymentDoc(uid, customerId, paymentId), data)
}

export async function deletePayment(uid, customerId, paymentId) {
  return deleteDoc(paymentDoc(uid, customerId, paymentId))
}
