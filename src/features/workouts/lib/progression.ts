import type { WeightUnit } from '../../../lib/supabase/types'
import { convertWeight, roundToOneDecimal } from '../../../lib/utils/units'
import type { PlannedExercise } from './workouts'
import type { WorkoutSet, WorkoutSetWithSessionDate } from './workout-sessions'

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
    assistWeightKg?: number | null
    addedWeightKg?: number | null
    loadType?: string | null
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

function getComparableLoadKg(set: PerformanceSet) {
    if (set.loadType === 'added_weight') {
        return set.addedWeightKg ?? set.weightKg
    }

    if (set.loadType === 'assisted') {
        return set.assistWeightKg ?? set.weightKg
    }

    return set.weightKg
}

function getHeaviestWeightKg(sets: PerformanceSet[]) {
    const weights = sets
        .map((set) => (set.loadType === 'added_weight' ? set.addedWeightKg ?? set.weightKg : set.weightKg))
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

function getCorrectedWeightedLoadKg(sets: PerformanceSet[], minReps: number) {
    const correctedLoads: number[] = []

    for (let index = 0; index < sets.length; index += 1) {
        const failedSet = sets[index]
        const failedLoadKg = getComparableLoadKg(failedSet)

        if (
            failedSet.loadType === 'assisted' ||
            isUnloadedSet(failedSet) ||
            typeof failedLoadKg !== 'number' ||
            !Number.isFinite(failedLoadKg) ||
            (failedSet.reps ?? 0) >= minReps
        ) {
            continue
        }

        const laterSuccessfulLoads = sets
            .slice(index + 1)
            .map((set) => ({ set, loadKg: getComparableLoadKg(set) }))
            .filter(
                (entry): entry is { set: PerformanceSet; loadKg: number } =>
                    entry.set.loadType !== 'assisted' &&
                    !isUnloadedSet(entry.set) &&
                    typeof entry.loadKg === 'number' &&
                    Number.isFinite(entry.loadKg) &&
                    entry.loadKg < failedLoadKg &&
                    (entry.set.reps ?? 0) >= minReps
            )
            .map((entry) => entry.loadKg)

        correctedLoads.push(...laterSuccessfulLoads)
    }

    if (correctedLoads.length === 0) {
        return null
    }

    return Math.max(...correctedLoads)
}

function getCorrectedAssistanceKg(sets: PerformanceSet[], minReps: number) {
    const correctedAssistanceWeights: number[] = []

    for (let index = 0; index < sets.length; index += 1) {
        const failedSet = sets[index]
        const failedAssistanceKg = getComparableLoadKg(failedSet)

        if (
            failedSet.loadType !== 'assisted' ||
            typeof failedAssistanceKg !== 'number' ||
            !Number.isFinite(failedAssistanceKg) ||
            (failedSet.reps ?? 0) >= minReps
        ) {
            continue
        }

        const laterSuccessfulAssistance = sets
            .slice(index + 1)
            .map((set) => ({ set, assistanceKg: getComparableLoadKg(set) }))
            .filter(
                (entry): entry is { set: PerformanceSet; assistanceKg: number } =>
                    entry.set.loadType === 'assisted' &&
                    typeof entry.assistanceKg === 'number' &&
                    Number.isFinite(entry.assistanceKg) &&
                    entry.assistanceKg > failedAssistanceKg &&
                    (entry.set.reps ?? 0) >= minReps
            )
            .map((entry) => entry.assistanceKg)

        correctedAssistanceWeights.push(...laterSuccessfulAssistance)
    }

    if (correctedAssistanceWeights.length === 0) {
        return null
    }

    return Math.min(...correctedAssistanceWeights)
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
        const hasMissedWork = input.sets.some((set) => !set.completed || set.setType === 'skipped')

        if (hasMissedWork) {
            return {
                kind: 'review_form',
                title: 'Repeat after missed work',
                nextWeight: null,
                nextReps: `${minReps}-${maxReps}`,
                explanation:
                    'The last session for this exercise was skipped or incomplete. Repeat the planned target before increasing.'
            }
        }

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
    const allAssistedSets = countedSets.length > 0 && countedSets.every((set) => set.loadType === 'assisted')
    const allUnloadedSets = countedSets.length > 0 && countedSets.every(isUnloadedSet)
    const rpeTooHigh =
        typeof targetRpe === 'number' &&
        typeof averageRpe === 'number' &&
        averageRpe > targetRpe + 1

    if (allAssistedSets) {
        const currentAssistanceKg = getCurrentAssistanceKg(countedSets)

        if (currentAssistanceKg === null) {
            return {
                kind: 'review_form',
                title: 'Review assisted work',
                nextWeight: null,
                nextReps: `${minReps}-${maxReps}`,
                explanation:
                    'Assisted sets were logged without an assistance weight. Add the assist amount to make future recommendations smarter.'
            }
        }

        if (anyBelowMinRange) {
            const correctedAssistanceKg = getCorrectedAssistanceKg(countedSets, minReps)

            if (correctedAssistanceKg !== null) {
                return {
                    kind: 'repeat_weight',
                    title: 'Use the corrected assistance',
                    nextWeight: roundToOneDecimal(convertWeight(correctedAssistanceKg, 'kg', input.unit)),
                    nextReps: `${minReps}-${maxReps}`,
                    explanation:
                        'An earlier assisted set missed the rep range, but a later set hit the range after you added more assistance. Start with that corrected assistance before reducing again.'
                }
            }

            return {
                kind: 'reduce_weight',
                title: 'Use a little more assistance',
                nextWeight: roundToOneDecimal(
                    convertWeight(currentAssistanceKg + convertIncrementToKg(weightIncrement, input.unit), 'kg', input.unit)
                ),
                nextReps: `${minReps}-${maxReps}`,
                explanation:
                    'At least one assisted set missed the rep range. A bit more assistance can help rebuild reps cleanly.'
            }
        }

        if (allHitTopOfRange) {
            return {
                kind: 'increase_weight',
                title: 'Reduce assistance next time',
                nextWeight: roundToOneDecimal(
                    convertWeight(Math.max(0, currentAssistanceKg - convertIncrementToKg(weightIncrement, input.unit)), 'kg', input.unit)
                ),
                nextReps: `${minReps}-${maxReps}`,
                explanation:
                    'You hit the top of the rep range across the planned assisted sets. Reducing assistance is the next progression step.'
            }
        }

        return {
            kind: 'repeat_weight',
            title: 'Repeat this assistance',
            nextWeight: roundToOneDecimal(convertWeight(currentAssistanceKg, 'kg', input.unit)),
            nextReps: `${minReps}-${maxReps}`,
            explanation:
                'Keep the same assistance and try to add reps until all planned sets reach the top of the range.'
        }
    }

    if (allUnloadedSets) {
        return {
            kind: allHitTopOfRange ? 'review_form' : 'repeat_weight',
            title: allHitTopOfRange ? 'Progress the variation' : 'Add reps first',
            nextWeight: null,
            nextReps: `${minReps}-${maxReps}`,
            explanation:
                allHitTopOfRange
                    ? 'You hit the rep target without external load. Progress by choosing a harder variation, adding tempo, or adding load if appropriate.'
                    : 'Keep the same bodyweight or no-weight movement and build reps across all planned sets.'
        }
    }

    if (anyBelowMinRange && heaviestWeightKg !== null) {
        const correctedWeightedLoadKg = getCorrectedWeightedLoadKg(countedSets, minReps)

        if (correctedWeightedLoadKg !== null) {
            return {
                kind: 'repeat_weight',
                title: 'Use the corrected weight',
                nextWeight: roundToOneDecimal(convertWeight(correctedWeightedLoadKg, 'kg', input.unit)),
                nextReps: `${minReps}-${maxReps}`,
                explanation:
                    'An earlier set missed the rep range, but a later lower-weight set hit the range. Start with that corrected weight instead of reducing again from the one set that was too heavy.'
            }
        }

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
    loggedSets: Array<WorkoutSet | WorkoutSetWithSessionDate>,
    unit: WeightUnit
) {
    return recommendDynamicDoubleProgression({
        sets: loggedSets.map((set) => ({
            weightKg: set.weight_kg,
            assistWeightKg: set.assist_weight_kg,
            addedWeightKg: set.added_weight_kg,
            loadType: set.load_type,
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

function getCurrentAssistanceKg(sets: PerformanceSet[]) {
    const assistanceWeights = sets
        .filter((set) => set.loadType === 'assisted')
        .map((set) => set.assistWeightKg ?? set.weightKg)
        .filter((weight): weight is number => typeof weight === 'number' && Number.isFinite(weight))

    if (assistanceWeights.length === 0) {
        return null
    }

    return Math.min(...assistanceWeights)
}

function isUnloadedSet(set: PerformanceSet) {
    return set.loadType === 'bodyweight' || set.loadType === 'no_weight'
}
