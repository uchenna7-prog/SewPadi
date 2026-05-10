// src/contexts/AgentContext.jsx
// ─────────────────────────────────────────────────────────────
// The agent brain. Manages conversation state, understands
// intent from plain text, asks follow-up questions, and
// executes real actions using existing contexts.
//
// No external AI API needed — intent matching is rule-based
// and ready to be swapped for Gemini when the time comes.
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import { useAuth }         from './AuthContext'
import { useCustomers }    from './CustomerContext'
import { useOrders }       from './OrdersContext'
import { useInvoices }     from './InvoiceContext'
import { usePayments }     from './PaymentContext'
import { useTasks }        from './TaskContext'
import { useAppointments } from './AppointmentContext'
import { useBrand }        from './BrandContext'
import { saveAgentMessage, loadAgentMessages, clearAgentMessages } from '../services/agentService'

// ─────────────────────────────────────────────────────────────
// HELPERS
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

  // "next friday", "next monday" etc
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

  // "friday", "monday" etc (this week)
  const dayIdx = dayNames.indexOf(s)
  if (dayIdx !== -1) {
    const d = new Date(today)
    const diff = (dayIdx - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
  }

  // "May 20", "20 May", "20/5", "2025-05-20"
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

// Find a customer by name (fuzzy — first match)
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
  // Orders
  { intent: 'add_order',    patterns: [/add.*(order|job)/i, /new.*(order|job)/i, /creat.*(order|job)/i, /take.*order/i, /order for/i] },
  // Invoices
  { intent: 'gen_invoice',  patterns: [/generat.*invoice/i, /creat.*invoice/i, /send.*invoice/i, /invoice for/i, /make.*invoice/i] },
  // Payments
  { intent: 'record_payment', patterns: [/paid/i, /record.*pay/i, /payment.*from/i, /just paid/i, /received.*payment/i, /mark.*paid/i] },
  // Tasks
  { intent: 'add_task',     patterns: [/add.*task/i, /remind me/i, /creat.*task/i, /new.*task/i, /note to/i] },
  // Appointments
  { intent: 'add_appt',     patterns: [/schedul/i, /book.*appt/i, /book.*appointment/i, /set.*appointment/i, /appt.*for/i, /fitting.*for/i] },
  // Queries
  { intent: 'query_customer', patterns: [/how much.*owe/i, /balance.*for/i, /what.*owe/i, /does.*owe/i, /owe.*me/i] },
  { intent: 'query_orders',   patterns: [/orders.*due/i, /what.*due/i, /pending.*order/i, /active.*order/i, /show.*order/i] },
  { intent: 'query_overdue',  patterns: [/overdue/i, /late.*invoice/i, /unpaid/i, /who.*not.*paid/i] },
  { intent: 'query_summary',  patterns: [/summar/i, /how.*doing/i, /today.*status/i, /what.*happening/i, /overview/i, /snapshot/i] },
  // Status updates
  { intent: 'update_status',  patterns: [/mark.*as/i, /status.*to/i, /update.*status/i, /set.*status/i, /change.*to/i, /ready/i, /complet/i, /deliver/i] },
  // Measurements
  { intent: 'check_measurements', patterns: [/measurement/i, /measure/i, /size.*for/i, /has.*measurement/i] },
]

function detectIntent(text) {
  for (const { intent, patterns } of INTENTS) {
    if (patterns.some(p => p.test(text))) return intent
  }
  return 'unknown'
}

// Extract a customer name from text like "for Uchenna" / "Emeka's" / "from Bola"
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
// FLOW DEFINITIONS
// Each flow is a sequence of steps the agent walks through.
// ─────────────────────────────────────────────────────────────

