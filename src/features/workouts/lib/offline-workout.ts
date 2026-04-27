import type { LoggedSetType, WeightUnit } from '../../../lib/supabase/types'

const offlineWorkoutSetQueueKey = 'solo-offline-workout-set-queue'

export type OfflineWorkoutSet = {
    localId: string
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
    notes: string | null
    createdAt: string
    syncError: string | null
}

export function createLocalId() {
    return crypto.randomUUID()
}

export function isBrowserOnline() {
    return navigator.onLine
}

export function loadOfflineWorkoutSets() {
    const rawValue = localStorage.getItem(offlineWorkoutSetQueueKey)

    if (!rawValue) {
        return []
    }

    try {
        const parsed = JSON.parse(rawValue)

        if (!Array.isArray(parsed)) {
            return []
        }

        return parsed as OfflineWorkoutSet[]
    } catch {
        return []
    }
}

export function saveOfflineWorkoutSets(sets: OfflineWorkoutSet[]) {
    localStorage.setItem(offlineWorkoutSetQueueKey, JSON.stringify(sets))
}

export function addOfflineWorkoutSet(set: OfflineWorkoutSet) {
    const currentSets = loadOfflineWorkoutSets()

    saveOfflineWorkoutSets([...currentSets, set])

    return set
}

export function removeOfflineWorkoutSet(localId: string) {
    const currentSets = loadOfflineWorkoutSets()

    saveOfflineWorkoutSets(currentSets.filter((set) => set.localId !== localId))
}

export function updateOfflineWorkoutSetError(localId: string, syncError: string) {
    const currentSets = loadOfflineWorkoutSets()

    saveOfflineWorkoutSets(
        currentSets.map((set) => (set.localId === localId ? { ...set, syncError } : set))
    )
}

export function getOfflineWorkoutSetsForSession(sessionId: string) {
    return loadOfflineWorkoutSets().filter((set) => set.workoutSessionId === sessionId)
}

export function getOfflineWorkoutSetsForPlannedExercise(
    sessionId: string,
    plannedExerciseId: string
) {
    return loadOfflineWorkoutSets()
        .filter(
            (set) =>
                set.workoutSessionId === sessionId &&
                set.plannedExerciseId === plannedExerciseId
        )
        .sort((a, b) => a.setNumber - b.setNumber)
}