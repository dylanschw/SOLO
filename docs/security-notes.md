# SOLO Security Notes

SOLO stores private fitness, nutrition, and bodyweight data. The security model is based on Supabase Authentication, user-owned rows, and row level security.

## Authentication

SOLO currently supports email and password authentication through Supabase.

Google authentication is planned for later. The frontend is structured so Google login can be added without changing the main protected route system.

## User-owned data

Most app tables include a `user_id` column. This column references `auth.users(id)`.

Examples:

- `bodyweight_entries`
- `nutrition_logs`
- `nutrition_targets`
- `workout_programs`
- `workout_days`
- `exercises`
- `planned_exercises`
- `workout_sessions`
- `workout_sets`

## Row level security

Each user-owned table should have row level security enabled.

Policies should enforce:

```sql
auth.uid() = user_id