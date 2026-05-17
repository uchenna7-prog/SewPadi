import { useState } from "react"
import { createBlankCard } from "../../utils"
import { MultiImageUploader } from "../MultiImageUploader/MultiImageUploader"
import { UNIT_FULL } from "../../../../../../datas/measurementDatas"
import Header from "../../../../../../components/Header/Header"
import styles from "./AddMeasurementModal.module.css"


export function AddMeasurementModal({ isOpen, onClose, onSave }) {

  const [unit, setUnit]  = useState('in')
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
        imgSrcs: card.imgSrcs,            
        imgSrc:  card.imgSrcs[0] ?? null,
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
              <MultiImageUploader
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

