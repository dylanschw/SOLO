import { Activity, Apple, Dumbbell, Scale } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useNutritionLogs, useActiveNutritionTarget } from '../nutrition/hooks/useNutrition'
import { getTodayNutritionLog, summarizeNutrition } from '../nutrition/lib/nutrition-stats'
import { useProfile } from '../profile/hooks/useProfile'
import { useActiveWorkoutProgram } from '../workouts/hooks/useWorkouts'

function getDisplayName(email: string | undefined, fullName: string | null | undefined) {
  if (fullName) {
    return fullName
  }

  if (email) {
    return email.split('@')[0]
  }

  return 'there'
}

export function DashboardPage() {
  const { user } = useAuth()
  const profileQuery = useProfile()
  const logsQuery = useNutritionLogs()
  const targetQuery = useActiveNutritionTarget()
  const activeProgramQuery = useActiveWorkoutProgram()

  const profile = profileQuery.data
  const displayName = getDisplayName(user?.email, profile?.full_name)
  const todayLog = getTodayNutritionLog(logsQuery.data ?? [])
  const nutritionSummary = summarizeNutrition(todayLog, targetQuery.data ?? null)
  const activeProgram = activeProgramQuery.data

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Today</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome, {displayName}</h1>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 text-stone-950 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-stone-50">
        <p className="text-sm font-medium opacity-70">Profile connected</p>
        <p className="mt-2 text-xl font-bold">
          Preferred unit: {profile?.preferred_weight_unit ?? 'loading...'}
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Dumbbell className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Training</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">
            {activeProgram ? activeProgram.name : 'No active program yet'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            {activeProgram
              ? `${activeProgram.rotation_length_days} day rotation is active.`
              : 'Create a workout program and set it active from the Train tab.'}
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Apple className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Nutrition</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">
            {nutritionSummary.mealCount} meals today
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            {nutritionSummary.calories} calories and {nutritionSummary.proteinG}g protein logged.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
              <p className="text-xs text-stone-500 dark:text-stone-400">Calories</p>
              <p className="mt-1 text-lg font-bold">{nutritionSummary.calorieProgress}%</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
              <p className="text-xs text-stone-500 dark:text-stone-400">Protein</p>
              <p className="mt-1 text-lg font-bold">{nutritionSummary.proteinProgress}%</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Scale className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Bodyweight</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">Bodyweight tracking is active</h2>

        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Activity className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Consistency</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">No weekly data yet</h2>

        </article>
      </div>
    </section>
  )
}