import type { WeightUnit } from '../../../lib/supabase/types'
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
    return getLoggedSetsForPlannedExercise(plannedExerciseId, loggedSets).length + 1
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