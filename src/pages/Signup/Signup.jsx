import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile } from 'firebase/auth'
import { DEFAULTS } from '../../contexts/ProfileSettingsContext'
import styles from './Signup.module.css'

const STEPS = [
  { id: 'account',  label: 'Account',  icon: 'lock'         },
  { id: 'personal', label: 'Personal', icon: 'person'        },
  { id: 'brand',    label: 'Brand',    icon: 'storefront'    },
  { id: 'payment',  label: 'Payment',  icon: 'account_balance' },
]

function Field({ label, hint, error, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint && !error && <p className={styles.fieldHint}>{hint}</p>}
      {error && <p className={styles.fieldError}><span className="mi" style={{ fontSize: '0.75rem' }}>error</span>{error}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', icon, rightEl }) {
  return (
    <div className={styles.inputWrap}>
      {icon && <span className={`mi ${styles.inputIcon}`}>{icon}</span>}
      <input
        className={`${styles.textInput} ${icon ? styles.textInputWithIcon : ''}`}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {rightEl && <div className={styles.inputRight}>{rightEl}</div>}
    </div>
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={styles.segment}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.segBtn} ${value === opt.value ? styles.segActive : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
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
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!open || countries.length > 0) return
    setLoading(true)
    fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2')
      .then(r => r.json())
      .then(data => {
        const list = []
        data.forEach(c => {
          const root    = c.idd?.root || ''
          const suffix  = c.idd?.suffixes
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
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search.trim()
    ? countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial_code.includes(search))
    : countries

  const handleSelect = (country) => { onSelect(country); setOpen(false); setSearch('') }

  return (
    <div className={styles.ccPickerWrap} ref={dropdownRef}>
      <button type="button" className={styles.ccBtn} onClick={() => setOpen(v => !v)}>
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
    </div>
  )
}

// ── Phone number formatting/validation helper ─────────────────
function buildPhoneNumber(localNumber, dialCode) {
  const digits = localNumber.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) return `${dialCode} ${digits.slice(1)}`
  if (digits.length === 10) return `${dialCode} ${digits}`
  return null
}

// ── Phone hint helper ─────────────────────────────────────────
function getPhoneHint(localNumber) {
  const digits = localNumber.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 11 && digits.startsWith('0')) return { ok: true,  msg: 'Leading 0 will be removed when saving' }
  if (digits.length === 10)                            return { ok: true,  msg: 'Valid' }
  if (digits.length > 11)                              return { ok: false, msg: 'Too many digits' }
  if (digits.length === 11 && !digits.startsWith('0')) return { ok: false, msg: '11-digit numbers must start with 0' }
  return { ok: false, msg: `${10 - digits.length} more digit${10 - digits.length !== 1 ? 's' : ''} needed` }
}

// ── Phone field with country code picker ─────────────────────
function PhoneField({ label, hint, error, localValue, onLocalChange, country, onCountryChange }) {
  const phoneHint = getPhoneHint(localValue)
  return (
    <Field label={label} hint={hint} error={error}>
      <div className={styles.phoneRow}>
        <CountryCodePicker selected={country} onSelect={onCountryChange} />
        <div className={styles.inputWrap} style={{ flex: 1 }}>
          <input
            type="tel"
            inputMode="tel"
            className={styles.textInput}
            placeholder="e.g. 09078117654"
            value={localValue}
            onChange={e => onLocalChange(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
      {phoneHint && (
        <p className={styles.phoneHint} style={{ color: phoneHint.ok ? 'var(--accent)' : '#ef4444' }}>
          {phoneHint.msg}
        </p>
      )}
    </Field>
  )
}

// ── Step 1 ────────────────────────────────────────────────────

function StepAccount({ data, onChange, errors }) {
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepIntro}>
        <div className={styles.stepIntroTitle}>Create your account</div>
        <div className={styles.stepIntroSub}>Your login details for TailorFlow</div>
      </div>
      <Field label="Email Address" error={errors.email}>
        <TextInput type="email" value={data.email} onChange={v => onChange('email', v)} placeholder="you@email.com" icon="mail" />
      </Field>
      <Field label="Password" hint="At least 8 characters" error={errors.password}>
        <TextInput
          type={showPass ? 'text' : 'password'}
          value={data.password}
          onChange={v => onChange('password', v)}
          placeholder="Create a password"
          icon="lock"
          rightEl={
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>
                {showPass ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          }
        />
      </Field>
      <Field label="Confirm Password" error={errors.confirmPassword}>
        <TextInput
          type={showConfirm ? 'text' : 'password'}
          value={data.confirmPassword}
          onChange={v => onChange('confirmPassword', v)}
          placeholder="Repeat your password"
          icon="lock_outline"
          rightEl={
            <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(p => !p)}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>
                {showConfirm ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          }
        />
      </Field>
    </div>
  )
}

// ── Step 2 ────────────────────────────────────────────────────

function StepPersonal({ data, onChange, errors, phoneLocal, onPhoneLocal, phoneCountry, onPhoneCountry }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepIntro}>
        <div className={styles.stepIntroTitle}>Tell us about you</div>
        <div className={styles.stepIntroSub}>Basic info shown on your profile</div>
      </div>
      <Field label="Full Name" error={errors.fullName}>
        <TextInput value={data.fullName} onChange={v => onChange('fullName', v)} placeholder="e.g. Amara Okonkwo" icon="badge" />
      </Field>
      <PhoneField
        label="Phone Number"
        error={errors.phone}
        localValue={phoneLocal}
        onLocalChange={onPhoneLocal}
        country={phoneCountry}
        onCountryChange={onPhoneCountry}
      />
      <Field label="City" error={errors.city}>
        <TextInput value={data.city} onChange={v => onChange('city', v)} placeholder="e.g. Lagos" icon="location_on" />
      </Field>
      <Field label="Country" error={errors.country}>
        <TextInput value={data.country} onChange={v => onChange('country', v)} placeholder="e.g. Nigeria" icon="public" />
      </Field>
    </div>
  )
}

// ── Step 3 — Full brand ───────────────────────────────────────

function StepBrand({ data, onChange, errors, brandPhoneLocal, onBrandPhoneLocal, brandPhoneCountry, onBrandPhoneCountry }) {
  const logoInputRef = useRef(null)

  const handleLogoChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange('brandLogo', ev.target.result)
    reader.readAsDataURL(file)
  }, [onChange])

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepIntro}>
        <div className={styles.stepIntroTitle}>Your brand</div>
        <div className={styles.stepIntroSub}>All fields are optional — update anytime from your Profile.</div>
      </div>

      {/* Logo */}
      <Field label="Brand Logo" hint="PNG or JPG. Appears on invoice headers.">
        {data.brandLogo ? (
          <div className={styles.logoPreviewWrap}>
            <img src={data.brandLogo} alt="Brand logo" className={styles.logoPreview} />
            <button type="button" className={styles.logoRemoveBtn} onClick={() => onChange('brandLogo', null)}>
              <span className="mi" style={{ fontSize: '0.9rem' }}>close</span> Remove
            </button>
          </div>
        ) : (
          <button type="button" className={styles.logoUploadBtn} onClick={() => logoInputRef.current?.click()}>
            <span className="mi">add_photo_alternate</span>
            Upload Logo
          </button>
        )}
        <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
      </Field>

      {/* Identity */}
      <Field label="Shop / Brand Name" error={errors.brandName}>
        <TextInput value={data.brandName} onChange={v => onChange('brandName', v)} placeholder="e.g. Amara Stitches" icon="store" />
      </Field>
      <Field label="Tagline" hint="Short line shown on invoices. Optional.">
        <TextInput value={data.brandTagline} onChange={v => onChange('brandTagline', v)} placeholder="e.g. Crafted with love, fitted for you" icon="format_quote" />
      </Field>

      {/* Brand colour */}
      <Field label="Brand Colour" hint="Used for accents on invoice templates. Optional.">
        <div className={styles.colourRow}>
          <input
            type="color"
            className={styles.colourPicker}
            value={data.brandColour || '#D4AF37'}
            onChange={e => onChange('brandColour', e.target.value)}
          />
          <TextInput value={data.brandColour || '#D4AF37'} onChange={v => onChange('brandColour', v)} placeholder="#D4AF37" />
        </div>
      </Field>

      {/* Contact */}
      <PhoneField
        label="Business Phone"
        hint="Optional."
        localValue={brandPhoneLocal}
        onLocalChange={onBrandPhoneLocal}
        country={brandPhoneCountry}
        onCountryChange={onBrandPhoneCountry}
      />
      <Field label="Business Email" hint="Optional.">
        <TextInput type="email" value={data.brandEmail} onChange={v => onChange('brandEmail', v)} placeholder="shop@email.com" icon="mail" />
      </Field>
      <Field label="Business Address" hint="Shown on invoices. Optional.">
        <TextInput value={data.brandAddress} onChange={v => onChange('brandAddress', v)} placeholder="12 Chief Amadi Street, Ikeja, Lagos" icon="location_on" />
      </Field>
      <Field label="Website / Social Handle" hint="Optional.">
        <TextInput value={data.brandWebsite} onChange={v => onChange('brandWebsite', v)} placeholder="instagram.com/yourbrand" icon="language" />
      </Field>

      {/* Currency */}
      <Field label="Preferred Currency">
        <SegmentControl
          options={[
            { label: '₦ Naira',  value: '₦' },
            { label: '$ Dollar', value: '$'  },
            { label: '£ Pound',  value: '£'  },
            { label: '€ Euro',   value: '€'  },
          ]}
          value={data.invoiceCurrency}
          onChange={v => onChange('invoiceCurrency', v)}
        />
      </Field>
    </div>
  )
}

