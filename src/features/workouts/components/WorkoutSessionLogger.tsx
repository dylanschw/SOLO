import { CheckCircle, Clock, Dumbbell, Plus, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { LoggedSetType, WeightUnit } from '../../../lib/supabase/types'
import { useProfile } from '../../profile/hooks/useProfile'
import { useExercises, usePlannedExercises } from '../hooks/useWorkouts'
import {
    useCompleteWorkoutSession,
    useCreateWorkoutSet,
    useWorkoutSets
} from '../hooks/useWorkoutSessions'
import {
    formatLoggedWeight,
    getExerciseNameForPlannedExercise,
    getLoggedSetsForPlannedExercise,
    getNextSetNumber
} from '../lib/session-view'
import type { WorkoutDay } from '../lib/workouts'
import type { WorkoutSession } from '../lib/workout-sessions'

type WorkoutSessionLoggerProps = {
    session: WorkoutSession
    workoutDay: WorkoutDay | null
    onCompleted: () => void
}

function optionalNumberFromInput(value: string) {
    if (!value.trim()) {
        return null
    }

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

export function WorkoutSessionLogger({ session, workoutDay, onCompleted }: WorkoutSessionLoggerProps) {
    const profileQuery = useProfile()
    const exercisesQuery = useExercises()
    const plannedExercisesQuery = usePlannedExercises(workoutDay ? [workoutDay.id] : [])
    const setsQuery = useWorkoutSets(session.id)
    const createSet = useCreateWorkoutSet()
    const completeSession = useCompleteWorkoutSession()

    const preferredUnit = profileQuery.data?.preferred_weight_unit ?? 'lb'
    const exercises = exercisesQuery.data ?? []
    const plannedExercises = plannedExercisesQuery.data ?? []
    const loggedSets = setsQuery.data ?? []

    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
    const [weight, setWeight] = useState('')
    const [weightUnit, setWeightUnit] = useState<WeightUnit>(preferredUnit)
    const [reps, setReps] = useState('')
    const [rpe, setRpe] = useState('')
    const [setType, setSetType] = useState<LoggedSetType>('working')
    const [notes, setNotes] = useState('')
    const [sessionNotes, setSessionNotes] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const activePlannedExercise = plannedExercises[activeExerciseIndex] ?? null
    const activeLoggedSets = activePlannedExercise
        ? getLoggedSetsForPlannedExercise(activePlannedExercise.id, loggedSets)
        : []

    const completedExerciseCount = useMemo(
        () =>
            plannedExercises.filter(
                (plannedExercise) => getLoggedSetsForPlannedExercise(plannedExercise.id, loggedSets).length > 0
            ).length,
        [loggedSets, plannedExercises]
    )

    async function handleLogSet(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)

        if (!activePlannedExercise) {
            setErrorMessage('Choose an exercise first.')
            return
        }

        const parsedWeight = optionalNumberFromInput(weight)
        const parsedReps = optionalNumberFromInput(reps)
        const parsedRpe = optionalNumberFromInput(rpe)

        if (parsedReps === null || parsedReps < 0) {
            setErrorMessage('Enter reps for this set.')
            return
        }

        try {
            await createSet.mutateAsync({
                workoutSessionId: session.id,
                plannedExerciseId: activePlannedExercise.id,
                exerciseId: activePlannedExercise.exercise_id,
                setNumber: getNextSetNumber(activePlannedExercise.id, loggedSets),
                setType,
                weight: parsedWeight,
                weightUnit,
                reps: parsedReps,
                rpe: parsedRpe,
                notes
            })

            setWeight('')
            setReps('')
            setRpe('')
            setNotes('')
            setSetType('working')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not log set.')
        }
    }

    async function handleCompleteWorkout() {
        setErrorMessage(null)

        try {
            await completeSession.mutateAsync({
                sessionId: session.id,
                notes: sessionNotes
            })

            onCompleted()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not complete workout.')
        }
    }

    return (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-3">
                <Dumbbell className="size-5 text-emerald-600" />
                <div>
                    <h2 className="text-xl font-bold">Workout in progress</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        {workoutDay ? workoutDay.name : 'Workout day'}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Exercises started</p>
                    <p className="mt-1 text-xl font-bold">
                        {completedExerciseCount}/{plannedExercises.length}
                    </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Logged sets</p>
                    <p className="mt-1 text-xl font-bold">{loggedSets.length}</p>
                </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {plannedExercises.map((plannedExercise, index) => (
                    <button
                        key={plannedExercise.id}
                        type="button"
                        onClick={() => setActiveExerciseIndex(index)}
                        className={`shrink-0 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${index === activeExerciseIndex
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'border-stone-200 bg-white text-stone-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-stone-300'
                            }`}
                    >
                        {index + 1}. {getExerciseNameForPlannedExercise(plannedExercise, exercises)}
                    </button>
                ))}
            </div>

            {activePlannedExercise ? (
                <article className="mt-4 rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                    <h3 className="text-lg font-bold">
                        {getExerciseNameForPlannedExercise(activePlannedExercise, exercises)}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        Target: {activePlannedExercise.planned_sets} sets
                        {activePlannedExercise.min_reps && activePlannedExercise.max_reps
                            ? ` x ${activePlannedExercise.min_reps}-${activePlannedExercise.max_reps} reps`
                            : ''}
                        {activePlannedExercise.target_rpe ? `, RPE ${activePlannedExercise.target_rpe}` : ''}
                        {activePlannedExercise.rest_seconds ? `, ${activePlannedExercise.rest_seconds}s rest` : ''}
                    </p>

                    <div className="mt-3 rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                        <div className="flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-300">
                            <Timer className="size-4" />
                            Rest timer placeholder
                        </div>
                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                            The next milestone will add a real countdown timer and offline queue.
                        </p>
                    </div>

                    <form onSubmit={handleLogSet} className="mt-4 grid gap-4">
                        <div className="grid grid-cols-[1fr_90px] gap-3">
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Weight</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(event) => setWeight(event.target.value)}
                                    placeholder="Weight"
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Unit</span>
                                <select
                                    value={weightUnit}
                                    onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                >
                                    <option value="lb">lb</option>
                                    <option value="kg">kg</option>
                                </select>
                            </label>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Reps</span>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={reps}
                                    onChange={(event) => setReps(event.target.value)}
                                    placeholder="Reps"
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">RPE</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={rpe}
                                    onChange={(event) => setRpe(event.target.value)}
                                    placeholder="RPE"
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Type</span>
                                <select
                                    value={setType}
                                    onChange={(event) => setSetType(event.target.value as LoggedSetType)}
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                >
                                    <option value="working">Work</option>
                                    <option value="top">Top</option>
                                    <option value="backoff">Backoff</option>
                                    <option value="warmup">Warmup</option>
                                    <option value="drop">Drop</option>
                                </select>
                            </label>
                        </div>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Set notes</span>
                            <input
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder="Optional set notes"
                                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={createSet.isPending}
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <Plus className="size-4" />
                            {createSet.isPending ? 'Logging...' : 'Log set'}
                        </button>
                    </form>

                    <div className="mt-4 grid gap-2">
                        {activeLoggedSets.map((set) => (
                            <div
                                key={set.id}
                                className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900"
                            >
                                <span className="font-semibold">Set {set.set_number}</span>
                                <span>
                                    {formatLoggedWeight(set.weight_kg, preferredUnit)} x {set.reps ?? '--'} reps
                                    {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </article>
            ) : (
                <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
                    This workout day has no exercises yet.
                </p>
            )}

            <label className="mt-4 grid gap-2">
                <span className="text-sm font-semibold">Workout notes</span>
                <textarea
                    value={sessionNotes}
                    onChange={(event) => setSessionNotes(event.target.value)}
                    placeholder="Optional workout notes"
                    rows={3}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
            </label>

            <button
                type="button"
                onClick={handleCompleteWorkout}
                disabled={completeSession.isPending}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
            >
                <CheckCircle className="size-4" />
                {completeSession.isPending ? 'Completing...' : 'Complete workout'}
            </button>

            {errorMessage ? (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
                    {errorMessage}
                </p>
            ) : null}

            <div className="mt-4 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <Clock className="size-4" />
                Started {session.started_at ? new Date(session.started_at).toLocaleTimeString() : 'recently'}
            </div>
        </section>
    )
}