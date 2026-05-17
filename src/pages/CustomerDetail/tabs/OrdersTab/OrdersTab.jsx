import { useState, useEffect } from 'react'
import { useOrders } from '../../../../contexts/OrdersContext'
import { useAuth } from '../../../../contexts/AuthContext'
import { useGeneralSettings } from '../../../../contexts/GeneralSettingsContext'
import { ORDER_STAGE_AUTO_STATUS } from '../../../../datas/orderDatas'
import { AddOrderModal } from './components/AddOrderModal/AddOrderModal'
import { OrderDetailsModal } from './components/OrderDetailsModal/OrderDetailsModal'
import { OrderRow } from './components/OrderRow/OrderRow'
import { OrderRowSkeleton } from './components/OrderRowSkeleton/OrderRowSkeleton'
import { EmptyState } from './components/EmptyState/EmptyState'
import { formatFirestoreDate } from './utils'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import styles from './OrdersTab.module.css'


export default function OrdersTab({ customerId, orders, loading, measurements, showToast, onGenerateInvoice }) {

  const { addOrder, deleteOrder, updateOrderStatus, updateOrderStage } = useOrders()
  const { user } = useAuth()
  const { generalSettings } = useGeneralSettings()

  const taxEnabled = generalSettings.invoiceShowTax ?? false
  const taxRate    = generalSettings.invoiceTaxRate ?? 0

  const [isModalOpen,   setIsModalOpen]   = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderToDelete, setOrderToDelete] = useState(null)

  useEffect(() => {
    const openModal = () => setIsModalOpen(true)
    document.addEventListener('openAddOrderModal', openModal)
    return () => document.removeEventListener('openAddOrderModal', openModal)
  }, [])


  async function handleSaveOrder(orderData) {
    try {
      await addOrder(customerId, orderData)
      showToast('Order placed ✓')
    } catch {
      showToast('Failed to place order')
    }
  }

  async function handleDeleteConfirm() {
    if (!orderToDelete) return
    try {
      await deleteOrder(customerId, orderToDelete.id)
      showToast('Order deleted')
    } catch {
      showToast('Failed to delete order')
    }
    setOrderToDelete(null)
    setSelectedOrder(null)
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrderStatus(customerId, orderId, newStatus)
      setSelectedOrder(prev =>
        prev && String(prev.id) === String(orderId) ? { ...prev, status: newStatus } : prev
      )
    } catch {
      showToast('Failed to update status')
    }
  }

  async function handleStageChange(orderId, newStage) {
    try {
      await updateOrderStage(customerId, orderId, newStage)
      const autoStatus = newStage ? ORDER_STAGE_AUTO_STATUS[newStage] : null
      if (autoStatus) {
        await updateOrderStatus(customerId, orderId, autoStatus)
        setSelectedOrder(prev =>
          prev && String(prev.id) === String(orderId)
            ? { ...prev, stage: newStage, status: autoStatus }
            : prev
        )
      } else {
        setSelectedOrder(prev =>
          prev && String(prev.id) === String(orderId)
            ? { ...prev, stage: newStage }
            : prev
        )
      }
    } catch {
      showToast('Failed to update stage')
    }
  }

  function handleShareReviewLink(order) {
    const reviewToken  = order.reviewToken || crypto.randomUUID()
    const reviewUrl    = `https://sewpadi.web.app/review/${user?.uid}/${reviewToken}`
    const customerName = order.customerName || 'there'
    const message = encodeURIComponent(
      `Hi ${customerName}! 🙏 Thank you for your order.\n\n` +
      `We'd love to hear your feedback — it only takes a minute:\n${reviewUrl}\n\n` +
      `Your review means a lot to us! ⭐`
    )
    const rawPhone   = order.customerPhone || ''
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '')
    let waPhone = cleanPhone
    if (cleanPhone.startsWith('+'))      waPhone = cleanPhone.replace('+', '')
    else if (cleanPhone.startsWith('0')) waPhone = `234${cleanPhone.slice(1)}`
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${message}`
      : `https://wa.me/?text=${message}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }


  if (loading) {
    return (
      <div className={styles.orderGroup}>
        {[1, 2, 3].map(i => <OrderRowSkeleton key={i} />)}
      </div>
    )
  }

  const ordersByDate = orders.reduce((groups, order) => {
    const dateKey = order.takenAt || formatFirestoreDate(order.createdAt) || order.date || 'Unknown Date'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(order)
    return groups
  }, {})

  return (
    <div>
      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        Object.entries(ordersByDate).map(([date, ordersInGroup]) => (
          <div key={date} className={styles.orderGroup}>
            <div className={styles.orderGroupDate}>{date}</div>
            <div className={styles.orderGroupDivider} />

            {ordersInGroup.map((order, index) => (
              <OrderRow
                key={order.id ?? index}
                order={order}
                ordersInGroup={ordersInGroup}
                index={index}
                onTap={setSelectedOrder}
              />
            ))}
          </div>
        ))
      )}

      <AddOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        measurements={measurements}
        onSave={handleSaveOrder}
        taxRate={taxRate}
        taxEnabled={taxEnabled}
      />

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          measurements={measurements}
          onClose={() => setSelectedOrder(null)}
          onDelete={() => setOrderToDelete(selectedOrder)}
          onStatusChange={handleStatusChange}
          onStageChange={handleStageChange}
          onShareReviewLink={handleShareReviewLink}
          onGenerateInvoice={(orderId) => {
            setSelectedOrder(null)
            onGenerateInvoice(orderId)
          }}
        />
      )}

      <ConfirmSheet
        open={!!orderToDelete}
        title="Delete Order?"
        message="This can't be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  )
}