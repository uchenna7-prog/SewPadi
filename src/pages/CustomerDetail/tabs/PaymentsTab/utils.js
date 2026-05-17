import { PAYMENT_STATUSES } from "../../../../datas/paymentDatas"

export function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function getStatusMeta(value) {
  return PAYMENT_STATUSES.find(s => s.value === value) ?? PAYMENT_STATUSES[0]
}

export function buildOrderItemsMap(orders) {
  const map = {}
  for (const order of (orders || [])) {
    if (order.id && order.items?.length > 0) map[order.id] = order.items
  }
  return map
}

export function groupPaymentsByDate(payments) {
  return payments.reduce((groups, payment) => {
    const date = payment.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(payment)
    return groups
  }, {})
}

export function getTotalPaid(installments) {
  return (installments || []).reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
}

export function getProgressPercent(totalPaid, fullPrice, status) {
  if (fullPrice <= 0) return 0
  const raw = (totalPaid / fullPrice) * 100
  return status === 'part' ? Math.min(99, raw) : Math.min(100, raw)
}

export function resolvePaymentStatus(enteredAmount, orderPrice, selectedPaymentType) {
  const entered = parseFloat(enteredAmount) || 0
  const full    = parseFloat(orderPrice)    || 0
  if (full > 0) return entered >= full ? 'paid' : 'part'
  return selectedPaymentType === 'full' ? 'paid' : 'part'
}

export function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

