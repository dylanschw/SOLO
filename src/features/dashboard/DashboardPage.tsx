import { Apple, Dumbbell, Flame, Scale } from 'lucide-react'

import { StatCard } from '../../components/ui/StatCard'

export function DashboardPage() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Today</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Workout" value="Day 1" detail="Chest / Back planned" icon={<Dumbbell size={20} />} />
        <StatCard label="Nutrition" value="0 / 4" detail="Meals logged" icon={<Apple size={20} />} />
        <StatCard label="Calories" value="--" detail="Targets begin soon" icon={<Flame size={20} />} />
        <StatCard label="Weight" value="--" detail="Weekly average soon" icon={<Scale size={20} />} />
      </div>

      <div className="rounded-lg border border-dashed border-stone-300 p-5 dark:border-neutral-700">
        <h2 className="text-lg font-semibold">Milestone 1 shell</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
          This dashboard is intentionally static for now. Supabase auth, profile data, and protected redirects are the next milestone.
        </p>
      </div>
    </section>
  )
}

