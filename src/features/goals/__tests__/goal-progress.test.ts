import { describe, expect, it } from 'vitest'
import { calculateGoalProgress, getGoalValue } from '../lib/goal-progress'

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
    })
})
