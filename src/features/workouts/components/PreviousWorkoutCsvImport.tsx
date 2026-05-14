import { ClipboardList, Trash2 } from 'lucide-react'
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
    groupPreviousWorkoutCsvRows,
    parsePreviousWorkoutCsv,
    type PreviousWorkoutCsvPreview
} from '../lib/previous-workout-csv'

const exampleCsv = `workout_date,workout_name,exercise_name,set_number,load_type,weight,assist_weight,added_weight,weight_unit,reps,notes
2026-05-01,Push Day,Incline Press,1,weighted,65,,,lb,10,solid
2026-05-01,Push Day,Knee Raise,1,no_weight,,,,lb,15,
2026-05-02,Pull Day,Assisted Pull-up,1,assisted,,60,,lb,8,`

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
            </p>

            <pre className="mt-3 overflow-x-auto rounded-xl bg-stone-950 p-3 text-xs leading-5 text-stone-100">
                {exampleCsv}
            </pre>

            <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                    <span className="text-sm font-semibold">Previous workout CSV</span>
                    <textarea
                        value={csvText}
                        onChange={(event) => setCsvText(event.target.value)}
                        placeholder={exampleCsv}
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
                                                    Set {row.setNumber}: {row.exerciseName}
                                                </p>
                                                <p className="mt-1 text-stone-600 dark:text-stone-300">
                                                    {row.loadType.replaceAll('_', ' ')} - {row.weight ?? row.assistWeight ?? row.addedWeight ?? '--'} {row.weightUnit} x {row.reps ?? '--'}
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
