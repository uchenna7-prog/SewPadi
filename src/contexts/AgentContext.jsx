// src/contexts/AgentContext.jsx
// ─────────────────────────────────────────────────────────────
// Two exports:
//   useAgent            — conversational chat agent (unchanged)
//   useAutonomousAgent  — drives the Done / Upcoming / Drafts tabs
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react'
import { useAuth }            from './AuthContext'
import { useCustomers }       from './CustomerContext'
import { useOrders }          from './OrdersContext'
import { useInvoices }        from './InvoiceContext'
import { usePayments }        from './PaymentContext'
import { useTasks }           from './TaskContext'
import { useAppointments }    from './AppointmentContext'
import { useBrand }           from './BrandContext'
import { useGeneralSettings } from './GeneralSettingsContext'
import { saveAgentMessage, loadAgentMessages, clearAgentMessages } from '../services/agentService'

// ─────────────────────────────────────────────────────────────
// DURATION HELPER
// Convert { amount, unit } → milliseconds
// ─────────────────────────────────────────────────────────────

const UNIT_MS = {
  seconds: 1000,
  minutes: 60_000,
  hours:   3_600_000,
  days:    86_400_000,
  weeks:   604_800_000,
  months:  2_592_000_000,
}

function normaliseDuration(value) {
  if (value && typeof value === 'object' && 'amount' in value && 'unit' in value) {
    return value
  }
  return { amount: 1, unit: 'days' }
}

function toMs(value) {
  const { amount, unit } = normaliseDuration(value)
  return (Number(amount) || 1) * (UNIT_MS[unit] || UNIT_MS.days)
}

function durationLabel(value) {
  const { amount, unit } = normaliseDuration(value)
  const n = Number(amount) || 1
  const singular = { seconds: 'second', minutes: 'minute', hours: 'hour', days: 'day', weeks: 'week', months: 'month' }
  return `${n} ${n === 1 ? singular[unit] : unit}`
}

// ─────────────────────────────────────────────────────────────
// GENERAL HELPERS
// ─────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatCurrency(amount, currency = '₦') {
  if (!amount) return `${currency}0`
  return `${currency}${Number(amount).toLocaleString()}`
}

