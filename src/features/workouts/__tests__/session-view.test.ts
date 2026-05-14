import { describe, expect, it } from 'vitest'
import {
    formatLoggedWeight,
    formatWorkoutSetLoad,
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
        load_type: 'weighted',
        weight_kg: 100,
        assist_weight_kg: null,
        added_weight_kg: null,
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

    it('gets the next set number without duplicating after a deletion gap', () => {
        const plannedExerciseId = crypto.randomUUID()

        expect(getNextSetNumber(plannedExerciseId, [
            makeSet(plannedExerciseId, 1),
            makeSet(plannedExerciseId, 3),
        ])).toBe(4)
    })

    it('formats logged weight', () => {
        expect(formatLoggedWeight(100, 'kg')).toBe('100 kg')
        expect(formatLoggedWeight(null, 'lb')).toBe('--')
    })

    it('formats session load types without duplicate units', () => {
        expect(
            formatWorkoutSetLoad(
                {
                    load_type: 'assisted',
                    weight_kg: null,
                    assist_weight_kg: 27.2155,
                    added_weight_kg: null
                },
                'lb'
            )
        ).toBe('Assisted 60 lb')

        expect(
            formatWorkoutSetLoad(
                {
                    load_type: 'added_weight',
                    weight_kg: null,
                    assist_weight_kg: null,
                    added_weight_kg: 11.3398
                },
                'lb'
            )
        ).toBe('+25 lb')

        expect(
            formatWorkoutSetLoad(
                {
                    load_type: 'no_weight',
                    weight_kg: null,
                    assist_weight_kg: null,
                    added_weight_kg: null
                },
                'lb'
            )
        ).toBe('No weight')
    })
})
