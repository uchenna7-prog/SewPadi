import styles from "./LogoOrBrandName.module.css"


export function LogoOrName({ invoiceBrandSettings = {},receiptBrandSettings = {}, darkBg = false }) {
  
  if (invoiceBrandSettings.logo) return <img src={invoiceBrandSettings.logo} alt={invoiceBrandSettings.name} className={styles.logoImg} />

  if (receiptBrandSettings.logo) return <img src={receiptBrandSettings.logo} alt={receiptBrandSettings.name} className={styles.logoImg} />


  return (

    <div>
      {invoiceBrandSettings.logo && (
        
      <div className={styles.logoText} style={{ color: darkBg ? '#fff' : '#1a1a1a' }}>
        {invoiceBrandSettings.name || 'Your Brand'}
      </div>

      )}

      {receiptBrandSettings.logo && (
        
      <div className={styles.logoText} style={{ color: darkBg ? '#fff' : '#1a1a1a' }}>
        {receiptBrandSettings.name || 'Your Brand'}
      </div>

      )}
    </div>

  
  
  )
}