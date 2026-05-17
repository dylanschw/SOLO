import { Archive, CheckCircle2, Clock3, Edit3, Pill, RotateCcw, Save, Search, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { SupplementMedicationItemType, SupplementMedicationLogStatus } from '../../../lib/supabase/types'
import {
    useSetSupplementMedicationItemArchived,
    useSupplementMedicationItems,
    useSupplementMedicationLogs,
    useUpsertSupplementMedicationItem,
    useUpsertSupplementMedicationLog,
} from '../hooks/useSupplementsMedications'
import {
    calculateTodaySupplementMedicationCompletion,
    calculateWeeklySupplementMedicationAdherence,
    filterSupplementMedicationItems,
    formatSupplementMedicationDose,
    getSupplementMedicationLogForItem,
    groupSupplementMedicationLogsByDate,
    normalizeSupplementMedicationStatus,
    type SupplementMedicationItem,
} from '../lib/supplements-medications'

type ItemFormState = {
    itemId: string | null
    itemType: SupplementMedicationItemType
    name: string
    doseAmount: string
    doseUnit: string
    frequency: string
    preferredTime: string
    notes: string
}

const emptyItemForm: ItemFormState = {
    itemId: null,
    itemType: 'supplement',
    name: '',
    doseAmount: '',
    doseUnit: '',
    frequency: 'daily',
    preferredTime: '',
    notes: '',
}

const statusOptions: Array<{
    status: SupplementMedicationLogStatus
    label: string
}> = [
        { status: 'taken', label: 'Taken' },
        { status: 'skipped', label: 'Skipped' },
        { status: 'missed', label: 'Missed' },
        { status: 'pending', label: 'Pending' },
    ]

function todayDate() {
    return new Date().toISOString().slice(0, 10)
}

function formatItemType(type: SupplementMedicationItemType) {
    return type === 'supplement' ? 'Supplement' : 'Medication'
}

function formatStatus(status: SupplementMedicationLogStatus) {
    const labels: Record<SupplementMedicationLogStatus, string> = {
        taken: 'Taken',
        skipped: 'Skipped',
        missed: 'Missed',
        pending: 'Pending',
    }

    return labels[status]
}

function getStatusClass(status: SupplementMedicationLogStatus) {
    if (status === 'taken') {
        return 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900'
    }

    if (status === 'missed') {
        return 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900'
    }

    if (status === 'skipped') {
        return 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900'
    }

    return 'bg-stone-50 text-stone-700 ring-stone-200 dark:bg-neutral-900 dark:text-stone-200 dark:ring-neutral-800'
}

function getTimeLabel(value: string | null) {
    return value ? value.slice(0, 5) : 'No preferred time'
}

export function SupplementsMedicationsSection() {
    const today = todayDate()
    const itemsQuery = useSupplementMedicationItems()
    const logsQuery = useSupplementMedicationLogs()
    const upsertItem = useUpsertSupplementMedicationItem()
    const setItemArchived = useSetSupplementMedicationItemArchived()
    const upsertLog = useUpsertSupplementMedicationLog()

    const items = itemsQuery.data ?? []
    const logs = logsQuery.data ?? []
    const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm)
    const [searchText, setSearchText] = useState('')
    const [itemTypeFilter, setItemTypeFilter] = useState<SupplementMedicationItemType | 'all'>('all')
    const [showArchived, setShowArchived] = useState(false)
    const [logNotes, setLogNotes] = useState<Record<string, string>>({})
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const visibleItems = useMemo(
        () =>
            filterSupplementMedicationItems(items, {
                search: searchText,
                itemType: itemTypeFilter,
                showArchived,
            }),
        [items, itemTypeFilter, searchText, showArchived]
    )
    const activeItems = useMemo(
        () => filterSupplementMedicationItems(items, { showArchived: false }),
        [items]
    )
    const completion = useMemo(
        () => calculateTodaySupplementMedicationCompletion({ items, logs, today }),
        [items, logs, today]
    )
    const supplementAdherence = useMemo(
        () => calculateWeeklySupplementMedicationAdherence({ items, logs, endDate: today, itemType: 'supplement' }),
        [items, logs, today]
    )
    const medicationAdherence = useMemo(
        () => calculateWeeklySupplementMedicationAdherence({ items, logs, endDate: today, itemType: 'medication' }),
        [items, logs, today]
    )
    const itemById = useMemo(
        () => new Map(items.map((item) => [item.id, item])),
        [items]
    )
    const recentLogGroups = useMemo(
        () =>
            Object.entries(groupSupplementMedicationLogsByDate(logs))
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                .slice(0, 7),
        [logs]
    )

    function updateItemForm<K extends keyof ItemFormState>(field: K, value: ItemFormState[K]) {
        setItemForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }))
    }

    function startEditingItem(item: SupplementMedicationItem) {
        setStatusMessage(null)
        setErrorMessage(null)
        setItemForm({
            itemId: item.id,
            itemType: item.item_type,
            name: item.name,
            doseAmount: item.dose_amount === null ? '' : String(item.dose_amount),
            doseUnit: item.dose_unit ?? '',
            frequency: item.frequency,
            preferredTime: item.preferred_time?.slice(0, 5) ?? '',
            notes: item.notes ?? '',
        })
    }

    async function handleSaveItem(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatusMessage(null)
        setErrorMessage(null)

        const doseAmount = itemForm.doseAmount.trim() ? Number(itemForm.doseAmount) : null

        if (!itemForm.name.trim()) {
            setErrorMessage('Enter a name.')
            return
        }

        if (doseAmount !== null && (!Number.isFinite(doseAmount) || doseAmount < 0)) {
            setErrorMessage('Enter a valid dose amount or leave it blank.')
            return
        }

        try {
            await upsertItem.mutateAsync({
                itemId: itemForm.itemId,
                itemType: itemForm.itemType,
                name: itemForm.name,
                doseAmount,
                doseUnit: itemForm.doseUnit,
                frequency: itemForm.frequency,
                preferredTime: itemForm.preferredTime,
                notes: itemForm.notes,
            })

            setItemForm(emptyItemForm)
            setStatusMessage(itemForm.itemId ? 'Item updated.' : 'Item added.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not save item.')
        }
    }

    async function handleArchiveItem(item: SupplementMedicationItem, isArchived: boolean) {
        setStatusMessage(null)
        setErrorMessage(null)

        try {
            await setItemArchived.mutateAsync({
                itemId: item.id,
                isArchived,
            })
            setStatusMessage(isArchived ? 'Item archived.' : 'Item restored.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not update item.')
        }
    }

    async function handleSaveLog(item: SupplementMedicationItem, status: SupplementMedicationLogStatus) {
        setStatusMessage(null)
        setErrorMessage(null)

        try {
            await upsertLog.mutateAsync({
                itemId: item.id,
                logDate: today,
                status,
                notes: logNotes[item.id] ?? null,
                source: 'manual',
            })
            setStatusMessage(`${item.name} marked ${formatStatus(status).toLowerCase()}.`)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not save daily log.')
        }
    }

    return (
        <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-xl font-bold">Supplements & medications</h2>
                    <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        Track only items you create. SOLO does not provide medical advice or dose recommendations.
                    </p>
                </div>
                <Pill className="size-5 shrink-0 text-emerald-600" />
            </div>

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

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Today</p>
                    <p className="font-bold">{completion.completed}/{completion.total}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Taken</p>
                    <p className="font-bold">{completion.taken}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Missed</p>
                    <p className="font-bold">{completion.missed}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Handled</p>
                    <p className="font-bold">{completion.completionPercentage}%</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Supplement adherence this week</p>
                    <p className="mt-1 font-bold">{supplementAdherence.adherencePercentage}% taken</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Medication adherence this week</p>
                    <p className="mt-1 font-bold">{medicationAdherence.adherencePercentage}% taken</p>
                </div>
            </div>

            <form onSubmit={handleSaveItem} className="mt-5 rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                    <Pill className="size-4 text-emerald-600" />
                    <h3 className="font-bold">{itemForm.itemId ? 'Edit item' : 'Add item'}</h3>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Type</span>
                        <select
                            value={itemForm.itemType}
                            onChange={(event) => updateItemForm('itemType', event.target.value as SupplementMedicationItemType)}
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        >
                            <option value="supplement">Supplement</option>
                            <option value="medication">Medication</option>
                        </select>
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Name</span>
                        <input
                            type="text"
                            value={itemForm.name}
                            onChange={(event) => updateItemForm('name', event.target.value)}
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Dose amount</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={itemForm.doseAmount}
                            onChange={(event) => updateItemForm('doseAmount', event.target.value)}
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Dose unit</span>
                        <input
                            type="text"
                            value={itemForm.doseUnit}
                            onChange={(event) => updateItemForm('doseUnit', event.target.value)}
                            placeholder="mg, capsule, serving"
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Frequency</span>
                        <input
                            type="text"
                            value={itemForm.frequency}
                            onChange={(event) => updateItemForm('frequency', event.target.value)}
                            placeholder="daily, weekdays, as needed"
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Preferred time</span>
                        <input
                            type="time"
                            value={itemForm.preferredTime}
                            onChange={(event) => updateItemForm('preferredTime', event.target.value)}
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>
                </div>

                <label className="mt-3 grid gap-2">
                    <span className="text-sm font-semibold">Notes</span>
                    <textarea
                        value={itemForm.notes}
                        onChange={(event) => updateItemForm('notes', event.target.value)}
                        rows={3}
                        className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                    />
                </label>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                        type="submit"
                        disabled={upsertItem.isPending}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className="size-4" />
                        {upsertItem.isPending ? 'Saving...' : itemForm.itemId ? 'Save item' : 'Add item'}
                    </button>

                    {itemForm.itemId ? (
                        <button
                            type="button"
                            onClick={() => setItemForm(emptyItemForm)}
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                        >
                            Cancel edit
                        </button>
                    ) : null}
                </div>
            </form>

            <div className="mt-5 grid gap-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px]">
                    <label className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="search"
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            placeholder="Search your items"
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <select
                        value={itemTypeFilter}
                        onChange={(event) => setItemTypeFilter(event.target.value as SupplementMedicationItemType | 'all')}
                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                    >
                        <option value="all">All items</option>
                        <option value="supplement">Supplements</option>
                        <option value="medication">Medications</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setShowArchived(false)}
                        className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition ${!showArchived
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 dark:bg-neutral-900 dark:text-stone-300 dark:hover:bg-neutral-800'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowArchived(true)}
                        className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition ${showArchived
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 dark:bg-neutral-900 dark:text-stone-300 dark:hover:bg-neutral-800'
                            }`}
                    >
                        Archived
                    </button>
                </div>
            </div>

            {itemsQuery.isLoading || logsQuery.isLoading ? (
                <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Loading supplements and medications...</p>
            ) : null}

            {visibleItems.length === 0 && !itemsQuery.isLoading ? (
                <p className="mt-4 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                    {showArchived
                        ? 'No archived items match this view.'
                        : 'No items yet. Add your own supplements or medications to start tracking.'}
                </p>
            ) : null}

            <div className="mt-4 grid gap-3">
                {visibleItems.map((item) => {
                    const log = getSupplementMedicationLogForItem(logs, item.id, today)
                    const status = normalizeSupplementMedicationStatus(log?.status)

                    return (
                        <div
                            key={item.id}
                            className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                                            {formatItemType(item.item_type)}
                                        </span>
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${getStatusClass(status)}`}>
                                            {formatStatus(status)}
                                        </span>
                                    </div>
                                    <p className="mt-3 break-words text-lg font-bold">{item.name}</p>
                                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                                        {formatSupplementMedicationDose(item)} - {item.frequency} - {getTimeLabel(item.preferred_time)}
                                    </p>
                                    {item.notes ? (
                                        <p className="mt-2 break-words text-sm leading-6 text-stone-500 dark:text-stone-400">
                                            {item.notes}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:w-44">
                                    <button
                                        type="button"
                                        onClick={() => startEditingItem(item)}
                                        className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                    >
                                        <Edit3 className="size-4" />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleArchiveItem(item, !item.is_archived)}
                                        disabled={setItemArchived.isPending}
                                        className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                    >
                                        {item.is_archived ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                                        {item.is_archived ? 'Restore' : 'Archive'}
                                    </button>
                                </div>
                            </div>

                            {!item.is_archived ? (
                                <div className="mt-4 rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.status}
                                                type="button"
                                                onClick={() => handleSaveLog(item, option.status)}
                                                disabled={upsertLog.isPending}
                                                className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${status === option.status
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white text-stone-700 hover:bg-stone-100 dark:bg-neutral-950 dark:text-stone-200 dark:hover:bg-neutral-800'
                                                    }`}
                                            >
                                                {option.status === 'taken' ? <CheckCircle2 className="size-4" /> : null}
                                                {option.status === 'missed' ? <XCircle className="size-4" /> : null}
                                                {option.status === 'pending' ? <Clock3 className="size-4" /> : null}
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>

                                    <label className="mt-3 grid gap-2">
                                        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Daily note</span>
                                        <input
                                            type="text"
                                            value={logNotes[item.id] ?? log?.notes ?? ''}
                                            onChange={(event) =>
                                                setLogNotes((currentNotes) => ({
                                                    ...currentNotes,
                                                    [item.id]: event.target.value,
                                                }))
                                            }
                                            placeholder="Optional note for today"
                                            className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                        />
                                    </label>
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>

            <div className="mt-5 rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                <h3 className="font-bold">Recent history</h3>

                {recentLogGroups.length === 0 ? (
                    <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        No supplement or medication logs yet.
                    </p>
                ) : null}

                <div className="mt-3 grid gap-3">
                    {recentLogGroups.map(([date, dateLogs]) => (
                        <div key={date} className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                            <p className="font-semibold">{date}</p>
                            <div className="mt-2 grid gap-2">
                                {dateLogs.map((log) => {
                                    const item = itemById.get(log.item_id)
                                    const status = normalizeSupplementMedicationStatus(log.status)

                                    return (
                                        <div
                                            key={log.id}
                                            className="flex flex-col gap-2 rounded-xl bg-white p-3 text-sm dark:bg-neutral-950 sm:flex-row sm:items-start sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <p className="break-words font-semibold">
                                                    {item?.name ?? 'Archived item'}
                                                </p>
                                                {log.notes ? (
                                                    <p className="mt-1 break-words text-stone-500 dark:text-stone-400">{log.notes}</p>
                                                ) : null}
                                            </div>
                                            <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ring-1 ${getStatusClass(status)}`}>
                                                {formatStatus(status)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {activeItems.length > 0 ? (
                <p className="mt-4 text-xs leading-5 text-stone-500 dark:text-stone-400">
                    TODO: Real medication reminders and Apple Health medication sync require native notification and HealthKit work.
                </p>
            ) : null}
        </article>
    )
}
