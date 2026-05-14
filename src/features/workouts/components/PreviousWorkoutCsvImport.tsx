import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
    groupPreviousWorkoutCsvRows,
    parsePreviousWorkoutCsv,
    type PreviousWorkoutCsvPreview
} from '../lib/previous-workout-csv'

const exampleCsv = `workout_date,workout_name,exercise_name,set_number,load_type,weight,assist_weight,added_weight,weight_unit,reps,notes
2026-05-01,Push Day,Incline Press,1,weighted,65,,,lb,10,solid
2026-05-01,Push Day,Knee Raise,1,no_weight,,,,lb,15,
2026-05-02,Pull Day,Assisted Pull-up,1,assisted,,60,,lb,8,`

export function PreviousWorkoutCsvImport() {
    const [csvText, setCsvText] = useState('')
    const [preview, setPreview] = useState<PreviousWorkoutCsvPreview | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const groupedRows = useMemo(
        () => (preview ? groupPreviousWorkoutCsvRows(preview.rows) : {}),
        [preview]
    )

    function handlePreview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)

        try {
            setPreview(parsePreviousWorkoutCsv(csvText))
        } catch (error) {
            setPreview(null)
            setErrorMessage(error instanceof Error ? error.message : 'Could not parse previous workout CSV.')
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
                This first pass validates and groups completed workout rows; saving parsed rows will come after duplicate matching and edit-in-preview are safer.
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

            {preview ? (
                <div className="mt-4 grid gap-3">
                    {preview.duplicateKeys.length > 0 ? (
                        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900">
                            {preview.duplicateKeys.length} possible duplicate set key found in this CSV.
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
                                        <p className="font-semibold">
                                            Set {row.setNumber}: {row.exerciseName}
                                        </p>
                                        <p className="mt-1 text-stone-600 dark:text-stone-300">
                                            {row.loadType.replaceAll('_', ' ')} - {row.weight ?? row.assistWeight ?? row.addedWeight ?? '--'} {row.weightUnit} x {row.reps ?? '--'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </form>
    )
}
