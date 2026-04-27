# SOLO

SOLO is a mobile-first progressive web app for gym training, nutrition tracking, and bodyweight trends.

## Stack

- React, TypeScript, and Vite
- Supabase for auth, database storage, and sync
- React Router for app routes
- TanStack Query for server state
- Dexie for future offline workout logging
- Tailwind CSS for styling and dark mode
- Vitest and Testing Library for tests
- vite-plugin-pwa for installable PWA support

## Local Development

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Environment

Create `.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The app can run without Supabase values during Milestone 1. Auth and database setup begin in Milestone 2.

## Checks

```powershell
npm run lint
npm run test
npm run build
npm audit
```

## Project Structure

```text
src/
  app/          App wiring, providers, and routes
  components/   Reusable layout and UI components
  features/     Product areas such as auth, dashboard, workouts, nutrition, bodyweight, and settings
  lib/          Supabase, offline storage, query helpers, and utilities
  styles/       Global Tailwind styles
  test/         Shared test setup
```

