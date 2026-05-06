import styles from "../styles/Template4.module.css"
import { ReceiptPaymentSummary } from "../components/ReceiptPaymentSummary/ReceiptPaymentSummary"
import { ItemsTable } from "../components/ReceiptItemsTable/ReceiptItemsTable"
import { LogoOrName } from "../components/LogoOrBrandName/LogoOrBrandName"
import { calcTax} from "../utils/receiptUtils"

export function ReceiptTemplate4({ receipt, customer, brand }) {

  const bannerBg = brand.colour || '#1C1814'
  const { currency, showTax, taxRate: brandTaxRate } = brand
  
    const subtotal = receipt.items?.length > 0
      ? receipt.items.reduce((sum, item) => sum + ((item.qty ?? 1) * (parseFloat(item.price) || 0)), 0)
      : 0
  
    // Prefer frozen values from the receipt object; fall back to brand/calc
    const shippingFee    = parseFloat(receipt.shippingFee)    || 0
    const discountAmount = parseFloat(receipt.discountAmount) || 0
    const discountType   = receipt.discountType   || null   // 'percent' | 'flat' | null
    const discountValue  = parseFloat(receipt.discountValue)  || 0
    const useTax         = receipt.taxRate != null ? receipt.taxRate > 0 : (showTax && brandTaxRate > 0)
    const taxRate        = receipt.taxRate != null ? receipt.taxRate : brandTaxRate
    const taxAmount      = parseFloat(receipt.taxAmount) || calcTax(subtotal, taxRate, useTax)
    const grandTotal     = receipt.totalAmount != null
      ? parseFloat(receipt.totalAmount)
      : subtotal + shippingFee - discountAmount + taxAmount
  
    const discountLabel = discountType === 'percent'
      ? `Discount (${discountValue}%)`
      : 'Discount'
  
    const hasExtras = shippingFee > 0 || discountAmount > 0 || (useTax && taxAmount > 0)
  

  return (

    <div className={styles.template} style={{ padding : 0 }}>

      <div className={styles.customBanner} style={{ background : bannerBg }}>

        <div className={styles.customBannerLogo}>
          <LogoOrName brand={brand} darkBg />
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
            <div className={styles.metaVal}>{brand.name}</div>
            {brand.phone   && <div className={styles.metaSub}>{brand.phone}</div>}
            {brand.address && <div className={styles.metaSub}>{brand.address}</div>}

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

        <ItemsTable receipt={receipt} brand={brand} />
        <ReceiptPaymentSummary receipt={receipt} brand={brand} />

        {brand.accountBank && (
          <div className={styles.paymentRow}>
            <strong style={{fontWeight :900,color :"var(--brand-primary-dark)"}}>Payment Details :</strong><br/>

              <div>

                {brand.name && (
                  <div>Received By  : {brand.name}</div>
                )}
                
              </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerText} >{brand.receiptFooter || 'Thank you for your patronage'}</div>
      </div>

    </div>
  )
}
