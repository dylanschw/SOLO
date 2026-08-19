import { useEffect, useLayoutEffect, useRef } from 'react'
import { Activity, Apple, CalendarCheck, Dumbbell, Home, Scale, Settings } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/app/dashboard', label: 'Home', icon: Home },
  { to: '/app/workouts', label: 'Train', icon: Dumbbell },
  { to: '/app/nutrition', label: 'Food', icon: Apple },
  { to: '/app/bodyweight', label: 'Weight', icon: Scale },
  { to: '/app/scheduling', label: 'Schedule', icon: CalendarCheck },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function resetScrollPosition(scrollElement: HTMLElement | null) {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  scrollElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

export function AppShell() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    resetScrollPosition(mainRef.current)

    const firstFrame = window.requestAnimationFrame(() => {
      resetScrollPosition(mainRef.current)
    })

    const secondFrame = window.requestAnimationFrame(() => {
      resetScrollPosition(mainRef.current)
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [location.pathname, location.search])

  return (
    <div className="min-h-svh bg-neutral-100 text-neutral-950 antialiased transition-colors dark:bg-black dark:text-neutral-50">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col border-x border-neutral-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:border-neutral-900 dark:bg-neutral-950 dark:shadow-none">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-neutral-900 dark:bg-neutral-950/90">
          <div className="flex items-center justify-between">
            <NavLink to="/app/dashboard" className="flex items-center gap-3" aria-label="SOLO dashboard">
              <span className="grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-950 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
                <Activity size={19} strokeWidth={2.3} />
              </span>
              <span className="text-lg font-semibold tracking-tight">SOLO</span>
            </NavLink>
          </div>
        </header>

        <main ref={mainRef} className="min-w-0 flex-1 overflow-x-hidden px-4 pb-24 pt-5 sm:px-5">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-neutral-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur dark:border-neutral-900 dark:bg-neutral-950/95">
          <div className="grid grid-cols-6 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-[11px] font-medium transition active:translate-y-0',
                      isActive
                        ? 'border-neutral-300 bg-neutral-100 text-neutral-950 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50'
                        : 'border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-neutral-50',
                    ].join(' ')
                  }
                >
                  <Icon size={19} aria-hidden="true" strokeWidth={2.2} />
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
