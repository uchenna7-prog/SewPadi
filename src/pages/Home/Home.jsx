import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SkeletonTheme } from 'react-loading-skeleton'
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
import { ORDER_STAGES } from '../../datas/orderDatas'
import { TASK_STATUS_STYLES, TASK_CATEGORY_ICONS } from '../../datas/taskDatas'
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_TYPE_ICONS } from '../../datas/appointmentDatas'
import { 
  getGreeting, getGreetingEmoji, getRandomSubtext,formatUpdatedTime,
  isTaskOverdue,formatDate,formatDateShort,formatApptDate,dueThisWeek,
  isDateInLastMonth,formatNairaCompact,getWindowStart,getPrevWindowStart,
  periodLabel,getDisplayName,loadRevenueGoal,loadNotificationDismissed
} from './utils'
import { 
  REVENUE_GOAL_STORAGE_KEY,NOTIFICATION_DISMISSED_KEY,
  SUBTEXTS
 } from './datas'
import { NotificationBanner } from './components/NotificationBanner/NotificationBanner'
import { CustomerInsightsCard } from './components/CustomerInsightsCard/CustomerInsightsCard'
import { RevenueDonut } from './components/RevenueDonut/RevenueDonut'
import { RevenueGoalModal } from './components/RevenueGoalModal/RevenueGoalModal'
import { SkeletonPage } from './components/SkeletonPage/SkeletonPage'
import { StatCard } from './components/StatCard/StatCard'
import { StatusPill } from './components/StatusPill/StatusPill'
import { UrgentStrip } from './components/UrgentStrip/UrgentStrip'
import { RevenueGoalCard } from './components/RevenueGoalCard/RevenueGoalCard'
import { EmptyRevenueCard } from './components/EmptyRevenueCard/EmptyRevenueCard'
import { RecentTasksSection } from './components/RecentTasksSection/RecentTasksSection'
import { PastAppointmentsSection } from './components/PastAppointmentsSection/PastAppointmentsSection'
import { UpcomingAppointmentsSection } from './components/UpcomingAppointmentsSection/UpcomingAppointmentsSection'
import { QuickActionsSection } from './components/QuickActionsSection/QuickActionsSection'
import { RecentOrdersSection } from './components/RecentOrdersSection/RecentOrdersSection'
import Header from '../../components/Header/Header'
import BottomNav from '../../components/BottomNav/BottomNav'
import OrderMosaic from '../../components/OrderMosaic/OrderMosaic'
import OrderDetailModal from '../../components/OrderDetailModal/OrderDetailModal'
import styles from './Home.module.css'




function useLoadingState({ 
  loadingCustomers, 
  loadingTasks, 
  customers, 
  allOrders, 
  allInvoices, 
  allPayments, 
  upcoming, 
  recentAppts, 
  missedCount 
}) {
  const noCustomersYet   = !loadingCustomers && customers.length === 0
  const ordersSettled    = allOrders.length    > 0 || noCustomersYet
  const invoicesSettled  = allInvoices.length  > 0 || noCustomersYet
  const paymentsSettled  = allPayments.length  > 0 || noCustomersYet
  const apptsSettled     = upcoming.length > 0 || recentAppts.length > 0 || missedCount > 0 || (!loadingCustomers && !loadingTasks)

  const allSettled = !loadingCustomers && !loadingTasks && ordersSettled && invoicesSettled && paymentsSettled && apptsSettled

  const hasEverSettledRef = useRef(false)

  if (allSettled) hasEverSettledRef.current = true

  return !hasEverSettledRef.current
}


