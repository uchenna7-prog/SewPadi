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

  const login = (email, password) => login(email, password)
  const signup = (email, password) => signup(auth, email, password)
  const resetPassword = (email) => resetPassword(email)
  const changePassword = (user,newPassword) => changePassword(user,newPassword)
  const changeEmail = (user,newEmail) => changeEmail(user,newEmail)
  const logout = () => logout()


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

