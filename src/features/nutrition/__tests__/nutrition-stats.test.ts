import { describe, expect, it } from 'vitest'
import {
    calculateSuggestedNutritionTarget,
    calculateTargetProgress,
    getNutritionChartPoints,
    getTodayNutritionLog,
    summarizeNutrition
} from '../lib/nutrition-stats'
import type { NutritionLog, NutritionTarget } from '../lib/nutrition'

function makeLog(logDate: string, overrides: Partial<NutritionLog> = {}): NutritionLog {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        log_date: logDate,
        meal_count: 3,
        calories: 2500,
        protein_g: 180,
        carbs_g: 300,
        fat_g: 80,
        notes: null,
        client_id: crypto.randomUUID(),
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

function makeTarget(overrides: Partial<NutritionTarget> = {}): NutritionTarget {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        mode: 'manual',
        goal_type: 'maintain_weight',
        calories: 2500,
        protein_g: 180,
        carbs_g: null,
        fat_g: null,
        effective_from: '2026-04-27',
        is_active: true,
        client_id: crypto.randomUUID(),
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

describe('nutrition stats', () => {
    it('calculates suggested maintenance target from pounds', () => {
        const target = calculateSuggestedNutritionTarget({
            bodyweight: 180,
            unit: 'lb',
            goalType: 'maintain_weight',
            activityLevel: 'moderate',
            weeklyChange: 0
        })

        expect(target).toMatchObject({
            calories: 2700,
            proteinG: 155
        })
    })

    it('adds calories for gaining weight', () => {
        const target = calculateSuggestedNutritionTarget({
            bodyweight: 180,
            unit: 'lb',
            goalType: 'gain_weight',
            activityLevel: 'moderate',
            weeklyChange: 0.5
        })

        expect(target.calories).toBe(2950)
    })

    it('calculates target progress', () => {
        expect(calculateTargetProgress(1250, 2500)).toBe(50)
    })

    it('finds today log', () => {
        const logs = [makeLog('2026-04-26'), makeLog('2026-04-27')]

        const today = getTodayNutritionLog(logs, new Date('2026-04-27T12:00:00'))

        expect(today?.log_date).toBe('2026-04-27')
    })

    it('summarizes nutrition against target', () => {
        const summary = summarizeNutrition(makeLog('2026-04-27'), makeTarget())

        expect(summary).toMatchObject({
            mealCount: 3,
            calories: 2500,
            proteinG: 180,
            calorieProgress: 100,
            proteinProgress: 100
        })
    })

    it('sorts chart points oldest to newest', () => {
        const points = getNutritionChartPoints([
            makeLog('2026-04-27'),
            makeLog('2026-04-25', {
                calories: 2400,
                protein_g: 170
            })
        ])

        expect(points).toEqual([
            {
                date: '04-25',
                calories: 2400,
                protein: 170
            },
            {
                date: '04-27',
                calories: 2500,
                protein: 180
            }
        ])
    })
})