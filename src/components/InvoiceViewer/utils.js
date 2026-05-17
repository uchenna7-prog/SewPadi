import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { formatMoney } from '../../utils/moneyUtils'


export function buildInvoiceWhatsAppMessage(invoice, customer,invoiceBrandSettings ) {
  const currency  = invoiceBrandSettings?.currency || '₦'
  const firstName  = customer.name?.split(' ')[0] || customer.name
  const cumulativePaid = 0
  const orderTotal  = invoice.orderPrice
    ? parseFloat(invoice.orderPrice)
    : invoice.items?.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) ?? 0
  const balanceLeft = Math.max(0, orderTotal - cumulativePaid)
  const isFullPay = balanceLeft <= 0

  const lines = [
    `Hi ${firstName},`,
    '',
    `Here is your payment invoice from *${invoiceBrandSettings?.name || 'us'}*. 🧾`,
    '',
    '*Invoice Details*',
    `Invoice No: *${invoice.number}*`,
    `Date: ${invoice.date}`,
    '',
  ]

  if (invoice.items?.length > 0) {
    lines.push('*Order Breakdown*')
    invoice.items.forEach(item => lines.push(`• ${item.name} — ${formatCurrency(currency, item.price)}`))
    lines.push(`Order Total: ${formatCurrency(currency, orderTotal)}`)
    lines.push('')
  }

  if (invoice.payments?.length > 0) {
    lines.push(`*Payment${invoice.payments.length > 1 ? 's' : ''} Received*`)
    invoice.payments.forEach((p, idx) => {
      const label  = invoice.payments.length > 1 ? `Payment ${idx + 1}` : 'Amount Paid'
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
  if (invoiceBrandSettings?.phone) lines.push(`For any questions, reach us at ${invoiceBrandSettings.phone}.`)
  lines.push('Thank you! 🙏')

  return lines.join('\n')
}
