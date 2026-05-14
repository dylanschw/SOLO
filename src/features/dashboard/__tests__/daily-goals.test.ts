import { describe, expect, it } from 'vitest';
import { buildDailyGoalSummary, findLogForDate } from '../lib/daily-goals';

describe('daily goal calculator', () => {
    it('calculates calories and protein remaining', () => {
        const summary = buildDailyGoalSummary({
            today: '2026-05-13',
            preferredUnit: 'lb',
            todayNutritionLog: {
                log_date: '2026-05-13',
                calories: 2200,
                protein_g: 140,
                meal_count: 3
            },
            nutritionTarget: {
                target_calories: 3200,
                target_protein_g: 180
            },
            workoutSessions: [],
            bodyweightEntries: []
        });

        expect(summary.caloriesLeft).toBe(1000);
        expect(summary.proteinLeft).toBe(40);
        expect(summary.mealsLogged).toBe(3);
    });

    it('calculates weekly workout progress', () => {
        const summary = buildDailyGoalSummary({
            today: '2026-05-13',
            preferredUnit: 'lb',
            todayNutritionLog: null,
            nutritionTarget: null,
            workoutSessions: [
                {
                    session_date: '2026-05-12',
                    status: 'completed'
                },
                {
                    session_date: '2026-05-11',
                    status: 'completed'
                },
                {
                    session_date: '2026-05-01',
                    status: 'completed'
                }
            ],
            bodyweightEntries: [],
            weeklyWorkoutTarget: 4
        });

        expect(summary.workoutsCompletedThisWeek).toBe(2);
        expect(summary.workoutsRemainingThisWeek).toBe(2);
    });

    it('uses saved goal targets for dashboard calculations', () => {
        const summary = buildDailyGoalSummary({
            today: '2026-05-13',
            preferredUnit: 'lb',
            todayNutritionLog: {
                log_date: '2026-05-13',
                calories: 2000,
                protein_g: 100,
                meal_count: 2
            },
            nutritionTarget: {
                calories: 3200,
                protein_g: 180
            },
            workoutSessions: [
                {
                    session_date: '2026-05-13',
                    status: 'completed'
                }
            ],
            bodyweightEntries: [],
            goalTargets: [
                {
                    metric: 'calories',
                    target_value: 2800,
                    is_active: true,
                    deleted_at: null
                },
                {
                    metric: 'workouts_per_week',
                    target_value: 3,
                    is_active: true,
                    deleted_at: null
                }
            ]
        });

        expect(summary.calorieTarget).toBe(2800);
        expect(summary.weeklyWorkoutTarget).toBe(3);
        expect(summary.workoutsRemainingThisWeek).toBe(2);
    });

    it('adds health metric goal actions when health data is available', () => {
        const summary = buildDailyGoalSummary({
            today: '2026-05-13',
            preferredUnit: 'lb',
            todayNutritionLog: null,
            nutritionTarget: null,
            workoutSessions: [],
            bodyweightEntries: [],
            goalTargets: [
                {
                    metric: 'steps',
                    target_value: 8000,
                    is_active: true,
                    deleted_at: null
                }
            ],
            healthMetricEntries: [
                {
                    metric_type: 'steps',
                    metric_date: '2026-05-13',
                    value: 5000,
                    deleted_at: null
                }
            ]
        });

        expect(summary.actions.some((action) => action.title === '3000 steps left')).toBe(true);
    });

    it('finds today nutrition log', () => {
        const log = findLogForDate(
            [
                {
                    log_date: '2026-05-12',
                    calories: 1000
                },
                {
                    log_date: '2026-05-13',
                    calories: 2000
                }
            ],
            '2026-05-13'
        );

        expect(log).toMatchObject({
            calories: 2000
        });
    });
});
