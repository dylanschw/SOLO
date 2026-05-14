import type { HealthMetricSource, HealthMetricType } from '../../../lib/supabase/types'

export type HealthMetricProviderEntry = {
    metricType: HealthMetricType
    metricDate: string
    value: number
    unit: string
    source: HealthMetricSource
    externalId?: string | null
}

export type HealthMetricProvider = {
    source: HealthMetricSource
    isAvailable: () => Promise<boolean>
    readMetrics: (input: {
        fromDate: string
        toDate: string
        metricTypes: HealthMetricType[]
    }) => Promise<HealthMetricProviderEntry[]>
}

export const manualHealthMetricProvider: HealthMetricProvider = {
    source: 'manual',
    async isAvailable() {
        return true
    },
    async readMetrics() {
        return []
    },
}

export const appleHealthProviderPlaceholder: HealthMetricProvider = {
    source: 'apple_health',
    async isAvailable() {
        // TODO: Replace this placeholder from a native iOS wrapper. Browser PWAs
        // cannot request HealthKit permissions or read Apple Health data directly.
        return false
    },
    async readMetrics() {
        // TODO: Implement through Capacitor/React Native/native iOS with HealthKit
        // entitlement, permission prompts, Info.plist usage strings, and real-device tests.
        return []
    },
}
