import { Library, Save } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    addPlannedExercise,
    createExercise,
    createWorkoutDay,
    createWorkoutProgram,
    setActiveWorkoutProgram
} from '../lib/workouts'
import { getDefaultPremadeProgressionRule, premadeSplits, type PremadeSplit } from '../lib/premade-splits'

type PremadeSplitPickerProps = {
    onImported: () => void
}

const defaultDeloadRule = 'Drop weight to 60 to 70 percent, use RPE 6 to 7, keep rest times, reduce to 2 sets'

export function PremadeSplitPicker({ onImported }: PremadeSplitPickerProps) {
    const { user } = useAuth()
    const [selectedSplitId, setSelectedSplitId] = useState(premadeSplits[0]?.id ?? '')
    const [setActiveAfterImport, setSetActiveAfterImport] = useState(true)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isImporting, setIsImporting] = useState(false)

    const selectedSplit = premadeSplits.find((split) => split.id === selectedSplitId) ?? premadeSplits[0] ?? null

    async function importSplit(split: PremadeSplit) {
        setStatusMessage(null)
        setErrorMessage(null)

        if (!user) {
            setErrorMessage('You must be signed in to import a premade split.')
            return
        }

        setIsImporting(true)

        try {
            const program = await createWorkoutProgram({
                userId: user.id,
                name: split.name,
                description: split.description,
                rotationLengthDays: split.rotationLengthDays
            })

            const exerciseMap = new Map<string, string>()
            let importedExercises = 0

            for (const day of split.days) {
                const savedDay = await createWorkoutDay({
                    userId: user.id,
                    programId: program.id,
                    dayNumber: day.dayNumber,
                    name: day.name,
                    notes: null,
                    isRestDay: day.isRestDay ?? false
                })

                for (let index = 0; index < day.exercises.length; index += 1) {
                    const exerciseDraft = day.exercises[index]
                    const exerciseKey = exerciseDraft.name.toLowerCase()
                    let exerciseId = exerciseMap.get(exerciseKey)

                    if (!exerciseId) {
                        const exercise = await createExercise({
                            userId: user.id,
                            name: exerciseDraft.name,
                            muscleGroup: exerciseDraft.muscleGroup,
                            equipment: exerciseDraft.equipment,
                            notes: exerciseDraft.notes
                        })

                        exerciseId = exercise.id
                        exerciseMap.set(exerciseKey, exercise.id)
                    }

                    await addPlannedExercise({
                        userId: user.id,
                        workoutDayId: savedDay.id,
                        exerciseId,
                        sortOrder: index + 1,
                        setType: exerciseDraft.setType,
                        plannedSets: exerciseDraft.sets,
                        minReps: exerciseDraft.minReps,
                        maxReps: exerciseDraft.maxReps,
                        restSeconds: exerciseDraft.restSeconds,
                        targetRpe: exerciseDraft.targetRpe,
                        backoffPercent: null,
                        notes: exerciseDraft.notes ?? null,
                        progressionRule: getDefaultPremadeProgressionRule(),
                        deloadRule: defaultDeloadRule
                    })

                    importedExercises += 1
                }
            }

            if (setActiveAfterImport) {
                await setActiveWorkoutProgram(user.id, program.id)
            }

            setStatusMessage(`Imported ${split.name} with ${importedExercises} exercises.`)
            onImported()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not import premade split.')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-3">
                <Library className="size-5 text-emerald-600" />
                <h2 className="text-xl font-bold">Premade splits</h2>
            </div>

            <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                    <span className="text-sm font-semibold">Split</span>
                    <select
                        value={selectedSplitId}
                        onChange={(event) => setSelectedSplitId(event.target.value)}
                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                    >
                        {premadeSplits.map((split) => (
                            <option key={split.id} value={split.id}>
                                {split.name}
                            </option>
                        ))}
                    </select>
                </label>

                {selectedSplit ? (
                    <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
                        <p className="font-bold">{selectedSplit.name}</p>
                        <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-300">
                            {selectedSplit.description}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            {selectedSplit.tags.join(' / ')}
                        </p>
                    </div>
                ) : null}

                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 px-4 dark:border-neutral-700">
                    <input
                        type="checkbox"
                        checked={setActiveAfterImport}
                        onChange={(event) => setSetActiveAfterImport(event.target.checked)}
                    />
                    <span className="text-sm font-semibold">Set imported split as active</span>
                </label>

                <button
                    type="button"
                    onClick={() => selectedSplit && importSplit(selectedSplit)}
                    disabled={!selectedSplit || isImporting}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <Save className="size-4" />
                    {isImporting ? 'Importing...' : 'Import split'}
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
        </section>
    )
}
