import styles from "../styles/Template4.module.css"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { ItemsTable } from "../components/ReceiptItemsTable/ReceiptItemsTable"
import { LogoOrName } from "../components/LogoOrBrandName/LogoOrBrandName"
import { calcTax} from "../utils/receiptUtils"

export function ReceiptTemplate4({ receipt, customer, receiptBrandSettings }) {

  const bannerBg = receiptBrandSettings.colour || '#1C1814'

  return (

    <div className={styles.template} style={{ padding : 0 }}>

      <div className={styles.customBanner} style={{ background : bannerBg }}>

        <div className={styles.customBannerLogo}>
          <LogoOrName receiptBrandSettings={receiptBrandSettings} darkBg />
        </div>

        <div className={styles.customBannerRight}>

          <div className={styles.customBannerTitle}>RECEIPT</div>
          <div className={styles.customBannerReceiptNumber}>{receipt.number}</div>

        </div>

      </div>

      <div className={styles.body}>

        <div className={styles.metaRow} style={{ marginBottom : 16 }}>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>RECEIVED BY</div>
            <div className={styles.metaVal}>{receiptBrandSettings.name}</div>
            {receiptBrandSettings.phone   && <div className={styles.metaSub}>{receiptBrandSettings.phone}</div>}
            {receiptBrandSettings.address && <div className={styles.metaSub}>{receiptBrandSettings.address}</div>}

          </div>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>RECEIVED FROM</div>
            <div className={styles.metaVal}>{customer.name}</div>
            {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
            {customer.address && <div className={styles.metaSub}>{customer.address}</div>}

          </div>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>ISSUE DATE</div>
            <div className={styles.metaSub}>{receipt.date}</div>

          </div>


        </div>

        <ItemsTable receipt={receipt} receiptBrandSettings={receiptBrandSettings} />
        <ReceiptPaymentSummary receipt={receipt} receiptBrandSettings={receiptBrandSettings} />

        {receiptBrandSettings.accountBank && (
          <div className={styles.paymentRow}>
            <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Details :</strong><br/>

              <div>

                {receiptBrandSettings.name && (
                  <div>Received By  : {receiptBrandSettings.name}</div>
                )}
                
              </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerText} >{receiptBrandSettings.footer || 'Thank you for your patronage'}</div>
      </div>

    </div>
  )
}
