import { describe, expect, it } from 'vitest'
import { getHealthMetricOption, getLatestHealthMetric } from '../lib/health-metrics'
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
})
