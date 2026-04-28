import type { WeightUnit } from '../../../lib/supabase/types';
import { convertWeight, roundToOneDecimal } from '../../../lib/utils/units';
import type { Exercise } from './workouts';
import type { WorkoutSet } from './workout-sessions';

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

export function buildExerciseHistory(input: {
    sets: WorkoutSet[];
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
            };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
                    date: new Date(set.createdAt).toLocaleDateString(undefined, {
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