import { 
  createContext, 
  useContext, 
  useEffect, 
  useState 
} from 'react'
import { useAuth } from './AuthContext'
import { 
  subscribeToAppointments, 
  addAppointment as addAppointmentToDb,
  updateAppointment as updateAppointmentInDb,
  deleteAppointment as deleteAppointmentFromDb
 } from '../services/appointmentService'


function parseApptDate(appt) {

  if (!appt.date) return null
  const str = appt.time ? `${appt.date}T${appt.time}` : `${appt.date}T00:00`
  return new Date(str)
}

function isMissed(appt) {

  if (appt.status === 'completed' || appt.status === 'cancelled') return false
  const date = parseApptDate(appt)
  if (!date) return false
  return date < new Date()
}

function isUpcoming(appt) {

  if (appt.status === 'completed' || appt.status === 'cancelled') return false
  const date = parseApptDate(appt)
  if (!date) return false
  return date >= new Date()
}

function isTodayAppt(appt) {

  const date = parseApptDate(appt)
  if (!date) return false
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isThisWeek(appt) {

  const date = parseApptDate(appt)
  if (!date) return false
  const now = new Date(); 
  now.setHours(0, 0, 0, 0)
  const end = new Date(now); 
  end.setDate(now.getDate() + 7)
  return date >= now && date <= end
}


const AppointmentContext = createContext({
  allAppointments: [],
  upcoming: [],
  todayAppointments: [],
  missed: [],
  recent: [],
  missedCount: 0,
  upcomingThisWeek: 0,
})

export function AppointmentProvider({ children }) {

  const { user } = useAuth()
  const [allAppointments, setAllAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) { 
      setLoading(false)
      setAllAppointments([]); 
      return 
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToAppointments(
      user.uid,
      (data) => setAllAppointments(data),
      (err)  => setError(err)
    )

    return unsubscribe
  }, [user])

    const addAppointment = useCallback(async (appointment) => {
  
      if (!user) return
  
      try {
        const { id, ...data } = appointment
        
        return await addAppointmentToDb(user.uid, data)
      } 
      catch (err) {
        setError(err.message)
      }
    }, [user])
  
    const updateAppointment = useCallback(async (id, updates) => {
  
      if (!user) return
  
      try {
        await updateAppointmentInDb(user.uid, String(id), updates)
      } 
      catch (err) {
        setError(err.message)
      }
    }, [user])
  
    const deleteAppointment = useCallback(async (id) => {
  
      if (!user) return
      try {
        await deleteAppointmentFromDb(user.uid, String(id))
      } 
      catch (err) {
        setError(err.message)
      }
    }, [user])
  
    const getAppointment = useCallback((id) => {
  
      return allAppointments.find(appointment => String(appointment.id) === String(id)) ?? null
    }, [allAppointments])
  


  const upcoming = allAppointments.filter(isUpcoming).sort((a, b) => {
    const da = parseApptDate(a) ?? new Date(0)
    const db = parseApptDate(b) ?? new Date(0)
    return da - db
  })

  const todayAppointments = allAppointments.filter(isTodayAppt).sort((a, b) => {
    const da = parseApptDate(a) ?? new Date(0)
    const db = parseApptDate(b) ?? new Date(0)
    return da - db
  })

  const missed = allAppointments.filter(isMissed)
  const missedCount = missed.length
  const upcomingThisWeek = allAppointments.filter(a => isUpcoming(a) && isThisWeek(a)).length

  
  const recent = allAppointments
    .filter(a => {
      const date = parseApptDate(a)
      return a.status === 'completed' || (date && dt < new Date())
    })
    .sort((a, b) => {
      const da = parseApptDate(a) ?? new Date(0)
      const db = parseApptDate(b) ?? new Date(0)
      return db - da 
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
        loading,
        error,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  )
}

export function useAppointments() {
  return useContext(AppointmentContext)
}
