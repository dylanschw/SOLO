import { describe, expect, it } from 'vitest'
import { getExerciseName, getPlannedExercisesForDay, sortWorkoutDays } from '../lib/workout-view'
import type { Exercise, PlannedExercise, WorkoutDay } from '../lib/workouts'

function makeWorkoutDay(dayNumber: number): WorkoutDay {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        program_id: crypto.randomUUID(),
        day_number: dayNumber,
        name: `Day ${dayNumber}`,
        notes: null,
        is_rest_day: false,
        client_id: crypto.randomUUID(),
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}

function makeExercise(id: string, name: string): Exercise {
    return {
        id,
        user_id: crypto.randomUUID(),
        name,
        muscle_group: null,
        equipment: null,
        notes: null,
        client_id: crypto.randomUUID(),
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}

function makePlannedExercise(workoutDayId: string, sortOrder: number): PlannedExercise {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        workout_day_id: workoutDayId,
        exercise_id: crypto.randomUUID(),
        sort_order: sortOrder,
        set_type: 'straight',
        planned_sets: 3,
        min_reps: 8,
        max_reps: 12,
        rest_seconds: 120,
        target_rpe: 8,
        backoff_percent: null,
        notes: null,
        progression_rule: null,
        deload_rule: null,
        client_id: crypto.randomUUID(),
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}

describe('workout view helpers', () => {
    it('sorts workout days by day number', () => {
        const days = [makeWorkoutDay(3), makeWorkoutDay(1), makeWorkoutDay(2)]

        expect(sortWorkoutDays(days).map((day) => day.day_number)).toEqual([1, 2, 3])
    })

    it('gets an exercise name by id', () => {
        const exerciseId = crypto.randomUUID()
        const exercises = [makeExercise(exerciseId, 'Incline Dumbbell Press')]

        expect(getExerciseName(exerciseId, exercises)).toBe('Incline Dumbbell Press')
    })

    it('filters and sorts planned exercises for a day', () => {
        const dayId = crypto.randomUUID()
        const otherDayId = crypto.randomUUID()

        const plannedExercises = [
            makePlannedExercise(dayId, 2),
            makePlannedExercise(otherDayId, 1),
            makePlannedExercise(dayId, 1)
        ]

        expect(getPlannedExercisesForDay(dayId, plannedExercises).map((exercise) => exercise.sort_order)).toEqual([1, 2])
    })
})