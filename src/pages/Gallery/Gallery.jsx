import { useState, useRef, useCallback, useEffect } from 'react'
import { useCustomers } from '../../contexts/CustomerContext'
import { useGallery }   from '../../contexts/GalleryContext'
import { useBrand }     from '../../contexts/BrandContext'
import Header           from '../../components/Header/Header'
import ConfirmSheet     from '../../components/ConfirmSheet/ConfirmSheet'
import Toast            from '../../components/Toast/Toast'
import SharePortfolioModal from '../../components/SharePortfolioModal/SharePortfolioModal'
import { uploadToCloudinary } from '../../services/cloudinaryService'
import styles           from './Gallery.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ── CONSTANTS ──────────────────────────────────────────────────

const TABS = [
  { id: 'completed_works', label: 'Portfolio',   icon: 'check_circle' },
  { id: 'designs',         label: 'Designs',     icon: 'content_cut'  },
  { id: 'inspiration',     label: 'Inspiration', icon: 'lightbulb'    },
]

const CATEGORY_MAP = {
  completed_works: { label: 'Portfolio',    icon: 'check_circle' },
  designs:         { label: 'Design',       icon: 'content_cut'  },
  inspiration:     { label: 'Inspiration',  icon: 'lightbulb'    },
}

// The virtual "All" sub-tab — always first, never editable
const ALL_SUB_TAB = { id: '__all__', label: 'All' }

function formatDate(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── MANAGE DRESS TYPES SHEET ────────────────────────────────────

function ManageDressTypesSheet({ isOpen, onClose, tabId, types, onSave, photos }) {
  const [items,    setItems]    = useState([...(types || [])])
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => {
    if (isOpen) setItems([...(types || [])])
  }, [isOpen, types])

  if (!isOpen) return null

  const addItem = () => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const id = trimmed.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    setItems(prev => [...prev, { id, label: trimmed }])
    setNewLabel('')
  }

  const removeItem = (id) => setItems(prev => prev.filter(t => t.id !== id))
  const handleSave = () => { onSave(tabId, items); onClose() }

  // Count how many photos will be deleted for each type that was removed
  const survivingIds = new Set(items.map(t => t.id))
  const removedTypes = (types || []).filter(t => !survivingIds.has(t.id))
  const affectedCount = removedTypes.reduce((sum, t) => {
    return sum + (photos || []).filter(p => p.category === tabId && p.clothingType === t.id).length
  }, 0)

  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Dress Types</span>
          <button className={styles.sheetClose} onClick={onClose}>
            <span className="mi" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        <div className={styles.sheetBody}>
          {items.length === 0 && (
            <p className={styles.sheetEmpty}>No dress types yet. Add one below.</p>
          )}
          {items.map(item => (
            <div key={item.id} className={styles.manageRow}>
              <span className={styles.manageLabel}>{item.label}</span>
              <button className={styles.manageRemove} onClick={() => removeItem(item.id)}>
                <span className="mi" style={{ fontSize: '1rem', color: 'var(--danger)' }}>delete_outline</span>
              </button>
            </div>
          ))}
          <div className={styles.manageAddRow}>
            <input
              type="text"
              className={styles.manageInput}
              placeholder="e.g. Agbada, Senator, Aso-Oke…"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem() }}
            />
            <button className={styles.manageAddBtn} onClick={addItem} disabled={!newLabel.trim()}>
              <span className="mi" style={{ fontSize: '1.1rem' }}>add</span>
            </button>
          </div>

          {affectedCount > 0 && (
            <div className={styles.deleteWarning}>
              <span className="mi" style={{ fontSize: '1rem', flexShrink: 0 }}>warning</span>
              <span>{affectedCount} photo{affectedCount > 1 ? 's' : ''} under removed type{removedTypes.length > 1 ? 's' : ''} will also be deleted.</span>
            </div>
          )}
        </div>

        <div className={styles.sheetFooter}>
          <button className={styles.sheetSaveBtn} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

