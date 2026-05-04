import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Dumbbell,
    History,
    Pencil,
    Save,
    Trash2,
    X,
    Plus,
    Sparkles,
    Timer
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { WeightUnit } from '../../../lib/supabase/types';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProfile } from '../../profile/hooks/useProfile';
import { buildRecommendationForExercise } from '../lib/progression';
import { useExercises, usePlannedExercises } from '../hooks/useWorkouts';
import {
    useAllWorkoutSets,
    useCompleteWorkoutSession,
    useCreateWorkoutSet,
    useDeleteWorkoutSet,
    useUpdateWorkoutSet,
    useWorkoutSets
} from '../hooks/useWorkoutSessions';
import {
    formatLoggedWeight,
    getExerciseNameForPlannedExercise,
    getLoggedSetsForPlannedExercise,
    getNextSetNumber
} from '../lib/session-view';
import type { WorkoutDay } from '../lib/workouts';
import type { WorkoutSession } from '../lib/workout-sessions';
import {
    addOfflineWorkoutSet,
    createLocalId,
    getOfflineWorkoutSetsForPlannedExercise
} from '../lib/offline-workout';
import { useOfflineWorkoutSync } from '../hooks/useOfflineWorkoutSync';
import { buildExerciseHistory } from '../lib/exercise-history';

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
    const profileQuery = useProfile();
    const { user } = useAuth();
    const exercisesQuery = useExercises();
    const plannedExercisesQuery = usePlannedExercises(workoutDay ? [workoutDay.id] : []);
    const setsQuery = useWorkoutSets(session.id);
    const allWorkoutSetsQuery = useAllWorkoutSets();
    const createSet = useCreateWorkoutSet();
    const completeSession = useCompleteWorkoutSession();
    const offlineSync = useOfflineWorkoutSync(session.id);
    const updateWorkoutSet = useUpdateWorkoutSet();
    const deleteWorkoutSet = useDeleteWorkoutSet();
    const preferredUnit = profileQuery.data?.preferred_weight_unit ?? 'lb';
    const exercises = exercisesQuery.data ?? [];
    const plannedExercises = plannedExercisesQuery.data ?? [];
    const loggedSets = setsQuery.data ?? [];
    const allWorkoutSets = allWorkoutSetsQuery.data ?? [];

    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState<WeightUnit>(preferredUnit);
    const [reps, setReps] = useState('');
    const [notes, setNotes] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
    const [restTimerSeconds, setRestTimerSeconds] = useState(120);
    const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
    const [editingSetId, setEditingSetId] = useState<string | null>(null);
    const [editingSetWeight, setEditingSetWeight] = useState('');
    const [editingSetReps, setEditingSetReps] = useState('');
    const [editingSetNotes, setEditingSetNotes] = useState('');

    const activePlannedExercise = plannedExercises[activeExerciseIndex] ?? null;

    const exerciseHistory = useMemo(
        () =>
            buildExerciseHistory({
                sets: allWorkoutSets,
                exercises,
                unit: preferredUnit
            }),
        [allWorkoutSets, exercises, preferredUnit]
    );

    const activeExerciseHistory = activePlannedExercise
        ? exerciseHistory.find((history) => history.exerciseId === activePlannedExercise.exercise_id) ?? null
        : null;

    const lastExerciseSet = activeExerciseHistory?.latestSet ?? null;
    const bestExerciseSet = activeExerciseHistory?.bestEstimatedOneRepMaxSet ?? null;

    const activeLoggedSets = activePlannedExercise
        ? getLoggedSetsForPlannedExercise(activePlannedExercise.id, loggedSets)
        : [];

    const activeOfflineSets = activePlannedExercise
        ? getOfflineWorkoutSetsForPlannedExercise(session.id, activePlannedExercise.id)
        : [];

    const activeRecommendation = activePlannedExercise
        ? buildRecommendationForExercise(activePlannedExercise, activeLoggedSets, preferredUnit)
        : null;

    const completedExerciseCount = useMemo(
        () =>
            plannedExercises.filter(
                (plannedExercise) => getLoggedSetsForPlannedExercise(plannedExercise.id, loggedSets).length > 0
            ).length,
        [loggedSets, plannedExercises]
    );

    useEffect(() => {
        setWeightUnit(preferredUnit);
    }, [preferredUnit]);

    const totalExercises = plannedExercises.length
    const activeExerciseNumber = activeExerciseIndex + 1
    const canGoPrevious = activeExerciseIndex > 0
    const canGoNext = activeExerciseIndex < totalExercises - 1

    function formatTimer(seconds: number) {
        const safeSeconds = Math.max(seconds, 0)

        return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`
    }

    const restTimerLabel = formatTimer(restSecondsRemaining)

    function getRecommendedRestSeconds() {
        return activePlannedExercise?.rest_seconds && activePlannedExercise.rest_seconds > 0
            ? activePlannedExercise.rest_seconds
            : 120
    }

    useEffect(() => {
        if (isRestTimerRunning) {
            return
        }

        const recommendedRestSeconds = getRecommendedRestSeconds()

        setRestTimerSeconds(recommendedRestSeconds)
        setRestSecondsRemaining(recommendedRestSeconds)
    }, [activePlannedExercise?.id])

    useEffect(() => {
        if (!isRestTimerRunning) {
            return
        }

        if (restSecondsRemaining <= 0) {
            setIsRestTimerRunning(false)
            return
        }

        const timer = window.setTimeout(() => {
            setRestSecondsRemaining((currentSeconds) => Math.max(currentSeconds - 1, 0))
        }, 1000)

        return () => window.clearTimeout(timer)
    }, [isRestTimerRunning, restSecondsRemaining])

    function goToPreviousExercise() {
        setActiveExerciseIndex((currentIndex) => Math.max(currentIndex - 1, 0))
    }

    function goToNextExercise() {
        setActiveExerciseIndex((currentIndex) =>
            Math.min(currentIndex + 1, Math.max(totalExercises - 1, 0))
        )
    }

    function startRestTimer(seconds?: number | null) {
        const targetSeconds =
            typeof seconds === 'number' && seconds > 0 ? seconds : restTimerSeconds || getRecommendedRestSeconds()

        setRestTimerSeconds(targetSeconds)
        setRestSecondsRemaining(targetSeconds)
        setIsRestTimerRunning(true)
    }

    function toggleRestTimer() {
        if (isRestTimerRunning) {
            setIsRestTimerRunning(false)
            return
        }

        if (restSecondsRemaining <= 0) {
            setRestSecondsRemaining(restTimerSeconds || getRecommendedRestSeconds())
        }

        setIsRestTimerRunning(true)
    }

    function clearRestTimer() {
        setIsRestTimerRunning(false)
        setRestSecondsRemaining(restTimerSeconds || getRecommendedRestSeconds())
    }

    function handleSetCustomRestTime() {
        const nextValue = window.prompt('Rest time in seconds', String(restTimerSeconds))

        if (nextValue === null) {
            return
        }

        const parsedSeconds = Number(nextValue)

        if (!Number.isFinite(parsedSeconds) || parsedSeconds <= 0) {
            return
        }

        const roundedSeconds = Math.round(parsedSeconds)

        setIsRestTimerRunning(false)
        setRestTimerSeconds(roundedSeconds)
        setRestSecondsRemaining(roundedSeconds)
    }

    function fillSetFromHistorySet(historySet: {
        weight: number | null;
        reps: number | null;
    }) {
        if (typeof historySet.weight === 'number') {
            setWeight(String(historySet.weight));
        }

        if (typeof historySet.reps === 'number') {
            setReps(String(historySet.reps));
        }
    }

    function fillLastSet() {
        if (!lastExerciseSet) {
            return;
        }

        fillSetFromHistorySet(lastExerciseSet);
    }

    function fillBestSet() {
        if (!bestExerciseSet) {
            return;
        }

        fillSetFromHistorySet(bestExerciseSet);
    }

    useEffect(() => {
        if (!lastExerciseSet) {
            return;
        }

        if (weight.trim() || reps.trim()) {
            return;
        }

        fillSetFromHistorySet(lastExerciseSet);
    }, [activePlannedExercise?.id, lastExerciseSet]);

    function startEditingSet(set: {
        id: string;
        weight_kg: number | null;
        reps: number | null;
        notes: string | null;
    }) {
        setEditingSetId(set.id);
        setEditingSetWeight(
            typeof set.weight_kg === 'number'
                ? String(formatLoggedWeight(set.weight_kg, preferredUnit).replace(` ${preferredUnit}`, ''))
                : ''
        );
        setEditingSetReps(typeof set.reps === 'number' ? String(set.reps) : '');
        setEditingSetNotes(set.notes ?? '');
    }

    function cancelEditingSet() {
        setEditingSetId(null);
        setEditingSetWeight('');
        setEditingSetReps('');
        setEditingSetNotes('');
    }

    async function handleUpdateSet(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        if (!editingSetId) {
            return;
        }

        const parsedWeight = editingSetWeight.trim() ? Number(editingSetWeight) : null;
        const parsedReps = editingSetReps.trim() ? Number(editingSetReps) : null;

        if (parsedWeight !== null && (!Number.isFinite(parsedWeight) || parsedWeight < 0)) {
            setErrorMessage('Enter a valid weight.');
            return;
        }

        if (parsedReps !== null && (!Number.isFinite(parsedReps) || parsedReps < 0)) {
            setErrorMessage('Enter valid reps.');
            return;
        }

        try {
            await updateWorkoutSet.mutateAsync({
                setId: editingSetId,
                weight: parsedWeight,
                weightUnit: preferredUnit,
                reps: parsedReps,
                rpe: null,
                notes: editingSetNotes,
            });

            cancelEditingSet();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not update set.');
        }
    }

    async function handleDeleteSet(setId: string) {
        setErrorMessage(null);

        const confirmed = window.confirm('Delete this set?');

        if (!confirmed) {
            return;
        }

        try {
            await deleteWorkoutSet.mutateAsync(setId);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not delete set.');
        }
    }

    async function handleLogSet(event: FormEvent<HTMLFormElement>) {

        event.preventDefault()
        setErrorMessage(null)

        if (!activePlannedExercise) {
            setErrorMessage('Choose an exercise first.')
            return
        }

        const parsedWeight = optionalNumberFromInput(weight)
        const parsedReps = optionalNumberFromInput(reps)

        if (parsedReps === null || parsedReps < 0) {
            setErrorMessage('Enter reps for this set.')
            return
        }

        const nextSetNumber =
            getNextSetNumber(activePlannedExercise.id, loggedSets) + activeOfflineSets.length

        const setPayload = {
            workoutSessionId: session.id,
            plannedExerciseId: activePlannedExercise.id,
            exerciseId: activePlannedExercise.exercise_id,
            setNumber: nextSetNumber,
            setType: 'working' as const,
            weight: parsedWeight,
            weightUnit,
            reps: parsedReps,
            rpe: null,
            notes
        }

        try {
            if (!offlineSync.isOnline || !user) {
                throw new Error('Offline, saved locally')
            }

            await createSet.mutateAsync(setPayload)
        } catch (error) {
            if (!user) {
                setErrorMessage('You must be signed in to log a set.')
                return
            }

            addOfflineWorkoutSet({
                localId: createLocalId(),
                userId: user.id,
                workoutSessionId: session.id,
                plannedExerciseId: activePlannedExercise.id,
                exerciseId: activePlannedExercise.exercise_id,
                setNumber: nextSetNumber,
                setType: 'working',
                weight: parsedWeight,
                weightUnit,
                reps: parsedReps,
                rpe: null,
                notes: notes.trim() || null,
                createdAt: new Date().toISOString(),
                syncError: error instanceof Error ? error.message : null
            })

            offlineSync.refreshPendingCount()
        }

        setWeight('')
        setReps('')
        setNotes('')
        startRestTimer(activePlannedExercise.rest_seconds)
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
                <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900">
                    <p className="font-semibold">
                        Connection: {offlineSync.isOnline ? 'Online' : 'Offline'}
                    </p>
                    <p className="mt-1 text-stone-500 dark:text-stone-400">
                        Pending local sets: {offlineSync.pendingCount}
                    </p>

                    {offlineSync.pendingCount > 0 ? (
                        <button
                            type="button"
                            onClick={offlineSync.syncPendingSets}
                            disabled={!offlineSync.isOnline || offlineSync.isSyncing}
                            className="mt-3 min-h-10 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-stone-950"
                        >
                            {offlineSync.isSyncing ? 'Syncing...' : 'Sync pending sets'}
                        </button>
                    ) : null}
                </div>
                <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Logged sets</p>
                    <p className="mt-1 text-xl font-bold">{loggedSets.length}</p>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={goToPreviousExercise}
                        disabled={!canGoPrevious}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                    >
                        <ChevronLeft className="size-4" />
                        Prev
                    </button>

                    <div className="min-w-0 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Exercise {totalExercises === 0 ? 0 : activeExerciseNumber} of {totalExercises}
                        </p>
                        <p className="mt-1 truncate text-sm font-bold text-stone-900 dark:text-stone-50">
                            {activePlannedExercise
                                ? getExerciseNameForPlannedExercise(activePlannedExercise, exercises)
                                : 'No exercise selected'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={goToNextExercise}
                        disabled={!canGoNext}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                    >
                        Next
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>

            {activePlannedExercise ? (
                <article className="mt-4 rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                Exercise {activeExerciseNumber} of {totalExercises}
                            </p>
                            <h3 className="mt-1 text-lg font-bold">
                                {getExerciseNameForPlannedExercise(activePlannedExercise, exercises)}
                            </h3>
                        </div>

                        {activeLoggedSets.length >= activePlannedExercise.planned_sets ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
                                Sets done
                            </span>
                        ) : null}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        Target: {activePlannedExercise.planned_sets} sets
                        {activePlannedExercise.min_reps && activePlannedExercise.max_reps
                            ? ` x ${activePlannedExercise.min_reps}-${activePlannedExercise.max_reps} reps`
                            : ''}
                        {activePlannedExercise.target_rpe ? `, RPE ${activePlannedExercise.target_rpe}` : ''}
                        {activePlannedExercise.rest_seconds ? `, ${activePlannedExercise.rest_seconds}s rest` : ''}
                    </p>

                    {activePlannedExercise.deload_rule ? (
                        <details className="mt-3 rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                            <summary className="cursor-pointer font-semibold">Deload rule</summary>
                            <p className="mt-2">{activePlannedExercise.deload_rule}</p>
                        </details>
                    ) : null}

                    {activeExerciseHistory ? (
                        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <History className="size-4 text-emerald-600" />
                                    <p className="text-sm font-bold">Previous performance</p>
                                </div>

                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200 dark:bg-neutral-950 dark:text-stone-300 dark:ring-neutral-800">
                                    {activeExerciseHistory.totalSets} sets
                                </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl bg-white p-3 ring-1 ring-stone-200 dark:bg-neutral-950 dark:ring-neutral-800">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                        Last set
                                    </p>
                                    <p className="mt-1 text-base font-bold">
                                        {lastExerciseSet?.weight ?? '--'} {preferredUnit} x {lastExerciseSet?.reps ?? '--'}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-3 ring-1 ring-stone-200 dark:bg-neutral-950 dark:ring-neutral-800">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                        Best estimate
                                    </p>
                                    <p className="mt-1 text-base font-bold">
                                        {bestExerciseSet?.estimatedOneRepMax ?? '--'} {preferredUnit} 1RM
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={fillLastSet}
                                    disabled={!lastExerciseSet}
                                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                                >
                                    <History className="size-4" />
                                    Use last set
                                </button>

                                <button
                                    type="button"
                                    onClick={fillBestSet}
                                    disabled={!bestExerciseSet}
                                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                                >
                                    <Sparkles className="size-4" />
                                    Use best set
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                                No previous sets for this exercise yet.
                            </p>
                        </div>
                    )}

                    <div className="mt-3 rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-300">
                                <Timer className="size-4" />
                                Rest timer
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-stone-900 ring-1 ring-stone-200 dark:bg-neutral-950 dark:text-stone-50 dark:ring-neutral-800">
                                {restTimerLabel}
                            </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={handleSetCustomRestTime}
                                className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-950"
                            >
                                {formatTimer(restTimerSeconds)}
                            </button>

                            <button
                                type="button"
                                onClick={toggleRestTimer}
                                className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-950"
                            >
                                {isRestTimerRunning ? 'Pause' : 'Start'}
                            </button>

                            <button
                                type="button"
                                onClick={clearRestTimer}
                                className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-950"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleLogSet} className="mt-4 grid gap-4">
                        <div className="grid grid-cols-[1fr_90px] gap-3">
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Weight</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
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

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Reps</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={reps}
                                onChange={(event) => setReps(event.target.value)}
                                placeholder="Reps"
                                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>

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

                        {activeLoggedSets.map((set) => {
                            const isEditingThisSet = editingSetId === set.id;

                            return (
                                <div
                                    key={set.id}
                                    className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900"
                                >
                                    {isEditingThisSet ? (
                                        <form onSubmit={handleUpdateSet} className="grid gap-3">
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <label className="grid gap-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                        Weight
                                                    </span>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={editingSetWeight}
                                                        step="0.5"
                                                        onChange={(event) => setEditingSetWeight(event.target.value)}
                                                        className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                        Reps
                                                    </span>
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={editingSetReps}
                                                        onChange={(event) => setEditingSetReps(event.target.value)}
                                                        className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>
                                            </div>

                                            <label className="grid gap-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                    Notes
                                                </span>
                                                <textarea
                                                    value={editingSetNotes}
                                                    onChange={(event) => setEditingSetNotes(event.target.value)}
                                                    rows={2}
                                                    className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                />
                                            </label>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={updateWorkoutSet.isPending}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
                                                >
                                                    <Save className="size-4" />
                                                    Save
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={cancelEditingSet}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold dark:border-neutral-800"
                                                >
                                                    <X className="size-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-semibold">
                                                    Set {set.set_number}: {formatLoggedWeight(set.weight_kg, preferredUnit)} x{' '}
                                                    {set.reps ?? '--'}
                                                </span>

                                                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                    {set.set_type.replaceAll('_', ' ')}
                                                </span>
                                            </div>

                                            {set.notes ? (
                                                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                                                    {set.notes}
                                                </p>
                                            ) : null}

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditingSet(set)}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSet(set.id)}
                                                    disabled={deleteWorkoutSet.isPending}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-red-950/30"
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        {activeOfflineSets.map((set) => (
                            <div
                                key={set.localId}
                                className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900"
                            >
                                <span className="font-semibold">Set {set.setNumber} pending</span>
                                <span>
                                    {set.weight ?? '--'} {set.weightUnit} x {set.reps ?? '--'} reps
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
            {activeLoggedSets.length > 0 && canGoNext ? (
                <button
                    type="button"
                    onClick={goToNextExercise}
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    Next exercise
                    <ChevronRight className="size-4" />
                </button>
            ) : null}
            {activeRecommendation && activeRecommendation.kind !== 'no_data' ? (
                <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900">
                    <p className="font-bold">{activeRecommendation.title}</p>
                    <p className="mt-1 leading-6">{activeRecommendation.explanation}</p>
                    {activeRecommendation.nextWeight !== null ? (
                        <p className="mt-2 font-semibold">
                            Suggested next target: {activeRecommendation.nextWeight} {preferredUnit}
                            {activeRecommendation.nextReps ? ` for ${activeRecommendation.nextReps} reps` : ''}
                        </p>
                    ) : null}
                    <p className="mt-2 text-xs opacity-80">
                        This is a recommendation only. The app will not change your program without approval.
                    </p>
                </div>
            ) : null}

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
