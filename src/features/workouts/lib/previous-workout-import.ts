import { supabase } from '../../../lib/supabase/client'
import { createExercise } from './workouts'
import { createWorkoutSet } from './workout-sessions'
import {
    buildPreviousWorkoutImportPlan,
    type ParsedPreviousWorkoutCsvRow,
} from './previous-workout-csv'

export type PreviousWorkoutImportResult = {
    sessionsImported: number
    setsImported: number
    exercisesCreated: number
}

function createClientId() {
    return crypto.randomUUID()
}

function getImportedDateTime(date: string, hour: number) {
    return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).toISOString()
}

function getExerciseKey(name: string) {
    return name.trim().toLowerCase()
}

export async function findPreviousWorkoutImportDuplicateHints(input: {
    userId: string
    rows: ParsedPreviousWorkoutCsvRow[]
}) {
    const dates = Array.from(new Set(input.rows.map((row) => row.workoutDate)))

    if (dates.length === 0) {
        return []
    }

    const { data, error } = await supabase
        .from('workout_sessions')
        .select('session_date, notes, status')
        .eq('user_id', input.userId)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .in('session_date', dates)

    if (error) {
        throw error
    }

    const countsByDate = new Map<string, number>()

    for (const session of data ?? []) {
        countsByDate.set(session.session_date, (countsByDate.get(session.session_date) ?? 0) + 1)
    }

    return Array.from(countsByDate.entries()).map(([date, count]) =>
        `${date} already has ${count} completed workout${count === 1 ? '' : 's'}.`
    )
}

export async function importPreviousWorkoutCsvRows(input: {
    userId: string
    rows: ParsedPreviousWorkoutCsvRow[]
}): Promise<PreviousWorkoutImportResult> {
    const plan = buildPreviousWorkoutImportPlan(input.rows)

    if (plan.blockingErrors.length > 0) {
        throw new Error(plan.blockingErrors[0])
    }

    const { data: existingExercises, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', input.userId)
        .is('deleted_at', null)

    if (exerciseError) {
        throw exerciseError
    }

    const exerciseIdsByName = new Map(
        (existingExercises ?? []).map((exercise) => [getExerciseKey(exercise.name), exercise.id])
    )

    let exercisesCreated = 0
    let setsImported = 0

    for (const workout of plan.workouts) {
        const { data: session, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert({
                user_id: input.userId,
                program_id: null,
                workout_day_id: null,
                session_date: workout.workoutDate,
                started_at: getImportedDateTime(workout.workoutDate, 12),
                completed_at: getImportedDateTime(workout.workoutDate, 13),
                status: 'completed',
                notes: `Imported CSV workout: ${workout.workoutName}`,
                client_id: createClientId(),
                sync_status: 'synced',
            })
            .select()
            .single()

        if (sessionError) {
            throw sessionError
        }

        for (const row of workout.rows) {
            const exerciseKey = getExerciseKey(row.exerciseName)
            let exerciseId = exerciseIdsByName.get(exerciseKey)

            if (!exerciseId) {
                const exercise = await createExercise({
                    userId: input.userId,
                    name: row.exerciseName,
                    muscleGroup: null,
                    equipment: null,
                    notes: 'Created from previous workout CSV import.',
                })

                exerciseId = exercise.id
                exerciseIdsByName.set(exerciseKey, exerciseId)
                exercisesCreated += 1
            }

            await createWorkoutSet({
                userId: input.userId,
                workoutSessionId: session.id,
                plannedExerciseId: null,
                exerciseId,
                setNumber: row.setNumber,
                setType: 'working',
                loadType: row.loadType,
                weight: row.loadType === 'weighted' ? row.weight : null,
                assistWeight: row.loadType === 'assisted' ? row.assistWeight : null,
                addedWeight: row.loadType === 'added_weight' ? row.addedWeight : null,
                weightUnit: row.weightUnit,
                reps: row.reps,
                rpe: null,
                notes: row.notes,
                completed: true,
            })

            setsImported += 1
        }
    }

    return {
        sessionsImported: plan.workouts.length,
        setsImported,
        exercisesCreated,
    }
}
