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


function customersRef(uid) {
  return collection(db, 'users', uid, 'customers')
}


function customerDoc(uid, customerId) {
  return doc(db, 'users', uid, 'customers', customerId)
}


export async function addCustomer(uid, data) {

  const ref = await addDoc(customersRef(uid), {
    ...data,
    photo: data.photo ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getCustomer(uid, customerId) {

  const customerSnapshot = await getDoc(customerDoc(uid, customerId))

  if (!customerSnapshot.exists()) return null

  return { 
    id: customerSnapshot.id,
    ...customerSnapshot.data() 
  }
}

export async function getAllCustomers(uid) {

  const q  = query(customersRef(uid), orderBy('createdAt', 'desc'))
  const allCustomersSnapshots = await getDocs(q)
  return allCustomersSnapshots.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }))

}

export async function updateCustomer(uid, customerId, data) {

  await updateDoc(customerDoc(uid, customerId), {
    ...data,
    photo: data.photo ?? null,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCustomer(uid, customerId) {
  await deleteDoc(customerDoc(uid, customerId))
}


export function subscribeToCustomers(uid, onSetCustomers, onSetError) {

  const q = query(customersRef(uid))

  return onSnapshot(
    q,
    (snapshot) => {
      const customers = snapshot.docs
        .map(doc => (
          { 
            id: doc.id, 
            ...doc.data() 
          }
        ))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0
          const bTime = b.createdAt?.toMillis?.() ?? 0
          return bTime - aTime
        })
      onSetCustomers(customers)
    },
    (err) => {
      
      onSetError?.(err)
    }
  )
}