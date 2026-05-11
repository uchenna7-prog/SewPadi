// src/pages/Portfolio/Portfolio.jsx
// Public-facing tailor landing page — no auth required
// Route: /portfolio/:handle
//
// Brand colours are applied entirely via CSS variables injected
// by useBrandTokens(). No inline hex anywhere in this file.

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot, doc, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { getBrandFromFirestore } from '../../services/brandService'
import { getPortfolioSettings } from '../../services/portfolioSettingsService'
import { resolveSlug } from '../../services/slugService'
import { useBrandTokens } from '../../hooks/useBrandTokens'
import styles from './Portfolio.module.css'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Social helpers ────────────────────────────────────────────
function buildSocialUrl(platform, handle) {
  const h = handle.replace(/^@/, '')
  switch (platform) {
    case 'instagram': return `https://instagram.com/${h}`
    case 'tiktok':    return `https://tiktok.com/@${h}`
    case 'facebook':  return `https://facebook.com/${h}`
    case 'twitter':   return `https://x.com/${h}`
    case 'youtube':   return `https://youtube.com/@${h}`
    case 'pinterest': return `https://pinterest.com/${h}`
    case 'threads':   return `https://threads.net/@${h}`
    default:          return `https://${h}`
  }
}

const SOCIAL_ICONS = {
  instagram: (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>),
  facebook:  (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>),
  tiktok:    (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>),
  twitter:   (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.849L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>),
  youtube:   (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>),
  pinterest: (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>),
  threads:   (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068c0-3.51.85-6.37 2.495-8.424C5.845 1.341 8.598.16 12.18.136h.014c2.744.018 5.143.854 6.928 2.417 1.688 1.476 2.697 3.54 2.997 6.135l-2.172.255c-.527-4.499-3.224-6.64-7.769-6.64h-.01c-2.898.018-5.119.929-6.601 2.706C4.085 6.713 3.342 9.13 3.342 12.07c0 2.936.743 5.351 2.212 7.195 1.482 1.777 3.703 2.688 6.601 2.706h.01c2.558-.016 4.242-.684 5.467-2.165.853-1.02 1.428-2.479 1.703-4.337-.937.22-1.952.331-3.023.317-2.667-.035-4.879-.917-6.157-2.473-1.126-1.37-1.584-3.168-1.29-5.063.559-3.584 3.297-5.896 7.045-5.896h.047c2.075.014 3.87.654 5.19 1.851 1.435 1.3 2.219 3.166 2.269 5.408.033 1.462-.22 2.786-.752 3.936l-1.953-.84c.41-.953.6-2.03.572-3.165-.037-1.704-.584-3.071-1.581-3.965-.869-.787-2.106-1.196-3.731-1.206h-.034c-2.798 0-4.677 1.598-5.076 4.153-.235 1.503.089 2.856.909 3.83.889 1.052 2.302 1.654 4.16 1.68 1.43.019 2.701-.26 3.715-.697-.054-.53-.155-1.025-.3-1.474-.45-1.388-1.402-2.17-2.705-2.17-.876 0-1.611.34-2.139.982-.5.605-.74 1.434-.68 2.33l-2.16-.15c-.089-1.346.334-2.636 1.175-3.638.886-1.055 2.173-1.637 3.804-1.637 2.248 0 3.845 1.28 4.565 3.542.247.762.377 1.604.387 2.498z"/></svg>),
}

function SocialIcon({ platform }) {
  return SOCIAL_ICONS[platform] || (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
    </svg>
  )
}

const WA_SVG = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// ── Booking Sheet ─────────────────────────────────────────────
function BookingSheet({ isOpen, onClose, brandName, brandEmail, brandPhone }) {
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [garment,  setGarment]  = useState('')
  const [deadline, setDeadline] = useState('')
  const [message,  setMessage]  = useState('')
  const [sent,     setSent]     = useState(false)
  const [visible,  setVisible]  = useState(false)

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return
    const deadlineLine = deadline ? `%0ADeadline / Occasion Date: ${deadline}` : ''
    const msg = `Hello ${brandName},%0A%0AI'd like to place an order.%0A%0AName: ${name}%0APhone: ${phone}%0AGarment: ${garment}${deadlineLine}%0ADetails: ${message}`
    if (brandPhone) {
      window.open(`https://wa.me/${brandPhone.replace(/\D/g,'')}?text=${msg}`, '_blank', 'noopener,noreferrer')
    } else if (brandEmail) {
      window.open(`mailto:${brandEmail}?subject=Order Enquiry&body=${decodeURIComponent(msg.replace(/%0A/g,'\n'))}`)
    }
    setSent(true)
    setTimeout(() => {
      setSent(false); onClose()
      setName(''); setPhone(''); setGarment(''); setDeadline(''); setMessage('')
    }, 2500)
  }

  return (
    <div className={`${styles.bookingOverlay} ${visible ? styles.bookingOverlayVisible : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`${styles.bookingDrawer} ${visible ? styles.bookingDrawerVisible : ''}`}>
        <div className={styles.drawerHandle} />
        {sent ? (
          <div className={styles.sentState}>
            <div className={styles.sentCheck}><span className="mi">check</span></div>
            <p className={styles.sentTitle}>Request Received</p>
            <p className={styles.sentSub}>{brandName} will be in touch shortly.</p>
          </div>
        ) : (
          <>
            <div className={styles.drawerHead}>
              <div>
                <p className={styles.drawerLabel}>PLACE AN ORDER</p>
                <p className={styles.drawerTitle}>Book {brandName}</p>
              </div>
              <button className={styles.drawerClose} onClick={onClose}><span className="mi">close</span></button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Full Name *</label>
                <input className={styles.fieldInput} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Phone Number *</label>
                <input className={styles.fieldInput} placeholder="e.g. 0812 345 6789" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Garment Type</label>
                <input className={styles.fieldInput} placeholder="e.g. Suit, Dress, Agbada…" value={garment} onChange={e => setGarment(e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Occasion / Deadline Date</label>
                <input className={styles.fieldInput} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ colorScheme: 'light dark' }} />
                <span className={styles.fieldHint}>When do you need this ready?</span>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Additional Details</label>
                <textarea className={styles.fieldTextarea} placeholder="Fabric preferences, measurements, colour…" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
              </div>
            </div>
            <div className={styles.drawerFooter}>
              <button className={styles.sendBtn} onClick={handleSubmit} disabled={!name.trim() || !phone.trim()}>
                Send Booking Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ photo, photos, onClose }) {
  const [idx, setIdx] = useState(() => photos.findIndex(p => p.id === photo.id))
  const current = photos[idx] || photo

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  setIdx(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft')   setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [photos, onClose])

  return (
    <div className={styles.lbOverlay} onClick={onClose}>
      <div className={styles.lbInner} onClick={e => e.stopPropagation()}>
        <button className={styles.lbClose} onClick={onClose}><span className="mi">close</span></button>
        <img src={current.src || current.storageUrl} alt={current.caption} className={styles.lbImg} />
        {photos.length > 1 && (
          <>
            {idx > 0 && (
              <button className={`${styles.lbNav} ${styles.lbLeft}`} onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}>
                <span className="mi">chevron_left</span>
              </button>
            )}
            {idx < photos.length - 1 && (
              <button className={`${styles.lbNav} ${styles.lbRight}`} onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}>
                <span className="mi">chevron_right</span>
              </button>
            )}
          </>
        )}
        {(current.caption || current.price) && (
          <div className={styles.lbMeta}>
            {current.caption && <p className={styles.lbCaption}>{current.caption}</p>}
            <div className={styles.lbTags}>
              {current.clothingTypeLabel && <span className={styles.lbType}>{current.clothingTypeLabel}</span>}
              {current.price && <span className={styles.lbPrice}>From ₦{current.price}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function Portfolio() {
  const { handle } = useParams()

  const [resolvedUid,   setResolvedUid]   = useState(null)
  const [brand,         setBrand]         = useState(null)
  const [photos,        setPhotos]        = useState([])
  const [dressTypes,    setDressTypes]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [activeTab,     setActiveTab]     = useState(null)
  const [lightbox,      setLightbox]      = useState(null)
  const [bookingOpen,   setBookingOpen]   = useState(false)
  const [navScrolled,   setNavScrolled]   = useState(false)
  const [navOpen,       setNavOpen]       = useState(false)
  const [lightMode,     setLightMode]     = useState(true)
  const [heroImageId,   setHeroImageId]   = useState(null)
  const [footerImageId, setFooterImageId] = useState(null)
  const [reviews,       setReviews]       = useState([])
  const [activeNav,     setActiveNav]     = useState('home')

  const worksRef        = useRef(null)
  const aboutRef        = useRef(null)
  const bookRef         = useRef(null)
  const heroRef         = useRef(null)
  const filterScrollRef = useRef(null)
  const pageRef         = useRef(null)

  useEffect(() => {
    if (!handle) { setNotFound(true); setLoading(false); return }
    const looksLikeUid = /[A-Z]/.test(handle)
    if (looksLikeUid) {
      setResolvedUid(handle)
    } else {
      resolveSlug(handle)
        .then(uid => { if (!uid) { setNotFound(true); setLoading(false) } else setResolvedUid(uid) })
        .catch(() => { setNotFound(true); setLoading(false) })
    }
  }, [handle])

  useEffect(() => {
    if (!resolvedUid) return
    getBrandFromFirestore(resolvedUid)
      .then(data => { if (!data) setNotFound(true); else setBrand(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [resolvedUid])

  // Inject brand CSS variable tokens onto :root so all CSS var(--brand-*)
  // references work regardless of where in the tree they appear.
  // No ref passed — defaults to document.documentElement, no cleanup on unmount.
  useBrandTokens(brand?.brandColourId)

  useEffect(() => {
    if (!resolvedUid) return
    const q = query(collection(db, 'users', resolvedUid, 'galleryPhotos'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
  }, [resolvedUid])

  useEffect(() => {
    if (!resolvedUid) return
    return onSnapshot(
      doc(db, 'users', resolvedUid, 'galleryDressTypes', 'completed_works'),
      snap => setDressTypes(snap.exists() ? (snap.data().types ?? []) : []),
      () => {}
    )
  }, [resolvedUid])

  useEffect(() => {
    if (!resolvedUid) return
    getPortfolioSettings(resolvedUid)
      .then(({ heroImageId: h, footerImageId: f }) => { setHeroImageId(h); setFooterImageId(f) })
      .catch(() => {})
  }, [resolvedUid])

  useEffect(() => {
    if (!resolvedUid) return
    const q = query(collection(db, 'users', resolvedUid, 'reviews'), where('status', '==', 'approved'), orderBy('approvedAt', 'desc'))
    return onSnapshot(q, snap => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
  }, [resolvedUid])

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const sections = [
      { id: 'home',  ref: heroRef  },
      { id: 'about', ref: aboutRef },
      { id: 'works', ref: worksRef },
      { id: 'book',  ref: bookRef  },
    ]
    const observers = sections.map(({ id, ref }) => {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActiveNav(id) }, { rootMargin: '-50% 0px -50% 0px' })
      if (ref.current) obs.observe(ref.current)
      return obs
    })
    return () => observers.forEach((obs, i) => { if (sections[i].ref.current) obs.unobserve(sections[i].ref.current) })
  }, [brand])

  const handleTabChange = tabId => {
    setActiveTab(tabId)
    if (filterScrollRef.current) {
      const el = filterScrollRef.current.querySelector(`[data-tab="${tabId ?? 'all'}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  const scrollTo = ref => { setNavOpen(false); ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingLine} />
        <p className={styles.loadingText}>Loading</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className={styles.notFoundScreen}>
        <span className="mi" style={{ fontSize: '3rem', color: '#bbb' }}>content_cut</span>
        <p className={styles.notFoundTitle}>Portfolio not found</p>
        <p className={styles.notFoundSub}>This tailor hasn't set up their portfolio yet.</p>
      </div>
    )
  }

  const brandName       = brand.brandName    || 'The Tailor'
  const tagline         = brand.brandTagline || ''
  const brandBio        = brand.brandBio     || ''
  const completedPhotos = photos.filter(p => p.category === 'completed_works')
  const filteredPhotos  = activeTab ? completedPhotos.filter(p => p.clothingType === activeTab) : completedPhotos
  const heroPhoto       = (heroImageId   ? completedPhotos.find(p => p.id === heroImageId)   : null) ?? completedPhotos[0] ?? null
  const footerPhoto     = (footerImageId ? completedPhotos.find(p => p.id === footerImageId) : null) ?? completedPhotos[1] ?? null
  const foundedYear       = brand.brandFoundedYear       || ''
  const turnaround        = brand.brandTurnaround        || ''
  const serviceArea       = brand.brandServiceArea       || ''
  const styleStatement    = brand.brandStyleStatement    || ''
  const featuredTechnique = brand.brandFeaturedTechnique || ''
  const milestone         = brand.brandMilestone         || ''
  const availability      = brand.brandAvailability      || 'open'
  const availableUntil    = brand.brandAvailableUntil    || ''
  const statGarments      = milestone || (completedPhotos.length ? `${completedPhotos.length}+` : '—')

  return (
    <div className={`${styles.page} ${lightMode ? styles.lightMode : ''}`} ref={pageRef}>

      {/* ── NAV ── */}
      <nav className={`${styles.nav} ${navScrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <span className={styles.navBrand}>{brandName}</span>
          <div className={`${styles.navLinks} ${navOpen ? styles.navLinksOpen : ''}`}>
            <div className={styles.navHomeRow}>
              <button className={styles.themeToggleMobileInline} onClick={() => setLightMode(m => !m)} aria-label="Toggle theme">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="currentColor"/>
                </svg>
              </button>
              <button onClick={() => { setNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className={`${styles.navLink} ${activeNav === 'home' ? styles.navLinkActive : ''}`}>Home</button>
              <span className={styles.navHomeRowSpacer} />
            </div>
            <button onClick={() => scrollTo(aboutRef)} className={`${styles.navLink} ${activeNav === 'about' ? styles.navLinkActive : ''}`}>About</button>
            <button onClick={() => scrollTo(worksRef)} className={`${styles.navLink} ${activeNav === 'works' ? styles.navLinkActive : ''}`}>Works</button>
            <button onClick={() => scrollTo(bookRef)}  className={`${styles.navLink} ${activeNav === 'book'  ? styles.navLinkActive : ''}`}>Book</button>
            <button onClick={() => { setNavOpen(false); setBookingOpen(true) }} className={styles.navCta}>Order Now</button>
          </div>
          <div className={styles.navRight}>
            <button className={styles.themeToggleDesktop} onClick={() => setLightMode(m => !m)} aria-label="Toggle theme">
              <span className="material-icons">{lightMode ? 'dark_mode' : 'light_mode'}</span>
            </button>
            <button className={styles.navHamburger} onClick={() => setNavOpen(o => !o)} aria-label="Menu">
              <span className={`${styles.hamLine} ${navOpen ? styles.hamLineToTop    : ''}`} />
              <span className={`${styles.hamLine} ${navOpen ? styles.hamLineToBottom : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero} ref={heroRef}>
        {heroPhoto
          ? <div className={styles.heroBgWrap}><img src={heroPhoto.src || heroPhoto.storageUrl} alt="" className={styles.heroBgImg} /><div className={styles.heroBgOverlay} /></div>
          : <div className={styles.heroBgFallback} />
        }
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>— {brandName} —</p>
          <h1 className={styles.heroName}>{brandName}</h1>
          {tagline        && <p className={styles.heroTagline}>{tagline}</p>}
          {styleStatement && <p className={styles.heroStyleStatement}>"{styleStatement}"</p>}
          <div className={styles.heroCtas}>
            <button className={styles.heroPrimary} onClick={() => setBookingOpen(true)}>Place an Order</button>
            <button className={styles.heroSecondary} onClick={() => scrollTo(worksRef)}>View Works</button>
          </div>
          {availability === 'open'
            ? <span className={styles.heroAvailBadge}><span className={styles.heroDot} />Available for orders</span>
            : <span className={`${styles.heroAvailBadge} ${styles.heroAvailBadgeBooked}`}>
                <span className={`${styles.heroDot} ${styles.heroDotBooked}`} />
                {availableUntil ? `Booked until ${new Date(availableUntil).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : 'Currently booked'}
              </span>
          }
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}><span className={styles.statNum}>{statGarments}</span><span className={styles.statLabel}>Garments Made</span></div>
        {serviceArea && <div className={styles.statItem}><span className={styles.statNum}>{serviceArea}</span><span className={styles.statLabel}>Service Area</span></div>}
        {foundedYear
          ? <div className={styles.statItem}><span className={styles.statNum}>{new Date().getFullYear() - parseInt(foundedYear)}+</span><span className={styles.statLabel}>Years Crafting</span></div>
          : <div className={styles.statItem}><span className={styles.statIcon + ' mi'}>verified</span><span className={styles.statLabel}>Bespoke Only</span></div>
        }
      </div>

      {/* ── ABOUT ── */}
      <section className={styles.about} ref={aboutRef}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutLeft}>
            <p className={styles.sectionEyebrow}>01 — About</p>
            <h2 className={styles.aboutHeading}>{brandName}</h2>
            {tagline && <p className={styles.aboutHeadingTagline}>"{tagline}"</p>}
          </div>
          <div className={styles.aboutRight}>
            <div className={styles.aboutCard}>
              <div className={styles.aboutLogo}>
                {brand.brandLogo
                  ? <img src={brand.brandLogo} alt={brandName} className={styles.aboutLogoImg} />
                  : <div className={styles.aboutInitials}>{initials(brandName)}</div>
                }
              </div>
              <p className={styles.aboutName}>{brandName}</p>
              {tagline        && <p className={styles.aboutTagline}>"{tagline}"</p>}
              {styleStatement && <p className={styles.aboutStyleStatement}>{styleStatement}</p>}
              {brandBio       && <p className={styles.aboutBio}>{brandBio}</p>}

              {(turnaround || serviceArea || featuredTechnique || foundedYear) && (
                <div className={styles.aboutInfoGrid}>
                  {foundedYear       && <div className={styles.aboutInfoItem}><span className="material-icons">history</span><span>Crafting since {foundedYear}</span></div>}
                  {turnaround        && <div className={styles.aboutInfoItem}><span className="material-icons">schedule</span><span>{turnaround}</span></div>}
                  {serviceArea       && <div className={styles.aboutInfoItem}><span className="material-icons">place</span><span>{serviceArea}</span></div>}
                  {featuredTechnique && <div className={styles.aboutInfoItem}><span className="material-icons">auto_fix_high</span><span>{featuredTechnique}</span></div>}
                </div>
              )}

              {dressTypes.length > 0 && (
                <div className={styles.aboutSpecialties}>
                  <p className={styles.aboutSpecialtiesLabel}>Specialises in</p>
                  <div className={styles.aboutSpecialtiesList}>
                    {dressTypes.map(t => <span key={t.id} className={styles.aboutSpecialtyPill}>{t.label}</span>)}
                  </div>
                </div>
              )}

              <div className={styles.aboutMeta}>
                {brand.brandAddress && <div className={styles.aboutMetaRow}><span className="material-icons">location_on</span><span>{brand.brandAddress}</span></div>}
                {brand.brandPhone   && <a href={`tel:${brand.brandPhone}`}           className={styles.aboutMetaRow}><span className="material-icons">call</span><span>{brand.brandPhone}</span></a>}
                {brand.brandEmail   && <a href={`mailto:${brand.brandEmail}`}        className={styles.aboutMetaRow}><span className="material-icons">mail</span><span>{brand.brandEmail}</span></a>}
                {brand.brandWebsite && <a href={brand.brandWebsite} target="_blank" rel="noopener noreferrer" className={styles.aboutMetaRow}><span className="material-icons">language</span><span>{brand.brandWebsite}</span></a>}
              </div>

              {brand.brandPhone && (
                <div className={styles.aboutSocials}>
                  <a href={`https://wa.me/${brand.brandPhone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="WhatsApp">{WA_SVG}</a>
                  {(brand.brandSocials || []).map((s, i) => (
                    <a key={i} href={buildSocialUrl(s.platform, s.handle)} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label={s.platform}>
                      <SocialIcon platform={s.platform} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      {dressTypes.length > 0 && (
        <div className={styles.marqueeWrap}>
          <div className={styles.marqueeTrack}>
            {[...dressTypes, ...dressTypes, ...dressTypes, ...dressTypes].map((t, i) => (
              <span key={i} className={styles.marqueeItem}>
                {t.label}
                <span className="mi" style={{ fontSize: '0.5rem', margin: '0 16px', opacity: 0.4, verticalAlign: 'middle' }}>fiber_manual_record</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── WORKS ── */}
      <section className={styles.works} ref={worksRef}>
        <div className={styles.worksHead}>
          <p className={styles.sectionEyebrow}>02 — Portfolio</p>
          <h2 className={styles.worksTitle}>Completed Works</h2>
          <p className={styles.worksSub}>Every piece is a testament to precision and craft.</p>
        </div>
        {dressTypes.length > 0 && (
          <div className={styles.filterBar}>
            <div className={styles.filterScroll} ref={filterScrollRef}>
              <button data-tab="all" className={`${styles.filterPill} ${!activeTab ? styles.filterPillActive : ''}`} onClick={() => handleTabChange(null)}>All</button>
              {dressTypes.map(t => (
                <button key={t.id} data-tab={t.id} className={`${styles.filterPill} ${activeTab === t.id ? styles.filterPillActive : ''}`} onClick={() => handleTabChange(t.id)}>{t.label}</button>
              ))}
            </div>
          </div>
        )}
        {filteredPhotos.length === 0
          ? <div className={styles.emptyWorks}><p>No works in this category yet.</p></div>
          : <div className={styles.photoGrid}>
              {filteredPhotos.map((photo, i) => (
                <div key={photo.id} className={`${styles.photoCard} ${i === 0 ? styles.photoCardFeatured : ''}`} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => setLightbox(photo)}>
                  <img src={photo.src || photo.storageUrl} alt={photo.caption || 'Completed work'} className={styles.photoImg} loading="lazy" />
                  {photo.price && <span className={styles.photoPrice}>From ₦{photo.price}</span>}
                  <div className={styles.photoOverlay}>
                    <span className={`mi ${styles.photoZoom}`}>open_in_full</span>
                    {photo.caption          && <p className={styles.photoCaption}>{photo.caption}</p>}
                    {photo.clothingTypeLabel && <span className={styles.photoType}>{photo.clothingTypeLabel}</span>}
                  </div>
                </div>
              ))}
            </div>
        }
      </section>

      {/* ── PROCESS ── */}
      <section className={styles.process}>
        <div className={styles.processInner}>
          <p className={styles.sectionEyebrow}>03 — Process</p>
          <h2 className={styles.processTitle}>From Idea<br />to Outfit</h2>
          <div className={styles.processSteps}>
            {[
              { num: '01', title: 'Consultation', desc: 'Share your vision, occasion, and deadline. We listen carefully.' },
              { num: '02', title: 'Measurements', desc: 'Precise measurements taken for a flawless custom fit.' },
              { num: '03', title: 'Crafting',     desc: 'Every stitch placed with intention, skill, and care.' },
              { num: '04', title: 'Delivery',     desc: turnaround ? `${turnaround}. Your bespoke garment, delivered to perfection.` : 'Your bespoke garment, delivered to perfection.' },
            ].map(step => (
              <div key={step.num} className={styles.processStep}>
                <div className={styles.processNumWrap}><div className={styles.processNumBadge}>{step.num}</div></div>
                <div className={styles.processLine} />
                <div className={styles.processStepContent}>
                  <p className={styles.processStepTitle}>{step.title}</p>
                  <p className={styles.processStepDesc}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {reviews.length > 0 && (
        <section className={styles.testimonials}>
          <div className={styles.testimonialsInner}>
            <p className={styles.sectionEyebrow}>04 — Testimonials</p>
            <h2 className={styles.testimonialsTitle}>What Clients Say</h2>
            <div className={styles.testimonialsGrid}>
              {reviews.map(r => (
                <div key={r.id} className={styles.testimonialCard}>
                  <div className={styles.testimonialStars}>
                    {[1,2,3,4,5].map(n => <span key={n} className={`material-icons ${styles.star} ${n <= r.rating ? styles.starFilled : ''}`}>star</span>)}
                  </div>
                  <p className={styles.testimonialText}>"{r.review}"</p>
                  <div className={styles.testimonialAuthor}>
                    <div className={styles.testimonialAvatar}>{(r.customerName || '?').charAt(0).toUpperCase()}</div>
                    <span className={styles.testimonialName}>{r.customerName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOOK CTA ── */}
      <section className={styles.bookSection} ref={bookRef}>
        {footerPhoto
          ? <div className={styles.bookBgWrap}><img src={footerPhoto.src || footerPhoto.storageUrl} alt="" className={styles.bookBgImg} /><div className={styles.bookBgOverlay} /></div>
          : <div className={styles.bookBgFallback} />
        }
        <div className={styles.bookContent}>
          <p className={styles.sectionEyebrowLight}>05 — Book</p>
          <h2 className={styles.bookTitle}>Ready for<br />something<br /><span className={styles.bookTitleAccent}>extraordinary?</span></h2>
          <p className={styles.bookSub}>Every garment is made to order.<br />Let's create yours.</p>
          {turnaround && (
            <p className={styles.bookTurnaround}>
              <span className="material-icons" style={{ fontSize: '0.85rem', verticalAlign: 'middle', marginRight: 6 }}>schedule</span>
              {turnaround}
            </p>
          )}
          <button className={styles.bookCta} onClick={() => setBookingOpen(true)}>Place Your Order</button>
          {brand.brandPhone && (
            <a href={`https://wa.me/${brand.brandPhone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className={styles.bookWhatsapp}>
              {WA_SVG} WhatsApp us
            </a>
          )}
          <div className={styles.bookContacts}>
            {brand.brandPhone && <a href={`tel:${brand.brandPhone}`}    className={styles.bookContact}><span className="mi">call</span>{brand.brandPhone}</a>}
            {brand.brandEmail && <a href={`mailto:${brand.brandEmail}`} className={styles.bookContact}><span className="mi">mail</span>{brand.brandEmail}</a>}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrandBlock}>
            <p className={styles.footerBrand}>{brandName}</p>
            {tagline     && <p className={styles.footerTagline}>{tagline}</p>}
            {foundedYear && <p className={styles.footerFounded}>Crafting since {foundedYear}</p>}
          </div>
          {brand.brandPhone && (
            <div className={styles.footerSocials}>
              <a href={`https://wa.me/${brand.brandPhone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className={styles.footerSocialIcon} aria-label="WhatsApp">{WA_SVG}</a>
              {(brand.brandSocials || []).map((s, i) => (
                <a key={i} href={buildSocialUrl(s.platform, s.handle)} target="_blank" rel="noopener noreferrer" className={styles.footerSocialIcon} aria-label={s.platform}>
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className={styles.footerDivider} />
        <div className={styles.footerCols}>
          <div className={styles.footerCol}>
            <p className={styles.footerColLabel}>Contact</p>
            {brand.brandAddress && <div className={styles.footerColRow}><span className="material-icons">location_on</span><span>{brand.brandAddress}</span></div>}
            {brand.brandEmail   && <a href={`mailto:${brand.brandEmail}`} className={styles.footerColRow}><span className="material-icons">mail</span><span>{brand.brandEmail}</span></a>}
            {brand.brandPhone   && <a href={`tel:${brand.brandPhone}`}    className={styles.footerColRow}><span className="material-icons">call</span><span>{brand.brandPhone}</span></a>}
          </div>
          <div className={styles.footerCol}>
            <p className={styles.footerColLabel}>Quick Links</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={styles.footerColLink}>Home</button>
            {aboutRef.current && <button onClick={() => scrollTo(aboutRef)} className={styles.footerColLink}>About</button>}
            {worksRef.current && <button onClick={() => scrollTo(worksRef)} className={styles.footerColLink}>Portfolio</button>}
            {bookRef.current  && <button onClick={() => scrollTo(bookRef)}  className={styles.footerColLink}>Book</button>}
          </div>
        </div>
        <div className={styles.footerDividerFaint} />
        <div className={styles.footerBottom}>
          <p className={styles.footerPowered}>
            {brandName} © {new Date().getFullYear()} · Powered by <span className={styles.footerPoweredBrand}>SewPadi</span>
          </p>
        </div>
      </footer>

      {lightbox && <Lightbox photo={lightbox} photos={filteredPhotos} onClose={() => setLightbox(null)} />}
      <BookingSheet isOpen={bookingOpen} onClose={() => setBookingOpen(false)} brandName={brandName} brandEmail={brand.brandEmail} brandPhone={brand.brandPhone} />
    </div>
  )
}
