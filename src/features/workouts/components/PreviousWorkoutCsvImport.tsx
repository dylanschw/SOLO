import { ClipboardList, Copy, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    findPreviousWorkoutImportDuplicateHints,
    importPreviousWorkoutCsvRows,
} from '../lib/previous-workout-import'
import {
    buildPreviousWorkoutImportPlan,
    formatPreviousWorkoutCsvRowLoad,
    groupPreviousWorkoutCsvRows,
    parsePreviousWorkoutCsv,
    previousWorkoutCsvTemplate,
    summarizePreviousWorkoutImportPlan,
    type PreviousWorkoutCsvPreview
} from '../lib/previous-workout-csv'

type PreviousWorkoutCsvImportProps = {
    onImported?: () => void
}

export function PreviousWorkoutCsvImport({ onImported }: PreviousWorkoutCsvImportProps) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [csvText, setCsvText] = useState('')
    const [preview, setPreview] = useState<PreviousWorkoutCsvPreview | null>(null)
    const [duplicateHints, setDuplicateHints] = useState<string[]>([])
    const [allowPossibleDuplicates, setAllowPossibleDuplicates] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isImporting, setIsImporting] = useState(false)

    const groupedRows = useMemo(
        () => (preview ? groupPreviousWorkoutCsvRows(preview.rows) : {}),
        [preview]
    )

    const importPlan = useMemo(
        () => (preview ? buildPreviousWorkoutImportPlan(preview.rows) : null),
        [preview]
    )
    const importPlanSummary = importPlan ? summarizePreviousWorkoutImportPlan(importPlan) : null

    async function handlePreview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)
        setStatusMessage(null)
        setDuplicateHints([])
        setAllowPossibleDuplicates(false)

        try {
            const nextPreview = parsePreviousWorkoutCsv(csvText)
            setPreview(nextPreview)

            if (user) {
                setDuplicateHints(
                    await findPreviousWorkoutImportDuplicateHints({
                        userId: user.id,
                        rows: nextPreview.rows,
                    })
                )
            }
        } catch (error) {
            setPreview(null)
            setErrorMessage(error instanceof Error ? error.message : 'Could not parse previous workout CSV.')
        }
    }

    function handleRemoveRow(rowNumber: number) {
        setPreview((currentPreview) =>
            currentPreview
                ? {
                    ...currentPreview,
                    rows: currentPreview.rows.filter((row) => row.rowNumber !== rowNumber),
                }
                : currentPreview
        )
    }

    async function handleCopyTemplate() {
        setStatusMessage(null)
        setErrorMessage(null)

        try {
            await navigator.clipboard.writeText(previousWorkoutCsvTemplate)
            setStatusMessage('CSV template copied.')
        } catch {
            setCsvText(previousWorkoutCsvTemplate)
            setStatusMessage('CSV template inserted.')
        }
    }

    async function handleImportPreview() {
        setErrorMessage(null)
        setStatusMessage(null)

        if (!user) {
            setErrorMessage('You must be signed in to import workouts.')
            return
        }

        if (!preview || !importPlan) {
            setErrorMessage('Preview a CSV before importing.')
            return
        }

        if (importPlan.blockingErrors.length > 0) {
            setErrorMessage(importPlan.blockingErrors[0])
            return
        }

        if (duplicateHints.length > 0 && !allowPossibleDuplicates) {
            setErrorMessage('Review possible duplicates before importing.')
            return
        }

        setIsImporting(true)

        try {
            const result = await importPreviousWorkoutCsvRows({
                userId: user.id,
                rows: preview.rows,
            })

            await queryClient.invalidateQueries({ queryKey: ['workout-sessions', user.id] })
            await queryClient.invalidateQueries({ queryKey: ['workout-sets', user.id] })
            await queryClient.invalidateQueries({ queryKey: ['all-workout-sets', user.id] })
            await queryClient.invalidateQueries({ queryKey: ['exercises', user.id] })

            setStatusMessage(
                `Imported ${result.sessionsImported} workout${result.sessionsImported === 1 ? '' : 's'}, ${result.setsImported} sets, and ${result.exercisesCreated} new exercise${result.exercisesCreated === 1 ? '' : 's'}.`
            )
            setCsvText('')
            setPreview(null)
            setDuplicateHints([])
            setAllowPossibleDuplicates(false)
            onImported?.()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not import previous workouts.')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <form
            onSubmit={handlePreview}
            className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
        >
            <div className="flex items-center gap-3">
                <ClipboardList className="size-5 text-emerald-600" />
                <h2 className="text-xl font-bold">Past workout CSV preview</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Preview completed workout rows, remove any bad rows, then save them into workout history.
                Imports create completed sessions, so they count toward history, charts, PRs, autofill, and recommendations.
            </p>

            <pre className="mt-3 overflow-x-auto rounded-xl bg-stone-950 p-3 text-xs leading-5 text-stone-100">
                {previousWorkoutCsvTemplate}
            </pre>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setCsvText(previousWorkoutCsvTemplate)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    Use template
                </button>

                <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    <Copy className="size-4" />
                    Copy template
                </button>
            </div>

            <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                    <span className="text-sm font-semibold">Previous workout CSV</span>
                    <textarea
                        value={csvText}
                        onChange={(event) => setCsvText(event.target.value)}
                        placeholder={previousWorkoutCsvTemplate}
                        rows={8}
                        className="rounded-xl border border-stone-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                    />
                </label>

                <button
                    type="submit"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    Preview previous workouts
                </button>
            </div>

            {errorMessage ? (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
                    {errorMessage}
                </p>
            ) : null}

            {statusMessage ? (
                <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
                    {statusMessage}
                </p>
            ) : null}

            {preview ? (
                <div className="mt-4 grid gap-3">
                    {importPlanSummary ? (
                        <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900 sm:grid-cols-4">
                            <div>
                                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Workouts</p>
                                <p className="mt-1 text-lg font-bold">{importPlanSummary.workoutCount}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Sets</p>
                                <p className="mt-1 text-lg font-bold">{importPlanSummary.setCount}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">CSV duplicates</p>
                                <p className="mt-1 text-lg font-bold">{importPlanSummary.duplicateCount}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Status</p>
                                <p className="mt-1 text-lg font-bold">
                                    {importPlanSummary.hasBlockingErrors ? 'Fix rows' : 'Ready'}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {importPlan && importPlan.blockingErrors.length > 0 ? (
                        <div className="grid gap-2">
                            {importPlan.blockingErrors.slice(0, 4).map((blockingError) => (
                                <p
                                    key={blockingError}
                                    className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900"
                                >
                                    {blockingError}
                                </p>
                            ))}
                        </div>
                    ) : null}

                    {importPlan && importPlan.duplicateKeys.length > 0 ? (
                        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900">
                            {importPlan.duplicateKeys.length} duplicate set key found in this CSV. Remove duplicates before importing.
                        </p>
                    ) : null}

                    {preview.warnings.map((warning) => (
                        <p
                            key={warning}
                            className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900"
                        >
                            {warning}
                        </p>
                    ))}

                    {duplicateHints.length > 0 ? (
                        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900">
                            <p className="font-bold">Possible existing duplicates</p>
                            <div className="mt-2 grid gap-1">
                                {duplicateHints.map((hint) => (
                                    <p key={hint}>{hint}</p>
                                ))}
                            </div>

                            <label className="mt-3 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={allowPossibleDuplicates}
                                    onChange={(event) => setAllowPossibleDuplicates(event.target.checked)}
                                />
                                <span className="font-semibold">Import anyway</span>
                            </label>
                        </div>
                    ) : null}

                    {Object.entries(groupedRows).map(([groupName, rows]) => (
                        <div
                            key={groupName}
                            className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                        >
                            <h3 className="font-bold">{groupName}</h3>
                            <div className="mt-3 grid gap-2">
                                {rows.map((row) => (
                                    <div
                                        key={`${row.duplicateKey}-${row.rowNumber}`}
                                        className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold">
                                                    Row {row.rowNumber} - Set {row.setNumber}: {row.exerciseName}
                                                </p>
                                                <p className="mt-1 text-stone-600 dark:text-stone-300">
                                                    {formatPreviousWorkoutCsvRowLoad(row)}
                                                </p>
                                                {row.notes ? (
                                                    <p className="mt-1 text-stone-500 dark:text-stone-400">{row.notes}</p>
                                                ) : null}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(row.rowNumber)}
                                                className="grid size-10 shrink-0 place-items-center rounded-xl text-stone-500 transition hover:bg-white hover:text-red-600 dark:text-stone-400 dark:hover:bg-neutral-950"
                                                aria-label={`Remove row ${row.rowNumber}`}
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleImportPreview}
                        disabled={
                            isImporting ||
                            !importPlan ||
                            importPlan.blockingErrors.length > 0 ||
                            preview.rows.length === 0
                        }
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isImporting ? 'Importing...' : `Import ${importPlan?.workouts.length ?? 0} workout${importPlan?.workouts.length === 1 ? '' : 's'}`}
                    </button>
                </div>
            ) : null}
        </form>
    )
}
