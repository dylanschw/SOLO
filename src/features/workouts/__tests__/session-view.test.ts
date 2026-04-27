import { describe, expect, it } from 'vitest'
import {
    formatLoggedWeight,
    getLoggedSetsForPlannedExercise,
    getNextSetNumber
} from '../lib/session-view'
import type { WorkoutSet } from '../lib/workout-sessions'

function makeSet(plannedExerciseId: string, setNumber: number): WorkoutSet {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        workout_session_id: crypto.randomUUID(),
        planned_exercise_id: plannedExerciseId,
        exercise_id: crypto.randomUUID(),
        set_number: setNumber,
        set_type: 'working',
        weight_kg: 100,
        reps: 8,
        rpe: 8,
        completed: true,
        notes: null,
        client_id: crypto.randomUUID(),
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}

describe('session view helpers', () => {
    it('filters logged sets by planned exercise id', () => {
        const plannedExerciseId = crypto.randomUUID()
        const otherPlannedExerciseId = crypto.randomUUID()

        const sets = [
            makeSet(plannedExerciseId, 2),
            makeSet(otherPlannedExerciseId, 1),
            makeSet(plannedExerciseId, 1)
        ]

        expect(getLoggedSetsForPlannedExercise(plannedExerciseId, sets).map((set) => set.set_number)).toEqual([1, 2])
    })

    it('gets the next set number', () => {
        const plannedExerciseId = crypto.randomUUID()

        expect(getNextSetNumber(plannedExerciseId, [makeSet(plannedExerciseId, 1)])).toBe(2)
    })

    it('formats logged weight', () => {
        expect(formatLoggedWeight(100, 'kg')).toBe('100 kg')
        expect(formatLoggedWeight(null, 'lb')).toBe('--')
    })
})