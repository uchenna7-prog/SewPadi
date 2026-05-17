import { useState, useEffect} from 'react'
import { getCurrency } from '../../../../utils/moneyUtils'
import { buildOrderItemsMap,groupInvoicesByDate } from './utils'
import { EmptyState } from './components/EmptyState/EmptyState'
import { InvoiceRow } from './components/InvoiceRow/InvoiceRow'
import { InvoiceRowSkeleton } from './components/InvoiceRowSkeleton/InvoiceRowSkeleton'
import { AddInvoiceModal } from './components/AddInvoiceModal/AddInvoiceModal'
import InvoiceViewer from '../../../../components/InvoiceViewer/InvoiceViewer'
import ConfirmSheet from '../../../../components/ConfirmSheet/ConfirmSheet'
import styles from './InvoicesTab.module.css'


export default function InvoiceTab({
  invoices = [],
  loading  = false,
  orders   = [],
  customer,
  onStatusChange,
  onDelete,
  onGenerateInvoice,
  showToast,
}) {
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [addInvoiceModalOpen,  setaddInvoiceModalOpen]     = useState(false)
  const [generatingIds,  setGeneratingIds]  = useState(new Set())

  const currency      = getCurrency()
  const orderItemsMap = buildOrderItemsMap(orders)
  const groupedByDate = groupInvoicesByDate(invoices)

  useEffect(() => {
    const openPicker = () => setaddInvoiceModalOpen(true)
    document.addEventListener('openInvoiceModal', openPicker)
    return () => document.removeEventListener('openInvoiceModal', openPicker)
  }, [])

  async function handleGenerateSelected(selectedOrders) {
    if (generatingIds.size > 0) return

    setGeneratingIds(new Set(selectedOrders.map(o => o.id)))
    let anyFailed = false

    for (const order of selectedOrders) {
      try {
        await onGenerateInvoice(order.id)
      } catch {
        anyFailed = true
        showToast(`Failed to generate invoice for "${order.desc || 'order'}".`)
      }
      setGeneratingIds(prev => {
        const next = new Set(prev)
        next.delete(order.id)
        return next
      })
    }

    if (!anyFailed) {
      showToast(selectedOrders.length > 1
        ? `${selectedOrders.length} invoices generated`
        : 'Invoice generated'
      )
    }

    setaddInvoiceModalOpen(false)
  }

  function handleConfirmDelete() {
    onDelete(deleteTarget)
    showToast('Invoice deleted')
    setDeleteTarget(null)
    if (viewingInvoice?.id === deleteTarget) setViewingInvoice(null)
  }

  function handleStatusChange(id, newStatus) {
    onStatusChange(id, newStatus)
    showToast(`Marked as ${INVOICE_STATUS_LABELS[newStatus] || newStatus}`)
    if (viewingInvoice?.id === id) {
      setViewingInvoice(prev => ({ ...prev, status: newStatus }))
    }
  }

  useEffect(() => {
    if (!viewingInvoice) return
    const updated = invoices.find(inv => inv.id === viewingInvoice.id)
    if (updated && updated.status !== viewingInvoice.status) {
      setViewingInvoice(updated)
    }
  }, [invoices])


  if (loading) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.dateGroup}>
          {[1, 2, 3].map(i => <InvoiceRowSkeleton key={i} />)}
        </div>
      </div>
    )
  }


  if (invoices.length === 0) {
    return (
      <div className={styles.tabContent}>
        <EmptyState />
        <AddInvoiceModal
          isOpen={addInvoiceModalOpen}
          onClose={() => {
            if (generatingIds.size > 0) return
            setaddInvoiceModalOpen(false)
          }}
          orders={orders}
          invoices={invoices}
          onGenerateSelected={handleGenerateSelected}
          generatingIds={generatingIds}
        />
      </div>
    )
  }


  return (
    <div className={styles.tabContent}>
      {Object.entries(groupedByDate).map(([date, dateInvoices]) => (
        <div key={date} className={styles.dateGroup}>
          <div className={styles.dateGroupLabel}>{date}</div>
          <div className={styles.dateGroupDivider} />

          {dateInvoices.map((invoice, index) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              currency={currency}
              isLast={index === dateInvoices.length - 1}
              onTap={() => setViewingInvoice(invoice)}
              orderItems={orderItemsMap[invoice.orderId] ?? []}
            />
          ))}
        </div>
      ))}

      <AddInvoiceModal
        isOpen={addInvoiceModalOpen}
        onClose={() => {
          if (generatingIds.size > 0) return
          setaddInvoiceModalOpen(false)
        }}
        orders={orders}
        invoices={invoices}
        onGenerateSelected={handleGenerateSelected}
        generatingIds={generatingIds}
      />

      {viewingInvoice && (
        <div className={styles.modalOverlay}>

          <InvoiceViewer
            invoice={viewingInvoice}
            customer={customer}
            onClose={() => setViewingInvoice(null)}
            onStatusChange={handleStatusChange}
            onDelete={(id) => setDeleteTarget(id)}
            showToast={showToast}
          />
        </div>
      )}

      <ConfirmSheet
        open={!!deleteTarget}
        title="Delete this invoice?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
