
import { useState } from "react"
import { ImageCarousel } from "../ImageCarousel/ImageCarousel"
import { ImageLightbox } from "../ImageLightbox/ImageLightbox"
import { UNIT_FULL,UNIT_SHORT } from "../../../../../../datas/measurementDatas"
import Header from "../../../../../../components/Header/Header"
import styles from "./MeasurementDetailsModal.module.css"



export function MeasurementDetailsModal({ measurement, onClose, onDelete }) {
  
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!measurement) return null

  
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

