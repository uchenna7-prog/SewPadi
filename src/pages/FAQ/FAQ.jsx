import { useState } from 'react'
import Header from '../../components/Header/Header'
import styles from './FAQ.module.css'
import BottomNav from '../../components/BottomNav/BottomNav'

// ─────────────────────────────────────────────────────────────
// FAQ data
// ─────────────────────────────────────────────────────────────

const FAQS = [
  {
    category: 'Getting Started',
    icon: 'rocket_launch',
    items: [
      {
        q: 'What is SewPadi?',
        a: 'SewPadi is a mobile CRM built specifically for tailors and fashion designers. It helps you manage customers, track measurements, create invoices, assign tasks, and grow your business — all from your phone.',
      },
      {
        q: 'Do I need to create an account to use SewPadi?',
        a: 'You can use SewPadi without an account. Your data is saved locally on your device. An account will be required in a future update to enable cloud sync and backup across devices.',
      },
      {
        q: 'Is my data safe if I uninstall the app?',
        a: 'Currently, data is stored on your device. If you uninstall or clear the app data, your records will be lost. We recommend exporting your data regularly. Cloud backup is coming soon with SewPadi Pro.',
      },
    ],
  },
  {
    category: 'Customers',
    icon: 'people',
    items: [
      {
        q: 'How do I add a new customer?',
        a: 'Go to the Customers page and tap the + button at the bottom right. Fill in the customer\'s name, phone number, and any other details. You can also add measurements directly from the customer\'s profile.',
      },
      {
        q: 'Can I store multiple measurements for one customer?',
        a: 'Yes. Each customer has a dedicated profile where you can save a full set of body measurements. You can update these measurements at any time as the customer\'s size changes.',
      },
      {
        q: 'Can I contact a customer directly from the app?',
        a: 'Yes. On the customer detail page, tap the phone or WhatsApp icon to call or send a WhatsApp message directly to the customer without leaving SewPadi.',
      },
    ],
  },
  {
    category: 'Orders & Tasks',
    icon: 'shopping_bag',
    items: [
      {
        q: 'How do I track an order?',
        a: 'On the Orders page, each order shows its current status — Pending, In Progress, Ready, or Delivered. Tap any order to update its status, add notes, or link it to a customer.',
      },
      {
        q: 'What is the Tasks page for?',
        a: 'Tasks are individual to-dos tied to your work — like "Cut fabric for Chidi" or "Pick up buttons". You can set due dates and mark tasks as complete. Overdue tasks can trigger a notification if enabled in Settings.',
      },
      {
        q: 'Can I link a task to a specific customer or order?',
        a: 'Yes. When creating or editing a task, you can associate it with a customer. This helps you keep track of work tied to specific people.',
      },
    ],
  },
  {
    category: 'Invoices',
    icon: 'receipt_long',
    items: [
      {
        q: 'How do I create an invoice?',
        a: 'Go to a customer\'s profile or the Orders page and tap "Create Invoice". Fill in the line items, quantities, and prices. The invoice will automatically use your brand name, colour, and logo if set in your Profile.',
      },
      {
        q: 'Can I customise how my invoice looks?',
        a: 'Yes — this is a Pro feature. With SewPadi Pro you can choose from multiple invoice templates, set your brand colour, upload your logo, add a custom footer message, and configure tax lines.',
      },
      {
        q: 'Can I share or print an invoice?',
        a: 'Yes. Once an invoice is generated you can share it as a PDF via WhatsApp, email, or any other app on your phone. Printing is also supported through your device\'s share sheet.',
      },
      {
        q: 'What currency does SewPadi use?',
        a: 'The default currency is Naira (₦). You can change this to Dollars, Pounds, or Euros in Settings → Invoice Settings (Pro feature).',
      },
    ],
  },
  {
    category: 'Gallery',
    icon: 'photo_library',
    items: [
      {
        q: 'What is the Gallery for?',
        a: 'The Gallery is your personal portfolio of completed work. Add photos of finished garments to build a visual record you can show to new customers or share on social media.',
      },
      {
        q: 'Can I link a gallery photo to a customer?',
        a: 'Yes. When adding a photo to the Gallery, you can tag it with a customer\'s name so you can easily find all work done for a specific person.',
      },
    ],
  },
  {
    category: 'SewPadi Pro',
    icon: 'workspace_premium',
    items: [
      {
        q: 'What do I get with SewPadi Pro?',
        a: 'Pro unlocks invoice customisation (templates, brand colour, logo, tax lines, custom footer), branded PDF exports, priority support, and all future premium features as they are released.',
      },
      {
        q: 'How do I upgrade to Pro?',
        a: 'Tap "Upgrade to Pro" on your Profile page or in the Invoice section of Settings. Payment is processed securely and your Pro features are activated immediately.',
      },
      {
        q: 'Can I cancel my Pro subscription?',
        a: 'Yes. You can cancel at any time. Your Pro features will remain active until the end of your current billing period, after which your account reverts to the free plan.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    icon: 'build',
    items: [
      {
        q: 'The app is showing a blank screen. What do I do?',
        a: 'Try closing and reopening the app. If the issue persists, clear the app cache in your phone settings. If you still see a blank screen, please contact us via the Contact page so we can help you.',
      },
      {
        q: 'I accidentally deleted a customer. Can I recover them?',
        a: 'Unfortunately, deleted data cannot be recovered at this time. This is why we recommend exporting your data regularly. Cloud backup with undo support is planned for a future update.',
      },
      {
        q: 'My measurements are showing in the wrong unit. How do I fix this?',
        a: 'Go to Settings → Measurements and switch to your preferred unit (Inches, Centimetres, or Yards). Note that existing measurements are stored as numbers — changing the unit label does not convert the values automatically.',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Accordion item
// ─────────────────────────────────────────────────────────────

function AccordionItem({ q, a, isOpen, onToggle, divider = true }) {
  return (
    <div className={`${styles.item} ${!divider ? styles.noDivider : ''}`}>
      <button className={styles.itemHeader} onClick={onToggle}>
        <span className={styles.itemQ}>{q}</span>
        <span className={`mi ${styles.itemChevron} ${isOpen ? styles.itemChevronOpen : ''}`}>
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className={styles.itemBody}>
          <p className={styles.itemA}>{a}</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main FAQ page
// ─────────────────────────────────────────────────────────────

export default function FAQ({ onMenuClick }) {
  const [openKey, setOpenKey] = useState(null)
  const [search,  setSearch]  = useState('')

  const toggle = key => setOpenKey(prev => prev === key ? null : key)
  const query = search.trim().toLowerCase()

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query)
    ),
  })).filter(cat => cat.items.length > 0)

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} title="FAQs" />

      <div className={styles.scrollArea}>

        <p className={styles.pageSub}>Frequently asked questions about SewPadi.</p>

        {/* ── SEARCH ── */}
        <div className={styles.searchPadding}>
          <div className={styles.searchWrap}>
            <span className={`mi ${styles.searchIcon}`}>search</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <span className="mi" style={{ fontSize: '1rem' }}>close</span>
              </button>
            )}
          </div>
        </div>

        {/* ── CATEGORIES ── */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--text3)' }}>search_off</span>
            <p className={styles.emptyText}>No results for "{search}"</p>
          </div>
        ) : (
          filtered.map((cat, ci) => (
            <div key={cat.category}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}>
                  <span className="mi" style={{ fontSize: '1rem' }}>{cat.icon}</span>
                </div>
                <span className={styles.sectionLabel}>{cat.category}</span>
              </div>

              {cat.items.map((item, ii) => {
                const key = `${ci}-${ii}`
                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                    divider={ii < cat.items.length - 1}
                  />
                )
              })}
            </div>
          ))
        )}

        {/* ── FOOTER CTA ── */}
        {!query && (
          <div className={styles.footerPadding}>
            <div className={styles.footerCta}>
              <span className="mi" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>support_agent</span>
              <div className={styles.footerCtaText}>
                <div className={styles.footerCtaTitle}>Still have questions?</div>
                <div className={styles.footerCtaSub}>Reach out via the Contact page — we're happy to help.</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
      <BottomNav></BottomNav>
    </div>
  )
}
