import { useState,useEffect,useRef } from "react"
import styles from "./ImageLightbox.module.css"


export function ImageLightbox({ images, startIndex = 0, onClose }) {
  
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
