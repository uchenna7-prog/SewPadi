import { useRef, useState } from 'react'
import { useGeneralSettings } from '../../contexts/GeneralSettingsContext'
import { useProfileSettings } from '../../contexts/ProfileSettingsContext'
import { TEMPLATE_MAPPINGS } from '../Templates/datas/receiptTemplateMappings'
import {   
  resolveCumulativePaid, 
  buildReceiptWhatsAppMessage 
} from './utils'
import { useReceiptBrandSettings } from '../../hooks/useReceiptBrandSettings'
import { getBrandCSSVars } from '../../utils/cssVariablesUtils'
import { sharePDF,downloadPDF } from '../../utils/pdfUtils'
import Header from '../Header/Header'
import styles from './ReceiptViewer.module.css'


export default function ReceiptViewer({ 
  receipt: snapshotedReceipt, 
  customer, 
  onClose, 
  onDelete, 
  showToast 
}) {

  const { generalSettings } = useGeneralSettings()
  const { profileSettings } = useProfileSettings()

  const RECEIPT_BRAND_SETTINGS = useReceiptBrandSettings()

  const paperRef = useRef(null)
  const [receipt, setReceipt] = useState(snapshotedReceipt)
  const [pdfLoading, setPdfLoading]   = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const templateKey = receipt.template || generalSettings.receiptTemplate || 'receiptTemplate1'
  const Template = TEMPLATE_MAPPINGS[templateKey] || TEMPLATE_MAPPINGS.receiptTemplate1
  const snapshotedReceiptBrandSettings = receipt.brandSnapshot ? { ...RECEIPT_BRAND_SETTINGS, ...receipt.brandSnapshot } : RECEIPT_BRAND_SETTINGS
  const brandCSSVars = getBrandCSSVars(snapshotedReceiptBrandSettings.brandColour)
  const filename = `Receipt-${receipt.number}-${customer.name.replace(/\s+/g, '_')}.pdf`

  const cumulativePaid = resolveCumulativePaid(receipt)
  const orderTotal  = receipt.orderPrice ? parseFloat(receipt.orderPrice) : cumulativePaid
  const isFullPay  = cumulativePaid >= orderTotal && orderTotal > 0


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
      const message = buildReceiptWhatsAppMessage(receipt, customer, snapshotedReceiptBrandSettings)
      await sharePDF(paperRef.current, filename, message, brandCSSVars, exactHeight)
      showToast?.('Shared ✓')
    } 
    catch (err) {
      if (err?.name !== 'AbortError') {
        showToast?.('Share failed — please try again.')
      }
    } 
    finally {
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
            icon: pdfLoading ? 'hourglass_top' : 'download',
            onClick: handleDownload,
            disabled: pdfLoading,
          },
          {
            icon: shareLoading ? 'hourglass_top' : 'share',
            onClick:  handleShare,
            disabled: shareLoading,
          },
          {
            icon: 'delete',
            onClick: () => onDelete(receipt.id),
            outlined: true,
            color: 'var(--danger)',
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
            <Template receipt={receipt} customer={customer} receiptBrandSettings={snapshotedReceiptBrandSettings} />
          </div>
        </div>
       
      </div>
    </div>
  )
}