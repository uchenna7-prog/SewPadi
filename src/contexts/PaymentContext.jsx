import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { subscribeToPayments } from '../services/paymentService'

const PaymentContext = createContext(null)

export function PaymentProvider({ children }) {
  const { user } = useAuth()

  const [allPayments, setAllPayments] = useState([])

  useEffect(() => {
    if (!user) {
      setAllPayments([])
      return
    }
    return subscribeToPayments(user.uid, setAllPayments)
  }, [user])

  return (
    <PaymentContext.Provider value={{ allPayments }}>
      {children}
    </PaymentContext.Provider>
  )
}

export function usePayments() {
  return useContext(PaymentContext)
}