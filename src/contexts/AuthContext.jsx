import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { 
  signup,
  login,
  logout,
  resetPassword, 
  changePassword,
  changeEmail 
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={
      { 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      resetPassword, 
      changePassword, 
      changeEmail 
      }
    }>

      {!loading && children}
      
    </AuthContext.Provider>
  )
}

export function useAuth() {

  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')

  return ctx
}

