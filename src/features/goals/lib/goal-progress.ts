import type { GoalMetric } from '../../../lib/supabase/types'
import type { GoalTarget } from './goals'

export type GoalProgressStatus = 'good' | 'warning' | 'neutral'

export type GoalProgress = {
    metric: GoalMetric
    target: number
    actual: number | null
    remaining: number | null
    percent: number | null
    status: GoalProgressStatus
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
    }
}
