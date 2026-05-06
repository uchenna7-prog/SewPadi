import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth }      from './AuthContext'
import { useProfileSettings }  from './ProfileSettingsContext'
import { useCustomers } from './CustomerContext'
import { subscribeToInvoices } from '../services/invoiceService'

const InvoiceContext = createContext()

export function InvoiceProvider({ children }) {
  const { user }      = useAuth()
  const { profileSettings }  = useProfileSettings()
  const { customers } = useCustomers()

  // ── Customisable invoice (unchanged from original) ────────
  const [currentInvoice, setCurrentInvoice] = useState(null)

  // ── Real-time all-invoices subscription ───────────────────
  const [allInvoices, setAllInvoices] = useState([])
  const unsubsRef = useRef({})

  useEffect(() => {
    Object.values(unsubsRef.current).forEach(u => u())
    unsubsRef.current = {}

    if (!user || !customers.length) {
      setAllInvoices([])
      return
    }

    const invoiceMap = {}

    customers.forEach(customer => {
      const unsub = subscribeToInvoices(
        user.uid,
        customer.id,
        (invoices) => {
          invoiceMap[customer.id] = invoices.map(inv => ({
            ...inv,
            customerName: inv.customerName || customer.name,
            customerId:   customer.id,
          }))
          const flat = Object.values(invoiceMap)
            .flat()
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() ?? 0
              const bTime = b.createdAt?.toMillis?.() ?? 0
              return bTime - aTime
            })
          setAllInvoices([...flat])
        },
        (err) => console.error('[InvoiceContext]', customer.id, err)
      )
      unsubsRef.current[customer.id] = unsub
    })

    return () => {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
    }
  }, [user, customers])

  return (
    <InvoiceContext.Provider
      value={{
        // ── Customisable invoice ──────────────────────────
        currentInvoice,
        setCurrentInvoice,
        template: profileSettings.invoiceTemplate,
        brand: {
          name:    profileSettings.brandName,
          logo:    profileSettings.brandLogo,
          colour:  profileSettings.brandColour,
          phone:   profileSettings.brandPhone,
          email:   profileSettings.brandEmail,
          address: profileSettings.brandAddress,
          website: profileSettings.brandWebsite,
          tagline: profileSettings.brandTagline,
        },
        // ── Global invoice list ───────────────────────────
        allInvoices,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

// Original hook — keeps all existing code working unchanged
export function useInvoice() {
  return useContext(InvoiceContext)
}

// Alias for components that only need allInvoices (e.g. Home)
export function useInvoices() {
  return useContext(InvoiceContext)
}
