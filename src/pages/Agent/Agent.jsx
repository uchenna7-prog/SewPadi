// src/pages/Agent/Agent.jsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header    from '../../components/Header/Header'
import BottomNav from '../../components/BottomNav/BottomNav'
import { useAgent }         from '../../contexts/AgentContext'
import { useAutonomousAgent } from '../../contexts/AgentContext'
import { useCustomers }     from '../../contexts/CustomerContext'
import { useOrders }        from '../../contexts/OrdersContext'
import { useInvoices }      from '../../contexts/InvoiceContext'
import { useTasks }         from '../../contexts/TaskContext'
import styles from './Agent.module.css'

// ─────────────────────────────────────────────────────────────
// ICON META — centralised semantic colours
// ─────────────────────────────────────────────────────────────
const ICON_META = {
  invoice:  { icon: 'receipt_long',          color: 'var(--accent)'  },
  receipt:  { icon: 'payments',              color: '#22c55e'        },
  message:  { icon: 'chat_bubble',           color: '#3b82f6'        },
  reminder: { icon: 'notification_important',color: 'var(--accent)'  },
  brief:    { icon: 'summarize',             color: 'var(--text2)'   },
  flag:     { icon: 'flag',                  color: 'var(--accent)'  },
  pickup:   { icon: 'storefront',            color: '#a855f7'        },
  birthday: { icon: 'cake',                  color: '#ec4899'        },
  followup: { icon: 'person_search',         color: '#3b82f6'        },
}

