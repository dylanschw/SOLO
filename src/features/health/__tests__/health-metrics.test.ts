import { describe, expect, it } from 'vitest'
import {
    calculateSleepDurationHours,
    getHealthMetricOption,
    getLatestHealthMetric,
    groupHealthEntriesByDate,
    summarizeHealthMetric,
} from '../lib/health-metrics'
import type { HealthMetricEntry } from '../lib/health-metrics'

function makeEntry(overrides: Partial<HealthMetricEntry>): HealthMetricEntry {
    return {
        id: 'entry-1',
        user_id: 'user-1',
        metric_type: 'steps',
        metric_date: '2026-05-14',
        value: 5000,
        unit: 'steps',
        source: 'manual',
        notes: null,
        external_id: null,
        sleep_start_time: null,
        sleep_end_time: null,
        sleep_quality: null,
        client_id: 'client-1',
        sync_status: 'synced',
        version: 1,
        deleted_at: null,
        created_at: '2026-05-14T12:00:00.000Z',
        updated_at: '2026-05-14T12:00:00.000Z',
        ...overrides,
    }
}

describe('health metric utilities', () => {
    it('finds a metric option', () => {
        expect(getHealthMetricOption('sleep_hours').unit).toBe('hours')
    })

    it('returns the latest active metric entry', () => {
        const latest = getLatestHealthMetric(
            [
                makeEntry({ id: 'older', metric_date: '2026-05-13' }),
                makeEntry({ id: 'deleted', metric_date: '2026-05-15', deleted_at: '2026-05-15T12:00:00.000Z' }),
                makeEntry({ id: 'latest', metric_date: '2026-05-14' }),
            ],
            'steps'
        )

        expect(latest?.id).toBe('latest')
    })

    it('calculates overnight sleep duration from bed and wake time', () => {
        expect(
            calculateSleepDurationHours({
                sleepDate: '2026-05-14',
                sleepStartTime: '22:30',
                sleepEndTime: '06:45',
            })
        ).toBe(8.25)
    })

    it('summarizes weekly metric averages and trends', () => {
        const summary = summarizeHealthMetric(
            [
                makeEntry({ id: 'old', metric_date: '2026-05-01', value: 4000 }),
                makeEntry({ id: 'previous', metric_date: '2026-05-07', value: 5000 }),
                makeEntry({ id: 'latest', metric_date: '2026-05-14', value: 7000 }),
            ],
            'steps',
            '2026-05-14'
        )

        expect(summary.latest?.id).toBe('latest')
        expect(summary.weeklyAverage).toBe(6000)
        expect(summary.trend).toBe('up')
    })

    it('groups health entries by date', () => {
        const groups = groupHealthEntriesByDate([
            makeEntry({ id: 'sleep', metric_type: 'sleep_hours', metric_date: '2026-05-14' }),
            makeEntry({ id: 'steps', metric_type: 'steps', metric_date: '2026-05-14' }),
        ])

        expect(groups['2026-05-14']).toHaveLength(2)
    })
})
