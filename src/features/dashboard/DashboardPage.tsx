import {
  Activity,
  Apple,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Scale,
  Target,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { useBodyweightEntries } from '../bodyweight/hooks/useBodyweightEntries';
import { calculateWeeklyAverage, formatBodyweight } from '../bodyweight/lib/bodyweight-stats';
import { useNutritionLogs, useActiveNutritionTarget } from '../nutrition/hooks/useNutrition';
import { useProfile } from '../profile/hooks/useProfile';
import { useActiveWorkoutProgram, useWorkoutDays } from '../workouts/hooks/useWorkouts';
import { useWorkoutSessions } from '../workouts/hooks/useWorkoutSessions';

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDisplayName(email: string | undefined, fullName: string | null | undefined) {
  if (fullName?.trim()) {
    return fullName.trim();
  }

  if (!email) {
    return 'there';
  }

  return email.split('@')[0];
}

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

function formatPercent(value: number | null, target: number | null) {
  if (!value || !target || target <= 0) {
    return '--';
  }

  return `${Math.round((value / target) * 100)}%`;
}

function formatMaybeNumber(value: number | null, suffix = '') {
  if (value === null) {
    return '--';
  }

  return `${Math.round(value)}${suffix}`;
}

function formatSessionTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const activeProgramQuery = useActiveWorkoutProgram();
  const sessionsQuery = useWorkoutSessions();
  const nutritionLogsQuery = useNutritionLogs();
  const nutritionTargetQuery = useActiveNutritionTarget();
  const bodyweightEntriesQuery = useBodyweightEntries();

  const profile = profileQuery.data;
  const activeProgram = activeProgramQuery.data;
  const workoutDaysQuery = useWorkoutDays(activeProgram?.id ?? null);

  const preferredUnit = profile?.preferred_weight_unit ?? 'lb';
  const displayName = getDisplayName(user?.email, profile?.full_name);
  const today = todayDate();

  const workoutSessions = sessionsQuery.data ?? [];
  const workoutDays = workoutDaysQuery.data ?? [];
  const nutritionLogs = nutritionLogsQuery.data ?? [];
  const nutritionTarget = nutritionTargetQuery.data ?? null;
  const bodyweightEntries = bodyweightEntriesQuery.data ?? [];

  const inProgressWorkout =
    workoutSessions.find((session) => session.status === 'in_progress') ?? null;

  const todayWorkout =
    workoutSessions.find((session) => session.session_date === today) ?? null;

  const lastCompletedWorkout =
    workoutSessions.find((session) => session.status === 'completed') ?? null;

  const todayNutritionLog =
    nutritionLogs.find((log) => getTextField(log, ['log_date', 'entry_date', 'date']) === today) ??
    null;

  const todayCalories = getNumberField(todayNutritionLog, ['calories', 'total_calories']);
  const todayProtein = getNumberField(todayNutritionLog, [
    'protein_g',
    'protein',
    'protein_grams',
    'total_protein_g'
  ]);
  const todayMealCount = getNumberField(todayNutritionLog, ['meal_count', 'meals']);

  const targetCalories = getNumberField(nutritionTarget, [
    'calories',
    'target_calories',
    'daily_calories',
    'calorie_target'
  ]);
  const targetProtein = getNumberField(nutritionTarget, [
    'protein_g',
    'target_protein_g',
    'protein',
    'protein_grams'
  ]);

  const latestBodyweightEntry = bodyweightEntries[0] ?? null;
  const weeklyAverage = calculateWeeklyAverage(bodyweightEntries, preferredUnit);

  const completedThisWeek = workoutSessions.filter((session) => {
    if (session.status !== 'completed') {
      return false;
    }

    const sessionTime = new Date(session.session_date).getTime();
    const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;

    return sessionTime >= sevenDaysAgo;
  }).length;

  const workoutStatus = inProgressWorkout
    ? 'Workout in progress'
    : todayWorkout
      ? todayWorkout.status.replaceAll('_', ' ')
      : 'No workout logged today';

  const workoutStatusLink = inProgressWorkout
    ? `/app/workouts/session/${inProgressWorkout.id}`
    : '/app/workouts';

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Dashboard</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, {displayName}</h1>

      <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Today</p>
            <h2 className="mt-1 text-2xl font-bold">
              {inProgressWorkout ? 'Resume your workout' : 'Ready when you are'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
              {inProgressWorkout
                ? 'You have an active workout session waiting.'
                : 'Training, food, and weight are connected here.'}
            </p>
          </div>

          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Activity className="size-6" />
          </div>
        </div>

        <Link
          to={workoutStatusLink}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {inProgressWorkout ? 'Resume workout' : 'Go to workouts'}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Training</p>
            <Dumbbell className="size-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{workoutStatus}</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {activeProgram ? activeProgram.name : 'No active program'}
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Weekly training</p>
            <CalendarDays className="size-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{completedThisWeek}</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            completed workouts in the last 7 days
          </p>
        </article>
      </div>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Food today</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {todayNutritionLog ? `${todayMealCount ?? 0} meals logged` : 'No food log yet'}
            </p>
          </div>
          <Apple className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Calories</p>
              <Flame className="size-4 text-orange-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{formatMaybeNumber(todayCalories)}</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {formatPercent(todayCalories, targetCalories)} of target
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Protein</p>
              <Target className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold">{formatMaybeNumber(todayProtein, 'g')}</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {formatPercent(todayProtein, targetProtein)} of target
            </p>
          </div>
        </div>

        <Link
          to="/app/nutrition"
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          Open food
          <ChevronRight className="size-4" />
        </Link>
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Bodyweight</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Preferred unit: {preferredUnit}
            </p>
          </div>
          <Scale className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Latest</p>
            <p className="mt-2 text-2xl font-bold">
              {latestBodyweightEntry
                ? `${formatBodyweight(latestBodyweightEntry, preferredUnit)} ${preferredUnit}`
                : '--'}
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Weekly average</p>
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {weeklyAverage === null ? '--' : `${weeklyAverage} ${preferredUnit}`}
            </p>
          </div>
        </div>

        <Link
          to="/app/bodyweight"
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          Open weight
          <ChevronRight className="size-4" />
        </Link>
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-xl font-bold">Program snapshot</h2>

        <div className="mt-4 grid gap-3">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">Active program</span>
            <span className="text-right text-sm font-bold">
              {activeProgram ? activeProgram.name : 'None'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">Workout days</span>
            <span className="text-sm font-bold">{workoutDays.length}</span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">Last completed</span>
            <span className="text-right text-sm font-bold">
              {lastCompletedWorkout
                ? `${lastCompletedWorkout.session_date}${formatSessionTime(lastCompletedWorkout.completed_at)
                  ? ` at ${formatSessionTime(lastCompletedWorkout.completed_at)}`
                  : ''
                }`
                : 'None yet'}
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}