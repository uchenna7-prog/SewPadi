// src/pages/CustomerBodyMeasurements/CustomerBodyMeasurements.jsx

import { useRef, useState, useEffect }    from 'react'
import { useParams }                      from 'react-router-dom'
import { useCustomers }                   from '../../contexts/CustomerContext'
import { useBodyMeasurementImages } from '../../contexts/BodyMeasurementImagesContext'
import Header                             from '../../components/Header/Header'
import styles                             from './CustomerBodyMeasurements.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ── Load image as base64 AND return its natural dimensions ────
// This lets us do proper aspect-ratio fitting in the PDF cell
// instead of blindly stretching to a fixed square.
async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve({
        b64:    canvas.toDataURL('image/jpeg', 0.85),
        width:  img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ── Fit dimensions into a box while preserving aspect ratio ──
// Equivalent to CSS object-fit: contain.
function fitInBox(imgW, imgH, boxW, boxH) {
  const scale = Math.min(boxW / imgW, boxH / imgH)
  return {
    w: imgW * scale,
    h: imgH * scale,
  }
}

// ── Group entries by body zone ────────────────────────────────
const SECTION_ORDER = [
  'Upper Body',
  'Arms',
  'Torso Length',
  'Waist & Lower Torso',
  'Lower Body & Legs',
  'Other',
]

const FIELD_SECTION_MAP = {
  'Neck':            'Upper Body',
  'Shoulder Width':  'Upper Body',
  'Half Shoulder':   'Upper Body',
  'Chest':           'Upper Body',
  'Cross Back':      'Upper Body',
  'Arm Hole':        'Upper Body',
  'Biceps':          'Arms',
  'Arm Length':      'Arms',
  'Sleeve Length':   'Arms',
  'Coat Sleeve':     'Arms',
  'Wrist':           'Arms',
  'Shirt Length':    'Torso Length',
  'Jacket Length':   'Torso Length',
  'Waist':           'Waist & Lower Torso',
  'Hip':             'Waist & Lower Torso',
  'Seat':            'Waist & Lower Torso',
  'Coat Waist':      'Waist & Lower Torso',
  'Crotch':          'Lower Body & Legs',
  'Fly':             'Lower Body & Legs',
  'Inseam':          'Lower Body & Legs',
  'Thighs':          'Lower Body & Legs',
  'Crotch to Knee':  'Lower Body & Legs',
}

function groupEntries(allEntries) {
  const map = {}
  SECTION_ORDER.forEach(s => { map[s] = [] })

  for (const entry of allEntries) {
    const section = FIELD_SECTION_MAP[entry.field] || 'Other'
    if (!map[section]) map[section] = []
    map[section].push(entry)
  }

  // Return only sections that have at least one entry
  return SECTION_ORDER
    .filter(s => map[s].length > 0)
    .map(s => ({ title: s, entries: map[s] }))
}

// ── PDF export ────────────────────────────────────────────────
async function exportPDF(customer, allEntries, imgMap) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload  = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const PAGE_W      = 210
  const PAGE_H      = 297
  const MARGIN      = 16
  const CONTENT_W   = PAGE_W - MARGIN * 2
  const GOLD        = [176, 141, 91]
  const INK         = [26, 26, 26]
  const INK2        = [74, 74, 74]
  const INK3        = [138, 138, 138]
  const RULE        = [216, 216, 216]
  const RULE2       = [239, 239, 239]
  const SURFACE     = [250, 250, 248]

  // Row geometry
  const ROW_H       = 40    // height of each measurement row
  const IMG_BOX     = 40    // square box for the illustration
  const COL_LABEL_W = 68    // label column width (left side of row)
  const COL_VAL_W   = CONTENT_W - COL_LABEL_W - IMG_BOX - 6 // remaining for value (right-aligned)

  // Section title height + bottom gap
  const SECTION_TITLE_H = 10
  const SECTION_GAP     = 6

  // ── Helpers ──────────────────────────────────────────────────

  function drawHeader(pageNum, totalPages) {
    // Dark band
    doc.setFillColor(...INK)
    doc.rect(0, 0, PAGE_W, 22, 'F')

    // Gold accent stripe
    doc.setFillColor(...GOLD)
    doc.rect(0, 22, PAGE_W, 2, 'F')

    // Customer name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text(customer.name + (customer.sex ? `  (${customer.sex})` : ''), MARGIN, 12)

    // Meta line
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(160, 160, 160)
    doc.text('FULL BODY MEASUREMENTS  ·  INCHES', MARGIN, 18.5)

    // Date + page
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    doc.text(dateStr, PAGE_W - MARGIN, 14, { align: 'right' })
    doc.setTextColor(120, 120, 120)
    doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, 19.5, { align: 'right' })
  }

  function drawFooter() {
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.25)
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...INK3)
    doc.text('Generated by SewPadi', MARGIN, PAGE_H - 6)
  }

  function drawSectionTitle(title, y) {
    // Label text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GOLD)
    doc.text(title.toUpperCase(), MARGIN, y + 4)

    // Rule line after title
    const titleWidth = doc.getTextWidth(title.toUpperCase()) + 4
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.25)
    doc.line(MARGIN + titleWidth, y + 3.5, PAGE_W - MARGIN, y + 3.5)
  }

  async function drawRow(entry, y, isLast) {
    const { field, value } = entry
    const imgSrc = imgMap[field] || null

    const rowX = MARGIN

    // Illustration
    if (imgSrc) {
      const result = await loadImage(imgSrc)
      if (result) {
        try {
          const { w, h } = fitInBox(result.width, result.height, IMG_BOX, IMG_BOX)
          const imgX = rowX + (IMG_BOX - w) / 2
          const imgY = y + (ROW_H - h) / 2
          doc.addImage(result.b64, 'JPEG', imgX, imgY, w, h)
        } catch (_) { /* skip broken image */ }
      }
    }

    const textX = rowX + IMG_BOX + 5

    // Field label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...INK3)
    doc.text(field.toUpperCase(), textX, y + ROW_H / 2 - 1)

    // Value — right-aligned
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...INK)
    doc.text(`${value}"`, PAGE_W - MARGIN, y + ROW_H / 2 + 4.5, { align: 'right' })

    // Divider (skip on last row of section)
    if (!isLast) {
      doc.setDrawColor(...RULE2)
      doc.setLineWidth(0.2)
      doc.line(MARGIN + IMG_BOX + 5, y + ROW_H, PAGE_W - MARGIN, y + ROW_H)
    }
  }

  // ── Layout pass: pre-calculate total pages ────────────────
  // We need total pages before drawing so we can stamp "Page X of N"

  const sections = groupEntries(allEntries)
  const HEADER_BOTTOM = 28   // y where content starts after header
  const FOOTER_TOP    = PAGE_H - 14

  function calcTotalPages() {
    let y        = HEADER_BOTTOM
    let pages    = 1

    for (const section of sections) {
      // Section title
      if (y + SECTION_TITLE_H > FOOTER_TOP) { pages++; y = HEADER_BOTTOM }
      y += SECTION_TITLE_H

      for (let i = 0; i < section.entries.length; i++) {
        if (y + ROW_H > FOOTER_TOP) { pages++; y = HEADER_BOTTOM }
        y += ROW_H
      }
      y += SECTION_GAP
    }
    return pages
  }

  const totalPages = calcTotalPages()

  // ── Draw pass ─────────────────────────────────────────────
  let currentPage = 1
  let y           = HEADER_BOTTOM

  drawHeader(currentPage, totalPages)

  for (const section of sections) {
    // Page break before section title if needed
    if (y + SECTION_TITLE_H > FOOTER_TOP) {
      drawFooter()
      doc.addPage()
      currentPage++
      y = HEADER_BOTTOM
      drawHeader(currentPage, totalPages)
    }

    drawSectionTitle(section.title, y)
    y += SECTION_TITLE_H

    for (let i = 0; i < section.entries.length; i++) {
      const entry  = section.entries[i]
      const isLast = i === section.entries.length - 1

      // Page break before row if needed
      if (y + ROW_H > FOOTER_TOP) {
        drawFooter()
        doc.addPage()
        currentPage++
        y = HEADER_BOTTOM
        drawHeader(currentPage, totalPages)
        // Re-draw section title as a continuation header
        drawSectionTitle(section.title + ' (cont.)', y)
        y += SECTION_TITLE_H
      }

      await drawRow(entry, y, isLast)
      y += ROW_H
    }

    y += SECTION_GAP
  }

  drawFooter()

  doc.save(`${customer.name.replace(/\s+/g, '_')}_measurements.pdf`)
}

