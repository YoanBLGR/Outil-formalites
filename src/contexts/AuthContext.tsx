import React, { createContext, useContext, useState, useEffect } from 'react'
import { isAuthorizedUser } from '../config/authorized-users'

interface AuthContextType {
  user: string | null
  login: (username: string) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'formalyse_auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY)
    if (savedUser && isAuthorizedUser(savedUser)) {
      setUser(savedUser)
    } else if (savedUser) {
      // L'utilisateur était connecté mais n'est plus autorisé
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  const login = (username: string): boolean => {
    if (isAuthorizedUser(username)) {
      const normalizedUsername = username.trim().toLowerCase()
      setUser(normalizedUsername)
      localStorage.setItem(AUTH_STORAGE_KEY, normalizedUsername)
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: user !== null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

