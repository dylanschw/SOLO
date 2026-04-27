import { describe, expect, it } from 'vitest'
import {
    calculateBackoffWeight,
    recommendDeload,
    recommendDynamicDoubleProgression
} from '../lib/progression'

describe('progression recommendations', () => {
    it('recommends increasing weight when all planned sets hit the top of the range', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: 100,
                    reps: 12,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                },
                {
                    weightKg: 100,
                    reps: 12,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                },
                {
                    weightKg: 100,
                    reps: 12,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                }
            ],
            plannedSets: 3,
            minReps: 8,
            maxReps: 12,
            targetRpe: 8,
            unit: 'kg'
        })

        expect(recommendation.kind).toBe('increase_weight')
        expect(recommendation.nextWeight).toBe(102.5)
    })

    it('recommends repeating weight when reps are inside the range but not maxed', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: 100,
                    reps: 10,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                }
            ],
            plannedSets: 3,
            minReps: 8,
            maxReps: 12,
            targetRpe: 8,
            unit: 'kg'
        })

        expect(recommendation.kind).toBe('repeat_weight')
    })

    it('recommends reducing weight when a set falls below the minimum rep range', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: 100,
                    reps: 6,
                    rpe: 10,
                    setType: 'working',
                    completed: true
                }
            ],
            plannedSets: 3,
            minReps: 8,
            maxReps: 12,
            targetRpe: 8,
            unit: 'kg'
        })

        expect(recommendation.kind).toBe('reduce_weight')
        expect(recommendation.nextWeight).toBe(95)
    })

    it('calculates backoff weight', () => {
        expect(calculateBackoffWeight(100, 10)).toBe(90)
    })

    it('recommends deload when fatigue signals are high', () => {
        const recommendation = recommendDeload({
            consecutiveHardSessions: 3,
            performanceDropPercent: 0,
            jointPain: false,
            motivationLow: false
        })

        expect(recommendation.shouldDeload).toBe(true)
        expect(recommendation.weightPercentRange).toBe('60 to 70%')
        expect(recommendation.targetRpeRange).toBe('RPE 6 to 7')
        expect(recommendation.setsPerExercise).toBe(2)
    })

    it('does not recommend deload when fatigue signals are low', () => {
        const recommendation = recommendDeload({
            consecutiveHardSessions: 0,
            performanceDropPercent: 0,
            jointPain: false,
            motivationLow: false
        })

        expect(recommendation.shouldDeload).toBe(false)
    })
})