
import { useState } from "react"
import styles from "./ImageCarousel.module.css"


export function ImageCarousel({ images, className, onImageClick }) {
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


