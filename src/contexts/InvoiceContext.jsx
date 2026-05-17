import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useAuth }           from './AuthContext'
import { useProfileSettings } from './ProfileSettingsContext'
import { subscribeToInvoices } from '../services/invoiceService'

const InvoiceContext = createContext(null)

export function InvoiceProvider({ children }) {
  const { user }            = useAuth()
  const { profileSettings } = useProfileSettings()

  const [allInvoices, setAllInvoices]       = useState([])
  const [currentInvoice, setCurrentInvoice] = useState(null)

  useEffect(() => {
    if (!user) {
      setAllInvoices([])
      return
    }
    return subscribeToInvoices(user.uid, setAllInvoices)
  }, [user])

  const brandInfos = {
    name:    profileSettings.brandName,
    logo:    profileSettings.brandLogo,
    colour:  profileSettings.brandColour,
    phone:   profileSettings.brandPhone,
    email:   profileSettings.brandEmail,
    address: profileSettings.brandAddress,
    website: profileSettings.brandWebsite,
    tagline: profileSettings.brandTagline,
  }

  return (
    <InvoiceContext.Provider value={{
      allInvoices,
      currentInvoice,
      setCurrentInvoice,
      template: profileSettings.invoiceTemplate,
      brandInfos,
    }}>
      {children}
    </InvoiceContext.Provider>
  )
}

export function useInvoice() {
  return useContext(InvoiceContext)
}

export function useInvoices() {
  return useContext(InvoiceContext)
}