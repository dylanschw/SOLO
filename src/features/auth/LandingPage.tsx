import { Dumbbell, LineChart, Lock, Utensils } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { AuthForm } from './components/AuthForm'

export function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              SOLO
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Train. Eat. Adjust.</h1>
          </div>
          <ThemeToggle />
        </header>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-lg font-semibold">Your private gym operating system.</p>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Track workouts, nutrition, bodyweight, goals, and progress from one mobile first app built for real gym use.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
              <Dumbbell className="size-5" />
              <p className="mt-2 text-xs font-semibold">Training</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
              <Utensils className="size-5" />
              <p className="mt-2 text-xs font-semibold">Nutrition</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
              <LineChart className="size-5" />
              <p className="mt-2 text-xs font-semibold">Progress</p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4">
          <AuthForm />
        </div>

        <footer className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="size-3.5" />
          Your data is private and protected by Supabase row level security.
        </footer>
      </div>
    </main>
  )
}