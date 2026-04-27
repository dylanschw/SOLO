import { Upload } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    addPlannedExercise,
    createExercise,
    createWorkoutDay,
    createWorkoutProgram,
    setActiveWorkoutProgram
} from '../lib/workouts'
import { parseWorkoutCsv } from '../lib/workout-csv'

type WorkoutCsvImportProps = {
    onImported: () => void
}

const exampleCsv = `program_name,rotation_length_days,program_description,day_number,day_name,is_rest_day,exercise_name,muscle_group,equipment,set_type,sets,min_reps,max_reps,rest_seconds,target_rpe,backoff_percent,notes,progression_rule,deload_rule
Workout Program Name,8,Program description,1,Workout Day Name,false,Exercise Name,Muscle Group,Equipment,straight,3,8,12,120,8,,Exercise notes,Dynamic double progression,Deload rule
Workout Program Name,8,Program description,4,Rest,true,,,,,,,,,,,,,`

export function WorkoutCsvImport({ onImported }: WorkoutCsvImportProps) {
    const { user } = useAuth()
    const [csvText, setCsvText] = useState('')
    const [setActiveAfterImport, setSetActiveAfterImport] = useState(true)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isImporting, setIsImporting] = useState(false)

    async function handleImport(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatusMessage(null)
        setErrorMessage(null)

        if (!user) {
            setErrorMessage('You must be signed in to import a program.')
            return
        }

        setIsImporting(true)

        try {
            const rows = parseWorkoutCsv(csvText)

            const firstRow = rows[0]

            const program = await createWorkoutProgram({
                userId: user.id,
                name: firstRow.programName,
                description: firstRow.programDescription,
                rotationLengthDays: firstRow.rotationLengthDays
            })

            const dayMap = new Map<number, string>()
            const exerciseMap = new Map<string, string>()
            let importedExercises = 0

            const uniqueDays = rows.filter(
                (row, index, allRows) => allRows.findIndex((otherRow) => otherRow.dayNumber === row.dayNumber) === index
            )

            for (const row of uniqueDays) {
                const day = await createWorkoutDay({
                    userId: user.id,
                    programId: program.id,
                    dayNumber: row.dayNumber,
                    name: row.dayName,
                    notes: null,
                    isRestDay: row.isRestDay
                })

                dayMap.set(row.dayNumber, day.id)
            }

            for (const row of rows) {
                if (row.isRestDay || !row.exerciseName) {
                    continue
                }

                let exerciseId = exerciseMap.get(row.exerciseName.toLowerCase())

                if (!exerciseId) {
                    const exercise = await createExercise({
                        userId: user.id,
                        name: row.exerciseName,
                        muscleGroup: row.muscleGroup,
                        equipment: row.equipment,
                        notes: row.notes
                    })

                    exerciseId = exercise.id
                    exerciseMap.set(row.exerciseName.toLowerCase(), exercise.id)
                }

                const workoutDayId = dayMap.get(row.dayNumber)

                if (!workoutDayId) {
                    throw new Error(`Could not find day ${row.dayNumber}.`)
                }

                await addPlannedExercise({
                    userId: user.id,
                    workoutDayId,
                    exerciseId,
                    sortOrder: importedExercises + 1,
                    setType: row.setType,
                    plannedSets: row.sets,
                    minReps: row.minReps,
                    maxReps: row.maxReps,
                    restSeconds: row.restSeconds,
                    targetRpe: row.targetRpe,
                    backoffPercent: row.backoffPercent,
                    notes: row.notes,
                    progressionRule: row.progressionRule,
                    deloadRule: row.deloadRule
                })

                importedExercises += 1
            }

            if (setActiveAfterImport) {
                await setActiveWorkoutProgram(user.id, program.id)
            }

            setCsvText('')
            setStatusMessage(`Imported ${program.name} with ${uniqueDays.length} days and ${importedExercises} exercises.`)
            onImported()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not import CSV.')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <form
            onSubmit={handleImport}
            className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
        >
            <div className="flex items-center gap-3">
                <Upload className="size-5 text-emerald-600" />
                <h2 className="text-xl font-bold">Import workout CSV</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Paste a CSV using this exact header row. Rest days can leave the exercise columns blank.
            </p>

            <pre className="mt-3 overflow-x-auto rounded-xl bg-stone-950 p-3 text-xs leading-5 text-stone-100">
                {exampleCsv}
            </pre>

            <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                    <span className="text-sm font-semibold">CSV text</span>
                    <textarea
                        value={csvText}
                        onChange={(event) => setCsvText(event.target.value)}
                        placeholder={exampleCsv}
                        rows={10}
                        className="rounded-xl border border-stone-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                    />
                </label>

                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 px-4 dark:border-neutral-700">
                    <input
                        type="checkbox"
                        checked={setActiveAfterImport}
                        onChange={(event) => setSetActiveAfterImport(event.target.checked)}
                    />
                    <span className="text-sm font-semibold">Set imported program as active</span>
                </label>

                <button
                    type="submit"
                    disabled={isImporting}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                >
                    <Upload className="size-4" />
                    {isImporting ? 'Importing...' : 'Import CSV'}
                </button>
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
        </form>
    )
}