// Flow step structure:
// { key, question, validate?, transform? }

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
    { key: 'orderId',      question: null }, // resolved internally from customer's orders
  ],
  record_payment: [
    { key: 'customerName', question: "Which customer made the payment?" },
    { key: 'amount',       question: "How much did they pay?",
      validate: v => parseMoney(v) !== null, errMsg: "Please enter a valid amount",
      transform: v => parseMoney(v) },
    { key: 'method',       question: "How did they pay? (cash / transfer / card)" },
    { key: 'orderId',      question: null }, // resolved internally
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
// CONTEXT
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

  const [messages,     setMessages]     = useState([])
  const [isTyping,     setIsTyping]     = useState(false)
  const [isLoading,    setIsLoading]    = useState(true)
  const [activeFlow,   setActiveFlow]   = useState(null)  // { name, stepIdx, data }
  const persistQueue   = useRef([])

  // ── Load history from Firestore on mount ──────────────────
  useEffect(() => {
    if (!user) { setIsLoading(false); return }
    loadAgentMessages(user.uid).then(history => {
      if (history.length > 0) {
        setMessages(history)
      } else {
        // First time — greet
        const greeting = makeAgentMsg(getGreeting(brand.ownerName || brand.name))
        setMessages([greeting])
      }
      setIsLoading(false)
    })
  }, [user]) // eslint-disable-line

  // ── Persist messages to Firestore (debounced queue) ───────
  const persistMsg = useCallback((msg) => {
    if (!user) return
    persistQueue.current.push(msg)
    // Fire and forget — don't block UI
    saveAgentMessage(user.uid, {
      role:    msg.role,
      text:    msg.text,
      meta:    msg.meta || null,
      actions: msg.actions || null,
    }).catch(console.error)
  }, [user])

  // ── Message factories ─────────────────────────────────────
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

  // ── Simulated agent typing delay ──────────────────────────
  async function agentReply(text, meta = null, actions = null, delay = 600) {
    setIsTyping(true)
    await new Promise(r => setTimeout(r, delay))
    setIsTyping(false)
    const msg = makeAgentMsg(text, meta, actions)
    addMessage(msg)
    return msg
  }

  // ─────────────────────────────────────────────────────────
  // FLOW EXECUTION
  // ─────────────────────────────────────────────────────────

  async function startFlow(flowName, initialData = {}) {
    const steps = FLOWS[flowName]
    if (!steps) return

    // Skip steps that are already resolved from the initial message
    let stepIdx = 0
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (step.question && initialData[step.key] !== undefined) {
        stepIdx = i + 1
      } else {
        break
      }
    }

    const flow = { name: flowName, stepIdx, data: { ...initialData } }

    // Skip null-question steps (resolved internally)
    while (flow.stepIdx < steps.length && steps[flow.stepIdx].question === null) {
      flow.stepIdx++
    }

    if (flow.stepIdx >= steps.length) {
      // All data collected — execute immediately
      await executeFlow(flow)
      return
    }

    setActiveFlow(flow)
    await agentReply(steps[flow.stepIdx].question)
  }

  async function advanceFlow(userText) {
    if (!activeFlow) return false

    const steps = FLOWS[activeFlow.name]
    const step  = steps[activeFlow.stepIdx]

    // Validate
    if (step.validate && !step.validate(userText)) {
      await agentReply(step.errMsg || "I didn't understand that. " + step.question)
      return true
    }

    // Transform and store
    const value = step.transform ? step.transform(userText) : userText.trim()
    const newData = { ...activeFlow.data, [step.key]: value }

    // Find next step with a question
    let nextIdx = activeFlow.stepIdx + 1
    while (nextIdx < steps.length && steps[nextIdx].question === null) {
      nextIdx++
    }

    if (nextIdx >= steps.length) {
      // Flow complete — execute
      setActiveFlow(null)
      await executeFlow({ ...activeFlow, data: newData })
    } else {
      setActiveFlow({ ...activeFlow, stepIdx: nextIdx, data: newData })
      await agentReply(steps[nextIdx].question)
    }

    return true
  }

  // ─────────────────────────────────────────────────────────
  // FLOW EXECUTORS — actually do the work
  // ─────────────────────────────────────────────────────────

  async function executeFlow(flow) {
    const { name, data } = flow

    switch (name) {
      case 'add_order':    return executeAddOrder(data)
      case 'gen_invoice':  return executeGenInvoice(data)
      case 'record_payment': return executeRecordPayment(data)
      case 'add_task':     return executeAddTask(data)
      case 'add_appt':     return executeAddAppt(data)
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
        customerId:   customer.id,
        customerName: customer.name,
        desc:         data.desc,
        price:        data.price,
        totalAmount:  data.price,
        dueDate:      data.dueDate,
        dueRaw:       data.dueDate,
        due:          formatDateNice(data.dueDate),
        status:       'pending',
        stage:        null,
        priority:     'normal',
        items:        [{ name: data.desc, price: data.price, qty: 1 }],
        notes:        '',
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
          desc:         `Take measurements for ${customer.name}`,
          dueDate:      data.dueDate,
          customerName: customer.name,
          customerId:   customer.id,
          category:     'sewing',
          done:         false,
          priority:     'high',
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

    if (!customer) {
      await agentReply(`I couldn't find "${data.customerName}" in your customers.`)
      return
    }

    // Find their most recent unpaid order
    const customerOrders = allOrders.filter(o =>
      o.customerId === customer.id &&
      !['cancelled'].includes(o.status)
    )

    if (!customerOrders.length) {
      await agentReply(`${customer.name} doesn't have any active orders to invoice.`)
      return
    }

    // Check if invoice already exists for these orders
    const invoicedOrderIds = allInvoices
      .filter(i => i.customerId === customer.id)
      .map(i => i.orderId)

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
      `I found an uninvoiced order for ${customer.name}:\n📦 **${order.desc}** · ${formatCurrency(order.totalAmount || order.price, brand.invoiceCurrency)}\n\nHead to the Invoices page to generate it — I'll take you there.`,
      null,
      [
        { label: 'Go to Invoices', action: 'navigate', payload: { route: `/invoices` } },
        { label: 'Cancel', action: 'cancel' },
      ]
    )
  }

  async function executeRecordPayment(data) {
    const customer = findCustomer(customers, data.customerName)

    if (!customer) {
      await agentReply(`I couldn't find "${data.customerName}" in your customers.`)
      return
    }

    const method = /transfer/i.test(data.method) ? 'transfer'
      : /card/i.test(data.method) ? 'card'
      : 'cash'

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

  // ─────────────────────────────────────────────────────────
  // QUERY HANDLERS — answer questions about real data
  // ─────────────────────────────────────────────────────────

  async function handleQuery(intent, text) {
    switch (intent) {

      case 'query_customer': {
        const nameHint = extractCustomerName(text)
        const customer = nameHint ? findCustomer(customers, nameHint) : null

        if (!customer) {
          await agentReply(`Which customer do you mean?`)
          return
        }

        const customerInvoices = allInvoices.filter(i => i.customerId === customer.id && i.status !== 'paid')
        const customerPayments = allPayments.filter(p => p.customerId === customer.id)
        const totalPaid = customerPayments.reduce((sum, p) =>
          sum + (p.installments || []).reduce((s, inst) => s + (Number(inst.amount) || 0), 0), 0)
        const totalOwed = customerInvoices.reduce((sum, i) => sum + (Number(i.totalAmount || i.price) || 0), 0)
        const balance   = totalOwed - totalPaid

        const lines = [
          `**${customer.name}**`,
          totalOwed > 0
            ? `💰 Outstanding: ${formatCurrency(balance, brand.invoiceCurrency)}`
            : `✅ All paid up — no outstanding balance`,
        ]
        if (customerInvoices.length) {
          lines.push(`🧾 ${customerInvoices.length} unpaid invoice${customerInvoices.length > 1 ? 's' : ''}`)
        }

        await agentReply(lines.join('\n'), null, [
          { label: `View ${customer.name}'s profile`, action: 'navigate', payload: { route: '/customers' } },
        ])
        break
      }

      case 'query_orders': {
        const today     = todayISO()
        const dueToday  = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status) && (o.dueDate || o.dueRaw) === today)
        const pending   = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status))

        if (!pending.length) {
          await agentReply(`No active orders right now. All caught up! 🎉`)
          return
        }

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
          if (i.status === 'paid') return false
          if (!i.due) return false
          return new Date(i.due + 'T23:59:59') < new Date()
        })

        if (!overdueInvoices.length) {
          await agentReply(`No overdue invoices! All payments are on track. ✅`)
          return
        }

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
          if (i.status === 'paid') return false
          if (!i.due) return false
          return new Date(i.due + 'T23:59:59') < new Date()
        })
        const pendingTasks = tasks.filter(t => !t.done)

        const lines = [
          `Here's your shop snapshot 📊`,
          ``,
          `📦 **${pending.length}** active order${pending.length !== 1 ? 's' : ''}${dueToday.length ? ` · ${dueToday.length} due today` : ''}`,
          `🧾 **${overdue.length}** overdue invoice${overdue.length !== 1 ? 's' : ''}`,
          `✅ **${pendingTasks.length}** pending task${pendingTasks.length !== 1 ? 's' : ''}`,
          `👥 **${customers.length}** customer${customers.length !== 1 ? 's' : ''}`,
        ]

        await agentReply(lines.join('\n'))
        break
      }

      case 'check_measurements': {
        const nameHint = extractCustomerName(text)
        const customer = nameHint ? findCustomer(customers, nameHint) : null

        if (!customer) {
          await agentReply(`Which customer's measurements do you want to check?`)
          return
        }

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
          ready:      'completed',
          complete:   'completed',
          completed:  'completed',
          deliver:    'delivered',
          delivered:  'delivered',
          cancel:     'cancelled',
          cancelled:  'cancelled',
          'in progress': 'in-progress',
          started:    'in-progress',
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
          o.customerId === customer.id &&
          !['completed','delivered','cancelled'].includes(o.status)
        )

        if (!customerOrders.length) {
          await agentReply(`${customer.name} doesn't have any active orders to update.`)
          return
        }

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

  // ─────────────────────────────────────────────────────────
  // MAIN ENTRY — handle user input
  // ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return

    const userMsg = makeUserMsg(text.trim())
    addMessage(userMsg)

    // If we're in an active flow, advance it
    if (activeFlow) {
      const handled = await advanceFlow(text.trim())
      if (handled) return
    }

    // Detect intent
    const intent = detectIntent(text)

    if (intent === 'unknown') {
      await handleQuery('unknown', text)
      return
    }

    // Flows that need conversation
    if (['add_order','gen_invoice','record_payment','add_task','add_appt'].includes(intent)) {
      // Pre-populate what we can from the initial message
      const initialData = {}
      const nameHint = extractCustomerName(text)
      if (nameHint) initialData.customerName = nameHint

      await startFlow(intent, initialData)
      return
    }

    // Instant query intents
    await handleQuery(intent, text)

  }, [activeFlow, customers, allOrders, allInvoices, allPayments, tasks]) // eslint-disable-line

  // ── Handle action button taps ─────────────────────────────
  const handleAction = useCallback(async (action, payload) => {
    switch (action) {
      case 'gen_invoice':
        await startFlow('gen_invoice', payload || {})
        break
      case 'cancel':
        setActiveFlow(null)
        await agentReply(`No problem. What else can I help with?`)
        break
      case 'navigate':
        // Handled by the UI layer — Agent.jsx intercepts this
        break
      default:
        break
    }
  }, []) // eslint-disable-line

  // ── Cancel active flow ────────────────────────────────────
  const cancelFlow = useCallback(async () => {
    setActiveFlow(null)
    await agentReply(`Got it, cancelled. What else do you need?`)
  }, []) // eslint-disable-line

  // ── Clear history ─────────────────────────────────────────
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
// GREETING
// ─────────────────────────────────────────────────────────────

function getGreeting(name) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const who  = name ? `, ${name.split(' ')[0]}` : ''
  return `Good ${time}${who}! 👋\n\nI'm your shop assistant. I can help you:\n• **Add orders** — "Add an order for Uchenna"\n• **Record payments** — "Emeka just paid ₦20k"\n• **Check balances** — "How much does Bola owe?"\n• **Add tasks** — "Remind me to buy thread tomorrow"\n• **Book appointments** — "Schedule a fitting for Ngozi on Friday"\n• **Get a summary** — "What's happening today?"\n\nWhat do you need?`
}
