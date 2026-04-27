import { Dumbbell } from 'lucide-react'
import type { ReactNode } from 'react'

export function WorkoutsPage() {
  return (
    <section className="space-y-4">
      <PageTitle eyebrow="Training" title="Workout plans" />
      <PlaceholderCard
        icon={<Dumbbell size={22} />}
        title="Plan builder starts after auth"
        body="Programs, workout days, exercises, top sets, back-off sets, and progression rules will be saved to Supabase with user ownership."
      />
    </section>
  )
}

function PageTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-normal">{title}</h1>
    </div>
  )
}

function PlaceholderCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-lg border border-stone-200 p-5 dark:border-neutral-800">
      <div className="mb-4 text-emerald-600 dark:text-emerald-300">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">{body}</p>
    </article>
  )
}
