import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeToPhotos,
  subscribeToDressTypes,
  addPhoto       as addPhotoToDb,
  updatePhoto    as updatePhotoInDb,
  deletePhoto    as deletePhotoFromDb,
  saveDressTypes as saveDressTypesToDb,
} from '../services/galleryService'


const GalleryContext = createContext(null)

export function GalleryProvider({ children }) {

  const { user } = useAuth()

  const [photos,     setPhotos]     = useState([])
  const [dressTypes, setDressTypes] = useState({
    completed_works: [],
    designs:         [],
    inspiration:     [],
  })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)


  useEffect(() => {
    if (!user) {
      setPhotos([])
      setDressTypes({ completed_works: [], designs: [], inspiration: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubPhotos = subscribeToPhotos(
      user.uid,
      (data) => { setPhotos(data); setLoading(false) },
      (err)  => { setError(err.message); setLoading(false) }
    )

    const unsubDressTypes = subscribeToDressTypes(
      user.uid,
      (data) => setDressTypes(data),
      (err)  => setError(err.message)
    )

    return () => {
      unsubPhotos()
      unsubDressTypes()
    }
  }, [user])


  const addPhoto = useCallback(async (data) => {
    if (!user) return
    const { id: _localId, ...photoData } = data
    return await addPhotoToDb(user.uid, photoData)
  }, [user])

  const updatePhoto = useCallback(async (id, data) => {
    if (!user) return
    await updatePhotoInDb(user.uid, String(id), data)
  }, [user])

  const deletePhoto = useCallback(async (id) => {
    if (!user) return
    await deletePhotoFromDb(user.uid, String(id))
  }, [user])

  const saveDressTypes = useCallback(async (tabId, types) => {
    if (!user) return
    await saveDressTypesToDb(user.uid, tabId, types)
  }, [user])

  return (
    <GalleryContext.Provider value={{
      photos,
      dressTypes,
      loading,
      error,
      addPhoto,
      updatePhoto,
      deletePhoto,
      saveDressTypes,
    }}>
      {children}
    </GalleryContext.Provider>
  )
}

export function useGallery() {
  const ctx = useContext(GalleryContext)
  if (!ctx) throw new Error('useGallery must be used inside GalleryProvider')
  return ctx
}