function useInvoiceDueDate(generalSettings) {

  return function getInvoiceDueDate(invoice) {

    const explicitDue = invoice.due || invoice.dueDate || invoice.due_date || invoice.dueOn
    if (explicitDue) return explicitDue

    const createdAt = invoice.createdAt
    if (!createdAt) return null

    let timestampMs = null
    if (typeof createdAt.toMillis === 'function') timestampMs = createdAt.toMillis()
    else if (typeof createdAt.toDate === 'function') timestampMs = createdAt.toDate().getTime()
    else if (typeof createdAt.seconds === 'number') timestampMs = createdAt.seconds * 1000
    else if (typeof createdAt === 'number') timestampMs = createdAt
    else if (typeof createdAt === 'string') timestampMs = new Date(createdAt).getTime()
    else if (createdAt instanceof Date) timestampMs = createdAt.getTime()

    if (!timestampMs || isNaN(timestampMs)) return null

    const dueDays = generalSettings.invoiceDueDays ?? 7
    return new Date(timestampMs + dueDays * 86_400_000).toISOString().slice(0, 10)
  }
}



function Home({ onMenuClick, onGoToCustomer }) {

  const navigate = useNavigate()
  const { user } = useAuth()
  const { customers, loading: loadingCustomers } = useCustomers()
  const { allOrders } = useOrders()
  const { tasks, loading: loadingTasks } = useTasks()
  const { allInvoices } = useInvoices()
  const { upcoming, todayAppointments, recent: recentAppts, missedCount, upcomingThisWeek } = useAppointments()
  const { pushEnabled, requestPushPermission } = useNotifications()
  const { generalSettings } = useGeneralSettings()
  const { allPayments } = usePayments()
  const { drafts } = useAutonomousAgent()

  const isLoading = useLoadingState({
    loadingCustomers, loadingTasks, customers,
    allOrders, allInvoices, allPayments,
    upcoming, recentAppts, missedCount,
  })

  const [isBannerDismissed, setIsBannerDismissed] = useState(loadNotificationDismissed)
  const [revenueGoal, setRevenueGoal] = useState(loadRevenueGoal)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const greetingTextRef  = useRef(getGreeting())
  const greetingEmojiRef = useRef(getGreetingEmoji())
  const subtitleTextRef  = useRef(getRandomSubtext())
  const lastUpdatedRef  = useRef(new Date())

  const displayName = getDisplayName(user)
  const agentDraftCount = drafts.length
  const showBanner = !pushEnabled && !isBannerDismissed && 'Notification' in window && Notification.permission !== 'denied'

  const now = new Date()
  const todayStr  = now.toISOString().slice(0, 10)
  const oneWeekAgo  = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)

  const getInvoiceDueDate = useInvoiceDueDate(generalSettings)

  function isInvoiceOverdue(invoice) {

    if (invoice.status === 'paid') return false
    const dueDate = getInvoiceDueDate(invoice)
    if (!dueDate) return false
    return new Date(`${dueDate}T23:59:59`) < new Date()
  }

  const totalCustomers = customers.length
  const newCustomersThisMonth = customers.filter(customer => {

    if (!customer.date) return false
    const date = new Date(customer.date)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  const topCustomer = (() => {
    if (!customers.length) return { 
      name: '—', 
      orderCount: 0, 
      totalSpend: 0 
    }

    const orderCountById = {}
    const totalSpendById = {}

    allOrders.forEach(order => {

      if (!order.customerId) return
      orderCountById[order.customerId] = (orderCountById[order.customerId] || 0) + 1
      totalSpendById[order.customerId] = (totalSpendById[order.customerId] || 0) + (Number(order.price) || 0)
    })

    let topCustomerId  = null
    let highestOrders  = 0

    Object.entries(orderCountById).forEach(([id, count]) => {
      if (count > highestOrders) { 
        highestOrders = count; 
        topCustomerId = id 
      }
    })

    const topCustomerData = topCustomerId
      ? customers.find(customer => customer.id === topCustomerId)
      : customers[0]

    if (!topCustomerData) return { 
      name: '—', 
      orderCount: 0, totalSpend: 0 
    }

    return {
      name: topCustomerData.name || `${topCustomerData.firstName ?? ''} ${topCustomerData.lastName ?? ''}`.trim() || '—',
      orderCount: orderCountById[topCustomerData.id] || 0,
      totalSpend: totalSpendById[topCustomerData.id] || 0,
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


  const activeOrders = allOrders.filter(order => !['completed', 'delivered', 'cancelled'].includes(order.status))
  const activeOrdersDueToday = activeOrders.filter(order => (order.dueDate || order.dueRaw) === todayStr).length
  const activeOrdersDueThisWeek = activeOrders.filter(order => dueThisWeek(order.dueDate || order.dueRaw)).length
  const ordersCreatedThisWeek = allOrders.filter(order => order.createdAt && new Date(order.createdAt) >= oneWeekAgo).length


  const overdueInvoices = allInvoices.filter(isInvoiceOverdue)
  const unpaidInvoices = allInvoices.filter(invoice => invoice.status !== 'paid' && !isInvoiceOverdue(invoice))
  const zeroPaymentInvoices = allInvoices.filter(invoice => invoice.status === 'unpaid')
  const overdueCount = overdueInvoices.length
  const zeroPaymentDueToday = zeroPaymentInvoices.filter(invoice => getInvoiceDueDate(invoice) === todayStr).length
  const zeroPaymentDueThisWeek = zeroPaymentInvoices.filter(invoice => dueThisWeek(getInvoiceDueDate(invoice))).length

  
  const pendingTasks = tasks.filter(task => !task.done && !isTaskOverdue(task))
  const overdueTasks = tasks.filter(task => isTaskOverdue(task))
  const tasksDueToday = pendingTasks.filter(task => task.dueDate === todayStr).length
  const tasksDueThisWeek = pendingTasks.filter(task => dueThisWeek(task.dueDate)).length
  const tasksCreatedThisWeek = tasks.filter(task => task.createdAt && new Date(task.createdAt) >= oneWeekAgo).length


  const todayAppointmentCount = todayAppointments.length
  const appointmentsThisWeek = upcoming.filter(appointment => dueThisWeek(appointment.date)).length


  function sumPaymentsInRange(fromDate, toDate = null) {

    if (!revenueGoal) return 0
    return allPayments
      .flatMap(payment => (payment.installments || []).filter(installment => {

        const dateStr = installment.date || payment.date
        if (!dateStr) return false
        const date = new Date(dateStr)
        if (date < fromDate) return false
        if (toDate && date >= toDate) return false
        return true
      }))
      .reduce((sum, installment) => sum + (Number(installment.amount) || 0), 0)
  }

  const currentPeriodStart = revenueGoal ? getWindowStart(revenueGoal.period) : null
  const previousPeriodStart = revenueGoal ? getPrevWindowStart(revenueGoal.period) : null

  const revenueThisPeriod = revenueGoal ? sumPaymentsInRange(currentPeriodStart) : 0
  const revenueLastPeriod = revenueGoal ? sumPaymentsInRange(previousPeriodStart, currentPeriodStart) : 0
  const revenueGoalPercent = revenueGoal?.goal > 0 ? Math.min(Math.round((revenueThisPeriod / revenueGoal.goal) * 100), 100) : 0
  const revenueDelta = revenueThisPeriod - revenueLastPeriod
  const isRevenueUp = revenueDelta >= 0

 

  const urgentItems = []

  const soonAppointment = upcoming.find(appointment => {

    if (!appointment.date || !appointment.time || appointment.date !== todayStr) return false
    const [hours, minutes] = appointment.time.split(':').map(Number)
    const apptTime = new Date(); apptTime.setHours(hours, minutes, 0, 0)
    const msUntilAppt = apptTime - Date.now()
    return msUntilAppt > 0 && msUntilAppt < 2 * 60 * 60 * 1000 // within 2 hours
  })

  if (soonAppointment) {

    const [hours, minutes] = soonAppointment.time.split(':').map(Number)
    const apptTime = new Date(); apptTime.setHours(hours, minutes, 0, 0)
    const minsLeft = Math.round((apptTime - Date.now()) / 60_000)
    const customerSuffix = soonAppointment.customerName ? ` · ${soonAppointment.customerName}` : ''
    urgentItems.push({
      icon: APPOINTMENT_TYPE_ICONS[soonAppointment.type] || 'event',
      text: `Appointment in ${minsLeft} min${minsLeft !== 1 ? 's' : ''}${customerSuffix}`,
      route: '/appointments',
    })
  }

  if (overdueTasks.length > 0) urgentItems.push({
    icon: 'assignment_late',
    text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
    route: '/tasks',
  })

  if (activeOrdersDueToday > 0) urgentItems.push({
    icon: 'local_shipping',
    text: `${activeOrdersDueToday} order${activeOrdersDueToday > 1 ? 's' : ''} due today`,
    route: '/orders',
  })

  if (overdueCount > 0) urgentItems.push({
    icon: 'receipt_long',
    text: `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''}`,
    route: '/invoices',
  })



  const orderStatSub = (() => {

    if (activeOrders.length === 0) return { 
        text: 'All orders sent',            
        color: '#22c55e' 
    }

    if (activeOrdersDueToday > 0) return { 
      text: `${activeOrdersDueToday} due today`,    
      color: '#ef4444' 
    }

    if (activeOrdersDueThisWeek > 0) return { 
      text: `${activeOrdersDueThisWeek} due this wk`, 
      color: '#fb923c' 
    }

    if (ordersCreatedThisWeek > 0) return { 
      text: `${ordersCreatedThisWeek} new this wk`,   
      color: '#818cf8' 
    }

    return null
  })()

  const invoiceStatSub = (() => {

    if (zeroPaymentInvoices.length === 0) return { 
      text: 'Fully paid up',                
      color: '#22c55e' 
    }

    if (zeroPaymentDueToday > 0) return { 
      text: `${zeroPaymentDueToday} due today`,   
      color: '#ef4444' 
    }

    if (zeroPaymentDueThisWeek > 0) return { 
      text: `${zeroPaymentDueThisWeek} due this wk`, 
      color: '#fb923c' 
    }

    if (overdueCount > 0) return { 
      text: `${overdueCount} overdue`,        
      color: '#ef4444' 
    }

    return { 
      text: `${zeroPaymentInvoices.length} pending`, 
      color: '#fb923c' 
    }
    
    return null
  })()

  const appointmentStatSub = (() => {

    if (todayAppointmentCount > 0) return { 
      text: `${todayAppointmentCount} today`,  
      color: '#06b6d4' 
    }

    if (missedCount > 0) return { 
      text: `${missedCount} missed`,            
      color: '#ef4444' 
    }

    if (upcomingThisWeek > 0) return { 
      text: `${upcomingThisWeek} this wk`,     
      color: '#818cf8' 
    }

    return { 
      text: 'Clear schedule', 
      color: '#22c55e' 
    }

    return null
  })()

  const taskStatSub = (() => {

    if (pendingTasks.length === 0 && overdueTasks.length === 0) return { 
      text: '+ New task',                         
      color: '#22c55e' 
    }

    if (overdueTasks.length > 0) return { 
      text: `${overdueTasks.length} overdue`,                         
      color: '#ef4444' 
    }

    if (tasksDueToday > 0) return { 
      text: `${tasksDueToday} due today`,                             
      color: '#ef4444' 
    }

    if (tasksDueThisWeek > 0) return { 
      text: `${tasksDueThisWeek} due this wk`,                         
      color: '#fb923c' 
    }

    if (tasksCreatedThisWeek > 0) return { 
      text: `${tasksCreatedThisWeek} new this wk`,                     
      color: '#818cf8' 
    }

    return null
  })()



  const STAT_CARDS = [
    {
      desktopIcon: 'shopping_bag',
      value: activeOrders.length,
      label: 'Active Orders',
      sub: orderStatSub?.text ?? null,
      subColor: orderStatSub?.color ?? 'var(--text3)',
      route: '/orders',
    },
    {
      desktopIcon: 'receipt_long',
      value: zeroPaymentInvoices.length,
      label: 'Unpaid Invoices',
      sub: invoiceStatSub?.text ?? null,
      subColor: invoiceStatSub?.color ?? 'var(--text3)',
      route: '/invoices',
      tooltip: 'Only invoices with no payment recorded yet.',
    },
    {
      desktopIcon: 'event',
      value: todayAppointmentCount,
      label: "Today's Appts",
      sub: appointmentStatSub?.text ?? null,
      subColor: appointmentStatSub?.color ?? 'var(--text3)',
      route: '/appointments',
    },
    {
      desktopIcon: 'task_alt',
      value: pendingTasks.length,
      label: 'Pending Tasks',
      sub: taskStatSub?.text ?? null,
      subColor: taskStatSub?.color ?? 'var(--text3)',
      route: '/tasks',
    },
  ]


  const recentActiveOrders = activeOrders.slice(0, 3)

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 3)

  const upcomingAppointments = upcoming.slice(0, 3)
  const pastAppointments = recentAppts.slice(0, 3)


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


  
  return (

    <div className={styles.pageWrapper}>

      <Header onMenuClick={onMenuClick} agentPendingCount={agentDraftCount} />

      <main className={styles.main}>

        {isLoading ? (
          <SkeletonTheme baseColor="var(--surface2)" highlightColor="var(--surface)">
            <SkeletonPage />
          </SkeletonTheme>
        ) : (
          <>
            <section className={styles.hero}>

              <p className={styles.welcomeLabel}>
                {greetingTextRef.current}
                <span className={styles.greetingEmoji}>{greetingEmojiRef.current}</span>
              </p>

              <h1 className={styles.title}>{displayName}</h1>
              <p className={styles.subtitle}>{subtitleTextRef.current}</p>

              <p className={styles.updatedAt}>

                <span className="mi" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginRight: '3px' }}>
                  update
                </span>
                Updated at {formatUpdatedTime(lastUpdatedRef.current)}

              </p>

            </section>

            {showBanner && (
              <NotificationBanner
                onEnable={handleEnableNotifications}
                onDismiss={dismissNotificationBanner}
              />
            )}

            <UrgentStrip items={urgentItems} navigate={navigate} />

            <section className={styles.statsGrid}>

              {STAT_CARDS.map((card, index) => (
                <StatCard key={index} card={card} navigate={navigate} />
              ))}

            </section>

            {revenueGoal ? (
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
            )}

          
            <CustomerInsightsCard
              totalCustomers={totalCustomers}
              newThisMonth={newCustomersThisMonth}
              topCustomer={topCustomer}
              topCustomerMeta={topCustomerMeta}
              onNavigate={() => navigate('/customers')}
            />

            {isGoalModalOpen && (
              <RevenueGoalModal
                onSave={handleSaveRevenueGoal}
                onClose={() => setIsGoalModalOpen(false)}
              />
            )}

            {upcomingAppointments.length > 0 && (
              <UpcomingAppointmentsSection
                appointments={upcomingAppointments}
                todayAppointments={todayAppointments}
                onSeeAll={() => navigate('/appointments')}
              />
            )}

            {pastAppointments.length > 0 && (
              <PastAppointmentsSection
                appointments={pastAppointments}
                onSeeAll={() => navigate('/appointments')}
      
              />
            )}
          
            <QuickActionsSection onNavigate={navigate}  />

          
            {recentActiveOrders.length > 0 && (
              <RecentOrdersSection
                orders={recentActiveOrders}
                onSeeAll={() => navigate('/orders')}
                onSelectOrder={setSelectedOrder}
              />
            )}
         
            {recentTasks.length > 0 && (
              <RecentTasksSection
                tasks={recentTasks}
                onSeeAll={() => navigate('/tasks')}
              />
            )}

          
            {selectedOrder && (
              <OrderDetailModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onGoToCustomer={onGoToCustomer}
                noBlur
              />
            )}
          </>
        )}

      </main>

      <BottomNav />

    </div>
  )
}

export default Home











