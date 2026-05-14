import type { GoalMetric } from '../../../lib/supabase/types'
import type { GoalTarget } from './goals'

export type GoalProgressStatus = 'good' | 'warning' | 'neutral'
export type GoalProgressLabel = 'ahead' | 'on_pace' | 'behind' | 'complete' | 'needs_attention'

export type GoalProgress = {
    metric: GoalMetric
    target: number
    actual: number | null
    remaining: number | null
    percent: number | null
    status: GoalProgressStatus
    label: GoalProgressLabel
}

export function getGoalValue(
    goals: Array<Pick<GoalTarget, 'metric' | 'target_value' | 'is_active' | 'deleted_at'>> | null | undefined,
    metric: GoalMetric,
    fallback: number | null = null
) {
    const goal = goals?.find((item) => item.metric === metric && item.is_active && !item.deleted_at)

    return goal ? Number(goal.target_value) : fallback
}

export function calculateGoalProgress(input: {
    metric: GoalMetric
    target: number
    actual: number | null
    lowerIsBetter?: boolean
}): GoalProgress {
    const actual = input.actual

    if (actual === null || !Number.isFinite(actual) || input.target <= 0) {
        return {
            metric: input.metric,
            target: input.target,
            actual,
            remaining: null,
            percent: null,
            status: 'neutral',
            label: 'needs_attention',
        }
    }

    const remaining = input.lowerIsBetter
        ? Math.max(0, actual - input.target)
        : Math.max(0, input.target - actual)
    const percent = input.lowerIsBetter
        ? Math.max(0, Math.min(100, (input.target / actual) * 100))
        : Math.max(0, Math.min(100, (actual / input.target) * 100))
    const isMet = input.lowerIsBetter ? actual <= input.target : actual >= input.target

    return {
        metric: input.metric,
        target: input.target,
        actual,
        remaining,
        percent: Math.round(percent),
        status: isMet ? 'good' : 'warning',
        label: getGoalProgressLabel({
            percent,
            isMet,
            lowerIsBetter: input.lowerIsBetter,
            actual,
            target: input.target,
        }),
    }
}

export function getGoalProgressLabel(input: {
    percent: number | null
    isMet?: boolean
    lowerIsBetter?: boolean
    actual?: number | null
    target?: number
}): GoalProgressLabel {
    if (input.percent === null || !Number.isFinite(input.percent)) {
        return 'needs_attention'
    }

    if (input.isMet) {
        return 'complete'
    }

    if (input.lowerIsBetter && input.actual !== null && typeof input.actual === 'number' && input.target) {
        const difference = input.actual - input.target

        if (difference <= 5) {
            return 'on_pace'
        }

        return 'behind'
    }

    if (input.percent >= 110) {
        return 'ahead'
    }

    if (input.percent >= 90) {
        return 'on_pace'
    }

    return 'behind'
}

export function formatGoalProgressLabel(label: GoalProgressLabel) {
    return label.replace('_', ' ')
}
