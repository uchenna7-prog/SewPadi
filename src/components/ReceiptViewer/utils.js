import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { formatMoney } from '../../utils/moneyUtils'


export function resolveCumulativePaid(receipt) {

  if (receipt.cumulativePaid != null) return parseFloat(receipt.cumulativePaid)
  return (receipt.payments || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0)
}

export function buildPaymentRows(receipt) {

  const previous = receipt.previousInstallments || []
  const current  = receipt.payments || []
  const rows = []

  if (previous.length > 0) {
    previous.forEach((payment, index) => rows.push({ ...payment, _isCurrent: false, _sn: index + 1 }))
  } 
  else if (parseFloat(receipt.previousPaid) > 0) {
    rows.push({
      id: '__prev__', amount: receipt.previousPaid,
      date: 'Prior payments', method: null,
      _isCurrent: false, _sn: 1,
    })
  }

  const offset = rows.length
  current.forEach((p, i) => rows.push({ ...p, _isCurrent: false, _sn: offset + i + 1 }))
  const currentInstallmentId = receipt.currentInstallmentId

  if (currentInstallmentId != null) {
    rows.forEach(p => {
      if (String(p.id) === String(currentInstallmentId)) p._isCurrent = true
    })
    return rows
  }
  const realRows = rows.filter(p => p.date && p.date !== 'Prior payments')

  const withTime = realRows.filter(p => p.time)
  if (withTime.length > 0) {
    const latest = withTime.reduce((best, p) => {
      const t = new Date(`${p.date} ${p.time}`).getTime()
      return t > best.t ? { t, id: p.id } : best
    }, { t: -Infinity, id: null })
    rows.forEach(p => {
      if (String(p.id) === String(latest.id)) p._isCurrent = true
    })
    return rows
  }

  const allDates = realRows
    .map(p => new Date(p.date).getTime())
    .filter(t => !isNaN(t))

  if (allDates.length > 0) {
    const latestTime = Math.max(...allDates)
    rows.forEach(p => {
      if (p.date && p.date !== 'Prior payments') {
        const t = new Date(p.date).getTime()
        if (!isNaN(t) && t === latestTime) p._isCurrent = true
      }
    })
  }

  return rows
}



export function buildReceiptWhatsAppMessage(receipt, customer, receiptBrandSettings) {
  const currency  = receiptBrandSettings?.currency || '₦'
  const firstName  = customer.name?.split(' ')[0] || customer.name
  const cumulativePaid = resolveCumulativePaid(receipt)
  const orderTotal = receipt.orderPrice
    ? parseFloat(receipt.orderPrice)
    : receipt.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const balanceLeft = Math.max(0, orderTotal - cumulativePaid)
  const isFullPay   = balanceLeft <= 0

  const lines = [
    `Hi ${firstName},`,
    '',
    `Here is your payment receipt from *${receiptBrandSettings?.name || 'us'}*. 🧾`,
    '',
    '*Receipt Details*',
    `Receipt No: *${receipt.number}*`,
    `Date: ${receipt.date}`,
    '',
  ]

  if (receipt.items?.length > 0) {
    lines.push('*Order Breakdown*')
    receipt.items.forEach(item => lines.push(`• ${item.name} — ${formatCurrency(currency, item.price)}`))
    lines.push(`Order Total: ${formatCurrency(currency, orderTotal)}`)
    lines.push('')
  }

  if (receipt.payments?.length > 0) {
    lines.push(`*Payment${receipt.payments.length > 1 ? 's' : ''} Received*`)
    receipt.payments.forEach((p, idx) => {
      const label  = receipt.payments.length > 1 ? `Payment ${idx + 1}` : 'Amount Paid'
      const method = p.method ? ` (${p.method.charAt(0).toUpperCase() + p.method.slice(1)})` : ''
      lines.push(`${label}${method}: *${formatCurrency(currency, p.amount)}*`)
    })
    lines.push('')
  }

  if (isFullPay) {
    lines.push('✅ *Your order is fully paid. Thank you!*')
  } else {
    lines.push(`Balance Remaining: *${formatCurrency(currency, balanceLeft)}*`)
    lines.push('Please note there is an outstanding balance on your order.')
  }

  lines.push('')
  if (receiptBrandSettings?.phone) lines.push(`For any questions, reach us at ${receiptBrandSettings.phone}.`)
  lines.push('Thank you! 🙏')

  return lines.join('\n')
}



