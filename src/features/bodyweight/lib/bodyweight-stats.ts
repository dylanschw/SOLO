import type { WeightUnit } from '../../../lib/supabase/types'
import { convertWeight, roundToOneDecimal } from '../../../lib/utils/units'
import type { BodyweightEntry } from './bodyweight'

export type BodyweightChartPoint = {
    date: string
    weight: number
}

export function getStartOfWeek(date: Date) {
    const copy = new Date(date)
    const day = copy.getDay()
    const diff = copy.getDate() - day

    copy.setDate(diff)
    copy.setHours(0, 0, 0, 0)

    return copy
}

export function isDateInCurrentWeek(dateString: string, now = new Date()) {
    const date = new Date(`${dateString}T00:00:00`)
    const weekStart = getStartOfWeek(now)
    const nextWeekStart = new Date(weekStart)

    nextWeekStart.setDate(weekStart.getDate() + 7)

    return date >= weekStart && date < nextWeekStart
}

export function calculateWeeklyAverage(entries: BodyweightEntry[], unit: WeightUnit, now = new Date()) {
    const currentWeekEntries = entries.filter((entry) => isDateInCurrentWeek(entry.entry_date, now))

    if (currentWeekEntries.length === 0) {
        return null
    }

    const totalKg = currentWeekEntries.reduce((sum, entry) => sum + entry.weight_kg, 0)
    const averageKg = totalKg / currentWeekEntries.length

    return convertWeight(averageKg, 'kg', unit)
}

export function formatBodyweight(entry: BodyweightEntry, unit: WeightUnit) {
    return convertWeight(entry.weight_kg, 'kg', unit)
}

export function getBodyweightTrendPoints(entries: BodyweightEntry[], unit: WeightUnit): BodyweightChartPoint[] {
    return [...entries]
        .filter((entry) => !entry.deleted_at)
        .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
        .map((entry) => ({
            date: entry.entry_date.slice(5),
            weight: roundToOneDecimal(convertWeight(entry.weight_kg, 'kg', unit))
        }))
}