import styles from './FormField.module.css'

export function FieldGroup({ children }) {
  return <div className={styles.fieldGroup}>{children}</div>
}

export function Field({ label, hint, children }) {

  return (
    <div className={styles.field}>

      <label className={styles.fieldLabel}>{label}</label>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
      {children}
      
    </div>
  )
}