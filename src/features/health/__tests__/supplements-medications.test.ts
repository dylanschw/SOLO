import { describe, expect, it } from 'vitest'
import {
    calculateTodaySupplementMedicationCompletion,
    calculateWeeklySupplementMedicationAdherence,
    filterSupplementMedicationItems,
    formatSupplementMedicationDose,
    groupSupplementMedicationLogsByDate,
    normalizeSupplementMedicationStatus,
} from '../lib/supplements-medications'
import type { SupplementMedicationItem, SupplementMedicationLog } from '../lib/supplements-medications'

function makeItem(overrides: Partial<SupplementMedicationItem>): SupplementMedicationItem {
    return {
        id: 'item-1',
        user_id: 'user-1',
        item_type: 'supplement',
        name: 'User item',
        dose_amount: 1,
        dose_unit: 'serving',
        frequency: 'daily',
        preferred_time: '09:00',
        notes: null,
        is_active: true,
        is_archived: false,
        client_id: 'client-item-1',
        sync_status: 'synced',
        version: 1,
        deleted_at: null,
        created_at: '2026-05-17T12:00:00.000Z',
        updated_at: '2026-05-17T12:00:00.000Z',
        ...overrides,
    }
}

function makeLog(overrides: Partial<SupplementMedicationLog>): SupplementMedicationLog {
    return {
        id: 'log-1',
        user_id: 'user-1',
        item_id: 'item-1',
        log_date: '2026-05-17',
        status: 'pending',
        taken_at: null,
        skipped_at: null,
        missed_at: null,
        notes: null,
        source: 'manual',
        external_source_id: null,
        client_id: 'client-log-1',
        sync_status: 'synced',
        version: 1,
        deleted_at: null,
        created_at: '2026-05-17T12:00:00.000Z',
        updated_at: '2026-05-17T12:00:00.000Z',
        ...overrides,
    }
}

describe('supplements and medications utilities', () => {
    it('normalizes unknown statuses to pending', () => {
        expect(normalizeSupplementMedicationStatus('taken')).toBe('taken')
        expect(normalizeSupplementMedicationStatus('done')).toBe('pending')
    })

    it('filters active and archived user-created items', () => {
        const activeSupplement = makeItem({ id: 'supplement', name: 'Vitamin created by user' })
        const activeMedication = makeItem({ id: 'medication', item_type: 'medication', name: 'Medication created by user' })
        const archived = makeItem({ id: 'archived', name: 'Archived item', is_active: false, is_archived: true })
        const deleted = makeItem({ id: 'deleted', deleted_at: '2026-05-17T12:00:00.000Z' })

        expect(filterSupplementMedicationItems([activeMedication, archived, activeSupplement, deleted], { search: 'user' }))
            .toEqual([activeMedication, activeSupplement])
        expect(filterSupplementMedicationItems([activeMedication, archived, activeSupplement], { showArchived: true }))
            .toEqual([archived])
    })

    it('groups logs by date without deleted logs', () => {
        const groups = groupSupplementMedicationLogsByDate([
            makeLog({ id: 'one', log_date: '2026-05-17', status: 'taken' }),
            makeLog({ id: 'two', log_date: '2026-05-17', status: 'skipped' }),
            makeLog({ id: 'deleted', log_date: '2026-05-16', deleted_at: '2026-05-17T12:00:00.000Z' }),
        ])

        expect(groups['2026-05-17']).toHaveLength(2)
        expect(groups['2026-05-16']).toBeUndefined()
    })

    it('calculates today completion from active items and daily logs', () => {
        const items = [
            makeItem({ id: 'taken' }),
            makeItem({ id: 'missed', item_type: 'medication' }),
            makeItem({ id: 'pending' }),
            makeItem({ id: 'archived', is_active: false, is_archived: true }),
        ]
        const logs = [
            makeLog({ item_id: 'taken', status: 'taken' }),
            makeLog({ item_id: 'missed', status: 'missed' }),
        ]

        expect(calculateTodaySupplementMedicationCompletion({ items, logs, today: '2026-05-17' })).toMatchObject({
            total: 3,
            taken: 1,
            missed: 1,
            pending: 1,
            completed: 2,
            completionPercentage: 67,
            takenPercentage: 33,
        })
    })

    it('calculates weekly adherence by item type', () => {
        const items = [
            makeItem({ id: 'supplement' }),
            makeItem({ id: 'medication', item_type: 'medication' }),
        ]
        const logs = [
            makeLog({ item_id: 'supplement', log_date: '2026-05-17', status: 'taken' }),
            makeLog({ item_id: 'supplement', log_date: '2026-05-16', status: 'taken' }),
            makeLog({ item_id: 'supplement', log_date: '2026-05-15', status: 'skipped' }),
            makeLog({ item_id: 'medication', log_date: '2026-05-17', status: 'taken' }),
        ]

        expect(calculateWeeklySupplementMedicationAdherence({
            items,
            logs,
            endDate: '2026-05-17',
            itemType: 'supplement',
        })).toMatchObject({
            expectedCount: 7,
            takenCount: 2,
            skippedCount: 1,
            adherencePercentage: 29,
        })
    })

    it('formats saved doses without adding advice', () => {
        expect(formatSupplementMedicationDose(makeItem({ dose_amount: 2.5, dose_unit: 'mg' }))).toBe('2.5 mg')
        expect(formatSupplementMedicationDose(makeItem({ dose_amount: null, dose_unit: null }))).toBe('No dose saved')
    })
})
