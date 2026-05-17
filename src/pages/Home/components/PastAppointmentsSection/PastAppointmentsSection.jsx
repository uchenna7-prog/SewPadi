import { MetaRow } from "../MetaRow/MetaRow"
import { formatApptDate } from "../../utils"
import { SectionHeader } from "../SectionHeader/SectionHeader"
import { APPOINTMENT_TYPE_ICONS } from "../../../../datas/appointmentDatas"
import styles from "./PastAppointmentsSection.module.css"


export function PastAppointmentsSection({ appointments, onSeeAll}) {
  return (

    <section className={styles.section}>

      <SectionHeader title="Recent Appointments" onSeeAll={onSeeAll} />

      <div className={styles.listSection}>
        <div className={styles.listDivider} />
        {appointments.map((appt, index) => {
          const isLast = index === appointments.length - 1

          const statusColor = appt.status === 'completed' ? '#15803d'
                            : appt.status === 'cancelled' ? '#94a3b8'
                            : '#ef4444'

          const outerStyle = appt.status === 'completed'
            ? { borderColor: 'rgba(21,128,61,0.3)',  background: 'rgba(21,128,61,0.04)' }
            : appt.status === 'cancelled'
            ? { borderColor: 'rgba(148,163,184,0.3)' }
            : { borderColor: 'rgba(239,68,68,0.3)',  background: 'rgba(239,68,68,0.04)' }

          const statusLabel = appt.status === 'completed' ? 'Completed'
                            : appt.status === 'cancelled' ? 'Cancelled'
                            : 'Missed'

          return (
            <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>

              <div className={styles.listOuter} style={outerStyle}>

                <div className={styles.listInner}>

                  <span className="mi" style={{ fontSize: '1.3rem', color: statusColor }}>
                    {APPOINTMENT_TYPE_ICONS[appt.type] || 'event'}
                  </span>

                </div>

              </div>

              <div className={styles.listInfo}>

                <div className={styles.listDesc}>{appt.title || appt.type || 'Appointment'}</div>
                {appt.customerName && <MetaRow icon="person" text={appt.customerName} />}
                <MetaRow
                  icon="schedule"
                  text={formatApptDate(appt.date, appt.time)}
                  textStyle={appt.status === 'missed' ? { color: '#ef4444' } : undefined}
                />
                <div
                  className={styles.listApptStatus}
                  style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}12` }}
                >
                  {statusLabel}
                </div>

              </div>

            </div>
          )
        })}
      </div>
      
    </section>
  )
}
