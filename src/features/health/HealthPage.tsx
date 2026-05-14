import { Activity, HeartPulse, Plus, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ActivityHeatmap } from '../../components/ui/ActivityHeatmap'
import type { GoalMetric, HealthMetricType } from '../../lib/supabase/types'
import { useGoalTargets } from '../goals/hooks/useGoals'
import { calculateGoalProgress, formatGoalProgressLabel, getGoalValue } from '../goals/lib/goal-progress'
import {
    buildActivityHeatmap,
    calculateActivityHeatmapStats,
    countActivityByDate,
} from '../dashboard/lib/activity-heatmap'
import {
    calculateSleepDurationHours,
    groupHealthEntriesByDate,
    getHealthMetricOption,
    getLatestHealthMetric,
    healthMetricOptions,
    summarizeHealthMetric,
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

function formatOptionalValue(value: number | null, unit: string) {
    return value === null ? '--' : formatValue(value, unit)
}

function formatTrend(trend: 'up' | 'down' | 'flat' | 'unknown') {
    if (trend === 'unknown') {
        return 'Need more data'
    }

    if (trend === 'flat') {
        return 'Stable'
    }

    return trend === 'up' ? 'Trending up' : 'Trending down'
}

const healthGoalMetricByType: Partial<Record<HealthMetricType, GoalMetric>> = {
    sleep_hours: 'sleep',
    steps: 'steps',
    resting_heart_rate: 'resting_heart_rate',
    water_ml: 'water',
}

export function HealthPage() {
    const entriesQuery = useHealthMetricEntries()
    const goalsQuery = useGoalTargets()
    const upsertHealthMetric = useUpsertHealthMetricEntry()
    const entries = entriesQuery.data ?? []
    const goals = goalsQuery.data ?? []

    const [metricDate, setMetricDate] = useState(todayDate())
    const [metricType, setMetricType] = useState<HealthMetricType>('sleep_hours')
    const [metricValue, setMetricValue] = useState('')
    const [sleepStartTime, setSleepStartTime] = useState('')
    const [sleepEndTime, setSleepEndTime] = useState('')
    const [sleepQuality, setSleepQuality] = useState('')
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

    const latestMetricCards = healthMetricOptions.map((option) => {
        const summary = summarizeHealthMetric(entries, option.type, todayDate())
        const goalMetric = healthGoalMetricByType[option.type]
        const goalValue = goalMetric ? getGoalValue(goals, goalMetric) : null
        const progress = goalMetric && goalValue
            ? calculateGoalProgress({
                metric: goalMetric,
                target: goalValue,
                actual: option.type === 'resting_heart_rate'
                    ? Number(summary.latest?.value ?? summary.weeklyAverage ?? NaN)
                    : summary.weeklyAverage,
                lowerIsBetter: option.type === 'resting_heart_rate',
            })
            : null

        return {
            ...option,
            entry: getLatestHealthMetric(entries, option.type),
            summary,
            progress,
        }
    })
    const sleepHeatmapCounts = countActivityByDate(
        entries.filter((entry) => entry.metric_type === 'sleep_hours'),
        (entry) => entry.metric_date
    )
    const sleepHeatmap = buildActivityHeatmap({
        endDate: todayDate(),
        weekCount: 13,
        countsByDate: sleepHeatmapCounts,
    })
    const sleepHeatmapStats = calculateActivityHeatmapStats({
        endDate: todayDate(),
        dayCount: 90,
        countsByDate: sleepHeatmapCounts,
    })
    const entriesByDate = useMemo(() => groupHealthEntriesByDate(entries), [entries])
    const recentEntryGroups = Object.entries(entriesByDate)
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .slice(0, 14)

    async function handleSaveMetric(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatusMessage(null)
        setErrorMessage(null)

        let parsedValue = Number(metricValue)

        if (!metricDate) {
            setErrorMessage('Choose a date.')
            return
        }

        if (metricType === 'sleep_hours' && !metricValue.trim() && sleepStartTime && sleepEndTime) {
            const calculatedSleep = calculateSleepDurationHours({
                sleepDate: metricDate,
                sleepStartTime,
                sleepEndTime,
            })

            if (calculatedSleep !== null) {
                parsedValue = calculatedSleep
            }
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
                sleepStartTime: metricType === 'sleep_hours' ? sleepStartTime : null,
                sleepEndTime: metricType === 'sleep_hours' ? sleepEndTime : null,
                sleepQuality: metricType === 'sleep_hours' && sleepQuality ? Number(sleepQuality) : null,
            })

            setMetricValue('')
            setSleepStartTime('')
            setSleepEndTime('')
            setSleepQuality('')
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
                        <div className="mt-3 grid gap-2 text-sm">
                            <p className="text-stone-600 dark:text-stone-300">
                                Weekly average: {formatOptionalValue(card.summary.weeklyAverage, card.unit)}
                            </p>
                            <p className="text-stone-500 dark:text-stone-400">{formatTrend(card.summary.trend)}</p>
                            {card.progress ? (
                                <span className="w-fit rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 dark:bg-neutral-900 dark:text-stone-200">
                                    {formatGoalProgressLabel(card.progress.label)}
                                </span>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>

            <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Sleep consistency</h2>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Last 90 days</p>
                    </div>
                    <HeartPulse className="size-5 text-emerald-600" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                        <p className="text-xs text-stone-500 dark:text-stone-400">Current</p>
                        <p className="font-bold">{sleepHeatmapStats.currentStreak}d</p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                        <p className="text-xs text-stone-500 dark:text-stone-400">Longest</p>
                        <p className="font-bold">{sleepHeatmapStats.longestStreak}d</p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                        <p className="text-xs text-stone-500 dark:text-stone-400">Logged</p>
                        <p className="font-bold">{sleepHeatmapStats.completionPercentage}%</p>
                    </div>
                </div>

                <div className="mt-4 rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <ActivityHeatmap weeks={sleepHeatmap} label="Sleep logging heatmap" />
                </div>
            </article>

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

                    {metricType === 'sleep_hours' ? (
                        <div className="grid grid-cols-1 gap-3 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900 sm:grid-cols-3">
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Sleep start</span>
                                <input
                                    type="time"
                                    value={sleepStartTime}
                                    onChange={(event) => setSleepStartTime(event.target.value)}
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Wake time</span>
                                <input
                                    type="time"
                                    value={sleepEndTime}
                                    onChange={(event) => setSleepEndTime(event.target.value)}
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Quality</span>
                                <select
                                    value={sleepQuality}
                                    onChange={(event) => setSleepQuality(event.target.value)}
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                >
                                    <option value="">Not rated</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                            </label>

                            <p className="sm:col-span-3 text-xs leading-5 text-stone-500 dark:text-stone-400">
                                Leave duration blank to calculate it from sleep start and wake time.
                            </p>
                        </div>
                    ) : null}

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

            <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="text-xl font-bold">Health history</h2>

                {entriesQuery.isLoading ? (
                    <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Loading health metrics...</p>
                ) : null}

                {recentEntryGroups.length === 0 && !entriesQuery.isLoading ? (
                    <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        No health metrics logged yet.
                    </p>
                ) : null}

                <div className="mt-4 grid gap-3">
                    {recentEntryGroups.map(([date, dateEntries]) => (
                        <div
                            key={date}
                            className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                        >
                            <p className="font-semibold">{date}</p>
                            <div className="mt-3 grid gap-2">
                                {dateEntries.map((entry) => {
                                    const option = getHealthMetricOption(entry.metric_type)

                                    return (
                                        <div
                                            key={entry.id}
                                            className="flex items-start justify-between gap-3 rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold">{option.label}</p>
                                                <p className="mt-1 text-stone-600 dark:text-stone-300">
                                                    {formatValue(Number(entry.value), entry.unit)}
                                                    {entry.sleep_quality ? ` - quality ${entry.sleep_quality}/5` : ''}
                                                </p>
                                                {entry.notes ? (
                                                    <p className="mt-1 break-words text-stone-500 dark:text-stone-400">
                                                        {entry.notes}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-semibold text-stone-500 dark:bg-neutral-950 dark:text-stone-400">
                                                {entry.source.replace('_', ' ')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </article>
        </section>
    )
}
