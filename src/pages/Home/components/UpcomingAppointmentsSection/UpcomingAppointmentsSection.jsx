import { SectionHeader } from "../SectionHeader/SectionHeader"
import { MetaRow } from "../MetaRow/MetaRow"
import { formatApptDate } from "../../utils"
import { APPOINTMENT_STATUS_COLORS,APPOINTMENT_TYPE_ICONS } from "../../../../datas/appointmentDatas"
import styles from "./UpcomingAppointmentsSection.module.css"


export function UpcomingAppointmentsSection({ appointments, todayAppointments, onSeeAll }) {
  return (

    <section className={styles.section}>

      <SectionHeader title="Upcoming Appointments" onSeeAll={onSeeAll} />

      <div className={styles.listSection}>

        <div className={styles.listDivider} />
        {appointments.map((appt, index) => {

          const isLast = index === appointments.length - 1
          const isToday = todayAppointments.some(appointment => appointment.id === appt.id)
          const icon = APPOINTMENT_TYPE_ICONS[appt.type] || 'event'
          const iconColor = APPOINTMENT_STATUS_COLORS[appt.status] || '#818cf8'
          const todayStyle = isToday
            ? { borderColor: 'rgba(6,182,212,0.35)', background: 'rgba(6,182,212,0.05)' }
            : {}

          return (
            <div key={appt.id} className={`${styles.listItem} ${isLast ? styles.listItemLast : ''}`}>

              <div className={styles.listOuter} style={todayStyle}>

                <div className={styles.listInner}>
                  <span className="mi" style={{ fontSize: '1.3rem', color: iconColor }}>{icon}</span>
                </div>

              </div>

              <div className={styles.listInfo}>

                <div className={styles.listDesc}>{appt.title || appt.type || 'Appointment'}</div>
                {appt.customerName && <MetaRow icon="person" text={appt.customerName}  />}
                <MetaRow icon="schedule" text={formatApptDate(appt.date, appt.time)}  />
                {isToday && <div className={styles.listApptToday}>Today</div>}
                
              </div>

            </div>
          )
        })}
      </div>
    </section>
  )
}

