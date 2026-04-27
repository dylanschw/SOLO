import { Apple, Save, Target, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { NutritionGoalType } from '../../lib/supabase/types'
import { useProfile } from '../profile/hooks/useProfile'
import {
  calculateSuggestedNutritionTarget,
  getNutritionChartPoints,
  getTodayNutritionLog,
  summarizeNutrition
} from './lib/nutrition-stats'
import {
  useActiveNutritionTarget,
  useDeleteNutritionLog,
  useNutritionLogs,
  useUpsertNutritionLog,
  useUpsertNutritionTarget
} from './hooks/useNutrition'

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function optionalNumberFromInput(value: string) {
  if (!value.trim()) {
    return null
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return null
  }

  return numberValue
}

export function NutritionPage() {
  const profileQuery = useProfile()
  const logsQuery = useNutritionLogs()
  const targetQuery = useActiveNutritionTarget()
  const upsertLog = useUpsertNutritionLog()
  const deleteLog = useDeleteNutritionLog()
  const upsertTarget = useUpsertNutritionTarget()

  const logs = logsQuery.data ?? []
  const target = targetQuery.data ?? null
  const todayLog = useMemo(() => getTodayNutritionLog(logs), [logs])
  const summary = useMemo(() => summarizeNutrition(todayLog, target), [todayLog, target])
  const chartPoints = useMemo(() => getNutritionChartPoints(logs), [logs])

  const preferredUnit = profileQuery.data?.preferred_weight_unit ?? 'lb'

  const [logDate, setLogDate] = useState(getTodayDateInputValue())
  const [mealCount, setMealCount] = useState('0')
  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [notes, setNotes] = useState('')
  const [targetMode, setTargetMode] = useState<'manual' | 'calculated'>('manual')
  const [goalType, setGoalType] = useState<NutritionGoalType>('maintain_weight')
  const [targetBodyweight, setTargetBodyweight] = useState('')
  const [targetCalories, setTargetCalories] = useState(target?.calories?.toString() ?? '')
  const [targetProtein, setTargetProtein] = useState(target?.protein_g?.toString() ?? '')
  const [targetCarbs, setTargetCarbs] = useState(target?.carbs_g?.toString() ?? '')
  const [targetFat, setTargetFat] = useState(target?.fat_g?.toString() ?? '')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSaveLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)

    const mealCountValue = Number(mealCount)

    if (!Number.isInteger(mealCountValue) || mealCountValue < 0 || mealCountValue > 20) {
      setErrorMessage('Meal count must be a whole number between 0 and 20.')
      return
    }

    try {
      await upsertLog.mutateAsync({
        logDate,
        mealCount: mealCountValue,
        calories: optionalNumberFromInput(calories),
        proteinG: optionalNumberFromInput(proteinG),
        carbsG: optionalNumberFromInput(carbsG),
        fatG: optionalNumberFromInput(fatG),
        notes
      })

      setStatusMessage('Nutrition log saved.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save nutrition log.')
    }
  }

  async function handleSaveTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)

    let caloriesValue = optionalNumberFromInput(targetCalories)
    let proteinValue = optionalNumberFromInput(targetProtein)

    if (targetMode === 'calculated') {
      const bodyweightValue = Number(targetBodyweight)

      if (!Number.isFinite(bodyweightValue) || bodyweightValue <= 0) {
        setErrorMessage('Enter your bodyweight to calculate targets.')
        return
      }

      const calculated = calculateSuggestedNutritionTarget({
        bodyweight: bodyweightValue,
        unit: preferredUnit,
        goalType
      })

      caloriesValue = calculated.calories
      proteinValue = calculated.proteinG

      setTargetCalories(String(calculated.calories))
      setTargetProtein(String(calculated.proteinG))
    }

    if (!caloriesValue || caloriesValue < 800 || caloriesValue > 8000) {
      setErrorMessage('Calories target must be between 800 and 8000.')
      return
    }

    if (!proteinValue || proteinValue < 1 || proteinValue > 500) {
      setErrorMessage('Protein target must be between 1 and 500 grams.')
      return
    }

    try {
      await upsertTarget.mutateAsync({
        mode: targetMode,
        goalType,
        calories: caloriesValue,
        proteinG: proteinValue,
        carbsG: optionalNumberFromInput(targetCarbs),
        fatG: optionalNumberFromInput(targetFat)
      })

      setStatusMessage('Nutrition target saved.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save nutrition target.')
    }
  }

  async function handleDelete(logId: string) {
    await deleteLog.mutateAsync(logId)
  }

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Food</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Nutrition</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Meals today</p>
          <p className="mt-2 text-2xl font-bold">{summary.mealCount}</p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Calories</p>
          <p className="mt-2 text-2xl font-bold">{summary.calories}</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {summary.calorieTarget ? `${summary.calorieProgress}% of ${summary.calorieTarget}` : 'No target'}
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Protein</p>
          <p className="mt-2 text-2xl font-bold">{summary.proteinG}g</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {summary.proteinTarget ? `${summary.proteinProgress}% of ${summary.proteinTarget}g` : 'No target'}
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Logs</p>
          <p className="mt-2 text-2xl font-bold">{logs.length}</p>
        </article>
      </div>

      <form
        onSubmit={handleSaveLog}
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div className="flex items-center gap-3">
          <Apple className="size-5 text-emerald-600" />
          <h2 className="text-xl font-bold">Daily log</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Date</span>
            <input
              type="date"
              value={logDate}
              onChange={(event) => setLogDate(event.target.value)}
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Meal count</span>
            <input
              type="number"
              inputMode="numeric"
              value={mealCount}
              onChange={(event) => setMealCount(event.target.value)}
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Calories</span>
              <input
                type="number"
                inputMode="numeric"
                value={calories}
                onChange={(event) => setCalories(event.target.value)}
                placeholder="2500"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Protein</span>
              <input
                type="number"
                inputMode="numeric"
                value={proteinG}
                onChange={(event) => setProteinG(event.target.value)}
                placeholder="180"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Carbs</span>
              <input
                type="number"
                inputMode="numeric"
                value={carbsG}
                onChange={(event) => setCarbsG(event.target.value)}
                placeholder="300"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Fat</span>
              <input
                type="number"
                inputMode="numeric"
                value={fatG}
                onChange={(event) => setFatG(event.target.value)}
                placeholder="80"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <button
            type="submit"
            disabled={upsertLog.isPending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="size-4" />
            {upsertLog.isPending ? 'Saving...' : 'Save daily log'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleSaveTarget}
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div className="flex items-center gap-3">
          <Target className="size-5 text-emerald-600" />
          <h2 className="text-xl font-bold">Nutrition target</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Target mode</span>
            <select
              value={targetMode}
              onChange={(event) => setTargetMode(event.target.value as 'manual' | 'calculated')}
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="manual">Manual</option>
              <option value="calculated">Calculated from bodyweight</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Goal</span>
            <select
              value={goalType}
              onChange={(event) => setGoalType(event.target.value as NutritionGoalType)}
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="gain_weight">Gain weight</option>
              <option value="lose_weight">Lose weight</option>
              <option value="maintain_weight">Maintain weight</option>
            </select>
          </label>

          {targetMode === 'calculated' ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Bodyweight ({preferredUnit})</span>
              <input
                type="number"
                inputMode="decimal"
                value={targetBodyweight}
                onChange={(event) => setTargetBodyweight(event.target.value)}
                placeholder={preferredUnit === 'lb' ? '180' : '82'}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Calories target</span>
              <input
                type="number"
                inputMode="numeric"
                value={targetCalories}
                onChange={(event) => setTargetCalories(event.target.value)}
                placeholder="2500"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Protein target</span>
              <input
                type="number"
                inputMode="numeric"
                value={targetProtein}
                onChange={(event) => setTargetProtein(event.target.value)}
                placeholder="180"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Carbs target</span>
              <input
                type="number"
                inputMode="numeric"
                value={targetCarbs}
                onChange={(event) => setTargetCarbs(event.target.value)}
                placeholder="Optional"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Fat target</span>
              <input
                type="number"
                inputMode="numeric"
                value={targetFat}
                onChange={(event) => setTargetFat(event.target.value)}
                placeholder="Optional"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={upsertTarget.isPending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
          >
            <Save className="size-4" />
            {upsertTarget.isPending ? 'Saving...' : 'Save target'}
          </button>
        </div>

        {target ? (
          <p className="mt-4 rounded-xl bg-stone-50 p-3 text-sm text-stone-600 ring-1 ring-stone-200 dark:bg-neutral-900 dark:text-stone-300 dark:ring-neutral-800">
            Current target: {target.calories} calories and {target.protein_g}g protein
          </p>
        ) : null}
      </form>

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

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-xl font-bold">Calories</h2>

        {chartPoints.length >= 2 ? (
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPoints} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={42} />
                <Tooltip />
                <Bar dataKey="calories" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
            Add at least two daily logs to see a calories chart.
          </p>
        )}
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-xl font-bold">Protein</h2>

        {chartPoints.length >= 2 ? (
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={42} />
                <Tooltip />
                <Line type="monotone" dataKey="protein" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
            Add at least two daily logs to see a protein chart.
          </p>
        )}
      </article>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-xl font-bold">Recent logs</h2>

        {logsQuery.isLoading ? (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Loading logs...</p>
        ) : null}

        {logs.length === 0 && !logsQuery.isLoading ? (
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
            No nutrition logs yet.
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
            >
              <div>
                <p className="font-semibold">{log.log_date}</p>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {log.meal_count} meals, {log.calories ?? 0} calories, {log.protein_g ?? 0}g protein
                </p>
                {log.notes ? (
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{log.notes}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(log.id)}
                disabled={deleteLog.isPending}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-400 dark:hover:bg-neutral-900"
                aria-label="Delete nutrition log"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}