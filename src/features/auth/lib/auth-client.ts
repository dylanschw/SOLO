import { supabase } from '../../../lib/supabase/client'
import { getAuthCallbackUrl } from './redirects'

export type AuthMode = 'sign-in' | 'sign-up'

type PasswordAuthInput = {
    email: string
    password: string
    fullName?: string
}

export async function signUpWithPassword({ email, password, fullName }: PasswordAuthInput) {
    return supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: getAuthCallbackUrl(),
            data: {
                full_name: fullName
            }
        }
    })
}

export async function signInWithPassword({ email, password }: PasswordAuthInput) {
    return supabase.auth.signInWithPassword({
        email,
        password
    })
}

export async function signOut() {
    return supabase.auth.signOut()
}