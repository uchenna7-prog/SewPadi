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
    const profile = JSON.parse(localStorage.getItem('sewpadi_profile_settings') || '{}')
    const general = JSON.parse(localStorage.getItem('sewpadi_general_settings') || '{}')
    return { ...profile, ...general }
  } catch {
    return {}
  }
}

export function useReceiptActions({ customerData, orders, showToast, setActiveTab }) {
  
  const { profileSettings } = useProfileSettings()
  const { generalSettings }  = useGeneralSettings()

  // ── Generate a receipt for one installment ────────────────────────────────
  const handleGenerateReceipt = useCallback(async (payment, installment) => {
    if (!installment) {
      showToast('No installment selected.')
      return
    }

    const localSnap      = readLocalStorageSettings()
    const receiptPrefix  = generalSettings.receiptPrefix  || localSnap.receiptPrefix  || 'RCP'
    const receiptTemplate= generalSettings.receiptTemplate|| localSnap.receiptTemplate|| 'receiptTemplate1'

    const today = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

    const allInstallments  = payment.installments || []
    const order            = orders.find(o => String(o.id) === String(payment.orderId))
    const orderTotal       = parseFloat(order?.totalAmount ?? order?.price ?? payment.orderPrice) || 0

    // Work out how much has been paid up to and including this installment
    const thisInstallIndex  = allInstallments.findIndex(i => String(i.id) === String(installment.id))
    const installmentsToNow = thisInstallIndex >= 0
      ? allInstallments.slice(0, thisInstallIndex + 1)
      : [installment]

    const cumulativePaid = installmentsToNow.reduce(
      (sum, i) => sum + (parseFloat(i.amount) || 0), 0
    )
    const balance    = Math.max(0, orderTotal - cumulativePaid)
    const isFullPay  = balance <= 0

    // Previous installments (before this one) for the receipt history section
    const previousInstallments = allInstallments
      .slice(0, Math.max(0, thisInstallIndex))
      .map(inst => ({
        id:     inst.id,
        amount: inst.amount,
        method: inst.method || 'cash',
        date:   inst.date,
        time:   inst.time || null,
      }))
    const previousPaid = previousInstallments.reduce(
      (sum, i) => sum + (parseFloat(i.amount) || 0), 0
    )

  
    const receiptsForThisPayment = customerData.receipts.filter(
      r => String(r.paymentId) === String(payment.id)
    ).length + 1
    const globalReceiptCount = customerData.receipts.length + 1
    const receiptNumber = `${receiptPrefix}-${String(receiptsForThisPayment).padStart(2, '0')}-${String(globalReceiptCount).padStart(3, '0')}`

    const brandSnapshot = buildBrandSnapshot(localSnap, profileSettings, {
      footer:   localSnap.receiptFooter   || 'Thank you for your patronage 🙏',
      currency: localSnap.receiptCurrency || '₦',
      showTax:  localSnap.receiptShowTax  || false,
      taxRate:  localSnap.receiptTaxRate  || 0,
    })

    const newReceipt = {
      paymentId:            payment.id,
      orderId:              payment.orderId,
      orderDesc:            payment.orderDesc,
      orderPrice:           payment.orderPrice,
      items:                order?.items || payment.orderItems || [],
      number:               receiptNumber,
      date:                 today,
      template:             receiptTemplate,
      currentInstallmentId: String(installment.id),
      installmentIds:       [String(installment.id)],
      payments: [{
        id:     installment.id,
        amount: installment.amount,
        method: installment.method || 'cash',
        date:   installment.date,
        time:   installment.time || null,
      }],
      previousInstallments,
      previousPaid,
      cumulativePaid,
      isFullPayment:  isFullPay,
      balance,
      notes:          payment.notes || '',
      shippingFee:    order?.shippingFee    ?? 0,
      discountType:   order?.discountType   ?? null,
      discountValue:  order?.discountValue  ?? 0,
      discountAmount: order?.discountAmount ?? 0,
      taxRate:        order?.taxRate        ?? 0,
      taxAmount:      order?.taxAmount      ?? 0,
      totalAmount:    order?.totalAmount    ?? order?.price ?? 0,
      brandSnapshot,
    }

    try {
      await customerData.saveReceipt(newReceipt)
      showToast(`${receiptNumber} receipt generated ✓`)
      setActiveTab('receipts')
    } catch {
      showToast('Failed to generate receipt. Try again.')
      throw new Error('receipt generation failed')
    }
  }, [customerData, orders, generalSettings, profileSettings, showToast, setActiveTab])

  // ── Delete a receipt ──────────────────────────────────────────────────────
  const handleDeleteReceipt = useCallback(async (receiptId) => {
    try {
      await customerData.deleteReceipt(receiptId)
      showToast('Receipt deleted')
    } catch {
      showToast('Failed to delete receipt.')
    }
  }, [customerData, showToast])

  return { handleGenerateReceipt, handleDeleteReceipt }
}