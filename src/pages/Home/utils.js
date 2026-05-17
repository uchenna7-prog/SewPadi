
import { SUBTEXTS ,NOTIFICATION_DISMISSED_KEY } from "./datas"



export function getGreeting() {

  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

export function getGreetingEmoji() {

  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return '☀️'
  if (hour >= 12 && hour < 17) return '👋'
  if (hour >= 17 && hour < 21) return '🌙'
  return '😴'
}

export function getRandomSubtext() {
  return SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)]
}

export function getDisplayName(user) {

  const fullName = user?.displayName?.trim()
  if (fullName) {
    const parts = fullName.split(/\s+/)
    return parts.length >= 2 ? parts[1] : parts[0]
  }
  return user?.email?.split('@')[0] ?? 'there'
}



export function formatDate(dateStr) {

  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}


export function formatDateShort(dateStr) {

  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

export function formatUpdatedTime(date) {

  if (!date) return
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
}


export function isDateInLastMonth(dateStr) {

  if (!dateStr) return false
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const date = new Date(dateStr)
  return date >= lastMonth && date <= lastMonthEnd
}




export function isTaskOverdue(task) {
  
  if (!task.dueDate || task.done) return false
  return new Date(task.dueDate + 'T23:59:59') < new Date()
}



export function isInvoiceOverdue(inv) {
  if (inv.status === 'paid') return false
  if (!inv.due) return false
  return new Date(inv.due + 'T23:59:59') < new Date()
}



export function formatApptDate(dateStr, timeStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return timeStr ? `${datePart} · ${timeStr}` : datePart
}


export function dueThisWeek(dateStr) {

  if (!dateStr) return false
  const today = new Date(); 
  today.setHours(0, 0, 0, 0)
  const end = new Date(today); 
  end.setDate(today.getDate() + 7)
  const due = new Date(dateStr + 'T00:00:00')
  return due >= today && due <= end
}


export function formatNairaCompact(amount) {
  if (!amount || amount <= 0) return null
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return `₦${amount.toLocaleString()}`
}


export function getWindowStart(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(now.getFullYear(), 0, 1)
}


export function getPrevWindowStart(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return new Date(now.getFullYear() - 1, 0, 1)
}


export function periodLabel(period) {
  if (period === 'weekly')  return 'This week · Revenue'
  if (period === 'monthly') return 'This month · Revenue'
  return 'This year · Revenue'
}


export function loadRevenueGoal() {
  try {
    const raw = localStorage.getItem(REVENUE_GOAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } 
  catch {
    return null
  }
}


export function loadNotificationDismissed() {
  return localStorage.getItem(NOTIFICATION_DISMISSED_KEY) === 'true'
}