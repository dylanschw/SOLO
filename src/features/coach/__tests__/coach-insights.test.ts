import { describe, expect, it } from 'vitest'
import { buildCoachWeeklySummary, detectStalledLift } from '../lib/coach-insights'

describe('coach insight calculations', () => {
    it('builds a weekly consistency summary without external AI calls', () => {
        const summary = buildCoachWeeklySummary({
            today: '2026-05-14',
            workoutSessions: [
                { session_date: '2026-05-12', status: 'completed' },
                { session_date: '2026-05-14', status: 'completed' },
            ],
            nutritionLogs: [
                { log_date: '2026-05-10', calories: 2500 },
                { log_date: '2026-05-11', protein_g: 180 },
                { log_date: '2026-05-12', meal_count: 3 },
            ],
            bodyweightEntries: [
                { entry_date: '2026-05-08', weight_kg: 80 },
                { entry_date: '2026-05-14', weight_kg: 80.5 },
            ],
            healthMetricEntries: [
                { metric_type: 'sleep_hours', metric_date: '2026-05-13', value: 6.5 },
                { metric_type: 'sleep_hours', metric_date: '2026-05-14', value: 7 },
            ],
            dailyTasks: [
                { task_date: '2026-05-14', status: 'completed' },
                { task_date: '2026-05-14', status: 'completed' },
            ],
            goalTargets: [
                { metric: 'workouts_per_week', target_value: 4, is_active: true, deleted_at: null },
                { metric: 'sleep', target_value: 8, is_active: true, deleted_at: null },
            ],
        })

        expect(summary.workoutsCompleted).toBe(2)
        expect(summary.trainingConsistencyScore).toBe(50)
        expect(summary.nutritionLoggedDays).toBe(3)
        expect(summary.averageSleepHours).toBe(6.8)
        expect(summary.bodyweightTrend).toBe('up')
        expect(summary.recommendations).toContain('sleep_is_below_target')
    })

    it('detects a stalled lift from recent best set scores', () => {
        const stalled = detectStalledLift(
            [
                { date: '2026-05-01', exerciseName: 'Bench Press', weight: 100, reps: 10 },
                { date: '2026-05-08', exerciseName: 'Bench Press', weight: 100, reps: 10 },
                { date: '2026-05-14', exerciseName: 'Bench Press', weight: 95, reps: 10 },
            ],
            'bench press'
        )

        expect(stalled.isStalled).toBe(true)
    })
})
