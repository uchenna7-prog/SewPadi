import { useRef, useState } from 'react'
import { useBrand } from '../../contexts/BrandContext'
import Header from '../Header/Header'
import styles from './InvoiceViewer.module.css'
import { TEMPLATE_MAPPINGS } from '../Templates/datas/invoiceTemplateMappings'
import { getBrandCSSVars, buildInvoiceWhatsAppMessage, downloadPDF, sharePDF } from './utils'

const STATUS_LABELS = {
  unpaid:    'Unpaid',
  part_paid: 'Part Payment',
  paid:      'Full Payment',
  overdue:   'Overdue',
}

export default function InvoiceViewer({
  invoice: initialInvoice,
  customer,
  onClose,
  onDelete,
  showToast,
}) {
  const { brand }  = useBrand()
  const paperRef   = useRef(null)
  const [invoice,      setInvoice]      = useState(initialInvoice)
  const [pdfLoading,   setPdfLoading]   = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const templateKey    = brand.invoiceTemplate || 'invoiceTemplate1'
  const Template       = TEMPLATE_MAPPINGS[templateKey] || TEMPLATE_MAPPINGS.invoiceTemplate1
  const effectiveBrand = invoice.brandSnapshot ? { ...brand, ...invoice.brandSnapshot } : brand
  const brandCSSVars   = getBrandCSSVars(effectiveBrand.colour)
  const filename       = `Invoice-${invoice.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

  const handleDownload = async () => {
    if (!paperRef.current || pdfLoading) return
    setPdfLoading(true)
    showToast?.('Generating PDF…')
    try {
      const exactHeight = Math.ceil(paperRef.current.getBoundingClientRect().height)
      await downloadPDF(paperRef.current, filename, brandCSSVars, exactHeight)
      showToast?.('PDF downloaded ✓')
    } catch (err) {
      console.error(err)
      showToast?.('PDF failed — please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleShare = async () => {
    if (!paperRef.current || shareLoading) return
    setShareLoading(true)
    showToast?.('Preparing…')
    try {
      const exactHeight = Math.ceil(paperRef.current.getBoundingClientRect().height)
      const message = buildInvoiceWhatsAppMessage(invoice, customer, effectiveBrand)
      await sharePDF(paperRef.current, filename, message, brandCSSVars, exactHeight)
      showToast?.('Shared ✓')
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error(err)
        showToast?.('Share failed — please try again.')
      }
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <Header
        type="back"
        title={invoice.number}
        onBackClick={onClose}
        customActions={[
          {
            icon:     pdfLoading ? 'hourglass_top' : 'download',
            onClick:  handleDownload,
            disabled: pdfLoading,
          },
          {
            icon:     shareLoading ? 'hourglass_top' : 'share',
            onClick:  handleShare,
            disabled: shareLoading,
          },
          {
            icon:    'delete',
            onClick: () => onDelete(invoice.id),
            style:   { color: '#ef4444' },
          },
        ]}
      />

      <div className={styles.scrollArea}>

        {/* Status badge */}
        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
            {STATUS_LABELS[invoice.status] || invoice.status}
          </div>
        </div>

        {/* Mobile layout */}
        <div className={styles.mobileLayout}>
          <div className={styles.paperWrap}>
            <div ref={paperRef} className={styles.paperInner} style={brandCSSVars}>
              <Template invoice={invoice} customer={customer} brand={effectiveBrand} />
            </div>
          </div>

          {invoice.notes && (
            <div className={styles.notesBox}>
              <div className={styles.notesLabel}>Notes</div>
              <div className={styles.notesText}>{invoice.notes}</div>
            </div>
          )}
        </div>

        {/* Desktop layout */}
        <div className={styles.desktopLayout}>
          <div className={styles.statusRow}>
            <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
              {STATUS_LABELS[invoice.status] || invoice.status}
            </div>
          </div>
          <div className={styles.desktopColumns}>
            <div className={styles.previewCol}>
              <div className={styles.paperWrap}>
                <div className={styles.paperInner} ref={paperRef} style={brandCSSVars}>
                  <Template invoice={invoice} customer={customer} brand={effectiveBrand} />
                </div>
              </div>
            </div>
            <div className={styles.metaCol}>
              {invoice.notes && (
                <div className={styles.notesBox}>
                  <div className={styles.notesLabel}>Notes</div>
                  <div className={styles.notesText}>{invoice.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}