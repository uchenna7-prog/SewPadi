import { useState, useRef } from 'react'
import { useBrandTokens } from '../../../../hooks/useBrandTokens'
import Header from '../../../../components/Header/Header'
import { INVOICE_TEMPLATE_GROUPS } from '../../datas/invoiceTemplateGroups'
import { RECEIPT_TEMPLATE_GROUPS } from '../../datas/receiptTemplateGroups'
import {
  CUSTOMER_SAMPLE_DATA,
  getInvoiceSampleData,
  getReceiptSampleData,
} from '../../datas/sampleDatas'
import { useReceiptBrandSettings } from '../../../../hooks/useReceiptBrandSettings'
import { useInvoiceBrandSettings } from '../../../../hooks/useInvoiceBrandSettings'
import styles from './TemplateModal.module.css'


export function TemplateModal({
  isOpen,
  currentInvoiceTemplate,
  currentReceiptTemplate,
  colourId,
  onClose,
  onSelect,
}) {
  

  const RECEIPT_BRAND_SETTINGS = useReceiptBrandSettings()
  const INVOICE_BRAND_SETTINGS = useInvoiceBrandSettings()

  const modalRef = useRef(null)

  const [selectedInvoiceTemplate, setSelectedInvoiceTemplate] = useState(
    currentInvoiceTemplate || 'invoiceTemplate1'
  )
  const [selectedReceiptTemplate, setSelectedReceiptTemplate] = useState(
    currentReceiptTemplate || 'receiptTemplate1'
  )
  const [activeTab, setActiveTab] = useState('invoice')
  const [inActiveTab, setInActiveTab] = useState("receipt")

  useBrandTokens(colourId, modalRef)

  if (!isOpen) return null

  const tabs = {
    invoice: {
      label: 'Invoice',
      icon: 'receipt_long',
      templateGroups: INVOICE_TEMPLATE_GROUPS,
      selectedId: selectedInvoiceTemplate,
      onSelectTemplate: setSelectedInvoiceTemplate,
      getSampleProps: () => ({
        invoice: getInvoiceSampleData(INVOICE_BRAND_SETTINGS),
        customer: CUSTOMER_SAMPLE_DATA,
        invoiceBrandSettings: {

        ...INVOICE_BRAND_SETTINGS,
        name: "Emeka Tailors",
        tagline:  "crafted with love, fitted for you",
        phone: '+234 803325678',
        email: 'emekatailors@gmail.com',
        address: 'No 5 Amadi Street, Ikeja, Lagos, Nigeria.',
        website: 'www.emekatailors.com',
        logo:null,

        accountBank: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Emeka Tailors',

        footer: 'Thank you for your patronage 🙏'
        },
      }),
    },
    receipt: {
      label: 'Receipt',
      icon: 'payments',
      templateGroups: RECEIPT_TEMPLATE_GROUPS,
      selectedId: selectedReceiptTemplate,
      onSelectTemplate: setSelectedReceiptTemplate,
      getSampleProps: () => ({
        receipt: getReceiptSampleData(RECEIPT_BRAND_SETTINGS),
        customer: CUSTOMER_SAMPLE_DATA,
        receiptBrandSettings: {

        ...RECEIPT_BRAND_SETTINGS,
        name: "Emeka Tailors",
        tagline:  "crafted with love, fitted for you",
        phone: '+234 803325678',
        email: 'emekatailors@gmail.com',
        address: 'No 5 Amadi Street, Ikeja, Lagos, Nigeria.',
        website: 'www.emekatailors.com',
        logo:null,

        accountBank: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Emeka Tailors',

        footer: 'Thank you for your patronage 🙏'
        },
      }),
    },
  }

  const activeTabObject = tabs[activeTab]
  const inActiveTabObject = tabs[inActiveTab]

  function handleConfirmSelection() {
    onSelect({
      invoiceTemplate: selectedInvoiceTemplate,
      receiptTemplate: selectedReceiptTemplate,
    })
    onClose()
  }


  return (
    <div className={styles.templateModalContainer} ref={modalRef}>

      <Header
        type="back"
        title="Templates"
        onBackClick={onClose}
        customActions={[{ label: 'Select', onClick: handleConfirmSelection }]}
      />

      <div className={styles.tabRow}>

        {Object.entries(tabs).map(([tabKey, tab]) => (
          <button
            key={tabKey}
            className={`${styles.tabButton} ${activeTab === tabKey ? styles.tabButtonActive : ''}`}
            onClick={() => {

              if(tabKey === "invoice"){

                setActiveTab("invoice")
                setInActiveTab("receipt")
              }

              else{

                setActiveTab("receipt")
                setInActiveTab("invoice")

              }   

            }
            
            }
          >
            <span className="mi" style={{ fontSize: '1rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>


      <div className={styles.templateList}>

        {activeTabObject.templateGroups.map((group, groupIndex) => (

          <div key={group.groupLabel}>

            <div className={`${styles.groupHeader} ${groupIndex === 0 ? styles.groupHeaderFirst : ''}`}>

              <div className={styles.groupHeaderText}>

                <span className={styles.groupName}>{group.groupLabel}</span>
                {group.groupDescription && (
                  <span className={styles.groupSubtitle}>{group.groupDescription}</span>
                )}

              </div>

            </div>

            <div className={styles.groupTemplateGrid}>

              {group.templates.map(template => {
                const isSelected = activeTabObject.selectedId === template.id

                return (
                  <div
                    key={template.id}
                    className={styles.templateCard}
                    onClick={() => {

                      let templateNumber = 0
                      let invoiceTemplate = ""
                      let receiptTemplate = ""

                      if (activeTabObject.label === "Invoice"){

                        templateNumber = template.id.replace("invoiceTemplate","")
                        invoiceTemplate = template.id
                        receiptTemplate = "receiptTemplate" + templateNumber
                        activeTabObject.onSelectTemplate(template.id)
                        inActiveTabObject.onSelectTemplate(receiptTemplate)
                      }

                      else{

                        templateNumber = template.id.replace("receiptTemplate","")
                        receiptTemplate = template.id
                        invoiceTemplate = "invoiceTemplate" + templateNumber
                        activeTabObject.onSelectTemplate(template.id)
                        inActiveTabObject.onSelectTemplate(invoiceTemplate)

                      }
                    }
                    }
                  >
          
                    <div className={`${styles.templatePreview} ${isSelected ? styles.templatePreviewSelected : ''}`}>
                      <template.Component {...activeTabObject.getSampleProps()} />
                    </div>

                    <div className={styles.templateLabelRow}>

                      <div className={`${styles.radioCircle} ${isSelected ? styles.radioCircleSelected : ''}`} />

                      <div className={styles.templateTextGroup}>

                        <span className={styles.templateName}>{template.label}</span>
                        {template.description && (
                          <span className={styles.templateSubtitle}>{template.description}</span>
                        )}

                      </div>
                      
                    </div>

                  </div>
                )
              })}
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}