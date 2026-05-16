import { supabase } from '../../../lib/supabase/client'
import type { Database, ReminderType } from '../../../lib/supabase/types'

export type ReminderPreference = Database['public']['Tables']['reminder_preferences']['Row']

export type UpsertReminderPreferenceInput = {
    userId: string
    reminderType: ReminderType
    isEnabled: boolean
    reminderTime?: string | null
    daysOfWeek?: number[]
    notes?: string | null
}

export const reminderTypeOptions: Array<{
    type: ReminderType
    label: string
    defaultTime: string
}> = [
        { type: 'workout', label: 'Workout', defaultTime: '17:30' },
        { type: 'meal_breakfast', label: 'Breakfast', defaultTime: '08:00' },
        { type: 'meal_lunch', label: 'Lunch', defaultTime: '12:00' },
        { type: 'meal_dinner', label: 'Dinner', defaultTime: '18:30' },
        { type: 'weigh_in', label: 'Weigh-in', defaultTime: '07:00' },
        { type: 'sleep', label: 'Sleep', defaultTime: '22:30' },
        { type: 'scheduling', label: 'Scheduling', defaultTime: '09:00' },
        { type: 'water', label: 'Water', defaultTime: '10:00' },
        { type: 'creatine', label: 'Creatine', defaultTime: '10:30' },
    ]

function createClientId(userId: string, reminderType: ReminderType) {
    return `${userId}-${reminderType}`
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
}

export function normalizeReminderTime(value: string | null | undefined) {
    const trimmed = value?.trim()

    if (!trimmed || !/^\d{2}:\d{2}$/.test(trimmed)) {
        return null
    }

    return trimmed
}

export function getReminderOption(type: ReminderType) {
    return reminderTypeOptions.find((option) => option.type === type) ?? reminderTypeOptions[0]
}

export function canUseBrowserNotifications() {
    return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestBrowserNotificationPermission() {
    // TODO: Real reliable reminders need scheduled PWA push or native wrapper notifications.
    // This only records user intent and optionally requests the browser notification permission.
    if (!canUseBrowserNotifications()) {
        return 'unsupported' as const
    }

    return Notification.requestPermission()
}

export async function listReminderPreferences(userId: string) {
    const { data, error } = await supabase
        .from('reminder_preferences')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('reminder_type', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function upsertReminderPreference(input: UpsertReminderPreferenceInput) {
    const { data, error } = await supabase
        .from('reminder_preferences')
        .upsert(
            {
                user_id: input.userId,
                reminder_type: input.reminderType,
                is_enabled: input.isEnabled,
                reminder_time: normalizeReminderTime(input.reminderTime),
                days_of_week: input.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
                notes: cleanText(input.notes),
                client_id: createClientId(input.userId, input.reminderType),
                sync_status: 'synced' as const,
            },
            {
                onConflict: 'user_id,reminder_type',
            }
        )
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}