// ── Step 4 — Account / Payment Details (optional) ─────────────

function StepPayment({ data, onChange }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepIntro}>
        <div className={styles.stepIntroTitle}>Account details</div>
        <div className={styles.stepIntroSub}>
          Your bank info printed on invoices so clients know where to pay.
          All fields are optional — you can add them later from your Profile.
        </div>
      </div>

      <div className={styles.paymentOptionalBadge}>
        <span className="mi" style={{ fontSize: '0.8rem' }}>info</span>
        Optional — tap "Create Account" to skip
      </div>

      <Field label="Bank Name" hint="e.g. GTBank, Access, OPay">
        <TextInput
          value={data.accountBank}
          onChange={v => onChange('accountBank', v)}
          placeholder="e.g. GTBank"
          icon="account_balance"
        />
      </Field>
      <Field label="Account Number">
        <TextInput
          value={data.accountNumber}
          onChange={v => onChange('accountNumber', v)}
          placeholder="e.g. 0123456789"
          type="tel"
          icon="tag"
        />
      </Field>
      <Field label="Account Name" hint="Name on the bank account">
        <TextInput
          value={data.accountName}
          onChange={v => onChange('accountName', v)}
          placeholder="e.g. Amara Okonkwo"
          icon="badge"
        />
      </Field>
    </div>
  )
}

