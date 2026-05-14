import { supabase } from '../../../lib/supabase/client'
import type { Database, HealthMetricSource, HealthMetricType } from '../../../lib/supabase/types'

export type HealthMetricEntry = Database['public']['Tables']['health_metric_entries']['Row']

export type UpsertHealthMetricEntryInput = {
    userId: string
    metricType: HealthMetricType
    metricDate: string
    value: number
    unit: string
    source?: HealthMetricSource
    notes?: string | null
    externalId?: string | null
    sleepStartTime?: string | null
    sleepEndTime?: string | null
    sleepQuality?: number | null
}

export type HealthMetricSummary = {
    latest: HealthMetricEntry | null
    weeklyAverage: number | null
    trend: 'up' | 'down' | 'flat' | 'unknown'
}

export const healthMetricOptions: Array<{
    type: HealthMetricType
    label: string
    unit: string
}> = [
        { type: 'sleep_hours', label: 'Sleep', unit: 'hours' },
        { type: 'steps', label: 'Steps', unit: 'steps' },
        { type: 'resting_heart_rate', label: 'Resting heart rate', unit: 'bpm' },
        { type: 'calories_burned', label: 'Calories burned', unit: 'kcal' },
        { type: 'water_ml', label: 'Water', unit: 'ml' },
        { type: 'creatine', label: 'Creatine', unit: 'serving' },
    ]

function createClientId() {
    return crypto.randomUUID()
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
}

function cleanTime(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed && /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null
}

function cleanSleepQuality(value: number | null | undefined) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null
    }

    return Math.min(5, Math.max(1, Math.round(value)))
}

function toDateTime(metricDate: string, time: string) {
    return new Date(`${metricDate}T${time}:00`)
}

function getDateTime(value: string) {
    const time = new Date(`${value}T12:00:00`).getTime()

    return Number.isFinite(time) ? time : null
}

export function getHealthMetricOption(type: HealthMetricType) {
    return healthMetricOptions.find((option) => option.type === type) ?? healthMetricOptions[0]
}

export function getLatestHealthMetric(entries: HealthMetricEntry[], metricType: HealthMetricType) {
    return entries
        .filter((entry) => entry.metric_type === metricType && !entry.deleted_at)
        .sort((a, b) => {
            const dateCompare = b.metric_date.localeCompare(a.metric_date)

            return dateCompare === 0
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : dateCompare
        })[0] ?? null
}

export function calculateSleepDurationHours(input: {
    sleepDate: string
    sleepStartTime: string
    sleepEndTime: string
}) {
    const start = toDateTime(input.sleepDate, input.sleepStartTime)
    const end = toDateTime(input.sleepDate, input.sleepEndTime)

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
        return null
    }

    if (end <= start) {
        end.setDate(end.getDate() + 1)
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    return Number.isFinite(hours) && hours > 0 ? Math.round(hours * 100) / 100 : null
}

export function summarizeHealthMetric(
    entries: HealthMetricEntry[],
    metricType: HealthMetricType,
    today: string
): HealthMetricSummary {
    const latest = getLatestHealthMetric(entries, metricType)
    const todayTime = getDateTime(today) ?? Date.now()
    const sevenDaysAgo = todayTime - 1000 * 60 * 60 * 24 * 7
    const fourteenDaysAgo = todayTime - 1000 * 60 * 60 * 24 * 14
    const metricEntries = entries.filter((entry) => entry.metric_type === metricType && !entry.deleted_at)

    const recentValues = metricEntries
        .filter((entry) => {
            const time = getDateTime(entry.metric_date)

            return time !== null && time >= sevenDaysAgo && time <= todayTime + 1000 * 60 * 60 * 24
        })
        .map((entry) => Number(entry.value))
        .filter((value) => Number.isFinite(value))

    const previousValues = metricEntries
        .filter((entry) => {
            const time = getDateTime(entry.metric_date)

            return time !== null && time >= fourteenDaysAgo && time < sevenDaysAgo
        })
        .map((entry) => Number(entry.value))
        .filter((value) => Number.isFinite(value))

    const weeklyAverage =
        recentValues.length > 0
            ? Math.round((recentValues.reduce((sum, value) => sum + value, 0) / recentValues.length) * 10) / 10
            : null

    if (recentValues.length === 0 || previousValues.length === 0) {
        return {
            latest,
            weeklyAverage,
            trend: 'unknown',
        }
    }

    const recentAverage = recentValues.reduce((sum, value) => sum + value, 0) / recentValues.length
    const previousAverage = previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length
    const difference = recentAverage - previousAverage

    return {
        latest,
        weeklyAverage,
        trend: Math.abs(difference) < 0.1 ? 'flat' : difference > 0 ? 'up' : 'down',
    }
}

export function groupHealthEntriesByDate(entries: HealthMetricEntry[]) {
    return entries.reduce<Record<string, HealthMetricEntry[]>>((groups, entry) => {
        if (entry.deleted_at) {
            return groups
        }

        const existingEntries = groups[entry.metric_date] ?? []
        existingEntries.push(entry)
        groups[entry.metric_date] = existingEntries

        return groups
    }, {})
}

export async function listHealthMetricEntries(userId: string) {
    const { data, error } = await supabase
        .from('health_metric_entries')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('metric_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(400)

    if (error) {
        throw error
    }

    return data
}

export async function upsertHealthMetricEntry(input: UpsertHealthMetricEntryInput) {
    const source = input.source ?? 'manual'

    const { data: existingEntry, error: existingEntryError } = await supabase
        .from('health_metric_entries')
        .select('*')
        .eq('user_id', input.userId)
        .eq('metric_type', input.metricType)
        .eq('metric_date', input.metricDate)
        .eq('source', source)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (existingEntryError) {
        throw existingEntryError
    }

    if (existingEntry) {
        const { data, error } = await supabase
            .from('health_metric_entries')
            .update({
                value: input.value,
                unit: input.unit,
                notes: cleanText(input.notes),
                external_id: input.externalId ?? null,
                sleep_start_time: input.metricType === 'sleep_hours' ? cleanTime(input.sleepStartTime) : null,
                sleep_end_time: input.metricType === 'sleep_hours' ? cleanTime(input.sleepEndTime) : null,
                sleep_quality: input.metricType === 'sleep_hours' ? cleanSleepQuality(input.sleepQuality) : null,
                version: existingEntry.version + 1,
                sync_status: 'synced',
            })
            .eq('id', existingEntry.id)
            .eq('user_id', input.userId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('health_metric_entries')
        .insert({
            user_id: input.userId,
            metric_type: input.metricType,
            metric_date: input.metricDate,
            value: input.value,
            unit: input.unit,
            source,
            notes: cleanText(input.notes),
            external_id: input.externalId ?? null,
            sleep_start_time: input.metricType === 'sleep_hours' ? cleanTime(input.sleepStartTime) : null,
            sleep_end_time: input.metricType === 'sleep_hours' ? cleanTime(input.sleepEndTime) : null,
            sleep_quality: input.metricType === 'sleep_hours' ? cleanSleepQuality(input.sleepQuality) : null,
            client_id: createClientId(),
            sync_status: 'synced',
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}
