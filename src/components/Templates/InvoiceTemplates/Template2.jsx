import styles from "../styles/Template2.module.css"
import { getDueDate } from "../utils/invoiceUtils"
import { ItemsTable } from "../components/InvoiceItemsTable/InvoiceItemsTable"
import { LogoOrName } from "../components/LogoOrBrandName/LogoOrBrandName"


export function InvoiceTemplate2({ invoice, customer, invoiceBrandSettings }) {

  const dueDate = getDueDate(invoice, invoiceBrandSettings.dueDays)

  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div>

          <div className={styles.title}>INVOICE</div>
          <div className={styles.invoiceNumber}>{invoice.number}</div>

        </div>

        <div className={styles.logoBox}><LogoOrName invoiceBrandSettings={invoiceBrandSettings} /></div>

      </div>

      <div className={styles.grid}>

        <div className={styles.gridBox}>

          <strong>BILL FROM</strong><br />
          {invoiceBrandSettings.name}<br />
          {invoiceBrandSettings.phone}<br />
          {invoiceBrandSettings.address && <span>{invoiceBrandSettings.address}<br /></span>}

        </div>

        <div className={styles.gridBox}>

          <strong>BILL TO</strong><br />
          {customer.name}<br />
          {customer.phone}
          {customer.address && <div className={styles.metaSub}>{customer.address}</div>}
          
        </div>

        <div className={styles.gridBox}>

          <strong>DETAILS</strong><br />
          Date: {invoice.date}<br />
          Due: {dueDate}

        </div>

      </div>

      {/* grows to push footer down */}
      <div className={styles.body}>

        <ItemsTable invoice={invoice} invoiceBrandSettings={invoiceBrandSettings} />

        {invoiceBrandSettings.accountBank && (
          <div className={styles.paymentInfo}>
            <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Information:</strong><br/>

              <div>

                <div>
                  {invoiceBrandSettings.accountBank && (
                    <div>Bank Name : {invoiceBrandSettings.accountBank}</div>
                  )}

                  {invoiceBrandSettings.accountNumber && (
                    <div>Account Number : {invoiceBrandSettings.accountNumber}</div>
                  )}

                  {invoiceBrandSettings.accountName && (
                    <div>Account Name : {invoiceBrandSettings.accountName}</div>
                  )}
                  
                </div>

              </div>
          </div>
        )}

      </div>

      <div className={styles.footerCenteredText}>{invoiceBrandSettings.footer || 'Thank you!'}</div>

    </div>
  )
}