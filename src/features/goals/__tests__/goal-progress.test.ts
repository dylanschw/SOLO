import { describe, expect, it } from 'vitest'
import { calculateGoalProgress, formatGoalProgressLabel, getGoalProgressLabel, getGoalValue } from '../lib/goal-progress'

describe('goal progress utilities', () => {
    it('finds an active goal value', () => {
        expect(
            getGoalValue(
                [
                    {
                        metric: 'steps',
                        target_value: 8000,
                        is_active: true,
                        deleted_at: null,
                    },
                ],
                'steps',
                5000
            )
        ).toBe(8000)
    })

    it('falls back when no active goal exists', () => {
        expect(getGoalValue([], 'water', 3000)).toBe(3000)
    })

    it('calculates progress for higher-is-better goals', () => {
        const progress = calculateGoalProgress({
            metric: 'protein',
            target: 180,
            actual: 90,
        })

        expect(progress.remaining).toBe(90)
        expect(progress.percent).toBe(50)
        expect(progress.status).toBe('warning')
        expect(progress.label).toBe('behind')
    })

    it('calculates progress for lower-is-better goals', () => {
        const progress = calculateGoalProgress({
            metric: 'resting_heart_rate',
            target: 60,
            actual: 58,
            lowerIsBetter: true,
        })

        expect(progress.remaining).toBe(0)
        expect(progress.status).toBe('good')
        expect(progress.label).toBe('complete')
    })

    it('formats goal pace labels for UI copy', () => {
        expect(getGoalProgressLabel({ percent: 95 })).toBe('on_pace')
        expect(getGoalProgressLabel({ percent: null })).toBe('needs_attention')
        expect(formatGoalProgressLabel('needs_attention')).toBe('needs attention')
    })
})
