# SOLO

SOLO is a mobile-first Progressive Web App (PWA) designed for gym training, nutrition tracking, and bodyweight management. It features comprehensive workout logging, offline set queueing, and progression recommendations, optimized for use on a smartphone in a gym environment.

## Features

### Authentication and Profile
* **Secure Access:** Email and password sign-up/sign-in via Supabase.
* **Syncing:** User profile settings and preferences (such as units) are synced across devices.
* **Protected Routes:** Ensures data privacy and secure application state.

### Dashboard and Analytics
* **Overview:** Centralized display for nutrition summaries, active program status, and bodyweight trends.
* **Visualizations:** Charts for bodyweight progress, calorie intake, and protein consumption using Recharts.

### Training and Progression
* **Program Builder:** Create workout programs, define workout days, and manage exercise libraries.
* **Session Logging:** Log weight, reps, RPE, and set types.
* **Progression Engine:** Dynamic double progression recommendations, backoff weight helpers, and deload logic.
* **Import Tools:** CSV and plain-text workout import wizard for rapid program setup.

### Nutrition and Bodyweight Tracking
* **Daily Logs:** Track macros (calories, protein, carbs, fats) and daily meal counts.
* **Target Management:** Support for manual targets or calculated targets based on bodyweight, activity level, and goals.
* **Weight Management:** Store weight in kilograms internally with preferred unit display, weekly averages, and trend charts.

### Offline Reliability
* **Set Queueing:** Queue workout sets locally when offline or if a save fails.
* **Visual Status:** Pending local sets are highlighted in the UI.
* **Auto-Sync:** Automatic retry logic when the browser returns online, plus manual sync options.

---

## Tech Stack

* **Core:** React, TypeScript, Vite
* **Data Fetching:** React Query
* **Database & Auth:** Supabase (Postgres, Auth, and Row Level Security)
* **Routing:** React Router
* **Charts:** Recharts
* **PWA Tooling:** Vite PWA Plugin
* **Testing:** Vitest

---

## Getting Started

### 1. Clone the repository
```powershell
git clone https://github.com/dylanschw/SOLO.git
cd SOLO
```

### 2. Install dependencies
```powershell
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory. Use `.env.example` as a template. Do not commit this file to version control.
```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup
Run the SQL migrations in the Supabase SQL Editor. The schema includes:
* `profiles`, `bodyweight_entries`, `nutrition_logs`, `nutrition_targets`
* `workout_programs`, `workout_days`, `exercises`, `planned_exercises`
* `workout_sessions`, `workout_sets`

Ensure Row Level Security (RLS) is enabled on all user-owned tables.

### 5. Development and Build
* **Start local server:** `npm run dev` (Available at http://localhost:5173)
* **Run tests:** `npm run test`
* **Build for production:** `npm run build`

---

## Project Structure

```text
src/
  app/            # Providers and router configuration
  components/     # Shared layout and UI components
  features/       # Domain-specific logic (auth, workouts, nutrition, etc.)
  lib/            # Supabase client and utility helpers
  
supabase/
  migrations/     # Database schema and RLS policies

docs/             # Extended documentation (Architecture, Security, Deployment)
```

---

## Security and Architecture

### Row Level Security (RLS)
SOLO utilizes Supabase RLS to protect user data. Each user-owned table includes a `user_id` column, and policies restrict access so users can only interact with their own records. The frontend utilizes the Supabase anon key only; the service role key is never exposed.

### Offline Data Model
Offline support focuses on data integrity during workout sessions:
1. Failed saves are stored in local storage.
2. The UI displays a "pending" state for local data.
3. The application retries synchronization automatically upon reconnection.
4. Successfully synced sets are purged from local storage to maintain a single source of truth.

---

## Documentation
For more detailed information, refer to the files in the `docs/` directory:
* **Architecture:** `docs/architecture.md`
* **Security:** `docs/security-notes.md`
* **PWA Installation:** `docs/iphone-install.md`
* **Deployment:** `docs/deployment-checklist.md`