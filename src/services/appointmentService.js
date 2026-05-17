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


function appointmentsRef(uid) {
  return collection(db, 'users', uid, 'appointments')
}


function appointmentDoc(uid, id) {
  return doc(db, 'users', uid, 'appointments', id)
}


export function subscribeToAppointments(uid, onData, onError) {

  const q = query(appointmentsRef(uid), orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      onData(data)
    },
    onError
  )
}


export async function addAppointment(uid, appointmentData) {
  return addDoc(appointmentsRef(uid), {
    ...appointmentData,
    createdAt: serverTimestamp(),
  })
}


export async function updateAppointment(uid, id, updates) {
  return updateDoc(appointmentDoc(uid, id), updates)
}


export async function deleteAppointment(uid, id) {
  return deleteDoc(appointmentDoc(uid, id))
}
