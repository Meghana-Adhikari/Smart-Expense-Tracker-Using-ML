import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false))
  }, [])

  const authenticate = useCallback(async (path, payload) => {
    const { data } = await api.post(`/auth/${path}`, payload)
    localStorage.setItem('token', data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* token may already be invalid */ }
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login: (p) => authenticate('login', p), register: (p) => authenticate('register', p), logout }}>
      {children}
    </AuthContext.Provider>
  )
}
