import styles from "../styles/Template2.module.css"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { ItemsTable } from "../components/ReceiptItemsTable/ReceiptItemsTable"
import { LogoOrName } from "../components/LogoOrBrandName/LogoOrBrandName"

export function ReceiptTemplate2({ receipt, customer, brand }) {


  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div>

          <div className={styles.title}>RECEIPT</div>
          <div className={styles.receiptNumber}>{receipt.number}</div>

        </div>

        <div className={styles.logoBox}><LogoOrName brand={brand} /></div>

      </div>

      <div className={styles.grid}>

        <div className={styles.gridBox}>

          <strong>RECEIVED BY</strong><br />
          {brand.name}<br />
          {brand.phone}<br />
          {brand.address && <span>{brand.address}<br /></span>}

        </div>

        <div className={styles.gridBox}>

          <strong>RECEIVED FROM</strong><br />
          {customer.name}<br />
          {customer.phone}
          {customer.address && <div className={styles.metaSub}>{customer.address}</div>}
          
        </div>

        <div className={styles.gridBox}>

          <strong>DETAILS</strong><br />
          Date : {receipt.date}<br />
   
        </div>

      </div>

      {/* grows to push footer down */}
      <div className={styles.body}>

        <ItemsTable receipt={receipt} brand={brand} />
        <ReceiptPaymentSummary receipt={receipt} brand={brand} />

        {brand.accountBank && (
          <div className={styles.paymentInfo}>
            <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Details</strong><br/>

              <div>

                <div>

                    {brand.name && (
                      <div>Received By  : {brand.name}</div>
                    )}
                  
                </div>

              </div>
          </div>
        )}

      </div>

      <div className={styles.footerCenteredText}>{brand.receiptFooter || 'Thank you!'}</div>

    </div>
  )
}