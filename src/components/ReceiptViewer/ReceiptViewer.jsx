import { useRef, useState } from 'react'
import { useBrand } from '../../contexts/BrandContext'
import Header from '../Header/Header'
import styles from './ReceiptViewer.module.css'
import { TEMPLATE_MAPPINGS } from '../Templates/datas/receiptTemplateMappings'
import { getBrandCSSVars, downloadPDF, sharePDF, resolveCumulativePaid, buildReceiptWhatsAppMessage } from './utils'

export default function ReceiptViewer({ receipt: initialReceipt, customer, onClose, onDelete, showToast }) {
  const { brand } = useBrand()
  const paperRef  = useRef(null)
  const [receipt,      setReceipt]      = useState(initialReceipt)
  const [pdfLoading,   setPdfLoading]   = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const templateKey    = receipt.template || brand.receiptTemplate || 'receiptTemplate1'
  const Template       = TEMPLATE_MAPPINGS[templateKey] || TEMPLATE_MAPPINGS.receiptTemplate1
  const effectiveBrand = receipt.brandSnapshot ? { ...brand, ...receipt.brandSnapshot } : brand
  const brandCSSVars   = getBrandCSSVars(effectiveBrand.colour)
  const filename       = `Receipt-${receipt.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

  const cumulativePaid = resolveCumulativePaid(receipt)
  const orderTotal     = receipt.orderPrice ? parseFloat(receipt.orderPrice) : cumulativePaid
  const isFullPay      = cumulativePaid >= orderTotal && orderTotal > 0

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
      const message = buildReceiptWhatsAppMessage(receipt, customer, effectiveBrand)
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
        title={receipt.number}
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
            onClick: () => onDelete(receipt.id),
            style:   { color: '#ef4444' },
          },
        ]}
      />

      <div className={styles.scrollArea}>
        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${isFullPay ? styles.status_paid : styles.status_part_paid}`}>
            {isFullPay ? 'Paid in Full' : 'Part Payment'}
          </div>
        </div>
        <div className={styles.paperWrap}>
          <div className={styles.paperInner} ref={paperRef} style={brandCSSVars}>
            <Template receipt={receipt} customer={customer} brand={effectiveBrand} />
          </div>
        </div>
        {receipt.notes && (
          <div className={styles.notesBox}>
            <div className={styles.notesLabel}>Notes</div>
            <div className={styles.notesText}>{receipt.notes}</div>
          </div>
        )}
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}