import type { ExerciseSetType } from '../../../lib/supabase/types'

export type PremadeSplitExercise = {
    name: string
    muscleGroup: string
    equipment: string
    setType: ExerciseSetType
    sets: number
    minReps: number
    maxReps: number
    restSeconds: number
    targetRpe: number
    notes?: string | null
}

export type PremadeSplitDay = {
    dayNumber: number
    name: string
    isRestDay?: boolean
    exercises: PremadeSplitExercise[]
}

export type PremadeSplit = {
    id: string
    name: string
    description: string
    rotationLengthDays: number
    tags: string[]
    days: PremadeSplitDay[]
}

const defaultProgressionRule = 'Dynamic double progression'

export const premadeSplits: PremadeSplit[] = [
    {
        id: 'beginner-hypertrophy',
        name: 'Beginner Hypertrophy',
        description: 'Three simple full-body training days with repeatable machines and dumbbells.',
        rotationLengthDays: 7,
        tags: ['Beginner', 'Hypertrophy', '3 day'],
        days: [
            {
                dayNumber: 1,
                name: 'Full Body A',
                exercises: [
                    { name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 150, targetRpe: 8 },
                    { name: 'Chest Press Machine', muscleGroup: 'Chest', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', setType: 'straight', sets: 2, minReps: 10, maxReps: 15, restSeconds: 90, targetRpe: 8 }
                ]
            },
            {
                dayNumber: 3,
                name: 'Full Body B',
                exercises: [
                    { name: 'Hack Squat', muscleGroup: 'Legs', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 150, targetRpe: 8 },
                    { name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'Cable', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', setType: 'straight', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75, targetRpe: 8 }
                ]
            },
            {
                dayNumber: 5,
                name: 'Full Body C',
                exercises: [
                    { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', setType: 'straight', sets: 3, minReps: 6, maxReps: 10, restSeconds: 150, targetRpe: 8 },
                    { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Assisted Pull-up', muscleGroup: 'Back', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 6, maxReps: 10, restSeconds: 120, targetRpe: 8 },
                    { name: 'Rope Pressdown', muscleGroup: 'Triceps', equipment: 'Cable', setType: 'straight', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75, targetRpe: 8 }
                ]
            }
        ]
    },
    {
        id: 'push-pull-legs',
        name: 'Push Pull Legs',
        description: 'Classic six-day rotation with balanced hypertrophy volume.',
        rotationLengthDays: 6,
        tags: ['Hypertrophy', 'PPL', '6 day'],
        days: [
            {
                dayNumber: 1,
                name: 'Push',
                exercises: [
                    { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Machine Chest Press', muscleGroup: 'Chest', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Cable', setType: 'straight', sets: 3, minReps: 12, maxReps: 20, restSeconds: 75, targetRpe: 9 },
                    { name: 'Rope Pressdown', muscleGroup: 'Triceps', equipment: 'Cable', setType: 'straight', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75, targetRpe: 8 }
                ]
            },
            {
                dayNumber: 2,
                name: 'Pull',
                exercises: [
                    { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Chest Supported Row', muscleGroup: 'Back', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120, targetRpe: 8 },
                    { name: 'Rear Delt Fly', muscleGroup: 'Shoulders', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 12, maxReps: 20, restSeconds: 75, targetRpe: 9 },
                    { name: 'EZ Bar Curl', muscleGroup: 'Biceps', equipment: 'Barbell', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 75, targetRpe: 8 }
                ]
            },
            {
                dayNumber: 3,
                name: 'Legs',
                exercises: [
                    { name: 'Hack Squat', muscleGroup: 'Legs', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 8, maxReps: 12, restSeconds: 180, targetRpe: 8 },
                    { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 10, maxReps: 15, restSeconds: 90, targetRpe: 8 },
                    { name: 'Leg Extension', muscleGroup: 'Quads', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 10, maxReps: 15, restSeconds: 90, targetRpe: 8 },
                    { name: 'Standing Calf Raise', muscleGroup: 'Calves', equipment: 'Machine', setType: 'straight', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75, targetRpe: 8 }
                ]
            }
        ]
    }
]

export function getDefaultPremadeProgressionRule() {
    return defaultProgressionRule
}
