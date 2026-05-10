// src/pages/Agent/Agent.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header    from '../../components/Header/Header'
import BottomNav from '../../components/BottomNav/BottomNav'
import { useAgent } from '../../contexts/AgentContext'
import { useCustomers } from '../../contexts/CustomerContext'
import { useOrders }    from '../../contexts/OrdersContext'
import { useInvoices }  from '../../contexts/InvoiceContext'
import { useTasks }     from '../../contexts/TaskContext'
import styles from './Agent.module.css'

// ─────────────────────────────────────────────────────────────
// QUICK SUGGESTIONS — shown when chat is empty / at start
// ─────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: 'add_shopping_cart', text: 'Add an order'          },
  { icon: 'receipt_long',      text: 'Generate invoice'      },
  { icon: 'payments',          text: 'Record a payment'      },
  { icon: 'task_alt',          text: 'Add a task'            },
  { icon: 'event',             text: 'Book appointment'      },
  { icon: 'summarize',         text: "Today's summary"       },
  { icon: 'warning_amber',     text: 'Show overdue invoices' },
  { icon: 'inventory_2',       text: 'Show active orders'    },
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function haptic(type = 'light') {
  if (!navigator.vibrate) return
  if (type === 'light')  navigator.vibrate(10)
  if (type === 'medium') navigator.vibrate(20)
}

