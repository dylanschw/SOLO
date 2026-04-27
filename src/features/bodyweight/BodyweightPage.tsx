import { Scale } from 'lucide-react'

export function BodyweightPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Bodyweight</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal">Trend tracking</h1>
      </div>
      <article className="rounded-lg border border-stone-200 p-5 dark:border-neutral-800">
        <Scale className="mb-4 text-emerald-600 dark:text-emerald-300" size={22} />
        <h2 className="text-lg font-semibold">Weekly averages coming soon</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
          Weight entries will store a consistent base unit so charts and nutrition targets remain reliable.
        </p>
      </article>
    </section>
  )
}

