import type { NutritionGoalType } from '../../../lib/supabase/types'
import type { NutritionLog, NutritionTarget } from './nutrition'

export type NutritionChartPoint = {
    date: string
    calories: number
    protein: number
}

export type CalculatedNutritionTargetInput = {
    bodyweight: number
    unit: 'lb' | 'kg'
    goalType: NutritionGoalType
}

export type CalculatedNutritionTarget = {
    calories: number
    proteinG: number
}

function roundToNearestFive(value: number) {
    return Math.round(value / 5) * 5
}

function bodyweightToPounds(bodyweight: number, unit: 'lb' | 'kg') {
    if (unit === 'lb') {
        return bodyweight
    }

    return bodyweight / 0.45359237
}

export function calculateSuggestedNutritionTarget(
    input: CalculatedNutritionTargetInput
): CalculatedNutritionTarget {
    const bodyweightLb = bodyweightToPounds(input.bodyweight, input.unit)
    const maintenanceCalories = bodyweightLb * 15

    const calorieAdjustmentByGoal = {
        gain_weight: 250,
        lose_weight: -400,
        maintain_weight: 0
    } satisfies Record<NutritionGoalType, number>

    return {
        calories: roundToNearestFive(maintenanceCalories + calorieAdjustmentByGoal[input.goalType]),
        proteinG: roundToNearestFive(bodyweightLb * 0.8)
    }
}

export function calculateTargetProgress(
    value: number | null | undefined,
    target: number | null | undefined
) {
    if (!value || !target || target <= 0) {
        return 0
    }

    return Math.min(Math.round((value / target) * 100), 999)
}

export function getTodayNutritionLog(logs: NutritionLog[], today = new Date()) {
    const todayString = today.toISOString().slice(0, 10)

    return logs.find((log) => log.log_date === todayString) ?? null
}

export function getNutritionChartPoints(logs: NutritionLog[]): NutritionChartPoint[] {
    return [...logs]
        .filter((log) => !log.deleted_at)
        .sort((a, b) => a.log_date.localeCompare(b.log_date))
        .map((log) => ({
            date: log.log_date.slice(5),
            calories: log.calories ?? 0,
            protein: log.protein_g ?? 0
        }))
}

export function summarizeNutrition(log: NutritionLog | null, target: NutritionTarget | null) {
    return {
        mealCount: log?.meal_count ?? 0,
        calories: log?.calories ?? 0,
        proteinG: log?.protein_g ?? 0,
        calorieTarget: target?.calories ?? null,
        proteinTarget: target?.protein_g ?? null,
        calorieProgress: calculateTargetProgress(log?.calories, target?.calories),
        proteinProgress: calculateTargetProgress(log?.protein_g, target?.protein_g)
    }
}