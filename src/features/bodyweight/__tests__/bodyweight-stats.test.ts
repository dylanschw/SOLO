import { describe, expect, it } from 'vitest'
import { calculateWeeklyAverage, getBodyweightTrendPoints } from '../lib/bodyweight-stats'
import type { BodyweightEntry } from '../lib/bodyweight'

function makeEntry(entryDate: string, weightKg: number): BodyweightEntry {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        entry_date: entryDate,
        weight_kg: weightKg,
        notes: null,
        client_id: crypto.randomUUID(),
        version: 1,
        deleted_at: null,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}

describe('bodyweight stats', () => {
    it('calculates current week average in pounds', () => {
        const entries = [
            makeEntry('2026-04-26', 81.6),
            makeEntry('2026-04-27', 82),
            makeEntry('2026-04-20', 90)
        ]

        const average = calculateWeeklyAverage(entries, 'lb', new Date('2026-04-27T12:00:00'))

        expect(average).toBe(180.3)
    })

    it('returns null when there are no entries in the current week', () => {
        const entries = [makeEntry('2026-04-20', 81.6)]

        const average = calculateWeeklyAverage(entries, 'lb', new Date('2026-04-27T12:00:00'))

        expect(average).toBeNull()
    })

    it('sorts chart points from oldest to newest', () => {
        const entries = [
            makeEntry('2026-04-27', 82),
            makeEntry('2026-04-25', 81.5)
        ]

        const points = getBodyweightTrendPoints(entries, 'kg')

        expect(points).toEqual([
            {
                date: '04-25',
                weight: 81.5
            },
            {
                date: '04-27',
                weight: 82
            }
        ])
    })
})