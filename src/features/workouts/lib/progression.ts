import type { WeightUnit } from '../../../lib/supabase/types'
import { convertWeight, roundToOneDecimal } from '../../../lib/utils/units'
import type { PlannedExercise } from './workouts'
import type { WorkoutSet } from './workout-sessions'

export type ProgressionRecommendationKind =
    | 'no_data'
    | 'increase_weight'
    | 'repeat_weight'
    | 'reduce_weight'
    | 'review_form'

export type ProgressionRecommendation = {
    kind: ProgressionRecommendationKind
    title: string
    nextWeight: number | null
    nextReps: string | null
    explanation: string
}

export type DeloadSignals = {
    consecutiveHardSessions: number
    performanceDropPercent: number
    jointPain: boolean
    motivationLow: boolean
}

export type DeloadRecommendation = {
    shouldDeload: boolean
    title: string
    explanation: string
    weightPercentRange: string
    targetRpeRange: string
    setsPerExercise: number
}

type PerformanceSet = {
    weightKg: number | null
    reps: number | null
    rpe: number | null
    setType: string
    completed: boolean
}

function getDefaultWeightIncrement(unit: WeightUnit) {
    return unit === 'lb' ? 5 : 2.5
}

function getWorkingSets(sets: PerformanceSet[]) {
    return sets.filter((set) => set.completed && set.setType !== 'warmup')
}

function getHeaviestWeightKg(sets: PerformanceSet[]) {
    const weights = sets
        .map((set) => set.weightKg)
        .filter((weight): weight is number => typeof weight === 'number' && Number.isFinite(weight))

    if (weights.length === 0) {
        return null
    }

    return Math.max(...weights)
}

function getAverageRpe(sets: PerformanceSet[]) {
    const rpes = sets
        .map((set) => set.rpe)
        .filter((rpe): rpe is number => typeof rpe === 'number' && Number.isFinite(rpe))

    if (rpes.length === 0) {
        return null
    }

    return rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length
}

function convertIncrementToKg(increment: number, unit: WeightUnit) {
    return unit === 'kg' ? increment : increment * 0.45359237
}

export function calculateBackoffWeight(topSetWeight: number, backoffPercent: number) {
    const multiplier = 1 - backoffPercent / 100

    return roundToOneDecimal(topSetWeight * multiplier)
}

export function recommendDeload(signals: DeloadSignals): DeloadRecommendation {
    const shouldDeload =
        signals.consecutiveHardSessions >= 3 ||
        signals.performanceDropPercent >= 10 ||
        signals.jointPain ||
        signals.motivationLow

    if (!shouldDeload) {
        return {
            shouldDeload: false,
            title: 'No deload needed yet',
            explanation: 'Performance and fatigue signals do not strongly suggest a deload right now.',
            weightPercentRange: '100%',
            targetRpeRange: 'Normal target',
            setsPerExercise: 0
        }
    }

    return {
        shouldDeload: true,
        title: 'Deload recommended',
        explanation:
            'Reduce load and effort for recovery. A conservative deload is useful when performance drops, fatigue stays high, joints hurt, or multiple sessions feel unusually hard.',
        weightPercentRange: '60 to 70%',
        targetRpeRange: 'RPE 6 to 7',
        setsPerExercise: 2
    }
}

export function recommendDynamicDoubleProgression(input: {
    sets: PerformanceSet[]
    plannedSets: number
    minReps: number | null
    maxReps: number | null
    targetRpe: number | null
    unit: WeightUnit
    weightIncrement?: number
}): ProgressionRecommendation {
    const workingSets = getWorkingSets(input.sets)
    const plannedSets = Math.max(input.plannedSets, 1)
    const minReps = input.minReps ?? 1
    const maxReps = input.maxReps ?? minReps
    const targetRpe = input.targetRpe
    const weightIncrement = input.weightIncrement ?? getDefaultWeightIncrement(input.unit)
    const heaviestWeightKg = getHeaviestWeightKg(workingSets)
    const averageRpe = getAverageRpe(workingSets)

    if (workingSets.length === 0) {
        return {
            kind: 'no_data',
            title: 'Log sets first',
            nextWeight: null,
            nextReps: null,
            explanation: 'There are no completed working sets to base a recommendation on yet.'
        }
    }

    const countedSets = workingSets.slice(0, plannedSets)
    const completedEnoughSets = countedSets.length >= plannedSets
    const allHitTopOfRange = completedEnoughSets && countedSets.every((set) => (set.reps ?? 0) >= maxReps)
    const anyBelowMinRange = countedSets.some((set) => (set.reps ?? 0) < minReps)
    const rpeTooHigh =
        typeof targetRpe === 'number' &&
        typeof averageRpe === 'number' &&
        averageRpe > targetRpe + 1

    if (anyBelowMinRange && heaviestWeightKg !== null) {
        return {
            kind: 'reduce_weight',
            title: 'Consider reducing weight',
            nextWeight: roundToOneDecimal(convertWeight(heaviestWeightKg * 0.95, 'kg', input.unit)),
            nextReps: `${minReps}-${maxReps}`,
            explanation:
                'At least one set was below the bottom of the rep range. Reducing slightly can help rebuild reps with better execution.'
        }
    }

    if (rpeTooHigh && heaviestWeightKg !== null) {
        return {
            kind: 'repeat_weight',
            title: 'Repeat this weight',
            nextWeight: convertWeight(heaviestWeightKg, 'kg', input.unit),
            nextReps: `${minReps}-${maxReps}`,
            explanation:
                'Average RPE was meaningfully above target. Repeat the weight and aim for cleaner reps before increasing.'
        }
    }

    if (allHitTopOfRange && heaviestWeightKg !== null) {
        const nextWeightKg = heaviestWeightKg + convertIncrementToKg(weightIncrement, input.unit)

        return {
            kind: 'increase_weight',
            title: 'Increase weight next time',
            nextWeight: convertWeight(nextWeightKg, 'kg', input.unit),
            nextReps: `${minReps}-${maxReps}`,
            explanation:
                'You hit the top of the rep range for the planned sets. Dynamic double progression suggests increasing weight next time.'
        }
    }

    if (heaviestWeightKg !== null) {
        return {
            kind: 'repeat_weight',
            title: 'Repeat and add reps',
            nextWeight: convertWeight(heaviestWeightKg, 'kg', input.unit),
            nextReps: `${minReps}-${maxReps}`,
            explanation:
                'Keep the same weight and try to add reps until you reach the top of the range on all planned sets.'
        }
    }

    return {
        kind: 'review_form',
        title: 'Review performance',
        nextWeight: null,
        nextReps: `${minReps}-${maxReps}`,
        explanation:
            'Reps were logged, but no weight was available. Use the rep range and RPE target to decide whether to repeat or increase.'
    }
}

export function buildRecommendationForExercise(
    plannedExercise: PlannedExercise,
    loggedSets: WorkoutSet[],
    unit: WeightUnit
) {
    return recommendDynamicDoubleProgression({
        sets: loggedSets.map((set) => ({
            weightKg: set.weight_kg,
            reps: set.reps,
            rpe: set.rpe,
            setType: set.set_type,
            completed: set.completed
        })),
        plannedSets: plannedExercise.planned_sets,
        minReps: plannedExercise.min_reps,
        maxReps: plannedExercise.max_reps,
        targetRpe: plannedExercise.target_rpe,
        unit
    })
}