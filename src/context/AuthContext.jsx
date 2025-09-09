import React, { createContext, useState, useEffect, useContext } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Al cargar la app, limpiar la sesión para forzar logout tras reinicio del servidor
  useEffect(() => {
    // Inicializamos el usuario desde localStorage si existe.
    // Nota: anteriormente forzábamos logout al arrancar; eso evita que el menú aparezca después del login.
    try {
      const stored = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      if (stored && token) {
        const parsed = JSON.parse(stored)
        console.log('[Auth] init - restoring user from localStorage', parsed)
        setUser(parsed)
      } else {
        console.log('[Auth] init - no valid stored session')
        // Ensure no leftover token/user remains
        try { localStorage.removeItem('user'); localStorage.removeItem('token') } catch {}
        setUser(null)
      }
    } catch (e) {
      console.log('[Auth] init - error reading localStorage', e)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Función para iniciar sesión
  const login = (userData) => {
    console.log('[Auth] login called with:', userData)
    setUser(userData)
    try {
      localStorage.setItem('user', JSON.stringify(userData))
      if (userData && userData.token) localStorage.setItem('token', userData.token)
    } catch (e) {
      console.log('[Auth] login - error storing user', e)
    }
  }
  
  // Función para cerrar sesión
  const logout = () => {
  console.log('[Auth] logout')
  setUser(null)
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  }
  
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para acceder al contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

export default AuthContext
