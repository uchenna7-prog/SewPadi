import styles from './Contact.module.css'
import Header from '../../components/Header/Header'
import BottomNav from '../../components/BottomNav/BottomNav'

const CONTACT = {
  whatsapp:     '+234 9079116980',
  phone:        '+234 9079116980',
  email:        'support@SewPadi.app',
  website:      'www.SewPadi.app',
  businessName: 'Tailor Flow',
  billingName:  'Tailor Flow Technologies',
  address:      'Choba Uniport',
}

function ContactRow({ icon, label, value, href, divider = true }) {
  const inner = (
    <div
      className={`${styles.row} ${href ? styles.rowLink : ''} ${!divider ? styles.noDivider : ''}`}
    >
      <div className={styles.rowIcon}>
        <span className="mi" style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div className={styles.rowText}>
        {label && <div className={styles.rowLabel}>{label}</div>}
        <div className={href ? styles.rowValueLink : styles.rowValue}>{value}</div>
      </div>
      {href && (
        <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>open_in_new</span>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles.anchor}>
        {inner}
      </a>
    )
  }
  return inner
}

function InfoRow({ label, value, divider = true }) {
  return (
    <div className={`${styles.row} ${!divider ? styles.noDivider : ''}`}>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        <div className={styles.rowValue}>{value}</div>
      </div>
    </div>
  )
}

export default function Contact({ onMenuClick }) {
  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} title="Contact Us" />

      <div className={styles.scrollArea}>

        {/* ── PAGE DESCRIPTION ── */}
        <p className={styles.pageSub}>
          Reach out for support, feedback, or any questions about Tailor Flow.
        </p>

        {/* ── QUICK CONTACT ── */}
        <ContactRow
          icon="chat"
          label="WhatsApp"
          value={CONTACT.whatsapp}
          href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, '')}`}
        />
        <ContactRow
          icon="call"
          label="Phone"
          value={CONTACT.phone}
          href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
        />
        <ContactRow
          icon="mail"
          label="Email"
          value={CONTACT.email}
          href={`mailto:${CONTACT.email}`}
        />
        <ContactRow
          icon="language"
          label="Website"
          value={CONTACT.website}
          href={`https://${CONTACT.website}`}
          divider={false}
        />

        {/* ── BUSINESS INFO ── */}
        <div className={styles.sectionHeader}>
          <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>business</span>
          <span className={styles.sectionLabel}>Business Info</span>
        </div>
        
        <InfoRow label="Business name" value={CONTACT.businessName} />
        <InfoRow label="Billing name"  value={CONTACT.billingName} />
        <InfoRow label="Address"       value={CONTACT.address} divider={false} />

        <div style={{ height: 40 }} />
      </div>
      <BottomNav></BottomNav>
    </div>
  )
}
