import {
  Activity,
  Apple,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  ListChecks,
  Scale,
  Target,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActivityHeatmap } from '../../components/ui/ActivityHeatmap';
import { useAuth } from '../auth/hooks/useAuth';
import { useBodyweightEntries } from '../bodyweight/hooks/useBodyweightEntries';
import { useGoalTargets } from '../goals/hooks/useGoals';
import { useHealthMetricEntries } from '../health/hooks/useHealthMetrics';
import { getLatestHealthMetric } from '../health/lib/health-metrics';
import { useNutritionLogs, useActiveNutritionTarget } from '../nutrition/hooks/useNutrition';
import { useProfile } from '../profile/hooks/useProfile';
import { useDailyTasks } from '../scheduling/hooks/useScheduling';
import { useActiveWorkoutProgram, useWorkoutDays } from '../workouts/hooks/useWorkouts';
import { useWorkoutSessions } from '../workouts/hooks/useWorkoutSessions';
import { buildActivityHeatmap, countActivityByDate } from './lib/activity-heatmap';
import { buildDailyGoalSummary, findLogForDate } from './lib/daily-goals';

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

function formatMaybeNumber(value: number | null, suffix = '') {
  if (value === null) {
    return '--';
  }

  return `${Math.round(value)}${suffix}`;
}

function formatBodyweightValue(value: number | null, unit: string) {
  if (value === null) {
    return '--';
  }

  return `${value} ${unit}`;
}

