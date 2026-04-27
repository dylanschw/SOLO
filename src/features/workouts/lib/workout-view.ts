import type { Exercise, PlannedExercise, WorkoutDay } from './workouts'

export function getExerciseName(exerciseId: string, exercises: Exercise[]) {
    return exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Unknown exercise'
}

export function getPlannedExercisesForDay(dayId: string, plannedExercises: PlannedExercise[]) {
    return plannedExercises
        .filter((plannedExercise) => plannedExercise.workout_day_id === dayId)
        .sort((a, b) => a.sort_order - b.sort_order)
}

export function sortWorkoutDays(days: WorkoutDay[]) {
    return [...days].sort((a, b) => a.day_number - b.day_number)
}