import type { WeightUnit } from '../../../lib/supabase/types';
import { convertWeight, roundToOneDecimal } from '../../../lib/utils/units';

export type DailyGoalAction = {
    title: string;
    description: string;
    status: 'good' | 'warning' | 'neutral';
};

export type DailyGoalSummary = {
    caloriesLogged: number | null;
    calorieTarget: number | null;
    caloriesLeft: number | null;
    proteinLogged: number | null;
    proteinTarget: number | null;
    proteinLeft: number | null;
    mealsLogged: number | null;
    workoutsCompletedThisWeek: number;
    workoutsRemainingThisWeek: number;
    latestBodyweight: number | null;
    weeklyAverageBodyweight: number | null;
    weightTrendLabel: string;
    actions: DailyGoalAction[];
};

function getNumberField(source: unknown, fieldNames: string[]) {
    const record = source as Record<string, unknown> | null | undefined;

    if (!record) {
        return null;
    }

    for (const fieldName of fieldNames) {
        const value = record[fieldName];

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string' && value.trim()) {
            const parsed = Number(value);

            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }

    return null;
}

function getTextField(source: unknown, fieldNames: string[]) {
    const record = source as Record<string, unknown> | null | undefined;

    if (!record) {
        return null;
    }

    for (const fieldName of fieldNames) {
        const value = record[fieldName];

        if (typeof value === 'string' && value.trim()) {
            return value;
        }
    }

    return null;
}

function getDateTime(value: string | null) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isFinite(date.getTime()) ? date.getTime() : null;
}

function getBodyweightInPreferredUnit(entry: unknown, preferredUnit: WeightUnit) {
    const weightKg = getNumberField(entry, ['weight_kg']);

    if (weightKg !== null) {
        return roundToOneDecimal(convertWeight(weightKg, 'kg', preferredUnit));
    }

    return getNumberField(entry, ['weight', 'bodyweight']);
}

function buildWeightTrendLabel(entries: unknown[], preferredUnit: WeightUnit) {
    const sortedEntries = entries
        .slice()
        .sort((a, b) => {
            const dateA = getDateTime(getTextField(a, ['entry_date', 'date', 'created_at'])) ?? 0;
            const dateB = getDateTime(getTextField(b, ['entry_date', 'date', 'created_at'])) ?? 0;

            return dateB - dateA;
        });

    const latest = sortedEntries[0] ? getBodyweightInPreferredUnit(sortedEntries[0], preferredUnit) : null;
    const previous = sortedEntries[1] ? getBodyweightInPreferredUnit(sortedEntries[1], preferredUnit) : null;

    if (latest === null || previous === null) {
        return 'Add more weigh-ins to see your trend.';
    }

    const difference = roundToOneDecimal(latest - previous);

    if (difference > 0) {
        return `Up ${difference} ${preferredUnit} from your last weigh-in.`;
    }

    if (difference < 0) {
        return `Down ${Math.abs(difference)} ${preferredUnit} from your last weigh-in.`;
    }

    return 'No change from your last weigh-in.';
}

function getWeeklyAverage(entries: unknown[], preferredUnit: WeightUnit, today: string) {
    const todayTime = new Date(`${today}T12:00:00`).getTime();
    const sevenDaysAgo = todayTime - 1000 * 60 * 60 * 24 * 7;

    const recentWeights = entries
        .filter((entry) => {
            const entryDate = getTextField(entry, ['entry_date', 'date', 'created_at']);
            const entryTime = getDateTime(entryDate);

            return entryTime !== null && entryTime >= sevenDaysAgo && entryTime <= todayTime + 1000 * 60 * 60 * 24;
        })
        .map((entry) => getBodyweightInPreferredUnit(entry, preferredUnit))
        .filter((value): value is number => value !== null);

    if (recentWeights.length === 0) {
        return null;
    }

    const average = recentWeights.reduce((sum, value) => sum + value, 0) / recentWeights.length;

    return roundToOneDecimal(average);
}

function getCompletedWorkoutsThisWeek(workoutSessions: unknown[], today: string) {
    const todayTime = new Date(`${today}T12:00:00`).getTime();
    const sevenDaysAgo = todayTime - 1000 * 60 * 60 * 24 * 7;

    return workoutSessions.filter((session) => {
        const status = getTextField(session, ['status']);
        const sessionDate = getTextField(session, ['session_date', 'date', 'created_at']);
        const sessionTime = getDateTime(sessionDate);

        return status === 'completed' && sessionTime !== null && sessionTime >= sevenDaysAgo;
    }).length;
}

