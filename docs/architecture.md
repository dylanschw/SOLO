# SOLO Architecture

SOLO is a mobile first Progressive Web App for gym training, nutrition tracking, and bodyweight tracking.

## Stack

- React
- TypeScript
- Vite
- Supabase Auth
- Supabase Postgres
- Supabase row level security
- React Router
- React Query
- Recharts
- Vitest
- Vite PWA plugin

## App structure

```text
src/
  app/
    providers.tsx
    router.tsx

  components/
    layout/
    ui/

  features/
    auth/
    bodyweight/
    dashboard/
    nutrition/
    profile/
    settings/
    workouts/

  lib/
    supabase/
    utils/