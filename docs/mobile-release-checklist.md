# SOLO Mobile Release Checklist

SOLO is currently a Vite PWA. Do not treat the current web build as an App Store or Google Play submission by itself.

## PWA First

- Verify install flow on iOS Safari and Android Chrome.
- Confirm offline fallback, service worker updates, icons, theme color, and manifest metadata.
- Test login, workout logging, nutrition, bodyweight, scheduling, health, and settings on mobile widths.

## Native Wrapper Path

If SOLO moves to App Store or Google Play, use a native wrapper such as Capacitor or a React Native rebuild.

- Choose wrapper strategy before adding native-only integrations.
- Add native app icons, splash screens, display names, bundle IDs, and versioning.
- Test on physical devices, not only browser emulators.
- Confirm local storage, Supabase auth redirects, camera/photo permissions if added later, and offline sync behavior.

## Store Readiness

- App icon and splash assets for all required sizes.
- Privacy policy URL.
- Terms or acceptable use notes if needed.
- Account deletion and data deletion flow or documented support path.
- Store privacy nutrition labels / Data Safety form.
- Export compliance answers.
- Age rating questionnaire.
- Screenshots for required devices.
- Support URL and contact email.

## Health And Wearables Disclosures

If Apple Health, Apple Watch, Google Fit, or Health Connect is added later:

- Explain exactly which health data is read or written.
- Request only necessary permissions.
- Add HealthKit / health data privacy disclosures to the privacy policy.
- Include App Store privacy labels for health and fitness data.
- Test permission denial, revocation, and partial grants.

## Monetization Notes

SOLO is currently free and has no ads or payments. If ads or donations are added later:

- Add clear privacy disclosures.
- Avoid interrupting workouts, logging, or app use.
- Add any required consent screens before ad SDKs are initialized.
- Document optional paid removal or donations before release.

## Pre-Submission Smoke Test

- Create account.
- Start and complete a workout.
- Import a previous workout CSV.
- Log food and bodyweight.
- Create scheduling tasks and routine items.
- Log health metrics manually.
- Confirm dark mode.
- Confirm data persists after app restart.
- Confirm account sign out.
