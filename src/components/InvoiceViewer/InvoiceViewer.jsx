import { useRef, useState } from 'react'
import { useGeneralSettings } from '../../contexts/GeneralSettingsContext'
import { useProfileSettings } from '../../contexts/ProfileSettingsContext'
import { TEMPLATE_MAPPINGS } from '../Templates/datas/invoiceTemplateMappings'
import { buildInvoiceWhatsAppMessage, } from './utils'
import { sharePDF, downloadPDF } from '../../utils/pdfUtils'
import { getBrandCSSVars } from '../../utils/cssVariablesUtils'
import { useInvoiceBrandSettings } from '../../hooks/useInvoiceBrandSettings'
import Header from '../Header/Header'
import styles from './InvoiceViewer.module.css'


const STATUS_LABELS = {
  unpaid:    'Unpaid',
  part_paid: 'Part Payment',
  paid:      'Full Payment',
  overdue:   'Overdue',
}

export default function InvoiceViewer({
  invoice: snapShotedInvoice,
  customer,
  onClose,
  onDelete,
  showToast,
}) {

  const { generalSettings } = useGeneralSettings()
  const { profileSettings } = useProfileSettings()

  const INVOICE_BRAND_SETTINGS = useInvoiceBrandSettings()


  const paperRef = useRef(null)
  const [invoice, setInvoice] = useState(snapShotedInvoice)
  const [pdfLoading, setPdfLoading]   = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const templateKey = invoice.template || generalSettings.invoiceTemplate || 'invoiceTemplate1'
  const Template = TEMPLATE_MAPPINGS[templateKey] || TEMPLATE_MAPPINGS.invoiceTemplate1
  const snapShotedInvoiceBrandSettings = invoice.brandSnapshot ? { ...INVOICE_BRAND_SETTINGS, ...invoice.brandSnapshot } : INVOICE_BRAND_SETTINGS
  const brandCSSVars = getBrandCSSVars(snapShotedInvoiceBrandSettings.colour)
  const filename = `Invoice-${invoice.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

  const handleDownload = async () => {
    if (!paperRef.current || pdfLoading) return
    setPdfLoading(true)
    showToast?.('Generating PDF…')
    try {
      const exactHeight = Math.ceil(paperRef.current.getBoundingClientRect().height)
      await downloadPDF(paperRef.current, filename, brandCSSVars, exactHeight)
      showToast?.('PDF downloaded ✓')
    } 
    catch (err) {

      showToast?.('PDF failed — please try again.')
    } 
    finally {
      setPdfLoading(false)
    }
  }

  const handleShare = async () => {
    if (!paperRef.current || shareLoading) return
    setShareLoading(true)
    showToast?.('Preparing…')
    try {
      const exactHeight = Math.ceil(paperRef.current.getBoundingClientRect().height)
      const message = buildInvoiceWhatsAppMessage(invoice, customer, snapShotedInvoiceBrandSettings)
      await sharePDF(paperRef.current, filename, message, brandCSSVars, exactHeight)
      showToast?.('Shared ✓')
    } catch (err) {
      if (err?.name !== 'AbortError') {
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
            outlined: true ,
            color: 'var(--danger)',
          },
        ]}
      />

      <div className={styles.scrollArea}>

        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${styles[`status_${invoice.status}`]}`}>
            {STATUS_LABELS[invoice.status] || invoice.status}
          </div>
        </div>

        <div className={styles.mobileLayout}>
          
          <div className={styles.paperWrap}>
            <div ref={paperRef} className={styles.paperInner} style={brandCSSVars}>
              <Template invoice={invoice} customer={customer} invoiceBrandSettings={ snapShotedInvoiceBrandSettings} />
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}