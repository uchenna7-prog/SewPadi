import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { usePremium } from '../../contexts/PremiumContext'
import { useBodyMeasurementImages } from '../../contexts/BodyMeasurementImagesContext'
import { uploadToCloudinary } from '../../services/cloudinaryService'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import styles from './Customers.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'
import { getInitials, getBirthdayStr} from './utils'



function ConfirmSheet({ customer, onConfirm, onCancel }) {
  if (!customer) return null
  return (
    <div className={styles.confirmOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.confirmSheet}>
        <h4>Delete Client?</h4>
        <p>"{customer.name}" will be permanently removed.</p>
        <div className={styles.confirmActions}>
          <button className={styles.btnConfirmDel} onClick={onConfirm}>Delete</button>
          <button className={styles.btnConfirmCancel} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Premium Gate Bottom Sheet ─────────────────────────────────
function PremiumSheet({ onClose }) {
  return (
    <div className={styles.confirmOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.confirmSheet}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>workspace_premium</span>
        </div>
        <h4 style={{ textAlign: 'center' }}>Premium Feature</h4>
        <p style={{ textAlign: 'center' }}>
          Uploading client profile photos is a Premium feature. Upgrade to TailorFlow Pro to unlock photo uploads, branded invoices, and more.
        </p>
        <div className={styles.confirmActions}>
          <button
            className={styles.btnConfirmDel}
            style={{ background: 'var(--accent)' }}
            onClick={onClose}
          >
            <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 6 }}>workspace_premium</span>
            Upgrade to Pro
          </button>
          <button className={styles.btnConfirmCancel} onClick={onClose}>Maybe Later</button>
        </div>
      </div>
    </div>
  )
}

// ── Country Code Picker ───────────────────────────────────────
const DEFAULT_COUNTRY = { name: 'Nigeria', dial_code: '+234', flag: '🇳🇬' }

