import { Moon, Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Settings</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal">Preferences</h1>
      </div>
      <article className="rounded-lg border border-stone-200 p-5 dark:border-neutral-800">
        <Settings className="mb-4 text-emerald-600 dark:text-emerald-300" size={22} />
        <h2 className="text-lg font-semibold">Profile, units, goals</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
          User settings will include pounds or kilograms, active program, nutrition targets, and theme preference.
        </p>
      </article>
      <article className="rounded-lg border border-stone-200 p-5 dark:border-neutral-800">
        <Moon className="mb-4 text-emerald-600 dark:text-emerald-300" size={22} />
        <h2 className="text-lg font-semibold">Dark mode foundation is active</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
          This milestone follows the device theme. The in-app toggle will be connected after profile settings exist.
        </p>
      </article>
    </section>
  )
}

