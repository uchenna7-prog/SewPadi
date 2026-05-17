import styles from "../styles/Template1.module.css"
import { ItemsTable } from "../components/InvoiceItemsTable/InvoiceItemsTable"
import { getDueDate } from "../utils/invoiceUtils"


export function InvoiceTemplate1({ invoice, customer, invoiceBrandSettings }) {


  const dueDate = getDueDate(invoice, invoiceBrandSettings.dueDays)
  const lineColor = invoiceBrandSettings.colour || '#1C1814'


  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.brandName}>{invoiceBrandSettings.name || 'Your Brand'}</div>
        {invoiceBrandSettings.tagline && <div className={styles.tagline}>{invoiceBrandSettings.tagline}</div>}

        <div className={styles.titleRow}>

          <div className={styles.titleLine} style={{ background : lineColor }} />
          <div className={styles.title}>INVOICE</div>
          <div className={styles.titleLine} style={{ background : lineColor }} />

        </div>

      </div>

      <div className={styles.metaRow}>

        <div>

          <div className={styles.metaLabel}>BILL TO</div>
          <div>{customer.name}</div>
          {customer.phone   && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}

        </div>

        <div style={{ textAlign : 'right' }} className={styles.invoiceInfos}>

          <div>
            <span className={styles.metaKey}>INVOICE # </span>
            <span className={styles.metaValue}> {invoice.number}</span>
          </div>

          <div>
            <span className={styles.metaKey}>Issue Date </span>
            <span className={styles.metaValue}> {invoice.date}</span>
          </div>

          <div>
            <span className={styles.metaKey}>Due Date </span>
            <span className={styles.metaValue}> {dueDate}</span>
          </div>

        </div>

      </div>

  
      <div className={styles.body}>

        <ItemsTable invoice={invoice} invoiceBrandSettings={invoiceBrandSettings} />

      </div>

      {(invoiceBrandSettings.accountBank || invoiceBrandSettings.phone || invoiceBrandSettings.email || invoiceBrandSettings.footer) && (

        <div className={styles.footer}>

          {invoiceBrandSettings.accountBank && (

            <div className={styles.footerLeft}>

              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Information:</strong><br />

              <div>

                <div>

                  {invoiceBrandSettings.accountBank && (
                    <div>Bank Name: {invoiceBrandSettings.accountBank}</div>
                  )}

                  {invoiceBrandSettings.accountNumber && (
                    <div>Account Number: {invoiceBrandSettings.accountNumber}</div>
                  )}

                  {invoiceBrandSettings.accountName && (
                    <div>Account Name: {invoiceBrandSettings.accountName}</div>
                  )}
                  
                </div>
                
              </div>

            </div>

          )}

          {(invoiceBrandSettings.phone || invoiceBrandSettings.email || invoiceBrandSettings.footer) && (

            <div className={styles.footRight}>

              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Notes: </strong><br />
              {invoiceBrandSettings.phone   && <span>{invoiceBrandSettings.phone}<br /></span>}
              {invoiceBrandSettings.email   && <span>{invoiceBrandSettings.email}<br /></span>}
              {invoiceBrandSettings.footer  && <span>{invoiceBrandSettings.footer}</span>}

            </div>

          )}

        </div>

      )}

    </div>

  )

}