function CountryCodePicker({ selected, onSelect }) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const [countries, setCountries] = useState([])
  const [loading, setLoading]     = useState(false)
  const dropdownRef               = useRef(null)

  useEffect(() => {
    if (!open || countries.length > 0) return
    setLoading(true)
    fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2')
      .then(r => r.json())
      .then(data => {
        const list = []
        data.forEach(c => {
          const root   = c.idd?.root || ''
          const suffix = c.idd?.suffixes
          if (!root) return
          const suffixes = Array.isArray(suffix) && suffix.length === 1 ? suffix : (suffix || [''])
          suffixes.forEach(s => {
            const dial_code = root + s
            list.push({ name: c.name?.common || '', dial_code, flag: c.flag || '', cca2: c.cca2 || '' })
          })
        })
        list.sort((a, b) => a.name.localeCompare(b.name))
        setCountries(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, countries.length])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search.trim()
    ? countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial_code.includes(search)
      )
    : countries

  const handleSelect = (country) => {
    onSelect(country)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className={styles.ccPickerWrap} ref={dropdownRef}>
      <button
        type="button"
        className={styles.ccBtn}
        onClick={() => setOpen(v => !v)}
      >
        <span className={styles.ccFlag}>{selected.flag}</span>
        <span className={styles.ccCode}>{selected.dial_code}</span>
        <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>expand_more</span>
      </button>

      {open && (
        <div className={styles.ccDropdown}>
          <div className={styles.ccSearchWrap}>
            <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>search</span>
            <input
              autoFocus
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.ccSearchInput}
            />
          </div>
          <div className={styles.ccList}>
            {loading && (
              <div className={styles.ccListEmpty}>Loading countries…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className={styles.ccListEmpty}>No results</div>
            )}
            {!loading && filtered.map((c, i) => (
              <button
                key={`${c.cca2}-${c.dial_code}-${i}`}
                type="button"
                className={`${styles.ccOption} ${selected.dial_code === c.dial_code && selected.name === c.name ? styles.ccOptionActive : ''}`}
                onClick={() => handleSelect(c)}
              >
                <span className={styles.ccFlag}>{c.flag}</span>
                <span className={styles.ccOptionName}>{c.name}</span>
                <span className={styles.ccOptionCode}>{c.dial_code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Phone number formatting/validation helper ─────────────────
function buildPhoneNumber(localNumber, countryDialCode) {
  const digits = localNumber.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${countryDialCode} ${digits.slice(1)}`
  }
  if (digits.length === 10) {
    return `${countryDialCode} ${digits}`
  }
  return null
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1)

// ── Add Customer Form ─────────────────────────────────────────
function AddCustomerForm({ isOpen, onClose, onSave, isPremium }) {
  const { getBodyMeasurementConfig } = useBodyMeasurementImages()

  const [formTab,          setFormTab]          = useState('personal')
  const [name,             setName]             = useState('')
  const [localPhone,       setLocalPhone]       = useState('')
  const [selectedCountry,  setSelectedCountry]  = useState(DEFAULT_COUNTRY)
  const [phoneType,        setPhoneType]        = useState('Mobile')
  const [sex,              setSex]              = useState('')
  const [bdayDay,          setBdayDay]          = useState('')
  const [bdayMonth,        setBdayMonth]        = useState('')
  const [email,            setEmail]            = useState('')
  const [address,          setAddress]          = useState('')
  const [notes,            setNotes]            = useState('')

  // Photo state — separate local preview (blob URL) from the saved Cloudinary URL
  const [photoLocalSrc,    setPhotoLocalSrc]    = useState(null)   // blob URL for preview
  const [photoUrl,         setPhotoUrl]         = useState(null)   // Cloudinary URL (or null)
  const [photoUploading,   setPhotoUploading]   = useState(false)
  const [photoProgress,    setPhotoProgress]    = useState(0)
  const [photoError,       setPhotoError]       = useState(null)

  const [showPremiumSheet, setShowPremiumSheet] = useState(false)
  const fileInputRef = useRef(null)

  const [bodyMeasurements, setBodyMeasurements] = useState({})
  const [customFields,     setCustomFields]     = useState([])
  const [sexError,         setSexError]         = useState(false)
  const [formInlineMsg,    setFormInlineMsg]    = useState(null)
  const formInlineMsgTimer                      = useRef(null)

  const initials        = getInitials(name) || '+'
  const { fields: measureFields,
          imgMap }      = getBodyMeasurementConfig(sex)
  const hasMeasurements = Object.values(bodyMeasurements).some(v => v !== '' && v !== undefined && v !== '0' && v !== 0)
    || customFields.some(f => f.label.trim() && f.value !== '')

  const showInlineMsg = (text, ok = true) => {
    setFormInlineMsg({ text, ok })
    clearTimeout(formInlineMsgTimer.current)
    formInlineMsgTimer.current = setTimeout(() => setFormInlineMsg(null), 2600)
  }

  const handlePhotoPicker = () => {
    if (!isPremium) { setShowPremiumSheet(true); return }
    // Don't allow re-picking while upload is in progress
    if (photoUploading) return
    fileInputRef.current?.click()
  }

  // Upload immediately on file selection
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = ''

    // Show local preview instantly via blob URL
    const blobUrl = URL.createObjectURL(file)
    setPhotoLocalSrc(blobUrl)
    setPhotoUrl(null)
    setPhotoError(null)
    setPhotoProgress(0)
    setPhotoUploading(true)

    try {
      const url = await uploadToCloudinary(file, 'customers', (pct) => setPhotoProgress(pct))
      setPhotoUrl(url)
    } catch (err) {
      console.error('[Customers] photo upload failed', err)
      setPhotoError('Upload failed. Tap photo to retry.')
      setPhotoUrl(null)
    } finally {
      setPhotoUploading(false)
      setPhotoProgress(0)
    }
  }

  const handlePhotoRetry = () => {
    // Re-open file picker to pick again; the blob URL for the failed file is
    // still shown as the preview. We just let them pick fresh.
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const removePhoto = (e) => {
    e.stopPropagation()
    if (photoLocalSrc) URL.revokeObjectURL(photoLocalSrc)
    setPhotoLocalSrc(null)
    setPhotoUrl(null)
    setPhotoError(null)
    setPhotoUploading(false)
    setPhotoProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateBodyMeasure = (field, val) => {
    setBodyMeasurements(prev => ({ ...prev, [field]: val }))
  }

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: Date.now(), label: '', value: '' }])
  }

  const updateCustomField = (id, key, val) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))
  }

  const removeCustomField = (id) => {
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  const handleClose = () => {
    if (photoLocalSrc) URL.revokeObjectURL(photoLocalSrc)
    setName(''); setLocalPhone(''); setSelectedCountry(DEFAULT_COUNTRY)
    setPhoneType('Mobile'); setSex('')
    setBdayDay(''); setBdayMonth(''); setEmail(''); setAddress('')
    setNotes('')
    setPhotoLocalSrc(null); setPhotoUrl(null); setPhotoError(null)
    setPhotoUploading(false); setPhotoProgress(0)
    setBodyMeasurements({}); setCustomFields([])
    setFormTab('personal'); setSexError(false); setFormInlineMsg(null)
    clearTimeout(formInlineMsgTimer.current)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleSave = () => {
    // ── Phase 1: Personal Info tab ─────────────────────────────
    if (formTab === 'personal') {
      if (!name)  { showInlineMsg('Name is required', false); return }
      if (!sex)   { setSexError(true); showInlineMsg('Please select a sex', false); return }
      const builtPhone = buildPhoneNumber(localPhone, selectedCountry.dial_code)
      if (!localPhone.trim()) { showInlineMsg('Phone number is required', false); return }
      if (builtPhone === null) { showInlineMsg('Phone must be 10 digits (or 11 starting with 0)', false); return }
      // Block proceeding while photo is still uploading
      if (photoUploading) { showInlineMsg('Photo still uploading, please wait…', false); return }
      showInlineMsg('Personal info saved ✓', true)
      setFormTab('body')
      return
    }

    // ── Phase 2: Body Measurements tab ─────────────────────────
    if (photoUploading) { showInlineMsg('Photo still uploading, please wait…', false); return }

    const allBody    = { ...bodyMeasurements }
    customFields.forEach(f => { if (f.label.trim()) allBody[f.label.trim()] = f.value })
    const birthday   = bdayMonth && bdayDay ? `${bdayMonth}-${bdayDay}` : ''
    const builtPhone = buildPhoneNumber(localPhone, selectedCountry.dial_code)
    if (localPhone.trim() && builtPhone === null) {
      onSave({ name, phone: '__INVALID_PHONE__', phoneType, sex, birthday, email, address, notes, photo: photoUrl, bodyMeasurements: allBody })
      return
    }
    const phone = builtPhone || ''
    // Pass the Cloudinary URL (photoUrl), not the blob (photoLocalSrc)
    onSave({ name, phone, phoneType, sex, birthday, email, address, notes, photo: photoUrl, bodyMeasurements: allBody })
    handleClose()
  }

  const handleSkip = () => {
    if (photoUploading) { showInlineMsg('Photo still uploading, please wait…', false); return }
    const birthday   = bdayMonth && bdayDay ? `${bdayMonth}-${bdayDay}` : ''
    const builtPhone = buildPhoneNumber(localPhone, selectedCountry.dial_code)
    const phone      = builtPhone || ''
    onSave({ name, phone, phoneType, sex, birthday, email, address, notes, photo: photoUrl, bodyMeasurements: {} })
    handleClose()
  }

  const phoneDigits = localPhone.replace(/\D/g, '')
  const phoneHint = (() => {
    if (!phoneDigits) return null
    if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) return { ok: true,  msg: 'Leading 0 will be removed when saving' }
    if (phoneDigits.length === 10)                                  return { ok: true,  msg: 'Valid' }
    if (phoneDigits.length > 11)                                    return { ok: false, msg: 'Too many digits' }
    if (phoneDigits.length === 11 && !phoneDigits.startsWith('0'))  return { ok: false, msg: '11-digit numbers must start with 0' }
    return { ok: false, msg: `${10 - phoneDigits.length} more digit${10 - phoneDigits.length !== 1 ? 's' : ''} needed` }
  })()

  // The src shown in the photo circle: blob for preview, null if neither
  const displayPhotoSrc = photoLocalSrc || photoUrl || null

  return (
    <>
      <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlayOpen : ''}`}>
        <Header
          type="back"
          title="New Customer"
          onBackClick={handleClose}
          customActions={[
            formTab === 'personal'
              ? { label: 'Save', onClick: handleSave, color: 'var(--accent)' }
              : hasMeasurements
                ? { label: 'Save', onClick: handleSave, color: 'var(--accent)' }
                : { label: 'Skip', onClick: handleSkip, color: 'var(--text2)' }
          ]}
        />

        <div className={styles.formTabs}>
          <button className={`${styles.formTab} ${formTab === 'personal' ? styles.formTabActive : ''}`} onClick={() => setFormTab('personal')}>Personal Info</button>
          <button className={`${styles.formTab} ${formTab === 'body'     ? styles.formTabActive : ''}`} onClick={() => setFormTab('body')}>Body Measurements</button>
        </div>

        {formInlineMsg && (
          <div className={`${styles.formInlineMsg} ${formInlineMsg.ok ? styles.formInlineMsgOk : styles.formInlineMsgErr}`}>
            <span className="mi" style={{ fontSize: '0.95rem' }}>{formInlineMsg.ok ? 'check_circle' : 'error_outline'}</span>
            {formInlineMsg.text}
          </div>
        )}

        <div className={styles.formBody}>
          {formTab === 'personal' && (
            <>
              {/* ── Photo picker ───────────────────────────────── */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div
                  className={styles.photoPicker}
                  onClick={photoError ? handlePhotoRetry : handlePhotoPicker}
                  style={{ position: 'relative' }}
                >
                  {displayPhotoSrc
                    ? <img src={displayPhotoSrc} alt="Profile" className={styles.photoPreview} />
                    : <div className={styles.photoInitials}>{initials}</div>
                  }

                  {/* Uploading overlay */}
                  {photoUploading && (
                    <div className={styles.photoUploadOverlay}>
                      <span className={styles.photoUploadProgress}>{photoProgress}%</span>
                    </div>
                  )}

                  {/* Error overlay — tap to retry */}
                  {photoError && !photoUploading && (
                    <div className={styles.photoErrorOverlay}>
                      <span className="mi" style={{ fontSize: '1.1rem', color: '#fff' }}>refresh</span>
                    </div>
                  )}

                  {/* Camera / lock badge — hidden while uploading */}
                  {!photoUploading && !photoError && (
                    <div className={styles.camBadge}>
                      {isPremium
                        ? <span className="mi" style={{ fontSize: '0.9rem' }}>photo_camera</span>
                        : <span className="mi" style={{ fontSize: '0.9rem' }}>lock</span>
                      }
                    </div>
                  )}

                  {isPremium && (
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePhotoChange}
                    />
                  )}
                </div>

                {/* Remove button — shown once a photo is picked and not uploading */}
                {displayPhotoSrc && !photoUploading && (
                  <button
                    type="button"
                    className={styles.photoRemoveBtn}
                    onClick={removePhoto}
                    title="Remove photo"
                  >
                    <span className="mi" style={{ fontSize: '0.75rem' }}>close</span>
                  </button>
                )}
              </div>

              {/* Upload error hint */}
              {photoError && (
                <p className={styles.photoErrorHint}>
                  <span className="mi" style={{ fontSize: '0.85rem', verticalAlign: 'middle' }}>error_outline</span>
                  {' '}{photoError}
                </p>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Full Name *</label>
                <input type="text" className={styles.formInput} placeholder="e.g. Uchendu Daniel" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Sex *
                  {sexError && <span style={{ color: 'var(--danger)', marginLeft: 6, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>Required</span>}
                </label>
                <div className={styles.sexRow}>
                  {['Male', 'Female'].map(s => (
                    <button
                      key={s}
                      className={`${styles.sexChip} ${sex === s ? styles.sexChipActive : ''} ${sexError && !sex ? styles.sexChipError : ''}`}
                      onClick={() => { setSex(s); setSexError(false) }}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Birthday (Day & Month)</label>
                <div className={styles.inputRow}>
                  <select className={styles.formInput} value={bdayDay} onChange={e => setBdayDay(e.target.value)}>
                    <option value="">Day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className={styles.formInput} value={bdayMonth} onChange={e => setBdayMonth(e.target.value)}>
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Phone Number *</label>
                <div className={styles.phoneRow}>
                  <CountryCodePicker selected={selectedCountry} onSelect={setSelectedCountry} />
                  <input
                    type="tel"
                    className={`${styles.formInput} ${styles.phoneInput}`}
                    placeholder="e.g. 09078117654"
                    inputMode="tel"
                    value={localPhone}
                    onChange={e => setLocalPhone(e.target.value)}
                  />
                </div>
                {phoneHint && (
                  <div className={styles.phoneHint} style={{ color: phoneHint.ok ? 'var(--accent)' : 'var(--danger)' }}>
                    {phoneHint.msg}
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Phone Type</label>
                <select className={styles.formInput} value={phoneType} onChange={e => setPhoneType(e.target.value)}>
                  <option>Mobile</option><option>Home</option><option>Work</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Email Address</label>
                <input type="email" className={styles.formInput} placeholder="Optional" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Address</label>
                <input type="text" className={styles.formInput} placeholder="Optional" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </>
          )}

          {formTab === 'body' && (
            <>
              {!sex && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: '0.85rem' }}>
                  Please select a sex on the Personal Info tab first.
                </div>
              )}
              {sex && (
                <>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                    {sex === 'Female' ? 'Female' : 'Male'} body measurements (inches)
                  </p>
                  {measureFields.map((field, idx) => {
                    const imgSrc = imgMap[field] || null
                    const isLastImgField = imgSrc &&
                      !measureFields.slice(idx + 1).some(f => imgMap[f])

                    if (imgSrc) {
                      return (
                        <div
                          key={field}
                          className={`${styles.measureImgRow} ${isLastImgField ? styles.measureImgRowLast : ''}`}
                        >
                          <img src={imgSrc} alt={field} className={styles.measureImg} />
                          <div className={styles.measureImgRight}>
                            <label className={styles.inputLabel}>{field}</label>
                            <input
                              type="number"
                              className={styles.formInput}
                              placeholder="0"
                              inputMode="decimal"
                              value={bodyMeasurements[field] || ''}
                              onChange={e => updateBodyMeasure(field, e.target.value)}
                            />
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={field} className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{field}</label>
                        <input
                          type="number"
                          className={styles.formInput}
                          placeholder="0"
                          inputMode="decimal"
                          value={bodyMeasurements[field] || ''}
                          onChange={e => updateBodyMeasure(field, e.target.value)}
                        />
                      </div>
                    )
                  })}

                  {customFields.map(f => (
                    <div key={f.id} className={styles.customFieldRow}>
                      <div className={styles.customFieldInputs}>
                        <input type="text"   className={styles.formInput} placeholder="Field name" value={f.label} onChange={e => updateCustomField(f.id, 'label', e.target.value)} />
                        <input type="number" className={styles.formInput} placeholder="0" inputMode="decimal" value={f.value} onChange={e => updateCustomField(f.id, 'value', e.target.value)} />
                      </div>
                      <button className={styles.removeCustomBtn} onClick={() => removeCustomField(f.id)}>
                        <span className="mi" style={{ fontSize: '1.2rem' }}>remove_circle_outline</span>
                      </button>
                    </div>
                  ))}

                  <button className={styles.addCustomFieldBtn} onClick={addCustomField}>
                    <span className="mi" style={{ fontSize: '1rem' }}>add</span> Add Custom Field
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showPremiumSheet && <PremiumSheet onClose={() => setShowPremiumSheet(false)} />}
    </>
  )
}

// ── Customer list item ────────────────────────────────────────
function CustomerCard({ customer, onDelete, onOpen, isLast }) {
  const initials = getInitials(customer.name)
  const bdayStr  = getBirthdayStr(customer.birthday)

  return (
    <div
      className={`${styles.custListItem} ${isLast ? styles.custListItemLast : ''}`}
      onClick={onOpen}
    >
      <div className={styles.custListOuter}>
        <div className={styles.custListInner}>
          {customer.photo
            ? <img src={customer.photo} alt={customer.name} className={styles.custListPhoto} />
            : <span className={styles.custListInitials}>{initials}</span>
          }
        </div>
      </div>

      <div className={styles.custListInfo}>
        <div className={styles.custListName}>{customer.name}</div>
        {customer.phone && (
          <div className={styles.custListMeta}>{customer.phone}{bdayStr ? ` · ${bdayStr}` : ''}</div>
        )}
        {customer.email && (
          <div className={styles.custListMeta}>{customer.email}</div>
        )}
      </div>

      <div className={styles.custListActions}>
        <button
          className={styles.custDeleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(customer) }}
        >
          <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>delete_outline</span>
        </button>
        <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>chevron_right</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function Customers({ onMenuClick }) {
  const navigate = useNavigate()
  const { customers, addCustomer, deleteCustomer } = useCustomers()
  const { isPremium } = usePremium()

  const [query,        setQuery]        = useState('')
  const [formOpen,     setFormOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg,     setToastMsg]     = useState('')
  const [sortMode,     setSortMode]     = useState('date')
  const [filterOpen,   setFilterOpen]   = useState(false)
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  const handleSave = async ({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements }) => {
    if (!name)  { showToast('Name is required'); return }
    if (!phone) { showToast('Phone number is required'); return }
    if (phone === '__INVALID_PHONE__') { showToast('Phone number must be 10 digits (or 11 starting with 0)'); return }
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const hasMeasurements = Object.keys(bodyMeasurements || {}).length > 0
    try {
      // `photo` here is already a Cloudinary URL (or null) — never base64
      await addCustomer({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements, date: today })
      showToast(hasMeasurements ? `${name} saved with measurements ✓` : `${name} added — no measurements saved`)
    } catch (err) {
      showToast(`ERROR: ${err?.code || err?.message || String(err)}`)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteCustomer(deleteTarget.id)
    showToast(`${deleteTarget.name} deleted`)
    setDeleteTarget(null)
  }

  const filtered = query.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone && c.phone.includes(query)))
    : customers

  const sectionLabel = customers.length === 0 ? '' : filtered.length === customers.length
    ? 'All Clients'
    : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`

  const grouped = (() => {
    if (sortMode === 'alpha') {
      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
      return sorted.reduce((acc, c) => {
        const key = c.name.trim()[0]?.toUpperCase() || '#'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    } else {
      const sorted = [...filtered].sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0)
        const db = b.date ? new Date(b.date) : new Date(0)
        return db - da
      })
      return sorted.reduce((acc, c) => {
        const key = c.date || 'Unknown Date'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    }
  })()

  const selectSort = (mode) => {
    setSortMode(mode)
    setFilterOpen(false)
  }

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>search</span>
            <input type="text" placeholder="Search clients…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button
            className={`${styles.filterBtn} ${sortMode !== 'date' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(v => !v)}
          >
            <span className="mi" style={{ fontSize: '1.3rem' }}>tune</span>
          </button>
        </div>

        {filterOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterDropdownTitle}>Sort by</div>
            <button
              className={`${styles.filterOption} ${sortMode === 'date' ? styles.filterOptionActive : ''}`}
              onClick={() => selectSort('date')}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>calendar_today</span>
              <span>Date Added</span>
              {sortMode === 'date' && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
            <button
              className={`${styles.filterOption} ${sortMode === 'alpha' ? styles.filterOptionActive : ''}`}
              onClick={() => selectSort('alpha')}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>sort_by_alpha</span>
              <span>Alphabetically (A–Z)</span>
              {sortMode === 'alpha' && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
          </div>
        )}
      </div>

      {sectionLabel && <div className={styles.sectionLabel}>{sectionLabel}</div>}

      <div className={styles.scrollArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {customers.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)' }}>person_outline</span></div>
            <p>No customer yet.</p>
            <span>Tap + to add your first customer</span>
          </div>
        )}
        {customers.length > 0 && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)' }}>search_off</span></div>
            <p>No matches found.</p>
            <span>Try a different name or number</span>
          </div>
        )}

        {Object.entries(grouped).map(([groupKey, groupCustomers]) => (
          <div key={groupKey} className={styles.custGroup}>
            <div className={styles.custGroupDate}>{groupKey}</div>
            <div className={styles.custGroupDivider} />

            {groupCustomers.map((c, idx) => (
              <CustomerCard
                key={c.id}
                customer={c}
                isLast={idx === groupCustomers.length - 1}
                onOpen={() => navigate(`/customers/${c.id}`)}
                onDelete={(cust) => setDeleteTarget(cust)}
              />
            ))}
          </div>
        ))}
      </div>

      <button className={styles.fab} onClick={() => setFormOpen(true)}>
        <span className="mi">add</span>
      </button>

      <AddCustomerForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        isPremium={isPremium}
      />

      <ConfirmSheet customer={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />

      <Toast message={toastMsg} />
      <BottomNav></BottomNav>
    </div>
  )
}