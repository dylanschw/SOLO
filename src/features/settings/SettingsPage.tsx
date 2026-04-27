import { LogOut, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import type { ThemePreference, WeightUnit } from '../../lib/supabase/types'
import { signOut } from '../auth/lib/auth-client'
import { useAuth } from '../auth/hooks/useAuth'
import { useProfile, useUpdateProfile } from '../profile/hooks/useProfile'

export function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const profileQuery = useProfile()
  const updateProfile = useUpdateProfile()

  const [fullName, setFullName] = useState('')
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<WeightUnit>('lb')
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const profile = profileQuery.data

  useEffect(() => {
    if (!profile) {
      return
    }

    setFullName(profile.full_name ?? '')
    setPreferredWeightUnit(profile.preferred_weight_unit)
    setThemePreference(profile.theme_preference)
  }, [profile])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim() || null,
        preferred_weight_unit: preferredWeightUnit,
        theme_preference: themePreference
      })

      setStatusMessage('Settings saved.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save settings.')
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Control center</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>

      <div className="mt-6 grid gap-4">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-xl font-bold">Account</h2>
          <p className="mt-2 break-words text-sm leading-6 text-stone-600 dark:text-stone-300">
            Signed in as {user?.email}
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </article>

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <h2 className="text-xl font-bold">Profile preferences</h2>

          {profileQuery.isLoading ? (
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Loading profile...</p>
          ) : null}

          {profileQuery.error ? (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
              Could not load profile.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="John Smith"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Weight unit</span>
              <select
                value={preferredWeightUnit}
                onChange={(event) => setPreferredWeightUnit(event.target.value as WeightUnit)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              >
                <option value="lb">Pounds</option>
                <option value="kg">Kilograms</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Saved theme preference</span>
              <select
                value={themePreference}
                onChange={(event) => setThemePreference(event.target.value as ThemePreference)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="size-4" />
              {updateProfile.isPending ? 'Saving...' : 'Save settings'}
            </button>
          </div>

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
        </form>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-xl font-bold">Local appearance</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            The toggle changes this browser instantly. The saved preference above is now stored in your Supabase profile.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </article>
      </div>
    </section>
  )
}