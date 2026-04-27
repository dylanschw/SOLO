import { supabase } from '../../../lib/supabase/client'
import type { Database, ExerciseSetType } from '../../../lib/supabase/types'

export type WorkoutProgram = Database['public']['Tables']['workout_programs']['Row']
export type WorkoutDay = Database['public']['Tables']['workout_days']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type PlannedExercise = Database['public']['Tables']['planned_exercises']['Row']

export type CreateProgramInput = {
    userId: string
    name: string
    description?: string | null
    rotationLengthDays: number
}

export type CreateWorkoutDayInput = {
    userId: string
    programId: string
    dayNumber: number
    name: string
    notes?: string | null
    isRestDay: boolean
}

export type CreateExerciseInput = {
    userId: string
    name: string
    muscleGroup?: string | null
    equipment?: string | null
    notes?: string | null
}

export type AddPlannedExerciseInput = {
    userId: string
    workoutDayId: string
    exerciseId: string
    sortOrder: number
    setType: ExerciseSetType
    plannedSets: number
    minReps?: number | null
    maxReps?: number | null
    restSeconds?: number | null
    targetRpe?: number | null
    backoffPercent?: number | null
    notes?: string | null
    progressionRule?: string | null
    deloadRule?: string | null
}

function createClientId() {
    return crypto.randomUUID()
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

export async function listWorkoutPrograms(userId: string) {
    const { data, error } = await supabase
        .from('workout_programs')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function getActiveWorkoutProgram(userId: string) {
    const { data, error } = await supabase
        .from('workout_programs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data
}

export async function createWorkoutProgram(input: CreateProgramInput) {
    const { data, error } = await supabase
        .from('workout_programs')
        .insert({
            user_id: input.userId,
            name: input.name.trim(),
            description: cleanText(input.description),
            rotation_length_days: input.rotationLengthDays,
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

export async function setActiveWorkoutProgram(userId: string, programId: string) {
    const { error: deactivateError } = await supabase
        .from('workout_programs')
        .update({
            is_active: false
        })
        .eq('user_id', userId)
        .is('deleted_at', null)

    if (deactivateError) {
        throw deactivateError
    }

    const { data, error } = await supabase
        .from('workout_programs')
        .update({
            is_active: true
        })
        .eq('user_id', userId)
        .eq('id', programId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function listWorkoutDays(userId: string, programId: string | null) {
    if (!programId) {
        return []
    }

    const { data, error } = await supabase
        .from('workout_days')
        .select('*')
        .eq('user_id', userId)
        .eq('program_id', programId)
        .is('deleted_at', null)
        .order('day_number', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function createWorkoutDay(input: CreateWorkoutDayInput) {
    const { data, error } = await supabase
        .from('workout_days')
        .insert({
            user_id: input.userId,
            program_id: input.programId,
            day_number: input.dayNumber,
            name: input.name.trim(),
            notes: cleanText(input.notes),
            is_rest_day: input.isRestDay,
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

export async function listExercises(userId: string) {
    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('name', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function createExercise(input: CreateExerciseInput) {
    const { data, error } = await supabase
        .from('exercises')
        .insert({
            user_id: input.userId,
            name: input.name.trim(),
            muscle_group: cleanText(input.muscleGroup),
            equipment: cleanText(input.equipment),
            notes: cleanText(input.notes),
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

export async function listPlannedExercises(userId: string, workoutDayIds: string[]) {
    if (workoutDayIds.length === 0) {
        return []
    }

    const { data, error } = await supabase
        .from('planned_exercises')
        .select('*')
        .eq('user_id', userId)
        .in('workout_day_id', workoutDayIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function addPlannedExercise(input: AddPlannedExerciseInput) {
    const { data, error } = await supabase
        .from('planned_exercises')
        .insert({
            user_id: input.userId,
            workout_day_id: input.workoutDayId,
            exercise_id: input.exerciseId,
            sort_order: input.sortOrder,
            set_type: input.setType,
            planned_sets: input.plannedSets,
            min_reps: cleanOptionalNumber(input.minReps),
            max_reps: cleanOptionalNumber(input.maxReps),
            rest_seconds: cleanOptionalNumber(input.restSeconds),
            target_rpe: cleanOptionalNumber(input.targetRpe),
            backoff_percent: cleanOptionalNumber(input.backoffPercent),
            notes: cleanText(input.notes),
            progression_rule: cleanText(input.progressionRule),
            deload_rule: cleanText(input.deloadRule),
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