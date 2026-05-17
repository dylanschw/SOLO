import { supabase } from '../../../lib/supabase/client'
import type {
    Database,
    HealthMetricSource,
    SupplementMedicationItemType,
    SupplementMedicationLogStatus,
} from '../../../lib/supabase/types'

export type SupplementMedicationItem = Database['public']['Tables']['supplement_medication_items']['Row']
export type SupplementMedicationLog = Database['public']['Tables']['supplement_medication_logs']['Row']

export type UpsertSupplementMedicationItemInput = {
    userId: string
    itemId?: string | null
    itemType: SupplementMedicationItemType
    name: string
    doseAmount?: number | null
    doseUnit?: string | null
    frequency?: string | null
    preferredTime?: string | null
    notes?: string | null
}

export type UpsertSupplementMedicationLogInput = {
    userId: string
    itemId: string
    logDate: string
    status: SupplementMedicationLogStatus
    notes?: string | null
    source?: HealthMetricSource
    externalSourceId?: string | null
}

export type SupplementMedicationCompletion = {
    total: number
    taken: number
    skipped: number
    missed: number
    pending: number
    completed: number
    completionPercentage: number
    takenPercentage: number
}

export type SupplementMedicationAdherence = {
    expectedCount: number
    takenCount: number
    skippedCount: number
    missedCount: number
    pendingCount: number
    adherencePercentage: number
}

export type SupplementMedicationFilterInput = {
    search?: string
    itemType?: SupplementMedicationItemType | 'all'
    showArchived?: boolean
}

const logStatuses: SupplementMedicationLogStatus[] = ['taken', 'skipped', 'missed', 'pending']

function createClientId() {
    return crypto.randomUUID()
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
}

function cleanOptionalNumber(value: number | null | undefined) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return null
    }

    return Math.round(value * 100) / 100
}

function cleanTime(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed && /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null
}

function toDate(value: string) {
    return new Date(`${value}T00:00:00`)
}

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
    const copy = new Date(date)
    copy.setDate(copy.getDate() + days)
    return copy
}

function isActiveItem(item: SupplementMedicationItem) {
    return item.is_active && !item.is_archived && !item.deleted_at
}

function getLogTimestampPatch(status: SupplementMedicationLogStatus) {
    const now = new Date().toISOString()

    return {
        taken_at: status === 'taken' ? now : null,
        skipped_at: status === 'skipped' ? now : null,
        missed_at: status === 'missed' ? now : null,
    }
}

export function normalizeSupplementMedicationStatus(value: string | null | undefined): SupplementMedicationLogStatus {
    return logStatuses.includes(value as SupplementMedicationLogStatus)
        ? value as SupplementMedicationLogStatus
        : 'pending'
}

export function formatSupplementMedicationDose(item: Pick<SupplementMedicationItem, 'dose_amount' | 'dose_unit'>) {
    if (item.dose_amount === null && !item.dose_unit) {
        return 'No dose saved'
    }

    if (item.dose_amount === null) {
        return item.dose_unit ?? 'No dose saved'
    }

    const amount = Number(item.dose_amount)
    const formattedAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')

    return [formattedAmount, item.dose_unit].filter(Boolean).join(' ')
}

export function filterSupplementMedicationItems(
    items: SupplementMedicationItem[],
    input: SupplementMedicationFilterInput = {}
) {
    const search = input.search?.trim().toLowerCase() ?? ''
    const itemType = input.itemType ?? 'all'
    const showArchived = input.showArchived ?? false

    return items
        .filter((item) => !item.deleted_at)
        .filter((item) => item.is_archived === showArchived)
        .filter((item) => itemType === 'all' || item.item_type === itemType)
        .filter((item) => {
            if (!search) {
                return true
            }

            return [
                item.name,
                item.dose_unit,
                item.frequency,
                item.notes,
            ].some((value) => value?.toLowerCase().includes(search))
        })
        .sort((a, b) => {
            const typeCompare = a.item_type.localeCompare(b.item_type)

            return typeCompare === 0 ? a.name.localeCompare(b.name) : typeCompare
        })
}

export function getSupplementMedicationLogForItem(
    logs: SupplementMedicationLog[],
    itemId: string,
    logDate: string
) {
    return logs.find((log) => log.item_id === itemId && log.log_date === logDate && !log.deleted_at) ?? null
}

export function groupSupplementMedicationLogsByDate(logs: SupplementMedicationLog[]) {
    return logs.reduce<Record<string, SupplementMedicationLog[]>>((groups, log) => {
        if (log.deleted_at) {
            return groups
        }

        const existingLogs = groups[log.log_date] ?? []
        existingLogs.push(log)
        groups[log.log_date] = existingLogs

        return groups
    }, {})
}

export function calculateTodaySupplementMedicationCompletion(input: {
    items: SupplementMedicationItem[]
    logs: SupplementMedicationLog[]
    today: string
    itemType?: SupplementMedicationItemType | 'all'
}): SupplementMedicationCompletion {
    const itemType = input.itemType ?? 'all'
    const activeItems = input.items.filter((item) => isActiveItem(item) && (itemType === 'all' || item.item_type === itemType))
    const logsByItemId = new Map(
        input.logs
            .filter((log) => log.log_date === input.today && !log.deleted_at)
            .map((log) => [log.item_id, normalizeSupplementMedicationStatus(log.status)])
    )

    const counts = activeItems.reduce(
        (summary, item) => {
            const status = logsByItemId.get(item.id) ?? 'pending'
            summary[status] += 1
            return summary
        },
        {
            taken: 0,
            skipped: 0,
            missed: 0,
            pending: 0,
        }
    )
    const total = activeItems.length
    const completed = counts.taken + counts.skipped + counts.missed

    return {
        total,
        ...counts,
        completed,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        takenPercentage: total > 0 ? Math.round((counts.taken / total) * 100) : 0,
    }
}

