//
// ─────────────────────────────────────────────────────────────
// Reusable image upload component.
// Handles: file pick → compress → upload to Cloudinary → return URL
//
// Props:
//   value        {string}   - Current image URL (Cloudinary or legacy base64)
//   onChange     {function} - Called with the new Cloudinary URL on success
//   folder       {string}   - Cloudinary folder: 'orders'|'gallery'|'customers'|'invoices'
//   shape        {string}   - 'square' (default) | 'circle'
//   size         {number}   - Width/height in px (default 80)
//   placeholder  {string}   - Material icon name to show when empty
//   label        {string}   - Optional label shown below
//   disabled     {boolean}
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { uploadToCloudinary } from '../../services/cloudinaryService'
import styles from './ImageUploader.module.css'

export default function ImageUploader({
  value       = null,
  onChange,
  folder      = 'general',
  shape       = 'square',
  size        = 80,
  placeholder = 'add_photo_alternate',
  label       = null,
  disabled    = false,
}) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState(null)
  const inputRef = useRef(null)

  const isCircle = shape === 'circle'
  const radius   = isCircle ? '50%' : '10px'

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset
    setError(null)
    setProgress(0)
    setUploading(true)

    try {
      const url = await uploadToCloudinary(file, folder, setProgress)
      onChange?.(url)
    } catch (err) {
      console.error('[ImageUpload]', err)
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
      setProgress(0)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    onChange?.(null)
    setError(null)
  }

  return (
    <div className={styles.wrapper} style={{ width: size, flexShrink: 0 }}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {/* Clickable image box */}
      <div
        className={`${styles.box} ${uploading ? styles.boxUploading : ''} ${disabled ? styles.boxDisabled : ''}`}
        style={{ width: size, height: size, borderRadius: radius }}
        onClick={handleClick}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="upload"
              className={styles.img}
              style={{ borderRadius: radius }}
            />
            {/* Progress overlay during re-upload */}
            {uploading && (
              <div className={styles.progressOverlay} style={{ borderRadius: radius }}>
                <div className={styles.progressRing}>
                  <span className={styles.progressText}>{progress}%</span>
                </div>
              </div>
            )}
            {/* Remove button */}
            {!uploading && !disabled && (
              <button
                className={styles.removeBtn}
                onClick={handleRemove}
                title="Remove image"
              >
                <span className="mi" style={{ fontSize: '0.75rem' }}>close</span>
              </button>
            )}
          </>
        ) : uploading ? (
          <div className={styles.uploadingState}>
            <div className={styles.spinner} />
            <span className={styles.progressLabel}>{progress}%</span>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: size < 60 ? '1.2rem' : '1.6rem', color: 'var(--text3)' }}>
              {placeholder}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      {label && <div className={styles.label}>{label}</div>}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
