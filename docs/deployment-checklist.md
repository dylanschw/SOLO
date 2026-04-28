SOLO Deployment Checklist
SOLO is a mobile-first Progressive Web App built with React, TypeScript, Vite, Supabase, React Query, and Vitest.

Pre-deployment Checks
Run these locally before every deployment. Both commands must pass before proceeding.

PowerShell
npm run build
npm run test
Required Environment Variables
The deployed site requires the following variables. Use the values found in your .env.local file.

Warning: Do not commit .env.local to version control and do not expose the Supabase service role key in the frontend.

Variable	Description
VITE_SUPABASE_URL	Your project reference URL from Supabase
VITE_SUPABASE_ANON_KEY	Your Supabase anonymous/public key
Vercel Setup
Recommended Platform: Vercel (Frontend) + Supabase (Backend/Auth/RLS)

Build Settings
Framework Preset: Vite

Install Command: npm install

Build Command: npm run build

Output Directory: dist

Environment Configuration
Navigate to: Project > Settings > Environment Variables

Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

Redeploy the app after changing these variables.

Supabase Setup Checklist
Confirm the following configurations in the Supabase dashboard:

[ ] Email authentication is enabled.

[ ] The profiles table exists.

[ ] All core application tables exist.

[ ] Row Level Security (RLS) is enabled on all user-owned tables.

[ ] Policies only allow users to access rows where auth.uid() matches the owner.

[ ] The frontend uses the anon public key only.

Core Database Tables
Category	Table Names
User Data	profiles
Tracking	bodyweight_entries, nutrition_logs, nutrition_targets
Workouts	workout_programs, workout_days, exercises, planned_exercises, workout_sessions, workout_sets
Supabase Auth URL Configuration
Navigate to Authentication > URL Configuration and set the following:

Site URL:
https://your-vercel-url.vercel.app

Redirect URLs:

http://localhost:5173

http://localhost:5173/

https://your-vercel-url.vercel.app

https://your-vercel-url.vercel.app/

Vercel SPA Routing
To support React Router and direct deep-linking, include a vercel.json file in your root directory:

JSON
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
Supported Routes:

/app/dashboard

/app/workouts

/app/nutrition

/app/bodyweight

/app/settings

PWA & Functional Verification
Verify the following after the deployment is live:

Mobile: App loads correctly on mobile browsers and can be added to the iPhone Home Screen.

Security: App loads over HTTPS and protected routes redirect correctly.

Auth: Login works; email confirmation links open the deployed app (not localhost).

Data Persistence: Bodyweight, nutrition, and workout data save correctly to Supabase.

Offline: Workout set queue works after initial load.

Final Smoke Test
Test the following behavior on the live Vercel URL:

Logged out users should be redirected to /.

Logged in users should have access to all /app routes.

Console Check: No white pages or missing environment variable errors.

Database Check: Ensure rows are created with the correct user_id.

Deployment Troubleshooting
White page on Vercel
Cause: Missing Supabase environment variables.

Fix: Add variables in Vercel settings and redeploy without cache.

Email confirmation opens localhost
Cause: Incorrect Auth URL Configuration.

Fix: Update "Site URL" in Supabase to the production Vercel URL and trigger a new email.

Direct route shows 404
Cause: Missing SPA rewrite rules.

Fix: Ensure vercel.json is present in the root and redeploy.

