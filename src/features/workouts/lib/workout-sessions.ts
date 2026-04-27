import { supabase } from '../../../lib/supabase/client'
import type { Database, LoggedSetType, WeightUnit } from '../../../lib/supabase/types'
import { convertWeight } from '../../../lib/utils/units'

export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']

export type StartWorkoutSessionInput = {
    userId: string
    programId: string
    workoutDayId: string
}

export type CreateWorkoutSetInput = {
    userId: string
    workoutSessionId: string
    plannedExerciseId: string | null
    exerciseId: string
    setNumber: number
    setType: LoggedSetType
    weight: number | null
    weightUnit: WeightUnit
    reps: number | null
    rpe: number | null
    notes?: string | null
    clientId?: string
}

function createClientId() {
    return crypto.randomUUID()
}

function todayDate() {
    return new Date().toISOString().slice(0, 10)
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
}

function cleanOptionalNumber(value: number | null | undefined) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null
    }

    return value
}

export async function startWorkoutSession(input: StartWorkoutSessionInput) {
    const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
            user_id: input.userId,
            program_id: input.programId,
            workout_day_id: input.workoutDayId,
            session_date: todayDate(),
            started_at: new Date().toISOString(),
            status: 'in_progress',
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

export async function listWorkoutSessions(userId: string) {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('started_at', { ascending: false, nullsFirst: false })
        .limit(20)

    if (error) {
        throw error
    }

    return data
}

export async function listWorkoutSets(userId: string, sessionId: string | null) {
    if (!sessionId) {
        return []
    }

    const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_session_id', sessionId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function createWorkoutSet(input: CreateWorkoutSetInput) {
    const weightKg =
        input.weight === null ? null : convertWeight(input.weight, input.weightUnit, 'kg')

    const { data, error } = await supabase
        .from('workout_sets')
        .insert({
            user_id: input.userId,
            workout_session_id: input.workoutSessionId,
            planned_exercise_id: input.plannedExerciseId,
            exercise_id: input.exerciseId,
            set_number: input.setNumber,
            set_type: input.setType,
            weight_kg: weightKg,
            reps: cleanOptionalNumber(input.reps),
            rpe: cleanOptionalNumber(input.rpe),
            completed: true,
            notes: cleanText(input.notes),
            client_id: input.clientId ?? createClientId(),
            sync_status: 'synced'
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function completeWorkoutSession(userId: string, sessionId: string, notes?: string | null) {
    const { data, error } = await supabase
        .from('workout_sessions')
        .update({
            completed_at: new Date().toISOString(),
            status: 'completed',
            notes: cleanText(notes)
        })
        .eq('user_id', userId)
        .eq('id', sessionId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}