import { supabase } from '../../../lib/supabase/client'
import type { Database, LoggedSetType, WeightUnit, WorkoutSetLoadType } from '../../../lib/supabase/types'
import { convertWeightForStorage } from '../../../lib/utils/units'

export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']
export type WorkoutSetWithSessionDate = WorkoutSet & {
    workout_sessions?: {
        session_date: string | null
    } | null
}

export type StartWorkoutSessionInput = {
    userId: string
    programId: string
    workoutDayId: string
    sessionDate?: string
    startedAt?: string
}

export type CreateWorkoutSetInput = {
    userId: string
    workoutSessionId: string
    plannedExerciseId: string | null
    exerciseId: string
    setNumber: number
    setType: LoggedSetType
    loadType?: WorkoutSetLoadType
    weight: number | null
    assistWeight?: number | null
    addedWeight?: number | null
    weightUnit: WeightUnit
    reps: number | null
    rpe: number | null
    notes?: string | null
    completed?: boolean
    clientId?: string
}

export type UpdateWorkoutSetInput = {
    userId: string;
    setId: string;
    loadType?: WorkoutSetLoadType;
    weight: number | null;
    assistWeight?: number | null;
    addedWeight?: number | null;
    weightUnit: WeightUnit;
    reps: number | null;
    rpe?: number | null;
    notes?: string | null;
};

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
            session_date: input.sessionDate ?? todayDate(),
            started_at: input.startedAt ?? new Date().toISOString(),
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
        .order('session_date', { ascending: false })
        .order('started_at', { ascending: false, nullsFirst: false })
        .limit(400)

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
        .order('set_number', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function createWorkoutSet(input: CreateWorkoutSetInput) {
    const weightKg =
        input.weight === null ? null : convertWeightForStorage(input.weight, input.weightUnit, 'kg')
    const assistWeightKg =
        input.assistWeight === null || typeof input.assistWeight === 'undefined'
            ? null
            : convertWeightForStorage(input.assistWeight, input.weightUnit, 'kg')
    const addedWeightKg =
        input.addedWeight === null || typeof input.addedWeight === 'undefined'
            ? null
            : convertWeightForStorage(input.addedWeight, input.weightUnit, 'kg')

    const { data, error } = await supabase
        .from('workout_sets')
        .insert({
            user_id: input.userId,
            workout_session_id: input.workoutSessionId,
            planned_exercise_id: input.plannedExerciseId,
            exercise_id: input.exerciseId,
            set_number: input.setNumber,
            set_type: input.setType,
            load_type: input.loadType ?? 'weighted',
            weight_kg: weightKg,
            assist_weight_kg: assistWeightKg,
            added_weight_kg: addedWeightKg,
            reps: cleanOptionalNumber(input.reps),
            rpe: cleanOptionalNumber(input.rpe),
            completed: input.completed ?? true,
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

export async function deleteWorkoutSession(userId: string, sessionId: string) {
    const deletedAt = new Date().toISOString();

    const { error: setsError } = await supabase
        .from('workout_sets')
        .update({
            deleted_at: deletedAt,
        })
        .eq('user_id', userId)
        .eq('workout_session_id', sessionId);

    if (setsError) {
        throw setsError;
    }

    const { data, error } = await supabase
        .from('workout_sessions')
        .update({
            deleted_at: deletedAt,
            status: 'skipped',
        })
        .eq('user_id', userId)
        .eq('id', sessionId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function listAllWorkoutSets(userId: string) {
    const { data, error } = await supabase
        .from('workout_sets')
        .select('*, workout_sessions(session_date)')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        throw error;
    }

    return data as WorkoutSetWithSessionDate[];
}

export async function updateWorkoutSet(input: UpdateWorkoutSetInput) {
    const weightKg =
        input.weight === null ? null : convertWeightForStorage(input.weight, input.weightUnit, 'kg');
    const assistWeightKg =
        input.assistWeight === null || typeof input.assistWeight === 'undefined'
            ? null
            : convertWeightForStorage(input.assistWeight, input.weightUnit, 'kg');
    const addedWeightKg =
        input.addedWeight === null || typeof input.addedWeight === 'undefined'
            ? null
            : convertWeightForStorage(input.addedWeight, input.weightUnit, 'kg');

    const { data, error } = await supabase
        .from('workout_sets')
        .update({
            load_type: input.loadType ?? 'weighted',
            weight_kg: weightKg,
            assist_weight_kg: assistWeightKg,
            added_weight_kg: addedWeightKg,
            reps: cleanOptionalNumber(input.reps),
            rpe: cleanOptionalNumber(input.rpe),
            notes: cleanText(input.notes),
        })
        .eq('user_id', input.userId)
        .eq('id', input.setId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function renumberWorkoutSets(input: {
    userId: string;
    workoutSessionId: string;
    plannedExerciseId: string | null;
    exerciseId: string;
}) {
    let query = supabase
        .from('workout_sets')
        .select('id, set_number')
        .eq('user_id', input.userId)
        .eq('workout_session_id', input.workoutSessionId)
        .eq('exercise_id', input.exerciseId)
        .is('deleted_at', null)
        .order('set_number', { ascending: true })
        .order('created_at', { ascending: true });

    query = input.plannedExerciseId
        ? query.eq('planned_exercise_id', input.plannedExerciseId)
        : query.is('planned_exercise_id', null);

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    for (let index = 0; index < (data ?? []).length; index += 1) {
        const nextSetNumber = index + 1;
        const set = data?.[index];

        if (!set || set.set_number === nextSetNumber) {
            continue;
        }

        const { error: updateError } = await supabase
            .from('workout_sets')
            .update({
                set_number: nextSetNumber,
            })
            .eq('user_id', input.userId)
            .eq('id', set.id);

        if (updateError) {
            throw updateError;
        }
    }
}

export async function deleteWorkoutSet(userId: string, setId: string) {
    const { data, error } = await supabase
        .from('workout_sets')
        .update({
            deleted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('id', setId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    await renumberWorkoutSets({
        userId,
        workoutSessionId: data.workout_session_id,
        plannedExerciseId: data.planned_exercise_id,
        exerciseId: data.exercise_id,
    });

    return data;
}