// ── Edit Measurements Modal ───────────────────────────────────
function EditMeasurementsModal({ isOpen, customer, onClose, onSave }) {
  const { getBodyMeasurementConfig } = useBodyMeasurementImages()

  const sex                       = customer?.sex || ''
  const { fields: measureFields,
          imgMap }                = getBodyMeasurementConfig(sex)
  const knownSet                  = new Set(measureFields)

  const [draft,        setDraft]        = useState({})
  const [customFields, setCustomFields] = useState([])
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    if (!isOpen || !customer) return
    const saved = customer.bodyMeasurements || {}
    const standardDraft = {}
    measureFields.forEach(f => {
      if (saved[f] !== undefined) standardDraft[f] = saved[f]
    })
    setDraft(standardDraft)
    const existing = Object.entries(saved)
      .filter(([k]) => !knownSet.has(k))
      .map(([k, v]) => ({ id: Date.now() + Math.random(), label: k, value: String(v) }))
    setCustomFields(existing)
  }, [isOpen, customer]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateDraft = (field, val) =>
    setDraft(prev => ({ ...prev, [field]: val }))

  const addCustomField = () =>
    setCustomFields(prev => [...prev, { id: Date.now(), label: '', value: '' }])

  const updateCustomField = (id, key, val) =>
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))

  const removeCustomField = (id) =>
    setCustomFields(prev => prev.filter(f => f.id !== id))

  const handleSave = async () => {
    const merged = { ...draft }
    customFields.forEach(f => {
      if (f.label.trim()) merged[f.label.trim()] = f.value
    })
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== '' && v !== undefined)
    )
    setSaving(true)
    try {
      await onSave(cleaned)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!customer) return null

  return (
    <>
      <div className={`${styles.editOverlay} ${isOpen ? styles.editOverlayOpen : ''}`}>

        <div className={styles.editHeader}>
          <button className={styles.editCloseBtn} onClick={onClose}>
            <span className="mi" style={{ fontSize: '1.3rem' }}>close</span>
          </button>
          <span className={styles.editHeaderTitle}>Edit Measurements</span>
          <button className={styles.editSaveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className={styles.editSubheader}>
          {sex ? `${sex} body measurements (inches)` : 'Body measurements (inches)'}
        </div>

        <div className={styles.editBody}>
          {measureFields.map((field, idx) => {
            const imgSrc = imgMap[field] || null
            const isLastImgField = imgSrc &&
              !measureFields.slice(idx + 1).some(f => imgMap[f])

            if (imgSrc) {
              return (
                <div
                  key={field}
                  className={`${styles.editImgRow} ${isLastImgField ? styles.editImgRowLast : ''}`}
                >
                  <img src={imgSrc} alt={field} className={styles.editMeasureImg} />
                  <div className={styles.editImgRight}>
                    <label className={styles.editLabel}>{field}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      className={styles.editInput}
                      placeholder="0"
                      value={draft[field] || ''}
                      onChange={e => updateDraft(field, e.target.value)}
                    />
                  </div>
                </div>
              )
            }

            return (
              <div key={field} className={styles.editTextRow}>
                <label className={styles.editLabel}>{field}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className={styles.editInput}
                  placeholder="0"
                  value={draft[field] || ''}
                  onChange={e => updateDraft(field, e.target.value)}
                />
              </div>
            )
          })}

          {customFields.map(f => (
            <div key={f.id} className={styles.customFieldRow}>
              <div className={styles.customFieldInputs}>
                <input
                  type="text"
                  className={styles.editInput}
                  placeholder="Field name"
                  value={f.label}
                  onChange={e => updateCustomField(f.id, 'label', e.target.value)}
                />
                <input
                  type="number"
                  className={styles.editInput}
                  placeholder="0"
                  inputMode="decimal"
                  value={f.value}
                  onChange={e => updateCustomField(f.id, 'value', e.target.value)}
                />
              </div>
              <button className={styles.removeCustomBtn} onClick={() => removeCustomField(f.id)}>
                <span className="mi" style={{ fontSize: '1.2rem' }}>remove_circle_outline</span>
              </button>
            </div>
          ))}

          <button className={styles.addCustomFieldBtn} onClick={addCustomField}>
            <span className="mi" style={{ fontSize: '1rem' }}>add</span> Add Custom Field
          </button>
        </div>
      </div>

      {isOpen && <div className={styles.editBackdrop} onClick={onClose} />}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function CustomerBodyMeasurements({ onMenuClick }) {
  const { id }   = useParams()
  const { getCustomer, updateCustomer } = useCustomers()
  const { getBodyMeasurementConfig }        = useBodyMeasurementImages()

  const [isScrolled, setIsScrolled] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [exporting,  setExporting]  = useState(false)
  const [toastMsg,   setToastMsg]   = useState('')
  const toastTimer     = useRef(null)
  const topSentinelRef = useRef(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  const customer = getCustomer(id)
  if (!customer) return null

  const sex              = customer.sex || ''
  const bodyMeasurements = customer.bodyMeasurements || {}

  const { fields: orderedFields, imgMap } = getBodyMeasurementConfig(sex)

  const knownEntries = orderedFields
    .filter(f => bodyMeasurements[f] !== undefined && bodyMeasurements[f] !== '')
    .map(f => ({ field: f, value: bodyMeasurements[f] }))

  const knownSet      = new Set(orderedFields)
  const customEntries = Object.entries(bodyMeasurements)
    .filter(([k, v]) => !knownSet.has(k) && v !== undefined && v !== '')
    .map(([k, v]) => ({ field: k, value: v }))

  const allEntries = [...knownEntries, ...customEntries]
  const isEmpty    = allEntries.length === 0

  const handleSaveMeasurements = async (cleaned) => {
    await updateCustomer(id, { bodyMeasurements: cleaned })
    showToast('Measurements saved ✓')
  }

  const handleExport = async () => {
    if (isEmpty || exporting) return
    setExporting(true)
    try {
      await exportPDF(customer, allEntries, imgMap)
    } catch (err) {
      showToast('Export failed. Try again.')
      console.error('[CBM export]', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div ref={topSentinelRef} className={styles.sentinel} />

      <div className={styles.navHeader}>
        <Header
          type="back"
          title={isScrolled ? customer.name : 'Body Measurements'}
          customActions={[
            { icon: 'edit', onClick: () => setEditOpen(true), outlined: true },
            {
              icon:     exporting ? 'hourglass_empty' : 'ios_share',
              onClick:  isEmpty || exporting ? undefined : handleExport,
              outlined: true,
              color:    isEmpty || exporting ? 'var(--text3)' : undefined,
            },
          ]}
        />
      </div>

      <div className={styles.identityStrip}>
        <div className={styles.stripName}>
          {customer.name}{sex ? ` (${sex})` : ''}
        </div>
        <div className={styles.stripSub}>Full body measurements · inches</div>
      </div>

      <div className={styles.scrollArea}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)', opacity: 0.3 }}>
              straighten
            </span>
            <p>No body measurements recorded.</p>
            <span>Tap the button below to add measurements.</span>
            <button className={styles.emptyEditBtn} onClick={() => setEditOpen(true)}>
              <span className="mi" style={{ fontSize: '1rem' }}>edit</span>
              Add Measurements
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {allEntries.map(({ field, value }, idx) => {
              const imgSrc = imgMap[field] || null

              if (imgSrc) {
                const isLastImgRow = !allEntries.slice(idx + 1).some(e => imgMap[e.field])
                return (
                  <div
                    key={field}
                    className={`${styles.imgRow} ${isLastImgRow && customEntries.length === 0 ? styles.imgRowLast : ''}`}
                  >
                    <img src={imgSrc} alt={field} className={styles.measureImg} />
                    <div className={styles.imgRowRight}>
                      <div className={styles.fieldLabel}>{field}</div>
                      <div className={styles.fieldValue}>
                        {value}<span className={styles.unit}>″</span>
                      </div>
                    </div>
                  </div>
                )
              }

              const isLast = idx === allEntries.length - 1
              return (
                <div
                  key={field}
                  className={`${styles.textRow} ${isLast ? styles.textRowLast : ''}`}
                >
                  <div className={styles.fieldLabel}>{field}</div>
                  <div className={styles.fieldValue}>
                    {value}<span className={styles.unit}>″</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <EditMeasurementsModal
        isOpen={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveMeasurements}
      />

      <div className={`${styles.toast} ${toastMsg ? styles.toastShow : ''}`}>
        {toastMsg}
      </div>

    </div>
  )
}