import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase/client'
import type { Database, ThemePreference, WeightUnit } from '../../../lib/supabase/types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export type ProfileUpdateInput = {
    full_name?: string | null
    preferred_weight_unit?: WeightUnit
    theme_preference?: ThemePreference
    onboarding_complete?: boolean
}

export async function ensureProfile(user: User) {
    const { data, error } = await supabase
        .from('profiles')
        .upsert(
            {
                id: user.id,
                full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
                avatar_url: user.user_metadata?.avatar_url ?? null
            },
            {
                onConflict: 'id',
                ignoreDuplicates: true
            }
        )
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function getProfile(user: User) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    if (error) {
        throw error
    }

    if (data) {
        return data
    }

    return ensureProfile(user)
}

export async function updateProfile(userId: string, values: ProfileUpdateInput) {
    const { data, error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}