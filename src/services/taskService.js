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
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function tasksRef(uid) {
  return collection(db, 'users', uid, 'tasks')
}

function taskDoc(uid, taskId) {
  return doc(db, 'users', uid, 'tasks', taskId)
}

export async function addTask(uid, data) {

  const ref = await addDoc(tasksRef(uid), {
    ...data,
    done: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTask(uid, taskId) {

  const snapshot = await getDoc(taskDoc(uid, taskId))
  if (!snapshot.exists()) return null
  return { 
    id: snapshot.id, 
    ...snapshot.data() 
  }
}

export async function getAllTasks(uid) {

  const q  = query(tasksRef(uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => (
    { 
      id: d.id, 
      ...d.data() 
    }))
}


export async function getPendingTasks(uid) {

  const q  = query(tasksRef(uid), where('done', '==', false), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => (
    { 
      id: d.id, 
      ...d.data() 
    }))
}

export async function updateTask(uid, taskId, data) {

  await updateDoc(taskDoc(uid, taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function toggleTask(uid, taskId, currentDone) {

  await updateDoc(taskDoc(uid, taskId), {
    done: !currentDone,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTask(uid, taskId) {

  await deleteDoc(taskDoc(uid, taskId))
}

export function subscribeToTasks(uid, callback, onError) {

  const q = query(tasksRef(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snapshot => callback(snapshot.docs.map(d => (
      { 
        id: d.id, 
        ...d.data() 
      }))),
    err  => { onError?.(err) }
  )
}
