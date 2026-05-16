import { describe, expect, it } from 'vitest'
import { buildTrainingAnalytics, detectExerciseStall } from '../lib/training-analytics'
import type { Exercise } from '../lib/workouts'
import type { WorkoutSession, WorkoutSet } from '../lib/workout-sessions'

const exercise: Exercise = {
    id: 'exercise-1',
    user_id: 'user-1',
    name: 'Bench Press',
    muscle_group: 'Chest',
    equipment: 'Barbell',
    notes: null,
    is_archived: false,
    movement_pattern: 'press',
    primary_muscle: 'Chest',
    alternate_group: null,
    client_id: 'exercise-client',
    version: 1,
    deleted_at: null,
    sync_status: 'synced',
    created_at: '2026-05-01T12:00:00.000Z',
    updated_at: '2026-05-01T12:00:00.000Z',
}

function makeSession(overrides: Partial<WorkoutSession>): WorkoutSession {
    return {
        id: 'session-1',
        user_id: 'user-1',
        program_id: null,
        workout_day_id: null,
        import_batch_id: null,
        session_date: '2026-05-14',
        started_at: null,
        completed_at: null,
        status: 'completed',
        notes: null,
        client_id: 'session-client',
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: '2026-05-14T12:00:00.000Z',
        updated_at: '2026-05-14T12:00:00.000Z',
        ...overrides,
    }
}

function makeSet(overrides: Partial<WorkoutSet>): WorkoutSet {
    return {
        id: 'set-1',
        user_id: 'user-1',
        workout_session_id: 'session-1',
        planned_exercise_id: null,
        exercise_id: 'exercise-1',
        import_batch_id: null,
        set_number: 1,
        set_type: 'working',
        load_type: 'weighted',
        weight_kg: 100,
        assist_weight_kg: null,
        added_weight_kg: null,
        reps: 10,
        rpe: null,
        completed: true,
        notes: null,
        client_id: 'set-client',
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: '2026-05-14T12:00:00.000Z',
        updated_at: '2026-05-14T12:00:00.000Z',
        ...overrides,
    }
}

describe('training analytics utilities', () => {
    it('builds weekly volume and frequency summaries', () => {
        const summary = buildTrainingAnalytics({
            sets: [
                {
                    ...makeSet({ id: 'set-1', workout_session_id: 'session-1', weight_kg: 100, reps: 10 }),
                    workout_sessions: { session_date: '2026-05-14' },
                },
                {
                    ...makeSet({ id: 'set-2', workout_session_id: 'session-2', weight_kg: 50, reps: 8 }),
                    workout_sessions: { session_date: '2026-05-12' },
                },
            ],
            sessions: [
                makeSession({ id: 'session-1', session_date: '2026-05-14' }),
                makeSession({ id: 'session-2', session_date: '2026-05-12' }),
            ],
            exercises: [exercise],
            unit: 'kg',
            endDate: '2026-05-14',
        })

        expect(summary.weeklySetCount).toBe(2)
        expect(summary.workoutFrequency).toBe(2)
        expect(summary.totalVolume).toBe(1400)
        expect(summary.volumeByMuscleGroup[0]).toMatchObject({ muscleGroup: 'Chest', setCount: 2 })
    })

    it('detects stalled weighted lifts from repeated recent scores', () => {
        const stall = detectExerciseStall({
            exerciseId: 'exercise-1',
            exerciseName: 'Bench Press',
            sets: [
                {
                    ...makeSet({ id: 'old', weight_kg: 100, reps: 10 }),
                    workout_sessions: { session_date: '2026-05-01' },
                },
                {
                    ...makeSet({ id: 'middle', weight_kg: 100, reps: 10 }),
                    workout_sessions: { session_date: '2026-05-08' },
                },
                {
                    ...makeSet({ id: 'latest', weight_kg: 100, reps: 10 }),
                    workout_sessions: { session_date: '2026-05-14' },
                },
            ],
            unit: 'kg',
        })

        expect(stall.status).toBe('stalled')
        expect(stall.suggestion).toBe('consider_recovery')
    })

    it('does not call a lift stalled without enough exposures', () => {
        const stall = detectExerciseStall({
            exerciseId: 'exercise-1',
            exerciseName: 'Bench Press',
            sets: [makeSet({ id: 'one' })],
            unit: 'kg',
        })

        expect(stall.status).toBe('insufficient_data')
    })
})
