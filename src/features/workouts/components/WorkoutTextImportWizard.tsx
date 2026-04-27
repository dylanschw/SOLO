import { FileText, Save } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ExerciseSetType } from '../../../lib/supabase/types'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    addPlannedExercise,
    createExercise,
    createWorkoutDay,
    createWorkoutProgram,
    setActiveWorkoutProgram
} from '../lib/workouts'
import {
    parseWorkoutPlainText,
    type ParsedWorkoutTextDay,
    type ParsedWorkoutTextExercise,
    type ParsedWorkoutTextProgram
} from '../lib/workout-text-import'

type WorkoutTextImportWizardProps = {
    onImported: () => void
}

const exampleText = `Day 1 Chest / Back
Incline Dumbbell Press 3x8-12 RPE 8 120s rest
Chest Supported Row 3x8-12 RPE 8 120s rest
Cable Fly 2x12-20 RPE 9

Day 2 Arms / Shoulders
Cable Lateral Raise 3x12-20 RPE 9 90s rest
EZ Bar Curl 3x8-12 RPE 8

Day 3 Legs / Abs
Hack Squat 3x8-12 RPE 8 180s rest
Leg Curl 3x10-15 RPE 8

Day 4 Rest`

function updateDay(
    draft: ParsedWorkoutTextProgram,
    dayId: string,
    updater: (day: ParsedWorkoutTextDay) => ParsedWorkoutTextDay
): ParsedWorkoutTextProgram {
    return {
        ...draft,
        days: draft.days.map((day) => (day.id === dayId ? updater(day) : day))
    }
}

function updateExercise(
    draft: ParsedWorkoutTextProgram,
    dayId: string,
    exerciseId: string,
    updater: (exercise: ParsedWorkoutTextExercise) => ParsedWorkoutTextExercise
): ParsedWorkoutTextProgram {
    return updateDay(draft, dayId, (day) => ({
        ...day,
        exercises: day.exercises.map((exercise) =>
            exercise.id === exerciseId ? updater(exercise) : exercise
        )
    }))
}