// ── UPLOAD STATUS per photo ─────────────────────────────────────
// status: 'idle' | 'uploading' | 'done' | 'error'

// ── ADD PHOTO MODAL ─────────────────────────────────────────────

function AddPhotoModal({ isOpen, onClose, onSave, dressTypes, activeMainTab }) {
  const [category,      setCategory]      = useState(activeMainTab || 'completed_works')
  // Each entry: { localSrc, name, caption, clothingType, price, storageUrl, status, progress, error }
  const [photos,        setPhotos]        = useState([])
  const [captionErrors, setCaptionErrors] = useState({})
  const [typeErrors,    setTypeErrors]    = useState({})
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  const typeOptions = dressTypes[category] || []

  // ── Upload a single file to Cloudinary ──
  const uploadFile = async (file, idx) => {
    setPhotos(prev => prev.map((p, i) =>
      i === idx ? { ...p, status: 'uploading', progress: 0, error: null } : p
    ))
    try {
      const url = await uploadToCloudinary(
        file,
        'gallery',
        (pct) => setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, progress: pct } : p))
      )
      setPhotos(prev => prev.map((p, i) =>
        i === idx ? { ...p, storageUrl: url, status: 'done', progress: 100 } : p
      ))
    } catch (err) {
      console.error('[Gallery] upload failed', err)
      setPhotos(prev => prev.map((p, i) =>
        i === idx ? { ...p, status: 'error', error: 'Upload failed. Tap to retry.' } : p
      ))
    }
  }

  // ── Handle file selection — build entries then upload each ──
  const handleFiles = (files) => {
    const defaultType = typeOptions[0]?.id || ''
    const newEntries = Array.from(files).map(file => ({
      file,
      localSrc:    URL.createObjectURL(file),
      name:        file.name,
      caption:     '',
      clothingType: defaultType,
      price:       '',
      storageUrl:  null,
      status:      'idle',   // will immediately become 'uploading'
      progress:    0,
      error:       null,
    }))

    setPhotos(prev => {
      const startIdx = prev.length
      const merged = [...prev, ...newEntries]
      // Kick off uploads after state update
      newEntries.forEach((_, i) => {
        const globalIdx = startIdx + i
        // Use setTimeout so the state setter above has resolved
        setTimeout(() => uploadFile(newEntries[i].file, globalIdx), 0)
      })
      return merged
    })
  }

  // ── Retry a failed upload ──
  const retryUpload = (idx) => {
    const photo = photos[idx]
    if (!photo?.file) return
    uploadFile(photo.file, idx)
  }

  const removePhoto = (idx) => {
    setPhotos(prev => {
      const entry = prev[idx]
      if (entry?.localSrc) URL.revokeObjectURL(entry.localSrc)
      return prev.filter((_, i) => i !== idx)
    })
    setCaptionErrors(prev => {
      const next = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < idx) next[ki] = v
        else if (ki > idx) next[ki - 1] = v
      })
      return next
    })
    setTypeErrors(prev => {
      const next = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < idx) next[ki] = v
        else if (ki > idx) next[ki - 1] = v
      })
      return next
    })
  }

  const updatePhoto = (idx, field, value) => {
    setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
    if (field === 'caption')      setCaptionErrors(prev => ({ ...prev, [idx]: false }))
    if (field === 'clothingType') setTypeErrors(prev    => ({ ...prev, [idx]: false }))
  }

  const reset = () => {
    // Revoke any blob URLs to avoid memory leaks
    photos.forEach(p => { if (p.localSrc) URL.revokeObjectURL(p.localSrc) })
    setCategory(activeMainTab || 'completed_works')
    setPhotos([]); setCaptionErrors({}); setTypeErrors({})
  }

  const handleClose = () => { reset(); onClose() }

  // Are any uploads still in flight?
  const anyUploading = photos.some(p => p.status === 'uploading')
  // Are there any hard errors that haven't been retried?
  const anyError     = photos.some(p => p.status === 'error')

  const handleSave = () => {
    if (photos.length === 0 || anyUploading) return

    const capErrs = {}; const typErrs = {}
    photos.forEach((p, i) => {
      if (!p.caption.trim()) capErrs[i] = true
      if (!p.clothingType)   typErrs[i] = true
    })
    if (Object.keys(capErrs).length || Object.keys(typErrs).length) {
      setCaptionErrors(capErrs); setTypeErrors(typErrs); return
    }

    const dateStr = new Date().toISOString()
    photos.forEach(p => {
      const typeLabel = typeOptions.find(t => t.id === p.clothingType)?.label || p.clothingType
      onSave({
        id:               Date.now() + Math.random(),
        storageUrl:       p.storageUrl,   // ← Cloudinary URL (never base64)
        category,
        caption:          p.caption.trim(),
        clothingType:     p.clothingType,
        clothingTypeLabel: typeLabel,
        price:            category === 'completed_works' && p.price.trim() ? p.price.trim() : null,
        customerId:       null,
        customerName:     null,
        date:             dateStr,
      })
    })
    reset(); onClose()
  }

  // When category changes, reset clothingType to first option of new category
  useEffect(() => {
    const defaultType = (dressTypes[category] || [])[0]?.id || ''
    setPhotos(prev => prev.map(p => ({ ...p, clothingType: defaultType })))
  }, [category, dressTypes])

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <Header
        type="back"
        title="Add Photo"
        onBackClick={handleClose}
        customActions={[{
          label:    anyUploading ? 'Uploading…' : 'Save',
          onClick:  handleSave,
          disabled: photos.length === 0 || anyUploading || anyError,
        }]}
      />

      <div className={styles.modalBody}>

        {photos.length === 0 ? (
          <div className={styles.uploadArea}>
            <span className="mi" style={{ fontSize: '3rem', opacity: 0.3 }}>add_a_photo</span>
            <p className={styles.uploadText}>Add photos from your camera or files</p>
            <div className={styles.uploadBtns}>
              <button className={styles.uploadBtn} onClick={() => cameraInputRef.current?.click()}>
                <span className="mi" style={{ fontSize: '1.2rem' }}>photo_camera</span> Camera
              </button>
              <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                <span className="mi" style={{ fontSize: '1.2rem' }}>photo_library</span> Gallery
              </button>
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleFiles(e.target.files)} />
            <input ref={fileInputRef}   type="file" accept="image/*" multiple           hidden onChange={e => handleFiles(e.target.files)} />
          </div>
        ) : (
          <div className={styles.previewSection}>
            {photos.map((p, i) => (
              <div key={i} className={styles.photoEntry}>
                <div className={styles.photoEntryTop}>

                  {/* Thumbnail with upload overlay */}
                  <div className={styles.previewThumb}>
                    <img src={p.localSrc} alt={p.name} className={styles.previewImg} />

                    {/* Uploading progress overlay */}
                    {p.status === 'uploading' && (
                      <div className={styles.uploadOverlay}>
                        <div className={styles.uploadProgressRing}>
                          <span className={styles.uploadProgressText}>{p.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Done checkmark */}
                    {p.status === 'done' && (
                      <div className={styles.uploadDoneBadge}>
                        <span className="mi" style={{ fontSize: '0.85rem', color: '#fff' }}>check</span>
                      </div>
                    )}

                    {/* Error — tap thumb to retry */}
                    {p.status === 'error' && (
                      <div
                        className={styles.uploadErrorOverlay}
                        onClick={() => retryUpload(i)}
                        title="Tap to retry"
                      >
                        <span className="mi" style={{ fontSize: '1.1rem', color: '#fff' }}>refresh</span>
                        <span className={styles.uploadErrorLabel}>Retry</span>
                      </div>
                    )}

                    {/* Remove button — hidden while uploading */}
                    {p.status !== 'uploading' && (
                      <button className={styles.previewRemove} onClick={() => removePhoto(i)}>
                        <span className="mi" style={{ fontSize: '0.9rem' }}>close</span>
                      </button>
                    )}
                  </div>

                  <div className={styles.photoEntryFields}>
                    {/* Caption */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        Caption <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.input} ${captionErrors[i] ? styles.inputError : ''}`}
                        placeholder="e.g. Senator suit for Emeka"
                        value={p.caption}
                        onChange={e => updatePhoto(i, 'caption', e.target.value)}
                      />
                      {captionErrors[i] && <span className={styles.errorMsg}>Caption is required</span>}
                    </div>

                    {/* Dress type dropdown */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        Dress Type <span className={styles.required}>*</span>
                      </label>
                      {typeOptions.length === 0 ? (
                        <p className={styles.noTypesHint}>
                          No dress types for this section. Add them via the edit icon on the gallery page.
                        </p>
                      ) : (
                        <div className={styles.selectWrap}>
                          <select
                            className={`${styles.select} ${typeErrors[i] ? styles.inputError : ''}`}
                            value={p.clothingType}
                            onChange={e => updatePhoto(i, 'clothingType', e.target.value)}
                          >
                            <option value="" disabled>Select dress type…</option>
                            {typeOptions.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                          <span className={`mi ${styles.selectChevron}`}>expand_more</span>
                        </div>
                      )}
                      {typeErrors[i] && <span className={styles.errorMsg}>Dress type is required</span>}
                    </div>

                    {/* Price — only for Portfolio / completed_works */}
                    {category === 'completed_works' && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          Starting Price <span className={styles.optional}>(optional)</span>
                        </label>
                        <div className={styles.priceWrap}>
                          <span className={styles.priceCurrency}>₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            className={styles.priceInput}
                            placeholder="e.g. 45,000"
                            value={p.price}
                            onChange={e => updatePhoto(i, 'price', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Per-photo error hint */}
                    {p.status === 'error' && (
                      <p className={styles.photoUploadError}>
                        <span className="mi" style={{ fontSize: '0.85rem' }}>error_outline</span>
                        {p.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button className={styles.addMoreBtn} onClick={() => fileInputRef.current?.click()}>
              <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text3)' }}>add_photo_alternate</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 700 }}>Add more photos</span>
            </button>
            <input ref={fileInputRef}   type="file" accept="image/*" multiple           hidden onChange={e => handleFiles(e.target.files)} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleFiles(e.target.files)} />
          </div>
        )}

        {/* Section */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Section</label>
          <div className={styles.categoryRow}>
            {Object.entries(CATEGORY_MAP).map(([key, val]) => (
              <button
                key={key}
                className={`${styles.categoryChip} ${category === key ? styles.categoryActive : ''}`}
                onClick={() => setCategory(key)}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>{val.icon}</span>
                <span className={styles.categoryLabel}>{val.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── LIGHTBOX ────────────────────────────────────────────────────

function Lightbox({ photo, photos, onClose, onDelete }) {
  const [current, setCurrent] = useState(photo)
  const idx     = photos.findIndex(p => p.id === current.id)
  const hasPrev = idx > 0
  const hasNext = idx < photos.length - 1

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft'  && hasPrev) setCurrent(photos[idx - 1])
      if (e.key === 'ArrowRight' && hasNext) setCurrent(photos[idx + 1])
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx, hasPrev, hasNext, photos, onClose])

  const cat = CATEGORY_MAP[current.category]
  // Support legacy base64 (src) and new Cloudinary URLs (storageUrl)
  const imgSrc = current.storageUrl || current.src

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
        <div className={styles.lightboxBar}>
          <button className={styles.lightboxBtn} onClick={onClose}>
            <span className="mi" style={{ fontSize: '1.6rem' }}>close</span>
          </button>
          <div className={styles.lightboxCounter}>{idx + 1} / {photos.length}</div>
          <button className={styles.lightboxBtn} onClick={() => onDelete(current)}>
            <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--danger)' }}>delete_outline</span>
          </button>
        </div>

        <div className={styles.lightboxImgWrap}>
          {hasPrev && (
            <button className={`${styles.navBtn} ${styles.navLeft}`} onClick={() => setCurrent(photos[idx - 1])}>
              <span className="mi" style={{ fontSize: '1.6rem' }}>chevron_left</span>
            </button>
          )}
          <img src={imgSrc} alt={current.caption || 'Photo'} className={styles.lightboxImg} />
          {hasNext && (
            <button className={`${styles.navBtn} ${styles.navRight}`} onClick={() => setCurrent(photos[idx + 1])}>
              <span className="mi" style={{ fontSize: '1.6rem' }}>chevron_right</span>
            </button>
          )}
        </div>

        <div className={styles.lightboxInfo}>
          {current.caption && <div className={styles.lightboxCaption}>{current.caption}</div>}
          <div className={styles.lightboxMeta}>
            {current.price && (
              <span className={`${styles.lightboxChip} ${styles.lightboxPriceChip}`}>
                <span className="mi" style={{ fontSize: '0.75rem' }}>sell</span>
                From ₦{current.price}
              </span>
            )}
            {current.clothingTypeLabel && (
              <span className={styles.lightboxChip}>
                <span className="mi" style={{ fontSize: '0.75rem' }}>checkroom</span>
                {current.clothingTypeLabel}
              </span>
            )}
            {cat && (
              <span className={styles.lightboxChip}>
                <span className="mi" style={{ fontSize: '0.85rem' }}>{cat.icon}</span>
                {cat.label}
              </span>
            )}
            {current.customerName && (
              <span className={styles.lightboxChip}>
                <span className="mi" style={{ fontSize: '0.75rem' }}>person</span>
                {current.customerName}
              </span>
            )}
            <span className={styles.lightboxChip}>
              <span className="mi" style={{ fontSize: '0.75rem' }}>calendar_today</span>
              {formatDate(current.createdAt || current.date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────────

export default function Gallery({ onMenuClick }) {
  const { customers } = useCustomers()
  const { photos, dressTypes, loading, addPhoto, deletePhoto, updatePhoto, saveDressTypes } = useGallery()
  const { brand }     = useBrand()

  const [activeTab,     setActiveTab]     = useState('completed_works')
  const [activeSubTabs, setActiveSubTabs] = useState({})
  const [manageTabId,   setManageTabId]   = useState(null)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [confirmDel,    setConfirmDel]    = useState(null)
  const [toastMsg,      setToastMsg]      = useState('')
  const [shareOpen,     setShareOpen]     = useState(false)
  const [searchQuery,   setSearchQuery]   = useState('')
  const toastTimer       = useRef(null)
  const tabsRef          = useRef(null)
  const subTabsRef       = useRef(null)
  const tabActionBarRef  = useRef(null)
  const pageRef          = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const currentDressTypes = dressTypes[activeTab] || []

  // Measure tabActionBar height and expose as CSS var so subTabsBar top is exact
  useEffect(() => {
    const el = tabActionBarRef.current
    const page = pageRef.current
    if (!el || !page) return
    const update = () => {
      page.style.setProperty('--tab-bar-h', `${el.offsetHeight}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Active sub-tab: default to '__all__' (the All tab)
  const activeSubTab = activeSubTabs[activeTab] ?? '__all__'

  const filteredByMain = photos.filter(p => p.category === activeTab)
  const filteredBySub = activeSubTab === '__all__'
    ? filteredByMain
    : filteredByMain.filter(p => p.clothingType === activeSubTab)
  const filtered = searchQuery.trim()
    ? filteredBySub.filter(p =>
        p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clothingTypeLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredBySub

  const counts = Object.fromEntries(TABS.map(t => [t.id, photos.filter(p => p.category === t.id).length]))
  const lightboxList = lightboxPhoto ? filtered : []

  // Photos from completed_works for the Share Portfolio Modal
  const completedWorksPhotos = photos.filter(p => p.category === 'completed_works')

  const handleAddPhoto = async (photoData) => {
    try { await addPhoto(photoData) }
    catch { showToast('Failed to save photo') }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDel) return
    try {
      await deletePhoto(confirmDel.id)
      if (lightboxPhoto?.id === confirmDel.id) setLightboxPhoto(null)
      showToast('Photo deleted')
    } catch { showToast('Failed to delete photo') }
    setConfirmDel(null)
  }

  const handleSaveDressTypes = async (tabId, types) => {
    try {
      // Find which type IDs were removed
      const survivingIds = new Set(types.map(t => t.id))
      const removedIds   = (dressTypes[tabId] || [])
        .map(t => t.id)
        .filter(id => !survivingIds.has(id))

      // Delete every photo in this tab whose clothingType no longer exists
      if (removedIds.length > 0) {
        const orphans = photos.filter(
          p => p.category === tabId && removedIds.includes(p.clothingType)
        )
        await Promise.all(orphans.map(p => deletePhoto(p.id)))
        if (orphans.length > 0) showToast(`${orphans.length} photo${orphans.length > 1 ? 's' : ''} removed`)
      }

      await saveDressTypes(tabId, types)

      // Reset sub-tab to __all__ if the active one was removed
      const ids = types.map(t => t.id)
      setActiveSubTabs(prev => ({
        ...prev,
        [tabId]: ids.includes(prev[tabId]) ? prev[tabId] : '__all__'
      }))
    } catch { showToast('Failed to save dress types') }
  }

  // Scroll active sub-tab into view on change
  useEffect(() => {
    if (!subTabsRef.current) return
    const activeEl = subTabsRef.current.querySelector(`.${styles.subTabActive}`)
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeSubTab, activeTab])

  // Expandable pill — "Share Portfolio Link" now opens the modal
  const TAB_ACTIONS = {
    completed_works: { icon: 'share',          label: 'Share Portfolio Link', onPress: () => setShareOpen(true) },
    designs:         { icon: 'picture_as_pdf', label: 'Export Lookbook',      onPress: () => showToast('Export lookbook coming soon!') },
    inspiration:     { icon: 'send',           label: 'Send Board',           onPress: () => showToast('Share board coming soon!') },
  }
  const tabAction = TAB_ACTIONS[activeTab]
  const [pillExpanded, setPillExpanded] = useState(true)
  const pillTimer = useRef(null)

  useEffect(() => {
    setPillExpanded(true)
    clearTimeout(pillTimer.current)
    pillTimer.current = setTimeout(() => setPillExpanded(false), 2000)
    return () => clearTimeout(pillTimer.current)
  }, [activeTab])

  const handlePillClick = () => {
    if (!pillExpanded) {
      setPillExpanded(true)
      clearTimeout(pillTimer.current)
      pillTimer.current = setTimeout(() => setPillExpanded(false), 2000)
    } else {
      tabAction?.onPress()
    }
  }

  // Resolve image src — supports both legacy base64 (src) and Cloudinary (storageUrl)
  const resolveImgSrc = (photo) => photo.storageUrl || photo.src

  return (
    <div className={styles.page} ref={pageRef}>
      <Header title="Gallery" onMenuClick={onMenuClick} />

      {/* STICKY HEADER — both bars in one container so they never gap */}
      <div className={styles.stickyHeader}>
        {/* MAIN TABS + PILL */}
        <div className={styles.tabActionBar} ref={tabActionBarRef}>
          <div className={styles.tabs} ref={tabsRef}>
            {TABS.map(tab => (
              <div
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={(e) => {
                  setActiveTab(tab.id)
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                }}
              >
                <span>{tab.label}</span>
                {counts[tab.id] > 0 && <span className={styles.tabBadge}>{counts[tab.id]}</span>}
              </div>
            ))}
          </div>
          {tabAction && (
            <div className={styles.pillWrap}>
              <button
                className={`${styles.pill} ${pillExpanded ? styles.pillExpanded : ''}`}
                onClick={handlePillClick}
                aria-label={tabAction.label}
              >
                <span className={`mi ${styles.pillIcon}`}>{tabAction.icon}</span>
                <span className={styles.pillLabel}>{tabAction.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* DRESS TYPE SUB-TABS */}
        <div className={styles.subTabsBar}>
          <div className={styles.subTabsScroll} ref={subTabsRef}>
            <button
              key="__all__"
              className={`${styles.subTab} ${activeSubTab === '__all__' ? styles.subTabActive : ''}`}
              onClick={() => setActiveSubTabs(prev => ({ ...prev, [activeTab]: '__all__' }))}
            >
              All
            </button>
            {currentDressTypes.map(st => (
              <button
                key={st.id}
                className={`${styles.subTab} ${activeSubTab === st.id ? styles.subTabActive : ''}`}
                onClick={() => setActiveSubTabs(prev => ({ ...prev, [activeTab]: st.id }))}
              >
                {st.label}
              </button>
            ))}
            {/* Edit button — lives as last item in the scroll row */}
            <button
              className={styles.subTabEditBtn}
              onClick={() => setManageTabId(activeTab)}
              title="Edit dress types"
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className={styles.searchBarWrap}>
        <div className={styles.gallerySearchWrap}>
          <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)', flexShrink: 0 }}>search</span>
          <input
            className={styles.gallerySearchInput}
            type="text"
            placeholder="Search photos…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button className={styles.gallerySearchClear} onClick={() => setSearchQuery('')}>
              <span className="mi" style={{ fontSize: '1rem' }}>close</span>
            </button>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className={styles.gridArea}>
        {loading ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2rem', opacity: 0.2 }}>hourglass_empty</span>
            <p>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '3rem', opacity: 0.15 }}>{CATEGORY_MAP[activeTab]?.icon ?? 'image'}</span>
            <p>{searchQuery ? 'No results found.' : 'No photos here yet.'}</p>
            {!searchQuery && <span className={styles.emptyHint}>Tap + to add your first photo</span>}
          </div>
        ) : (
          <div className={styles.masonryGrid}>
            {[0, 1].map(col => (
              <div key={col} className={styles.masonryCol}>
                {filtered.filter((_, i) => i % 2 === col).map((photo, i) => (
                  <div
                    key={photo.id}
                    className={styles.photoThumb}
                    style={{ animationDelay: `${i * 0.03}s` }}
                    onClick={() => setLightboxPhoto(photo)}
                  >
                    <img
                      src={resolveImgSrc(photo)}
                      alt={photo.caption || 'photo'}
                      className={styles.thumbImg}
                    />
                    <div className={styles.thumbBadge}>
                      <span className="mi" style={{ fontSize: '0.8rem' }}>{CATEGORY_MAP[photo.category]?.icon}</span>
                    </div>
                    {photo.price && (
                      <div className={styles.thumbPrice}>₦{photo.price}</div>
                    )}
                    {photo.caption && <div className={styles.thumbCaption}>{photo.caption}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className={styles.fab} onClick={() => setModalOpen(true)}>
        <span className="mi">add</span>
      </button>

      {modalOpen && (
        <AddPhotoModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAddPhoto}
          dressTypes={dressTypes}
          activeMainTab={activeTab}
        />
      )}

      <ManageDressTypesSheet
        isOpen={!!manageTabId}
        onClose={() => setManageTabId(null)}
        tabId={manageTabId}
        types={dressTypes[manageTabId] || []}
        onSave={handleSaveDressTypes}
        photos={photos}
      />

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={lightboxList}
          onClose={() => setLightboxPhoto(null)}
          onDelete={(p) => { setLightboxPhoto(null); setConfirmDel(p) }}
        />
      )}

      <ConfirmSheet
        open={!!confirmDel}
        title="Delete Photo?"
        message="This photo will be permanently removed."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDel(null)}
      />

      {/* ── Share Portfolio Modal ── */}
      <SharePortfolioModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        brandName={brand.name}
        completedWorksPhotos={completedWorksPhotos}
      />

      <Toast message={toastMsg} />
      <BottomNav></BottomNav>
    </div>
  )
}
