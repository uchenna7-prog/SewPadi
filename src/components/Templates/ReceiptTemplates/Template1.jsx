import styles from "../styles/Template1.module.css"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { ItemsTable } from "../components/ReceiptItemsTable/ReceiptItemsTable"


export function ReceiptTemplate1({ receipt, customer, receiptBrandSettings }) {

  const lineColor = receiptBrandSettings.colour || '#1C1814'

  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.brandName}>{receiptBrandSettings.name || 'Your Brand'}</div>
        {receiptBrandSettings.tagline && <div className={styles.tagline}>{receiptBrandSettings.tagline}</div>}

        <div className={styles.titleRow}>

          <div className={styles.titleLine} style={{ background : lineColor }} />
          <div className={styles.title}>RECEIPT</div>
          <div className={styles.titleLine} style={{ background : lineColor }} />

        </div>

      </div>

      <div className={styles.metaRow}>

        <div>

          <div className={styles.metaLabel}>RECEIVED FROM</div>
          <div>{customer.name}</div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}

        </div>

        <div style={{ textAlign : 'right' }} className={styles.receiptInfos}>

          <div>
            <span className={styles.metaKey}>RECEIPT # </span>
            <span className={styles.metaValue}> {receipt.number}</span>
          </div>

          <div>
            <span className={styles.metaKey}>Issue Date </span>
            <span className={styles.metaValue}> {receipt.date}</span>
          </div>


        </div>

      </div>

 
      <div className={styles.body}>

        <ItemsTable receipt={receipt} receiptBrandSettings={receiptBrandSettings} />
        <ReceiptPaymentSummary receipt={receipt} receiptBrandSettings={receiptBrandSettings}/>

      </div>

      {(receiptBrandSettings.accountBank || receiptBrandSettings.phone || receiptBrandSettings.email || receiptBrandSettings.footer) && (

        <div className={styles.footer}>

          {receiptBrandSettings.accountBank && (

            <div className={styles.footerLeft}>

              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Details :</strong><br />

              <div>
                <div>

                  {receiptBrandSettings.name && (
                    <div>Received By: {receiptBrandSettings.name}</div>
                  )}
                  
                </div>
              </div>

            </div>

          )}

          {(receiptBrandSettings.phone || receiptBrandSettings.email || receiptBrandSettings.footer) && (

            <div className={styles.footRight}>

              <strong style={{fontWeight : 900,color :"var(--brand-primary-dark)"}}>Notes :</strong><br />
              {receiptBrandSettings.phone   && <span>{receiptBrandSettings.phone}<br /></span>}
              {receiptBrandSettings.email   && <span>{receiptBrandSettings.email}<br /></span>}
              {receiptBrandSettings.footer  && <span>{receiptBrandSettings.footer}</span>}

            </div>

          )}

        </div>

      )}

    </div>

  )

}


