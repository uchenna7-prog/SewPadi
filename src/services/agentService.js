// src/services/agentService.js
// ─────────────────────────────────────────────────────────────
// Firestore reads/writes for agent conversation history.
// Collection: users/{uid}/agentMessages
// ─────────────────────────────────────────────────────────────

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'

const messagesCol = (uid) =>
  collection(db, 'users', uid, 'agentMessages')

// Save a single message (user or agent) to Firestore
export async function saveAgentMessage(uid, message) {
  try {
    await addDoc(messagesCol(uid), {
      ...message,
      createdAt: serverTimestamp(),
    })
  } catch (err) {
    
  }
}

// Load the last N messages for this user (ordered oldest→newest)
export async function loadAgentMessages(uid, count = 80) {
  try {
    const q = query(messagesCol(uid), orderBy('createdAt', 'desc'), limit(count))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .reverse()
  } catch (err) {
    
    return []
  }
}

// Clear all agent messages for this user
export async function clearAgentMessages(uid) {
  try {
    const snap = await getDocs(messagesCol(uid))
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'users', uid, 'agentMessages', d.id))))
  } catch (err) {
    
  }
}
