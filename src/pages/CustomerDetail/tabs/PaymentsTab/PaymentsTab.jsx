import { useState, useEffect } from 'react'
import { formatMoney } from '../../../../utils/moneyUtils'
import { AddPaymentModal } from './components/AddPaymentModal/AddPaymentModal'
import { PaymentRow } from './components/PaymentRow/PaymentRow'
import { EmptyState } from './components/EmptyState/EmptyState'
import { PaymentDetailsModal } from './components/PaymentDetailsModal/PaymentDetailsModal'
import { getTodayLabel, getTimeLabel, buildOrderItemsMap, groupPaymentsByDate, getTotalPaid } from './utils'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import styles from './PaymentsTab.module.css'


export default function PaymentsTab({
  orders          = [],
  payments        = [],
  showToast,
  onSavePayment,
  onUpdatePayment,
  onDeletePayment,
  onInvoicePaid,
}) {

  const [modalOpen,      setModalOpen]      = useState(false)
  const [viewingPayment, setViewingPayment] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)

  useEffect(() => {
    if (!viewingPayment) return
    const updated = payments.find(p => p.id === viewingPayment.id)
    setViewingPayment(updated ?? null)
  }, [payments])

  useEffect(() => {
    const handler = () => setModalOpen(true)
    document.addEventListener('openAddPaymentModal', handler)
    return () => document.removeEventListener('openAddPaymentModal', handler)
  }, [])

  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupPaymentsByDate(payments)

  async function handleSavePayment(paymentData) {
    try {
      await onSavePayment(paymentData)
      showToast('Payment recorded ✓')
      if (paymentData.status === 'paid')      onInvoicePaid?.(paymentData.orderId, 'paid')
      else if (paymentData.status === 'part') onInvoicePaid?.(paymentData.orderId, 'part_paid')
    } catch {
      showToast('Failed to save payment.')
    }
  }

  async function handleStatusChange(paymentId, newStatus) {
    try {
      await onUpdatePayment(paymentId, { status: newStatus })
    } catch {
      showToast('Failed to update status.')
    }
  }

  async function handleAddInstallment(paymentId, amount, method) {
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return

    const newInstallment      = { amount, method, date: getTodayLabel(), time: getTimeLabel(), id: Date.now() }
    const updatedInstallments = [...(payment.installments || []), newInstallment]
    const totalPaid           = getTotalPaid(updatedInstallments)
    const fullPrice           = parseFloat(payment.orderPrice) || 0
    const newStatus           = fullPrice > 0 && totalPaid >= fullPrice ? 'paid' : payment.status

    try {
      await onUpdatePayment(paymentId, { installments: updatedInstallments, status: newStatus })
      if (newStatus === 'paid') {
        showToast('Payment complete! Marked as Paid ✓')
        onInvoicePaid?.(payment.orderId, 'paid')
      } else {
        showToast('Payment recorded ✓')
        onInvoicePaid?.(payment.orderId, 'part_paid')
      }
    } catch {
      showToast('Failed to record payment.')
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    try {
      await onDeletePayment(deleteTarget.id)
      showToast('Payment deleted')
    } catch {
      showToast('Failed to delete.')
    }
    setDeleteTarget(null)
    setViewingPayment(null)
  }

  return (
    <>
      <div className={styles.tabContent}>
        {payments.length === 0 ? (
          <EmptyState />
        ) : (
          Object.entries(groupedByDate).map(([date, datePayments]) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateGroupLabel}>{date}</div>
              <div className={styles.dateGroupDivider} />

              {datePayments.map((payment, index) => (
                <PaymentRow
                  key={payment.id ?? index}
                  payment={payment}
                  index={index}
                  datePayments={datePayments}
                  orderItemsMap={orderItemsMap}
                  onTap={setViewingPayment}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={orders}
        payments={payments}
        onSave={handleSavePayment}
      />

      {viewingPayment && (
        <PaymentDetailsModal
          payment={viewingPayment}
          onClose={() => setViewingPayment(null)}
          onDelete={() => setDeleteTarget(viewingPayment)}
          onStatusChange={handleStatusChange}
          onAddInstallment={handleAddInstallment}
        />
      )}

      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete Payment?"
        message="This can't be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

PaymentsTab.openModal = () => {
  document.dispatchEvent(new Event('openPaymentModal'))
}