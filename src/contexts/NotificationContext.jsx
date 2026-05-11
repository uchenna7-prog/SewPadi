// src/contexts/NotificationContext.jsx
// ─────────────────────────────────────────────────────────────
// Derives notifications automatically from live app data.
// No separate Firestore collection needed — notifications are
// computed from orders, invoices, tasks, appointments and
// customer birthdays that are already subscribed globally.
//
// Read state is persisted in localStorage so "mark as read"
// survives page refreshes without an extra Firestore write.
//
// Push notifications are sent via the Web Push API whenever
// a new notification appears that the user hasn't seen yet.
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useRef, useMemo, useState } from 'react'
import { useOrders }       from './OrdersContext'
import { useInvoices }     from './InvoiceContext'
import { useTasks }        from './TaskContext'
import { useAppointments } from './AppointmentContext'
import { useCustomers }    from './CustomerContext'
import { useReviews }      from './ReviewContext'

const STORAGE_KEY  = 'sewpadi_read_notifs'
const PUSHED_KEY   = 'sewpadi_pushed_notifs'
const VAPID_KEY    = 'BAe8t_ReMQne5iBlUJyfwd3HQ8N-TcLJoSH2ai0QSWOQhrSLrbJeQnGENUm01yBoRkynmlnRE-86S_9dFOVaRdM'

function loadReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function saveReadIds(set) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])) }
  catch {}
}

function loadPushedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(PUSHED_KEY) || '[]')) }
  catch { return new Set() }
}

function savePushedIds(set) {
  try { localStorage.setItem(PUSHED_KEY, JSON.stringify([...set])) }
  catch {}
}

// ── Date helpers ──────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function isInvoiceOverdue(inv) {
  if (inv.status === 'paid') return false
  if (!inv.due) return false
  return new Date(inv.due + 'T23:59:59') < new Date()
}

function birthdayDaysUntil(birthdayStr) {
  if (!birthdayStr) return null
  const [month, day] = birthdayStr.split('-').map(Number)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const thisYear = new Date(today.getFullYear(), month - 1, day)
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1)
  return Math.round((thisYear - today) / (1000 * 60 * 60 * 24))
}

// ── VAPID key helper ──────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// ── Request push permission + subscribe ───────────────────────
async function subscribeToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const reg          = await navigator.serviceWorker.ready
    const existing     = await reg.pushManager.getSubscription()
    if (existing) return existing

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
    })
    return subscription
  } catch (err) {
    console.warn('Push subscription failed:', err)
    return null
  }
}

// ── Send a local push notification via SW ────────────────────
async function sendLocalPush(title, body, icon = '/icons/icon192.png') {
  try {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon,
      badge: '/icons/icon192.png',
      vibrate: [200, 100, 200],
      tag:  title, // prevents duplicate popups for same alert
    })
  } catch (err) {
    console.warn('showNotification failed:', err)
  }
}

// ─────────────────────────────────────────────────────────────

const NotificationContext = createContext({
  notifications:       [],
  unreadCount:         0,
  pushEnabled:         false,
  markRead:            () => {},
  markAllRead:         () => {},
  requestPushPermission: async () => {},
})

