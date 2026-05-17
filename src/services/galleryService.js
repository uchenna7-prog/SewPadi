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
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'


function photosRef(uid) {
  return collection(db, 'users', uid, 'galleryPhotos')
}

function photoDoc(uid, photoId) {
  return doc(db, 'users', uid, 'galleryPhotos', photoId)
}

function dressTypesDoc(uid, tabId) {
  return doc(db, 'users', uid, 'galleryDressTypes', tabId)
}

// ── Default dress types if none saved yet ─────────────────────

const DEFAULT_DRESS_TYPES = {
  completed_works: [{ id: 'kaftan', label: 'Kaftan' }, { id: 'agbada', label: 'Agbada' }],
  designs:         [{ id: 'sketches', label: 'Sketches' }, { id: 'patterns', label: 'Patterns' }],
  inspiration:     [{ id: 'styles', label: 'Styles' }, { id: 'fabrics', label: 'Fabrics' }],
}

// ── Photos CRUD ───────────────────────────────────────────────

/**
 * Add a new gallery photo.
 *
 * Expects `data.storageUrl` — a Cloudinary URL returned after upload.
 * Legacy documents may have `data.src` (base64); the UI handles both
 * via `photo.storageUrl || photo.src` when rendering.
 *
 * NOTE: We no longer accept base64 here. The caller (Gallery.jsx /
 * AddPhotoModal) must upload to Cloudinary first and pass the URL.
 */
export async function addPhoto(uid, data) {
  // Guard: reject accidental base64 writes to keep Firestore docs small
  if (data.storageUrl?.startsWith('data:image') || data.src?.startsWith('data:image')) {
    throw new Error(
      '[galleryService] addPhoto: base64 images are no longer supported. ' +
      'Upload to Cloudinary first and pass storageUrl.'
    )
  }

  const ref = await addDoc(photosRef(uid), {
    ...data,
    // Ensure the canonical field name is always present
    storageUrl: data.storageUrl ?? null,
    createdAt:  serverTimestamp(),
    updatedAt:  serverTimestamp(),
  })
  return ref.id
}

export async function updatePhoto(uid, photoId, data) {
  await updateDoc(photoDoc(uid, photoId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePhoto(uid, photoId) {
  await deleteDoc(photoDoc(uid, photoId))
  // NOTE: Cloudinary deletion from the client requires a signed request.
  // If you add a Cloud Function later, call it here with the photo's publicId.
}

/**
 * Real-time listener for all gallery photos, ordered newest-first.
 * Sorted by createdAt desc (avoids a composite Firestore index requirement).
 *
 * Each document has either:
 *   • storageUrl — Cloudinary URL (new photos)
 *   • src        — legacy base64 string (old photos, still readable)
 */
export function subscribeToPhotos(uid, callback, onError) {
  const q = query(photosRef(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => {
      const photos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      callback(photos)
    },
    err => { console.error('[galleryService] photos', err); onError?.(err) }
  )
}

/**
 * Real-time listener scoped to a single category tab.
 * Useful if you want per-tab subscriptions (optional — context uses global).
 */
export function subscribeToPhotosByCategory(uid, category, callback, onError) {
  const q = query(
    photosRef(uid),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { console.error('[galleryService] photos by category', err); onError?.(err) }
  )
}

// ── Dress Types CRUD ──────────────────────────────────────────

/**
 * Get dress types for a tab. Returns default if doc doesn't exist yet.
 */
export async function getDressTypes(uid, tabId) {
  const snap = await getDoc(dressTypesDoc(uid, tabId))
  if (!snap.exists()) return DEFAULT_DRESS_TYPES[tabId] ?? []
  return snap.data().types ?? []
}

/**
 * Save the full types array for a tab (overwrite).
 * Creates the doc if it doesn't exist.
 */
export async function saveDressTypes(uid, tabId, types) {
  await setDoc(dressTypesDoc(uid, tabId), {
    tabId,
    types,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Real-time listener for dress types across all three tabs.
 * Returns an object: { completed_works: [...], designs: [...], inspiration: [...] }
 */
export function subscribeToDressTypes(uid, callback, onError) {
  const TAB_IDS = ['completed_works', 'designs', 'inspiration']
  const current = {
    completed_works: DEFAULT_DRESS_TYPES.completed_works,
    designs:         DEFAULT_DRESS_TYPES.designs,
    inspiration:     DEFAULT_DRESS_TYPES.inspiration,
  }

  const unsubs = TAB_IDS.map(tabId =>
    onSnapshot(
      dressTypesDoc(uid, tabId),
      snap => {
        if (snap.exists()) {
          current[tabId] = snap.data().types ?? []
        } else {
          current[tabId] = DEFAULT_DRESS_TYPES[tabId] ?? []
        }
        callback({ ...current })
      },
      err => { console.error('[galleryService] dressTypes', err); onError?.(err) }
    )
  )

  // Return a single unsubscribe that kills all three listeners
  return () => unsubs.forEach(u => u())
}