function formatHealthValue(value: number | null, unit: string) {
  if (value === null) {
    return '--';
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const activeProgramQuery = useActiveWorkoutProgram();
  const sessionsQuery = useWorkoutSessions();
  const nutritionLogsQuery = useNutritionLogs();
  const nutritionTargetQuery = useActiveNutritionTarget();
  const bodyweightEntriesQuery = useBodyweightEntries();
  const goalTargetsQuery = useGoalTargets();
  const healthMetricEntriesQuery = useHealthMetricEntries();
  const dailyTasksQuery = useDailyTasks();

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
  const goalTargets = goalTargetsQuery.data ?? [];
  const healthMetricEntries = healthMetricEntriesQuery.data ?? [];
  const dailyTasks = dailyTasksQuery.data ?? [];
  const latestSleep = getLatestHealthMetric(healthMetricEntries, 'sleep_hours');
  const latestSteps = getLatestHealthMetric(healthMetricEntries, 'steps');

  const todayNutritionLog = findLogForDate(nutritionLogs, today);

  const dailyGoals = buildDailyGoalSummary({
    today,
    preferredUnit,
    todayNutritionLog,
    nutritionTarget,
    workoutSessions,
    bodyweightEntries,
    goalTargets,
    healthMetricEntries,
    weeklyWorkoutTarget: 4
  });

  const workoutHeatmap = buildActivityHeatmap({
    endDate: today,
    weekCount: 12,
    countsByDate: countActivityByDate(
      workoutSessions.filter((session) => session.status === 'completed'),
      (session) => session.session_date
    )
  });

  const schedulingHeatmap = buildActivityHeatmap({
    endDate: today,
    weekCount: 12,
    countsByDate: countActivityByDate(
      dailyTasks.filter((task) => task.status === 'completed'),
      (task) => task.task_date
    )
  });

  const inProgressWorkout =
    workoutSessions.find((session) => session.status === 'in_progress') ?? null;

  const workoutStatusLink = inProgressWorkout
    ? `/app/workouts/session/${inProgressWorkout.id}`
    : '/app/workouts';

  const quickActions = [
    {
      title: inProgressWorkout ? 'Resume workout' : 'Start workout',
      to: workoutStatusLink,
      icon: Dumbbell
    },
    {
      title: 'Log food',
      to: '/app/nutrition',
      icon: Apple
    },
    {
      title: 'Add weight',
      to: '/app/bodyweight',
      icon: Scale
    },
    {
      title: 'Add past workout',
      to: '/app/workouts',
      icon: CalendarDays
    },
    {
      title: 'Scheduling',
      to: '/app/scheduling',
      icon: ListChecks
    },
    {
      title: 'Health',
      to: '/app/health',
      icon: HeartPulse
    }
  ];

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Dashboard</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, {displayName}</h1>

      <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Today</p>
            <h2 className="mt-1 text-2xl font-bold">
              {inProgressWorkout ? 'Resume your workout' : 'Daily goal check'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
              See what you need to do today to stay on pace with training, food, and weight gain.
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

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-xl font-bold">Quick actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.to}
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                <span>{action.title}</span>
                <Icon className="size-4" />
              </Link>
            );
          })}
        </div>
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Do this today</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Daily actions based on your current logs.
            </p>
          </div>
          <ListChecks className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid gap-3">
          {dailyGoals.actions.map((action) => (
            <div
              key={`${action.title}-${action.description}`}
              className={`rounded-xl p-4 ring-1 ${action.status === 'good'
                  ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900'
                  : action.status === 'warning'
                    ? 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900'
                    : 'bg-stone-50 text-stone-700 ring-stone-200 dark:bg-neutral-900 dark:text-stone-200 dark:ring-neutral-800'
                }`}
            >
              <p className="font-bold">{action.title}</p>
              <p className="mt-1 text-sm leading-6 opacity-90">{action.description}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Calories left</p>
            <Flame className="size-5 text-orange-500" />
          </div>
          <p className="mt-3 text-2xl font-bold">{formatMaybeNumber(dailyGoals.caloriesLeft)}</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {formatMaybeNumber(dailyGoals.caloriesLogged)} / {formatMaybeNumber(dailyGoals.calorieTarget)}
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Protein left</p>
            <Target className="size-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{formatMaybeNumber(dailyGoals.proteinLeft, 'g')}</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {formatMaybeNumber(dailyGoals.proteinLogged, 'g')} / {formatMaybeNumber(dailyGoals.proteinTarget, 'g')}
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Weekly workouts</p>
            <CalendarDays className="size-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">
            {dailyGoals.workoutsCompletedThisWeek}/{dailyGoals.weeklyWorkoutTarget}
          </p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {dailyGoals.workoutsRemainingThisWeek} remaining this week
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Meals today</p>
            <Apple className="size-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{dailyGoals.mealsLogged ?? '--'}</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            logged meals
          </p>
        </article>
      </div>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Bodyweight pace</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {dailyGoals.weightTrendLabel}
            </p>
          </div>
          <Scale className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Latest</p>
            <p className="mt-2 text-2xl font-bold">
              {formatBodyweightValue(dailyGoals.latestBodyweight, preferredUnit)}
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Weekly average</p>
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatBodyweightValue(dailyGoals.weeklyAverageBodyweight, preferredUnit)}
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Health snapshot</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Sleep, steps, heart rate, and manual health metrics.
            </p>
          </div>
          <HeartPulse className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Latest sleep</p>
            <p className="mt-2 text-2xl font-bold">
              {formatHealthValue(latestSleep ? Number(latestSleep.value) : null, latestSleep?.unit ?? 'hours')}
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Latest steps</p>
            <p className="mt-2 text-2xl font-bold">
              {formatHealthValue(latestSteps ? Number(latestSteps.value) : null, latestSteps?.unit ?? 'steps')}
            </p>
          </div>
        </div>

        <Link
          to="/app/health"
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          Open health
          <ChevronRight className="size-4" />
        </Link>
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Consistency</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Last 12 weeks
            </p>
          </div>
          <ListChecks className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid gap-4">
          <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
            <p className="mb-3 text-sm font-semibold text-stone-600 dark:text-stone-300">Workouts</p>
            <ActivityHeatmap weeks={workoutHeatmap} label="Workout consistency heatmap" />
          </div>

          <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
            <p className="mb-3 text-sm font-semibold text-stone-600 dark:text-stone-300">Scheduling</p>
            <ActivityHeatmap weeks={schedulingHeatmap} label="Scheduling consistency heatmap" />
          </div>
        </div>
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Training snapshot</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {activeProgram ? activeProgram.name : 'No active program'}
            </p>
          </div>
          <Dumbbell className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid gap-3">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">Workout days</span>
            <span className="text-sm font-bold">{workoutDays.length}</span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">Weekly target</span>
            <span className="text-sm font-bold">4 workouts</span>
          </div>
        </div>

        <Link
          to="/app/workouts"
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          Open workouts
          <ChevronRight className="size-4" />
        </Link>
      </article>
    </section>
  );
}
