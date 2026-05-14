import type { WeightUnit, WorkoutSetLoadType } from '../../../lib/supabase/types'
import { convertWeight } from '../../../lib/utils/units'
import type { Exercise, PlannedExercise } from './workouts'
import type { WorkoutSet } from './workout-sessions'

export function getLoggedSetsForPlannedExercise(
    plannedExerciseId: string,
    loggedSets: WorkoutSet[]
) {
    return loggedSets
        .filter((set) => set.planned_exercise_id === plannedExerciseId)
        .sort((a, b) => a.set_number - b.set_number)
}

export function getNextSetNumber(plannedExerciseId: string, loggedSets: WorkoutSet[]) {
    const setNumbers = getLoggedSetsForPlannedExercise(plannedExerciseId, loggedSets).map((set) => set.set_number)

    return setNumbers.length === 0 ? 1 : Math.max(...setNumbers) + 1
}

export function getExerciseNameForPlannedExercise(
    plannedExercise: PlannedExercise,
    exercises: Exercise[]
) {
    return exercises.find((exercise) => exercise.id === plannedExercise.exercise_id)?.name ?? 'Exercise Name'
}

export function formatLoggedWeight(weightKg: number | null, unit: WeightUnit) {
    if (weightKg === null) {
        return '--'
    }

    return `${convertWeight(weightKg, 'kg', unit)} ${unit}`
}

export function formatWorkoutSetLoad(
    set: {
        load_type?: WorkoutSetLoadType | null
        weight_kg: number | null
        assist_weight_kg?: number | null
        added_weight_kg?: number | null
    },
    unit: WeightUnit
) {
    const loadType = set.load_type ?? 'weighted'

    if (loadType === 'bodyweight') {
        return 'Bodyweight'
    }

    if (loadType === 'no_weight') {
        return 'No weight'
    }

    if (loadType === 'assisted') {
        return set.assist_weight_kg === null || typeof set.assist_weight_kg === 'undefined'
            ? 'Assisted'
            : `Assisted ${convertWeight(set.assist_weight_kg, 'kg', unit)} ${unit}`
    }

    if (loadType === 'added_weight') {
        const addedWeight = set.added_weight_kg ?? set.weight_kg

        return addedWeight === null ? 'Added weight' : `+${convertWeight(addedWeight, 'kg', unit)} ${unit}`
    }

    return set.weight_kg === null ? 'No weight' : formatLoggedWeight(set.weight_kg, unit)
}