function parseMoney(str) {
  if (!str) return null
  const cleaned = String(str).replace(/[₦,\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function parseDate(str) {
  if (!str) return null
  const s = str.toLowerCase().trim()
  const today = new Date()

  if (s === 'today') return todayISO()
  if (s === 'tomorrow') {
    const d = new Date(today); d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const nextMatch = s.match(/^next\s+(\w+)/)
  if (nextMatch) {
    const idx = dayNames.indexOf(nextMatch[1])
    if (idx !== -1) {
      const d = new Date(today)
      const diff = (idx - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      return d.toISOString().slice(0, 10)
    }
  }

  const dayIdx = dayNames.indexOf(s)
  if (dayIdx !== -1) {
    const d = new Date(today)
    const diff = (dayIdx - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
  }

  const parsed = new Date(str)
  if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10)
  return null
}

function formatDateNice(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function findCustomer(customers, nameHint) {
  if (!nameHint) return null
  const lower = nameHint.toLowerCase().trim()
  return (
    customers.find(c => c.name?.toLowerCase() === lower) ||
    customers.find(c => c.name?.toLowerCase().includes(lower)) ||
    customers.find(c => lower.includes(c.name?.toLowerCase() || ''))
  )
}

// ─────────────────────────────────────────────────────────────
// INTENT DETECTION
// ─────────────────────────────────────────────────────────────

const INTENTS = [
  { intent: 'add_order',      patterns: [/add.*(order|job)/i, /new.*(order|job)/i, /creat.*(order|job)/i, /take.*order/i, /order for/i] },
  { intent: 'gen_invoice',    patterns: [/generat.*invoice/i, /creat.*invoice/i, /send.*invoice/i, /invoice for/i, /make.*invoice/i] },
  { intent: 'record_payment', patterns: [/paid/i, /record.*pay/i, /payment.*from/i, /just paid/i, /received.*payment/i, /mark.*paid/i] },
  { intent: 'add_task',       patterns: [/add.*task/i, /remind me/i, /creat.*task/i, /new.*task/i, /note to/i] },
  { intent: 'add_appt',       patterns: [/schedul/i, /book.*appt/i, /book.*appointment/i, /set.*appointment/i, /appt.*for/i, /fitting.*for/i] },
  { intent: 'query_customer', patterns: [/how much.*owe/i, /balance.*for/i, /what.*owe/i, /does.*owe/i, /owe.*me/i] },
  { intent: 'query_orders',   patterns: [/orders.*due/i, /what.*due/i, /pending.*order/i, /active.*order/i, /show.*order/i] },
  { intent: 'query_overdue',  patterns: [/overdue/i, /late.*invoice/i, /unpaid/i, /who.*not.*paid/i] },
  { intent: 'query_summary',  patterns: [/summar/i, /how.*doing/i, /today.*status/i, /what.*happening/i, /overview/i, /snapshot/i] },
  { intent: 'update_status',  patterns: [/mark.*as/i, /status.*to/i, /update.*status/i, /set.*status/i, /change.*to/i, /ready/i, /complet/i, /deliver/i] },
  { intent: 'check_measurements', patterns: [/measurement/i, /measure/i, /size.*for/i, /has.*measurement/i] },
]

function detectIntent(text) {
  for (const { intent, patterns } of INTENTS) {
    if (patterns.some(p => p.test(text))) return intent
  }
  return 'unknown'
}

function extractCustomerName(text) {
  const patterns = [
    /(?:for|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:paid|owes|order)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// FLOWS
// ─────────────────────────────────────────────────────────────

const FLOWS = {
  add_order: [
    { key: 'customerName', question: "What's the customer's name?" },
    { key: 'desc',         question: "What are they ordering? (e.g. Agbada and trouser)" },
    { key: 'price',        question: "What's the total price?",
      validate: v => parseMoney(v) !== null, errMsg: "Please enter a valid amount like 45000 or ₦45,000",
      transform: v => parseMoney(v) },
    { key: 'dueDate',      question: "When is it due? (e.g. May 20, next Friday, tomorrow)",
      validate: v => parseDate(v) !== null, errMsg: "I didn't get that date. Try 'May 20' or 'next Friday'",
      transform: v => parseDate(v) },
    { key: 'deposit',      question: "Has the customer paid a deposit? If yes, how much? (or say 'no')" },
    { key: 'hasMeasurements', question: "Do you already have their measurements? (yes / no)" },
  ],
  gen_invoice: [
    { key: 'customerName', question: "Which customer is this invoice for?" },
    { key: 'orderId',      question: null },
  ],
  record_payment: [
    { key: 'customerName', question: "Which customer made the payment?" },
    { key: 'amount',       question: "How much did they pay?",
      validate: v => parseMoney(v) !== null, errMsg: "Please enter a valid amount",
      transform: v => parseMoney(v) },
    { key: 'method',       question: "How did they pay? (cash / transfer / card)" },
    { key: 'orderId',      question: null },
  ],
  add_task: [
    { key: 'desc',    question: "What's the task?" },
    { key: 'dueDate', question: "When is it due? (or say 'no date')",
      transform: v => /no date|none|skip/i.test(v) ? null : parseDate(v) },
    { key: 'customerName', question: "Is this for a specific customer? (name or 'no')",
      transform: v => /^no$/i.test(v.trim()) ? null : v.trim() },
  ],
  add_appt: [
    { key: 'customerName', question: "Who is the appointment for?" },
    { key: 'type',         question: "What type? (fitting / measurement / delivery / consultation / pickup / other)" },
    { key: 'date',         question: "What date?",
      validate: v => parseDate(v) !== null, errMsg: "I didn't get that date. Try 'May 20' or 'next Friday'",
      transform: v => parseDate(v) },
    { key: 'time',         question: "What time? (e.g. 2pm, 14:00)" },
  ],
}

// ─────────────────────────────────────────────────────────────
// AGENT CONTEXT (conversational)
// ─────────────────────────────────────────────────────────────

const AgentContext = createContext(null)

export function AgentProvider({ children }) {
  const { user }          = useAuth()
  const { customers }     = useCustomers()
  const { allOrders, addOrder, updateOrderStatus } = useOrders()
  const { allInvoices }   = useInvoices()
  const { allPayments }   = usePayments()
  const { tasks, addTask } = useTasks()
  const { allAppointments } = useAppointments()
  const { brand }         = useBrand()

  const [messages,   setMessages]   = useState([])
  const [isTyping,   setIsTyping]   = useState(false)
  const [isLoading,  setIsLoading]  = useState(true)
  const [activeFlow, setActiveFlow] = useState(null)

  useEffect(() => {
    if (!user) { setIsLoading(false); return }
    loadAgentMessages(user.uid).then(history => {
      if (history.length > 0) {
        setMessages(history)
      } else {
        const greeting = makeAgentMsg(getGreeting(brand.ownerName || brand.name))
        setMessages([greeting])
      }
      setIsLoading(false)
    })
  }, [user]) // eslint-disable-line

  const persistMsg = useCallback((msg) => {
    if (!user) return
    saveAgentMessage(user.uid, {
      role:    msg.role,
      text:    msg.text,
      meta:    msg.meta    || null,
      actions: msg.actions || null,
    }).catch(console.error)
  }, [user])

  function makeAgentMsg(text, meta = null, actions = null) {
    return { id: Date.now() + Math.random(), role: 'agent', text, meta, actions, time: now() }
  }

  function makeUserMsg(text) {
    return { id: Date.now() + Math.random(), role: 'user', text, time: now() }
  }

  function addMessage(msg) {
    setMessages(prev => [...prev, msg])
    persistMsg(msg)
  }

  async function agentReply(text, meta = null, actions = null, delay = 600) {
    setIsTyping(true)
    await new Promise(r => setTimeout(r, delay))
    setIsTyping(false)
    const msg = makeAgentMsg(text, meta, actions)
    addMessage(msg)
    return msg
  }

  // ── Flow execution ────────────────────────────────────────

  async function startFlow(flowName, initialData = {}) {
    const steps = FLOWS[flowName]
    if (!steps) return

    let stepIdx = 0
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].question && initialData[steps[i].key] !== undefined) stepIdx = i + 1
      else break
    }

    const flow = { name: flowName, stepIdx, data: { ...initialData } }

    while (flow.stepIdx < steps.length && steps[flow.stepIdx].question === null) {
      flow.stepIdx++
    }

    if (flow.stepIdx >= steps.length) { await executeFlow(flow); return }

    setActiveFlow(flow)
    await agentReply(steps[flow.stepIdx].question)
  }

  async function advanceFlow(userText) {
    if (!activeFlow) return false

    const steps = FLOWS[activeFlow.name]
    const step  = steps[activeFlow.stepIdx]

    if (step.validate && !step.validate(userText)) {
      await agentReply(step.errMsg || "I didn't understand that. " + step.question)
      return true
    }

    const value   = step.transform ? step.transform(userText) : userText.trim()
    const newData = { ...activeFlow.data, [step.key]: value }

    let nextIdx = activeFlow.stepIdx + 1
    while (nextIdx < steps.length && steps[nextIdx].question === null) nextIdx++

    if (nextIdx >= steps.length) {
      setActiveFlow(null)
      await executeFlow({ ...activeFlow, data: newData })
    } else {
      setActiveFlow({ ...activeFlow, stepIdx: nextIdx, data: newData })
      await agentReply(steps[nextIdx].question)
    }

    return true
  }

  async function executeFlow(flow) {
    const { name, data } = flow
    switch (name) {
      case 'add_order':       return executeAddOrder(data)
      case 'gen_invoice':     return executeGenInvoice(data)
      case 'record_payment':  return executeRecordPayment(data)
      case 'add_task':        return executeAddTask(data)
      case 'add_appt':        return executeAddAppt(data)
      default: break
    }
  }

  async function executeAddOrder(data) {
    const customer = findCustomer(customers, data.customerName)

    if (!customer) {
      await agentReply(
        `I couldn't find a customer named "${data.customerName}". Do you want me to create them first?`,
        null,
        [
          { label: 'Yes, create customer first', action: 'create_customer', payload: { name: data.customerName, pendingOrder: data } },
          { label: 'Cancel', action: 'cancel' },
        ]
      )
      return
    }

    const hasMeasurements = /yes|yeah|yep|have|got/i.test(data.hasMeasurements || '')
    const depositAmount   = parseMoney(data.deposit)
    const hasDeposit      = depositAmount !== null && depositAmount > 0

    try {
      const orderData = {
        customerId:     customer.id,
        customerName:   customer.name,
        desc:           data.desc,
        price:          data.price,
        totalAmount:    data.price,
        dueDate:        data.dueDate,
        dueRaw:         data.dueDate,
        due:            formatDateNice(data.dueDate),
        status:         'pending',
        stage:          null,
        priority:       'normal',
        items:          [{ name: data.desc, price: data.price, qty: 1 }],
        notes:          '',
        measurementIds: [],
      }

      await addOrder(customer.id, orderData)

      const lines = [
        `✅ Order created for **${customer.name}**`,
        `📦 ${data.desc}`,
        `💰 ${formatCurrency(data.price, brand.invoiceCurrency)}`,
        `📅 Due ${formatDateNice(data.dueDate)}`,
      ]

      const actions = []

      if (!hasMeasurements) {
        lines.push(`📐 No measurements yet — I've added a reminder task`)
        await addTask({
          desc: `Take measurements for ${customer.name}`,
          dueDate: data.dueDate,
          customerName: customer.name,
          customerId: customer.id,
          category: 'sewing',
          done: false,
          priority: 'high',
        })
      }

      if (hasDeposit) {
        lines.push(`💵 Deposit of ${formatCurrency(depositAmount, brand.invoiceCurrency)} noted — record it in Payments`)
      }

      actions.push({ label: 'Generate invoice now', action: 'gen_invoice', payload: { customerName: customer.name } })
      actions.push({ label: 'View order', action: 'navigate', payload: { route: '/orders' } })

      await agentReply(lines.join('\n'), null, actions)
    } catch (err) {
      console.error('[AgentContext] executeAddOrder:', err)
      await agentReply(`Something went wrong creating that order. Please try again.`)
    }
  }

  async function executeGenInvoice(data) {
    const customer = findCustomer(customers, data.customerName)
    if (!customer) { await agentReply(`I couldn't find "${data.customerName}" in your customers.`); return }

    const customerOrders = allOrders.filter(o => o.customerId === customer.id && !['cancelled'].includes(o.status))
    if (!customerOrders.length) { await agentReply(`${customer.name} doesn't have any active orders to invoice.`); return }

    const invoicedOrderIds = allInvoices.filter(i => i.customerId === customer.id).map(i => i.orderId)
    const uninvoicedOrders = customerOrders.filter(o => !invoicedOrderIds.includes(o.id))

    if (!uninvoicedOrders.length) {
      await agentReply(
        `All of ${customer.name}'s orders already have invoices. Want to view them?`,
        null,
        [{ label: 'View invoices', action: 'navigate', payload: { route: '/invoices' } }]
      )
      return
    }

    const order = uninvoicedOrders[0]
    await agentReply(
      `I found an uninvoiced order for ${customer.name}:\n📦 **${order.desc}** · ${formatCurrency(order.totalAmount || order.price, brand.invoiceCurrency)}\n\nHead to the Invoices page to generate it.`,
      null,
      [
        { label: 'Go to Invoices', action: 'navigate', payload: { route: '/invoices' } },
        { label: 'Cancel', action: 'cancel' },
      ]
    )
  }

  async function executeRecordPayment(data) {
    const customer = findCustomer(customers, data.customerName)
    if (!customer) { await agentReply(`I couldn't find "${data.customerName}" in your customers.`); return }

    const method = /transfer/i.test(data.method) ? 'transfer' : /card/i.test(data.method) ? 'card' : 'cash'

    await agentReply(
      `Got it — ${formatCurrency(data.amount, brand.invoiceCurrency)} from **${customer.name}** via ${method}.\n\nHead to their profile to attach this payment to a specific order.`,
      null,
      [
        { label: 'Go to Payments', action: 'navigate', payload: { route: '/customers' } },
        { label: 'Cancel', action: 'cancel' },
      ]
    )
  }

  async function executeAddTask(data) {
    try {
      const customer = data.customerName ? findCustomer(customers, data.customerName) : null
      await addTask({
        desc:         data.desc,
        dueDate:      data.dueDate || null,
        customerName: customer?.name || data.customerName || null,
        customerId:   customer?.id   || null,
        category:     'general',
        done:         false,
        priority:     'normal',
      })

      const lines = [`✅ Task added: **${data.desc}**`]
      if (data.dueDate) lines.push(`📅 Due ${formatDateNice(data.dueDate)}`)
      if (customer)     lines.push(`👤 ${customer.name}`)

      await agentReply(lines.join('\n'), null, [
        { label: 'View tasks', action: 'navigate', payload: { route: '/tasks' } },
      ])
    } catch (err) {
      console.error('[AgentContext] executeAddTask:', err)
      await agentReply(`Couldn't add that task. Please try again.`)
    }
  }

  async function executeAddAppt(data) {
    await agentReply(
      `Got it — ${data.type} appointment for **${data.customerName}** on ${formatDateNice(data.date)} at ${data.time}.\n\nHead to Appointments to confirm and save it.`,
      null,
      [
        { label: 'Go to Appointments', action: 'navigate', payload: { route: '/appointments' } },
        { label: 'Cancel', action: 'cancel' },
      ]
    )
  }

  // ── Query handlers ────────────────────────────────────────

  async function handleQuery(intent, text) {
    switch (intent) {

      case 'query_customer': {
        const nameHint = extractCustomerName(text)
        const customer = nameHint ? findCustomer(customers, nameHint) : null
        if (!customer) { await agentReply(`Which customer do you mean?`); return }

        const customerInvoices = allInvoices.filter(i => i.customerId === customer.id && i.status !== 'paid')
        const customerPayments = allPayments.filter(p => p.customerId === customer.id)
        const totalPaid = customerPayments.reduce((sum, p) => sum + (p.installments || []).reduce((s, inst) => s + (Number(inst.amount) || 0), 0), 0)
        const totalOwed = customerInvoices.reduce((sum, i) => sum + (Number(i.totalAmount || i.price) || 0), 0)
        const balance   = totalOwed - totalPaid

        const lines = [
          `**${customer.name}**`,
          totalOwed > 0 ? `💰 Outstanding: ${formatCurrency(balance, brand.invoiceCurrency)}` : `✅ All paid up — no outstanding balance`,
        ]
        if (customerInvoices.length) lines.push(`🧾 ${customerInvoices.length} unpaid invoice${customerInvoices.length > 1 ? 's' : ''}`)

        await agentReply(lines.join('\n'), null, [
          { label: `View ${customer.name}'s profile`, action: 'navigate', payload: { route: '/customers' } },
        ])
        break
      }

      case 'query_orders': {
        const today    = todayISO()
        const dueToday = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status) && (o.dueDate || o.dueRaw) === today)
        const pending  = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status))

        if (!pending.length) { await agentReply(`No active orders right now. All caught up! 🎉`); return }

        const lines = [
          `You have **${pending.length} active order${pending.length > 1 ? 's' : ''}**`,
          dueToday.length ? `🔴 ${dueToday.length} due today: ${dueToday.map(o => o.desc).join(', ')}` : null,
        ].filter(Boolean)

        await agentReply(lines.join('\n'), null, [
          { label: 'View all orders', action: 'navigate', payload: { route: '/orders' } },
        ])
        break
      }

      case 'query_overdue': {
        const overdueInvoices = allInvoices.filter(i => {
          if (i.status === 'paid' || !i.due) return false
          return new Date(i.due + 'T23:59:59') < new Date()
        })

        if (!overdueInvoices.length) { await agentReply(`No overdue invoices! All payments are on track. ✅`); return }

        const names = [...new Set(overdueInvoices.map(i => i.customerName).filter(Boolean))]
        await agentReply(
          `🔴 **${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}**\n${names.map(n => `• ${n}`).join('\n')}`,
          null,
          [{ label: 'View invoices', action: 'navigate', payload: { route: '/invoices' } }]
        )
        break
      }

      case 'query_summary': {
        const today    = todayISO()
        const pending  = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status))
        const dueToday = pending.filter(o => (o.dueDate || o.dueRaw) === today)
        const overdue  = allInvoices.filter(i => {
          if (i.status === 'paid' || !i.due) return false
          return new Date(i.due + 'T23:59:59') < new Date()
        })
        const pendingTasks = tasks.filter(t => !t.done)

        await agentReply([
          `Here's your shop snapshot 📊`,
          ``,
          `📦 **${pending.length}** active order${pending.length !== 1 ? 's' : ''}${dueToday.length ? ` · ${dueToday.length} due today` : ''}`,
          `🧾 **${overdue.length}** overdue invoice${overdue.length !== 1 ? 's' : ''}`,
          `✅ **${pendingTasks.length}** pending task${pendingTasks.length !== 1 ? 's' : ''}`,
          `👥 **${customers.length}** customer${customers.length !== 1 ? 's' : ''}`,
        ].join('\n'))
        break
      }

      case 'check_measurements': {
        const nameHint = extractCustomerName(text)
        const customer = nameHint ? findCustomer(customers, nameHint) : null
        if (!customer) { await agentReply(`Which customer's measurements do you want to check?`); return }

        await agentReply(
          `To check ${customer.name}'s measurements, head to their profile.`,
          null,
          [{ label: `View ${customer.name}'s profile`, action: 'navigate', payload: { route: '/customers' } }]
        )
        break
      }

      case 'update_status': {
        const nameHint = extractCustomerName(text)
        const customer = nameHint ? findCustomer(customers, nameHint) : null

        const statusMap = {
          ready: 'completed', complete: 'completed', completed: 'completed',
          deliver: 'delivered', delivered: 'delivered',
          cancel: 'cancelled', cancelled: 'cancelled',
          'in progress': 'in-progress', started: 'in-progress',
        }

        let newStatus = null
        for (const [keyword, status] of Object.entries(statusMap)) {
          if (text.toLowerCase().includes(keyword)) { newStatus = status; break }
        }

        if (!customer || !newStatus) {
          await agentReply(`I need a customer name and new status. For example: "Mark Emeka's order as ready"`)
          return
        }

        const customerOrders = allOrders.filter(o =>
          o.customerId === customer.id && !['completed','delivered','cancelled'].includes(o.status)
        )

        if (!customerOrders.length) { await agentReply(`${customer.name} doesn't have any active orders to update.`); return }

        const order = customerOrders[0]
        try {
          await updateOrderStatus(customer.id, order.id, newStatus)
          await agentReply(`✅ **${order.desc}** for ${customer.name} marked as ${newStatus}.`)
        } catch {
          await agentReply(`Couldn't update that order. Please try from the Orders page.`)
        }
        break
      }

      default:
        await agentReply(
          `I'm not sure what you mean. Try something like:\n• "Add an order for Uchenna"\n• "Generate invoice for Emeka"\n• "How much does Bola owe?"\n• "Show me overdue invoices"\n• "Emeka just paid 15k"`
        )
    }
  }

  // ── Main entry ────────────────────────────────────────────

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return

    const userMsg = makeUserMsg(text.trim())
    addMessage(userMsg)

    if (activeFlow) {
      const handled = await advanceFlow(text.trim())
      if (handled) return
    }

    const intent = detectIntent(text)

    if (intent === 'unknown') { await handleQuery('unknown', text); return }

    if (['add_order','gen_invoice','record_payment','add_task','add_appt'].includes(intent)) {
      const initialData = {}
      const nameHint = extractCustomerName(text)
      if (nameHint) initialData.customerName = nameHint
      await startFlow(intent, initialData)
      return
    }

    await handleQuery(intent, text)
  }, [activeFlow, customers, allOrders, allInvoices, allPayments, tasks]) // eslint-disable-line

  const handleAction = useCallback(async (action, payload) => {
    switch (action) {
      case 'gen_invoice':
        await startFlow('gen_invoice', payload || {})
        break
      case 'cancel':
        setActiveFlow(null)
        await agentReply(`No problem. What else can I help with?`)
        break
      default:
        break
    }
  }, []) // eslint-disable-line

  const cancelFlow = useCallback(async () => {
    setActiveFlow(null)
    await agentReply(`Got it, cancelled. What else do you need?`)
  }, []) // eslint-disable-line

  const clearHistory = useCallback(async () => {
    if (!user) return
    await clearAgentMessages(user.uid)
    const greeting = makeAgentMsg(getGreeting(brand.ownerName || brand.name))
    setMessages([greeting])
  }, [user, brand])

  return (
    <AgentContext.Provider value={{
      messages,
      isTyping,
      isLoading,
      activeFlow,
      sendMessage,
      handleAction,
      cancelFlow,
      clearHistory,
    }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgent must be used inside AgentProvider')
  return ctx
}

// ─────────────────────────────────────────────────────────────
// AUTONOMOUS AGENT HOOK
// Derives Done / Upcoming / Drafts from real data + settings
// ─────────────────────────────────────────────────────────────

export function useAutonomousAgent() {
  const { generalSettings } = useGeneralSettings()
  const { customers }       = useCustomers()
  const { allOrders }       = useOrders()
  const { allInvoices }     = useInvoices()
  const { brand }           = useBrand()

  // Local state for cancelled upcoming items and discarded drafts
  // These are session-only — resets on app reload (intentional for now)
  const [cancelledIds, setCancelledIds] = useState([])
  const [discardedIds, setDiscardedIds] = useState([])

  const enabled = generalSettings.agentEnabled

  // ── DONE tasks — built from real data ──────────────────────
  const doneTasks = useMemo(() => {
    if (!enabled) return []
    const items = []
    const now   = Date.now()

    // Auto-invoiced orders
    if (generalSettings.agentAutoInvoice) {
      const thresholdMs = toMs(generalSettings.agentAutoInvoiceTimeframe)
      const invoicedOrderIds = new Set(allInvoices.map(i => i.orderId))

      allOrders
        .filter(o => {
          if (invoicedOrderIds.has(o.id)) return false
          if (['cancelled'].includes(o.status)) return false
          const createdAt = o.createdAt?.toDate?.()?.getTime() || o.createdAt || 0
          const age = now - createdAt
          return age > thresholdMs
        })
        .slice(0, 3)
        .forEach(order => {
          items.push({
            id:     `invoice-${order.id}`,
            type:   'invoice',
            title:  'Invoice drafted',
            desc:   `Order for ${order.customerName || 'unknown customer'} — ${order.desc || 'no description'}.`,
            reason: `This order had no invoice after ${durationLabel(generalSettings.agentAutoInvoiceTimeframe)}, which is the timeframe you set. The agent prepared the draft so you can review and send it.`,
            time:   'Today',
            tag:    'Invoice',
          })
        })
    }

    // Auto-receipts: payments that exist but have no receipt
    if (generalSettings.agentAutoReceipt) {
      const invoicedCustomerIds = new Set(allInvoices.filter(i => i.status === 'paid').map(i => i.customerId))
      invoicedCustomerIds.forEach(customerId => {
        const customer = customers.find(c => c.id === customerId)
        if (!customer) return
        items.push({
          id:     `receipt-${customerId}`,
          type:   'receipt',
          title:  'Receipt drafted',
          desc:   `Payment recorded for ${customer.name}. Receipt is ready in Drafts.`,
          reason: `A payment was recorded for ${customer.name} and no receipt had been generated. The agent prepared one automatically.`,
          time:   'Today',
          tag:    'Receipt',
        })
      })
    }

    // Birthday messages
    if (generalSettings.agentBirthdayMessages) {
      const noticeDays = toMs(generalSettings.agentBirthdayNotice) / UNIT_MS.days
      const today      = new Date()

      customers.forEach(customer => {
        if (!customer.birthday) return
        const bday    = new Date(customer.birthday)
        const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
        const diffDays = Math.round((thisYear - today) / UNIT_MS.days)

        if (diffDays <= noticeDays && diffDays >= 0) {
          items.push({
            id:     `birthday-${customer.id}`,
            type:   'birthday',
            title:  'Birthday message drafted',
            desc:   diffDays === 0 ? `Today is ${customer.name}'s birthday. Draft is ready.` : `${customer.name}'s birthday is in ${diffDays} day${diffDays !== 1 ? 's' : ''}.`,
            reason: `You set the agent to prepare birthday drafts ${durationLabel(generalSettings.agentBirthdayNotice)} before the date. ${customer.name}'s birthday is ${diffDays === 0 ? 'today' : `in ${diffDays} days`}.`,
            time:   'Today',
            tag:    'Birthday',
          })
        }
      })
    }

    // Payment reminders
    if (generalSettings.agentPaymentReminder) {
      const reminderMs = toMs(generalSettings.agentPaymentReminderBefore)
      const now        = Date.now()

      allInvoices
        .filter(i => {
          if (i.status === 'paid' || !i.due) return false
          const dueTime = new Date(i.due + 'T23:59:59').getTime()
          const timeUntilDue = dueTime - now
          return timeUntilDue > 0 && timeUntilDue <= reminderMs
        })
        .slice(0, 3)
        .forEach(invoice => {
          items.push({
            id:     `reminder-${invoice.id}`,
            type:   'reminder',
            title:  'Payment reminder drafted',
            desc:   `Invoice for ${invoice.customerName || 'a customer'} is due on ${invoice.due}. Reminder is in Drafts.`,
            reason: `The invoice due date is within ${durationLabel(generalSettings.agentPaymentReminderBefore)}, which is your reminder window. No payment has been recorded yet.`,
            time:   'Today',
            tag:    'Reminder',
          })
        })
    }

    // Follow-ups
    if (generalSettings.agentFollowUp) {
      const inactivityMs = toMs(generalSettings.agentFollowUpInactivity)
      const now          = Date.now()

      customers.forEach(customer => {
        const customerOrders = allOrders.filter(o => o.customerId === customer.id)
        if (!customerOrders.length) return

        const lastOrder    = customerOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
        const lastActivity = lastOrder.createdAt?.toDate?.()?.getTime() || lastOrder.createdAt || 0
        if (now - lastActivity >= inactivityMs) {
          items.push({
            id:     `followup-${customer.id}`,
            type:   'followup',
            title:  'Follow-up drafted',
            desc:   `${customer.name} hasn't placed an order in over ${durationLabel(generalSettings.agentFollowUpInactivity)}.`,
            reason: `Your follow-up window is ${durationLabel(generalSettings.agentFollowUpInactivity)} of inactivity. ${customer.name}'s last order was longer ago than that.`,
            time:   'Today',
            tag:    'Follow-up',
          })
        }
      })
    }

    return items
  }, [enabled, generalSettings, allOrders, allInvoices, customers])

  // ── UPCOMING tasks ─────────────────────────────────────────
  const upcomingTasks = useMemo(() => {
    if (!enabled) return []
    const items = []
    const now   = Date.now()

    // Orders that will need auto-invoicing soon
    if (generalSettings.agentAutoInvoice) {
      const thresholdMs      = toMs(generalSettings.agentAutoInvoiceTimeframe)
      const invoicedOrderIds = new Set(allInvoices.map(i => i.orderId))

      allOrders
        .filter(o => {
          if (invoicedOrderIds.has(o.id)) return false
          if (['cancelled'].includes(o.status)) return false
          const createdAt = o.createdAt?.toDate?.()?.getTime() || o.createdAt || 0
          const age = now - createdAt
          return age > 0 && age <= thresholdMs
        })
        .slice(0, 3)
        .forEach(order => {
          const createdAt  = order.createdAt?.toDate?.()?.getTime() || order.createdAt || 0
          const remaining  = thresholdMs - (now - createdAt)
          const hours      = Math.ceil(remaining / UNIT_MS.hours)
          const whenLabel  = hours < 1 ? 'Soon' : hours < 24 ? `In ${hours}h` : `In ${Math.ceil(hours / 24)}d`

          if (!cancelledIds.includes(`upcoming-invoice-${order.id}`)) {
            items.push({
              id:   `upcoming-invoice-${order.id}`,
              type: 'invoice',
              title: 'Will auto-generate invoice',
              desc:  `Order for ${order.customerName || 'unknown'} — ${order.desc || ''}. No invoice yet.`,
              when:  whenLabel,
              tag:   'Invoice',
            })
          }
        })
    }

    // Upcoming payment reminders
    if (generalSettings.agentPaymentReminder) {
      const reminderMs = toMs(generalSettings.agentPaymentReminderBefore)

      allInvoices
        .filter(i => {
          if (i.status === 'paid' || !i.due) return false
          const dueTime      = new Date(i.due + 'T23:59:59').getTime()
          const timeUntilDue = dueTime - now
          // Show ones that are slightly further out than the reminder window (coming up)
          return timeUntilDue > reminderMs && timeUntilDue <= reminderMs * 3
        })
        .slice(0, 2)
        .forEach(invoice => {
          if (!cancelledIds.includes(`upcoming-reminder-${invoice.id}`)) {
            items.push({
              id:   `upcoming-reminder-${invoice.id}`,
              type: 'reminder',
              title: 'Will draft payment reminder',
              desc:  `Invoice for ${invoice.customerName || 'a customer'} is due ${invoice.due}.`,
              when:  `Before ${invoice.due}`,
              tag:   'Reminder',
            })
          }
        })
    }

    // Upcoming birthday messages
    if (generalSettings.agentBirthdayMessages) {
      const noticeDays = toMs(generalSettings.agentBirthdayNotice) / UNIT_MS.days
      const today      = new Date()

      customers
        .filter(c => {
          if (!c.birthday) return false
          const bday     = new Date(c.birthday)
          const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
          const diffDays = Math.round((thisYear - today) / UNIT_MS.days)
          return diffDays > noticeDays && diffDays <= noticeDays + 7
        })
        .slice(0, 2)
        .forEach(customer => {
          if (!cancelledIds.includes(`upcoming-birthday-${customer.id}`)) {
            const bday     = new Date(customer.birthday)
            const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
            const diffDays = Math.round((thisYear - today) / UNIT_MS.days)
            items.push({
              id:   `upcoming-birthday-${customer.id}`,
              type: 'birthday',
              title: `Will draft birthday message`,
              desc:  `${customer.name}'s birthday is in ${diffDays} day${diffDays !== 1 ? 's' : ''}.`,
              when:  `In ${diffDays} days`,
              tag:   'Birthday',
            })
          }
        })
    }

    return items
  }, [enabled, generalSettings, allOrders, allInvoices, customers, cancelledIds])

  // ── DRAFTS ─────────────────────────────────────────────────
  const drafts = useMemo(() => {
    if (!enabled) return []
    const items   = []
    const currency = brand.invoiceCurrency || '₦'

    // Invoice drafts
    if (generalSettings.agentAutoInvoice) {
      const thresholdMs      = toMs(generalSettings.agentAutoInvoiceTimeframe)
      const invoicedOrderIds = new Set(allInvoices.map(i => i.orderId))
      const now              = Date.now()

      allOrders
        .filter(o => {
          if (invoicedOrderIds.has(o.id)) return false
          if (['cancelled'].includes(o.status)) return false
          const createdAt = o.createdAt?.toDate?.()?.getTime() || o.createdAt || 0
          return (now - createdAt) > thresholdMs
        })
        .slice(0, 3)
        .forEach(order => {
          const id = `draft-invoice-${order.id}`
          if (!discardedIds.includes(id)) {
            items.push({
              id,
              type:    'invoice',
              title:   `Invoice — ${order.customerName || 'Customer'}`,
              preview: `Invoice for ${order.desc || 'order'} · Total: ${formatCurrency(order.totalAmount || order.price, currency)} · Due: ${order.due || 'not set'}. Generated by your agent.`,
              tag:     'Invoice',
            })
          }
        })
    }

    // Receipt drafts
    if (generalSettings.agentAutoReceipt) {
      allInvoices
        .filter(i => i.status === 'paid')
        .slice(0, 2)
        .forEach(invoice => {
          const id = `draft-receipt-${invoice.id}`
          if (!discardedIds.includes(id)) {
            items.push({
              id,
              type:    'receipt',
              title:   `Receipt — ${invoice.customerName || 'Customer'}`,
              preview: `Payment receipt for ${formatCurrency(invoice.totalAmount || invoice.price, currency)} received from ${invoice.customerName || 'customer'}. Order: ${invoice.orderId || 'N/A'}. Thank you for your patronage.`,
              tag:     'Receipt',
            })
          }
        })
    }

    // Birthday message drafts
    if (generalSettings.agentBirthdayMessages) {
      const noticeDays = toMs(generalSettings.agentBirthdayNotice) / UNIT_MS.days
      const today      = new Date()

      customers
        .filter(c => {
          if (!c.birthday) return false
          const bday     = new Date(c.birthday)
          const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
          const diffDays = Math.round((thisYear - today) / UNIT_MS.days)
          return diffDays >= 0 && diffDays <= noticeDays
        })
        .forEach(customer => {
          const id = `draft-birthday-${customer.id}`
          if (!discardedIds.includes(id)) {
            items.push({
              id,
              type:    'birthday',
              title:   `Birthday message — ${customer.name}`,
              preview: `Hi ${customer.name.split(' ')[0]}! Wishing you a wonderful birthday. It's always a pleasure working with you. Hope to see you soon!`,
              tag:     'Birthday',
            })
          }
        })
    }

    // Follow-up message drafts
    if (generalSettings.agentFollowUp) {
      const inactivityMs = toMs(generalSettings.agentFollowUpInactivity)
      const now          = Date.now()

      customers.forEach(customer => {
        const customerOrders = allOrders.filter(o => o.customerId === customer.id)
        if (!customerOrders.length) return

        const lastOrder    = customerOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
        const lastActivity = lastOrder.createdAt?.toDate?.()?.getTime() || lastOrder.createdAt || 0

        if (now - lastActivity >= inactivityMs) {
          const id = `draft-followup-${customer.id}`
          if (!discardedIds.includes(id)) {
            items.push({
              id,
              type:    'followup',
              title:   `Follow-up — ${customer.name}`,
              preview: `Hi ${customer.name.split(' ')[0]}! It's been a while since your last visit. We'd love to create something special for you again. Feel free to reach out anytime!`,
              tag:     'Follow-up',
            })
          }
        }
      })
    }

    // Payment reminder drafts
    if (generalSettings.agentPaymentReminder) {
      const reminderMs = toMs(generalSettings.agentPaymentReminderBefore)
      const now        = Date.now()

      allInvoices
        .filter(i => {
          if (i.status === 'paid' || !i.due) return false
          const dueTime      = new Date(i.due + 'T23:59:59').getTime()
          const timeUntilDue = dueTime - now
          return timeUntilDue > 0 && timeUntilDue <= reminderMs
        })
        .slice(0, 3)
        .forEach(invoice => {
          const id = `draft-reminder-${invoice.id}`
          if (!discardedIds.includes(id)) {
            items.push({
              id,
              type:    'reminder',
              title:   `Payment reminder — ${invoice.customerName || 'Customer'}`,
              preview: `Hi ${invoice.customerName || 'there'}, just a reminder that your balance of ${formatCurrency(invoice.totalAmount || invoice.price, currency)} is due on ${invoice.due}. Kindly make payment at your earliest convenience. Thank you!`,
              tag:     'Reminder',
            })
          }
        })
    }

    return items
  }, [enabled, generalSettings, allOrders, allInvoices, customers, brand, discardedIds])

  function cancelUpcoming(id) {
    setCancelledIds(prev => [...prev, id])
  }

  function discardDraft(id) {
    setDiscardedIds(prev => [...prev, id])
  }

  return {
    enabled,
    doneTasks,
    upcomingTasks,
    drafts,
    cancelUpcoming,
    discardDraft,
  }
}

// ─────────────────────────────────────────────────────────────
// GREETING
// ─────────────────────────────────────────────────────────────

function getGreeting(name) {
  const h    = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const who  = name ? `, ${name.split(' ')[0]}` : ''
  return `Good ${time}${who}! 👋\n\nI'm your shop assistant. I can help you:\n• **Add orders** — "Add an order for Uchenna"\n• **Record payments** — "Emeka just paid ₦20k"\n• **Check balances** — "How much does Bola owe?"\n• **Add tasks** — "Remind me to buy thread tomorrow"\n• **Book appointments** — "Schedule a fitting for Ngozi on Friday"\n• **Get a summary** — "What's happening today?"\n\nWhat do you need?`
}
