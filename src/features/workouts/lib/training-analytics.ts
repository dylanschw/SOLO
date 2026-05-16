import type { WeightUnit, WorkoutSetLoadType } from '../../../lib/supabase/types'
import { convertWeight, roundToOneDecimal } from '../../../lib/utils/units'
import type { Exercise } from './workouts'
import type { WorkoutSession, WorkoutSet, WorkoutSetWithSessionDate } from './workout-sessions'
import { calculateEstimatedOneRepMax, getWorkoutSetSessionDate } from './exercise-history'

export type TrainingAnalyticsSet = WorkoutSet | WorkoutSetWithSessionDate

export type ExerciseStallStatus = 'insufficient_data' | 'improving' | 'holding' | 'stalled'

export type ExerciseProgressionSuggestion =
    | 'log_more_data'
    | 'increase_weight_carefully'
    | 'add_reps'
    | 'repeat_same_load'
    | 'consider_recovery'

export type ExerciseStallSummary = {
    exerciseId: string
    exerciseName: string
    status: ExerciseStallStatus
    suggestion: ExerciseProgressionSuggestion
    exposureCount: number
    recentScores: number[]
}

export type TrainingAnalyticsSummary = {
    weeklySetCount: number
    workoutFrequency: number
    totalVolume: number
    volumeByExercise: Array<{
        exerciseId: string
        exerciseName: string
        volume: number
        setCount: number
    }>
    volumeByMuscleGroup: Array<{
        muscleGroup: string
        volume: number
        setCount: number
    }>
    exerciseFrequency: Array<{
        exerciseId: string
        exerciseName: string
        sessions: number
    }>
    stalledLifts: ExerciseStallSummary[]
}

function getExercise(exercises: Exercise[], exerciseId: string) {
    return exercises.find((exercise) => exercise.id === exerciseId) ?? null
}

function getExerciseName(exercises: Exercise[], exerciseId: string) {
    return getExercise(exercises, exerciseId)?.name ?? 'Unknown exercise'
}

function getExerciseMuscleGroup(exercises: Exercise[], exerciseId: string) {
    const exercise = getExercise(exercises, exerciseId)

    return exercise?.primary_muscle ?? exercise?.muscle_group ?? 'Unassigned'
}

function getDateTime(date: string) {
    const time = new Date(`${date}T12:00:00`).getTime()

    return Number.isFinite(time) ? time : 0
}

function isWithinLastDays(date: string, endDate: string, dayCount: number) {
    const end = getDateTime(endDate)
    const current = getDateTime(date)
    const start = end - (dayCount - 1) * 24 * 60 * 60 * 1000

    return current >= start && current <= end
}

function getDisplayLoad(set: TrainingAnalyticsSet, unit: WeightUnit) {
    const loadType = (set.load_type ?? 'weighted') as WorkoutSetLoadType

    if (loadType === 'weighted' && typeof set.weight_kg === 'number') {
        return convertWeight(set.weight_kg, 'kg', unit)
    }

    if (loadType === 'added_weight' && typeof set.added_weight_kg === 'number') {
        return convertWeight(set.added_weight_kg, 'kg', unit)
    }

    if (loadType === 'assisted' && typeof set.assist_weight_kg === 'number') {
        return convertWeight(set.assist_weight_kg, 'kg', unit)
    }

    return null
}

function getVolumeLoad(set: TrainingAnalyticsSet, unit: WeightUnit) {
    const loadType = (set.load_type ?? 'weighted') as WorkoutSetLoadType

    if (loadType === 'weighted' || loadType === 'added_weight') {
        return getDisplayLoad(set, unit)
    }

    return null
}

function getPerformanceScore(set: TrainingAnalyticsSet, unit: WeightUnit) {
    const reps = set.reps ?? 0

    if (reps <= 0) {
        return null
    }

    const loadType = (set.load_type ?? 'weighted') as WorkoutSetLoadType
    const load = getDisplayLoad(set, unit)

    if ((loadType === 'weighted' || loadType === 'added_weight') && load !== null) {
        return calculateEstimatedOneRepMax(load, reps)
    }

    if (loadType === 'assisted') {
        const assistance = load ?? 0

        return roundToOneDecimal(reps * 100 - assistance)
    }

    return reps
}

function getRecentCompletedSets(input: {
    sets: TrainingAnalyticsSet[]
    endDate: string
    dayCount: number
}) {
    return input.sets.filter((set) => {
        if (!set.completed || set.deleted_at || set.set_type === 'skipped') {
            return false
        }

        return isWithinLastDays(getWorkoutSetSessionDate(set), input.endDate, input.dayCount)
    })
}

