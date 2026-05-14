import { supabase } from '../../../lib/supabase/client'
import type { Database, WeightUnit } from '../../../lib/supabase/types'
import { convertWeightForStorage } from '../../../lib/utils/units'

export type BodyweightEntry = Database['public']['Tables']['bodyweight_entries']['Row']

export type CreateBodyweightEntryInput = {
    userId: string
    entryDate: string
    weight: number
    unit: WeightUnit
    notes?: string | null
}

export type UpdateBodyweightEntryInput = CreateBodyweightEntryInput & {
    entryId: string
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
    const weightKg = convertWeightForStorage(input.weight, input.unit, 'kg')

    const { data: existingEntry, error: existingEntryError } = await supabase
        .from('bodyweight_entries')
        .select('*')
        .eq('user_id', input.userId)
        .eq('entry_date', input.entryDate)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (existingEntryError) {
        throw existingEntryError
    }

    if (existingEntry) {
        const { data, error } = await supabase
            .from('bodyweight_entries')
            .update({
                weight_kg: weightKg,
                notes: input.notes?.trim() || null,
            })
            .eq('user_id', input.userId)
            .eq('id', existingEntry.id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

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

export async function updateBodyweightEntry(input: UpdateBodyweightEntryInput) {
    const weightKg = convertWeightForStorage(input.weight, input.unit, 'kg')

    const { data, error } = await supabase
        .from('bodyweight_entries')
        .update({
            entry_date: input.entryDate,
            weight_kg: weightKg,
            notes: input.notes?.trim() || null,
        })
        .eq('id', input.entryId)
        .eq('user_id', input.userId)
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
