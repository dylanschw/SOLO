import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute'
import { LandingPage } from '../features/auth/LandingPage'
import { BodyweightPage } from '../features/bodyweight/BodyweightPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { NutritionPage } from '../features/nutrition/NutritionPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { WorkoutsPage } from '../features/workouts/WorkoutsPage'
import { WorkoutSessionPage } from '../features/workouts/WorkoutSessionPage'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/',
        element: <LandingPage />
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
            element: <DashboardPage />
          },
          {
            path: 'workouts',
            element: <WorkoutsPage />
          },
          {
            path: 'workouts/session/:sessionId',
            element: <WorkoutSessionPage />
          },
          {
            path: 'nutrition',
            element: <NutritionPage />
          },
          {
            path: 'bodyweight',
            element: <BodyweightPage />
          },
          {
            path: 'settings',
            element: <SettingsPage />
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