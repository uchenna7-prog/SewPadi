import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SkeletonTheme } from 'react-loading-skeleton'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useAuth } from '../../contexts/AuthContext'
import { useCustomers } from '../../contexts/CustomerContext'
import { useOrders } from '../../contexts/OrdersContext'
import { useTasks } from '../../contexts/TaskContext'
import { useInvoices } from '../../contexts/InvoiceContext'
import { useAppointments } from '../../contexts/AppointmentContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useGeneralSettings } from '../../contexts/GeneralSettingsContext'
import { usePayments } from '../../contexts/PaymentContext'
import { useAutonomousAgent } from '../../contexts/AgentContext'
import { APPOINTMENT_TYPE_ICONS } from '../../datas/appointmentDatas'
import {
  getGreeting, getGreetingEmoji, getRandomSubtext, formatUpdatedTime,
  isTaskOverdue, formatDateShort, dueThisWeek,
  isDateInLastMonth, formatNairaCompact, getWindowStart, getPrevWindowStart,
  periodLabel, getDisplayName, loadRevenueGoal, loadNotificationDismissed,
} from './utils'
import {
  REVENUE_GOAL_STORAGE_KEY,
  NOTIFICATION_DISMISSED_KEY,
} from './datas'
import { NotificationBanner }        from './components/NotificationBanner/NotificationBanner'
import { CustomerInsightsCard }       from './components/CustomerInsightsCard/CustomerInsightsCard'
import { RevenueDonut }               from './components/RevenueDonut/RevenueDonut'
import { RevenueGoalModal }           from './components/RevenueGoalModal/RevenueGoalModal'
import { StatCard }                   from './components/StatCard/StatCard'
import { UrgentStrip }                from './components/UrgentStrip/UrgentStrip'
import { RevenueGoalCard }            from './components/RevenueGoalCard/RevenueGoalCard'
import { EmptyRevenueCard }           from './components/EmptyRevenueCard/EmptyRevenueCard'
import { RecentTasksSection }         from './components/RecentTasksSection/RecentTasksSection'
import { PastAppointmentsSection }    from './components/PastAppointmentsSection/PastAppointmentsSection'
import { UpcomingAppointmentsSection } from './components/UpcomingAppointmentsSection/UpcomingAppointmentsSection'
import { QuickActionsSection }        from './components/QuickActionsSection/QuickActionsSection'
import { RecentOrdersSection }        from './components/RecentOrdersSection/RecentOrdersSection'
import Header                         from '../../components/Header/Header'
import BottomNav                      from '../../components/BottomNav/BottomNav'
import OrderDetailModal               from '../../components/OrderDetailModal/OrderDetailModal'
import styles                         from './Home.module.css'


// ─── Skeleton primitives used inline per-section ──────────────────────────────

function StatCardSkeleton() {
  return (
    <div className={styles.statCardSkeleton}>
      <Skeleton width={24} height={24} borderRadius={4} />
      <Skeleton width={48} height={28} borderRadius={5} style={{ marginTop: 12 }} />
      <Skeleton width={72} height={10} borderRadius={4} style={{ marginTop: 8 }} />
      <Skeleton width={56} height={9}  borderRadius={4} style={{ marginTop: 6 }} />
    </div>
  )
}

function CardSkeleton({ height = 88 }) {
  return <Skeleton height={height} borderRadius={10} style={{ marginBottom: 12, display: 'block' }} />
}

function SectionSkeleton() {
  return (
    <div className={styles.sectionSkeleton}>
      <div className={styles.sectionSkeletonHeader}>
        <Skeleton width={140} height={11} borderRadius={4} />
        <Skeleton width={44}  height={11} borderRadius={4} />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className={styles.sectionSkeletonItem}>
          <Skeleton width={80} height={80} borderRadius={12} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Skeleton width="70%" height={13} borderRadius={4} />
            <Skeleton width="50%" height={10} borderRadius={4} />
            <Skeleton width="60%" height={10} borderRadius={4} />
          </div>
        </div>
      ))}
    </div>
  )
}


// ─── Invoice due-date helper ──────────────────────────────────────────────────

