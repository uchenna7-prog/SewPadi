export const TABS = [
  { id: 'measurements', label: 'Measurements' },
  { id: 'orders', label: 'Orders' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payments', label: 'Payments' },
  { id: 'receipts', label: 'Receipts' },
]

export const TAB_IDS = TABS.map(tab => tab.id) 


export const TAB_MODAL_EVENTS = {
  measurements: 'openAddMeasurementModal',
  orders: 'openAddOrderModal',
  invoices: 'openAddInvoiceModal',
  payments: 'openAddPaymentModal',
  receipts: 'openAddReceiptModal',
}
