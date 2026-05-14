import { Activity, HeartPulse, Plus, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { HealthMetricType } from '../../lib/supabase/types'
import {
    getHealthMetricOption,
    getLatestHealthMetric,
    healthMetricOptions,
} from './lib/health-metrics'
import {
    appleHealthProviderPlaceholder,
    manualHealthMetricProvider,
} from './lib/health-providers'
import {
    useHealthMetricEntries,
    useUpsertHealthMetricEntry,
} from './hooks/useHealthMetrics'

function todayDate() {
    return new Date().toISOString().slice(0, 10)
}

function formatValue(value: number, unit: string) {
    return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`
}

export function HealthPage() {
    const entriesQuery = useHealthMetricEntries()
    const upsertHealthMetric = useUpsertHealthMetricEntry()
    const entries = entriesQuery.data ?? []

    const [metricDate, setMetricDate] = useState(todayDate())
    const [metricType, setMetricType] = useState<HealthMetricType>('sleep_hours')
    const [metricValue, setMetricValue] = useState('')
    const [notes, setNotes] = useState('')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const selectedMetricOption = getHealthMetricOption(metricType)
    const providerAvailability = useMemo(
        () => ({
            manual: manualHealthMetricProvider.source,
            appleHealth: appleHealthProviderPlaceholder.source,
        }),
        []
    )

    const latestMetricCards = healthMetricOptions.map((option) => ({
        ...option,
        entry: getLatestHealthMetric(entries, option.type),
    }))

    async function handleSaveMetric(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatusMessage(null)
        setErrorMessage(null)

        const parsedValue = Number(metricValue)

        if (!metricDate) {
            setErrorMessage('Choose a date.')
            return
        }

        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
            setErrorMessage('Enter a valid value.')
            return
        }

        try {
            await upsertHealthMetric.mutateAsync({
                metricDate,
                metricType,
                value: parsedValue,
                unit: selectedMetricOption.unit,
                source: 'manual',
                notes,
            })

            setMetricValue('')
            setNotes('')
            setStatusMessage('Health metric saved.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not save health metric.')
        }
    }

    return (
        <section>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Personal dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Health</h1>

            {statusMessage ? (
                <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
                    {statusMessage}
                </p>
            ) : null}

            {errorMessage ? (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
                    {errorMessage}
                </p>
            ) : null}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {latestMetricCards.map((card) => (
                    <article
                        key={card.type}
                        className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">{card.label}</p>
                            <HeartPulse className="size-5 text-emerald-600" />
                        </div>
                        <p className="mt-3 text-2xl font-bold">
                            {card.entry ? formatValue(Number(card.entry.value), card.entry.unit) : '--'}
                        </p>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                            {card.entry ? card.entry.metric_date : 'No entry'}
                        </p>
                    </article>
                ))}
            </div>

            <form
                onSubmit={handleSaveMetric}
                className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
            >
                <div className="flex items-center gap-3">
                    <Plus className="size-5 text-emerald-600" />
                    <h2 className="text-xl font-bold">Manual entry</h2>
                </div>

                <div className="mt-5 grid gap-4">
                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Date</span>
                        <input
                            type="date"
                            value={metricDate}
                            onChange={(event) => setMetricDate(event.target.value)}
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Metric</span>
                            <select
                                value={metricType}
                                onChange={(event) => setMetricType(event.target.value as HealthMetricType)}
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            >
                                {healthMetricOptions.map((option) => (
                                    <option key={option.type} value={option.type}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Value</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                step={metricType === 'sleep_hours' ? '0.25' : '1'}
                                value={metricValue}
                                onChange={(event) => setMetricValue(event.target.value)}
                                placeholder={selectedMetricOption.unit}
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>
                    </div>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Notes</span>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={3}
                            className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={upsertHealthMetric.isPending}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className="size-4" />
                        {upsertHealthMetric.isPending ? 'Saving...' : 'Save health metric'}
                    </button>
                </div>
            </form>

            <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center gap-3">
                    <Activity className="size-5 text-emerald-600" />
                    <h2 className="text-xl font-bold">Data sources</h2>
                </div>

                <div className="mt-4 grid gap-3">
                    <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
                        <p className="font-bold">Manual</p>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{providerAvailability.manual}</p>
                    </div>

                    <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
                        <p className="font-bold">Apple Health / Apple Watch</p>
                        <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-300">
                            Native iOS support is required before this source can sync.
                        </p>
                    </div>
                </div>
            </article>
        </section>
    )
}
