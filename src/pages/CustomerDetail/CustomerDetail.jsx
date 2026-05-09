// src/pages/CustomerDetail/CustomerDetail.jsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { usePremium } from '../../contexts/PremiumContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import { useOrders } from '../../contexts/OrdersContext'
import { useInvoice } from '../../contexts/InvoiceContext'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { useGeneralSettings } from '../../contexts/GeneralSettingsContext'
import { useProfileSettings } from '../../contexts/ProfileSettingsContext'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import MeasurementsTab from './tabs/MeasurementsTab/MeasurementsTab'
import OrdersTab from './tabs/OrdersTab/OrdersTab'
import InvoicesTab from './tabs/InvoicesTab/InvoicesTab'
import PaymentsTab from './tabs/PaymentsTab/PaymentsTab'
import ReceiptsTab from './tabs/ReceiptsTab/ReceiptsTab'
import styles from './CustomerDetail.module.css'



function getInitials(name) {
  if (!name) return ""

  // Common titles to ignore
  const titles = [
    "mr",
    "mrs",
    "miss",
    "ms",
    "master",
    "mistress",
    "dr",
    "doctor",
    "chief",
    "prof",
    "professor",
    "sir",
    "madam",
    "mister",
    "rev",
    "reverend",
    "hon",
    "honorable",
    "alhaji",
    "alhaja",
    "pastor",
    "bishop",
    "prince",
    "princess",
    "capt",
    "captain",
    "eng",
    "engineer",
  ]

  // Clean and split name
  const parts = name
    .toLowerCase()
    .replace(/\./g, "") // remove dots
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  // Remove titles
  const filtered = parts.filter(word => !titles.includes(word))

  if (filtered.length === 0) return ""

  // If only one real name remains
  if (filtered.length === 1) {
    const single = filtered[0].replace(/-/g, "")

    // Return first 2 letters if possible
    return single.slice(0, 2).toUpperCase()
  }

  // Get first and last real names
  const first = filtered[0]
  const last = filtered[filtered.length - 1]

  // Handle hyphenated names like Mary-Jane
  const firstInitial = first.replace(/-/g, "")[0]
  const lastInitial = last.replace(/-/g, "")[0]

  return (firstInitial + lastInitial).toUpperCase()
}

