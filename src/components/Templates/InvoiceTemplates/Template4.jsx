import styles from "../styles/Template4.module.css"
import { getDueDate } from "../utils/invoiceUtils"
import { ItemsTable } from "../components/InvoiceItemsTable/InvoiceItemsTable"
import { LogoOrName } from "../components/LogoOrBrandName/LogoOrBrandName"

export function InvoiceTemplate4({ invoice, customer, brand }) {

  const bannerBg = brand.colour || '#1C1814'
  const dueDate  = getDueDate(invoice, brand.invoiceDueDays)

  return (

    <div className={styles.template} style={{ padding : 0 }}>

      <div className={styles.customBanner} style={{ background : bannerBg }}>

        <div className={styles.customBannerLogo}>
          <LogoOrName brand={brand} darkBg />
        </div>

        <div className={styles.customBannerRight}>

          <div className={styles.customBannerTitle}>INVOICE</div>
          <div className={styles.customBannerInvoiceNumber}>{invoice.number}</div>

        </div>

      </div>

      <div className={styles.body}>

        <div className={styles.metaRow} style={{ marginBottom : 16 }}>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>BILL FROM</div>
            <div className={styles.metaVal}>{brand.name}</div>
            {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
            {brand.address && <div className={styles.metaSub}>{brand.address}</div>}

          </div>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>BILL TO</div>
            <div className={styles.metaVal}>{customer.name}</div>
            {customer.phone && <div className={styles.metaSub}>{customer.phone}</div>}
            {customer.address && <div className={styles.metaSub}>{customer.address}</div>}

          </div>

          <div className={styles.metaItem}>

            <div className={styles.metaLabel}>ISSUE DATE</div>
            <div className={styles.metaSub}>{invoice.date}</div>

          </div>

          <div className={styles.metaItem} style={{ textAlign : 'right' }}>

            <div className={styles.metaLabel}>DUE DATE</div>
            <div className={styles.metaSub}>{dueDate}</div>

          </div>

        </div>

        <ItemsTable invoice={invoice} brand={brand} />

        {brand.accountBank && (
          <div className={styles.paymentRow}>
            <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Information :</strong><br/>

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
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerText} >{brand.invoiceFooter || 'Thank you for your patronage'}</div>
      </div>

    </div>
  )
}
