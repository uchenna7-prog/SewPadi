import styles from './MeasurementRow.module.css'

export function MeasurementRow({ measurement, index, measurementsInGroup, onTap, onDelete }) {

  const isLastInGroup = index === measurementsInGroup.length - 1
  const coverImage = measurement.imgSrcs?.[0] ?? measurement.imgSrc ?? null
  const extraCount = (measurement.imgSrcs?.length ?? (measurement.imgSrc ? 1 : 0)) - 1

  return (
    <div
      className={`${styles.measurementRow} ${isLastInGroup ? styles.measurementRow_last : ''}`}
      onClick={() => onTap(measurement)}
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
          onClick={e => { e.stopPropagation(); onDelete(measurement) }}
        >
          <span className="mi" style={{ fontSize: '1.2rem' }}>delete_outline</span>
        </button>
        <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>chevron_right</span>
      </div>
    </div>
  )
}