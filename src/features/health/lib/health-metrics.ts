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

export async function listHealthMetricEntries(userId: string) {
    const { data, error } = await supabase
        .from('health_metric_entries')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('metric_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

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
