import type { WeightUnit } from '../../../lib/supabase/types';
import { convertWeight, roundToOneDecimal } from '../../../lib/utils/units';
import type { Exercise } from './workouts';
import type { WorkoutSet, WorkoutSetWithSessionDate } from './workout-sessions';

export type ExerciseHistorySet = {
    id: string;
    exerciseId: string;
    exerciseName: string;
    workoutSessionId: string;
    setNumber: number;
    setType: string;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    estimatedOneRepMax: number | null;
    createdAt: string;
    sessionDate: string;
};

export type ExerciseHistorySummary = {
    exerciseId: string;
    exerciseName: string;
    totalSets: number;
    latestSet: ExerciseHistorySet | null;
    bestWeightSet: ExerciseHistorySet | null;
    bestEstimatedOneRepMaxSet: ExerciseHistorySet | null;
    recentSets: ExerciseHistorySet[];
    chartPoints: Array<{
        date: string;
        weight: number | null;
        estimatedOneRepMax: number | null;
    }>;
};

export function calculateEstimatedOneRepMax(weight: number | null, reps: number | null) {
    if (
        typeof weight !== 'number' ||
        typeof reps !== 'number' ||
        !Number.isFinite(weight) ||
        !Number.isFinite(reps) ||
        weight <= 0 ||
        reps <= 0
    ) {
        return null;
    }

    if (reps === 1) {
        return roundToOneDecimal(weight);
    }

    return roundToOneDecimal(weight * (1 + reps / 30));
}

function getExerciseName(exerciseId: string, exercises: Exercise[]) {
    return exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Unknown exercise';
}

export function getWorkoutSetSessionDate(set: WorkoutSet | WorkoutSetWithSessionDate) {
    return 'workout_sessions' in set && set.workout_sessions?.session_date
        ? set.workout_sessions.session_date
        : set.created_at.slice(0, 10);
}

function compareHistorySetsNewestFirst(a: ExerciseHistorySet, b: ExerciseHistorySet) {
    const sessionDateCompare = b.sessionDate.localeCompare(a.sessionDate);

    if (sessionDateCompare !== 0) {
        return sessionDateCompare;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function buildExerciseHistory(input: {
    sets: Array<WorkoutSet | WorkoutSetWithSessionDate>;
    exercises: Exercise[];
    unit: WeightUnit;
}) {
    const validSets = input.sets
        .filter((set) => set.completed && !set.deleted_at)
        .map((set): ExerciseHistorySet => {
            const weight =
                typeof set.weight_kg === 'number' ? convertWeight(set.weight_kg, 'kg', input.unit) : null;

            return {
                id: set.id,
                exerciseId: set.exercise_id,
                exerciseName: getExerciseName(set.exercise_id, input.exercises),
                workoutSessionId: set.workout_session_id,
                setNumber: set.set_number,
                setType: set.set_type,
                weight,
                reps: set.reps,
                rpe: set.rpe,
                estimatedOneRepMax: calculateEstimatedOneRepMax(weight, set.reps),
                createdAt: set.created_at,
                sessionDate: getWorkoutSetSessionDate(set),
            };
        })
        .sort(compareHistorySetsNewestFirst);

    const grouped = new Map<string, ExerciseHistorySet[]>();

    for (const set of validSets) {
        const existing = grouped.get(set.exerciseId) ?? [];
        existing.push(set);
        grouped.set(set.exerciseId, existing);
    }

    return Array.from(grouped.entries())
        .map(([exerciseId, sets]): ExerciseHistorySummary => {
            const bestWeightSet =
                sets
                    .filter((set) => typeof set.weight === 'number')
                    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0] ?? null;

            const bestEstimatedOneRepMaxSet =
                sets
                    .filter((set) => typeof set.estimatedOneRepMax === 'number')
                    .sort((a, b) => (b.estimatedOneRepMax ?? 0) - (a.estimatedOneRepMax ?? 0))[0] ?? null;

            const chartPoints = sets
                .slice()
                .reverse()
                .map((set) => ({
                    date: new Date(`${set.sessionDate}T00:00:00`).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                    }),
                    weight: set.weight,
                    estimatedOneRepMax: set.estimatedOneRepMax,
                }))
                .slice(-12);

            return {
                exerciseId,
                exerciseName: sets[0]?.exerciseName ?? 'Unknown exercise',
                totalSets: sets.length,
                latestSet: sets[0] ?? null,
                bestWeightSet,
                bestEstimatedOneRepMaxSet,
                recentSets: sets.slice(0, 5),
                chartPoints,
            };
        })
        .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

export function getLatestExerciseSessionSets(input: {
    sets: Array<WorkoutSet | WorkoutSetWithSessionDate>;
    exerciseId: string;
    beforeSessionId?: string | null;
    onOrBeforeDate?: string | null;
}) {
    const groupedBySession = new Map<string, Array<WorkoutSet | WorkoutSetWithSessionDate>>();

    for (const set of input.sets) {
        if (set.exercise_id !== input.exerciseId || set.deleted_at) {
            continue;
        }

        if (input.beforeSessionId && set.workout_session_id === input.beforeSessionId) {
            continue;
        }

        const sessionDate = getWorkoutSetSessionDate(set);

        if (input.onOrBeforeDate && sessionDate > input.onOrBeforeDate) {
            continue;
        }

        const sessionSets = groupedBySession.get(set.workout_session_id) ?? [];
        sessionSets.push(set);
        groupedBySession.set(set.workout_session_id, sessionSets);
    }

    const latestSession = Array.from(groupedBySession.values())
        .map((sets) => ({
            sessionDate: sets[0] ? getWorkoutSetSessionDate(sets[0]) : '',
            latestCreatedAt: sets
                .map((set) => new Date(set.created_at).getTime())
                .sort((a, b) => b - a)[0] ?? 0,
            sets: sets.slice().sort((a, b) => a.set_number - b.set_number),
        }))
        .sort((a, b) => {
            const sessionDateCompare = b.sessionDate.localeCompare(a.sessionDate);

            if (sessionDateCompare !== 0) {
                return sessionDateCompare;
            }

            return b.latestCreatedAt - a.latestCreatedAt;
        })[0];

    return latestSession?.sets ?? [];
}
