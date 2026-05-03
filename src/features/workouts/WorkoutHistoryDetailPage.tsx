import { ArrowLeft, CalendarDays, Dumbbell, Pencil, Save, Trash2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '../profile/hooks/useProfile';
import { convertWeight } from '../../lib/utils/units';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useExercises, useWorkoutDays } from './hooks/useWorkouts';
import {
    useDeleteWorkoutSession,
    useWorkoutSessions,
    useDeleteWorkoutSet,
    useUpdateWorkoutSet,
    useWorkoutSets
} from './hooks/useWorkoutSessions';

function formatDate(value: string | null) {
    if (!value) {
        return 'Unknown date';
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateTime(value: string | null) {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function formatWeight(weightKg: number | null, unit: 'lb' | 'kg') {
    if (typeof weightKg !== 'number' || !Number.isFinite(weightKg)) {
        return '--';
    }

    return convertWeight(weightKg, 'kg', unit);
}

export function WorkoutHistoryDetailPage() {
    const navigate = useNavigate();
    const { sessionId } = useParams();

    const updateWorkoutSet = useUpdateWorkoutSet();
    const deleteWorkoutSet = useDeleteWorkoutSet();

    const profileQuery = useProfile();
    const sessionsQuery = useWorkoutSessions();
    const exercisesQuery = useExercises();
    const deleteWorkoutSession = useDeleteWorkoutSession();

    const preferredUnit = profileQuery.data?.preferred_weight_unit ?? 'lb';
    const sessions = sessionsQuery.data ?? [];
    const exercises = exercisesQuery.data ?? [];

    const session = sessions.find((currentSession) => currentSession.id === sessionId) ?? null;
    const workoutSetsQuery = useWorkoutSets(sessionId ?? null);
    const workoutSets = workoutSetsQuery.data ?? [];

    const [editingSetId, setEditingSetId] = useState<string | null>(null);
    const [editingSetWeight, setEditingSetWeight] = useState('');
    const [editingSetReps, setEditingSetReps] = useState('');
    const [editingSetNotes, setEditingSetNotes] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const workoutDaysQuery = useWorkoutDays(session?.program_id ?? null);
    const workoutDays = workoutDaysQuery.data ?? [];
    const workoutDay = session
        ? workoutDays.find((day) => day.id === session.workout_day_id) ?? null
        : null;

    const totalSets = workoutSets.length;
    const groupedSets = workoutSets.reduce<Record<string, typeof workoutSets>>((groups, set) => {
        const currentGroup = groups[set.exercise_id] ?? [];
        currentGroup.push(set);
        groups[set.exercise_id] = currentGroup;
        return groups;
    }, {});

    function getExerciseName(exerciseId: string) {
        return exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Unknown exercise';
    }

    function startEditingSet(set: {
        id: string;
        weight_kg: number | null;
        reps: number | null;
        notes: string | null;
    }) {
        setEditingSetId(set.id);
        setEditingSetWeight(
            typeof set.weight_kg === 'number' ? String(formatWeight(set.weight_kg, preferredUnit)) : ''
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

    async function handleDeleteWorkout() {
        if (!session) {
            return;
        }

        const confirmed = window.confirm('Delete this workout from history?');

        if (!confirmed) {
            return;
        }

        await deleteWorkoutSession.mutateAsync(session.id);
        navigate('/app/workouts');
    }

    if (sessionsQuery.isLoading) {
        return (
            <section>
                <Link
                    to="/app/workouts"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    <ArrowLeft className="size-4" />
                    Back to workouts
                </Link>

                <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Loading workout...</p>
                </div>
            </section>
        );
    }

    if (!session) {
        return (
            <section>
                <Link
                    to="/app/workouts"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    <ArrowLeft className="size-4" />
                    Back to workouts
                </Link>

                <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <h1 className="text-2xl font-bold">Workout not found</h1>
                    <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        This workout could not be found. It may have been deleted or created under a different account.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <Link
                to="/app/workouts"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
                <ArrowLeft className="size-4" />
                Back to workouts
            </Link>

            {errorMessage ? (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
                    {errorMessage}
                </p>
            ) : null}

            <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">
                            Workout history
                        </p>
                        <h1 className="mt-1 text-2xl font-bold">
                            {workoutDay ? workoutDay.name : 'Workout session'}
                        </h1>
                        <p className="mt-2 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
                            <CalendarDays className="size-4" />
                            {formatDate(session.session_date)}
                        </p>
                    </div>

                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                        {session.status.replaceAll('_', ' ')}
                    </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
                        <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Total sets</p>
                        <p className="mt-1 text-2xl font-bold">{totalSets}</p>
                    </div>

                    <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
                        <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Completed</p>
                        <p className="mt-1 text-lg font-bold">
                            {formatDateTime(session.completed_at) ?? 'Not completed'}
                        </p>
                    </div>
                </div>

                {session.notes ? (
                    <div className="mt-4 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
                        <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Notes</p>
                        <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-200">
                            {session.notes}
                        </p>
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={handleDeleteWorkout}
                    disabled={deleteWorkoutSession.isPending}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-red-950/30"
                >
                    <Trash2 className="size-4" />
                    Delete workout
                </button>
            </article>

            <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center gap-3">
                    <Dumbbell className="size-5 text-emerald-600" />
                    <h2 className="text-xl font-bold">Logged sets</h2>
                </div>

                {workoutSetsQuery.isLoading ? (
                    <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Loading sets...</p>
                ) : null}

                {!workoutSetsQuery.isLoading && workoutSets.length === 0 ? (
                    <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        No sets were logged for this workout.
                    </p>
                ) : null}

                <div className="mt-4 grid gap-4">
                    {Object.entries(groupedSets).map(([exerciseId, sets]) => (
                        <div
                            key={exerciseId}
                            className="rounded-2xl border border-stone-200 p-4 dark:border-neutral-800"
                        >
                            <h3 className="font-bold">{getExerciseName(exerciseId)}</h3>

                            <div className="mt-3 grid gap-2">
                                {sets.map((set) => {
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
                                                        <span className="font-semibold">Set {set.set_number}</span>
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                                            {set.set_type.replaceAll('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <p className="mt-2 text-base font-bold">
                                                        {formatWeight(set.weight_kg, preferredUnit)} {preferredUnit} x {set.reps ?? '--'}
                                                    </p>

                                                    {set.rpe ? (
                                                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                                            RPE {set.rpe}
                                                        </p>
                                                    ) : null}

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
                            </div>
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}