export function detectExerciseStall(input: {
    exerciseId: string
    exerciseName: string
    sets: TrainingAnalyticsSet[]
    unit: WeightUnit
}): ExerciseStallSummary {
    const bestScoreByDate = new Map<string, number>()

    for (const set of input.sets) {
        if (set.exercise_id !== input.exerciseId || !set.completed || set.deleted_at || set.set_type === 'skipped') {
            continue
        }

        const score = getPerformanceScore(set, input.unit)

        if (score === null) {
            continue
        }

        const date = getWorkoutSetSessionDate(set)
        bestScoreByDate.set(date, Math.max(bestScoreByDate.get(date) ?? 0, score))
    }

    const recentScores = Array.from(bestScoreByDate.entries())
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .slice(0, 4)
        .map(([, score]) => score)

    if (recentScores.length < 3) {
        return {
            exerciseId: input.exerciseId,
            exerciseName: input.exerciseName,
            status: 'insufficient_data',
            suggestion: 'log_more_data',
            exposureCount: recentScores.length,
            recentScores,
        }
    }

    const [latest, previous, third] = recentScores
    const bestPrevious = Math.max(previous, third)
    const improved = latest > bestPrevious * 1.01
    const stalled = latest <= previous * 1.01 && previous <= third * 1.01

    if (improved) {
        return {
            exerciseId: input.exerciseId,
            exerciseName: input.exerciseName,
            status: 'improving',
            suggestion: 'increase_weight_carefully',
            exposureCount: recentScores.length,
            recentScores,
        }
    }

    if (stalled) {
        return {
            exerciseId: input.exerciseId,
            exerciseName: input.exerciseName,
            status: 'stalled',
            suggestion: 'consider_recovery',
            exposureCount: recentScores.length,
            recentScores,
        }
    }

    return {
        exerciseId: input.exerciseId,
        exerciseName: input.exerciseName,
        status: 'holding',
        suggestion: 'add_reps',
        exposureCount: recentScores.length,
        recentScores,
    }
}

export function buildTrainingAnalytics(input: {
    sets: TrainingAnalyticsSet[]
    sessions: WorkoutSession[]
    exercises: Exercise[]
    unit: WeightUnit
    endDate: string
    dayCount?: number
}): TrainingAnalyticsSummary {
    const dayCount = input.dayCount ?? 7
    const completedSessions = input.sessions.filter((session) =>
        session.status === 'completed' &&
        !session.deleted_at &&
        isWithinLastDays(session.session_date, input.endDate, dayCount)
    )
    const recentSets = getRecentCompletedSets({
        sets: input.sets,
        endDate: input.endDate,
        dayCount,
    })

    const exerciseVolume = new Map<string, { volume: number; setCount: number }>()
    const muscleVolume = new Map<string, { volume: number; setCount: number }>()
    const sessionsByExercise = new Map<string, Set<string>>()

    for (const set of recentSets) {
        const reps = set.reps ?? 0
        const load = getVolumeLoad(set, input.unit)
        const volume = load === null ? 0 : load * reps
        const exerciseStats = exerciseVolume.get(set.exercise_id) ?? { volume: 0, setCount: 0 }
        exerciseStats.volume += volume
        exerciseStats.setCount += 1
        exerciseVolume.set(set.exercise_id, exerciseStats)

        const muscleGroup = getExerciseMuscleGroup(input.exercises, set.exercise_id)
        const muscleStats = muscleVolume.get(muscleGroup) ?? { volume: 0, setCount: 0 }
        muscleStats.volume += volume
        muscleStats.setCount += 1
        muscleVolume.set(muscleGroup, muscleStats)

        const sessionIds = sessionsByExercise.get(set.exercise_id) ?? new Set<string>()
        sessionIds.add(set.workout_session_id)
        sessionsByExercise.set(set.exercise_id, sessionIds)
    }

    const volumeByExercise = Array.from(exerciseVolume.entries())
        .map(([exerciseId, stats]) => ({
            exerciseId,
            exerciseName: getExerciseName(input.exercises, exerciseId),
            volume: Math.round(stats.volume),
            setCount: stats.setCount,
        }))
        .sort((a, b) => b.volume - a.volume)

    const volumeByMuscleGroup = Array.from(muscleVolume.entries())
        .map(([muscleGroup, stats]) => ({
            muscleGroup,
            volume: Math.round(stats.volume),
            setCount: stats.setCount,
        }))
        .sort((a, b) => b.volume - a.volume)

    const exerciseFrequency = Array.from(sessionsByExercise.entries())
        .map(([exerciseId, sessionIds]) => ({
            exerciseId,
            exerciseName: getExerciseName(input.exercises, exerciseId),
            sessions: sessionIds.size,
        }))
        .sort((a, b) => b.sessions - a.sessions)

    const stalledLifts = volumeByExercise
        .map((exercise) =>
            detectExerciseStall({
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                sets: input.sets,
                unit: input.unit,
            })
        )
        .filter((summary) => summary.status !== 'insufficient_data')
        .sort((a, b) => {
            if (a.status === b.status) {
                return a.exerciseName.localeCompare(b.exerciseName)
            }

            return a.status === 'stalled' ? -1 : 1
        })

    return {
        weeklySetCount: recentSets.length,
        workoutFrequency: completedSessions.length,
        totalVolume: volumeByExercise.reduce((sum, item) => sum + item.volume, 0),
        volumeByExercise,
        volumeByMuscleGroup,
        exerciseFrequency,
        stalledLifts,
    }
}

export function formatProgressionSuggestion(suggestion: ExerciseProgressionSuggestion) {
    const labels: Record<ExerciseProgressionSuggestion, string> = {
        log_more_data: 'Log more data',
        increase_weight_carefully: 'Increase carefully',
        add_reps: 'Add reps',
        repeat_same_load: 'Repeat same load',
        consider_recovery: 'Consider recovery',
    }

    return labels[suggestion]
}
