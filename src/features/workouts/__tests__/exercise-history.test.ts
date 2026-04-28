import { describe, expect, it } from 'vitest';
import { buildExerciseHistory, calculateEstimatedOneRepMax } from '../lib/exercise-history';
import type { Exercise } from '../lib/workouts';
import type { WorkoutSet } from '../lib/workout-sessions';

function createSet(overrides: Partial<WorkoutSet>): WorkoutSet {
    return {
        id: 'set-1',
        user_id: 'user-1',
        client_id: 'client-1',
        workout_session_id: 'session-1',
        planned_exercise_id: null,
        exercise_id: 'exercise-1',
        set_number: 1,
        set_type: 'working',
        weight_kg: 100,
        reps: 10,
        rpe: null,
        completed: true,
        notes: null,
        sync_status: 'synced',
        version: 1,
        deleted_at: null,
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
        ...overrides,
    };
}

const exercises: Exercise[] = [
    {
        id: 'exercise-1',
        user_id: 'user-1',
        client_id: 'client-exercise-1',
        name: 'Bench Press',
        muscle_group: 'Chest',
        equipment: 'Barbell',
        notes: null,
        sync_status: 'synced',
        version: 1,
        deleted_at: null,
        created_at: '2026-01-01T12:00:00.000Z',
        updated_at: '2026-01-01T12:00:00.000Z',
    },
];

describe('exercise history utilities', () => {
    it('calculates estimated one rep max', () => {
        expect(calculateEstimatedOneRepMax(100, 10)).toBe(133.3);
    });

    it('groups completed sets by exercise', () => {
        const history = buildExerciseHistory({
            sets: [
                createSet({
                    id: 'set-1',
                    weight_kg: 100,
                    reps: 10,
                    created_at: '2026-01-01T12:00:00.000Z',
                }),
                createSet({
                    id: 'set-2',
                    weight_kg: 110,
                    reps: 8,
                    created_at: '2026-01-02T12:00:00.000Z',
                }),
            ],
            exercises,
            unit: 'kg',
        });

        expect(history).toHaveLength(1);
        expect(history[0].exerciseName).toBe('Bench Press');
        expect(history[0].totalSets).toBe(2);
        expect(history[0].latestSet?.id).toBe('set-2');
        expect(history[0].bestWeightSet?.weight).toBe(110);
    });

    it('ignores deleted and incomplete sets', () => {
        const history = buildExerciseHistory({
            sets: [
                createSet({
                    id: 'set-1',
                    completed: false,
                }),
                createSet({
                    id: 'set-2',
                    deleted_at: '2026-01-02T12:00:00.000Z',
                }),
            ],
            exercises,
            unit: 'kg',
        });

        expect(history).toHaveLength(0);
    });
});