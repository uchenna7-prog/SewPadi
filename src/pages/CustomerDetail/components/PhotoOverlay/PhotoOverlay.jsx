import { useEffect } from "react"

export function PhotoOverlay({ open, onClose, photo, initials, name }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.photoOverlay} onClick={onClose}>
      <button className={styles.photoCloseBtn} onClick={onClose} aria-label="Close">
        <span className="mi">close</span>
      </button>
      <div className={styles.photoBig} onClick={e => e.stopPropagation()}>
        {photo
          ? <img src={photo} alt={name} className={styles.photoBigImg} />
          : <span className={styles.photoBigInitials}>{initials}</span>
        }
      </div>
      <div className={styles.photoNameBig}>{name}</div>
    </div>
  )
}

