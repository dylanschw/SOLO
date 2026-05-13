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