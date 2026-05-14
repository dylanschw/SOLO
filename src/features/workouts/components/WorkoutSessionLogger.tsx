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
    Timer,
    SkipForward,
    Replace
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { WeightUnit, WorkoutSetLoadType } from '../../../lib/supabase/types';
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
    formatWorkoutSetLoad,
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
import { buildExerciseHistory, getLatestExerciseSessionSets } from '../lib/exercise-history';

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

function formatOfflineWorkoutSetLoad(set: {
    loadType?: WorkoutSetLoadType
    weight: number | null
    assistWeight?: number | null
    addedWeight?: number | null
    weightUnit: WeightUnit
}) {
    const loadType = set.loadType ?? 'weighted'

    if (loadType === 'bodyweight') {
        return 'Bodyweight'
    }

    if (loadType === 'no_weight') {
        return 'No weight'
    }

    if (loadType === 'assisted') {
        return set.assistWeight === null || typeof set.assistWeight === 'undefined'
            ? 'Assisted'
            : `Assisted ${set.assistWeight} ${set.weightUnit}`
    }

    if (loadType === 'added_weight') {
        return set.addedWeight === null || typeof set.addedWeight === 'undefined'
            ? 'Added weight'
            : `+${set.addedWeight} ${set.weightUnit}`
    }

    return set.weight === null ? 'No weight' : `${set.weight} ${set.weightUnit}`
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
    const [loadType, setLoadType] = useState<WorkoutSetLoadType>('weighted');
    const [assistWeight, setAssistWeight] = useState('');
    const [addedWeight, setAddedWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState<WeightUnit>(preferredUnit);
    const [reps, setReps] = useState('');
    const [notes, setNotes] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
    const [restTimerSeconds, setRestTimerSeconds] = useState(120);
    const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
    const [editingSetId, setEditingSetId] = useState<string | null>(null);
    const [editingSetLoadType, setEditingSetLoadType] = useState<WorkoutSetLoadType>('weighted');
    const [editingSetWeight, setEditingSetWeight] = useState('');
    const [editingSetAssistWeight, setEditingSetAssistWeight] = useState('');
    const [editingSetAddedWeight, setEditingSetAddedWeight] = useState('');
    const [editingSetReps, setEditingSetReps] = useState('');
    const [editingSetNotes, setEditingSetNotes] = useState('');
    const [sessionExerciseOverrides, setSessionExerciseOverrides] = useState<Record<string, string>>({});

    const activePlannedExercise = plannedExercises[activeExerciseIndex] ?? null;
    const activeExerciseId = activePlannedExercise
        ? sessionExerciseOverrides[activePlannedExercise.id] ?? activePlannedExercise.exercise_id
        : null;
    const activeExercise = activeExerciseId
        ? exercises.find((exercise) => exercise.id === activeExerciseId) ?? null
        : null;
    const activeExerciseName = activePlannedExercise
        ? activeExercise?.name ?? getExerciseNameForPlannedExercise(activePlannedExercise, exercises)
        : 'No exercise selected';
    const plannedExercise = activePlannedExercise
        ? exercises.find((exercise) => exercise.id === activePlannedExercise.exercise_id) ?? null
        : null;
    const alternateExercises = activePlannedExercise
        ? exercises.filter((exercise) => {
            if (exercise.id === activePlannedExercise.exercise_id || exercise.id === activeExerciseId) {
                return false;
            }

            const sameMuscleGroup =
                plannedExercise?.muscle_group &&
                exercise.muscle_group &&
                plannedExercise.muscle_group.toLowerCase() === exercise.muscle_group.toLowerCase();
            const sameEquipment =
                plannedExercise?.equipment &&
                exercise.equipment &&
                plannedExercise.equipment.toLowerCase() === exercise.equipment.toLowerCase();

            return Boolean(sameMuscleGroup || sameEquipment);
        }).slice(0, 5)
        : [];

    const exerciseHistory = useMemo(
        () =>
            buildExerciseHistory({
                sets: allWorkoutSets.filter((set) => set.workout_session_id !== session.id),
                exercises,
                unit: preferredUnit
            }),
        [allWorkoutSets, exercises, preferredUnit, session.id]
    );

    const activeExerciseHistory = activeExerciseId
        ? exerciseHistory.find((history) => history.exerciseId === activeExerciseId) ?? null
        : null;

    const lastExerciseSet = activeExerciseHistory?.latestSet ?? null;
    const bestExerciseSet = activeExerciseHistory?.bestEstimatedOneRepMaxSet ?? null;

    const activeLoggedSets = activePlannedExercise
        ? getLoggedSetsForPlannedExercise(activePlannedExercise.id, loggedSets)
        : [];

    const activeOfflineSets = activePlannedExercise
        ? getOfflineWorkoutSetsForPlannedExercise(session.id, activePlannedExercise.id)
        : [];

    const previousWorkoutSetsForRecommendation = activeExerciseId
        ? getLatestExerciseSessionSets({
            sets: allWorkoutSets,
            exerciseId: activeExerciseId,
            beforeSessionId: session.id,
            onOrBeforeDate: session.session_date,
        })
        : [];

    const activeRecommendation = activePlannedExercise
        ? buildRecommendationForExercise(activePlannedExercise, previousWorkoutSetsForRecommendation, preferredUnit)
        : null;

    const activeSkippedSet = activeLoggedSets.find((set) => set.set_type === 'skipped' || !set.completed) ?? null;

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
        load_type?: WorkoutSetLoadType | null;
        weight_kg: number | null;
        assist_weight_kg?: number | null;
        added_weight_kg?: number | null;
        reps: number | null;
        notes: string | null;
    }) {
        setEditingSetId(set.id);
        setEditingSetLoadType(set.load_type ?? 'weighted');
        setEditingSetWeight(
            typeof set.weight_kg === 'number'
                ? String(formatLoggedWeight(set.weight_kg, preferredUnit).replace(` ${preferredUnit}`, ''))
                : ''
        );
        setEditingSetAssistWeight(
            typeof set.assist_weight_kg === 'number'
                ? String(formatLoggedWeight(set.assist_weight_kg, preferredUnit).replace(` ${preferredUnit}`, ''))
                : ''
        );
        setEditingSetAddedWeight(
            typeof set.added_weight_kg === 'number'
                ? String(formatLoggedWeight(set.added_weight_kg, preferredUnit).replace(` ${preferredUnit}`, ''))
                : ''
        );
        setEditingSetReps(typeof set.reps === 'number' ? String(set.reps) : '');
        setEditingSetNotes(set.notes ?? '');
    }

    function cancelEditingSet() {
        setEditingSetId(null);
        setEditingSetLoadType('weighted');
        setEditingSetWeight('');
        setEditingSetAssistWeight('');
        setEditingSetAddedWeight('');
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
        const parsedAssistWeight = editingSetAssistWeight.trim() ? Number(editingSetAssistWeight) : null;
        const parsedAddedWeight = editingSetAddedWeight.trim() ? Number(editingSetAddedWeight) : null;
        const parsedReps = editingSetReps.trim() ? Number(editingSetReps) : null;

        if (parsedWeight !== null && (!Number.isFinite(parsedWeight) || parsedWeight < 0)) {
            setErrorMessage('Enter a valid weight.');
            return;
        }

        if (parsedAssistWeight !== null && (!Number.isFinite(parsedAssistWeight) || parsedAssistWeight < 0)) {
            setErrorMessage('Enter a valid assistance weight.');
            return;
        }

        if (parsedAddedWeight !== null && (!Number.isFinite(parsedAddedWeight) || parsedAddedWeight < 0)) {
            setErrorMessage('Enter a valid added weight.');
            return;
        }

        if (parsedReps !== null && (!Number.isFinite(parsedReps) || parsedReps < 0)) {
            setErrorMessage('Enter valid reps.');
            return;
        }

        try {
            await updateWorkoutSet.mutateAsync({
                setId: editingSetId,
                loadType: editingSetLoadType,
                weight: editingSetLoadType === 'weighted' ? parsedWeight : null,
                assistWeight: editingSetLoadType === 'assisted' ? parsedAssistWeight : null,
                addedWeight: editingSetLoadType === 'added_weight' ? parsedAddedWeight : null,
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
        const parsedAssistWeight = optionalNumberFromInput(assistWeight)
        const parsedAddedWeight = optionalNumberFromInput(addedWeight)
        const parsedReps = optionalNumberFromInput(reps)

        if (parsedReps === null || parsedReps < 0) {
            setErrorMessage('Enter reps for this set.')
            return
        }

        if (loadType === 'assisted' && (parsedAssistWeight === null || parsedAssistWeight < 0)) {
            setErrorMessage('Enter the assistance weight.')
            return
        }

        if (loadType === 'added_weight' && (parsedAddedWeight === null || parsedAddedWeight < 0)) {
            setErrorMessage('Enter the added weight.')
            return
        }

        const nextSetNumber =
            getNextSetNumber(activePlannedExercise.id, loggedSets) + activeOfflineSets.length

        const setPayload = {
            workoutSessionId: session.id,
            plannedExerciseId: activePlannedExercise.id,
            exerciseId: activeExerciseId ?? activePlannedExercise.exercise_id,
            setNumber: nextSetNumber,
            setType: 'working' as const,
            loadType,
            weight: loadType === 'weighted' ? parsedWeight : null,
            assistWeight: loadType === 'assisted' ? parsedAssistWeight : null,
            addedWeight: loadType === 'added_weight' ? parsedAddedWeight : null,
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
                exerciseId: activeExerciseId ?? activePlannedExercise.exercise_id,
                setNumber: nextSetNumber,
                setType: 'working',
                loadType,
                weight: loadType === 'weighted' ? parsedWeight : null,
                assistWeight: loadType === 'assisted' ? parsedAssistWeight : null,
                addedWeight: loadType === 'added_weight' ? parsedAddedWeight : null,
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
        setAssistWeight('')
        setAddedWeight('')
        setReps('')
        setNotes('')
        startRestTimer(activePlannedExercise.rest_seconds)
    }

    async function handleSkipExercise() {
        setErrorMessage(null)

        if (!activePlannedExercise) {
            return
        }

        const confirmed = window.confirm('Skip this exercise for this session only?')

        if (!confirmed) {
            return
        }

        const nextSetNumber =
            getNextSetNumber(activePlannedExercise.id, loggedSets) + activeOfflineSets.length

        try {
            if (!offlineSync.isOnline || !user) {
                throw new Error('Offline, saved locally')
            }

            await createSet.mutateAsync({
                workoutSessionId: session.id,
                plannedExerciseId: activePlannedExercise.id,
                exerciseId: activePlannedExercise.exercise_id,
                setNumber: nextSetNumber,
                setType: 'skipped',
                loadType: 'no_weight',
                weight: null,
                assistWeight: null,
                addedWeight: null,
                weightUnit,
                reps: null,
                rpe: null,
                notes: 'Skipped during this session.',
                completed: false,
            })

            if (canGoNext) {
                goToNextExercise()
            }
        } catch (error) {
            if (!user) {
                setErrorMessage('You must be signed in to skip an exercise.')
                return
            }

            addOfflineWorkoutSet({
                localId: createLocalId(),
                userId: user.id,
                workoutSessionId: session.id,
                plannedExerciseId: activePlannedExercise.id,
                exerciseId: activePlannedExercise.exercise_id,
                setNumber: nextSetNumber,
                setType: 'skipped',
                loadType: 'no_weight',
                weight: null,
                assistWeight: null,
                addedWeight: null,
                weightUnit,
                reps: null,
                rpe: null,
                notes: 'Skipped during this session.',
                createdAt: new Date().toISOString(),
                syncError: error instanceof Error ? error.message : null
            })

            offlineSync.refreshPendingCount()

            if (canGoNext) {
                goToNextExercise()
            }
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
                                ? activeExerciseName
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
                                {activeExerciseName}
                            </h3>
                        </div>

                        {activeSkippedSet ? (
                            <span className="max-w-[45%] shrink-0 whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">
                                Skipped
                            </span>
                        ) : activeLoggedSets.filter((set) => set.completed).length >= activePlannedExercise.planned_sets ? (
                            <span className="max-w-[45%] shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
                                Sets done
                            </span>
                        ) : null}
                    </div>

                    {activeExerciseId && activeExerciseId !== activePlannedExercise.exercise_id ? (
                        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900">
                            <p className="font-semibold">Session alternate</p>
                            <p className="mt-1 leading-6">
                                This session is logging {activeExerciseName} instead of{' '}
                                {getExerciseNameForPlannedExercise(activePlannedExercise, exercises)}. Your saved plan is unchanged.
                            </p>
                        </div>
                    ) : null}

                    <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        Target: {activePlannedExercise.planned_sets} sets
                        {activePlannedExercise.min_reps && activePlannedExercise.max_reps
                            ? ` x ${activePlannedExercise.min_reps}-${activePlannedExercise.max_reps} reps`
                            : ''}
                        {activePlannedExercise.target_rpe ? `, RPE ${activePlannedExercise.target_rpe}` : ''}
                        {activePlannedExercise.rest_seconds ? `, ${activePlannedExercise.rest_seconds}s rest` : ''}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
                        Logged sets, extra sets, skips, and alternates are session-only. They do not change your saved program.
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

                    {alternateExercises.length > 0 ? (
                        <details className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                            <summary className="cursor-pointer text-sm font-bold">
                                Alternates for this session
                            </summary>

                            <div className="mt-3 grid gap-2">
                                {alternateExercises.map((exercise) => (
                                    <button
                                        key={exercise.id}
                                        type="button"
                                        onClick={() => {
                                            setSessionExerciseOverrides((currentOverrides) => ({
                                                ...currentOverrides,
                                                [activePlannedExercise.id]: exercise.id,
                                            }))
                                        }}
                                        className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 text-left text-sm transition hover:bg-stone-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold">{exercise.name}</span>
                                            <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                                                {exercise.muscle_group || 'Similar movement'}
                                                {exercise.equipment ? ` - ${exercise.equipment}` : ''}
                                            </span>
                                        </span>
                                        <Replace className="size-4 shrink-0" />
                                    </button>
                                ))}

                                {activeExerciseId !== activePlannedExercise.exercise_id ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSessionExerciseOverrides((currentOverrides) => {
                                                const nextOverrides = { ...currentOverrides }
                                                delete nextOverrides[activePlannedExercise.id]
                                                return nextOverrides
                                            })
                                        }}
                                        className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-950"
                                    >
                                        Use planned exercise
                                    </button>
                                ) : null}
                            </div>
                        </details>
                    ) : null}

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
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px]">
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Load type</span>
                                <select
                                    value={loadType}
                                    onChange={(event) => setLoadType(event.target.value as WorkoutSetLoadType)}
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                >
                                    <option value="weighted">Weighted</option>
                                    <option value="bodyweight">Bodyweight</option>
                                    <option value="no_weight">No weight</option>
                                    <option value="assisted">Assisted</option>
                                    <option value="added_weight">Added weight</option>
                                </select>
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

                        {loadType === 'weighted' ? (
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
                        ) : null}

                        {loadType === 'assisted' ? (
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Assistance</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    value={assistWeight}
                                    onChange={(event) => setAssistWeight(event.target.value)}
                                    placeholder={`Assist weight in ${weightUnit}`}
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>
                        ) : null}

                        {loadType === 'added_weight' ? (
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Added weight</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    value={addedWeight}
                                    onChange={(event) => setAddedWeight(event.target.value)}
                                    placeholder={`Added weight in ${weightUnit}`}
                                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>
                        ) : null}

                        {loadType === 'bodyweight' || loadType === 'no_weight' ? (
                            <p className="rounded-xl bg-stone-50 p-3 text-sm text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                                {loadType === 'bodyweight'
                                    ? 'This set will be logged as bodyweight.'
                                    : 'This set will be logged with reps only.'}
                            </p>
                        ) : null}

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

                    <button
                        type="button"
                        onClick={handleSkipExercise}
                        disabled={createSet.isPending || Boolean(activeSkippedSet)}
                        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-900"
                    >
                        <SkipForward className="size-4" />
                        {activeSkippedSet ? 'Exercise skipped' : 'Skip for this session'}
                    </button>

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
                                                        Load type
                                                    </span>
                                                    <select
                                                        value={editingSetLoadType}
                                                        onChange={(event) => setEditingSetLoadType(event.target.value as WorkoutSetLoadType)}
                                                        className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    >
                                                        <option value="weighted">Weighted</option>
                                                        <option value="bodyweight">Bodyweight</option>
                                                        <option value="no_weight">No weight</option>
                                                        <option value="assisted">Assisted</option>
                                                        <option value="added_weight">Added weight</option>
                                                    </select>
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                        Weight
                                                    </span>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={editingSetWeight}
                                                        step="0.5"
                                                        disabled={editingSetLoadType !== 'weighted'}
                                                        onChange={(event) => setEditingSetWeight(event.target.value)}
                                                        className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                        Assistance
                                                    </span>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={editingSetAssistWeight}
                                                        step="0.5"
                                                        disabled={editingSetLoadType !== 'assisted'}
                                                        onChange={(event) => setEditingSetAssistWeight(event.target.value)}
                                                        className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                        Added
                                                    </span>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={editingSetAddedWeight}
                                                        step="0.5"
                                                        disabled={editingSetLoadType !== 'added_weight'}
                                                        onChange={(event) => setEditingSetAddedWeight(event.target.value)}
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
                                                    Set {set.set_number}: {formatWorkoutSetLoad(set, preferredUnit)} x{' '}
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
                                    {formatOfflineWorkoutSetLoad(set)} x {set.reps ?? '--'} reps
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