function MIcon({ name, size = '1.1rem', color }) {
  return (
    <span className="mi" style={{ fontSize: size, color: color || 'inherit', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
      {name}
    </span>
  )
}

// Render markdown-ish bold (**text**) inside a string
function RichText({ text }) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        // Preserve line breaks
        return part.split('\n').map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.typingWrap}>
      <div className={styles.agentAvatarSm}>
        <MIcon name="smart_toy" size="0.75rem" />
      </div>
      <div className={styles.typingBubble}>
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SINGLE CHAT MESSAGE
// ─────────────────────────────────────────────────────────────
function ChatMessage({ msg, onAction, onNavigate }) {
  const isAgent = msg.role === 'agent'

  return (
    <div className={`${styles.msgRow} ${isAgent ? styles.msgRowAgent : styles.msgRowUser}`}>
      {isAgent && (
        <div className={styles.agentAvatarSm}>
          <MIcon name="smart_toy" size="0.75rem" />
        </div>
      )}

      <div className={styles.msgContent}>
        <div className={`${styles.bubble} ${isAgent ? styles.bubbleAgent : styles.bubbleUser}`}>
          <RichText text={msg.text} />
        </div>

        {/* Action buttons */}
        {isAgent && msg.actions && msg.actions.length > 0 && (
          <div className={styles.msgActions}>
            {msg.actions.map((action, i) => (
              <button
                key={i}
                className={`${styles.msgActionBtn} ${action.action === 'cancel' ? styles.msgActionBtnGhost : ''}`}
                onClick={() => {
                  haptic('light')
                  if (action.action === 'navigate') {
                    onNavigate(action.payload.route)
                  } else {
                    onAction(action.action, action.payload)
                  }
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <div className={`${styles.msgTime} ${isAgent ? '' : styles.msgTimeUser}`}>
          {msg.time}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FLOW INDICATOR — shows current step context
// ─────────────────────────────────────────────────────────────
function FlowIndicator({ activeFlow, onCancel }) {
  if (!activeFlow) return null

  const flowLabels = {
    add_order:      'Adding order',
    gen_invoice:    'Creating invoice',
    record_payment: 'Recording payment',
    add_task:       'Adding task',
    add_appt:       'Booking appointment',
  }

  return (
    <div className={styles.flowIndicator}>
      <MIcon name="pending" size="0.75rem" color="var(--brand-primary, #5C7A60)" />
      <span className={styles.flowLabel}>{flowLabels[activeFlow.name] || 'In progress'}</span>
      <button className={styles.flowCancel} onClick={() => { haptic('light'); onCancel() }}>
        Cancel
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STATS BAR — live data summary at the top
// ─────────────────────────────────────────────────────────────
function StatsBar() {
  const { allOrders }   = useOrders()
  const { allInvoices } = useInvoices()
  const { tasks }       = useTasks()
  const { customers }   = useCustomers()

  const today   = new Date().toISOString().slice(0, 10)
  const pending = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status))
  const dueToday = pending.filter(o => (o.dueDate || o.dueRaw) === today)
  const overdue  = allInvoices.filter(i => {
    if (i.status === 'paid') return false
    if (!i.due) return false
    return new Date(i.due + 'T23:59:59') < new Date()
  })
  const pendingTasks = tasks.filter(t => !t.done)

  const stats = [
    { label: 'Orders',   value: pending.length,      danger: dueToday.length > 0, sub: dueToday.length > 0 ? `${dueToday.length} today` : null },
    { label: 'Overdue',  value: overdue.length,       danger: overdue.length > 0,  sub: null },
    { label: 'Tasks',    value: pendingTasks.length,  danger: false,               sub: null },
    { label: 'Customers',value: customers.length,     danger: false,               sub: null },
  ]

  return (
    <div className={styles.statsBar}>
      {stats.map((s, i) => (
        <div key={i} className={styles.statCell}>
          <div className={`${styles.statVal} ${s.danger ? styles.statValDanger : ''}`}>{s.value}</div>
          <div className={styles.statLbl}>{s.label}</div>
          {s.sub && <div className={styles.statSub}>{s.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE — shown before any conversation
// ─────────────────────────────────────────────────────────────
function EmptyChat({ onSuggestion }) {
  return (
    <div className={styles.emptyChat}>
      <div className={styles.emptyChatIcon}>
        <MIcon name="smart_toy" size="2rem" color="var(--text3)" />
      </div>
      <p className={styles.emptyChatTitle}>Your shop assistant</p>
      <p className={styles.emptyChatSub}>Tap a suggestion or type what you need</p>
      <div className={styles.suggestionsGrid}>
        {SUGGESTIONS.map(s => (
          <button
            key={s.text}
            className={styles.suggestionCard}
            onClick={() => { haptic('light'); onSuggestion(s.text) }}
          >
            <MIcon name={s.icon} size="1.1rem" color="var(--text2)" />
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SETTINGS PANEL
// ─────────────────────────────────────────────────────────────
function SettingsPanel({ open, onClose, onClear }) {
  return (
    <div className={`${styles.settingsPanel} ${open ? styles.settingsPanelOpen : ''}`}>
      <div className={styles.settingsTopbar}>
        <button className={styles.settingsBack} onClick={onClose}>
          <MIcon name="arrow_back" size="1.2rem" />
        </button>
        <div className={styles.settingsTitle}>Agent Settings</div>
      </div>
      <div className={styles.settingsScroll}>

        <div className={styles.settingsSection}>
          <div className={styles.settingsSectionTitle}>About</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <MIcon name="smart_toy" size="1rem" color="var(--text2)" />
              <div>
                <div className={styles.infoTitle}>Conversational Agent</div>
                <div className={styles.infoDesc}>Understands plain language and takes actions in your shop — creating orders, tasks, and more.</div>
              </div>
            </div>
            <div className={styles.infoRow}>
              <MIcon name="lock" size="1rem" color="var(--text2)" />
              <div>
                <div className={styles.infoTitle}>Private & local</div>
                <div className={styles.infoDesc}>Your conversation is stored in your own Firestore database. Nothing leaves your account.</div>
              </div>
            </div>
            <div className={styles.infoRow}>
              <MIcon name="bolt" size="1rem" color="var(--text2)" />
              <div>
                <div className={styles.infoTitle}>AI upgrade coming</div>
                <div className={styles.infoDesc}>Gemini AI integration is planned — will understand natural language even better.</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.settingsSection}>
          <div className={`${styles.settingsSectionTitle} ${styles.settingsSectionDanger}`}>Danger zone</div>
          <button className={styles.dangerRow} onClick={() => { haptic('medium'); onClear(); onClose() }}>
            <span className={styles.dangerIconWrap}>
              <MIcon name="delete_outline" size="1.2rem" color="var(--danger, #ef4444)" />
            </span>
            <div>
              <div className={styles.dangerName}>Clear conversation</div>
              <div className={styles.dangerDesc}>Remove all messages from this chat</div>
            </div>
            <MIcon name="chevron_right" size="1.2rem" color="var(--danger, #ef4444)" />
          </button>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
function Agent({ onMenuClick }) {
  const navigate = useNavigate()
  const {
    messages,
    isTyping,
    isLoading,
    activeFlow,
    sendMessage,
    handleAction,
    cancelFlow,
    clearHistory,
  } = useAgent()

  const [inputValue,   setInputValue]   = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = useCallback(() => {
    const v = inputValue.trim()
    if (!v) return
    haptic('light')
    setInputValue('')
    sendMessage(v)
  }, [inputValue, sendMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (text) => {
    haptic('light')
    sendMessage(text)
  }

  const handleActionBtn = useCallback((action, payload) => {
    if (action === 'navigate') {
      navigate(payload.route)
      return
    }
    handleAction(action, payload)
  }, [handleAction, navigate])

  const showEmpty = !isLoading && messages.length === 0

  return (
    <div className={styles.pageWrapper}>
      <Header
        type="back"
        title="Agent"
        subtitle="Your shop assistant"
        onBackClick={() => navigate('/')}
        customActions={[
          { icon: 'settings', onClick: () => setSettingsOpen(true), color: 'var(--text2)' },
        ]}
      />

      {/* Live stats bar */}
      {!isLoading && <StatsBar />}

      {/* Flow progress indicator */}
      <FlowIndicator activeFlow={activeFlow} onCancel={cancelFlow} />

      {/* Chat area */}
      <main className={styles.chatMain}>

        {isLoading && (
          <div className={styles.loadingWrap}>
            <div className={styles.loadingDots}>
              <span /><span /><span />
            </div>
          </div>
        )}

        {showEmpty && <EmptyChat onSuggestion={handleSuggestion} />}

        {!isLoading && messages.length > 0 && (
          <div className={styles.messageList}>
            {messages.map(msg => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                onAction={handleActionBtn}
                onNavigate={navigate}
              />
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input bar */}
      <div className={styles.inputBarWrap}>
        {/* Quick suggestions strip — only show when not in a flow */}
        {!activeFlow && (
          <div className={styles.quickStrip}>
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button
                key={s.text}
                className={styles.quickChip}
                onClick={() => { haptic('light'); handleSuggestion(s.text) }}
              >
                <MIcon name={s.icon} size="0.72rem" color="var(--text3)" />
                {s.text}
              </button>
            ))}
          </div>
        )}

        <div className={styles.inputRow}>
          <div className={styles.inputWrap}>
            <MIcon name="smart_toy" size="0.9rem" color="var(--text3)" />
            <textarea
              ref={inputRef}
              className={styles.inputField}
              placeholder={activeFlow ? 'Type your answer…' : 'Tell me what to do…'}
              value={inputValue}
              rows={1}
              onChange={e => {
                setInputValue(e.target.value)
                // Auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ''}`}
              onClick={handleSend}
              aria-label="Send"
              disabled={!inputValue.trim()}
            >
              <MIcon name="arrow_upward" size="0.9rem" color="var(--bg)" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClear={clearHistory}
      />
    </div>
  )
}

export default Agent