const TAG_COLORS = {
  Invoice:   { bg: 'rgba(255,149,0,0.12)',   color: 'var(--accent)'  },
  Receipt:   { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e'        },
  Message:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6'        },
  Reminder:  { bg: 'rgba(255,149,0,0.12)',   color: 'var(--accent)'  },
  Brief:     { bg: 'rgba(120,120,128,0.15)', color: 'var(--text2)'   },
  Flag:      { bg: 'rgba(255,149,0,0.12)',   color: 'var(--accent)'  },
  'Follow-up':{ bg: 'rgba(59,130,246,0.12)', color: '#3b82f6'        },
  Birthday:  { bg: 'rgba(236,72,153,0.12)',  color: '#ec4899'        },
}

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

function RichText({ text }) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
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
// STATS BAR
// ─────────────────────────────────────────────────────────────
function StatsBar() {
  const { allOrders }   = useOrders()
  const { allInvoices } = useInvoices()
  const { tasks }       = useTasks()
  const { customers }   = useCustomers()

  const today      = new Date().toISOString().slice(0, 10)
  const pending    = allOrders.filter(o => !['completed','delivered','cancelled'].includes(o.status))
  const dueToday   = pending.filter(o => (o.dueDate || o.dueRaw) === today)
  const overdue    = allInvoices.filter(i => {
    if (i.status === 'paid' || !i.due) return false
    return new Date(i.due + 'T23:59:59') < new Date()
  })
  const pendingTasks = tasks.filter(t => !t.done)

  const stats = [
    { label: 'Orders',    value: pending.length,      danger: dueToday.length > 0, sub: dueToday.length > 0 ? `${dueToday.length} today` : null },
    { label: 'Overdue',   value: overdue.length,       danger: overdue.length > 0,  sub: null },
    { label: 'Tasks',     value: pendingTasks.length,  danger: false,               sub: null },
    { label: 'Customers', value: customers.length,     danger: false,               sub: null },
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
// AGENT STATUS BAR
// ─────────────────────────────────────────────────────────────
function AgentStatusBar({ enabled, doneCount }) {
  return (
    <div className={styles.agentStatusBar}>
      <span className={`${styles.agentStatusDot} ${enabled ? styles.agentStatusDotOn : ''}`} />
      <span className={styles.agentStatusText}>
        {enabled ? 'Agent is active' : 'Agent is off'}
      </span>
      {enabled && doneCount > 0 && (
        <span className={styles.agentStatusSub}>· {doneCount} task{doneCount !== 1 ? 's' : ''} done today</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAG CHIP
// ─────────────────────────────────────────────────────────────
function TagChip({ label }) {
  const c = TAG_COLORS[label] || TAG_COLORS.Message
  return (
    <span className={styles.tag} style={{ background: c.bg, color: c.color }}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// DONE TAB
// ─────────────────────────────────────────────────────────────
function DoneTab({ items }) {
  const [expanded, setExpanded] = useState(null)

  if (!items.length) return (
    <div className={styles.emptyTab}>
      <MIcon name="check_circle" size="2rem" color="var(--border2)" />
      <p className={styles.emptyTabTitle}>Nothing done yet today</p>
      <p className={styles.emptyTabSub}>The agent will log its actions here as it works</p>
    </div>
  )

  return (
    <div className={styles.tabList}>
      {items.map(item => {
        const meta    = ICON_META[item.type] || ICON_META.brief
        const isOpen  = expanded === item.id
        return (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardIconWrap}>
              <MIcon name={meta.icon} size="1.05rem" color={meta.color} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardTime}>{item.time}</span>
              </div>
              <p className={styles.cardDesc}>{item.desc}</p>

              {/* Why the agent did it */}
              <button
                className={styles.whyToggle}
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                <MIcon name={isOpen ? 'expand_less' : 'expand_more'} size="0.85rem" color="var(--text3)" />
                <span>{isOpen ? 'Hide reason' : 'Why did the agent do this?'}</span>
              </button>

              {isOpen && (
                <div className={styles.whyBox}>
                  <MIcon name="info" size="0.8rem" color="var(--text3)" />
                  <p className={styles.whyText}>{item.reason}</p>
                </div>
              )}

              <TagChip label={item.tag} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// UPCOMING TAB
// ─────────────────────────────────────────────────────────────
function UpcomingTab({ items, onCancel }) {
  if (!items.length) return (
    <div className={styles.emptyTab}>
      <MIcon name="schedule" size="2rem" color="var(--border2)" />
      <p className={styles.emptyTabTitle}>Nothing scheduled</p>
      <p className={styles.emptyTabSub}>Upcoming agent actions will appear here</p>
    </div>
  )

  return (
    <div className={styles.tabList}>
      {items.map(item => {
        const meta = ICON_META[item.type] || ICON_META.brief
        return (
          <div key={item.id} className={`${styles.card} ${styles.cardDashed}`}>
            <div className={styles.cardIconWrap}>
              <MIcon name={meta.icon} size="1.05rem" color={meta.color} style={{ opacity: 0.7 }} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={`${styles.cardTime} ${styles.cardTimeAccent}`}>{item.when}</span>
              </div>
              <p className={styles.cardDesc}>{item.desc}</p>
              <div className={styles.cardFooterRow}>
                <TagChip label={item.tag} />
                <button
                  className={styles.cancelBtn}
                  onClick={() => { haptic('light'); onCancel(item.id) }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DRAFTS TAB
// ─────────────────────────────────────────────────────────────
function DraftsTab({ items, onDiscard }) {
  const [expanded, setExpanded] = useState(null)
  const [copied,   setCopied]   = useState(null)

  function handleCopy(item) {
    navigator.clipboard?.writeText(item.preview).catch(() => {})
    setCopied(item.id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!items.length) return (
    <div className={styles.emptyTab}>
      <MIcon name="edit_note" size="2rem" color="var(--border2)" />
      <p className={styles.emptyTabTitle}>No drafts yet</p>
      <p className={styles.emptyTabSub}>Messages and documents the agent prepares will appear here</p>
    </div>
  )

  return (
    <div className={styles.tabList}>
      <div className={styles.draftsNote}>
        <MIcon name="info" size="0.85rem" color="var(--text3)" />
        <p>The agent never sends anything. Copy a draft and send it yourself.</p>
      </div>

      {items.map(item => {
        const meta   = ICON_META[item.type] || ICON_META.message
        const isOpen = expanded === item.id
        return (
          <div
            key={item.id}
            className={styles.card}
            style={{ cursor: 'pointer' }}
            onClick={() => setExpanded(isOpen ? null : item.id)}
          >
            <div className={styles.cardIconWrap}>
              <MIcon name={meta.icon} size="1.05rem" color={meta.color} />
            </div>
            <div className={styles.cardBody} style={{ width: '100%' }}>
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{item.title}</span>
                <MIcon
                  name="expand_more"
                  size="1rem"
                  color="var(--text3)"
                />
              </div>

              <div style={{ marginTop: 4, marginBottom: isOpen ? 0 : 2 }}>
                <TagChip label={item.tag} />
              </div>

              {isOpen && (
                <div className={styles.draftExpanded} onClick={e => e.stopPropagation()}>
                  <p className={styles.draftText}>{item.preview}</p>
                  <div className={styles.draftBtns}>
                    <button
                      className={styles.copyBtn}
                      onClick={() => handleCopy(item)}
                    >
                      <MIcon name={copied === item.id ? 'check' : 'content_copy'} size="0.85rem" color="var(--bg)" />
                      {copied === item.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      className={styles.discardBtn}
                      onClick={() => { haptic('light'); onDiscard(item.id) }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TYPING INDICATOR (for chat panel)
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
// CHAT MESSAGE (for chat panel)
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
        {isAgent && msg.actions?.length > 0 && (
          <div className={styles.msgActions}>
            {msg.actions.map((action, i) => (
              <button
                key={i}
                className={`${styles.msgActionBtn} ${action.action === 'cancel' ? styles.msgActionBtnGhost : ''}`}
                onClick={() => {
                  haptic('light')
                  if (action.action === 'navigate') onNavigate(action.payload.route)
                  else onAction(action.action, action.payload)
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
// CHAT PANEL (slides in from right)
// ─────────────────────────────────────────────────────────────
function ChatPanel({ open, onClose, messages, isTyping, isLoading, activeFlow, inputValue, setInputValue, onSend, onAction, onNavigate, onCancelFlow }) {
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350)
  }, [open])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  const showEmpty = !isLoading && messages.length === 0

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className={styles.chatBackdrop} onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`${styles.chatPanel} ${open ? styles.chatPanelOpen : ''}`}>

        {/* Chat header */}
        <div className={styles.chatPanelHeader}>
          <div>
            <p className={styles.chatPanelTitle}>Ask the Agent</p>
            <p className={styles.chatPanelSub}>Query your business or delegate tasks</p>
          </div>
          <button className={styles.chatCloseBtn} onClick={onClose}>
            <MIcon name="close" size="1.1rem" color="var(--text2)" />
          </button>
        </div>

        {/* Flow indicator inside chat */}
        {activeFlow && (
          <div className={styles.chatFlowBar}>
            <MIcon name="pending" size="0.75rem" color="var(--accent)" />
            <span className={styles.chatFlowLabel}>
              {{ add_order: 'Adding order', gen_invoice: 'Creating invoice', record_payment: 'Recording payment', add_task: 'Adding task', add_appt: 'Booking appointment' }[activeFlow.name] || 'In progress'}
            </span>
            <button className={styles.chatFlowCancel} onClick={() => { haptic('light'); onCancelFlow() }}>
              Cancel
            </button>
          </div>
        )}

        {/* Messages */}
        <div className={styles.chatMessages}>
          {isLoading && (
            <div className={styles.chatLoadingWrap}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
            </div>
          )}

          {showEmpty && !isLoading && (
            <div className={styles.chatEmpty}>
              <MIcon name="smart_toy" size="1.8rem" color="var(--text3)" />
              <p className={styles.chatEmptyTitle}>Your shop assistant</p>
              <p className={styles.chatEmptySub}>Ask me anything about your business</p>
            </div>
          )}

          {messages.map(msg => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              onAction={onAction}
              onNavigate={onNavigate}
            />
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.chatInputRow}>
          <div className={styles.chatInputWrap}>
            <MIcon name="smart_toy" size="0.9rem" color="var(--text3)" />
            <textarea
              ref={inputRef}
              className={styles.chatInputField}
              placeholder={activeFlow ? 'Type your answer...' : 'Tell me what to do...'}
              value={inputValue}
              rows={1}
              onChange={e => {
                setInputValue(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              className={`${styles.chatSendBtn} ${inputValue.trim() ? styles.chatSendBtnActive : ''}`}
              onClick={onSend}
              disabled={!inputValue.trim()}
            >
              <MIcon name="arrow_upward" size="0.85rem" color="var(--bg)" />
            </button>
          </div>
        </div>

      </div>
    </>
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
  } = useAgent()

  const {
    enabled,
    doneTasks,
    upcomingTasks,
    drafts,
    cancelUpcoming,
    discardDraft,
  } = useAutonomousAgent()

  const [tab,        setTab]        = useState('done')
  const [chatOpen,   setChatOpen]   = useState(false)
  const [inputValue, setInputValue] = useState('')

  const draftCount = drafts.length

  function handleSend() {
    const v = inputValue.trim()
    if (!v) return
    haptic('light')
    setInputValue('')
    sendMessage(v)
  }

  const handleActionBtn = useCallback((action, payload) => {
    if (action === 'navigate') { navigate(payload.route); return }
    handleAction(action, payload)
  }, [handleAction, navigate])

  const TABS = [
    { key: 'done',     label: 'Done'     },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'drafts',   label: 'Drafts',  badge: draftCount },
  ]

  return (
    <div className={styles.pageWrapper}>

      <Header
        type="back"
        title="Agent"
        onBackClick={() => navigate('/')}
        customActions={[
          {
            icon: 'chat',
            onClick: () => { haptic('light'); setChatOpen(true) },
            color: 'var(--text)',
            badge: messages.length > 0 ? null : null, // can wire unread count here later
          },
        ]}
      />

      <StatsBar />

      <AgentStatusBar enabled={enabled} doneCount={doneTasks.length} />

      {/* ── Tabs ── */}
      <div className={styles.tabRow}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnActive : ''}`}
            onClick={() => { haptic('light'); setTab(t.key) }}
          >
            {t.label}
            {t.badge > 0 && (
              <span className={styles.tabBadge}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className={styles.tabContent}>
        {tab === 'done'     && <DoneTab     items={doneTasks}    />}
        {tab === 'upcoming' && <UpcomingTab items={upcomingTasks} onCancel={cancelUpcoming} />}
        {tab === 'drafts'   && <DraftsTab   items={drafts}        onDiscard={discardDraft}  />}
      </div>

      <BottomNav />

      {/* ── Chat panel ── */}
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        isTyping={isTyping}
        isLoading={isLoading}
        activeFlow={activeFlow}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSend={handleSend}
        onAction={handleActionBtn}
        onNavigate={navigate}
        onCancelFlow={cancelFlow}
      />

    </div>
  )
}

export default Agent
