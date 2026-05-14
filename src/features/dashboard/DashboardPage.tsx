import {
  Activity,
  Apple,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Brain,
  HeartPulse,
  ListChecks,
  Scale,
  Target,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivityHeatmap } from '../../components/ui/ActivityHeatmap';
import { useAuth } from '../auth/hooks/useAuth';
import { useBodyweightEntries } from '../bodyweight/hooks/useBodyweightEntries';
import { buildCoachWeeklySummary } from '../coach/lib/coach-insights';
import { useGoalTargets } from '../goals/hooks/useGoals';
import { useHealthMetricEntries } from '../health/hooks/useHealthMetrics';
import { getLatestHealthMetric } from '../health/lib/health-metrics';
import { useNutritionLogs, useActiveNutritionTarget } from '../nutrition/hooks/useNutrition';
import { useProfile } from '../profile/hooks/useProfile';
import { useDailyTasks, useDailyWellnessEntries } from '../scheduling/hooks/useScheduling';
import { useActiveWorkoutProgram, useWorkoutDays } from '../workouts/hooks/useWorkouts';
import { useWorkoutSessions } from '../workouts/hooks/useWorkoutSessions';
import {
  buildActivityHeatmap,
  calculateActivityHeatmapStats,
  combineActivityCounts,
  countActivityByDate,
  getActivityHeatmapRangeConfig,
  type ActivityHeatmapRange
} from './lib/activity-heatmap';
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

type DashboardHeatmapSourceId =
  | 'overall'
  | 'workouts'
  | 'scheduling'
  | 'bodyweight'
  | 'nutrition'
  | 'water'
  | 'creatine'
  | 'sleep';

const heatmapRanges: Array<{ id: ActivityHeatmapRange; label: string }> = [
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'year', label: 'Year' }
];

function formatCoachRecommendation(label: string) {
  const labels: Record<string, string> = {
    keep_going: 'Keep going',
    increase_weight_carefully: 'Increase weight carefully',
    repeat_same_load: 'Repeat the same load',
    consider_rest_recovery: 'Consider rest or recovery',
    calories_are_behind_target: 'Calories are behind target',
    sleep_is_below_target: 'Sleep is below target'
  };

  return labels[label] ?? label.replaceAll('_', ' ');
}

