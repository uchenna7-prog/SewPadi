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

const invoicesCollection = (uid) =>
  collection(db, 'users', uid, 'invoices')

const invoiceDocument = (uid, invoiceId) =>
  doc(db, 'users', uid, 'invoices', invoiceId)

export async function addInvoice(uid, customerId, data) {
  const { id: _, ...invoiceData } = data
  const ref = await addDoc(invoicesCollection(uid), {
    ...invoiceData,
    customerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateInvoice(uid, invoiceId, data) {
  await updateDoc(invoiceDocument(uid, invoiceId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateInvoiceStatus(uid, invoiceId, status) {
  await updateDoc(invoiceDocument(uid, invoiceId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteInvoice(uid, invoiceId) {
  await deleteDoc(invoiceDocument(uid, invoiceId))
}

export function subscribeToInvoices(uid, callback) {
  const q = query(
    invoicesCollection(uid),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function subscribeToCustomerInvoices(uid, customerId, callback) {
  const q = query(
    invoicesCollection(uid),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}