export function calculateWeeklySupplementMedicationAdherence(input: {
    items: SupplementMedicationItem[]
    logs: SupplementMedicationLog[]
    endDate: string
    itemType?: SupplementMedicationItemType | 'all'
}): SupplementMedicationAdherence {
    const itemType = input.itemType ?? 'all'
    const activeItems = input.items.filter((item) => isActiveItem(item) && (itemType === 'all' || item.item_type === itemType))
    const activeItemIds = new Set(activeItems.map((item) => item.id))
    const end = toDate(input.endDate)
    const start = addDays(end, -6)
    const relevantLogs = input.logs.filter((log) => {
        if (log.deleted_at || !activeItemIds.has(log.item_id)) {
            return false
        }

        const logDate = toDate(log.log_date)

        return logDate >= start && logDate <= end
    })
    const takenCount = relevantLogs.filter((log) => normalizeSupplementMedicationStatus(log.status) === 'taken').length
    const skippedCount = relevantLogs.filter((log) => normalizeSupplementMedicationStatus(log.status) === 'skipped').length
    const missedCount = relevantLogs.filter((log) => normalizeSupplementMedicationStatus(log.status) === 'missed').length
    const expectedCount = activeItems.length * 7
    const pendingCount = Math.max(0, expectedCount - takenCount - skippedCount - missedCount)

    return {
        expectedCount,
        takenCount,
        skippedCount,
        missedCount,
        pendingCount,
        adherencePercentage: expectedCount > 0 ? Math.round((takenCount / expectedCount) * 100) : 0,
    }
}

export function countTakenSupplementMedicationLogsByDate(input: {
    items: SupplementMedicationItem[]
    logs: SupplementMedicationLog[]
    itemType?: SupplementMedicationItemType | 'all'
}) {
    const itemType = input.itemType ?? 'all'
    const itemIds = new Set(
        input.items
            .filter((item) => !item.deleted_at && (itemType === 'all' || item.item_type === itemType))
            .map((item) => item.id)
    )
    const counts = new Map<string, number>()

    for (const log of input.logs) {
        if (log.deleted_at || !itemIds.has(log.item_id) || normalizeSupplementMedicationStatus(log.status) !== 'taken') {
            continue
        }

        const dateKey = log.log_date.slice(0, 10)
        counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1)
    }

    return counts
}

export function getSupplementMedicationDateKeys(endDate: string, dayCount: number) {
    const end = toDate(endDate)
    const days: string[] = []

    for (let dayOffset = dayCount - 1; dayOffset >= 0; dayOffset -= 1) {
        days.push(toDateKey(addDays(end, -dayOffset)))
    }

    return days
}

export async function listSupplementMedicationItems(userId: string) {
    const { data, error } = await supabase
        .from('supplement_medication_items')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('is_archived', { ascending: true })
        .order('item_type', { ascending: true })
        .order('name', { ascending: true })
        .limit(200)

    if (error) {
        throw error
    }

    return data
}

export async function upsertSupplementMedicationItem(input: UpsertSupplementMedicationItemInput) {
    const payload = {
        item_type: input.itemType,
        name: input.name.trim(),
        dose_amount: cleanOptionalNumber(input.doseAmount),
        dose_unit: cleanText(input.doseUnit),
        frequency: cleanText(input.frequency) ?? 'daily',
        preferred_time: cleanTime(input.preferredTime),
        notes: cleanText(input.notes),
        sync_status: 'synced' as const,
    }

    if (!payload.name) {
        throw new Error('Enter a name.')
    }

    if (input.itemId) {
        const { data, error } = await supabase
            .from('supplement_medication_items')
            .update(payload)
            .eq('user_id', input.userId)
            .eq('id', input.itemId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('supplement_medication_items')
        .insert({
            ...payload,
            user_id: input.userId,
            client_id: createClientId(),
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function setSupplementMedicationItemArchived(userId: string, itemId: string, isArchived: boolean) {
    const { data, error } = await supabase
        .from('supplement_medication_items')
        .update({
            is_archived: isArchived,
            is_active: !isArchived,
            sync_status: 'synced',
        })
        .eq('user_id', userId)
        .eq('id', itemId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function listSupplementMedicationLogs(userId: string) {
    const { data, error } = await supabase
        .from('supplement_medication_logs')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500)

    if (error) {
        throw error
    }

    return data
}

export async function upsertSupplementMedicationLog(input: UpsertSupplementMedicationLogInput) {
    const status = normalizeSupplementMedicationStatus(input.status)
    const source = input.source ?? 'manual'
    const timestampPatch = getLogTimestampPatch(status)
    const { data: existingLog, error: existingLogError } = await supabase
        .from('supplement_medication_logs')
        .select('*')
        .eq('user_id', input.userId)
        .eq('item_id', input.itemId)
        .eq('log_date', input.logDate)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (existingLogError) {
        throw existingLogError
    }

    if (existingLog) {
        const { data, error } = await supabase
            .from('supplement_medication_logs')
            .update({
                status,
                ...timestampPatch,
                notes: cleanText(input.notes),
                source,
                external_source_id: cleanText(input.externalSourceId),
                version: existingLog.version + 1,
                sync_status: 'synced',
            })
            .eq('id', existingLog.id)
            .eq('user_id', input.userId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('supplement_medication_logs')
        .insert({
            user_id: input.userId,
            item_id: input.itemId,
            log_date: input.logDate,
            status,
            ...timestampPatch,
            notes: cleanText(input.notes),
            source,
            external_source_id: cleanText(input.externalSourceId),
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
