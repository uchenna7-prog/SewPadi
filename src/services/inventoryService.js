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
  increment,
} from 'firebase/firestore'
import { db } from '../firebase'

function inventoryCol(uid) {
  return collection(db, 'users', uid, 'inventory')
}

function inventoryDoc(uid, itemId) {
  return doc(db, 'users', uid, 'inventory', itemId)
}

export function subscribeToInventory(uid, onData, onError) {
  const q = query(inventoryCol(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export async function createInventoryItem(uid, data) {
  return addDoc(inventoryCol(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateInventoryItem(uid, itemId, data) {
  return updateDoc(inventoryDoc(uid, itemId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function adjustInventoryQty(uid, itemId, delta) {
  return updateDoc(inventoryDoc(uid, itemId), {
    quantity: increment(delta),
    updatedAt: serverTimestamp(),
  })
}

// Delete
export async function deleteInventoryItem(uid, itemId) {
  return deleteDoc(inventoryDoc(uid, itemId))
}