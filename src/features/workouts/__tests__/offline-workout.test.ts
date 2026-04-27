import { beforeEach, describe, expect, it } from 'vitest'
import {
    addOfflineWorkoutSet,
    getOfflineWorkoutSetsForPlannedExercise,
    getOfflineWorkoutSetsForSession,
    loadOfflineWorkoutSets,
    removeOfflineWorkoutSet,
    updateOfflineWorkoutSetError
} from '../lib/offline-workout'
import type { OfflineWorkoutSet } from '../lib/offline-workout'

function makeOfflineSet(overrides: Partial<OfflineWorkoutSet> = {}): OfflineWorkoutSet {
    return {
        localId: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        workoutSessionId: 'session-1',
        plannedExerciseId: 'planned-1',
        exerciseId: crypto.randomUUID(),
        setNumber: 1,
        setType: 'working',
        weight: 100,
        weightUnit: 'lb',
        reps: 8,
        rpe: 8,
        notes: null,
        createdAt: new Date().toISOString(),
        syncError: null,
        ...overrides
    }
}

describe('offline workout queue', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('adds and loads offline workout sets', () => {
        addOfflineWorkoutSet(makeOfflineSet())

        expect(loadOfflineWorkoutSets()).toHaveLength(1)
    })

    it('filters offline sets by session', () => {
        addOfflineWorkoutSet(makeOfflineSet({ workoutSessionId: 'session-1' }))
        addOfflineWorkoutSet(makeOfflineSet({ workoutSessionId: 'session-2' }))

        expect(getOfflineWorkoutSetsForSession('session-1')).toHaveLength(1)
    })

    it('filters offline sets by planned exercise', () => {
        addOfflineWorkoutSet(makeOfflineSet({ plannedExerciseId: 'planned-1' }))
        addOfflineWorkoutSet(makeOfflineSet({ plannedExerciseId: 'planned-2' }))

        expect(getOfflineWorkoutSetsForPlannedExercise('session-1', 'planned-1')).toHaveLength(1)
    })

    it('updates sync errors', () => {
        const offlineSet = makeOfflineSet()

        addOfflineWorkoutSet(offlineSet)
        updateOfflineWorkoutSetError(offlineSet.localId, 'Network error')

        expect(loadOfflineWorkoutSets()[0].syncError).toBe('Network error')
    })

    it('removes synced sets', () => {
        const offlineSet = makeOfflineSet()

        addOfflineWorkoutSet(offlineSet)
        removeOfflineWorkoutSet(offlineSet.localId)

        expect(loadOfflineWorkoutSets()).toHaveLength(0)
    })
})