export function DashboardPage() {
  const [heatmapSourceId, setHeatmapSourceId] = useState<DashboardHeatmapSourceId>('overall');
  const [heatmapRange, setHeatmapRange] = useState<ActivityHeatmapRange>('90d');
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
  const dailyWellnessEntriesQuery = useDailyWellnessEntries();

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
  const dailyWellnessEntries = dailyWellnessEntriesQuery.data ?? [];
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

  const workoutCounts = countActivityByDate(
    workoutSessions.filter((session) => session.status === 'completed'),
    (session) => session.session_date
  );
  const schedulingCounts = countActivityByDate(
    dailyTasks.filter((task) => task.status === 'completed'),
    (task) => task.task_date
  );
  const bodyweightCounts = countActivityByDate(bodyweightEntries, (entry) => entry.entry_date);
  const nutritionCounts = countActivityByDate(nutritionLogs, (log) => log.log_date);
  const waterCounts = countActivityByDate(
    dailyWellnessEntries.filter((entry) => entry.water_goal_ml > 0 && entry.water_logged_ml >= entry.water_goal_ml),
    (entry) => entry.entry_date
  );
  const creatineCounts = countActivityByDate(
    dailyWellnessEntries.filter((entry) => entry.creatine_completed),
    (entry) => entry.entry_date
  );
  const sleepCounts = countActivityByDate(
    healthMetricEntries.filter((entry) => entry.metric_type === 'sleep_hours'),
    (entry) => entry.metric_date
  );
  const overallCounts = combineActivityCounts([
    workoutCounts,
    schedulingCounts,
    bodyweightCounts,
    nutritionCounts,
    waterCounts,
    creatineCounts,
    sleepCounts
  ]);
  const heatmapSourceOptions: Array<{
    id: DashboardHeatmapSourceId;
    label: string;
    counts: Map<string, number>;
  }> = [
      { id: 'overall', label: 'Overall', counts: overallCounts },
      { id: 'workouts', label: 'Workouts', counts: workoutCounts },
      { id: 'scheduling', label: 'Schedule', counts: schedulingCounts },
      { id: 'bodyweight', label: 'Weight', counts: bodyweightCounts },
      { id: 'nutrition', label: 'Food', counts: nutritionCounts },
      { id: 'water', label: 'Water', counts: waterCounts },
      { id: 'creatine', label: 'Creatine', counts: creatineCounts },
      { id: 'sleep', label: 'Sleep', counts: sleepCounts }
    ];
  const selectedHeatmapSource = heatmapSourceOptions.find((source) => source.id === heatmapSourceId) ?? heatmapSourceOptions[0];
  const heatmapRangeConfig = getActivityHeatmapRangeConfig(heatmapRange, today);
  const selectedHeatmap = buildActivityHeatmap({
    endDate: today,
    weekCount: heatmapRangeConfig.weekCount,
    countsByDate: selectedHeatmapSource.counts
  });
  const selectedHeatmapStats = calculateActivityHeatmapStats({
    endDate: today,
    dayCount: heatmapRangeConfig.dayCount,
    countsByDate: selectedHeatmapSource.counts
  });
  const coachSummary = buildCoachWeeklySummary({
    today,
    workoutSessions,
    nutritionLogs,
    bodyweightEntries,
    healthMetricEntries,
    dailyTasks,
    goalTargets
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
              {selectedHeatmapSource.label} - {heatmapRangeConfig.label}
            </p>
          </div>
          <ListChecks className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {heatmapSourceOptions.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => setHeatmapSourceId(source.id)}
                className={`min-h-10 rounded-xl px-2 text-xs font-semibold transition ${heatmapSourceId === source.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 dark:bg-neutral-900 dark:text-stone-300 dark:hover:bg-neutral-800'
                  }`}
              >
                {source.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {heatmapRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setHeatmapRange(range.id)}
                className={`min-h-10 rounded-xl px-2 text-xs font-semibold transition ${heatmapRange === range.id
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 dark:bg-neutral-900 dark:text-stone-300 dark:hover:bg-neutral-800'
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
              <p className="text-xs text-stone-500 dark:text-stone-400">Current</p>
              <p className="font-bold">{selectedHeatmapStats.currentStreak}d</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
              <p className="text-xs text-stone-500 dark:text-stone-400">Longest</p>
              <p className="font-bold">{selectedHeatmapStats.longestStreak}d</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
              <p className="text-xs text-stone-500 dark:text-stone-400">Active days</p>
              <p className="font-bold">{selectedHeatmapStats.activeDays}</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
              <p className="text-xs text-stone-500 dark:text-stone-400">Completion</p>
              <p className="font-bold">{selectedHeatmapStats.completionPercentage}%</p>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
            <ActivityHeatmap weeks={selectedHeatmap} label={`${selectedHeatmapSource.label} consistency heatmap`} />
          </div>
        </div>
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Insights</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Simple weekly calculations, no external AI.
            </p>
          </div>
          <Brain className="size-5 text-emerald-600" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
            <p className="text-xs text-stone-500 dark:text-stone-400">Training</p>
            <p className="font-bold">{coachSummary.trainingConsistencyScore}%</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
            <p className="text-xs text-stone-500 dark:text-stone-400">Nutrition</p>
            <p className="font-bold">{coachSummary.nutritionConsistencyScore}%</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
            <p className="text-xs text-stone-500 dark:text-stone-400">Schedule</p>
            <p className="font-bold">{coachSummary.schedulingConsistencyScore}%</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
            <p className="text-xs text-stone-500 dark:text-stone-400">Sleep</p>
            <p className="font-bold">
              {coachSummary.sleepConsistencyScore === null ? '--' : `${coachSummary.sleepConsistencyScore}%`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {coachSummary.recommendations.slice(0, 3).map((recommendation) => (
            <p
              key={recommendation}
              className="rounded-xl bg-stone-50 p-3 text-sm font-semibold text-stone-700 dark:bg-neutral-900 dark:text-stone-200"
            >
              {formatCoachRecommendation(recommendation)}
            </p>
          ))}
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
            <span className="text-sm font-bold">{dailyGoals.weeklyWorkoutTarget} workouts</span>
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
