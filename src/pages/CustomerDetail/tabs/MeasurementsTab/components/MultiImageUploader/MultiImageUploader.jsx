import { useState, useEffect, useRef } from 'react'
import { uploadToCloudinary } from '../../../../../../services/cloudinaryService'
import styles from './MultiImageUploader.module.css'


function buildSlots(urls) {
  return (urls || []).map(url => ({
    id:       Math.random().toString(36).slice(2),
    url,
    localSrc: null,
    file:     null,
    status:   'existing',
    progress: 100,
  }))
}


export function MultiImageUploader({ images, onChange, cardId }) {

  const [slots,        setSlots]        = useState(() => buildSlots(images))
  const [previewIndex, setPreviewIndex] = useState(0)

  const prevImages = useRef(images)

  useEffect(() => {
    if (images !== prevImages.current && images.length === 0) {
      slots.forEach(s => { if (s.localSrc) URL.revokeObjectURL(s.localSrc) })
      setSlots([])
    }
    prevImages.current = images
  }, [images])

  useEffect(() => {
    if (previewIndex >= slots.length && slots.length > 0) {
      setPreviewIndex(slots.length - 1)
    }
  }, [slots.length, previewIndex])


  function publishUrls(updatedSlots) {
    const urls = updatedSlots
      .filter(s => s.status === 'existing' || s.status === 'done')
      .map(s => s.url)
      .filter(Boolean)
    onChange(urls)
  }

  async function uploadSlot(slotId, file) {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, status: 'uploading', progress: 0 } : s
    ))
    try {
      const url = await uploadToCloudinary(
        file,
        'measurements',
        (pct) => setSlots(prev => prev.map(s => s.id === slotId ? { ...s, progress: pct } : s))
      )
      setSlots(prev => {
        const updated = prev.map(s =>
          s.id === slotId ? { ...s, url, status: 'done', progress: 100 } : s
        )
        publishUrls(updated)
        return updated
      })
    } catch (err) {
      console.error('[MultiImageUploader] upload failed', err)
      setSlots(prev => prev.map(s =>
        s.id === slotId ? { ...s, status: 'error', progress: 0 } : s
      ))
    }
  }

  function retrySlot(slotId) {
    const slot = slots.find(s => s.id === slotId)
    if (!slot?.file) return
    uploadSlot(slotId, slot.file)
  }

  async function handleFilePick(files) {
    const fileArray = Array.from(files)
    const newSlots  = fileArray.map(file => ({
      id:       Math.random().toString(36).slice(2),
      url:      null,
      localSrc: URL.createObjectURL(file),
      file,
      status:   'uploading',
      progress: 0,
    }))

    setSlots(prev => {
      const merged = [...prev, ...newSlots]
      setPreviewIndex(merged.length - 1)
      return merged
    })

    await Promise.allSettled(
      newSlots.map(slot => uploadSlot(slot.id, slot.file))
    )
  }

  function removeSlot(idx) {
    setSlots(prev => {
      const slot    = prev[idx]
      if (slot?.localSrc) URL.revokeObjectURL(slot.localSrc)
      const updated = prev.filter((_, i) => i !== idx)
      publishUrls(updated)
      return updated
    })
    setPreviewIndex(i => Math.max(0, i - 1))
  }


  if (slots.length === 0) {
    return (
      <div className={styles.uploadArea_wrapper}>
        <label className={styles.uploadArea_empty} htmlFor={`upload-${cardId}`}>
          <span className="mi" style={{ fontSize: '1.8rem', color: 'var(--text3)', pointerEvents: 'none' }}>add_a_photo</span>
          <span className={styles.uploadArea_label}>Tap to upload design references</span>
          <input
            id={`upload-${cardId}`}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => e.target.files.length && handleFilePick(e.target.files)}
          />
        </label>
      </div>
    )
  }

  const currentSlot = slots[previewIndex]
  const src         = currentSlot ? (currentSlot.localSrc || currentSlot.url || null) : null

  return (
    <div className={styles.uploadArea_wrapper}>
      <div className={styles.uploadCarousel}>
        {src && (
          <img src={src} alt={`Preview ${previewIndex + 1}`} className={styles.uploadCarouselImage} />
        )}

        {currentSlot?.status === 'uploading' && (
          <div className={styles.uploadOverlay}>
            <div className={styles.uploadProgressRing}>
              <span className={styles.uploadProgressText}>{currentSlot.progress}%</span>
            </div>
          </div>
        )}

        {currentSlot?.status === 'error' && (
          <div
            className={styles.uploadErrorOverlay}
            onClick={() => retrySlot(currentSlot.id)}
            title="Tap to retry"
          >
            <span className="mi" style={{ fontSize: '1.2rem', color: '#fff' }}>refresh</span>
            <span className={styles.uploadErrorLabel}>Retry</span>
          </div>
        )}

        {(currentSlot?.status === 'done' || currentSlot?.status === 'existing') && (
          <div className={styles.uploadDoneBadge}>
            <span className="mi" style={{ fontSize: '0.85rem', color: '#fff' }}>check</span>
          </div>
        )}

        {currentSlot?.status !== 'uploading' && (
          <button
            type="button"
            className={styles.uploadRemoveButton}
            onClick={e => { e.stopPropagation(); removeSlot(previewIndex) }}
          >
            <span className="mi" style={{ fontSize: '1rem' }}>close</span>
          </button>
        )}

        {slots.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrow_left}`}
              onClick={e => { e.stopPropagation(); setPreviewIndex(i => Math.max(0, i - 1)) }}
            >
              <span className="mi">chevron_left</span>
            </button>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrow_right}`}
              onClick={e => { e.stopPropagation(); setPreviewIndex(i => Math.min(slots.length - 1, i + 1)) }}
            >
              <span className="mi">chevron_right</span>
            </button>
          </>
        )}

        <div className={styles.carouselDots}>
          {slots.map((slot, i) => (
            <button
              key={slot.id}
              type="button"
              className={`${styles.carouselDot} ${i === previewIndex ? styles.carouselDot_active : ''} ${slot.status === 'error' ? styles.carouselDot_error : ''}`}
              onClick={e => { e.stopPropagation(); setPreviewIndex(i) }}
            />
          ))}
        </div>

        <div className={styles.uploadCarouselCounter}>{previewIndex + 1} / {slots.length}</div>
      </div>

      <label className={styles.addMoreImagesButton} htmlFor={`upload-more-${cardId}`}>
        <span className="mi" style={{ fontSize: '0.9rem' }}>add_photo_alternate</span>
        Add More Images
        <input
          id={`upload-more-${cardId}`}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => e.target.files.length && handleFilePick(e.target.files)}
        />
      </label>
    </div>
  )
}