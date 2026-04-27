import type { NutritionGoalType, WeightUnit } from '../../../lib/supabase/types'
import type { NutritionLog, NutritionTarget } from './nutrition'

export type NutritionChartPoint = {
    date: string
    calories: number
    protein: number
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high'

export type CalculatedNutritionTargetInput = {
    bodyweight: number
    unit: WeightUnit
    goalType: NutritionGoalType
    activityLevel: ActivityLevel
    weeklyChange: number
}

export type CalculatedNutritionTarget = {
    calories: number
    proteinG: number
    maintenanceCalories: number
    calorieAdjustment: number
}

const activityMultiplierByLevel = {
    sedentary: 13,
    light: 14,
    moderate: 15,
    high: 16
} satisfies Record<ActivityLevel, number>

const proteinMultiplierByGoal = {
    gain_weight: 0.85,
    lose_weight: 1,
    maintain_weight: 0.85
} satisfies Record<NutritionGoalType, number>

function roundToNearestFive(value: number) {
    return Math.round(value / 5) * 5
}

function bodyweightToPounds(bodyweight: number, unit: WeightUnit) {
    if (unit === 'lb') {
        return bodyweight
    }

    return bodyweight / 0.45359237
}

function weeklyChangeToPounds(weeklyChange: number, unit: WeightUnit) {
    if (unit === 'lb') {
        return weeklyChange
    }

    return weeklyChange / 0.45359237
}

export function calculateSuggestedNutritionTarget(
    input: CalculatedNutritionTargetInput
): CalculatedNutritionTarget {
    const bodyweightLb = bodyweightToPounds(input.bodyweight, input.unit)
    const weeklyChangeLb = weeklyChangeToPounds(input.weeklyChange, input.unit)
    const maintenanceCalories = bodyweightLb * activityMultiplierByLevel[input.activityLevel]
    const weeklyCalorieChange = weeklyChangeLb * 3500
    const dailyAdjustmentMagnitude = weeklyCalorieChange / 7

    const calorieAdjustment =
        input.goalType === 'gain_weight'
            ? dailyAdjustmentMagnitude
            : input.goalType === 'lose_weight'
                ? -dailyAdjustmentMagnitude
                : 0

    const calories = maintenanceCalories + calorieAdjustment
    const proteinG = bodyweightLb * proteinMultiplierByGoal[input.goalType]

    return {
        calories: roundToNearestFive(calories),
        proteinG: roundToNearestFive(proteinG),
        maintenanceCalories: roundToNearestFive(maintenanceCalories),
        calorieAdjustment: roundToNearestFive(calorieAdjustment)
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