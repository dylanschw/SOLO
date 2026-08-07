# SOLO

SOLO is a mobile-first Progressive Web App for personal health, training, nutrition, scheduling, and daily self-management. It started as a gym, food, and bodyweight tracker, but is now moving toward a broader personal dashboard that helps answer what to do today, what is behind, what is improving, and what should be logged next.

The app is built to stay simple on a phone: minimal layout, fast navigation, protected data, offline-aware workout logging, and user-created tracking instead of seeded recommendations or medical advice.

## Current feature areas

### Authentication and profile
* Email and password sign-up/sign-in through Supabase.
* Protected app routes and user-owned records.
* Synced profile settings such as preferred weight unit.

### Dashboard
* Daily command center for training, food, bodyweight, health, scheduling, and consistency.
* Quick actions for the most common logs.
* Health snapshot, goal checks, and activity heatmaps.
* Lightweight coach-style summaries based on logged data.

### Workouts
* Program builder with workout days, planned exercises, sets, reps, rest targets, RPE targets, progression rules, and deload notes.
* Active workout logger for weight, reps, load type, assisted work, added weight, bodyweight movements, no-weight movements, skips, and session alternates.
* Offline set queueing with retry support.
* Workout history, workout detail pages, editable sets, deleted sessions, and past workout logging.
* CSV and text import tools for workout programs and previous workout history.
* Dynamic double progression recommendations, assisted-work recommendations, backoff helpers, and deload guidance.

### Nutrition
* Daily macro logs for calories, protein, carbs, fat, and meals.
* Saved targets and dashboard summaries.
* User-created recipes and meal prep templates.
* Recipe favorites, search, copy flows, and meal prep totals.

### Bodyweight
* Bodyweight logs stored internally in kilograms with preferred unit display.
* Duplicate handling, editing, deletion, weekly averages, and trend summaries.

### Scheduling and Canvas import
* Daily tasks and routine items.
* Scheduling history and task carry/edit flows.
* Canvas task import foundation that uses pasted text, preview, duplicate detection, and user-controlled import.
* No Canvas API, OAuth, cookies, tokens, or credential storage.

### Goals, health, supplements, and medications
* Goal targets for training, nutrition, bodyweight, and consistency.
* Manual health metrics such as sleep, steps, heart rate, and wellness entries.
* Daily water and creatine tracking.
* User-created supplements and medications with daily taken, skipped, missed, and pending statuses.
* Apple Health and Apple Watch integration are documented as future native-app work only.

### Reminders and settings
* Reminder preference foundation for workouts, meals, weigh-ins, sleep, scheduling, water, creatine, supplements, and medications.
* Appearance/theme settings and app preferences.
* Real scheduled push/native notifications are future work.

### Privacy, release, and roadmap docs
* Security notes, deployment checklist, mobile release checklist, privacy checklist, Apple Health foundation notes, Canvas helper notes, and future implementation list.
* Health and medication data are treated as sensitive data.
* The app does not provide medical advice, supplement advice, dose recommendations, or medication recommendations.

## Tech stack

* Core: React, TypeScript, Vite
* Data fetching: React Query
* Database and auth: Supabase, Postgres, Auth, Row Level Security
* Routing: React Router
* Charts: Recharts
* PWA tooling: Vite PWA Plugin
* Testing: Vitest
* Styling: Tailwind CSS

## Getting started

### 1. Clone the repository

```powershell
git clone https://github.com/dylanschw/SOLO.git
cd SOLO
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Environment configuration

Create a `.env.local` file in the root directory. Use `.env.example` as a template. Do not commit this file.

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database setup

Run the SQL migrations in `supabase/migrations` in order in the Supabase SQL Editor.

The schema includes user-owned tables for profiles, bodyweight, nutrition, workouts, scheduling, goals, health metrics, recipes, meal prep, reminders, supplements, medications, and import tracking.

RLS should remain enabled on user-owned tables. The frontend uses the Supabase anon key only. Do not expose the service role key.

### 5. Development and build

```powershell
npm run dev
npm run test
npm run build
```

## Project structure

```text
src/
  app/            # Providers and router configuration
  components/     # Shared layout and UI components
  features/       # Domain features such as workouts, nutrition, health, scheduling
  lib/            # Supabase client and shared utilities

supabase/
  migrations/     # Database schema and RLS policies

docs/             # Architecture, security, release, health sync, Canvas, privacy, roadmap
```

## Product rules

* Keep the app mobile-first.
* Keep the bottom navigation limited and clear.
* Prefer user-created data over seeded libraries.
* Do not add built-in supplement or medication data.
* Do not provide medical advice or dose recommendations.
* Use soft-delete/archive patterns where possible.
* Keep Apple Health, Apple Watch, HealthKit, App Store, and Google Play work clearly separated from the PWA until native wrappers exist.

## Documentation

Useful docs in `docs/`:

* `docs/architecture.md`
* `docs/security-notes.md`
* `docs/deployment-checklist.md`
* `docs/mobile-release-checklist.md`
* `docs/privacy-policy-checklist.md`
* `docs/apple-health-foundation.md`
* `docs/canvas-import-helper.md`
* `docs/future-implementation-list.md`
