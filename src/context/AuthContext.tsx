import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AppRole = 'worker' | 'manager' | 'admin' | 'owner' | 'accountant'
export interface AuthUser {
  id: string
  email: string
  name: string
  role: AppRole
  workerId: string | null
}
interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const roles: AppRole[] = ['worker', 'manager', 'admin', 'owner', 'accountant']

async function mapUser(user: User): Promise<AuthUser> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, role, worker_id')
    .eq('id', user.id)
    .single()

  if (error) throw error

  const role = roles.includes(profile.role) ? profile.role : 'worker'
  const name =
    profile.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  return {
    id: user.id,
    email: user.email ?? '',
    name,
    role,
    workerId: profile.worker_id ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let version = 0
    const syncUser = async (nextUser: User | undefined) => {
      const request = ++version
      try {
        const mappedUser = nextUser ? await mapUser(nextUser) : null
        if (active && request === version) setUser(mappedUser)
      } catch {
        if (active && request === version) setUser(null)
      } finally {
        if (active && request === version) setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      void syncUser(data.session?.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Leave the Auth callback before starting a request that needs the session lock.
        setTimeout(() => {
          if (active) void syncUser(session?.user)
        }, 0)
      },
    )
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Auth hook is colocated so the provider and consumer share one private context.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