export function NotificationProvider({ children }) {
  const { allOrders }   = useOrders()
  const { allInvoices } = useInvoices()
  const { tasks }       = useTasks()
  const { upcoming: upcomingAppts } = useAppointments()
  const { customers }   = useCustomers()
  const { reviews }     = useReviews()

  const [readIds,     setReadIds]     = useState(() => loadReadIds())
  const [pushedIds,   setPushedIds]   = useState(() => loadPushedIds())
  const [pushEnabled, setPushEnabled] = useState(false)

  // Persist whenever readIds / pushedIds change
  useEffect(() => { saveReadIds(readIds)   }, [readIds])
  useEffect(() => { savePushedIds(pushedIds) }, [pushedIds])

  // ── Auto-request push permission once on mount ────────────
  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      setPushEnabled(true)
      return
    }
  }, [])

  // ── Build notifications from live data ────────────────────
  const notifications = useMemo(() => {
    const list = []

    // ── Orders: overdue ──
    allOrders
      .filter(o => !['completed', 'delivered', 'cancelled'].includes(o.status))
      .forEach(o => {
        const diff = daysUntil(o.dueDate)
        if (diff === null) return
        if (diff < 0) {
          list.push({
            id:    `order-overdue-${o.id}`,
            type:  'order',
            icon:  '✂️',
            title: `Overdue: ${o.desc || 'Order'}`,
            body:  `${o.customerName ? `${o.customerName} · ` : ''}${Math.abs(diff)}d past due date.`,
            time:  o.dueDate,
            sortKey: 0,
          })
        } else if (diff <= 3) {
          list.push({
            id:    `order-due-${o.id}`,
            type:  'order',
            icon:  '✂️',
            title: `Order due ${diff === 0 ? 'today' : `in ${diff}d`}: ${o.desc || 'Order'}`,
            body:  `${o.customerName ? `${o.customerName} · ` : ''}Due ${o.dueDate}.`,
            time:  o.dueDate,
            sortKey: 1,
          })
        }
      })

    // ── Invoices: overdue ──
    allInvoices.filter(isInvoiceOverdue).forEach(inv => {
      list.push({
        id:    `invoice-overdue-${inv.id}`,
        type:  'invoice',
        icon:  '🧾',
        title: `Overdue invoice: ${inv.number || 'Invoice'}`,
        body:  `${inv.customerName ? `${inv.customerName} · ` : ''}${inv.orderDesc || ''} — payment past due.`,
        time:  inv.due,
        sortKey: 0,
      })
    })

    // ── Invoices: unpaid (not overdue) ──
    allInvoices
      .filter(i => i.status !== 'paid' && !isInvoiceOverdue(i))
      .slice(0, 5)
      .forEach(inv => {
        list.push({
          id:    `invoice-unpaid-${inv.id}`,
          type:  'invoice',
          icon:  '🧾',
          title: `Unpaid: ${inv.number || 'Invoice'}`,
          body:  `${inv.orderDesc || 'Order'} — awaiting payment.`,
          time:  inv.date,
          sortKey: 2,
        })
      })

    // ── Tasks: overdue ──
    tasks
      .filter(t => !t.done && t.dueDate && new Date(t.dueDate + 'T23:59:59') < new Date())
      .forEach(t => {
        list.push({
          id:    `task-overdue-${t.id}`,
          type:  'task',
          icon:  '📋',
          title: `Overdue task: ${t.desc}`,
          body:  `${t.customerName ? `${t.customerName} · ` : ''}This task is past its due date.`,
          time:  t.dueDate,
          sortKey: 0,
        })
      })

    // ── Tasks: due soon (≤ 2 days) ──
    tasks
      .filter(t => !t.done && t.dueDate)
      .forEach(t => {
        const diff = daysUntil(t.dueDate)
        if (diff !== null && diff >= 0 && diff <= 2) {
          list.push({
            id:    `task-due-${t.id}`,
            type:  'task',
            icon:  '📋',
            title: `Task due ${diff === 0 ? 'today' : `in ${diff}d`}: ${t.desc}`,
            body:  t.customerName ? `For ${t.customerName}` : 'Tap to view details.',
            time:  t.dueDate,
            sortKey: 1,
          })
        }
      })

    // ── Appointments: upcoming (≤ 2 days) ──
    upcomingAppts.forEach(appt => {
      const diff = daysUntil(appt.date)
      if (diff !== null && diff >= 0 && diff <= 2) {
        list.push({
          id:    `appt-${appt.id}`,
          type:  'appointment',
          icon:  '📅',
          title: `Appointment ${diff === 0 ? 'today' : `in ${diff}d`}: ${appt.title || appt.type || 'Appointment'}`,
          body:  `${appt.customerName ? `${appt.customerName} · ` : ''}${appt.time ? `at ${appt.time}` : appt.date}`,
          time:  appt.date,
          sortKey: 1,
        })
      }
    })

    // ── Birthdays: within 7 days ──
    customers.forEach(c => {
      if (!c.birthday) return
      const diff = birthdayDaysUntil(c.birthday)
      if (diff !== null && diff >= 0 && diff <= 7) {
        list.push({
          id:    `birthday-${c.id}`,
          type:  'birthday',
          icon:  '🎂',
          title: diff === 0 ? `🎉 Today is ${c.name}'s birthday!` : `Upcoming birthday: ${c.name}`,
          body:  diff === 0 ? `Don't forget to wish them well!` : `Birthday in ${diff} day${diff !== 1 ? 's' : ''}.`,
          time:  c.birthday,
          sortKey: diff === 0 ? 0 : 2,
        })
      }
    })

    // ── Pending reviews — awaiting tailor approval ──
    reviews
      .filter(r => r.status === 'pending')
      .forEach(r => {
        list.push({
          id:      `review-pending-${r.id}`,
          type:    'review',
          icon:    '⭐',
          title:   `New review from ${r.customerName || 'a customer'}`,
          body:    `${r.rating ? `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} · ` : ''}Tap to approve or reject.`,
          time:    r.createdAt?.toDate?.().toISOString?.() ?? null,
          sortKey: 0,
          reviewId: r.id,
        })
      })

    // Sort: overdue/today first, then by date
    list.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
      if (a.time && b.time) return a.time.localeCompare(b.time)
      return 0
    })

    return list.map(n => ({ ...n, unread: !readIds.has(n.id) }))
  }, [allOrders, allInvoices, tasks, upcomingAppts, customers, reviews, readIds])

  // ── Fire push notifications for new items ─────────────────
  const isFirstRun = useRef(true)
  useEffect(() => {
    // Skip on first mount — don't blast all existing notifications
    if (isFirstRun.current) { isFirstRun.current = false; return }
    if (!pushEnabled) return

    notifications.forEach(n => {
      if (pushedIds.has(n.id)) return   // already pushed this one
      sendLocalPush(n.title, n.body)
      setPushedIds(prev => {
        const next = new Set(prev)
        next.add(n.id)
        return next
      })
    })
  }, [notifications, pushEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = notifications.filter(n => n.unread).length

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)))
  }

  // ── Called from UI (e.g. a "Enable Notifications" button) ─
  const requestPushPermission = async () => {
    const sub = await subscribeToPush()
    if (sub) setPushEnabled(true)
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      pushEnabled,
      markRead,
      markAllRead,
      requestPushPermission,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}