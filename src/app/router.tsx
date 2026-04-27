import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '../components/layout/AppShell'
import { LandingPage } from '../features/auth/LandingPage'
import { BodyweightPage } from '../features/bodyweight/BodyweightPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { NutritionPage } from '../features/nutrition/NutritionPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { WorkoutsPage } from '../features/workouts/WorkoutsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'workouts',
        element: <WorkoutsPage />,
      },
      {
        path: 'nutrition',
        element: <NutritionPage />,
      },
      {
        path: 'bodyweight',
        element: <BodyweightPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])

