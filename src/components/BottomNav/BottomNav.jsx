import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './BottomNav.module.css'


const NAV_ITEMS = [
  { 
    icon: 'dashboard',     
    label: 'Dashboard',    
    route: '/'             
  },

  { 
    icon: 'groups',        
    label: 'Customers',    
    route: '/customers'    
  },

  { 
    icon: 'event',         
    label: 'Appointments', 
    route: '/appointments' 
  },

  { 
    icon: 'shopping_cart', 
    label: 'All Orders',       
    route: '/orders'       
  },

  { 
    icon: 'assignment',    
    label: 'Tasks',        
    route: '/tasks'        
  },

]

function BottomNav() {

  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [hidden, setHidden] = useState(false)

  const lastY   = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {

    const onScroll = (e) => {

      const target = e.target
      if (!target || target === document) return

      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const currentY = target.scrollTop
        const delta    = currentY - lastY.current

        if (Math.abs(delta) > 4) {
          setHidden(delta > 0 && currentY > 60)
          lastY.current = currentY
        }

        ticking.current = false
      })
    }

    setHidden(false)
    lastY.current = 0

    document.addEventListener('scroll', onScroll, { 
      capture: true, 
      passive: true 
    })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [pathname])

  return (
    <nav className={`${styles.bottomNav} ${hidden ? styles.bottomNavHidden : ''}`}>
      {NAV_ITEMS.map(item => {
        const isActive = item.route === '/'
          ? pathname === '/' || pathname === '/home'
          : pathname.startsWith(item.route)

        return (
          <button
            key={item.route}
            className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}
            onClick={() => navigate(item.route)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={`mi ${styles.navIcon}`}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {isActive && <span className={styles.activeDot} />}
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav