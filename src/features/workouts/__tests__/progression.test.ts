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

    it('uses the corrected weight when a later lighter set reaches the rep range', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: 100,
                    reps: 6,
                    rpe: 10,
                    setType: 'working',
                    completed: true
                },
                {
                    weightKg: 90,
                    reps: 8,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                },
                {
                    weightKg: 90,
                    reps: 9,
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
        expect(recommendation.title).toMatch(/corrected weight/i)
        expect(recommendation.nextWeight).toBe(90)
    })

    it('uses the corrected assistance when a later easier assisted set reaches the rep range', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: null,
                    assistWeightKg: 20,
                    loadType: 'assisted',
                    reps: 5,
                    rpe: 10,
                    setType: 'working',
                    completed: true
                },
                {
                    weightKg: null,
                    assistWeightKg: 30,
                    loadType: 'assisted',
                    reps: 8,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                }
            ],
            plannedSets: 2,
            minReps: 8,
            maxReps: 10,
            targetRpe: 8,
            unit: 'kg'
        })

        expect(recommendation.kind).toBe('repeat_weight')
        expect(recommendation.title).toMatch(/corrected assistance/i)
        expect(recommendation.nextWeight).toBe(30)
    })

    it('recommends reducing assistance after assisted sets hit the top of the range', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: null,
                    assistWeightKg: 27.22,
                    loadType: 'assisted',
                    reps: 10,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                },
                {
                    weightKg: null,
                    assistWeightKg: 27.22,
                    loadType: 'assisted',
                    reps: 10,
                    rpe: 8,
                    setType: 'working',
                    completed: true
                }
            ],
            plannedSets: 2,
            minReps: 8,
            maxReps: 10,
            targetRpe: 8,
            unit: 'lb',
            weightIncrement: 5
        })

        expect(recommendation.kind).toBe('increase_weight')
        expect(recommendation.title).toMatch(/reduce assistance/i)
        expect(recommendation.nextWeight).toBe(55)
    })

    it('keeps no-weight progressions focused on reps or harder variations', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: null,
                    loadType: 'no_weight',
                    reps: 15,
                    rpe: null,
                    setType: 'working',
                    completed: true
                }
            ],
            plannedSets: 1,
            minReps: 10,
            maxReps: 15,
            targetRpe: null,
            unit: 'lb'
        })

        expect(recommendation.kind).toBe('review_form')
        expect(recommendation.nextWeight).toBeNull()
    })

    it('does not increase after skipped work', () => {
        const recommendation = recommendDynamicDoubleProgression({
            sets: [
                {
                    weightKg: null,
                    loadType: 'no_weight',
                    reps: null,
                    rpe: null,
                    setType: 'skipped',
                    completed: false
                }
            ],
            plannedSets: 3,
            minReps: 8,
            maxReps: 12,
            targetRpe: 8,
            unit: 'lb'
        })

        expect(recommendation.kind).toBe('review_form')
        expect(recommendation.title).toMatch(/missed work/i)
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
