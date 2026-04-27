import { createContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase/client'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
    session: Session | null
    user: User | null
    status: AuthStatus
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [session, setSession] = useState<Session | null>(null)
    const [status, setStatus] = useState<AuthStatus>('loading')

    useEffect(() => {
        let isMounted = true

        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) {
                return
            }

            setSession(data.session)
            setStatus(data.session ? 'authenticated' : 'unauthenticated')
        })

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession)
            setStatus(nextSession ? 'authenticated' : 'unauthenticated')
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            user: session?.user ?? null,
            status
        }),
        [session, status]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}