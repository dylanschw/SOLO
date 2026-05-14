import { supabase } from '../../../lib/supabase/client'
import type { Database, GoalMetric, GoalPeriod } from '../../../lib/supabase/types'

export type GoalTarget = Database['public']['Tables']['goal_targets']['Row']

export type UpsertGoalTargetInput = {
    userId: string
    metric: GoalMetric
    targetValue: number
    unit: string
    period: GoalPeriod
    targetDate?: string | null
    notes?: string | null
}

function createClientId() {
    return crypto.randomUUID()
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
}

export async function listGoalTargets(userId: string) {
    const { data, error } = await supabase
        .from('goal_targets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('metric', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function upsertGoalTarget(input: UpsertGoalTargetInput) {
    const { data: existingGoal, error: existingGoalError } = await supabase
        .from('goal_targets')
        .select('*')
        .eq('user_id', input.userId)
        .eq('metric', input.metric)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

    if (existingGoalError) {
        throw existingGoalError
    }

    if (existingGoal) {
        const { data, error } = await supabase
            .from('goal_targets')
            .update({
                target_value: input.targetValue,
                unit: input.unit,
                period: input.period,
                target_date: input.targetDate ?? null,
                notes: cleanText(input.notes),
                version: existingGoal.version + 1,
                sync_status: 'synced',
            })
            .eq('id', existingGoal.id)
            .eq('user_id', input.userId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('goal_targets')
        .insert({
            user_id: input.userId,
            metric: input.metric,
            target_value: input.targetValue,
            unit: input.unit,
            period: input.period,
            target_date: input.targetDate ?? null,
            notes: cleanText(input.notes),
            is_active: true,
            client_id: createClientId(),
            sync_status: 'synced',
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export function findGoalTarget(goals: GoalTarget[] | null | undefined, metric: GoalMetric) {
    return goals?.find((goal) => goal.metric === metric && goal.is_active && !goal.deleted_at) ?? null
}