function optionalNumberFromInput(value: string) {
    if (!value.trim()) {
        return null
    }

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

export function WorkoutTextImportWizard({ onImported }: WorkoutTextImportWizardProps) {
    const { user } = useAuth()
    const [plainText, setPlainText] = useState('')
    const [draft, setDraft] = useState<ParsedWorkoutTextProgram | null>(null)
    const [setActiveAfterImport, setSetActiveAfterImport] = useState(true)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    function handleParse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatusMessage(null)
        setErrorMessage(null)

        try {
            setDraft(parseWorkoutPlainText(plainText))
            setStatusMessage('Draft created. Review and edit before saving.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not parse workout text.')
        }
    }

    async function handleSaveDraft() {
        setStatusMessage(null)
        setErrorMessage(null)

        if (!user) {
            setErrorMessage('You must be signed in to save a program.')
            return
        }

        if (!draft) {
            setErrorMessage('Parse a workout draft first.')
            return
        }

        setIsSaving(true)

        try {
            const program = await createWorkoutProgram({
                userId: user.id,
                name: draft.name,
                description: draft.description,
                rotationLengthDays: draft.rotationLengthDays
            })

            for (const day of draft.days) {
                const savedDay = await createWorkoutDay({
                    userId: user.id,
                    programId: program.id,
                    dayNumber: day.dayNumber,
                    name: day.name,
                    notes: day.notes,
                    isRestDay: day.isRestDay
                })

                for (let index = 0; index < day.exercises.length; index += 1) {
                    const exerciseDraft = day.exercises[index]

                    const exercise = await createExercise({
                        userId: user.id,
                        name: exerciseDraft.name,
                        muscleGroup: null,
                        equipment: null,
                        notes: exerciseDraft.notes
                    })

                    await addPlannedExercise({
                        userId: user.id,
                        workoutDayId: savedDay.id,
                        exerciseId: exercise.id,
                        sortOrder: index + 1,
                        setType: exerciseDraft.setType,
                        plannedSets: exerciseDraft.sets,
                        minReps: exerciseDraft.minReps,
                        maxReps: exerciseDraft.maxReps,
                        restSeconds: exerciseDraft.restSeconds,
                        targetRpe: exerciseDraft.targetRpe,
                        backoffPercent: exerciseDraft.backoffPercent,
                        notes: exerciseDraft.notes,
                        progressionRule: exerciseDraft.progressionRule,
                        deloadRule: exerciseDraft.deloadRule
                    })
                }
            }

            if (setActiveAfterImport) {
                await setActiveWorkoutProgram(user.id, program.id)
            }

            setDraft(null)
            setPlainText('')
            setStatusMessage(`Saved ${program.name}.`)
            onImported()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not save imported program.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-3">
                <FileText className="size-5 text-emerald-600" />
                <h2 className="text-xl font-bold">Plain text import wizard</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Paste a routine in a human-readable format. The app will turn it into an editable draft before saving anything.
            </p>

            <div className="mt-3 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                <p className="font-semibold">Supported patterns:</p>
                <p>Day 1 Workout Day Name</p>
                <p>Exercise Name 3x8-12 RPE 8 120s rest</p>
                <p>Top Set Exercise Name 1x6-8 RPE 9 back off 10%</p>
                <p>Day 4 Rest</p>

                <p className="mt-3 font-semibold">Example:</p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-stone-950 p-3 text-xs leading-5 text-stone-100">
                    {exampleText}
                </pre>
            </div>

            <form onSubmit={handleParse} className="mt-5 grid gap-4">
                <label className="grid gap-2">
                    <span className="text-sm font-semibold">Routine text</span>
                    <textarea
                        value={plainText}
                        onChange={(event) => setPlainText(event.target.value)}
                        placeholder={"Paste your workout routine here."}
                        rows={12}
                        className="rounded-xl border border-stone-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                    />
                </label>

                <button
                    type="submit"
                    className="min-h-12 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                >
                    Parse into editable draft
                </button>
            </form>

            {draft ? (
                <div className="mt-5 grid gap-4">
                    <div className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Program name</span>
                            <input
                                value={draft.name}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        name: event.target.value
                                    })
                                }
                                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>

                        <label className="mt-3 grid gap-2">
                            <span className="text-sm font-semibold">Description</span>
                            <textarea
                                value={draft.description ?? ''}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        description: event.target.value || null
                                    })
                                }
                                rows={2}
                                className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>
                    </div>

                    {draft.days.map((day) => (
                        <div key={day.id} className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                            <div className="grid grid-cols-[90px_1fr] gap-3">
                                <label className="grid gap-2">
                                    <span className="text-sm font-semibold">Day</span>
                                    <input
                                        type="number"
                                        value={day.dayNumber}
                                        onChange={(event) =>
                                            setDraft(
                                                updateDay(draft, day.id, (currentDay) => ({
                                                    ...currentDay,
                                                    dayNumber: Number(event.target.value)
                                                }))
                                            )
                                        }
                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-sm font-semibold">Day name</span>
                                    <input
                                        value={day.name}
                                        onChange={(event) =>
                                            setDraft(
                                                updateDay(draft, day.id, (currentDay) => ({
                                                    ...currentDay,
                                                    name: event.target.value
                                                }))
                                            )
                                        }
                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                    />
                                </label>
                            </div>

                            <label className="mt-3 flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 px-4 dark:border-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={day.isRestDay}
                                    onChange={(event) =>
                                        setDraft(
                                            updateDay(draft, day.id, (currentDay) => ({
                                                ...currentDay,
                                                isRestDay: event.target.checked
                                            }))
                                        )
                                    }
                                />
                                <span className="text-sm font-semibold">Rest day</span>
                            </label>

                            {!day.isRestDay ? (
                                <div className="mt-4 grid gap-3">
                                    {day.exercises.map((exercise) => (
                                        <div key={exercise.id} className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                                            <label className="grid gap-2">
                                                <span className="text-sm font-semibold">Exercise name</span>
                                                <input
                                                    value={exercise.name}
                                                    onChange={(event) =>
                                                        setDraft(
                                                            updateExercise(draft, day.id, exercise.id, (currentExercise) => ({
                                                                ...currentExercise,
                                                                name: event.target.value
                                                            }))
                                                        )
                                                    }
                                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                />
                                            </label>

                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold">Set type</span>
                                                    <select
                                                        value={exercise.setType}
                                                        onChange={(event) =>
                                                            setDraft(
                                                                updateExercise(draft, day.id, exercise.id, (currentExercise) => ({
                                                                    ...currentExercise,
                                                                    setType: event.target.value as ExerciseSetType
                                                                }))
                                                            )
                                                        }
                                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    >
                                                        <option value="straight">Straight</option>
                                                        <option value="top_set_backoff">Top set/backoff</option>
                                                        <option value="warmup">Warmup</option>
                                                        <option value="custom">Custom</option>
                                                    </select>
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold">Sets</span>
                                                    <input
                                                        type="number"
                                                        value={exercise.sets}
                                                        onChange={(event) =>
                                                            setDraft(
                                                                updateExercise(draft, day.id, exercise.id, (currentExercise) => ({
                                                                    ...currentExercise,
                                                                    sets: Number(event.target.value)
                                                                }))
                                                            )
                                                        }
                                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold">Min reps</span>
                                                    <input
                                                        type="number"
                                                        value={exercise.minReps ?? ''}
                                                        onChange={(event) =>
                                                            setDraft(
                                                                updateExercise(draft, day.id, exercise.id, (currentExercise) => ({
                                                                    ...currentExercise,
                                                                    minReps: optionalNumberFromInput(event.target.value)
                                                                }))
                                                            )
                                                        }
                                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold">Max reps</span>
                                                    <input
                                                        type="number"
                                                        value={exercise.maxReps ?? ''}
                                                        onChange={(event) =>
                                                            setDraft(
                                                                updateExercise(draft, day.id, exercise.id, (currentExercise) => ({
                                                                    ...currentExercise,
                                                                    maxReps: optionalNumberFromInput(event.target.value)
                                                                }))
                                                            )
                                                        }
                                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold">Rest seconds</span>
                                                    <input
                                                        type="number"
                                                        value={exercise.restSeconds ?? ''}
                                                        onChange={(event) =>
                                                            setDraft(
                                                                updateExercise(draft, day.id, exercise.id, (currentExercise) => ({
                                                                    ...currentExercise,
                                                                    restSeconds: optionalNumberFromInput(event.target.value)
                                                                }))
                                                            )
                                                        }
                                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold">RPE</span>
                                                    <input
                                                        type="number"
                                                        value={exercise.targetRpe ?? ''}
                                                        onChange={(event) =>
                                                            setDraft(
                                                                updateExercise(draft, day.id, exercise.id, (currentExercise) => ({
                                                                    ...currentExercise,
                                                                    targetRpe: optionalNumberFromInput(event.target.value)
                                                                }))
                                                            )
                                                        }
                                                        className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ))}

                    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 px-4 dark:border-neutral-700">
                        <input
                            type="checkbox"
                            checked={setActiveAfterImport}
                            onChange={(event) => setSetActiveAfterImport(event.target.checked)}
                        />
                        <span className="text-sm font-semibold">Set imported program as active</span>
                    </label>

                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className="size-4" />
                        {isSaving ? 'Saving...' : 'Save reviewed program'}
                    </button>
                </div>
            ) : null}

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