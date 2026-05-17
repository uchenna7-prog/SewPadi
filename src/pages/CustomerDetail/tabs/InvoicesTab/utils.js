export function groupInvoicesByDate(invoices) {
  return invoices.reduce((groups, invoice) => {
    const date = invoice.date || 'Unknown Date'
    if (!groups[date]) groups[date] = []
    groups[date].push(invoice)
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

export function getInvoiceTotal(invoice) {
  if (invoice.totalAmount != null && parseFloat(invoice.totalAmount) > 0) {
    return parseFloat(invoice.totalAmount)
  } else if (invoice.items?.length > 0) {
    return invoice.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  }
  return parseFloat(invoice.price) || 0
}