function useInvoiceDueDate(generalSettings) {
  return function getInvoiceDueDate(invoice) {
    const explicitDue = invoice.due || invoice.dueDate || invoice.due_date || invoice.dueOn
    if (explicitDue) return explicitDue

    const createdAt = invoice.createdAt
    if (!createdAt) return null

    let timestampMs = null
    if (typeof createdAt.toMillis === 'function')       timestampMs = createdAt.toMillis()
    else if (typeof createdAt.toDate === 'function')    timestampMs = createdAt.toDate().getTime()
    else if (typeof createdAt.seconds === 'number')     timestampMs = createdAt.seconds * 1000
    else if (typeof createdAt === 'number')             timestampMs = createdAt
    else if (typeof createdAt === 'string')             timestampMs = new Date(createdAt).getTime()
    else if (createdAt instanceof Date)                 timestampMs = createdAt.getTime()

    if (!timestampMs || isNaN(timestampMs)) return null

    const dueDays = generalSettings.invoiceDueDays ?? 7
    return new Date(timestampMs + dueDays * 86_400_000).toISOString().slice(0, 10)
  }
}


// ─── Main component ───────────────────────────────────────────────────────────

function Home({ onMenuClick, onGoToCustomer }) {

  const navigate = useNavigate()
  const { user }                          = useAuth()
  const { customers, loading: loadingCustomers } = useCustomers()
  const { allOrders }                     = useOrders()
  const { tasks, loading: loadingTasks }  = useTasks()
  const { allInvoices }                   = useInvoices()
  const { upcoming, todayAppointments, recent: recentAppts, missedCount, upcomingThisWeek } = useAppointments()
  const { pushEnabled, requestPushPermission } = useNotifications()
  const { generalSettings }               = useGeneralSettings()
  const { allPayments }                   = usePayments()
  const { drafts }                        = useAutonomousAgent()

  const [isBannerDismissed, setIsBannerDismissed] = useState(loadNotificationDismissed)
  const [revenueGoal, setRevenueGoal]             = useState(loadRevenueGoal)
  const [isGoalModalOpen, setIsGoalModalOpen]     = useState(false)
  const [selectedOrder, setSelectedOrder]         = useState(null)

  const greetingTextRef  = useRef(getGreeting())
  const greetingEmojiRef = useRef(getGreetingEmoji())
  const subtitleTextRef  = useRef(getRandomSubtext())
  const lastUpdatedRef   = useRef(new Date())

  const getInvoiceDueDate = useInvoiceDueDate(generalSettings)

  // ── Derived loading states per section ──────────────────────────────────────
  // Each section decides independently whether it is still waiting for its data.
  // Nothing blocks the hero or stats from rendering immediately.

  const customersReady     = !loadingCustomers
  const ordersReady        = customersReady   // orders arrive quickly after customers
  const tasksReady         = !loadingTasks
  const invoicesReady      = customersReady
  const paymentsReady      = allPayments.length > 0 || customersReady
  const appointmentsReady  = customersReady

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const displayName      = getDisplayName(user)
  const agentDraftCount  = drafts.length
  const showBanner       = !pushEnabled && !isBannerDismissed && 'Notification' in window && Notification.permission !== 'denied'

  const now         = new Date()
  const todayStr    = now.toISOString().slice(0, 10)

  function isInvoiceOverdue(invoice) {
    if (invoice.status === 'paid') return false
    const dueDate = getInvoiceDueDate(invoice)
    if (!dueDate) return false
    return new Date(`${dueDate}T23:59:59`) < new Date()
  }

  // ── Customer stats ───────────────────────────────────────────────────────────

  const totalCustomers = customers.length

  const newCustomersThisMonth = customers.filter(customer => {
    if (!customer.date) return false
    const date = new Date(customer.date)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  const topCustomer = (() => {
    if (!customers.length) return { name: '—', orderCount: 0, totalSpend: 0 }

    const orderCountById = {}
    const totalSpendById = {}

    allOrders.forEach(order => {
      if (!order.customerId) return
      orderCountById[order.customerId] = (orderCountById[order.customerId] || 0) + 1
      totalSpendById[order.customerId] = (totalSpendById[order.customerId] || 0) + (Number(order.price) || 0)
    })

    let topId    = null
    let topCount = 0

    Object.entries(orderCountById).forEach(([id, count]) => {
      if (count > topCount) { topCount = count; topId = id }
    })

    const topData = topId
      ? customers.find(c => c.id === topId)
      : customers[0]

    if (!topData) return { name: '—', orderCount: 0, totalSpend: 0 }

    return {
      name:       topData.name || `${topData.firstName ?? ''} ${topData.lastName ?? ''}`.trim() || '—',
      orderCount: orderCountById[topData.id] || 0,
      totalSpend: totalSpendById[topData.id] || 0,
    }
  })()

  const topCustomerMeta = (() => {
    const { orderCount, totalSpend } = topCustomer
    if (!orderCount) return null
    const parts = []
    const spendLabel = formatNairaCompact(totalSpend)
    if (spendLabel) parts.push(spendLabel)
    parts.push(`${orderCount} order${orderCount !== 1 ? 's' : ''}`)
    return parts.join(' • ')
  })()

  // ── Order stats ──────────────────────────────────────────────────────────────

  const activeOrders           = allOrders.filter(o => !['completed', 'delivered', 'cancelled'].includes(o.status))
  const activeOrdersDueToday   = activeOrders.filter(o => (o.dueDate || o.dueRaw) === todayStr).length
  const activeOrdersDueThisWeek = activeOrders.filter(o => dueThisWeek(o.dueDate || o.dueRaw)).length
  const ordersCreatedThisWeek  = allOrders.filter(o => {
    const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
    return o.createdAt && new Date(o.createdAt) >= oneWeekAgo
  }).length

  // ── Invoice stats ────────────────────────────────────────────────────────────

  const overdueInvoices        = allInvoices.filter(isInvoiceOverdue)
  const zeroPaymentInvoices    = allInvoices.filter(i => i.status === 'unpaid')
  const overdueCount           = overdueInvoices.length
  const zeroPaymentDueToday    = zeroPaymentInvoices.filter(i => getInvoiceDueDate(i) === todayStr).length
  const zeroPaymentDueThisWeek = zeroPaymentInvoices.filter(i => dueThisWeek(getInvoiceDueDate(i))).length

  // ── Task stats ───────────────────────────────────────────────────────────────

  const pendingTasks       = tasks.filter(t => !t.done && !isTaskOverdue(t))
  const overdueTasks       = tasks.filter(t => isTaskOverdue(t))
  const tasksDueToday      = pendingTasks.filter(t => t.dueDate === todayStr).length
  const tasksDueThisWeek   = pendingTasks.filter(t => dueThisWeek(t.dueDate)).length
  const tasksCreatedThisWeek = tasks.filter(t => {
    const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
    return t.createdAt && new Date(t.createdAt) >= oneWeekAgo
  }).length

  // ── Appointment stats ────────────────────────────────────────────────────────

  const todayAppointmentCount = todayAppointments.length
  const appointmentsThisWeek  = upcomingThisWeek

  // ── Revenue stats ────────────────────────────────────────────────────────────

  function sumPaymentsInRange(fromDate, toDate = null) {
    if (!revenueGoal) return 0
    return allPayments
      .flatMap(p => (p.installments || []).filter(inst => {
        const dateStr = inst.date || p.date
        if (!dateStr) return false
        const date = new Date(dateStr)
        if (date < fromDate) return false
        if (toDate && date >= toDate) return false
        return true
      }))
      .reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0)
  }

  const currentPeriodStart  = revenueGoal ? getWindowStart(revenueGoal.period)    : null
  const previousPeriodStart = revenueGoal ? getPrevWindowStart(revenueGoal.period) : null
  const revenueThisPeriod   = revenueGoal ? sumPaymentsInRange(currentPeriodStart) : 0
  const revenueLastPeriod   = revenueGoal ? sumPaymentsInRange(previousPeriodStart, currentPeriodStart) : 0
  const revenueGoalPercent  = revenueGoal?.goal > 0 ? Math.min(Math.round((revenueThisPeriod / revenueGoal.goal) * 100), 100) : 0
  const revenueDelta        = revenueThisPeriod - revenueLastPeriod
  const isRevenueUp         = revenueDelta >= 0

  // ── Urgent strip ─────────────────────────────────────────────────────────────

  const urgentItems = []

  const soonAppointment = upcoming.find(appt => {
    if (!appt.date || !appt.time || appt.date !== todayStr) return false
    const [h, m]    = appt.time.split(':').map(Number)
    const apptTime  = new Date(); apptTime.setHours(h, m, 0, 0)
    const msUntil   = apptTime - Date.now()
    return msUntil > 0 && msUntil < 2 * 60 * 60 * 1000
  })

  if (soonAppointment) {
    const [h, m]   = soonAppointment.time.split(':').map(Number)
    const apptTime = new Date(); apptTime.setHours(h, m, 0, 0)
    const minsLeft = Math.round((apptTime - Date.now()) / 60_000)
    const suffix   = soonAppointment.customerName ? ` · ${soonAppointment.customerName}` : ''
    urgentItems.push({
      icon:  APPOINTMENT_TYPE_ICONS[soonAppointment.type] || 'event',
      text:  `Appointment in ${minsLeft} min${minsLeft !== 1 ? 's' : ''}${suffix}`,
      route: '/appointments',
    })
  }

  if (overdueTasks.length > 0)      urgentItems.push({ icon: 'assignment_late', text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,     route: '/tasks' })
  if (activeOrdersDueToday > 0)     urgentItems.push({ icon: 'local_shipping',  text: `${activeOrdersDueToday} order${activeOrdersDueToday > 1 ? 's' : ''} due today`, route: '/orders' })
  if (overdueCount > 0)             urgentItems.push({ icon: 'receipt_long',    text: `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''}`,                 route: '/invoices' })

  // ── Stat card sub-labels ─────────────────────────────────────────────────────

  const orderStatSub = (() => {
    if (activeOrders.length === 0)       return { text: 'All orders sent',            color: '#22c55e' }
    if (activeOrdersDueToday > 0)        return { text: `${activeOrdersDueToday} due today`,    color: '#ef4444' }
    if (activeOrdersDueThisWeek > 0)     return { text: `${activeOrdersDueThisWeek} due this wk`, color: '#fb923c' }
    if (ordersCreatedThisWeek > 0)       return { text: `${ordersCreatedThisWeek} new this wk`,   color: '#818cf8' }
    return null
  })()

  const invoiceStatSub = (() => {
    if (zeroPaymentInvoices.length === 0) return { text: 'Fully paid up',              color: '#22c55e' }
    if (zeroPaymentDueToday > 0)          return { text: `${zeroPaymentDueToday} due today`,  color: '#ef4444' }
    if (zeroPaymentDueThisWeek > 0)       return { text: `${zeroPaymentDueThisWeek} due this wk`, color: '#fb923c' }
    if (overdueCount > 0)                 return { text: `${overdueCount} overdue`,      color: '#ef4444' }
    return { text: `${zeroPaymentInvoices.length} pending`, color: '#fb923c' }
  })()

  const appointmentStatSub = (() => {
    if (todayAppointmentCount > 0) return { text: `${todayAppointmentCount} today`, color: '#06b6d4' }
    if (missedCount > 0)           return { text: `${missedCount} missed`,          color: '#ef4444' }
    if (upcomingThisWeek > 0)      return { text: `${upcomingThisWeek} this wk`,   color: '#818cf8' }
    return { text: 'Clear schedule', color: '#22c55e' }
  })()

  const taskStatSub = (() => {
    if (pendingTasks.length === 0 && overdueTasks.length === 0) return { text: '+ New task',                   color: '#22c55e' }
    if (overdueTasks.length > 0)    return { text: `${overdueTasks.length} overdue`,      color: '#ef4444' }
    if (tasksDueToday > 0)          return { text: `${tasksDueToday} due today`,           color: '#ef4444' }
    if (tasksDueThisWeek > 0)       return { text: `${tasksDueThisWeek} due this wk`,     color: '#fb923c' }
    if (tasksCreatedThisWeek > 0)   return { text: `${tasksCreatedThisWeek} new this wk`, color: '#818cf8' }
    return null
  })()

  const STAT_CARDS = [
    {
      desktopIcon: 'shopping_bag',
      value:       activeOrders.length,
      label:       'Active Orders',
      sub:         orderStatSub?.text    ?? null,
      subColor:    orderStatSub?.color   ?? 'var(--text3)',
      route:       '/orders',
    },
    {
      desktopIcon: 'receipt_long',
      value:       zeroPaymentInvoices.length,
      label:       'Unpaid Invoices',
      sub:         invoiceStatSub?.text  ?? null,
      subColor:    invoiceStatSub?.color ?? 'var(--text3)',
      route:       '/invoices',
      tooltip:     'Only invoices with no payment recorded yet.',
    },
    {
      desktopIcon: 'event',
      value:       todayAppointmentCount,
      label:       "Today's Appts",
      sub:         appointmentStatSub?.text  ?? null,
      subColor:    appointmentStatSub?.color ?? 'var(--text3)',
      route:       '/appointments',
    },
    {
      desktopIcon: 'task_alt',
      value:       pendingTasks.length,
      label:       'Pending Tasks',
      sub:         taskStatSub?.text  ?? null,
      subColor:    taskStatSub?.color ?? 'var(--text3)',
      route:       '/tasks',
    },
  ]

  // ── Section data ─────────────────────────────────────────────────────────────

  const recentActiveOrders    = activeOrders.slice(0, 3)
  const recentTasks           = [...tasks].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 3)
  const upcomingAppointments  = upcoming.slice(0, 3)
  const pastAppointments      = recentAppts.slice(0, 3)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleSaveRevenueGoal(goalData) {
    setRevenueGoal(goalData)
    localStorage.setItem(REVENUE_GOAL_STORAGE_KEY, JSON.stringify(goalData))
    setIsGoalModalOpen(false)
  }

  async function handleEnableNotifications() {
    await requestPushPermission()
    dismissNotificationBanner()
  }

  function dismissNotificationBanner() {
    setIsBannerDismissed(true)
    localStorage.setItem(NOTIFICATION_DISMISSED_KEY, 'true')
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageWrapper}>

      <Header onMenuClick={onMenuClick} agentPendingCount={agentDraftCount} />

      <main className={styles.main}>
        <SkeletonTheme baseColor="var(--surface2)" highlightColor="var(--surface)">

          {/* ── Hero — renders immediately, no data needed ── */}
          <section className={styles.hero}>
            <p className={styles.welcomeLabel}>
              {greetingTextRef.current}
              <span className={styles.greetingEmoji}>{greetingEmojiRef.current}</span>
            </p>
            <h1 className={styles.title}>{displayName}</h1>
            <p className={styles.subtitle}>{subtitleTextRef.current}</p>
            <p className={styles.updatedAt}>
              <span className="mi" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginRight: '3px' }}>update</span>
              Updated at {formatUpdatedTime(lastUpdatedRef.current)}
            </p>
          </section>

          {showBanner && (
            <NotificationBanner
              onEnable={handleEnableNotifications}
              onDismiss={dismissNotificationBanner}
            />
          )}

          {/* ── Urgent strip — waits for tasks + orders ── */}
          {(ordersReady && tasksReady) && (
            <UrgentStrip items={urgentItems} navigate={navigate} />
          )}

          {/* ── Stat cards — each shows its own skeleton ── */}
          <section className={styles.statsGrid}>
            {ordersReady && invoicesReady && appointmentsReady && tasksReady ? (
              STAT_CARDS.map((card, i) => (
                <StatCard key={i} card={card} navigate={navigate} />
              ))
            ) : (
              [0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)
            )}
          </section>

          {/* ── Revenue card — waits only for payments ── */}
          {paymentsReady ? (
            revenueGoal ? (
              <RevenueGoalCard
                goal={revenueGoal}
                earned={revenueThisPeriod}
                goalPercent={revenueGoalPercent}
                delta={revenueDelta}
                isUp={isRevenueUp}
                onOpen={() => setIsGoalModalOpen(true)}
              />
            ) : (
              <EmptyRevenueCard onOpen={() => setIsGoalModalOpen(true)} />
            )
          ) : (
            <CardSkeleton height={100} />
          )}

          {/* ── Customer insights — waits only for customers + orders ── */}
          {customersReady ? (
            <CustomerInsightsCard
              totalCustomers={totalCustomers}
              newThisMonth={newCustomersThisMonth}
              topCustomer={topCustomer}
              topCustomerMeta={topCustomerMeta}
              onNavigate={() => navigate('/customers')}
            />
          ) : (
            <CardSkeleton height={100} />
          )}

          {isGoalModalOpen && (
            <RevenueGoalModal
              onSave={handleSaveRevenueGoal}
              onClose={() => setIsGoalModalOpen(false)}
            />
          )}

          {/* ── Upcoming appointments — waits only for appointments ── */}
          {appointmentsReady ? (
            upcomingAppointments.length > 0 && (
              <UpcomingAppointmentsSection
                appointments={upcomingAppointments}
                todayAppointments={todayAppointments}
                onSeeAll={() => navigate('/appointments')}
              />
            )
          ) : (
            <SectionSkeleton />
          )}

          {/* ── Past appointments ── */}
          {appointmentsReady ? (
            pastAppointments.length > 0 && (
              <PastAppointmentsSection
                appointments={pastAppointments}
                onSeeAll={() => navigate('/appointments')}
              />
            )
          ) : null}

          <QuickActionsSection onNavigate={navigate} />

          {/* ── Recent orders — waits only for orders ── */}
          {ordersReady ? (
            recentActiveOrders.length > 0 && (
              <RecentOrdersSection
                orders={recentActiveOrders}
                onSeeAll={() => navigate('/orders')}
                onSelectOrder={setSelectedOrder}
              />
            )
          ) : (
            <SectionSkeleton />
          )}

          {/* ── Recent tasks — waits only for tasks ── */}
          {tasksReady ? (
            recentTasks.length > 0 && (
              <RecentTasksSection
                tasks={recentTasks}
                onSeeAll={() => navigate('/tasks')}
              />
            )
          ) : (
            <SectionSkeleton />
          )}

          {selectedOrder && (
            <OrderDetailModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onGoToCustomer={onGoToCustomer}
              noBlur
            />
          )}

        </SkeletonTheme>
      </main>

      <BottomNav />
    </div>
  )
}

export default Home
