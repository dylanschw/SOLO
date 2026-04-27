import { Apple } from 'lucide-react'

export function NutritionPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Nutrition</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal">Food log</h1>
      </div>
      <article className="rounded-lg border border-stone-200 p-5 dark:border-neutral-800">
        <Apple className="mb-4 text-emerald-600 dark:text-emerald-300" size={22} />
        <h2 className="text-lg font-semibold">Meal and macro tracking soon</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
          The MVP will support simple meal counts first, then manual calories, protein, carbs, fats, and notes.
        </p>
      </article>
    </section>
  )
}

