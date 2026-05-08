// src/pages/Profile/Profile.jsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileSettings } from '../../contexts/ProfileSettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile } from 'firebase/auth'
import { saveOwnerToFirestore, loadOwnerFromFirestore } from '../../services/ownerService'
import { uploadToCloudinary } from '../../services/cloudinaryService'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import BrandColourPicker from '../../components/BrandColourPicker/BrandColourPicker'
import { getPaletteById, DEFAULT_COLOUR_ID } from '../../config/brandPalette'
import styles from './Profile.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ─────────────────────────────────────────────────────────────
// Nigerian States
// ─────────────────────────────────────────────────────────────

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

// ─────────────────────────────────────────────────────────────
// Country Code Picker
// ─────────────────────────────────────────────────────────────

const DEFAULT_COUNTRY = { name: 'Nigeria', dial_code: '+234', flag: '🇳🇬' }

function CountryCodePicker({ selected, onSelect }) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const [countries, setCountries] = useState([])
  const [loading, setLoading]     = useState(false)
  const [dropdownPos, setDropdownPos] = useState(null)
  const btnRef      = useRef(null)
  const dropdownRef = useRef(null)

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
            list.push({ name: c.name?.common || '', dial_code: root + s, flag: c.flag || '', cca2: c.cca2 || '' })
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
    const handler = e => {
      const clickedBtn      = btnRef.current?.contains(e.target)
      const clickedDropdown = dropdownRef.current?.contains(e.target)
      if (!clickedBtn && !clickedDropdown) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  const handleOpen = () => {
    if (open) { setOpen(false); return }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 280) })
    }
    setOpen(true)
  }

  const filtered = search.trim()
    ? countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial_code.includes(search))
    : countries

  const handleSelect = country => { onSelect(country); setOpen(false); setSearch('') }

  return (
    <>
      <button ref={btnRef} type="button" className={styles.ccBtn} onClick={handleOpen}>
        <span className={styles.ccFlag}>{selected.flag}</span>
        <span className={styles.ccCode}>{selected.dial_code}</span>
        <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>expand_more</span>
      </button>
      {open && dropdownPos && (
        <div
          ref={dropdownRef}
          className={styles.ccDropdown}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 99999 }}
        >
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
            {loading && <div className={styles.ccListEmpty}>Loading countries…</div>}
            {!loading && filtered.length === 0 && <div className={styles.ccListEmpty}>No results</div>}
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
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Phone helpers
// ─────────────────────────────────────────────────────────────

function buildPhoneNumber(localNumber, dialCode) {
  const digits = localNumber.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) return `${dialCode} ${digits.slice(1)}`
  if (digits.length === 10) return `${dialCode} ${digits}`
  return null
}

function getPhoneHint(localNumber) {
  const digits = localNumber.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 11 && digits.startsWith('0')) return { ok: true,  msg: 'Leading 0 will be removed when saving' }
  if (digits.length === 10)                            return { ok: true,  msg: 'Valid' }
  if (digits.length > 11)                              return { ok: false, msg: 'Too many digits' }
  if (digits.length === 11 && !digits.startsWith('0')) return { ok: false, msg: '11-digit numbers must start with 0' }
  return { ok: false, msg: `${10 - digits.length} more digit${10 - digits.length !== 1 ? 's' : ''} needed` }
}

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
    </div>
  )
}

function InfoRow({ icon, label, value, placeholder, divider = true }) {
  return (
    <div className={`${styles.row} ${!divider ? styles.noDivider : ''}`}>
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.15rem' }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        <div className={value ? styles.rowValue : styles.rowPlaceholder}>{value || placeholder}</div>
      </div>
    </div>
  )
}

