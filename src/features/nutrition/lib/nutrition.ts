import { supabase } from '../../../lib/supabase/client'
import type { Database, NutritionGoalType } from '../../../lib/supabase/types'

export type NutritionLog = Database['public']['Tables']['nutrition_logs']['Row']

export type NutritionTarget = Database['public']['Tables']['nutrition_targets']['Row']

export type UpsertNutritionLogInput = {
    userId: string
    logDate: string
    mealCount: number
    calories?: number | null
    proteinG?: number | null
    carbsG?: number | null
    fatG?: number | null
    notes?: string | null
}

export type UpsertNutritionTargetInput = {
    userId: string
    mode: 'manual' | 'calculated'
    goalType: NutritionGoalType
    calories: number
    proteinG: number
    carbsG?: number | null
    fatG?: number | null
}

function createClientId() {
    return crypto.randomUUID()
}

function cleanOptionalNumber(value: number | null | undefined) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null
    }

    return value
}

export async function listNutritionLogs(userId: string) {
    const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('log_date', { ascending: false })
        .limit(30)

    if (error) {
        throw error
    }

    return data
}

export async function getNutritionLogForDate(userId: string, logDate: string) {
    const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', logDate)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data
}

export async function upsertNutritionLog(input: UpsertNutritionLogInput) {
    const existingLog = await getNutritionLogForDate(input.userId, input.logDate)

    if (existingLog) {
        const { data, error } = await supabase
            .from('nutrition_logs')
            .update({
                meal_count: input.mealCount,
                calories: cleanOptionalNumber(input.calories),
                protein_g: cleanOptionalNumber(input.proteinG),
                carbs_g: cleanOptionalNumber(input.carbsG),
                fat_g: cleanOptionalNumber(input.fatG),
                notes: input.notes?.trim() || null,
                version: existingLog.version + 1,
                sync_status: 'synced'
            })
            .eq('id', existingLog.id)
            .eq('user_id', input.userId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('nutrition_logs')
        .insert({
            user_id: input.userId,
            log_date: input.logDate,
            meal_count: input.mealCount,
            calories: cleanOptionalNumber(input.calories),
            protein_g: cleanOptionalNumber(input.proteinG),
            carbs_g: cleanOptionalNumber(input.carbsG),
            fat_g: cleanOptionalNumber(input.fatG),
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

export async function getActiveNutritionTarget(userId: string) {
    const { data, error } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data
}

export async function upsertNutritionTarget(input: UpsertNutritionTargetInput) {
    const currentTarget = await getActiveNutritionTarget(input.userId)

    if (currentTarget) {
        const { data, error } = await supabase
            .from('nutrition_targets')
            .update({
                mode: input.mode,
                goal_type: input.goalType,
                calories: input.calories,
                protein_g: input.proteinG,
                carbs_g: cleanOptionalNumber(input.carbsG),
                fat_g: cleanOptionalNumber(input.fatG),
                version: currentTarget.version + 1,
                sync_status: 'synced'
            })
            .eq('id', currentTarget.id)
            .eq('user_id', input.userId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('nutrition_targets')
        .insert({
            user_id: input.userId,
            mode: input.mode,
            goal_type: input.goalType,
            calories: input.calories,
            protein_g: input.proteinG,
            carbs_g: cleanOptionalNumber(input.carbsG),
            fat_g: cleanOptionalNumber(input.fatG),
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

export async function deleteNutritionLog(userId: string, logId: string) {
    const { data, error } = await supabase
        .from('nutrition_logs')
        .update({
            deleted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('id', logId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}