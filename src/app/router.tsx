import { Suspense, lazy, type ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute'

const LandingPage = lazy(() =>
  import('../features/auth/LandingPage').then((module) => ({ default: module.LandingPage }))
)
const BodyweightPage = lazy(() =>
  import('../features/bodyweight/BodyweightPage').then((module) => ({ default: module.BodyweightPage }))
)
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage }))
)
const HealthPage = lazy(() =>
  import('../features/health/HealthPage').then((module) => ({ default: module.HealthPage }))
)
const NutritionPage = lazy(() =>
  import('../features/nutrition/NutritionPage').then((module) => ({ default: module.NutritionPage }))
)
const SchedulingPage = lazy(() =>
  import('../features/scheduling/SchedulingPage').then((module) => ({ default: module.SchedulingPage }))
)
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage }))
)
const WorkoutsPage = lazy(() =>
  import('../features/workouts/WorkoutsPage').then((module) => ({ default: module.WorkoutsPage }))
)
const WorkoutSessionPage = lazy(() =>
  import('../features/workouts/WorkoutSessionPage').then((module) => ({ default: module.WorkoutSessionPage }))
)
const WorkoutHistoryDetailPage = lazy(() =>
  import('../features/workouts/WorkoutHistoryDetailPage').then((module) => ({
    default: module.WorkoutHistoryDetailPage
  }))
)

function RouteLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-stone-500 dark:text-stone-400">
      Loading...
    </div>
  )
}

function lazyRoute(element: ReactElement) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/',
        element: lazyRoute(<LandingPage />)
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/app/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: lazyRoute(<DashboardPage />)
          },
          {
            path: 'workouts',
            element: lazyRoute(<WorkoutsPage />)
          },
          {
            path: 'workouts/session/:sessionId',
            element: lazyRoute(<WorkoutSessionPage />)
          },
          {
            path: 'workouts/history/:sessionId',
            element: lazyRoute(<WorkoutHistoryDetailPage />)
          },
          {
            path: 'nutrition',
            element: lazyRoute(<NutritionPage />)
          },
          {
            path: 'bodyweight',
            element: lazyRoute(<BodyweightPage />)
          },
          {
            path: 'scheduling',
            element: lazyRoute(<SchedulingPage />)
          },
          {
            path: 'health',
            element: lazyRoute(<HealthPage />)
          },
          {
            path: 'settings',
            element: lazyRoute(<SettingsPage />)
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])
