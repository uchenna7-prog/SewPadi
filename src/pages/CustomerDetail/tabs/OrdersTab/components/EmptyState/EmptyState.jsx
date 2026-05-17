import styles from "./EmptyState.module.css"

export function EmptyState(){

    return(

        <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '2.8rem', opacity: 0.4 }}>shopping_basket</span>
            <p>No active orders yet.</p>
        </div>
        
    )
    


}    
        
