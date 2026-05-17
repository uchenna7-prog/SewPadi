import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth }      from './AuthContext'
import { useCustomers } from './CustomerContext'
import { subscribeToPayments } from '../services/paymentService'

const PaymentContext = createContext({ allPayments: [] })

export function PaymentProvider({ children }) {
  const { user }      = useAuth()
  const { customers } = useCustomers()

  const [allPayments, setAllPayments] = useState([])
  const unsubsRef = useRef({})

  useEffect(() => {
    Object.values(unsubsRef.current).forEach(u => u())
    unsubsRef.current = {}

    if (!user || !customers.length) {
      setAllPayments([])
      return
    }

    const paymentMap = {}

    customers.forEach(customer => {
      const unsub = subscribeToPayments(
        user.uid,
        customer.id,
        (payments) => {
          paymentMap[customer.id] = payments.map(p => ({
            ...p,
            customerName: customer.name,
            customerId:   customer.id,
          }))
          const flat = Object.values(paymentMap)
            .flat()
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() ?? 0
              const bTime = b.createdAt?.toMillis?.() ?? 0
              return bTime - aTime
            })
          setAllPayments([...flat])
        },
        (err) => console.error('[PaymentContext]', customer.id, err)
      )
      unsubsRef.current[customer.id] = unsub
    })

    return () => {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
    }
  }, [user, customers])

  return (
    <PaymentContext.Provider value={{ allPayments }}>
      {children}
    </PaymentContext.Provider>
  )
}

export function usePayments() {
  return useContext(PaymentContext)
}
