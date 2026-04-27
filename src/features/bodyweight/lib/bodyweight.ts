import { supabase } from '../../../lib/supabase/client'
import type { Database, WeightUnit } from '../../../lib/supabase/types'
import { convertWeight } from '../../../lib/utils/units'

export type BodyweightEntry = Database['public']['Tables']['bodyweight_entries']['Row']

export type CreateBodyweightEntryInput = {
    userId: string
    entryDate: string
    weight: number
    unit: WeightUnit
    notes?: string | null
}

function createClientId() {
    return crypto.randomUUID()
}

export async function listBodyweightEntries(userId: string) {
    const { data, error } = await supabase
        .from('bodyweight_entries')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('entry_date', { ascending: false })
        .limit(30)

    if (error) {
        throw error
    }

    return data
}

export async function createBodyweightEntry(input: CreateBodyweightEntryInput) {
    const weightKg = convertWeight(input.weight, input.unit, 'kg')

    const { data, error } = await supabase
        .from('bodyweight_entries')
        .insert({
            user_id: input.userId,
            entry_date: input.entryDate,
            weight_kg: weightKg,
            notes: input.notes?.trim() || null,
            client_id: createClientId(),
            sync_status: 'synced'
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteBodyweightEntry(entryId: string, userId: string) {
    const { data, error } = await supabase
        .from('bodyweight_entries')
        .update({
            deleted_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}