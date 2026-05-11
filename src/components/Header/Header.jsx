import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotifications } from '../../contexts/NotificationContext'
import styles from './Header.module.css'

// ── Notification type colours ─────────────────────────────────
const TYPE_BG = {
  order:       'rgba(168,85,247,0.12)',
  invoice:     'rgba(34,197,94,0.12)',
  task:        'rgba(99,102,241,0.12)',
  appointment: 'rgba(6,182,212,0.12)',
  birthday:    'rgba(251,146,60,0.12)',
  review:      'rgba(245,158,11,0.15)',
}

function timeLabel(timeStr) {
  if (!timeStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(timeStr)) {
    const diff = Math.round((new Date(timeStr + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
    if (diff === 0)  return 'Today'
    if (diff === 1)  return 'Tomorrow'
    if (diff === -1) return 'Yesterday'
    if (diff < 0)    return `${Math.abs(diff)}d ago`
    return `In ${diff}d`
  }
  return timeStr
}

function NotifItem({ n, onRead, onNavigate }) {
  const handleClick = () => {
    if (n.unread) onRead(n.id)
    if (n.type === 'review') onNavigate?.('/reviews')
  }

  return (
    <div
      className={`${styles.notifItem} ${n.unread ? styles.unread : ''} ${n.type === 'review' ? styles.notifItemReview : ''}`}
      onClick={handleClick}
      style={{ cursor: n.type === 'review' ? 'pointer' : n.unread ? 'pointer' : 'default' }}
    >
      <div className={styles.notifIcon} style={{ background: TYPE_BG[n.type] || 'var(--surface2)' }}>
        {n.icon}
      </div>
      <div className={styles.notifContent}>
        <h5>{n.title}</h5>
        <p>{n.body}</p>
        {n.type === 'review' && (
          <span className={styles.notifReviewHint}>Tap to review →</span>
        )}
        <span className={styles.notifTime}>{timeLabel(n.time)}</span>
      </div>
      {n.unread && <span className={styles.unreadDot} />}
    </div>
  )
}

// ── Bot Icon SVG ──────────────────────────────────────────────
function BotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="3" fill="currentColor" />
      <rect x="7" y="14" width="2.5" height="2.5" rx=".5" fill="var(--bg)" />
      <rect x="14.5" y="14" width="2.5" height="2.5" rx=".5" fill="var(--bg)" />
      <path d="M9.5 18.5h5" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 11V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="6.5" r="1.8" fill="currentColor" />
      <line x1="4" y1="15" x2="2" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────

function Header({
  onMenuClick,
  onBackClick,
  type            = 'default',
  title,
  customTitle,            // ← NEW: renders instead of title string when provided
  customActions   = [],
  backIcon        = 'arrow_back_ios',
  agentPendingCount = 0,  // ← now defaults 0; caller passes real count
  scrolledAvatar  = null,
  isScrolled: isScrolledProp = false,
  showRightAvatar = false,
}) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifTab,  setNotifTab]  = useState('all')
  const [scrolled,  setScrolled]  = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const PAGE_TITLES = {
    '/':          'Dashboard',
    '/customers': 'Customers',
    '/tasks':     'Tasks',
    '/settings':  'Settings',
    '/agent':     'Agent',
  }

  const pageTitle     = title || PAGE_TITLES[location.pathname] || 'SewPadi'
  const showBotButton = type === 'default' && location.pathname === '/'

  const openNotif  = () => { setNotifTab('all'); setNotifOpen(true) }
  const closeNotif = () => setNotifOpen(false)

  const handleBackAction = () => {
    if (onBackClick) onBackClick()
    else navigate(-1)
  }

  const handleBotClick = () => navigate('/agent')

  const visibleNotifs = (() => {
    if (notifTab === 'unread') return notifications.filter(n => n.unread)
    if (notifTab === 'read')   return notifications.filter(n => !n.unread)
    return notifications
  })()

  const TABS = [
    { id: 'all',    label: 'All',    count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'read',   label: 'Read',   count: notifications.length - unreadCount },
  ]

  const filteredActions = customActions.filter(a => !a._isScrollAvatar)

  return (
    <>
      <header className={`${styles.header} ${type === 'back' ? styles.backHeader : ''} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.leftSide}>

          {/* Back / hamburger button */}
          {type === 'default' && (
            <button className={styles.iconBtn} onClick={onMenuClick} aria-label="Open menu">
              <span className={styles.hamburgerLines}><span /><span /><span /></span>
            </button>
          )}
          {type === 'back' && (
            <button className={styles.iconBtn} onClick={handleBackAction} aria-label="Go back">
              <span className="mi" style={{ fontSize: '1.4rem' }}>{backIcon}</span>
            </button>
          )}

          {/* Scrolled avatar (back pages only) */}
          {type === 'back' && scrolledAvatar && (
            <div
              className={`${styles.leftAvatar} ${isScrolledProp ? styles.leftAvatarVisible : styles.leftAvatarHidden}`}
              onClick={isScrolledProp ? scrolledAvatar.onClick : undefined}
              role={isScrolledProp ? 'button' : undefined}
              aria-label={isScrolledProp ? 'View profile photo' : undefined}
              aria-hidden={!isScrolledProp}
            >
              {scrolledAvatar.src
                ? <img src={scrolledAvatar.src} className={styles.leftAvatarImg} alt="" />
                : <span className={styles.leftAvatarInitials}>{scrolledAvatar.initials}</span>
              }
            </div>
          )}

          {/* Title — customTitle node takes priority over string title */}
          {customTitle
            ? (
              <div className={`${styles.customTitleWrap} ${isScrolledProp && scrolledAvatar ? styles.titleShifted : ''}`}>
                {customTitle}
              </div>
            ) : (
              <div className={`${styles.title} header-title ${isScrolledProp && scrolledAvatar ? styles.titleShifted : ''}`}>
                {pageTitle}
              </div>
            )
          }
        </div>

        {/* ── BACK HEADER ACTIONS ── */}
        {type === 'back' && (
          <div className={styles.rightActions}>
            {filteredActions.map((action, i) => {
              if (action.customNode) {
                return (
                  <div key={i} className={styles.customActionNode}>
                    {action.customNode}
                  </div>
                )
              }
              return (
                <button
                  key={i}
                  className={`${action.label ? styles.textBtn : styles.iconBtn} ${styles.actionBtnRelative}`}
                  onClick={action.onClick}
                  aria-label={action.label || action.icon}
                  disabled={action.disabled}
                  style={!action.label ? { color: action.color || 'var(--text2)' } : {}}
                >
                  {action.icon && (
                    <span
                      className={`mi${action.outlined ? '-outlined' : ''}`}
                      style={{ fontSize: action.label ? '1.1rem' : '1.4rem' }}
                    >
                      {action.icon}
                    </span>
                  )}
                  {action.label && <span>{action.label}</span>}
                  {/* Badge support for customActions */}
                  {action.badge > 0 && (
                    <span className={styles.actionBadge}>
                      {action.badge > 9 ? '9+' : action.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── DEFAULT HEADER ACTIONS ── */}
        {type === 'default' && (
          <div className={styles.rightActions}>
            <button className={styles.iconBtn} onClick={openNotif} aria-label="Notifications">
              <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--text2)' }}>notifications</span>
              {unreadCount > 0 && (
                <span className={styles.notifDot}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showBotButton && (
              <button
                className={styles.iconBtn}
                onClick={handleBotClick}
                aria-label="Open Agent"
                title="Stitch — SewPadi Agent"
              >
                <BotIcon />
                {agentPendingCount > 0 && (
                  <span className={styles.botBadge}>
                    {agentPendingCount > 9 ? '9+' : agentPendingCount}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── NOTIFICATION PANEL ── */}
      {type === 'default' && notifOpen && (
        <div className={styles.notifOverlay} onClick={e => e.target === e.currentTarget && closeNotif()}>
          <div className={styles.notifPanel}>
            <div className={styles.notifHeader}>
              <span className={styles.notifTitle}>Notifications</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
                <button className={styles.iconBtn} onClick={closeNotif}>
                  <span className="mi" style={{ fontSize: '1.5rem' }}>close</span>
                </button>
              </div>
            </div>

            <div className={styles.notifTabs}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`${styles.notifTabBtn} ${notifTab === t.id ? styles.notifTabActive : ''}`}
                  onClick={() => setNotifTab(t.id)}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`${styles.notifTabBadge} ${t.id === 'unread' && t.count > 0 ? styles.notifTabBadgeAlert : ''}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className={styles.notifBody}>
              {visibleNotifs.length === 0 ? (
                <div className={styles.notifEmpty}>
                  <span className="mi" style={{ fontSize: '2.5rem', opacity: 0.2 }}>
                    {notifTab === 'read' ? 'done_all' : 'notifications_none'}
                  </span>
                  <p>
                    {notifTab === 'unread'
                      ? 'All caught up!'
                      : notifTab === 'read'
                      ? 'No read notifications yet.'
                      : 'No notifications.'}
                  </p>
                </div>
              ) : (
                visibleNotifs.map(n => (
                  <NotifItem
                    key={n.id}
                    n={n}
                    onRead={markRead}
                    onNavigate={(path) => { closeNotif(); navigate(path) }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
