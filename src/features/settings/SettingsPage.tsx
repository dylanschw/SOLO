import { LogOut, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WeightUnit } from '../../lib/supabase/types'
import { signOut } from '../auth/lib/auth-client'
import { useAuth } from '../auth/hooks/useAuth'
import { useGoalTargets, useUpsertGoalTarget } from '../goals/hooks/useGoals'
import { findGoalTarget } from '../goals/lib/goals'
import { useProfile, useUpdateProfile } from '../profile/hooks/useProfile'
import { applyTheme } from '../../lib/utils/theme'

type AppearanceSwitchProps = {
  value: 'light' | 'dark'
  onChange: (value: 'light' | 'dark') => void
  disabled?: boolean
}

function AppearanceSwitch({ value, onChange, disabled }: AppearanceSwitchProps) {
  const isDark = value === 'dark'

  return (
    <button
      type="button"
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      disabled={disabled}
      className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950"
      aria-label="Toggle appearance"
    >
      <span className="px-3 text-sm font-semibold text-stone-700 dark:text-stone-200">
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>

      <span
        className={`relative h-10 w-20 rounded-full p-1 transition ${isDark ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-neutral-700'
          }`}
      >
        <span
          className={`absolute top-1 grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold text-stone-900 shadow-sm transition ${isDark ? 'left-11' : 'left-1'
            }`}
        >
          {isDark ? 'D' : 'L'}
        </span>
      </span>
    </button>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const profileQuery = useProfile()
  const updateProfile = useUpdateProfile()
  const goalsQuery = useGoalTargets()
  const upsertGoalTarget = useUpsertGoalTarget()

  const [fullName, setFullName] = useState('')
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<WeightUnit>('lb')
  const [themePreference, setThemePreference] = useState<'light' | 'dark'>('light')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [bodyweightGoal, setBodyweightGoal] = useState('')
  const [calorieGoal, setCalorieGoal] = useState('')
  const [proteinGoal, setProteinGoal] = useState('')
  const [workoutGoal, setWorkoutGoal] = useState('4')
  const [waterGoal, setWaterGoal] = useState('3000')
  const [sleepGoal, setSleepGoal] = useState('8')
  const [stepsGoal, setStepsGoal] = useState('8000')
  const [restingHeartRateGoal, setRestingHeartRateGoal] = useState('')

  const profile = profileQuery.data
  const goalTargets = goalsQuery.data ?? []

  useEffect(() => {
    if (!profile) {
      return
    }

    setFullName(profile.full_name ?? '')
    setPreferredWeightUnit(profile.preferred_weight_unit)
    const savedTheme = profile.theme_preference === 'dark' ? 'dark' : 'light'

    setThemePreference(savedTheme)
    applyTheme(savedTheme)
  }, [profile])

  useEffect(() => {
    if (!goalsQuery.data) {
      return
    }

    const bodyweight = findGoalTarget(goalTargets, 'bodyweight')
    const calories = findGoalTarget(goalTargets, 'calories')
    const protein = findGoalTarget(goalTargets, 'protein')
    const workouts = findGoalTarget(goalTargets, 'workouts_per_week')
    const water = findGoalTarget(goalTargets, 'water')
    const sleep = findGoalTarget(goalTargets, 'sleep')
    const steps = findGoalTarget(goalTargets, 'steps')
    const restingHeartRate = findGoalTarget(goalTargets, 'resting_heart_rate')

    setBodyweightGoal(bodyweight ? String(bodyweight.target_value) : '')
    setCalorieGoal(calories ? String(calories.target_value) : '')
    setProteinGoal(protein ? String(protein.target_value) : '')
    setWorkoutGoal(workouts ? String(workouts.target_value) : '4')
    setWaterGoal(water ? String(water.target_value) : '3000')
    setSleepGoal(sleep ? String(sleep.target_value) : '8')
    setStepsGoal(steps ? String(steps.target_value) : '8000')
    setRestingHeartRateGoal(restingHeartRate ? String(restingHeartRate.target_value) : '')
  }, [goalsQuery.data, goalTargets])

  function parseGoalValue(value: string) {
    const parsed = Number(value)

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }

  async function handleSaveGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    const goals = [
      {
        metric: 'bodyweight' as const,
        value: parseGoalValue(bodyweightGoal),
        unit: preferredWeightUnit,
        period: 'target' as const
      },
      {
        metric: 'calories' as const,
        value: parseGoalValue(calorieGoal),
        unit: 'kcal',
        period: 'daily' as const
      },
      {
        metric: 'protein' as const,
        value: parseGoalValue(proteinGoal),
        unit: 'g',
        period: 'daily' as const
      },
      {
        metric: 'workouts_per_week' as const,
        value: parseGoalValue(workoutGoal),
        unit: 'workouts',
        period: 'weekly' as const
      },
      {
        metric: 'water' as const,
        value: parseGoalValue(waterGoal),
        unit: 'ml',
        period: 'daily' as const
      },
      {
        metric: 'sleep' as const,
        value: parseGoalValue(sleepGoal),
        unit: 'hours',
        period: 'daily' as const
      },
      {
        metric: 'steps' as const,
        value: parseGoalValue(stepsGoal),
        unit: 'steps',
        period: 'daily' as const
      },
      {
        metric: 'resting_heart_rate' as const,
        value: parseGoalValue(restingHeartRateGoal),
        unit: 'bpm',
        period: 'daily' as const
      }
    ].filter((goal) => goal.value !== null && goal.value > 0)

    try {
      for (const goal of goals) {
        await upsertGoalTarget.mutateAsync({
          metric: goal.metric,
          targetValue: goal.value ?? 0,
          unit: goal.unit,
          period: goal.period
        })
      }

      setStatusMessage('Goals saved.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save goals.')
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim() || null,
        preferred_weight_unit: preferredWeightUnit,
        theme_preference: themePreference
      })

      setStatusMessage('Settings saved.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save settings.')
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Control center</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>

      <div className="mt-6 grid gap-4">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-xl font-bold">Account</h2>
          <p className="mt-2 break-words text-sm leading-6 text-stone-600 dark:text-stone-300">
            Signed in as {user?.email}
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </article>

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <h2 className="text-xl font-bold">Profile preferences</h2>

          {profileQuery.isLoading ? (
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Loading profile...</p>
          ) : null}

          {profileQuery.error ? (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
              Could not load profile.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="John Smith"
                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Weight unit</span>
              <select
                value={preferredWeightUnit}
                onChange={(event) => setPreferredWeightUnit(event.target.value as WeightUnit)}
                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              >
                <option value="lb">Pounds</option>
                <option value="kg">Kilograms</option>
              </select>
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-semibold">Appearance</span>
              <AppearanceSwitch
                value={themePreference}
                disabled={updateProfile.isPending}
                onChange={async (nextTheme) => {
                  const previousTheme = themePreference

                  setThemePreference(nextTheme)
                  applyTheme(nextTheme)
                  setStatusMessage(null)
                  setErrorMessage(null)

                  try {
                    await updateProfile.mutateAsync({
                      theme_preference: nextTheme
                    })

                    setStatusMessage('Appearance updated.')
                  } catch (error) {
                    setThemePreference(previousTheme)
                    applyTheme(previousTheme)
                    setErrorMessage(error instanceof Error ? error.message : 'Could not update appearance.')
                  }
                }}
              />
              <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
                This preference is saved to your profile and used across the app.
              </p>
            </div>

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="size-4" />
              {updateProfile.isPending ? 'Saving...' : 'Save settings'}
            </button>
          </div>

          {statusMessage ? (
            <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
              {statusMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
              {errorMessage}
            </p>
          ) : null}
        </form>

        <form
          onSubmit={handleSaveGoals}
          className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <h2 className="text-xl font-bold">Goal targets</h2>

          {goalsQuery.isLoading ? (
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Loading goals...</p>
          ) : null}

          <div className="mt-5 grid gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Bodyweight target ({preferredWeightUnit})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={bodyweightGoal}
                  onChange={(event) => setBodyweightGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Calories/day</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={calorieGoal}
                  onChange={(event) => setCalorieGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Protein/day (g)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={proteinGoal}
                  onChange={(event) => setProteinGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Workouts/week</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={workoutGoal}
                  onChange={(event) => setWorkoutGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Water/day (ml)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={waterGoal}
                  onChange={(event) => setWaterGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Sleep/night (hours)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  value={sleepGoal}
                  onChange={(event) => setSleepGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Steps/day</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={stepsGoal}
                  onChange={(event) => setStepsGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Resting heart rate target</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={restingHeartRateGoal}
                  onChange={(event) => setRestingHeartRateGoal(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={upsertGoalTarget.isPending}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="size-4" />
              {upsertGoalTarget.isPending ? 'Saving...' : 'Save goals'}
            </button>
          </div>
        </form>

      </div>
    </section>
  )
}
