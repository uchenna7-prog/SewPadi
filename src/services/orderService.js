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

function ordersRef(uid, customerId) {
  return collection(db, 'users', uid, 'customers', customerId, 'orders')
}

function orderDoc(uid, customerId, orderId) {
  return doc(db, 'users', uid, 'customers', customerId, 'orders', orderId)
}

export async function addOrder(uid, customerId, data) {
  const ref = await addDoc(ordersRef(uid, customerId), {
    ...data,
    status:    data.status    || 'pending',
    stage:     data.stage     || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getOrder(uid, customerId, orderId) {
  const snap = await getDoc(orderDoc(uid, customerId, orderId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getAllOrders(uid, customerId) {
  const q    = query(ordersRef(uid, customerId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateOrder(uid, customerId, orderId, data) {
  await updateDoc(orderDoc(uid, customerId, orderId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateOrderStatus(uid, customerId, orderId, status) {
  await updateDoc(orderDoc(uid, customerId, orderId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function updateOrderStage(uid, customerId, orderId, stage) {
  await updateDoc(orderDoc(uid, customerId, orderId), {
    stage,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteOrder(uid, customerId, orderId) {
  await deleteDoc(orderDoc(uid, customerId, orderId))
}

export function subscribeToOrders(uid, customerId, callback, onError) {
  const q = query(ordersRef(uid, customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { onError?.(err) }
  )
}
