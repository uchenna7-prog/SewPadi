import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function invoicesRef(uid, customerId) {
  return collection(db, 'users', uid, 'customers', customerId, 'invoices')
}

function invoiceDoc(uid, customerId, invoiceId) {
  return doc(db, 'users', uid, 'customers', customerId, 'invoices', invoiceId)
}

export async function addInvoice(uid, customerId, data) {
  const { id: _localId, ...rest } = data
  const ref = await addDoc(invoicesRef(uid, customerId), {
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateInvoice(uid, customerId, invoiceId, data) {
  await updateDoc(invoiceDoc(uid, customerId, invoiceId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateInvoiceStatus(uid, customerId, invoiceId, status) {
  await updateDoc(invoiceDoc(uid, customerId, invoiceId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteInvoice(uid, customerId, invoiceId) {
  await deleteDoc(invoiceDoc(uid, customerId, invoiceId))
}

export function subscribeToInvoices(uid, customerId, callback, onError) {
  const q = query(invoicesRef(uid, customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { console.error('[invoiceService]', err); onError?.(err) }
  )
}
