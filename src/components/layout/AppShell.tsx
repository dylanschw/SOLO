import { Activity, Apple, Dumbbell, Home, Scale, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/workouts', label: 'Train', icon: Dumbbell },
  { to: '/nutrition', label: 'Food', icon: Apple },
  { to: '/bodyweight', label: 'Weight', icon: Scale },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  return (
    <div className="min-h-svh bg-stone-50 text-stone-950 antialiased transition-colors dark:bg-neutral-950 dark:text-stone-50">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col border-x border-stone-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2" aria-label="SOLO landing">
              <span className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white">
                <Activity size={20} strokeWidth={2.4} />
              </span>
              <span className="text-lg font-semibold tracking-normal">SOLO</span>
            </NavLink>
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600 dark:border-neutral-800 dark:text-stone-300">
              Foundation
            </span>
          </div>
        </header>

        <main className="flex-1 px-5 pb-24 pt-5">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-stone-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-medium transition',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-neutral-900 dark:hover:text-stone-50',
                    ].join(' ')
                  }
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