function TappableRow({ icon, label, sub, value, onClick, chevron = true, divider = true, danger = false }) {
  const isEdit = icon === 'edit'
  return (
    <div
      className={`${styles.row} ${styles.rowTappable} ${!divider ? styles.noDivider : ''}`}
      onClick={onClick}
    >
      <div className={styles.rowIcon} style={isEdit ? { background: 'var(--text)', color: 'var(--bg)' } : undefined}>
        <span className="mi" style={{ fontSize: '1.15rem', color: danger ? '#ef4444' : undefined }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        <div className={`${styles.rowLabel} ${danger ? styles.rowLabelDanger : ''}`}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <div className={styles.rowRight}>
        {value && <span className={styles.rowBadge}>{value}</span>}
        {chevron && <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>chevron_right</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Full-screen slide-in modal shell
// ─────────────────────────────────────────────────────────────

function FullModal({ title, onBack, onSave, children }) {
  return (
    <div className={styles.fullOverlay}>
      <Header
        type="back"
        title={title}
        onBackClick={onBack}
        customActions={onSave ? [{ label: 'Save', onClick: onSave }] : []}
      />
      <div className={styles.fullContent}>
        <div className={styles.fullContentInner}>{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────

function FieldGroup({ children }) {
  return <div className={styles.fieldGroup}>{children}</div>
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
      <div className={styles.fieldControl}>{children}</div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      className={styles.textInput}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className={styles.textarea}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

function PhoneField({ label, hint, localValue, onLocalChange, country, onCountryChange }) {
  const phoneHint = getPhoneHint(localValue)
  return (
    <Field label={label} hint={hint}>
      <div className={styles.phoneRow}>
        <CountryCodePicker selected={country} onSelect={onCountryChange} />
        <input
          type="tel"
          inputMode="numeric"
          className={styles.textInput}
          style={{ flex: 1 }}
          placeholder="e.g. 09078117654"
          value={localValue}
          onChange={e => onLocalChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      {phoneHint && (
        <p className={styles.phoneHint} style={{ color: phoneHint.ok ? 'var(--accent)' : '#ef4444' }}>
          {phoneHint.msg}
        </p>
      )}
    </Field>
  )
}

// ─────────────────────────────────────────────────────────────
// Personal info helpers
// ─────────────────────────────────────────────────────────────

const PERSONAL_KEY = 'tailorflow_personal'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const DAYS_IN_MONTH = {
  January: 31, February: 29, March: 31, April: 30, May: 31, June: 30,
  July: 31, August: 31, September: 30, October: 31, November: 30, December: 31,
}

function loadPersonal(authUser) {
  try {
    const raw    = localStorage.getItem(PERSONAL_KEY)
    const stored = raw ? JSON.parse(raw) : {}
    return {
      fullName:   stored.fullName   || authUser?.displayName || '',
      email:      stored.email      || authUser?.email       || '',
      phone:      stored.phone      || '',
      city:       stored.city       || '',
      country:    stored.country    || '',
      sex:        stored.sex        || '',
      birthMonth: stored.birthMonth || '',
      birthDay:   stored.birthDay   || '',
    }
  } catch {
    return {
      fullName: authUser?.displayName || '', email: authUser?.email || '',
      phone: '', city: '', country: '', sex: '', birthMonth: '', birthDay: '',
    }
  }
}

function savePersonalLocally(data) {
  try { localStorage.setItem(PERSONAL_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

function parseStoredPhone(stored) {
  if (!stored) return { local: '', country: DEFAULT_COUNTRY }
  const match = stored.match(/^(\+\d+)\s+(.+)$/)
  if (match) {
    return { local: '0' + match[2].replace(/\D/g, ''), country: { ...DEFAULT_COUNTRY, dial_code: match[1] } }
  }
  return { local: stored, country: DEFAULT_COUNTRY }
}

// ─────────────────────────────────────────────────────────────
// MODAL: Edit Personal Info
// ─────────────────────────────────────────────────────────────

function PersonalModal({ personal, onBack, onSave, authUser }) {
  const parsed  = parseStoredPhone(personal.phone)
  const [saving, setSaving] = useState(false)
  const [local, setLocal]   = useState({
    fullName:   personal.fullName   || '',
    email:      personal.email      || '',
    city:       personal.city       || '',
    country:    personal.country    || '',
    sex:        personal.sex        || '',
    birthMonth: personal.birthMonth || '',
    birthDay:   personal.birthDay   || '',
  })
  const [phoneLocal,   setPhoneLocal]   = useState(parsed.local)
  const [phoneCountry, setPhoneCountry] = useState(parsed.country)

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const handleMonthChange = month => {
    setLocal(p => {
      const maxDay     = DAYS_IN_MONTH[month] || 31
      const currentDay = parseInt(p.birthDay)
      return { ...p, birthMonth: month, birthDay: currentDay > maxDay ? '' : p.birthDay }
    })
  }

  const dayOptions = local.birthMonth
    ? Array.from({ length: DAYS_IN_MONTH[local.birthMonth] || 31 }, (_, i) => String(i + 1))
    : Array.from({ length: 31 }, (_, i) => String(i + 1))

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const builtPhone = buildPhoneNumber(phoneLocal, phoneCountry.dial_code) || phoneLocal
      const updated    = { ...personal, ...local, phone: builtPhone }

      savePersonalLocally(updated)

      if (authUser && local.fullName && local.fullName !== authUser.displayName) {
        try { await updateProfile(authUser, { displayName: local.fullName.trim() }) } catch { /* ignore */ }
      }

      if (authUser?.uid) {
        await saveOwnerToFirestore(authUser.uid, updated)
      }

      onSave(updated)
      onBack()
    } catch (err) {
      console.error('[PersonalModal] save failed:', err)
      onBack()
    } finally {
      setSaving(false)
    }
  }

  return (
    <FullModal title="Personal Info" onBack={onBack} onSave={saving ? undefined : handleSave}>
      <FieldGroup>
        <Field label="Full Name">
          <TextInput value={local.fullName} onChange={set('fullName')} placeholder="e.g. Amara Okonkwo" />
        </Field>
        <Field label="Email Address">
          <TextInput value={local.email} onChange={set('email')} placeholder="you@email.com" type="email" />
        </Field>
        <PhoneField
          label="Phone Number"
          localValue={phoneLocal}
          onLocalChange={setPhoneLocal}
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
        />
      </FieldGroup>
      <FieldGroup>
        <Field label="City">
          <TextInput value={local.city} onChange={set('city')} placeholder="e.g. Lagos" />
        </Field>
        <Field label="Country">
          <TextInput value={local.country} onChange={set('country')} placeholder="e.g. Nigeria" />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Sex">
          <select
            className={styles.turnaroundSelect}
            style={{ width: '100%' }}
            value={local.sex}
            onChange={e => set('sex')(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </Field>
        <Field label="Birthday">
          <div className={styles.turnaroundRow}>
            <select className={styles.turnaroundSelect} value={local.birthMonth} onChange={e => handleMonthChange(e.target.value)}>
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className={styles.turnaroundSelect} value={local.birthDay} onChange={e => set('birthDay')(e.target.value)}>
              <option value="">Day</option>
              {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Brand Identity  ← Logo now uses Cloudinary
// ─────────────────────────────────────────────────────────────

function BrandModal({ onBack, showToast }) {
  const { profileSettings, updateManyProfileSettings } = useProfileSettings()
  const logoInputRef    = useRef()
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoProgress,  setLogoProgress]  = useState(0)

  const [local, setLocal] = useState({
    brandName:              profileSettings.brandName              || '',
    brandTagline:           profileSettings.brandTagline           || '',
    brandColourId:          (profileSettings.brandColourId && !profileSettings.brandColourId.startsWith('#'))
                              ? profileSettings.brandColourId
                              : DEFAULT_COLOUR_ID,
    brandLogo:              profileSettings.brandLogo              || null,
    brandMilestone:         profileSettings.brandMilestone         || '',
    brandFeaturedTechnique: profileSettings.brandFeaturedTechnique || '',
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  // ── Logo upload → Cloudinary ──────────────────────────────
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024)   { showToast('Image must be under 10MB');    return }

    setLogoUploading(true)
    setLogoProgress(0)

    try {
      const url = await uploadToCloudinary(file, 'invoices', setLogoProgress)
      setLocal(p => ({ ...p, brandLogo: url }))
      showToast('Logo uploaded ✓')
    } catch (err) {
      console.error('[BrandModal] logo upload failed:', err)
      showToast('Upload failed — please try again')
    } finally {
      setLogoUploading(false)
      setLogoProgress(0)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleLogoRemove = () => {
    setLocal(p => ({ ...p, brandLogo: null }))
    // Note: Cloudinary deletion requires a Cloud Function (signed request).
    // The image stays on Cloudinary but is dereferenced from the user's data.
  }

  const save = () => {
    const entry = getPaletteById(local.brandColourId)
    updateManyProfileSettings({ ...local, brandColour: entry?.tokens.primary || '#1C1814' })
    showToast('Brand info saved')
    onBack()
  }

  return (
    <FullModal title="Brand Identity" onBack={onBack} onSave={logoUploading ? undefined : save}>
      <FieldGroup>
        <Field label="Brand Logo" hint="PNG or JPG. Appears on invoice headers and portfolio. Ideally square.">
          {logoUploading ? (
            <div className={styles.logoUploadBtn} style={{ opacity: 0.7, pointerEvents: 'none', flexDirection: 'column', gap: 8 }}>
              {/* Progress bar */}
              <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${logoProgress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>
                Uploading… {logoProgress}%
              </span>
            </div>
          ) : local.brandLogo ? (
            <div className={styles.logoPreviewWrap}>
              <img src={local.brandLogo} alt="Brand logo" className={styles.logoPreview} />
              <button className={styles.logoRemove} onClick={handleLogoRemove}>
                <span className="mi" style={{ fontSize: 15 }}>close</span> Remove
              </button>
            </div>
          ) : (
            <button className={styles.logoUploadBtn} onClick={() => logoInputRef.current?.click()}>
              <span className="mi">add_photo_alternate</span>
              Upload Logo
            </button>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Shop / Brand Name">
          <TextInput value={local.brandName} onChange={set('brandName')} placeholder="e.g. Stitched by Amara" />
        </Field>
        <Field label="Tagline" hint="Short line shown under your name on coloured invoice templates.">
          <TextInput value={local.brandTagline} onChange={set('brandTagline')} placeholder="e.g. Crafted with love, fitted for you" />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Brand Colour" hint="Choose your brand colour. We've curated shades that look great on your portfolio and invoices.">
          <BrandColourPicker value={local.brandColourId} onChange={set('brandColourId')} />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Milestone" hint="A proud achievement shown on your portfolio. e.g. 500+ happy clients">
          <TextInput value={local.brandMilestone} onChange={set('brandMilestone')} placeholder="e.g. 500+ happy clients" />
        </Field>
        <Field label="Signature Style" hint="What you're known for. e.g. Hand-embroidered agbada">
          <TextInput value={local.brandFeaturedTechnique} onChange={set('brandFeaturedTechnique')} placeholder="e.g. Hand-embroidered agbada" />
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Business Contact
// ─────────────────────────────────────────────────────────────

function BusinessContactModal({ onBack, showToast }) {
  const { profileSettings, updateManyProfileSettings } = useProfileSettings()
  const parsedBrandPhone = parseStoredPhone(profileSettings.brandPhone)

  const [local, setLocal] = useState({
    brandEmail:   profileSettings.brandEmail   || '',
    brandAddress: profileSettings.brandAddress || '',
    brandWebsite: profileSettings.brandWebsite || '',
  })
  const [phoneLocal,   setPhoneLocal]   = useState(parsedBrandPhone.local)
  const [phoneCountry, setPhoneCountry] = useState(parsedBrandPhone.country)

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = () => {
    const builtPhone = buildPhoneNumber(phoneLocal, phoneCountry.dial_code) || phoneLocal
    updateManyProfileSettings({ ...local, brandPhone: builtPhone })
    showToast('Business contact saved')
    onBack()
  }

  return (
    <FullModal title="Business Contact" onBack={onBack} onSave={save}>
      <FieldGroup>
        <PhoneField
          label="Business Phone"
          localValue={phoneLocal}
          onLocalChange={setPhoneLocal}
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
        />
        <Field label="Business Email">
          <TextInput value={local.brandEmail} onChange={set('brandEmail')} placeholder="shop@email.com" type="email" />
        </Field>
        <Field label="Business Address">
          <Textarea value={local.brandAddress} onChange={set('brandAddress')} placeholder="12 Tailor Street, Ikeja, Lagos" rows={2} />
        </Field>
        <Field label="Website / Social Handle">
          <TextInput value={local.brandWebsite} onChange={set('brandWebsite')} placeholder="instagram.com/yourbrand" />
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Account / Payment Details
// ─────────────────────────────────────────────────────────────

function AccountDetailsModal({ onBack, showToast }) {
  const { profileSettings, updateManyProfileSettings } = useProfileSettings()

  const [local, setLocal] = useState({
    accountBank:   profileSettings.accountBank   || '',
    accountNumber: profileSettings.accountNumber || '',
    accountName:   profileSettings.accountName   || '',
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = () => {
    updateManyProfileSettings(local)
    showToast('Account details saved')
    onBack()
  }

  return (
    <FullModal title="Account Details" onBack={onBack} onSave={save}>
      <FieldGroup>
        <Field label="Bank Name" hint="e.g. GTBank, Access, OPay">
          <TextInput value={local.accountBank} onChange={set('accountBank')} placeholder="e.g. GTBank" />
        </Field>
        <Field label="Account Number">
          <TextInput value={local.accountNumber} onChange={set('accountNumber')} placeholder="e.g. 0123456789" type="tel" />
        </Field>
        <Field label="Account Name" hint="Name registered on the bank account">
          <TextInput value={local.accountName} onChange={set('accountName')} placeholder="e.g. Amara Okonkwo" />
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL: Business Info
// ─────────────────────────────────────────────────────────────

const AVAILABILITY_OPTIONS = [
  { value: 'open',   label: 'Accepting Orders', icon: 'check_circle' },
  { value: 'booked', label: 'Fully Booked',     icon: 'block'        },
]

function ServiceAreaPicker({ value, onChange }) {
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  const [search, setSearch] = useState('')

  const hasNationwide    = selected.includes('Nationwide')
  const hasInternational = selected.includes('International')
  const hasStates        = selected.some(s => NIGERIAN_STATES.includes(s))
  const isNationwideDisabled = hasStates
  const isStatesDisabled     = hasNationwide

  const toggleSpecial = opt => {
    if (opt === 'Nationwide') {
      if (isNationwideDisabled) return
      const next = hasNationwide ? selected.filter(s => s !== 'Nationwide') : [...selected, 'Nationwide']
      onChange(next.join(', '))
    } else {
      const next = hasInternational ? selected.filter(s => s !== 'International') : [...selected, 'International']
      onChange(next.join(', '))
    }
  }

  const toggleState = state => {
    if (isStatesDisabled) return
    const next = selected.includes(state) ? selected.filter(s => s !== state) : [...selected, state]
    onChange(next.join(', '))
  }

  const removeChip = item => onChange(selected.filter(s => s !== item).join(', '))

  const filteredStates = search.trim()
    ? NIGERIAN_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : NIGERIAN_STATES

  return (
    <div className={styles.serviceAreaWrap}>
      {(isNationwideDisabled || isStatesDisabled) && (
        <div className={styles.serviceAreaHint}>
          <span className="mi" style={{ fontSize: '0.85rem' }}>info</span>
          {isStatesDisabled ? 'Remove Nationwide to select specific states' : 'Remove your selected states to choose Nationwide'}
        </div>
      )}
      {selected.length > 0 && (
        <div className={styles.serviceAreaSelected}>
          {selected.map(s => (
            <button key={s} type="button" className={styles.serviceAreaChip} onClick={() => removeChip(s)}>
              {s}<span className="mi" style={{ fontSize: '0.75rem' }}>close</span>
            </button>
          ))}
        </div>
      )}
      <div className={styles.serviceAreaSpecial}>
        <button
          type="button"
          disabled={isNationwideDisabled}
          className={`${styles.serviceAreaSpecialBtn} ${hasNationwide ? styles.serviceAreaOptionActive : ''} ${isNationwideDisabled ? styles.serviceAreaSpecialDisabled : ''}`}
          onClick={() => toggleSpecial('Nationwide')}
        >
          <span className="mi" style={{ fontSize: '0.9rem' }}>flag</span>
          Nationwide
          {hasNationwide && <span className="mi" style={{ fontSize: '0.85rem', marginLeft: 2 }}>check</span>}
        </button>
        <button
          type="button"
          className={`${styles.serviceAreaSpecialBtn} ${hasInternational ? styles.serviceAreaOptionActive : ''}`}
          onClick={() => toggleSpecial('International')}
        >
          <span className="mi" style={{ fontSize: '0.9rem' }}>public</span>
          International
          {hasInternational && <span className="mi" style={{ fontSize: '0.85rem', marginLeft: 2 }}>check</span>}
        </button>
      </div>
      <div className={`${styles.serviceAreaSearch} ${isStatesDisabled ? styles.serviceAreaSearchDisabled : ''}`}>
        <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>search</span>
        <input
          type="text"
          className={styles.serviceAreaSearchInput}
          placeholder={isStatesDisabled ? 'Nationwide selected — states unavailable' : 'Search states…'}
          value={search}
          onChange={e => { if (!isStatesDisabled) setSearch(e.target.value) }}
          readOnly={isStatesDisabled}
        />
      </div>
      <div className={`${styles.serviceAreaList} ${isStatesDisabled ? styles.serviceAreaListDisabled : ''}`}>
        {filteredStates.map(state => (
          <button
            key={state}
            type="button"
            disabled={isStatesDisabled}
            className={`${styles.serviceAreaOption} ${selected.includes(state) ? styles.serviceAreaOptionActive : ''} ${isStatesDisabled ? styles.serviceAreaOptionDisabled : ''}`}
            onClick={() => toggleState(state)}
          >
            {selected.includes(state) && <span className="mi" style={{ fontSize: '0.9rem' }}>check</span>}
            {state}
          </button>
        ))}
      </div>
    </div>
  )
}

function TurnaroundPicker({ value, onChange }) {
  const parse = v => {
    if (!v) return { num: '1', unit: 'weeks' }
    const match = v.match(/^(\d+)\s+(days|weeks)$/)
    return match ? { num: match[1], unit: match[2] } : { num: '1', unit: 'weeks' }
  }
  const { num, unit } = parse(value)
  const maxNum     = unit === 'days' ? 30 : 12
  const numOptions = Array.from({ length: maxNum }, (_, i) => String(i + 1))
  const handleNum  = n => onChange(`${n} ${unit}`)
  const handleUnit = u => {
    const safeNum = u === 'days' ? Math.min(parseInt(num), 30) : Math.min(parseInt(num), 12)
    onChange(`${safeNum} ${u}`)
  }
  return (
    <div className={styles.turnaroundRow}>
      <select className={styles.turnaroundSelect} value={num} onChange={e => handleNum(e.target.value)}>
        {numOptions.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <select className={styles.turnaroundSelect} value={unit} onChange={e => handleUnit(e.target.value)}>
        <option value="days">Days</option>
        <option value="weeks">Weeks</option>
      </select>
    </div>
  )
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const hasStroke = useRef(false)

  useEffect(() => {
    if (!value || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = value
  }, [])

  const getPos = e => {
    const rect   = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width  / rect.width
    const scaleY = canvasRef.current.height / rect.height
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = e => {
    e.preventDefault(); drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }
  const draw = e => {
    e.preventDefault(); if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = 'var(--text)'
    const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke()
    hasStroke.current = true
  }
  const endDraw = e => {
    e?.preventDefault(); if (!drawing.current) return
    drawing.current = false
    if (hasStroke.current) onChange(canvasRef.current.toDataURL('image/png'))
  }
  const clear = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    hasStroke.current = false; onChange(null)
  }

  return (
    <div className={styles.sigWrap}>
      <canvas
        ref={canvasRef} width={600} height={200} className={styles.sigCanvas}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      <div className={styles.sigFooter}>
        <span className={styles.sigHint}>Draw your signature above</span>
        <button type="button" className={styles.sigClearBtn} onClick={clear}>
          <span className="mi" style={{ fontSize: '0.9rem' }}>refresh</span>Clear
        </button>
      </div>
    </div>
  )
}

// ── BusinessInfoModal — signature upload now uses Cloudinary ──

function BusinessInfoModal({ onBack, showToast }) {
  const { profileSettings, updateManyProfileSettings } = useProfileSettings()
  const [sigUploading, setSigUploading] = useState(false)
  const [sigProgress,  setSigProgress]  = useState(0)

  const [local, setLocal] = useState({
    brandAvailability:   profileSettings.brandAvailability   || 'open',
    brandAvailableUntil: profileSettings.brandAvailableUntil || '',
    brandTurnaround:     profileSettings.brandTurnaround     || '1 weeks',
    brandServiceArea:    profileSettings.brandServiceArea    || '',
    brandStyleStatement: profileSettings.brandStyleStatement || '',
    brandPaymentTerms:   profileSettings.brandPaymentTerms   || '',
    brandSignature:      profileSettings.brandSignature      || null,
  })

  const set = key => val => setLocal(p => ({ ...p, [key]: val }))

  const save = async () => {
    let signatureUrl = local.brandSignature

    // If signature is a fresh canvas drawing (base64), upload it to Cloudinary
    if (local.brandSignature && local.brandSignature.startsWith('data:')) {
      setSigUploading(true)
      setSigProgress(0)
      try {
        // Convert base64 data URL → Blob → File
        const res  = await fetch(local.brandSignature)
        const blob = await res.blob()
        const file = new File([blob], 'signature.png', { type: 'image/png' })
        signatureUrl = await uploadToCloudinary(file, 'signatures', setSigProgress)
      } catch (err) {
        console.error('[BusinessInfoModal] signature upload failed:', err)
        showToast('Signature upload failed — try again')
        setSigUploading(false)
        return
      }
      setSigUploading(false)
      setSigProgress(0)
    }

    updateManyProfileSettings({ ...local, brandSignature: signatureUrl })
    showToast('Business info saved')
    onBack()
  }

  return (
    <FullModal title="Business Info" onBack={onBack} onSave={sigUploading ? undefined : save}>
      <FieldGroup>
        <Field label="Availability">
          <div className={styles.availabilityRow}>
            {AVAILABILITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.availBtn} ${local.brandAvailability === opt.value
                  ? opt.value === 'open' ? styles.availBtnOpen : styles.availBtnBooked
                  : ''}`}
                onClick={() => set('brandAvailability')(opt.value)}
              >
                <span className="mi" style={{ fontSize: '1rem' }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
        {local.brandAvailability === 'booked' && (
          <Field label="Available From" hint="When will you start accepting orders again?">
            <TextInput value={local.brandAvailableUntil} onChange={set('brandAvailableUntil')} placeholder="e.g. January 2025" />
          </Field>
        )}
      </FieldGroup>
      <FieldGroup>
        <Field label="Standard Turnaround Time" hint="How long does it typically take to complete an order?">
          <TurnaroundPicker value={local.brandTurnaround} onChange={set('brandTurnaround')} />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Service Area" hint="Select all states you deliver or offer services to.">
          <ServiceAreaPicker value={local.brandServiceArea} onChange={set('brandServiceArea')} />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Style Statement" hint="Describe your craft style. Shown on your portfolio.">
          <Textarea
            value={local.brandStyleStatement}
            onChange={set('brandStyleStatement')}
            placeholder="e.g. I specialise in bold Ankara fusion pieces that blend traditional Yoruba aesthetics with modern silhouettes…"
            rows={6}
          />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Payment Terms" hint="Your standard terms printed on invoices.">
          <Textarea
            value={local.brandPaymentTerms}
            onChange={set('brandPaymentTerms')}
            placeholder="e.g. 50% deposit required before cutting begins. Balance due on pickup. No refunds after fabric is cut."
            rows={5}
          />
        </Field>
      </FieldGroup>
      <FieldGroup>
        <Field label="Signature" hint="Draw your signature. It will appear on your invoices.">
          {sigUploading ? (
            <div style={{ padding: '16px 0' }}>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${sigProgress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>
                Saving signature… {sigProgress}%
              </span>
            </div>
          ) : (
            <SignaturePad value={local.brandSignature} onChange={set('brandSignature')} />
          )}
        </Field>
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Social Media SVG Icons
// ─────────────────────────────────────────────────────────────

function SocialIcon({ platformId, size = 20 }) {
  const icons = {
    instagram: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>),
    tiktok:    (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.76a4.85 4.85 0 01-1.02-.07z"/></svg>),
    facebook:  (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>),
    twitter:   (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>),
    youtube:   (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>),
    pinterest: (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>),
    threads:   (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 012.581.185v-.369c0-1.207-.334-2.134-.993-2.755-.64-.6-1.59-.905-2.816-.905-2.153 0-3.412.974-3.87 2.977l-1.943-.526C7.1 5.82 8.914 4.323 12.023 4.323c1.736 0 3.133.457 4.149 1.357 1.032.913 1.554 2.228 1.554 3.91v6.41a.51.51 0 00.509.51h.001a.51.51 0 00.509-.51V9.59c0-2.007-.615-3.626-1.826-4.806l1.438-1.45C19.874 4.58 20.7 6.63 20.7 9.59v6.41c0 1.38-1.12 2.5-2.5 2.5h-.001a2.501 2.501 0 01-2.499-2.5v-.643c-.984 1.448-2.531 2.271-4.514 2.371zm.278-8.67c-.9.05-1.669.29-2.237.695-.548.392-.829.924-.798 1.496.033.606.38 1.117.975 1.498.635.41 1.472.604 2.293.56 1.147-.062 2.026-.489 2.612-1.268.552-.733.84-1.768.854-3.076a11.888 11.888 0 00-1.699-.205c-.66-.04-1.34-.01-2-.3z"/></svg>),
  }
  return icons[platformId] || (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.3"/></svg>)
}

// ─────────────────────────────────────────────────────────────
// MODAL: Social Media Links
// ─────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram',   placeholder: 'yourbrand'        },
  { id: 'tiktok',    label: 'TikTok',      placeholder: 'yourbrand'        },
  { id: 'facebook',  label: 'Facebook',    placeholder: 'yourbrand'        },
  { id: 'twitter',   label: 'Twitter / X', placeholder: 'yourbrand'        },
  { id: 'youtube',   label: 'YouTube',     placeholder: 'YourBrandChannel' },
  { id: 'pinterest', label: 'Pinterest',   placeholder: 'yourbrand'        },
  { id: 'threads',   label: 'Threads',     placeholder: 'yourbrand'        },
]

function SocialsModal({ onBack, showToast }) {
  const { profileSettings, updateManyProfileSettings } = useProfileSettings()

  const toMap = arr => Object.fromEntries((arr || []).map(s => [s.platform, s.handle]))
  const [handles,  setHandles]  = useState(() => toMap(profileSettings.brandSocials || []))
  const [expanded, setExpanded] = useState(() => {
    const active = new Set((profileSettings.brandSocials || []).map(s => s.platform))
    return Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.id, active.has(p.id)]))
  })

  const togglePlatform = id => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (prev[id]) setHandles(h => { const n = { ...h }; delete n[id]; return n })
      return next
    })
  }

  const save = () => {
    const brandSocials = SOCIAL_PLATFORMS
      .filter(p => expanded[p.id] && handles[p.id]?.trim())
      .map(p => ({ platform: p.id, handle: handles[p.id].trim() }))
    updateManyProfileSettings({ brandSocials })
    showToast('Social links saved')
    onBack()
  }

  return (
    <FullModal title="Social Media" onBack={onBack} onSave={save}>
      <FieldGroup>
        {SOCIAL_PLATFORMS.map(platform => (
          <div key={platform.id} className={styles.socialRow}>
            <button
              type="button"
              className={`${styles.socialToggle} ${expanded[platform.id] ? styles.socialToggleActive : ''}`}
              onClick={() => togglePlatform(platform.id)}
            >
              <div className={styles.socialToggleLeft}>
                <div className={`${styles.socialIconWrap} ${expanded[platform.id] ? styles.socialIconActive : ''}`}>
                  <SocialIcon platformId={platform.id} size={18} />
                </div>
                <span className={styles.socialPlatformLabel}>{platform.label}</span>
              </div>
              <span className={`mi ${styles.socialChevron} ${expanded[platform.id] ? styles.socialChevronOpen : ''}`} style={{ fontSize: '1rem' }}>
                expand_more
              </span>
            </button>
            {expanded[platform.id] && (
              <div className={styles.socialHandleWrap}>
                <span className={styles.socialAt}>@</span>
                <input
                  className={styles.socialHandleInput}
                  type="text"
                  placeholder={platform.placeholder}
                  value={handles[platform.id] || ''}
                  onChange={e => setHandles(h => ({ ...h, [platform.id]: e.target.value }))}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            )}
          </div>
        ))}
      </FieldGroup>
    </FullModal>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────

function PlanBadge({ isPremium }) {
  return (
    <span className={isPremium ? styles.badgePro : styles.badgeFree}>
      {isPremium
        ? <><span className="mi" style={{ fontSize: '0.75rem' }}>workspace_premium</span> PRO</>
        : 'FREE'}
    </span>
  )
}

function Avatar({ name, logo, size = 72 }) {
  const initials = name
    ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'
  if (logo) return <img src={logo} alt="Avatar" className={styles.avatarImg} style={{ width: size, height: size }} />
  return <div className={styles.avatarInitials} style={{ width: size, height: size, fontSize: size * 0.35 }}>{initials}</div>
}

function getOrSetJoinDate() {
  const key      = 'tailorflow_joined'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  localStorage.setItem(key, today)
  return today
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function Profile({ onMenuClick, isPremium = false, onUpgrade = () => {} }) {
  const { profileSettings } = useProfileSettings()
  const { user, logout }    = useAuth()
  const navigate            = useNavigate()

  const [personal,      setPersonal]      = useState(() => loadPersonal(user))
  const [activeModal,   setActiveModal]   = useState(null)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toastMsg,      setToastMsg]      = useState('')
  const toastTimer = useRef(null)

  const joinDate = getOrSetJoinDate()

  useEffect(() => {
    if (!user?.uid) return
    loadOwnerFromFirestore(user.uid).then(data => {
      if (!data) return
      const merged = {
        fullName:   data.fullName   || personal.fullName   || '',
        email:      data.email      || personal.email      || user?.email || '',
        phone:      data.phone      || personal.phone      || '',
        city:       data.city       || personal.city       || '',
        country:    data.country    || personal.country    || '',
        sex:        data.sex        || personal.sex        || '',
        birthMonth: data.birthMonth || personal.birthMonth || '',
        birthDay:   data.birthDay   || personal.birthDay   || '',
      }
      setPersonal(merged)
      savePersonalLocally(merged)
    }).catch(console.error)
  }, [user?.uid])

  const showToast = useCallback(msg => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  const handleLogout = async () => {
    setLogoutConfirm(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const handleDeleteAccount = async () => {
    setDeleteConfirm(false)
    try {
      await user.delete()
      navigate('/login', { replace: true })
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        showToast('Please log out and log in again to delete your account')
      } else {
        showToast('Could not delete account — please try again')
      }
    }
  }

  const hasBrand           = !!(profileSettings.brandName || profileSettings.brandLogo)
  const hasAccountDetails  = !!(profileSettings.accountBank || profileSettings.accountNumber)
  const hasBusinessContact = !!(profileSettings.brandPhone || profileSettings.brandEmail || profileSettings.brandAddress)

  const brandColourHex = getPaletteById(profileSettings.brandColourId)?.tokens.primary
    || getPaletteById(DEFAULT_COLOUR_ID)?.tokens.primary
    || null

  return (
    <div className={styles.page}>
      <Header title="Account" onMenuClick={onMenuClick} />

      <div className={styles.scrollArea}>
        {/* Hero card */}
        <div className={styles.heroCard}>
          <div className={styles.heroCardGlow} />
          <div className={styles.heroTop}>
            <Avatar name={personal.fullName || profileSettings.brandName} logo={profileSettings.brandLogo} size={72} />
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>{personal.fullName || 'Your Name'}</div>
              {(personal.city || personal.country) && (
                <div className={styles.heroLocation}>
                  <span className="mi" style={{ fontSize: '0.75rem' }}>location_on</span>
                  {[personal.city, personal.country].filter(Boolean).join(', ')}
                </div>
              )}
              <PlanBadge isPremium={isPremium} />
            </div>
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.heroMetaItem}>
              <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>calendar_today</span>
              <span className={styles.heroMetaLabel}>Joined {joinDate}</span>
            </div>
            {(personal.email || user?.email) && (
              <div className={styles.heroMetaItem}>
                <span className="mi" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>mail</span>
                <span className={styles.heroMetaLabel}>{personal.email || user?.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Personal Info ── */}
        <SectionHeader icon="person" label="Personal Info" />
        <InfoRow icon="badge"  label="Full Name" value={personal.fullName}  placeholder="Not set" />
        <InfoRow icon="mail"   label="Email"     value={personal.email || user?.email} placeholder="Not set" />
        <InfoRow icon="call"   label="Phone"     value={personal.phone}     placeholder="Not set" />
        <InfoRow icon="public" label="Location"  value={[personal.city, personal.country].filter(Boolean).join(', ')} placeholder="Not set" />
        {personal.sex && <InfoRow icon="person_outline" label="Sex" value={personal.sex} placeholder="Not set" />}
        {(personal.birthMonth && personal.birthDay) && (
          <InfoRow icon="cake" label="Birthday" value={`${personal.birthDay} ${personal.birthMonth}`} placeholder="Not set" />
        )}
        <TappableRow icon="edit" label="Edit Personal Info" onClick={() => setActiveModal('personal')} divider={false} />

        {/* ── Brand Identity ── */}
        <SectionHeader icon="storefront" label="Brand Identity" />
        {hasBrand ? (
          <div className={`${styles.row} ${styles.brandPreview}`}>
            {profileSettings.brandLogo && (
              <img src={profileSettings.brandLogo} alt="Brand logo" className={styles.brandPreviewLogo} />
            )}
            <div className={styles.brandPreviewInfo}>
              <div className={styles.brandPreviewName}>{profileSettings.brandName || '—'}</div>
              {profileSettings.brandTagline && (
                <div className={styles.brandPreviewTagline}>{profileSettings.brandTagline}</div>
              )}
            </div>
            {brandColourHex && <div className={styles.brandColourDot} style={{ background: brandColourHex }} />}
          </div>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>storefront</span>
            <span className={styles.brandEmptyText}>No brand set up yet</span>
          </div>
        )}
        <InfoRow icon="store"         label="Brand Name"      value={profileSettings.brandName}              placeholder="Not set" />
        <InfoRow icon="emoji_events"  label="Milestone"       value={profileSettings.brandMilestone}         placeholder="Not set" />
        <InfoRow icon="auto_fix_high" label="Signature Style" value={profileSettings.brandFeaturedTechnique} placeholder="Not set" />
        <TappableRow icon="edit" label="Edit Brand Identity" sub="Logo, colours, milestone, signature style" onClick={() => setActiveModal('brand')} divider={false} />

        {/* ── Business Contact ── */}
        <SectionHeader icon="contact_phone" label="Business Contact" />
        {hasBusinessContact ? (
          <>
            {profileSettings.brandPhone   && <InfoRow icon="call"        label="Business Phone" value={profileSettings.brandPhone}   placeholder="Not set" />}
            {profileSettings.brandEmail   && <InfoRow icon="mail"        label="Business Email" value={profileSettings.brandEmail}   placeholder="Not set" />}
            {profileSettings.brandAddress && <InfoRow icon="location_on" label="Address"        value={profileSettings.brandAddress} placeholder="Not set" />}
          </>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>contact_phone</span>
            <span className={styles.brandEmptyText}>No business contact set yet</span>
          </div>
        )}
        <TappableRow icon="edit" label="Edit Business Contact" sub="Phone, email, address, website used on invoices" onClick={() => setActiveModal('businessContact')} divider={false} />

        {/* ── Business Info ── */}
        <SectionHeader icon="business_center" label="Business Info" />
        <InfoRow icon="schedule" label="Turnaround Time" value={profileSettings.brandTurnaround}  placeholder="Not set" />
        <InfoRow icon="public"   label="Service Area"    value={profileSettings.brandServiceArea}  placeholder="Not set" />
        <InfoRow
          icon={profileSettings.brandAvailability === 'booked' ? 'block' : 'check_circle'}
          label="Availability"
          value={profileSettings.brandAvailability === 'booked'
            ? `Fully Booked${profileSettings.brandAvailableUntil ? ` · Available from ${profileSettings.brandAvailableUntil}` : ''}`
            : 'Accepting Orders'}
          placeholder="Not set"
        />
        {profileSettings.brandPaymentTerms && (
          <InfoRow icon="receipt_long" label="Payment Terms" value="Set" placeholder="Not set" />
        )}
        {profileSettings.brandSignature && (
          <div className={styles.row}>
            <div className={styles.rowIcon}><span className="mi" style={{ fontSize: '1.15rem' }}>draw</span></div>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Signature</div>
              <img src={profileSettings.brandSignature} alt="Signature" className={styles.sigPreview} />
            </div>
          </div>
        )}
        <TappableRow icon="edit" label="Edit Business Info" sub="Availability, turnaround, service area, payment terms, signature" onClick={() => setActiveModal('businessInfo')} divider={false} />

        {/* ── Social Media ── */}
        <SectionHeader icon="share" label="Social Media" />
        {profileSettings.brandSocials?.length > 0 ? (
          <div className={styles.socialsPreview}>
            {profileSettings.brandSocials.map(s => {
              const p = SOCIAL_PLATFORMS.find(pl => pl.id === s.platform)
              return p ? (
                <div key={s.platform} className={styles.socialPreviewChip}>
                  <SocialIcon platformId={s.platform} size={14} />
                  <span className={styles.socialPreviewLabel}>@{s.handle}</span>
                </div>
              ) : null
            })}
          </div>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>share</span>
            <span className={styles.brandEmptyText}>No social links yet</span>
          </div>
        )}
        <TappableRow icon="edit" label="Edit Social Links" sub="Instagram, TikTok, Facebook and more" onClick={() => setActiveModal('socials')} divider={false} />

        {/* ── Account Details ── */}
        <SectionHeader icon="account_balance" label="Account Details" />
        {hasAccountDetails ? (
          <>
            <InfoRow icon="account_balance" label="Bank"           value={profileSettings.accountBank}   placeholder="Not set" />
            <InfoRow icon="tag"             label="Account Number" value={profileSettings.accountNumber} placeholder="Not set" />
            <InfoRow icon="badge"           label="Account Name"   value={profileSettings.accountName}   placeholder="Not set" />
          </>
        ) : (
          <div className={`${styles.row} ${styles.brandEmpty}`}>
            <span className="mi" style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>account_balance</span>
            <span className={styles.brandEmptyText}>No account details yet</span>
          </div>
        )}
        <TappableRow icon="edit" label="Edit Account Details" sub="Bank info printed on invoices for client payments" onClick={() => setActiveModal('accountDetails')} divider={false} />

        {/* ── My Plan ── */}
        <SectionHeader icon="workspace_premium" label="My Plan" />
        <div className={styles.row}>
          <div className={styles.planLeft}>
            <div className={styles.planName}>{isPremium ? 'TailorFlow Pro' : 'Free Plan'}</div>
            <div className={styles.planSub}>
              {isPremium
                ? 'All features unlocked — invoice customisation, branded PDFs & more'
                : 'Basic features only. Upgrade to unlock brand customisation.'}
            </div>
          </div>
          <PlanBadge isPremium={isPremium} />
        </div>
        {!isPremium && (
          <div className={`${styles.row} ${styles.upgradeStrip}`} onClick={onUpgrade}>
            <div className={styles.upgradeStripGlow} />
            <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>workspace_premium</span>
            <div className={styles.upgradeStripText}>
              <div className={styles.upgradeStripTitle}>Upgrade to Pro</div>
              <div className={styles.upgradeStripSub}>Branded invoices and receipts PDFs, unlimited uploads & a portfolio that works for you 24/7</div>
            </div>
            <span className="mi" style={{ fontSize: '1rem', color: 'var(--accent)' }}>chevron_right</span>
          </div>
        )}
        <TappableRow icon="payments" label="Billing History" sub="See past payments, plan renewals & expiry dates" onClick={() => {}} divider={false} />

        {/* ── Danger Zone ── */}
        <SectionHeader icon="warning" label="Danger Zone" />
        <TappableRow icon="logout" label="Log Out" sub="You can always log back in" onClick={() => setLogoutConfirm(true)} danger />
        <TappableRow icon="delete_forever" label="Delete Account" sub="Permanently remove your account and all data" onClick={() => setDeleteConfirm(true)} divider={false} danger />

        <div style={{ height: 40 }} />
      </div>

      {/* ── Modals ── */}
      {activeModal === 'personal' && (
        <PersonalModal
          personal={personal}
          authUser={user}
          onBack={() => setActiveModal(null)}
          onSave={data => { setPersonal(data); showToast('Personal info saved') }}
        />
      )}
      {activeModal === 'brand'           && <BrandModal           onBack={() => setActiveModal(null)} showToast={showToast} />}
      {activeModal === 'businessContact' && <BusinessContactModal onBack={() => setActiveModal(null)} showToast={showToast} />}
      {activeModal === 'accountDetails'  && <AccountDetailsModal  onBack={() => setActiveModal(null)} showToast={showToast} />}
      {activeModal === 'businessInfo'    && <BusinessInfoModal    onBack={() => setActiveModal(null)} showToast={showToast} />}
      {activeModal === 'socials'         && <SocialsModal         onBack={() => setActiveModal(null)} showToast={showToast} />}

      <ConfirmSheet open={logoutConfirm} title="Log Out?" onConfirm={handleLogout} onCancel={() => setLogoutConfirm(false)} />
      <ConfirmSheet
        open={deleteConfirm}
        title="Delete Account?"
        message="This will permanently delete your account and all your data. This cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteConfirm(false)}
      />
      <Toast message={toastMsg} />
      <BottomNav />
    </div>
  )
}
