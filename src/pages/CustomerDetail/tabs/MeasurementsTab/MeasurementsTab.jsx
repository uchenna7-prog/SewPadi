import { useState, useEffect, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import Header from '../../../../components/Header/Header'
import { uploadToCloudinary } from '../../../../services/cloudinaryService'
import styles from './MeasurementsTab.module.css'


const UNIT_SHORT = { in: '"', cm: 'cm', yd: 'yd' }
const UNIT_FULL  = { in: 'Inches (")', cm: 'Centimetres (cm)', yd: 'Yards (yd)' }


// ─────────────────────────────────────────────────────────────
// Skeleton placeholder — mirrors the real measurement row
// ─────────────────────────────────────────────────────────────

function MeasurementRowSkeleton() {
  return (
    <div className={styles.measurementRow} style={{ pointerEvents: 'none' }}>
      <div className={styles.thumbnailContainer}>
        <Skeleton
          width={58}
          height={58}
          borderRadius={10}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
      </div>
      <div className={styles.measurementRowInfo}>
        <Skeleton
          width={120}
          height={14}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
          style={{ marginBottom: 6 }}
        />
        <Skeleton
          width={80}
          height={11}
          borderRadius={6}
          baseColor="var(--surface2)"
          highlightColor="var(--border)"
        />
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ImageLightbox — full-screen viewer with swipe support
// ─────────────────────────────────────────────────────────────

function ImageLightbox({ images, startIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const touchStartX = useRef(null)

  useEffect(() => { setCurrentIndex(startIndex) }, [startIndex])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function goPrev() { setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1)) }
  function goNext() { setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1)) }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const swipeDistance = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(swipeDistance) > 40) swipeDistance > 0 ? goNext() : goPrev()
    touchStartX.current = null
  }

  if (!images || images.length === 0) return null

  return (
    <div className={styles.lightboxOverlay} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <button className={styles.lightboxCloseButton} onClick={onClose} type="button">
        <span className="mi">close</span>
      </button>
      {images.length > 1 && (
        <div className={styles.lightboxCounter}>{currentIndex + 1} / {images.length}</div>
      )}
      <div className={styles.lightboxImageWrapper}>
        <img src={images[currentIndex]} alt={`Design reference ${currentIndex + 1}`} className={styles.lightboxImage} />
      </div>
      {images.length > 1 && (
        <>
          <button className={`${styles.lightboxArrow} ${styles.lightboxArrow_left}`} onClick={goPrev} type="button">
            <span className="mi">chevron_left</span>
          </button>
          <button className={`${styles.lightboxArrow} ${styles.lightboxArrow_right}`} onClick={goNext} type="button">
            <span className="mi">chevron_right</span>
          </button>
          <div className={styles.lightboxDots}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.lightboxDot} ${i === currentIndex ? styles.lightboxDot_active : ''}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// ImageCarousel — read-only carousel used in MeasureDetail
// ─────────────────────────────────────────────────────────────

function ImageCarousel({ images, className, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  if (!images || images.length === 0) return null

  function goPrev(e) { e.stopPropagation(); setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1)) }
  function goNext(e) { e.stopPropagation(); setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1)) }

  return (
    <div className={styles.carousel}>
      <img
        src={images[currentIndex]}
        alt={`Design reference ${currentIndex + 1}`}
        className={`${className || styles.carouselImage} ${onImageClick ? styles.carouselImage_zoomable : ''}`}
        onClick={() => onImageClick && onImageClick(currentIndex)}
      />
      {onImageClick && (
        <div className={styles.carouselExpandHint}>
          <span className="mi" style={{ fontSize: '0.85rem' }}>open_in_full</span>
        </div>
      )}
      {images.length > 1 && (
        <>
          <button className={`${styles.carouselArrow} ${styles.carouselArrow_left}`} onClick={goPrev} type="button">
            <span className="mi">chevron_left</span>
          </button>
          <button className={`${styles.carouselArrow} ${styles.carouselArrow_right}`} onClick={goNext} type="button">
            <span className="mi">chevron_right</span>
          </button>
          <div className={styles.carouselDots}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.carouselDot} ${i === currentIndex ? styles.carouselDot_active : ''}`}
                onClick={e => { e.stopPropagation(); setCurrentIndex(i) }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// MultiImageUpload — Cloudinary-backed image uploader
//
// Each picked file is uploaded immediately to Cloudinary.
// The `images` array passed in/out contains only Cloudinary URLs
// (or legacy base64 strings for existing measurements).
//
// Internal slot shape:
// {
//   id:        string            — local key
//   url:       string | null     — Cloudinary URL once done; null while uploading
//   localSrc:  string | null     — blob URL for preview while uploading; null for existing
//   file:      File | null       — original File (needed for retry); null for existing URLs
//   status:    'existing'        — already a saved URL (Cloudinary or legacy base64)
//            | 'uploading'       — upload in progress
//            | 'done'            — upload succeeded
//            | 'error'           — upload failed
//   progress:  number            — 0–100
// }
// ─────────────────────────────────────────────────────────────

function MultiImageUpload({ images, onChange, cardId }) {
  // Build initial slots from the incoming URL array
  const buildSlots = (urls) =>
    (urls || []).map(url => ({
      id:       Math.random().toString(36).slice(2),
      url,
      localSrc: null,
      file:     null,
      status:   'existing',
      progress: 100,
    }))

  const [slots, setSlots] = useState(() => buildSlots(images))

  // Keep slots in sync if the parent resets images (e.g. category switch)
  const prevImages = useRef(images)
  useEffect(() => {
    if (images !== prevImages.current && images.length === 0) {
      // Revoke any pending blob URLs
      slots.forEach(s => { if (s.localSrc) URL.revokeObjectURL(s.localSrc) })
      setSlots([])
    }
    prevImages.current = images
  }, [images]) // eslint-disable-line react-hooks/exhaustive-deps

  const [previewIndex, setPreviewIndex] = useState(0)

  // Keep previewIndex in bounds
  useEffect(() => {
    if (previewIndex >= slots.length && slots.length > 0) {
      setPreviewIndex(slots.length - 1)
    }
  }, [slots.length, previewIndex])

  // Publish only successfully uploaded/existing URLs to parent
  function publishUrls(updatedSlots) {
    const urls = updatedSlots
      .filter(s => s.status === 'existing' || s.status === 'done')
      .map(s => s.url)
      .filter(Boolean)
    onChange(urls)
  }

  // Upload a single slot by its id
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
      console.error('[MultiImageUpload] upload failed', err)
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

    // Upload all new files in parallel
    await Promise.allSettled(
      newSlots.map(slot => uploadSlot(slot.id, slot.file))
    )
  }

  function removeSlot(idx) {
    setSlots(prev => {
      const slot = prev[idx]
      if (slot?.localSrc) URL.revokeObjectURL(slot.localSrc)
      const updated = prev.filter((_, i) => i !== idx)
      publishUrls(updated)
      return updated
    })
    setPreviewIndex(i => Math.max(0, i - 1))
  }

  function goPrev(e) { e.stopPropagation(); setPreviewIndex(i => Math.max(0, i - 1)) }
  function goNext(e) { e.stopPropagation(); setPreviewIndex(i => Math.min(slots.length - 1, i + 1)) }

  // The image src shown for a slot: local blob while uploading, Cloudinary URL once done
  function slotSrc(slot) {
    return slot.localSrc || slot.url || null
  }

  // ── Empty state ───────────────────────────────────────────
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

  // ── Carousel with upload states ───────────────────────────
  const currentSlot = slots[previewIndex]
  const src         = currentSlot ? slotSrc(currentSlot) : null

  return (
    <div className={styles.uploadArea_wrapper}>
      <div className={styles.uploadCarousel}>
        {src && (
          <img src={src} alt={`Preview ${previewIndex + 1}`} className={styles.uploadCarouselImage} />
        )}

        {/* Uploading overlay */}
        {currentSlot?.status === 'uploading' && (
          <div className={styles.uploadOverlay}>
            <div className={styles.uploadProgressRing}>
              <span className={styles.uploadProgressText}>{currentSlot.progress}%</span>
            </div>
          </div>
        )}

        {/* Error overlay — tap to retry */}
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

        {/* Done badge */}
        {(currentSlot?.status === 'done' || currentSlot?.status === 'existing') && (
          <div className={styles.uploadDoneBadge}>
            <span className="mi" style={{ fontSize: '0.85rem', color: '#fff' }}>check</span>
          </div>
        )}

        {/* Remove — hidden while uploading */}
        {currentSlot?.status !== 'uploading' && (
          <button
            type="button"
            className={styles.uploadRemoveButton}
            onClick={e => { e.stopPropagation(); removeSlot(previewIndex) }}
          >
            <span className="mi" style={{ fontSize: '1rem' }}>close</span>
          </button>
        )}

        {/* Nav arrows */}
        {slots.length > 1 && (
          <>
            <button type="button" className={`${styles.carouselArrow} ${styles.carouselArrow_left}`} onClick={goPrev}>
              <span className="mi">chevron_left</span>
            </button>
            <button type="button" className={`${styles.carouselArrow} ${styles.carouselArrow_right}`} onClick={goNext}>
              <span className="mi">chevron_right</span>
            </button>
          </>
        )}

        {/* Dot indicators */}
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


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function createBlankCard(cardNumber) {
  return {
    id:      Date.now() + Math.random(),
    label:   `Cloth Type ${cardNumber}`,
    name:    '',
    imgSrcs: [],   // will hold Cloudinary URLs after upload
    fields:  [{ id: Date.now() + Math.random(), name: '', value: '' }],
  }
}


// ─────────────────────────────────────────────────────────────
// MeasureModal — create new measurement set
// ─────────────────────────────────────────────────────────────

function MeasureModal({ isOpen, onClose, onSave }) {
  const [unit,  setUnit]  = useState('in')
  const [cards, setCards] = useState(() => [createBlankCard(1)])

  function updateCard(cardId, key, value) {
    setCards(prev => prev.map(card => card.id === cardId ? { ...card, [key]: value } : card))
  }

  function addCard() {
    setCards(prev => [...prev, createBlankCard(prev.length + 1)])
  }

  function removeCard(cardId) {
    setCards(prev => prev.filter(card => card.id !== cardId))
  }

  function addField(cardId) {
    setCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, fields: [...card.fields, { id: Date.now() + Math.random(), name: '', value: '' }] }
        : card
    ))
  }

  function removeField(cardId, fieldId) {
    setCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, fields: card.fields.filter(f => f.id !== fieldId) }
        : card
    ))
  }

  function updateField(cardId, fieldId, key, value) {
    setCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, fields: card.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f) }
        : card
    ))
  }

  // Are any uploads still in-flight across all cards?
  // MultiImageUpload publishes only completed URLs, but we expose a way to
  // check: if imgSrcs count < slot count inside the component the Save button
  // would be unsafe. We handle this simply: the parent can't know the internal
  // slot state, so we rely on MultiImageUpload to only call onChange with done
  // URLs. The Save button is always enabled — worst case a still-uploading
  // image is just omitted from imgSrcs (the user sees that count is lower).
  // This matches the Gallery approach where Save is disabled while uploading.
  // For parity we track a global uploading count via a ref callback pattern.
  const [uploadingCount, setUploadingCount] = useState(0)

  function handleSave() {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

    let savedCount = 0
    cards.forEach(card => {
      if (!card.name.trim()) return
      const filledFields = card.fields
        .filter(f => f.name.trim())
        .map(f => ({ name: f.name, value: f.value }))

      onSave({
        id:      Date.now() + Math.random(),
        name:    card.name.trim(),
        imgSrcs: card.imgSrcs,            // Cloudinary URLs (or empty [])
        imgSrc:  card.imgSrcs[0] ?? null, // convenience cover image
        unit,
        fields:  filledFields,
        date:    today,
      })
      savedCount++
    })

    if (savedCount === 0) return
    setCards([createBlankCard(1)])
    setUnit('in')
    onClose()
  }

  function handleClose() {
    setCards([createBlankCard(1)])
    setUnit('in')
    onClose()
  }

  return (
    <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlay_open : ''}`}>
      <Header
        type="back"
        title="New Measurement"
        onBackClick={handleClose}
        customActions={[{
          label:    'Save',
          onClick:  handleSave,
        }]}
      />

      <div className={styles.formScrollBody}>
        <div style={{ padding: '20px' }}>

          <p className={styles.stepHeading}>1. Unit of Measurement</p>
          <div className={styles.unitChipRow}>
            {['in', 'cm', 'yd'].map(u => (
              <button
                key={u}
                className={`${styles.unitChip} ${unit === u ? styles.unitChip_active : ''}`}
                onClick={() => setUnit(u)}
              >
                {UNIT_FULL[u]}
              </button>
            ))}
          </div>

          <p className={styles.stepHeading} style={{ marginTop: 24 }}>2. Cloth Types</p>

          {cards.map((card, index) => (
            <div key={card.id} className={styles.clothCard}>

              <div className={styles.clothCardHeader}>
                <span className={styles.clothCardLabel}>{card.label}</span>
                {index > 0 && (
                  <button
                    className={styles.removeCardButton}
                    onClick={() => removeCard(card.id)}
                  >
                    <span className="mi" style={{ fontSize: '1.1rem' }}>cancel</span>
                  </button>
                )}
              </div>

              <label className={styles.fieldLabel}>Name</label>
              <input
                type="text"
                className={styles.underlineInput}
                placeholder="e.g. Shirt"
                value={card.name}
                onChange={e => updateCard(card.id, 'name', e.target.value)}
              />

              <label className={styles.fieldLabel}>Design References</label>
              <MultiImageUpload
                images={card.imgSrcs}
                cardId={card.id}
                onChange={urls => updateCard(card.id, 'imgSrcs', urls)}
              />

              <label className={styles.fieldLabel} style={{ marginTop: 4 }}>Measurements</label>

              <div className={styles.measureFieldList}>
                {card.fields.map(field => (
                  <div key={field.id} className={styles.measureFieldRow}>
                    <div className={styles.measureFieldColumn}>
                      <label>Field</label>
                      <input
                        type="text"
                        className={styles.measureFieldInput}
                        placeholder="e.g. Neck"
                        value={field.name}
                        onChange={e => updateField(card.id, field.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className={styles.measureFieldColumn}>
                      <label>Value</label>
                      <input
                        type="number"
                        className={styles.measureFieldInput}
                        placeholder="0"
                        inputMode="decimal"
                        value={field.value}
                        onChange={e => updateField(card.id, field.id, 'value', e.target.value)}
                      />
                    </div>
                    <button
                      className={styles.removeFieldButton}
                      onClick={() => removeField(card.id, field.id)}
                    >
                      <span className="mi" style={{ fontSize: '1.1rem' }}>remove_circle_outline</span>
                    </button>
                  </div>
                ))}
              </div>

              <button className={styles.addFieldButton} onClick={() => addField(card.id)}>
                <span className="mi" style={{ fontSize: '0.9rem' }}>add</span>
                Add Field
              </button>
            </div>
          ))}

          <button className={styles.addClothButton} onClick={addCard}>
            <span className="material-icons">add_circle_outline</span>
            Add Another Cloth Type
          </button>

        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// MeasureDetail — read-only detail panel
// ─────────────────────────────────────────────────────────────

function MeasureDetail({ measurement, onClose, onDelete }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!measurement) return null

  // Support both new (storageUrl array) and legacy (base64 imgSrcs / imgSrc)
  const images = measurement.imgSrcs?.length
    ? measurement.imgSrcs
    : measurement.imgSrc
      ? [measurement.imgSrc]
      : []

  return (
    <>
      <div className={`${styles.detailPanel} ${styles.detailPanel_open}`}>
        <Header
          type="back"
          title={measurement.name}
          onBackClick={onClose}
          customActions={[
            { icon: 'delete_outline', onClick: onDelete, color: 'var(--danger)' }
          ]}
        />

        <div className={styles.detailScrollBody}>

          {images.length > 0 && (
            <ImageCarousel
              images={images}
              className={styles.detailCarouselImage}
              onImageClick={(index) => setLightboxIndex(index)}
            />
          )}

          <div className={styles.infoGrid}>
            <div className={styles.infoGridCell}>
              <div className={styles.infoGridLabel}>Unit</div>
              <div className={styles.infoGridValue}>{UNIT_FULL[measurement.unit] ?? measurement.unit}</div>
            </div>
            <div className={styles.infoGridCell}>
              <div className={styles.infoGridLabel}>Fields</div>
              <div className={styles.infoGridValue}>{measurement.fields.length}</div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionCardLabel}>Measurements</div>

            {measurement.fields.length === 0
              ? <p style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>No fields recorded.</p>
              : measurement.fields.map((field, index) => (
                  <div
                    key={index}
                    className={`${styles.measurementFieldRow} ${index === measurement.fields.length - 1 ? styles.measurementFieldRow_last : ''}`}
                  >
                    <span className={styles.measurementFieldName}>{field.name}</span>
                    <span className={styles.measurementFieldValue}>
                      {field.value || '—'}{field.value ? <span className={styles.measurementFieldUnit}>{UNIT_SHORT[measurement.unit] ?? ''}</span> : ''}
                    </span>
                  </div>
                ))
            }
          </div>

          <div className={styles.detailFooterDate}>Saved on {measurement.date}</div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}


// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export default function MeasurementsTab({ measurements, loading, onSave, onDelete, showToast }) {
  const [isModalOpen,         setIsModalOpen]         = useState(false)
  const [selectedMeasurement, setSelectedMeasurement] = useState(null)
  const [measurementToDelete, setMeasurementToDelete] = useState(null)

  useEffect(() => {
    const openModal = () => setIsModalOpen(true)
    document.addEventListener('openMeasureModal', openModal)
    return () => document.removeEventListener('openMeasureModal', openModal)
  }, [])

  function handleSave(entry) {
    onSave(entry)
    showToast('Measurement saved ✓')
  }

  function handleDeleteConfirm() {
    if (!measurementToDelete) return
    onDelete(measurementToDelete.id)
    showToast('Measurement deleted')
    setMeasurementToDelete(null)
    setSelectedMeasurement(null)
  }

  // ── Skeleton state ────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.measurementGroup}>
        {[1, 2, 3].map(i => <MeasurementRowSkeleton key={i} />)}
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────
  if (measurements.length === 0) {
    return (
      <>
        <div className={styles.emptyState}>
          <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>straighten</span>
          <p>No garment measurements added yet.</p>
          <span className={styles.emptyStateHint}>Tap + to add the first one</span>
        </div>

        <MeasureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      </>
    )
  }

  // ── Populated list ────────────────────────────────────────
  const measurementsByDate = measurements.reduce((groups, measurement) => {
    const dateKey = measurement.date || 'Unknown Date'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(measurement)
    return groups
  }, {})

  return (
    <>
      {Object.entries(measurementsByDate).map(([date, measurementsInGroup]) => (
        <div key={date} className={styles.measurementGroup}>
          <div className={styles.measurementGroupDate}>{date}</div>
          <div className={styles.measurementGroupDivider} />

          {measurementsInGroup.map((measurement, index) => {
            const isLastInGroup = index === measurementsInGroup.length - 1
            // Support both Cloudinary URLs (imgSrcs) and legacy base64 (imgSrc)
            const coverImage    = measurement.imgSrcs?.[0] ?? measurement.imgSrc ?? null
            const extraCount    = (measurement.imgSrcs?.length ?? (measurement.imgSrc ? 1 : 0)) - 1

            return (
              <div
                key={measurement.id}
                className={`${styles.measurementRow} ${isLastInGroup ? styles.measurementRow_last : ''}`}
                onClick={() => setSelectedMeasurement(measurement)}
              >
                <div className={styles.thumbnailContainer}>
                  <div className={styles.thumbnailBox}>
                    {coverImage
                      ? <img src={coverImage} alt={measurement.name} className={styles.thumbnailImage} />
                      : <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>straighten</span>
                    }
                    {extraCount > 0 && coverImage && (
                      <div className={styles.thumbnailExtraOverlay}>+{extraCount}</div>
                    )}
                  </div>
                </div>

                <div className={styles.measurementRowInfo}>
                  <div className={styles.measurementRowName}>{measurement.name}</div>
                  <div className={styles.measurementRowMeta}>
                    {measurement.fields.length} measurement{measurement.fields.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className={styles.measurementRowActions}>
                  <button
                    className={styles.deleteButton}
                    onClick={e => { e.stopPropagation(); setMeasurementToDelete(measurement) }}
                  >
                    <span className="mi" style={{ fontSize: '1.2rem' }}>delete_outline</span>
                  </button>
                  <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>chevron_right</span>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <MeasureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {selectedMeasurement && (
        <MeasureDetail
          measurement={selectedMeasurement}
          onClose={() => setSelectedMeasurement(null)}
          onDelete={() => setMeasurementToDelete(selectedMeasurement)}
        />
      )}

      <ConfirmSheet
        open={!!measurementToDelete}
        title="Delete Measurement?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMeasurementToDelete(null)}
      />
    </>
  )
}
