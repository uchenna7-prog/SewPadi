import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth }      from './AuthContext'
import { useCustomers } from './CustomerContext'
import { subscribeToReceipts } from '../services/receiptService'

const ReceiptContext = createContext()

export function ReceiptProvider({ children }) {
  const { user }      = useAuth()
  const { customers } = useCustomers()

  const [allReceipts, setAllReceipts] = useState([])
  const unsubsRef = useRef({})

  useEffect(() => {
    Object.values(unsubsRef.current).forEach(u => u())
    unsubsRef.current = {}

    if (!user || !customers.length) {
      setAllReceipts([])
      return
    }

    const receiptMap = {}

    customers.forEach(customer => {
      const unsub = subscribeToReceipts(
        user.uid,
        customer.id,
        (receipts) => {
          receiptMap[customer.id] = receipts.map(rec => ({
            ...rec,
            customerName: rec.customerName || customer.name,
            customerId:   customer.id,
          }))
          const flat = Object.values(receiptMap)
            .flat()
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() ?? 0
              const bTime = b.createdAt?.toMillis?.() ?? 0
              return bTime - aTime
            })
          setAllReceipts([...flat])
        },
        (err) => console.error('[ReceiptContext]', customer.id, err)
      )
      unsubsRef.current[customer.id] = unsub
    })

    return () => {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
    }
  }, [user, customers])

  return (
    <ReceiptContext.Provider value={{ allReceipts }}>
      {children}
    </ReceiptContext.Provider>
  )
}

export function useReceipts() {
  return useContext(ReceiptContext)
}