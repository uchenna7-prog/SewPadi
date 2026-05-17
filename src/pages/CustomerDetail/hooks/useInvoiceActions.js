import { useCallback } from 'react'
import { useProfileSettings } from '../../../contexts/ProfileSettingsContext'
import { useGeneralSettings } from '../../../contexts/GeneralSettingsContext'


function buildBrandSnapshot(localSnap, profileSettings, overrides = {}) {
  
  const pick = (localKey, profileKey) =>
    localSnap[localKey] || profileSettings?.[profileKey] || ''

  return {
    name:     pick('brandName',    'brandName'),
    tagline:  pick('brandTagline', 'brandTagline'),
    colour:   pick('brandColour',  'brandColour'),
    colourId: pick('brandColourId','brandColourId'),
    phone:    pick('brandPhone',   'brandPhone'),
    email:    pick('brandEmail',   'brandEmail'),
    address:  pick('brandAddress', 'brandAddress'),
    logo:     pick('brandLogo',    'brandLogo'),
    website:  pick('brandWebsite', 'brandWebsite'),
    ...overrides,
  }
}


function readLocalStorageSettings() {
  try {
    const profileSettings = JSON.parse(localStorage.getItem('sewpadi_profile_settings') || '{}')
    const generalSettings = JSON.parse(localStorage.getItem('sewpadi_general_settings') || '{}')
    return { ...profileSettings, ...generalSettings }
  } 
  catch {
    return {}
  }
}


export function useInvoiceActions({ customerData, orders, showToast, setActiveTab }) {
  
  const { profileSettings } = useProfileSettings()
  const { generalSettings }  = useGeneralSettings()

  const handleGenerateInvoice = useCallback(async (orderId) => {
    
    const existingInvoice = customerData.invoices.find(
      inv => String(inv.orderId) === String(orderId)
    )

    if (existingInvoice) {
      showToast('Invoice already exists')
      setActiveTab('invoices')
      return
    }

    const order = orders.find(order => String(order.id) === String(orderId))
    if (!order) {
      showToast('Order not found')
      setActiveTab('invoices')
      return
    }

    const localSnap = readLocalStorageSettings()
    const invoicePrefix  = generalSettings.invoicePrefix  || localSnap.invoicePrefix  || 'INV'
    const invoiceTemplate= generalSettings.invoiceTemplate|| localSnap.invoiceTemplate|| 'invoiceTemplate1'

    const invoiceNumber = `${invoicePrefix}-${String(customerData.invoices.length + 1).padStart(3, '0')}`
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    })

    // Resolve linked measurement names
    const measurementIds = Array.isArray(order.measurementIds)
      ? order.measurementIds
      : order.measurementId
        ? [order.measurementId]
        : []

    const linkedMeasurementNames = measurementIds
      .map(mid => customerData.measurements.find(m => String(m.id) === String(mid))?.name)
      .filter(Boolean)

    const brandSnapshot = buildBrandSnapshot(localSnap, profileSettings, {
      footer:   localSnap.invoiceFooter   || 'Thank you for your patronage 🙏',
      currency: localSnap.invoiceCurrency || '₦',
      showTax:  localSnap.invoiceShowTax  || false,
      taxRate:  localSnap.invoiceTaxRate  || 0,
      dueDays:  localSnap.invoiceDueDays  || 7,
    })

    const newInvoice = {
      id:            Date.now() + Math.random(),
      orderId,
      number:        invoiceNumber,
      date:          today,
      status:        'unpaid',
      template:      invoiceTemplate,
      orderDesc:     order.desc,
      price:         order.price,
      qty:           order.qty,
      items:         Array.isArray(order.items) ? order.items : [],
      linkedNames:   linkedMeasurementNames,
      due:           order.due,
      notes:         order.notes,
      shippingFee:   order.shippingFee   ?? 0,
      discountType:  order.discountType  ?? null,
      discountValue: order.discountValue ?? 0,
      discountAmount:order.discountAmount?? 0,
      taxRate:       order.taxRate       ?? 0,
      taxAmount:     order.taxAmount     ?? 0,
      totalAmount:   order.totalAmount   ?? order.price ?? 0,
      brandSnapshot,
    }

    try {
      await customerData.saveInvoice(newInvoice)
      showToast(`${invoiceNumber} generated ✓`)
      setActiveTab('invoices')
    } catch {
      showToast('Failed to save invoice. Try again.')
    }
  }, [customerData, orders, generalSettings, profileSettings, showToast, setActiveTab])

  // ── Mark an invoice as paid / part-paid ───────────────────────────────────
  const handleInvoicePaid = useCallback(async (orderId, invoiceStatus) => {
    const status = invoiceStatus || 'paid'

    const matchingInvoice = customerData.invoices.find(
      inv => String(inv.orderId) === String(orderId) && inv.status !== 'paid'
    )
    if (!matchingInvoice) return

    try {
      await customerData.updateInvoiceStatus(matchingInvoice.id, status)
      const label = status === 'part_paid' ? 'Part Payment' : 'Full Payment'
      showToast(`Invoice marked as ${label} ✓`)
    } catch {
      showToast('Could not auto-update invoice.')
    }
  }, [customerData, showToast])

  return { handleGenerateInvoice, handleInvoicePaid }
}