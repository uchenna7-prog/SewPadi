import styles from "../styles/Template2.module.css"
import { getDueDate } from "../utils/invoiceUtils"
import { ItemsTable } from "../components/InvoiceItemsTable/InvoiceItemsTable"
import { LogoOrName } from "../components/LogoOrBrandName/LogoOrBrandName"


export function InvoiceTemplate2({ invoice, customer, brand }) {

  const dueDate = getDueDate(invoice, brand.invoiceDueDays)

  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div>

          <div className={styles.title}>INVOICE</div>
          <div className={styles.invoiceNumber}>{invoice.number}</div>

        </div>

        <div className={styles.logoBox}><LogoOrName brand={brand} /></div>

      </div>

      <div className={styles.grid}>

        <div className={styles.gridBox}>

          <strong>BILL FROM</strong><br />
          {brand.name}<br />
          {brand.phone}<br />
          {brand.address && <span>{brand.address}<br /></span>}

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

        <ItemsTable invoice={invoice} brand={brand} />

        {brand.accountBank && (
          <div className={styles.paymentInfo}>
            <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Information:</strong><br/>

              <div>

                <div>
                  {brand.accountBank && (
                    <div>Bank Name : {brand.accountBank}</div>
                  )}

                  {brand.accountNumber && (
                    <div>Account Number : {brand.accountNumber}</div>
                  )}

                  {brand.accountName && (
                    <div>Account Name : {brand.accountName}</div>
                  )}
                  
                </div>

              </div>
          </div>
        )}

      </div>

      <div className={styles.footerCenteredText}>{brand.invoiceFooter || 'Thank you!'}</div>

    </div>
  )
}