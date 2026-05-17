import { useState, useEffect } from 'react'
import { EmptyState } from './components/EmptyState/EmptyState'
import { MeasurementRow } from './components/MeasurementRow/MeasurementRow'
import { MeasurementDetailsModal } from './components/MeasurementDetailsModal/MeasurementDetailsModal'
import { MeasurementRowSkeleton } from './components/MeasurementRowSkeleton/MeasurementRowSkeleton'
import { AddMeasurementModal } from './components/AddMeasurementModal/AddMeasurementModal'
import { groupMeasurementsByDate } from './utils'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import styles from './MeasurementsTab.module.css'



export default function MeasurementsTab({ measurements, loading, onSave, onDelete, showToast }) {

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMeasurement, setSelectedMeasurement] = useState(null)
  const [measurementToDelete, setMeasurementToDelete] = useState(null)

  useEffect(() => {
    const handleOpenAddModal = () => setIsAddModalOpen(true)
    document.addEventListener('openAddMeasurementModal', handleOpenAddModal)
    return () => document.removeEventListener('openAddMeasurementModal', handleOpenAddModal)
  }, [])


  function handleSave(entry) {
    onSave(entry)
    showToast('Measurement saved ✓')
    setIsAddModalOpen(false)
  }

  function handleCardTap(measurement) {
    setSelectedMeasurement(measurement)
  }

  function handleRequestDelete(measurement) {
    setSelectedMeasurement(null)
    setMeasurementToDelete(measurement)
  }

  function handleDeleteConfirm() {
    if (!measurementToDelete) return
    onDelete(measurementToDelete.id)
    showToast('Measurement deleted')
    setMeasurementToDelete(null)
  }

  function handleDeleteCancel() {
    setMeasurementToDelete(null)
  }


  if (loading) {
    return (
      <div className={styles.measurementGroup}>
        {[1, 2, 3].map(i => <MeasurementRowSkeleton key={i} />)}
      </div>
    )
  }

  const measurementsByDate = groupMeasurementsByDate(measurements)

  return (
    <div>
      {measurements.length === 0 ? (
        <EmptyState />
      ) : (
        Object.entries(measurementsByDate).map(([date, measurementsInGroup]) => (
          <div key={date} className={styles.measurementGroup}>
            <div className={styles.measurementGroupDate}>{date}</div>
            <div className={styles.measurementGroupDivider} />

            {measurementsInGroup.map((measurement, index) => (
              <MeasurementRow
                key={measurement.id ?? index}
                measurement={measurement}
                measurementsInGroup={measurementsInGroup}
                index={index}
                onTap={handleCardTap}
                onDelete={handleRequestDelete}
              />
            ))}
          </div>
        ))
      )}

      <AddMeasurementModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSave}
      />

      {selectedMeasurement && (
        <MeasurementDetailsModal
          measurement={selectedMeasurement}
          onClose={() => setSelectedMeasurement(null)}
          onDelete={() => handleRequestDelete(selectedMeasurement)}
        />
      )}

      <ConfirmSheet
        open={!!measurementToDelete}
        title="Delete Measurement?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}