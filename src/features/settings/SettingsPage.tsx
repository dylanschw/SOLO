import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { signOut } from '../auth/lib/auth-client'
import { useAuth } from '../auth/hooks/useAuth'

export function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <section>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Control center</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>

      <div className="mt-6 grid gap-4">
        <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-xl font-bold">Account</h2>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
            Signed in as {user?.email}
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </article>

        <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-xl font-bold">Appearance</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Theme is saved locally right now. Next we will sync this setting to your Supabase profile.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </article>
      </div>
    </section>
  )
}