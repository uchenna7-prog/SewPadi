
export function groupReceiptsByDate(receipts) {
  return receipts.reduce((groups, receipt) => {
    const date = receipt.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(receipt)
    return groups
  }, {})
}

export function buildOrderItemsMap(orders) {
  const map = {}
  for (const order of orders) {
    if (order.id && order.items?.length > 0) {
      map[order.id] = order.items
    }
  }
  return map
}

export function getPaymentStatus(receipt) {
  const thisPayment  = (receipt.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid    = receipt.cumulativePaid != null ? parseFloat(receipt.cumulativePaid) : thisPayment
  const orderTotal   = parseFloat(receipt.totalAmount ?? receipt.orderPrice) || totalPaid
  const isPaidInFull = totalPaid >= orderTotal && orderTotal > 0

  return {
    thisPayment,
    isPaidInFull,
    label: isPaidInFull ? 'Paid in Full' : 'Part Payment',
    badgeStyle: isPaidInFull
      ? { background: 'rgba(34,197,94,0.12)',  color: '#15803d', borderColor: 'rgba(34,197,94,0.3)'  }
      : { background: 'rgba(251,146,60,0.12)', color: '#c2410c', borderColor: 'rgba(251,146,60,0.3)' },
  }
}

export function getTotalPaid(installments) {
  return (installments || []).reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
}

export function capitalise(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function isPaymentFullyReceipted(payment, receipts) {
  const installments = payment?.installments || []
  if (installments.length === 0) return false

  const receiptedIds = new Set(
    receipts
      .filter(r => String(r.paymentId) === String(payment.id))
      .flatMap(r => r.installmentIds || [])
  )

  return installments.every(inst => receiptedIds.has(String(inst.id)))
}

