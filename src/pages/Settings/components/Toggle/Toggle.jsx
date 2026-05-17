import styles from "./Toggle.module.css"

export function Toggle({ value, onChange }) {

  return (

    <button className={`${styles.toggle} ${value ? styles.toggleOn:''}`} onClick={e=>{
        e.stopPropagation();
        onChange(!value);
      }
    } role="switch" aria-checked={value}>

      <span className={styles.toggleThumb} />
      
    </button>
  )
}