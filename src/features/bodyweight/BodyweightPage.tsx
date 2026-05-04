import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Scale, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { WeightUnit } from '../../lib/supabase/types'
import { useProfile } from '../profile/hooks/useProfile'
import {
  calculateWeeklyAverage,
  formatBodyweight,
  getBodyweightTrendPoints
} from './lib/bodyweight-stats'
import {
  useBodyweightEntries,
  useCreateBodyweightEntry,
  useDeleteBodyweightEntry
} from './hooks/useBodyweightEntries'

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

type BodyweightPageSection = 'add' | 'trends' | 'history'

const bodyweightPageSections: Array<{
  id: BodyweightPageSection
  label: string
}> = [
    { id: 'add', label: 'Add' },
    { id: 'trends', label: 'Trends' },
    { id: 'history', label: 'History' }
  ]

export function BodyweightPage() {
  const profileQuery = useProfile()
  const entriesQuery = useBodyweightEntries()
  const createEntry = useCreateBodyweightEntry()
  const deleteEntry = useDeleteBodyweightEntry()

  const preferredUnit = profileQuery.data?.preferred_weight_unit ?? 'lb'

  const [entryDate, setEntryDate] = useState(getTodayDateInputValue())
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<WeightUnit>(preferredUnit)
  const [notes, setNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<BodyweightPageSection>('add')

  const entries = entriesQuery.data ?? []

  const weeklyAverage = useMemo(
    () => calculateWeeklyAverage(entries, preferredUnit),
    [entries, preferredUnit]
  )

  const chartPoints = useMemo(
    () => getBodyweightTrendPoints(entries, preferredUnit),
    [entries, preferredUnit]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const numericWeight = Number(weight)

    if (!entryDate) {
      setErrorMessage('Choose a date.')
      return
    }

    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setErrorMessage('Enter a valid bodyweight.')
      return
    }

    try {
      await createEntry.mutateAsync({
        entryDate,
        weight: numericWeight,
        unit,
        notes
      })

      setWeight('')
      setNotes('')
      setUnit(preferredUnit)
      setEntryDate(getTodayDateInputValue())
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save bodyweight entry.')
    }
  }

  async function handleDelete(entryId: string) {
    const confirmed = window.confirm('Delete this bodyweight entry?')

    if (!confirmed) {
      return
    }

    await deleteEntry.mutateAsync(entryId)
  }

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Weight</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Bodyweight</h1>

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {bodyweightPageSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`min-h-11 rounded-xl px-2 text-xs font-semibold transition ${activeSection === section.id
              ? 'bg-white text-stone-950 shadow-sm dark:bg-neutral-950 dark:text-stone-50'
              : 'text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50'
              }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
          {errorMessage}
        </p>
      ) : null}

      {activeSection === 'add' ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Latest entry</p>
              <p className="mt-2 text-2xl font-bold">
                {entries[0] ? `${formatBodyweight(entries[0], preferredUnit)} ${preferredUnit}` : '--'}
              </p>
            </article>

            <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Entries</p>
              <p className="mt-2 text-2xl font-bold">{entries.length}</p>
            </article>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-center gap-3">
              <Scale className="size-5 text-emerald-600" />
              <h2 className="text-xl font-bold">Add weigh in</h2>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Date</span>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                  className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px]">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold">Weight</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    placeholder={preferredUnit === 'lb' ? '180.0' : '81.6'}
                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold">Unit</span>
                  <select
                    value={unit}
                    onChange={(event) => setUnit(event.target.value as WeightUnit)}
                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional notes"
                  rows={3}
                  className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <button
                type="submit"
                disabled={createEntry.isPending}
                className="min-h-12 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createEntry.isPending ? 'Saving...' : 'Save weigh in'}
              </button>
            </div>
          </form>
        </>
      ) : null}

      {activeSection === 'trends' ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Weekly average</p>
              <p className="mt-2 text-2xl font-bold">
                {weeklyAverage === null ? '--' : `${weeklyAverage} ${preferredUnit}`}
              </p>
            </article>

            <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Trend points</p>
              <p className="mt-2 text-2xl font-bold">{chartPoints.length}</p>
            </article>
          </div>

          <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-xl font-bold">Trend</h2>

            {chartPoints.length >= 2 ? (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartPoints} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      width={36}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Add at least two weigh ins to see a trend chart.
              </p>
            )}
          </article>
        </>
      ) : null}

      {activeSection === 'history' ? (
        <article className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-xl font-bold">Recent entries</h2>

          {entriesQuery.isLoading ? (
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Loading entries...</p>
          ) : null}

          {entries.length === 0 && !entriesQuery.isLoading ? (
            <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
              No bodyweight entries yet.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {formatBodyweight(entry, preferredUnit)} {preferredUnit}
                  </p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{entry.entry_date}</p>
                  {entry.notes ? (
                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{entry.notes}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleteEntry.isPending}
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-400 dark:hover:bg-neutral-900"
                  aria-label="Delete bodyweight entry"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}