// ── Progress & dots ───────────────────────────────────────────

function ProgressBar({ current, total }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${((current + 1) / total) * 100}%` }} />
    </div>
  )
}

function StepDots({ steps, current }) {
  return (
    <div className={styles.stepDots}>
      {steps.map((s, i) => (
        <div key={s.id} className={`${styles.stepDot} ${i === current ? styles.stepDotActive : ''} ${i < current ? styles.stepDotDone : ''}`}>
          {i < current
            ? <span className="mi" style={{ fontSize: '0.75rem', color: '#000' }}>check</span>
            : <span className="mi" style={{ fontSize: '0.75rem' }}>{s.icon}</span>
          }
        </div>
      ))}
    </div>
  )
}

// ── Validation ────────────────────────────────────────────────

function validateStep(stepId, data, phoneLocal, brandPhoneLocal) {
  const errors = {}
  if (stepId === 'account') {
    if (!data.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Enter a valid email'
    if (!data.password) errors.password = 'Password is required'
    else if (data.password.length < 8) errors.password = 'Must be at least 8 characters'
    if (!data.confirmPassword) errors.confirmPassword = 'Please confirm your password'
    else if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match'
  }
  if (stepId === 'personal') {
    if (!data.fullName.trim()) errors.fullName = 'Full name is required'
    if (!phoneLocal.trim()) {
      errors.phone = 'Phone number is required'
    } else {
      const digits = phoneLocal.replace(/\D/g, '')
      const valid = (digits.length === 10) || (digits.length === 11 && digits.startsWith('0'))
      if (!valid) errors.phone = 'Enter a valid 10-digit number (or 11 starting with 0)'
    }
  }
  // Brand and payment — all optional, no required fields
  return errors
}

const INITIAL = {
  email: '', password: '', confirmPassword: '',
  fullName: '', phone: '', city: '', country: '',
  brandName: '', brandTagline: '', brandColour: '#D4AF37',
  brandLogo: null, brandPhone: '', brandEmail: '',
  brandAddress: '', brandWebsite: '', invoiceCurrency: '₦',
  // Account / payment details
  accountBank: '', accountNumber: '', accountName: '',
}

// ── Main ──────────────────────────────────────────────────────

export default function Signup() {
  const { signup } = useAuth()
  const navigate   = useNavigate()

  const [step,      setStep]      = useState(0)
  const [data,      setData]      = useState(INITIAL)
  const [errors,    setErrors]    = useState({})
  const [authError, setAuthError] = useState('')
  const [loading,   setLoading]   = useState(false)

  // ── Separate local phone state for both phone fields ──────
  const [phoneLocal,        setPhoneLocal]        = useState('')
  const [phoneCountry,      setPhoneCountry]      = useState(DEFAULT_COUNTRY)
  const [brandPhoneLocal,   setBrandPhoneLocal]   = useState('')
  const [brandPhoneCountry, setBrandPhoneCountry] = useState(DEFAULT_COUNTRY)

  const currentStep = STEPS[step]

  const handleChange = useCallback((key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }, [])

  const submit = async (finalData, builtPhone, builtBrandPhone) => {
    setLoading(true)
    setAuthError('')
    try {
      const cred = await signup(finalData.email.trim(), finalData.password)
      await updateProfile(cred.user, { displayName: finalData.fullName.trim() })

      // Save personal info to localStorage
      try {
        localStorage.setItem('tailorbook_personal', JSON.stringify({
          fullName: finalData.fullName.trim(),
          email:    finalData.email.trim(),
          phone:    builtPhone,
          city:     finalData.city.trim(),
          country:  finalData.country.trim(),
        }))
      } catch { /* ignore */ }

      // Save brand + account settings to localStorage — SettingsContext reads this on mount
      try {
        const existingRaw = localStorage.getItem('tailorflow_profile_settings')
        const existing    = existingRaw ? JSON.parse(existingRaw) : { ...DEFAULTS }
        localStorage.setItem('tailorflow_profile_settings', JSON.stringify({
          ...existing,
          brandName:       finalData.brandName.trim(),
          brandTagline:    finalData.brandTagline.trim(),
          brandColour:     finalData.brandColour || '#D4AF37',
          brandPhone:      builtBrandPhone,
          brandEmail:      finalData.brandEmail.trim(),
          brandAddress:    finalData.brandAddress.trim(),
          brandWebsite:    finalData.brandWebsite.trim(),
          invoiceCurrency: finalData.invoiceCurrency,
          // Account / payment details
          accountBank:     finalData.accountBank.trim(),
          accountNumber:   finalData.accountNumber.trim(),
          accountName:     finalData.accountName.trim(),
        }))
        if (finalData.brandLogo) {
          localStorage.setItem('tailorbook_brand_logo', finalData.brandLogo)
        }
      } catch { /* ignore quota errors */ }

      navigate('/', { replace: true })
    } catch (err) {
      setAuthError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    const errs = validateStep(currentStep.id, data, phoneLocal, brandPhoneLocal)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (step < STEPS.length - 1) { setStep(s => s + 1); return }

    // Last step — build phone strings and submit
    const builtPhone      = buildPhoneNumber(phoneLocal, phoneCountry.dial_code) || phoneLocal
    const builtBrandPhone = brandPhoneLocal.trim()
      ? (buildPhoneNumber(brandPhoneLocal, brandPhoneCountry.dial_code) || brandPhoneLocal)
      : ''

    await submit(data, builtPhone, builtBrandPhone)
  }

  // "Skip" only shown on the payment step — jumps straight to submit with empty payment fields
  const handleSkip = async () => {
    const builtPhone      = buildPhoneNumber(phoneLocal, phoneCountry.dial_code) || phoneLocal
    const builtBrandPhone = brandPhoneLocal.trim()
      ? (buildPhoneNumber(brandPhoneLocal, brandPhoneCountry.dial_code) || brandPhoneLocal)
      : ''

    await submit(data, builtPhone, builtBrandPhone)
  }

  const handleBack = () => { setErrors({}); setStep(s => s - 1) }
  const isLast = step === STEPS.length - 1
  const isPaymentStep = currentStep.id === 'payment'

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        {step > 0
          ? <button className={styles.topBack} onClick={handleBack} type="button">
              <span className="mi">arrow_back</span>
            </button>
          : <div className={styles.topBack} />
        }
        <div className={styles.topLogo}>
          <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>content_cut</span>
          <span className={styles.topLogoText}>TailorFlow</span>
        </div>
        {/* Skip button visible only on payment step */}
        {isPaymentStep
          ? <button className={styles.skipBtn} onClick={handleSkip} type="button" disabled={loading}>
              Skip
            </button>
          : <div className={styles.topBack} />
        }
      </div>

      <ProgressBar current={step} total={STEPS.length} />

      <div className={styles.scrollArea}>
        <StepDots steps={STEPS} current={step} />
        <div className={styles.stepMeta}>
          <span className={styles.stepCounter}>Step {step + 1} of {STEPS.length}</span>
        </div>

        {currentStep.id === 'account'  && <StepAccount  data={data} onChange={handleChange} errors={errors} />}
        {currentStep.id === 'personal' && (
          <StepPersonal
            data={data}
            onChange={handleChange}
            errors={errors}
            phoneLocal={phoneLocal}
            onPhoneLocal={v => { setPhoneLocal(v); setErrors(prev => { const e = { ...prev }; delete e.phone; return e }) }}
            phoneCountry={phoneCountry}
            onPhoneCountry={setPhoneCountry}
          />
        )}
        {currentStep.id === 'brand' && (
          <StepBrand
            data={data}
            onChange={handleChange}
            errors={errors}
            brandPhoneLocal={brandPhoneLocal}
            onBrandPhoneLocal={setBrandPhoneLocal}
            brandPhoneCountry={brandPhoneCountry}
            onBrandPhoneCountry={setBrandPhoneCountry}
          />
        )}
        {currentStep.id === 'payment' && (
          <StepPayment data={data} onChange={handleChange} />
        )}

        {authError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', marginBottom: 12 }}>
            {authError}
          </div>
        )}

        <button className={styles.ctaBtn} onClick={handleNext} type="button" disabled={loading}>
          {loading ? 'Creating account…' : isLast ? 'Create Account' : 'Continue'}
          {!loading && (
            <span className="mi" style={{ fontSize: '1.1rem' }}>
              {isLast ? 'check' : 'arrow_forward'}
            </span>
          )}
        </button>

        {step === 0 && (
          <p className={styles.loginPrompt}>
            Already have an account?{' '}
            <button type="button" className={styles.loginLink} onClick={() => navigate('/login')}>
              Log in
            </button>
          </p>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':   return 'This email is already registered. Try logging in.'
    case 'auth/invalid-email':          return 'Enter a valid email address.'
    case 'auth/weak-password':          return 'Password must be at least 6 characters.'
    case 'auth/network-request-failed': return 'Network error. Check your connection.'
    default:                            return 'Something went wrong. Please try again.'
  }
}
