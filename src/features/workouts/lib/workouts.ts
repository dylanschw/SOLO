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
    movementPattern?: string | null
    primaryMuscle?: string | null
    alternateGroup?: string | null
}

export type UpdateExerciseInput = CreateExerciseInput & {
    exerciseId: string
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

export type UpdateProgramInput = {
    userId: string
    programId: string
    name: string
    description?: string | null
    rotationLengthDays: number
}

export type UpdateWorkoutDayInput = {
    userId: string
    dayId: string
    dayNumber: number
    name: string
    notes?: string | null
    isRestDay: boolean
}

export type UpdatePlannedExerciseInput = {
    userId: string
    plannedExerciseId: string
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

function getExerciseSearchText(exercise: Exercise) {
    return [
        exercise.name,
        exercise.muscle_group,
        exercise.primary_muscle,
        exercise.equipment,
        exercise.movement_pattern,
        exercise.alternate_group,
        exercise.notes,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
}

export function filterExercisesForLibrary(input: {
    exercises: Exercise[]
    searchText?: string
    includeArchived?: boolean
}) {
    const search = input.searchText?.trim().toLowerCase() ?? ''

    return input.exercises
        .filter((exercise) => input.includeArchived || !exercise.is_archived)
        .filter((exercise) => !search || getExerciseSearchText(exercise).includes(search))
        .sort((a, b) => {
            if (a.is_archived !== b.is_archived) {
                return a.is_archived ? 1 : -1
            }

            return a.name.localeCompare(b.name)
        })
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
            is_archived: false,
            movement_pattern: cleanText(input.movementPattern),
            primary_muscle: cleanText(input.primaryMuscle),
            alternate_group: cleanText(input.alternateGroup),
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

export async function updateExercise(input: UpdateExerciseInput) {
    const { data, error } = await supabase
        .from('exercises')
        .update({
            name: input.name.trim(),
            muscle_group: cleanText(input.muscleGroup),
            equipment: cleanText(input.equipment),
            notes: cleanText(input.notes),
            movement_pattern: cleanText(input.movementPattern),
            primary_muscle: cleanText(input.primaryMuscle),
            alternate_group: cleanText(input.alternateGroup),
            sync_status: 'synced'
        })
        .eq('id', input.exerciseId)
        .eq('user_id', input.userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function archiveExercise(userId: string, exerciseId: string) {
    const { data, error } = await supabase
        .from('exercises')
        .update({
            is_archived: true,
            sync_status: 'synced'
        })
        .eq('id', exerciseId)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function restoreExercise(userId: string, exerciseId: string) {
    const { data, error } = await supabase
        .from('exercises')
        .update({
            is_archived: false,
            sync_status: 'synced'
        })
        .eq('id', exerciseId)
        .eq('user_id', userId)
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

export async function updateWorkoutProgram(input: UpdateProgramInput) {
    const { data, error } = await supabase
        .from('workout_programs')
        .update({
            name: input.name.trim(),
            description: cleanText(input.description),
            rotation_length_days: input.rotationLengthDays
        })
        .eq('id', input.programId)
        .eq('user_id', input.userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function archiveWorkoutProgram(userId: string, programId: string) {
    const { data, error } = await supabase
        .from('workout_programs')
        .update({
            is_active: false,
            is_archived: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', programId)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function updateWorkoutDay(input: UpdateWorkoutDayInput) {
    const { data, error } = await supabase
        .from('workout_days')
        .update({
            day_number: input.dayNumber,
            name: input.name.trim(),
            notes: cleanText(input.notes),
            is_rest_day: input.isRestDay
        })
        .eq('id', input.dayId)
        .eq('user_id', input.userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteWorkoutDay(userId: string, dayId: string) {
    const { data, error } = await supabase
        .from('workout_days')
        .update({
            deleted_at: new Date().toISOString()
        })
        .eq('id', dayId)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function updatePlannedExercise(input: UpdatePlannedExerciseInput) {
    const { data, error } = await supabase
        .from('planned_exercises')
        .update({
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
            deload_rule: cleanText(input.deloadRule)
        })
        .eq('id', input.plannedExerciseId)
        .eq('user_id', input.userId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deletePlannedExercise(userId: string, plannedExerciseId: string) {
    const { data: plannedExercise, error: findError } = await supabase
        .from('planned_exercises')
        .select('*')
        .eq('user_id', userId)
        .eq('id', plannedExerciseId)
        .single()

    if (findError) {
        throw findError
    }

    const { data, error } = await supabase
        .from('planned_exercises')
        .update({
            deleted_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('id', plannedExerciseId)
        .select()
        .single()

    if (error) {
        throw error
    }

    const { data: laterExercises, error: laterExercisesError } = await supabase
        .from('planned_exercises')
        .select('id, sort_order')
        .eq('user_id', userId)
        .eq('workout_day_id', plannedExercise.workout_day_id)
        .is('deleted_at', null)
        .gt('sort_order', plannedExercise.sort_order)
        .order('sort_order', { ascending: true })

    if (laterExercisesError) {
        throw laterExercisesError
    }

    for (const exercise of laterExercises ?? []) {
        const { error: reorderError } = await supabase
            .from('planned_exercises')
            .update({
                sort_order: Math.max(1, exercise.sort_order - 1)
            })
            .eq('user_id', userId)
            .eq('id', exercise.id)

        if (reorderError) {
            throw reorderError
        }
    }

    return data
}
