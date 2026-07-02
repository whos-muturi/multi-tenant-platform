import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { createClient, getClient, isUserAdmin } from '@/lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [clientData,  setClientData]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [isAdmin,     setIsAdmin]     = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Check if user is admin
        const adminStatus = await isUserAdmin(firebaseUser.uid)
        setIsAdmin(adminStatus)

        // Load or create client record
        try {
          let client = await getClient(firebaseUser.uid)
          if (!client) {
            await createClient(firebaseUser.uid, {
              businessName: firebaseUser.displayName,
              email:        firebaseUser.email,
            })
            client = await getClient(firebaseUser.uid)
          }
          setClientData(client)
        } catch (err) {
          console.error('[Auth] Failed to load client:', err)
        }
      } else {
        setUser(null)
        setClientData(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }

  async function logout() {
    await signOut(auth)
  }

  async function refreshClient() {
    if (!user) return
    const client = await getClient(user.uid)
    setClientData(client)
  }

  const value = {
    user,
    clientData,
    loading,
    isAdmin,
    signInWithGoogle,
    logout,
    refreshClient,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
