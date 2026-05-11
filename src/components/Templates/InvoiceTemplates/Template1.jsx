import styles from "../styles/Template1.module.css"
import { ItemsTable } from "../components/InvoiceItemsTable/InvoiceItemsTable"
import { getDueDate } from "../utils/invoiceUtils"


export function InvoiceTemplate1({ invoice, customer, brand }) {


  const dueDate = getDueDate(invoice, brand.invoiceDueDays)
  const lineColor = brand.colour || '#1C1814'


  return (

    <div className={styles.template}>

      <div className={styles.header}>

        <div className={styles.brandName}>{brand.name || 'Your Brand'}</div>
        {brand.tagline && <div className={styles.tagline}>{brand.tagline}</div>}

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

      {/* grows to push footer down */}
      <div className={styles.body}>

        <ItemsTable invoice={invoice} brand={brand} />

      </div>

      {(brand.accountBank || brand.phone || brand.email || brand.invoiceFooter) && (

        <div className={styles.footer}>

          {brand.accountBank && (

            <div className={styles.footerLeft}>

              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Information:</strong><br />

              <div>

                <div>

                  {brand.accountBank && (
                    <div>Bank Name: {brand.accountBank}</div>
                  )}

                  {brand.accountNumber && (
                    <div>Account Number: {brand.accountNumber}</div>
                  )}

                  {brand.accountName && (
                    <div>Account Name: {brand.accountName}</div>
                  )}
                  
                </div>
                
              </div>

            </div>

          )}

          {(brand.phone || brand.email || brand.invoiceFooter) && (

            <div className={styles.footRight}>

              <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Notes: </strong><br />
              {brand.phone   && <span>{brand.phone}<br /></span>}
              {brand.email   && <span>{brand.email}<br /></span>}
              {brand.invoiceFooter  && <span>{brand.invoiceFooter}</span>}

            </div>

          )}

        </div>

      )}

    </div>

  )

}