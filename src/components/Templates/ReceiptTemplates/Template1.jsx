import styles from "../styles/Template1.module.css"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { ItemsTable } from "../components/ReceiptItemsTable/ReceiptItemsTable"


export function ReceiptTemplate1({ receipt, customer, brand }) {

  const lineColor = brand.colour || '#1C1814'

  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.brandName}>{brand.name || 'Your Brand'}</div>
        {brand.tagline && <div className={styles.tagline}>{brand.tagline}</div>}

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

      {/* grows to push footer down */}
      <div className={styles.body}>

        <ItemsTable receipt={receipt} brand={brand} />
        <ReceiptPaymentSummary receipt={receipt} brand={brand}/>

      </div>

      {(brand.accountBank || brand.phone || brand.email || brand.receiptFooter) && (

        <div className={styles.footer}>

          {brand.accountBank && (

            <div className={styles.footerLeft}>

              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Details :</strong><br />

              <div>
                <div>

                  {brand.name && (
                    <div>Received By: {brand.name}</div>
                  )}
                  
                </div>
              </div>

            </div>

          )}

          {(brand.phone || brand.email || brand.receiptFooter) && (

            <div className={styles.footRight}>

              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Notes :</strong><br />
              {brand.phone   && <span>{brand.phone}<br /></span>}
              {brand.email   && <span>{brand.email}<br /></span>}
              {brand.receiptFooter  && <span>{brand.receiptFooter}</span>}

            </div>

          )}

        </div>

      )}

    </div>

  )

}


