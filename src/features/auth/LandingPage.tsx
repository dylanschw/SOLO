import { ArrowRight, ShieldCheck, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <section className="flex min-h-[calc(100svh-9rem)] flex-col justify-between gap-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            Gym, nutrition, bodyweight
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-normal text-stone-950 dark:text-white">
            One focused place to train, eat, and track progress.
          </h1>
          <p className="text-base leading-7 text-stone-600 dark:text-stone-300">
            SOLO is being built as a real offline-ready training PWA with Supabase-backed user data.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="flex gap-3 rounded-lg border border-stone-200 p-4 dark:border-neutral-800">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={22} />
            <div>
              <h2 className="text-base font-semibold">User-owned data first</h2>
              <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">
                Auth, row level security, and private workout history come next.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-stone-200 p-4 dark:border-neutral-800">
            <WifiOff className="mt-0.5 shrink-0 text-emerald-600" size={22} />
            <div>
              <h2 className="text-base font-semibold">Designed for bad gym Wi-Fi</h2>
              <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">
                IndexedDB and sync queues are reserved for workout logging milestones.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Link
        to="/dashboard"
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        Preview dashboard
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
    </section>
  )
}

