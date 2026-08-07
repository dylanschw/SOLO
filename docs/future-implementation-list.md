# SOLO Future Implementation List

This file tracks ideas that should stay on the product roadmap without being mixed into every immediate milestone.

## Near-term workout correctness and polish

- Finish active workout set-to-set autofill inside the logger.
  - After logging set 1, set 2 should default to the most recent set's weight, load type, assistance or added weight, and reps.
  - Values must stay editable.
  - Switching exercises should clear the current entry and then use that exercise's own history if available.
- Keep rest timer behavior focused on gym speed.
  - Timer should auto-start after logging a set.
  - User should still be able to pause, resume, clear, and change the timer.
  - Add manual QA for this flow because the current logger already calls the rest timer after logging.
- Continue improving post-workout recommendations.
  - Do not overreact to one failed set if the user corrected the load later in the workout.
  - Use the corrected working weight or corrected assistance when that later set reaches the rep range.
  - Keep recommendations advisory only and never change a program automatically.
- Continue previous workout CSV import polish.
  - Better editable preview cells.
  - Better duplicate resolution.
  - Import history and undo flow.
  - More flexible CSV formats.

## Scheduling and Canvas

- Build the future Canvas browser helper after the SOLO-side importer is stable.
  - No Canvas API requirement.
  - No Canvas credential storage.
  - User-triggered extraction only.
  - Preview before importing.
- Add better school planner features.
  - Assignment priority.
  - Exam tracker.
  - Study reminders.
  - Course filters.
  - Upcoming academic deadlines dashboard card.

## Health, supplements, and medications

- Expand supplements and medication tracking.
  - Better adherence history.
  - Missed item summaries.
  - Better dashboard prompts.
  - Optional Scheduling checklist integration.
- Future Apple Health medication sync.
  - Requires native iOS wrapper or native app.
  - Requires HealthKit permissions, Apple Developer setup, real device testing, privacy disclosures, conflict handling, and explicit user opt-in.
  - Future behavior should support Apple Health to SOLO and SOLO to Apple Health taken-status sync.
  - Avoid duplicates and clearly resolve conflicts.
- Future Apple Watch and Apple Health metric sync.
  - Sleep, steps, workouts, heart rate, bodyweight, and medication status when native support exists.

## Native mobile and release

- Decide on native wrapper, likely Capacitor if the current Vite app remains the foundation.
- Add real app icons and splash assets.
- Prepare App Store and Google Play listings.
- Add final privacy policy, terms, support URL, and account deletion flow.
- Complete Apple and Google health data disclosures.

## Notifications and reminders

- Build reliable notification delivery after the reminder preference foundation is stable.
- Start with browser/PWA reminders only where reliable.
- Move to native reminders for iOS and Android when native wrappers exist.
- Do not auto-prompt for notification permission.

## Dashboard and user experience

- Keep the dashboard centered around daily clarity.
  - What do I need to do today?
  - What am I behind on?
  - What am I improving?
  - What should I log next?
- Avoid overcrowding the bottom nav.
- Keep Health accessible through Home and not necessarily as another bottom tab.
- Continue improving mobile spacing, empty states, loading states, and dark mode consistency.

## Performance and reliability

- Continue route-level code splitting and chunk tuning.
- Add more loading skeletons where large pages fetch many queries.
- Expand offline support beyond workout sets.
  - Nutrition logs.
  - Bodyweight logs.
  - Scheduling tasks.
  - Health metrics.
- Add conflict resolution for offline edits.

## Monetization later

- Keep the app free first.
- Consider non-intrusive banner ads only after the core app is stable.
- Add optional remove-ads purchase later.
- Add donate/support option later.
- Update privacy and data disclosures before any ads or payments.

## Explicit non-goals unless product direction changes

- Do not add built-in workout splits or premade training programs.
- Do not add built-in meal libraries or seeded recipes.
- Do not add built-in supplement or medication data.
- Do not provide medical advice or dose recommendations.