export function buildDailyGoalSummary(input: {
    today: string;
    preferredUnit: WeightUnit;
    todayNutritionLog: unknown | null;
    nutritionTarget: unknown | null;
    workoutSessions: unknown[];
    bodyweightEntries: unknown[];
    weeklyWorkoutTarget?: number;
}): DailyGoalSummary {
    const weeklyWorkoutTarget = input.weeklyWorkoutTarget ?? 4;

    const caloriesLogged = getNumberField(input.todayNutritionLog, [
        'calories',
        'total_calories',
        'calories_logged'
    ]);

    const calorieTarget = getNumberField(input.nutritionTarget, [
        'calories',
        'target_calories',
        'daily_calories',
        'calorie_target'
    ]);

    const proteinLogged = getNumberField(input.todayNutritionLog, [
        'protein_g',
        'protein',
        'protein_grams',
        'total_protein_g'
    ]);

    const proteinTarget = getNumberField(input.nutritionTarget, [
        'protein_g',
        'target_protein_g',
        'protein',
        'protein_grams'
    ]);

    const mealsLogged = getNumberField(input.todayNutritionLog, ['meal_count', 'meals']);

    const caloriesLeft =
        caloriesLogged !== null && calorieTarget !== null ? Math.max(0, Math.round(calorieTarget - caloriesLogged)) : null;

    const proteinLeft =
        proteinLogged !== null && proteinTarget !== null ? Math.max(0, Math.round(proteinTarget - proteinLogged)) : null;

    const workoutsCompletedThisWeek = getCompletedWorkoutsThisWeek(input.workoutSessions, input.today);
    const workoutsRemainingThisWeek = Math.max(0, weeklyWorkoutTarget - workoutsCompletedThisWeek);

    const latestBodyweight = input.bodyweightEntries[0]
        ? getBodyweightInPreferredUnit(input.bodyweightEntries[0], input.preferredUnit)
        : null;

    const weeklyAverageBodyweight = getWeeklyAverage(input.bodyweightEntries, input.preferredUnit, input.today);
    const weightTrendLabel = buildWeightTrendLabel(input.bodyweightEntries, input.preferredUnit);

    const actions: DailyGoalAction[] = [];

    if (caloriesLeft !== null) {
        actions.push({
            title: caloriesLeft === 0 ? 'Calories are on track' : `${caloriesLeft} calories left`,
            description:
                caloriesLeft === 0
                    ? 'You have reached your calorie target for today.'
                    : 'Eat enough today to stay on pace with your weight gain goal.',
            status: caloriesLeft === 0 ? 'good' : 'warning'
        });
    }

    if (proteinLeft !== null) {
        actions.push({
            title: proteinLeft === 0 ? 'Protein is on track' : `${proteinLeft}g protein left`,
            description:
                proteinLeft === 0
                    ? 'You have reached your protein target for today.'
                    : 'Add a protein-heavy meal, shake, or snack.',
            status: proteinLeft === 0 ? 'good' : 'warning'
        });
    }

    actions.push({
        title:
            workoutsRemainingThisWeek === 0
                ? 'Weekly workouts complete'
                : `${workoutsRemainingThisWeek} workouts left this week`,
        description:
            workoutsRemainingThisWeek === 0
                ? 'You have hit your weekly training target.'
                : 'Complete the remaining sessions to stay consistent.',
        status: workoutsRemainingThisWeek === 0 ? 'good' : 'neutral'
    });

    if (latestBodyweight === null) {
        actions.push({
            title: 'Add bodyweight',
            description: 'Log your weight to track your gaining pace.',
            status: 'neutral'
        });
    }

    return {
        caloriesLogged,
        calorieTarget,
        caloriesLeft,
        proteinLogged,
        proteinTarget,
        proteinLeft,
        mealsLogged,
        workoutsCompletedThisWeek,
        workoutsRemainingThisWeek,
        latestBodyweight,
        weeklyAverageBodyweight,
        weightTrendLabel,
        actions
    };
}

export function findLogForDate(logs: unknown[], today: string) {
    return (
        logs.find((log) => {
            const logDate = getTextField(log, ['log_date', 'entry_date', 'date']);

            return logDate === today;
        }) ?? null
    );
}