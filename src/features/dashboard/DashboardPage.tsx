import { Activity, Apple, Dumbbell, Scale } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useProfile } from '../profile/hooks/useProfile'

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
  const profile = profileQuery.data
  const displayName = getDisplayName(user?.email, profile?.full_name)

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Today</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome, {displayName}</h1>

      <div className="mt-6 rounded-2xl bg-stone-900 p-5 text-white shadow-sm dark:bg-white dark:text-stone-950">
        <p className="text-sm font-medium opacity-70">Profile connected</p>
        <p className="mt-2 text-xl font-bold">
          Preferred unit: {profile?.preferred_weight_unit ?? 'loading...'}
        </p>
        <p className="mt-2 text-sm leading-6 opacity-80">
          This dashboard is reading your Supabase profile. Next we will start saving real bodyweight and nutrition data.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Dumbbell className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Training</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">No active workout yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            Workout programs, planned exercises, and logged sessions now have database tables.
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Apple className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Nutrition</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">No meals logged yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            Nutrition targets and daily nutrition logs are ready in Supabase.
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Scale className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Bodyweight</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">No weigh ins yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            Bodyweight will be stored in kilograms internally so charts and unit conversion stay consistent.
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Activity className="size-5 text-stone-500 dark:text-stone-400" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Consistency</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">No weekly data yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            Later this card will compare training, nutrition, and bodyweight consistency.
          </p>
        </article>
      </div>
    </section>
  )
}