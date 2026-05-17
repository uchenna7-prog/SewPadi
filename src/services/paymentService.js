import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const paymentsCollection = (uid) =>
  collection(db, 'users', uid, 'payments')

const paymentDocument = (uid, paymentId) =>
  doc(db, 'users', uid, 'payments', paymentId)

export async function createPayment(uid, customerId, data) {
  const ref = await addDoc(paymentsCollection(uid), {
    ...data,
    customerId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePayment(uid, paymentId, data) {
  await updateDoc(paymentDocument(uid, paymentId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePayment(uid, paymentId) {
  await deleteDoc(paymentDocument(uid, paymentId))
}

export function subscribeToPayments(uid, callback) {
  const q = query(
    paymentsCollection(uid),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function subscribeToCustomerPayments(uid, customerId, callback) {
  const q = query(
    paymentsCollection(uid),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}