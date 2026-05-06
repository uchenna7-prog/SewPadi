import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { subscribeToAppointments } from '../services/appointmentService'

// ── Helpers ───────────────────────────────────────────────────

function parseApptDate(appt) {
  // appointments store date as 'YYYY-MM-DD' and time as 'HH:MM'
  if (!appt.date) return null
  const str = appt.time ? `${appt.date}T${appt.time}` : `${appt.date}T00:00`
  return new Date(str)
}

function isMissed(appt) {
  if (appt.status === 'completed' || appt.status === 'cancelled') return false
  const dt = parseApptDate(appt)
  if (!dt) return false
  return dt < new Date()
}

function isUpcoming(appt) {
  if (appt.status === 'completed' || appt.status === 'cancelled') return false
  const dt = parseApptDate(appt)
  if (!dt) return false
  return dt >= new Date()
}

function isTodayAppt(appt) {
  const dt = parseApptDate(appt)
  if (!dt) return false
  const now = new Date()
  return (
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth()    === now.getMonth()    &&
    dt.getDate()     === now.getDate()
  )
}

function isThisWeek(appt) {
  const dt = parseApptDate(appt)
  if (!dt) return false
  const now   = new Date(); now.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setDate(now.getDate() + 7)
  return dt >= now && dt <= end
}

// ─────────────────────────────────────────────────────────────

const AppointmentContext = createContext({
  allAppointments:   [],
  upcoming:          [],
  todayAppointments: [],
  missed:            [],
  recent:            [],
  missedCount:       0,
  upcomingThisWeek:  0,
})

export function AppointmentProvider({ children }) {
  const { user } = useAuth()
  const [allAppointments, setAllAppointments] = useState([])

  useEffect(() => {
    if (!user) { setAllAppointments([]); return }

    const unsub = subscribeToAppointments(
      user.uid,
      (data) => setAllAppointments(data),
      (err)  => console.error('[AppointmentContext]', err)
    )

    return unsub
  }, [user])

  // ── Derived slices ────────────────────────────────────────
  const upcoming          = allAppointments.filter(isUpcoming).sort((a, b) => {
    const da = parseApptDate(a) ?? new Date(0)
    const db = parseApptDate(b) ?? new Date(0)
    return da - db
  })

  const todayAppointments = allAppointments.filter(isTodayAppt).sort((a, b) => {
    const da = parseApptDate(a) ?? new Date(0)
    const db = parseApptDate(b) ?? new Date(0)
    return da - db
  })

  const missed            = allAppointments.filter(isMissed)
  const missedCount       = missed.length
  const upcomingThisWeek  = allAppointments.filter(a => isUpcoming(a) && isThisWeek(a)).length

  // Past appointments (completed or whose datetime has passed), newest first
  const recent = allAppointments
    .filter(a => {
      const dt = parseApptDate(a)
      return a.status === 'completed' || (dt && dt < new Date())
    })
    .sort((a, b) => {
      const da = parseApptDate(a) ?? new Date(0)
      const db = parseApptDate(b) ?? new Date(0)
      return db - da   // newest first
    })

  return (
    <AppointmentContext.Provider
      value={{
        allAppointments,
        upcoming,
        todayAppointments,
        missed,
        recent,
        missedCount,
        upcomingThisWeek,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  )
}

export function useAppointments() {
  return useContext(AppointmentContext)
}
