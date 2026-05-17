import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const ordersCollection = (uid) =>
  collection(db, 'users', uid, 'orders')

const orderDocument = (uid, orderId) =>
  doc(db, 'users', uid, 'orders', orderId)

export async function addOrder(uid, customerId, data) {
  const ref = await addDoc(ordersCollection(uid), {
    ...data,
    customerId,
    status:    data.status ?? 'pending',
    stage:     data.stage  ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getOrder(uid, orderId) {
  const snap = await getDoc(orderDocument(uid, orderId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function updateOrder(uid, orderId, data) {
  await updateDoc(orderDocument(uid, orderId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateOrderStatus(uid, orderId, status) {
  await updateDoc(orderDocument(uid, orderId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function updateOrderStage(uid, orderId, stage) {
  await updateDoc(orderDocument(uid, orderId), {
    stage,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteOrder(uid, orderId) {
  await deleteDoc(orderDocument(uid, orderId))
}

export function subscribeToOrders(uid, callback) {
  const q = query(
    ordersCollection(uid),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function subscribeToCustomerOrders(uid, customerId, callback) {
  const q = query(
    ordersCollection(uid),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}