function formatLastOrderDate(dateStr) {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    if (isNaN(date)) return dateStr
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function getBirthday(birthday) {
  if (!birthday) return null
  const date = new Date(birthday)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function readBrandSnapshot(localStorageSettingsSnap, profileSettings) {
  return {
    name:     localStorageSettingsSnap.brandName      ||  profileSettings?.name     || '',
    tagline:  localStorageSettingsSnap.brandTagline   ||  profileSettings?.tagline  || '',
    colour:   localStorageSettingsSnap.brandColour    ||  profileSettings?.colour   || '',
    colourId: localStorageSettingsSnap.brandColourId  ||  profileSettings?.colourId || '',
    phone:    localStorageSettingsSnap.brandPhone     ||  profileSettings?.phone    || '',
    email:    localStorageSettingsSnap.brandEmail     ||  profileSettings?.email    || '',
    address:  localStorageSettingsSnap.brandAddress   ||  profileSettings?.address  || '',
    logo:     localStorageSettingsSnap.brandLogo      ||  profileSettings?.logo     || '',
    website:  localStorageSettingsSnap.brandWebsite   ||  profileSettings?.website  || '',

    dueDays:  localStorageSettingsSnap.invoiceDueDays  || 7,
    footer: 'Thank you for your patronage 🙏',
    currency: '₦',
    showTax: false,
    taxRate:  0,

  }
}

const TABS = [
  { id: 'measurements', label: 'Measurements' },
  { id: 'orders',       label: 'Orders'        },
  { id: 'invoices',     label: 'Invoices'      },
  { id: 'payments',     label: 'Payments'      },
  { id: 'receipts',     label: 'Receipts'      },
]


// ─────────────────────────────────────────────────────────────
// PHOTO OVERLAY
// ─────────────────────────────────────────────────────────────

function PhotoOverlay({ open, onClose, photo, initials, name }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.photoOverlay} onClick={onClose}>
      <button className={styles.photoCloseBtn} onClick={onClose} aria-label="Close">
        <span className="mi">close</span>
      </button>
      <div className={styles.photoBig} onClick={e => e.stopPropagation()}>
        {photo
          ? <img src={photo} alt={name} className={styles.photoBigImg} />
          : <span className={styles.photoBigInitials}>{initials}</span>
        }
      </div>
      <div className={styles.photoNameBig}>{name}</div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// EDIT CUSTOMER MODAL
// ─────────────────────────────────────────────────────────────

function EditCustomerModal({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     customer.name     || '',
    phone:    customer.phone    || '',
    email:    customer.email    || '',
    address:  customer.address  || '',
    birthday: customer.birthday || '',
    sex:      customer.sex      || '',
    notes:    customer.notes    || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) return
    setSaving(true)
    try { await onSave(form); onClose() }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalSheet}>
        <div className={styles.modalHeader}>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            <span className="mi">close</span>
          </button>
          <span className={styles.modalTitle}>Edit Customer</span>
          <button
            className={styles.modalSaveBtn}
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.phone.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Full Name *</label>
            <input className={styles.modalInput} value={form.name} onChange={set('name')} placeholder="Customer name" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Phone Number *</label>
            <input className={styles.modalInput} value={form.phone} onChange={set('phone')} placeholder="Phone number" type="tel" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Gender</label>
            <div className={styles.modalSexRow}>
              {['Male', 'Female'].map(option => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.modalSexChip} ${form.sex === option ? styles.modalSexChipActive : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, sex: prev.sex === option ? '' : option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Email Address</label>
            <input className={styles.modalInput} value={form.email} onChange={set('email')} placeholder="Email (optional)" type="email" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Birthday</label>
            <input className={styles.modalInput} value={form.birthday} onChange={set('birthday')} placeholder="MM-DD" maxLength={5} />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Address</label>
            <input className={styles.modalInput} value={form.address} onChange={set('address')} placeholder="Address (optional)" />
          </div>
          <div className={styles.modalGroup}>
            <label className={styles.modalLabel}>Notes</label>
            <textarea className={`${styles.modalInput} ${styles.modalTextarea}`} value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" rows={3} />
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────────────────────

function DeleteConfirmModal({ customer, onConfirm, onCancel }) {
  if (!customer) return null
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.deleteSheet}>
        <div className={styles.deleteIconWrap}>
          <span className="mi" style={{ fontSize: '2rem', color: 'var(--danger)' }}>person_remove</span>
        </div>
        <h4 className={styles.deleteTitle}>Remove This Customer?</h4>
        <p className={styles.deleteMessage}>
          You're about to permanently remove <strong>{customer.name}</strong> from your customer list.
          This action cannot be undone — all their details will be lost forever.
        </p>
        <p className={styles.deleteWarning}>Are you absolutely sure you want to continue?</p>
        <div className={styles.deleteActions}>
          <button className={styles.deleteCancelBtn} onClick={onCancel}>No, Keep Customer</button>
          <button className={styles.deleteConfirmBtn} onClick={onConfirm}>
            <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 6 }}>delete_forever</span>
            Yes, Delete Customer
          </button>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// CUSTOMER DETAIL — main export
// ─────────────────────────────────────────────────────────────

export default function CustomerDetail({ onMenuClick }) {


  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getCustomer, deleteCustomer, updateCustomer } = useCustomers()
  const { isPremium } = usePremium()
  const { getOrders } = useOrders()
   const {profileSettings} = useProfileSettings()
  const { generalSettings } = useGeneralSettings()
  const invoicePrefix = generalSettings.invoicePrefix
  const receiptPrefix = generalSettings.receiptPrefix
  const invoiceTemplate = generalSettings.invoiceTemplate
  const receiptTemplate = generalSettings.receiptTemplate
  const customerData = useCustomerData(id)
  const [activeTab, setActiveTab]       = useState('measurements')
  const [toastMsg, setToastMsg]        = useState('')
  const [isScrolled, setIsScrolled]      = useState(false)
  const [editModalOpen, setEditModalOpen]   = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [photoModalOpen, setPhotoModalOpen]  = useState(false)
  const [notesExpanded, setNotesExpanded]   = useState(false)

  const toastTimer     = useRef(null)
  const tabsRef        = useRef(null)
  const topSentinelRef = useRef(null)
  const healedRef      = useRef(false)
  const touchStartX    = useRef(null)
  const touchStartY    = useRef(null)

  const orders = getOrders(id)

  // ── sticky header scroll detection ───────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  // ── invoice status healing ────────────────────────────────
  useEffect(() => {
    if (healedRef.current) return
    if (!customerData.invoices?.length || !customerData.payments?.length) return

    healedRef.current = true

    for (const p of customerData.payments) {
      if (!p.orderId) continue
      const paidAmount = (p.installments || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
      if (paidAmount <= 0) continue
      const inv = customerData.invoices.find(i => String(i.orderId) === String(p.orderId) && i.status === 'unpaid')
      if (!inv) continue
      const correctStatus = p.status === 'paid' ? 'paid' : 'part_paid'
      customerData.updateInvoiceStatus(inv.id, correctStatus).catch(e =>
        console.error('[CustomerDetail] heal invoice status:', e)
      )
    }
  }, [customerData.invoices, customerData.payments])

  // ── toast ─────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }, [])

  // ── customer actions ──────────────────────────────────────
  const handleEditSave = useCallback(async (updates) => {
    try {
      await updateCustomer(id, updates)
      showToast('Customer updated ✓')
    } catch {
      showToast('Failed to update customer. Try again.')
      throw new Error('update failed')
    }
  }, [id, updateCustomer, showToast])

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteCustomer(id)
      setDeleteModalOpen(false)
      navigate('/customers', { replace: true })
    } catch {
      showToast('Failed to delete customer. Try again.')
      setDeleteModalOpen(false)
    }
  }, [id, deleteCustomer, navigate, showToast])



  const handleGenerateInvoice = useCallback(async (orderId) => {

    const existing = customerData.invoices.find(inv => String(inv.orderId) === String(orderId))

    if (existing) { 
      showToast('Invoice already exists'); 
      setActiveTab('invoices'); 
      return 
    }

    const order = orders.find(o => String(o.id) === String(orderId))

    if (!order) {
      showToast('Order not found'); 
      setActiveTab('invoices'); 
      return
    }

    let localStorageSettingsSnap = {}
    try { 
      localStorageSettingsSnap = {
        ...JSON.parse(localStorage.getItem('tailorflow_profile_settings') || '{}'), 
        ...JSON.parse(localStorage.getItem('tailorflow_general_settings') || '{}')
      }
    } 
    catch {
    }

    const invNumber = `${invoicePrefix}-${String(customerData.invoices.length + 1).padStart(3, '0')}`
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    let measurementIds = []
    if (order.measurementId?.length){
      measurementIds = order.measurementIds
    }
    else if (order.measurementId){
      measurementIds = [order.measurementId]
    }

    const linkedNames  =  measurementIds.map(
      mid => customerData.measurements.find(
      m => String(m.id) === String(mid))?.name).filter(
      Boolean
      )
    const items = Array.isArray(order.items) ? order.items : []
    const brandSnapshot = {
      ...readBrandSnapshot(localStorageSettingsSnap,  profileSettings),
      footer: localStorageSettingsSnap.invoiceFooter ||  'Thank you for your patronage 🙏',
      currency: localStorageSettingsSnap.invoiceCurrency || '₦',
      showTax: localStorageSettingsSnap.invoiceShowTax || false,
      taxRate:  localStorageSettingsSnap.invoiceTaxRate || 0,

    }

    const newInvoice = {

      id: Date.now() + Math.random(),
      orderId: orderId,
      number: invNumber,
      orderDesc: order.desc,
      price: order.price,
      qty: order.qty,
      items: items,
      linkedNames: linkedNames,
      due: order.due,
      notes: order.notes,
      status: 'unpaid',
      date: today,
      template: invoiceTemplate || localStorageSettingsSnap.invoiceTemplate || 'invoiceTemplate1',
      brandSnapshot: brandSnapshot,
      shippingFee: order.shippingFee ?? 0,
      discountType: order.discountType ?? null,
      discountValue: order.discountValue ?? 0,
      discountAmount: order.discountAmount ?? 0,
      taxRate: order.taxRate ?? 0,
      taxAmount: order.taxAmount ?? 0,
      totalAmount: order.totalAmount ?? order.price ?? 0,
    }

    try {
      await customerData.saveInvoice(newInvoice)
      showToast(`${invNumber} generated ✓`)
      setActiveTab('invoices')
    } catch {
      showToast('Failed to save invoice. Try again.')
    }
  }, [customerData, orders, showToast, invoiceTemplate,  profileSettings])



  const handleInvoicePaid = useCallback(async (orderId, invoiceStatus) => {

    const newStatus = invoiceStatus || 'paid'
    const matchingInvoice = customerData.invoices.find(inv =>
      String(inv.orderId) === String(orderId) && inv.status !== 'paid'
    )
    if (!matchingInvoice) return
    try {
      await customerData.updateInvoiceStatus(matchingInvoice.id, newStatus)
      const label = newStatus === 'part_paid' ? 'Part Payment' : 'Full Payment'
      showToast(`Invoice marked as ${label} ✓`)
    } 
    catch {
      showToast('Could not auto-update invoice.')
    }
  }, [customerData, showToast])


  const handleGenerateReceipt = useCallback(async (payment, installment) => {

    if (!installment) { 
      showToast('No installment selected.'); 
      return 
    }

    let localStorageSettingsSnap = {}

    try { 
      localStorageSettingsSnap = {
        ...JSON.parse(localStorage.getItem('tailorflow_profile_settings') || '{}'), 
        ...JSON.parse(localStorage.getItem('tailorflow_general_settings') || '{}')
      }
    } 
    catch {
    }

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const allInstalls = payment.installments || []
    const order = orders.find(o => String(o.id) === String(payment.orderId))
    const orderTotal = parseFloat(order?.totalAmount ?? order?.price ?? payment.orderPrice) || 0

    const thisInstallIndex = allInstalls.findIndex(i => String(i.id) === String(installment.id))
    const installsUpToThis = thisInstallIndex >= 0 ? allInstalls.slice(0, thisInstallIndex + 1) : [installment]
    const cumulativePaid = installsUpToThis.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const balance = Math.max(0, orderTotal - cumulativePaid)
    const isFullPay = balance <= 0
    const previousInstallments = allInstalls
      .slice(0, Math.max(0, thisInstallIndex))
      .map(inst => ({ id: inst.id, amount: inst.amount, method: inst.method || 'cash', date: inst.date, time: inst.time || null }))
    const previousPaid         = previousInstallments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

    const perPaymentCount = customerData.receipts.filter(r => String(r.paymentId) === String(payment.id)).length + 1
    const globalCount = customerData.receipts.length + 1
    const rcptNumber = `${receiptPrefix}-${String(perPaymentCount).padStart(2, '0')}-${String(globalCount).padStart(3, '0')}`

    const brandSnapshot = {
      ...readBrandSnapshot(localStorageSettingsSnap,  profileSettings),
      footer: localStorageSettingsSnap.receiptFooter ||  'Thank you for your patronage 🙏',
      currency: localStorageSettingsSnap.receiptCurrency || '₦',
      showTax: localStorageSettingsSnap.receiptShowTax || false,
      taxRate:  localStorageSettingsSnap.receiptTaxRate || 0,
    }

    const newReceipt = {
      paymentId:            payment.id,
      orderId:              payment.orderId,
      orderDesc:            payment.orderDesc,
      orderPrice:           payment.orderPrice,
      items:                order?.items || payment.orderItems || [],
      number:               rcptNumber,
      date:                 todayStr,

      // The single installment this receipt was generated for.
      // Stored as both a structured object (payments[]) and a plain id
      // (currentInstallmentId) so buildPaymentRows can unambiguously
      // identify "This Payment" without relying on date matching.
      payments: [{
        id:     installment.id,
        amount: installment.amount,
        method: installment.method || 'cash',
        date:   installment.date,
        time:   installment.time || null,
      }],
      currentInstallmentId: String(installment.id),

      installmentIds:       [String(installment.id)],
      previousInstallments: previousInstallments,
      previousPaid:         previousPaid,
      cumulativePaid:       cumulativePaid,
      isFullPayment:        isFullPay,
      balance:              balance,
      notes:                payment.notes || '',
      template:             receiptTemplate || localStorageSettingsSnap.receiptTemplate || 'receiptTemplate1',
      brandSnapshot:        brandSnapshot,
      shippingFee:          order?.shippingFee    ?? 0,
      discountType:         order?.discountType   ?? null,
      discountValue:        order?.discountValue  ?? 0,
      discountAmount:       order?.discountAmount ?? 0,
      taxRate:              order?.taxRate        ?? 0,
      taxAmount:            order?.taxAmount      ?? 0,
      totalAmount:          order?.totalAmount ?? order?.price ?? 0,
    }

    try {
      await customerData.saveReceipt(newReceipt)
      showToast(`${rcptNumber} receipt generated ✓`)
      setActiveTab('receipts')
    } catch {
      showToast('Failed to generate receipt. Try again.')
      throw new Error('receipt failed')
    }
  }, [customerData, orders, showToast, profileSettings])

  // ── receipt delete ────────────────────────────────────────
  const handleDeleteReceipt = useCallback(async (receiptId) => {
    try {
      await customerData.deleteReceipt(receiptId)
      showToast('Receipt deleted')
    } catch {
      showToast('Failed to delete receipt.')
    }
  }, [customerData, showToast])

  // ── invoice tab event bridge (from OrdersTab) ─────────────
  useEffect(() => {
    const handleSwitch   = () => setActiveTab('invoices')
    const handleGenerate = (e) => handleGenerateInvoice(e.detail.orderId)
    document.addEventListener('switchToInvoiceTab', handleSwitch)
    document.addEventListener('generateInvoice',    handleGenerate)
    return () => {
      document.removeEventListener('switchToInvoiceTab', handleSwitch)
      document.removeEventListener('generateInvoice',    handleGenerate)
    }
  }, [handleGenerateInvoice])

  // ── tab click ─────────────────────────────────────────────
  const handleTabClick = (e, tabId) => {
    setActiveTab(tabId)
    if (window.scrollY > 56) window.scrollTo({ top: 56, behavior: 'auto' })
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  // ── swipe to switch tabs ──────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (window.innerWidth > 600 || touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      const tabIds     = TABS.map(t => t.id)
      const currentIdx = tabIds.indexOf(activeTab)
      if (dx < 0 && currentIdx < tabIds.length - 1) setActiveTab(tabIds[currentIdx + 1])
      else if (dx > 0 && currentIdx > 0)             setActiveTab(tabIds[currentIdx - 1])
    }
    touchStartX.current = null
    touchStartY.current = null
  }, [activeTab])

  // ── derived values ────────────────────────────────────────
  const customer = getCustomer(id)
  if (!customer) return null

  const initials = getInitials(customer.name)
  const birthday = getBirthday(customer.birthday)
  const hasPhoto = isPremium && customer.photo

  const lastOrder = orders.length > 0
    ? orders.reduce((latest, o) => {
        const oDate = o.createdAt?.toDate?.() || new Date(o.createdAt || 0)
        const lDate = latest.createdAt?.toDate?.() || new Date(latest.createdAt || 0)
        return oDate > lDate ? o : latest
      }, orders[0])
    : null
  const lastOrderLabel = lastOrder
    ? `${lastOrder.desc || 'Order'} · ${formatLastOrderDate(lastOrder.createdAt?.toDate?.()?.toISOString?.() || lastOrder.createdAt || '')}`
    : null

  const totalSpent = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.price) || 0), 0)
  const totalPaidAcrossPayments = customerData.payments.reduce((sum, p) =>
    sum + (p.installments || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0), 0
  )
  const outstanding = Math.max(0, totalSpent - totalPaidAcrossPayments)

  const handleFabClick = () => {
    const eventMap = {
      measurements: 'openMeasureModal',
      orders:       'openOrderModal',
      invoices:     'openInvoiceModal',
      payments:     'openPaymentModal',
      receipts:     'openReceiptModal',
    }
    const eventName = eventMap[activeTab]
    if (eventName) document.dispatchEvent(new CustomEvent(eventName))
  }

  const tabItemCounts = {
    measurements: customerData.measurements?.length ?? 0,
    orders:       orders?.length            ?? 0,
    invoices:     customerData.invoices?.length     ?? 0,
    payments:     customerData.payments?.length     ?? 0,
    receipts:     customerData.receipts?.length     ?? 0,
  }
  const activeTabIsEmpty = tabItemCounts[activeTab] === 0

  const scrolledAvatar = {
    src:      hasPhoto ? customer.photo : null,
    initials: initials,
    onClick:  () => setPhotoModalOpen(true),
  }

  const StatsBlock = () => (
    <div className={styles.statsBlock}>
      {totalSpent > 0 && (
        <div className={styles.statsGrid}>
          <div className={styles.statCell}>
            <span className={styles.statAmount}>{formatCurrency('₦', totalSpent, 0, 0)}</span>
            <span className={styles.statLabel}>Total Billed</span>
          </div>
          {outstanding > 0 && (
            <div className={`${styles.statCell} ${styles.statCell_owed}`}>
              <span className={styles.statAmount}>{formatCurrency('₦', outstanding, 0, 0)}</span>
              <span className={styles.statLabel}>Balance Due</span>
            </div>
          )}
          {totalPaidAcrossPayments > 0 && (
            <div className={`${styles.statCell} ${styles.statCell_paid}`}>
              <span className={styles.statAmount}>{formatCurrency('₦', totalPaidAcrossPayments, 0, 0)}</span>
              <span className={styles.statLabel}>Total Paid</span>
            </div>
          )}
          {outstanding === 0 && totalSpent > 0 && (
            <div className={`${styles.statCell} ${styles.statCell_clear}`}>
              <span className={styles.statAmount}>All clear</span>
              <span className={styles.statLabel}>Balance</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className={styles.page} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      <div ref={topSentinelRef} className={styles.sentinel} />

      <div className={styles.navHeader}>
        <Header
          type="back"
          title={isScrolled ? customer.name : 'Customer Details'}
          isScrolled={isScrolled}
          scrolledAvatar={scrolledAvatar}
          showRightAvatar={false}
          customActions={[
            { icon: 'edit',   onClick: () => setEditModalOpen(true),   outlined: true },
            { icon: 'delete', onClick: () => setDeleteModalOpen(true), outlined: true, color: 'var(--danger)' },
          ]}
        />
      </div>

      <div className={styles.profileContainer}>
        <div className={styles.profileSection}>

          <div className={styles.topRow}>
            <div
              className={`${styles.avatar} ${isScrolled ? styles.avatarScrolled : ''}`}
              onClick={() => setPhotoModalOpen(true)}
              role="button"
              aria-label="View profile photo"
            >
              {hasPhoto
                ? <img src={customer.photo} className={styles.avatarImg} alt={customer.name} />
                : <span className={styles.avatarInitials}>{initials}</span>
              }
            </div>

            <div className={styles.identityBlock}>
              <div className={styles.name}>{customer.name}</div>
              <div className={styles.metaRow}>
                <span className={styles.metaChip}>
                  <span className="mi">call</span>
                  <span className={styles.metaChipText}>{customer.phone}</span>
                </span>
                {customer.sex && (
                  <>
                    <span className={styles.metaDot} aria-hidden="true">·</span>
                    <span className={styles.metaChip}>
                      <span className="mi">person</span>
                      <span className={styles.metaChipText}>{customer.sex}</span>
                    </span>
                  </>
                )}
                {birthday && (
                  <>
                    <span className={styles.metaDot} aria-hidden="true">·</span>
                    <span className={`${styles.metaChip} ${styles.metaChipBirthday}`}>
                      <span className="mi">cake</span>
                      <span className={styles.metaChipText}>{birthday}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {(customer.email || customer.address) && (
            <div className={styles.contactBlock}>
              {customer.email && (
                <div className={styles.contactRow}>
                  <span className="mi">mail_outline</span>
                  <span className={styles.contactText}>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className={styles.contactRow}>
                  <span className="mi">place</span>
                  <span className={styles.contactText}>{customer.address}</span>
                </div>
              )}
            </div>
          )}

          {lastOrderLabel && (
            <div className={styles.lastOrderBlock}>
              <div className={styles.lastOrderLine}>
                <span className="mi">schedule</span>
                <span className={styles.lastOrderText}><strong>{lastOrderLabel}</strong></span>
              </div>
            </div>
          )}

          {customer.notes && (
            <div className={styles.notesBlock}>
              <div className={styles.notesLine}>
                <span className="mi">edit_note</span>
                <p
                  className={`${styles.notesText} ${notesExpanded ? styles.notesText_expanded : ''}`}
                  onClick={() => setNotesExpanded(prev => !prev)}
                >
                  {customer.notes}
                </p>
              </div>
            </div>
          )}

          <StatsBlock />
        </div>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `tel:${customer.phone}`}>
            <span className="mi">call</span>Call
          </button>
          <button className={`${styles.btn} ${styles.light}`} onClick={() => window.location = `mailto:${customer.email}`}>
            <span className="mi">mail_outline</span>Email
          </button>
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={() => navigate(`/customers/${id}/body-measurements`)}
          >
            <span className="mi">straighten</span>Body Measurements
          </button>
        </div>
      </div>

      <div className={styles.stickyTabsWrapper}>
        <div className={styles.tabs} ref={tabsRef}>
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={(e) => handleTabClick(e, tab.id)}
            >
              <span>{tab.label}</span>
              {tabItemCounts[tab.id] > 0 && (
                <span className={`${styles.tabBadge} ${activeTab === tab.id ? styles.tabBadge_active : ''}`}>
                  {tabItemCounts[tab.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.tabContent} customerData-empty={activeTabIsEmpty ? 'true' : 'false'}>
        {activeTab === 'measurements' && (
          <MeasurementsTab
            measurements={customerData.measurements}
            loading={customerData.measurementsLoading}
            onSave={customerData.saveMeasurement}
            onDelete={customerData.deleteMeasurement}
            showToast={showToast}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab
            customerId={id}
            orders={orders}
            loading={customerData.ordersLoading}
            measurements={customerData.measurements}
            showToast={showToast}
            onGenerateInvoice={handleGenerateInvoice}
          />
        )}
        {activeTab === 'invoices' && (
          <InvoicesTab
            invoices={customerData.invoices}
            loading={customerData.invoicesLoading}
            orders={orders}
            measurements={customerData.measurements}
            customer={customer}
            onSave={customerData.saveInvoice}
            onDelete={customerData.deleteInvoice}
            onStatusChange={customerData.updateInvoiceStatus}
            onGenerateInvoice={handleGenerateInvoice}
            showToast={showToast}
          />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab
            customerId={id}
            orders={orders}
            payments={customerData.payments}
            showToast={showToast}
            onSavePayment={customerData.savePayment}
            onUpdatePayment={customerData.updatePayment}
            onDeletePayment={customerData.deletePayment}
            onInvoicePaid={handleInvoicePaid}
          />
        )}
        {activeTab === 'receipts' && (
          <ReceiptsTab
            receipts={customerData.receipts}
            customer={customer}
            orders={orders}
            payments={customerData.payments}
            onDelete={handleDeleteReceipt}
            onGenerateReceipt={handleGenerateReceipt}
            showToast={showToast}
          />
        )}
      </div>

      {['measurements', 'orders', 'invoices', 'payments', 'receipts'].includes(activeTab) && (
        <button className={styles.fab} onClick={handleFabClick}>
          <span className="mi">add</span>
        </button>
      )}

      <Toast message={toastMsg} />

      <PhotoOverlay
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        photo={hasPhoto ? customer.photo : null}
        initials={initials}
        name={customer.name}
      />

      {editModalOpen && (
        <EditCustomerModal
          customer={customer}
          onSave={handleEditSave}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          customer={customer}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  )
}
