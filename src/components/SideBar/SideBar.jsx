import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth }         from '../../contexts/AuthContext'
import { useReviews }      from '../../contexts/ReviewContext'
import { useCustomers }    from '../../contexts/CustomerContext'
import { useOrders }       from '../../contexts/OrdersContext'
import { useAppointments } from '../../contexts/AppointmentContext'
import { useTasks }        from '../../contexts/TaskContext'
import { useInvoices }     from '../../contexts/InvoiceContext'
import { useReceipts }     from '../../contexts/ReceiptContext'
import styles from './SideBar.module.css'

const NAV_SECTIONS = [
  {
    key: 'workspace',
    label: 'Workspace',
    items: [
      { path: '/',          label: 'Dashboard', icon: 'dashboard'     },
      { path: '/customers', label: 'Customers', icon: 'groups',        badgeKey: 'customers'  },
      { path: '/orders',    label: 'Orders',    icon: 'shopping_cart', badgeKey: 'orders'     },
      { path: '/inventory', label: 'Inventory', icon: 'inventory_2'   },
      { path: '/gallery',   label: 'Gallery',   icon: 'photo_library' },
    ],
  },
  {
    key: 'schedule',
    label: 'Schedule',
    items: [
      { path: '/appointments', label: 'Appointments', icon: 'event',      badgeKey: 'appointments' },
      { path: '/tasks',        label: 'Tasks',        icon: 'assignment', badgeKey: 'tasks'        },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { path: '/payments',  label: 'Payments',  icon: 'payments'                              },
      { path: '/invoices',  label: 'Invoices',  icon: 'receipt_long', badgeKey: 'invoices'   },
      { path: '/receipts',  label: 'Receipts',  icon: 'receipt',      badgeKey: 'receipts'   },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    items: [
      { path: '/reports', label: 'Reports', icon: 'bar_chart'   },
      { path: '/reviews', label: 'Reviews', icon: 'rate_review', badgeKey: 'reviews' },
    ],
  },
  {
    key: 'help',
    label: 'Help',
    items: [
      { path: '/contact', label: 'Contact Us', icon: 'call'         },
      { path: '/faq',     label: 'FAQs',       icon: 'help_outline' },
    ],
  },
  {
    key: 'account',
    label: 'Account',
    items: [
      { path: '/settings', label: 'Settings', icon: 'settings'              },
      { path: '/profile',  label: 'Account',  icon: 'person'                },
      { path: '/login',    label: 'Log out',  icon: 'logout', danger: true  },
    ],
  },
]

function NavBadge({ count, variant = 'neutral' }) {
  if (!count || count === 0) return null
  return (
    <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function SideBar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { pendingCount: reviewsPending } = useReviews()
  const { customers }                    = useCustomers()
  const { allOrders }                    = useOrders()
  const { todayAppointments }            = useAppointments()
  const { tasks }                        = useTasks()
  const { allInvoices }                  = useInvoices()
  const { allReceipts }                  = useReceipts()

  const pendingOrders   = allOrders.filter(o => o.status === 'pending' || o.status === 'new').length
  const incompleteTasks = tasks.filter(t => !t.done && !t.completed).length
  const unpaidInvoices  = allInvoices.filter(inv =>
    inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'sent'
  ).length

  const badgeMap = {
    customers:    { count: customers.length,         variant: 'neutral' },
    orders:       { count: pendingOrders,             variant: 'pending' },
    appointments: { count: todayAppointments.length,  variant: 'info'    },
    tasks:        { count: incompleteTasks,           variant: 'pending' },
    invoices:     { count: unpaidInvoices,            variant: 'pending' },
    receipts:     { count: allReceipts.length,        variant: 'neutral' },
    reviews:      { count: reviewsPending,            variant: 'pending' },
  }

  const fullName    = user?.displayName || user?.email?.split('@')[0] || 'User'
  const displayName = fullName.split(' ').slice(0, 2).join(' ')
  const initials    = fullName.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  const handleNav = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />
      <nav className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>

        <div className={styles.top}>
          <div className={styles.brand}>
            <img
              src="/icons/icon192.png"
              alt="Sew Padi"
              className={styles.brandIcon}
            />
            <div className={styles.brandText}>
              <span className={styles.brandName}>Sew Padi</span>
              <span className={styles.tagline}>For tailors who mean business</span>
            </div>
          </div>
          <div className={styles.user}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
        </div>

        <div className={styles.scrollArea}>
          <div className={styles.nav}>
            {NAV_SECTIONS.map((section, i) => (
              <div key={section.key} className={`${styles.section} ${i > 0 ? styles.sectionBordered : ''}`}>
                <div className={styles.sectionLabel}>{section.label}</div>
                {section.items.map((item) => {
                  const badge = item.badgeKey ? badgeMap[item.badgeKey] : null
                  return (
                    <button
                      key={item.path}
                      className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''} ${item.danger ? styles.danger : ''}`}
                      onClick={() => handleNav(item.path)}
                    >
                      <span className="mi">{item.icon}</span>
                      <span className={styles.navLabel}>{item.label}</span>
                      {badge && <NavBadge count={badge.count} variant={badge.variant} />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button className={styles.footerLink}>Terms &amp; Conditions</button>
            <button className={styles.footerLink}>Refund / Cancellation Policy</button>
            <button className={styles.footerLink}>Privacy Policy</button>
          </div>
        </div>

      </nav>
    </>
  )
}

export default SideBar
