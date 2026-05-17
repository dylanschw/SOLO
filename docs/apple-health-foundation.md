# Apple Health And Apple Watch Foundation

SOLO is currently a browser-based Vite PWA. A PWA cannot directly access Apple Health or Apple Watch HealthKit data.

The repo now has a health metric data model and provider interface so future native sync can write into the same tables as manual health entries. The current Apple Health provider is intentionally a placeholder.

## What Exists Now

- `health_metric_entries` table for manual or imported health metrics.
- `supplement_medication_items` and `supplement_medication_logs` tables for user-created supplement and medication tracking.
- Health metric sources: `manual`, `apple_health`, `apple_watch`, and `imported`.
- Supplement and medication log sources: `manual`, `apple_health`, `apple_watch`, and `imported`.
- Manual health entry UI in the Health page.
- Provider interface in `src/features/health/lib/health-providers.ts`.
- Apple Health placeholder adapter with TODO comments.

## What Native Work Is Required Later

- Native iOS app or wrapper, such as Capacitor or React Native.
- Apple Developer Program membership.
- HealthKit entitlement enabled for the app identifier.
- `Info.plist` permission strings for reading health data.
- HealthKit permission prompts that explain the value of each data type.
- Real device testing. HealthKit is not fully testable in a normal desktop browser.
- Privacy policy updates for health and fitness data.
- App Store privacy disclosures for HealthKit data use.
- A sync job that maps HealthKit samples into `health_metric_entries`.
- A separate medication sync flow that maps HealthKit medication events into `supplement_medication_logs`.
- Conflict handling so a SOLO manual log and a HealthKit medication event for the same item/day do not create confusing duplicates.
- Explicit user controls to enable, disable, and delete medication sync data.

## Apple Watch Notes

Apple Watch data usually arrives through Apple Health. Direct Watch app work would require a watchOS target and additional native code. The first practical version should read Apple Health samples from the iPhone app after permissions are granted.

## Data Mapping Target

Future HealthKit imports should map into:

- Sleep duration -> `sleep_hours`
- Steps -> `steps`
- Resting heart rate -> `resting_heart_rate`
- Active/total calories as chosen -> `calories_burned`
- Water if supported or manually logged -> `water_ml`
- Creatine remains manual unless another data source is intentionally added.

Imported records should set `source` to `apple_health` or `apple_watch`, preserve an external sample identifier when possible, and avoid duplicating samples across sync runs.

## Medication Sync Notes

SOLO does not sync medications with Apple Health in the current PWA. Future bidirectional medication sync requires native iOS HealthKit medication APIs, HealthKit permissions, real device testing, privacy disclosures, and clear conflict handling.

Medication and supplement data is sensitive. SOLO should never infer doses, recommend changes, or tell users to start, stop, or change a medication. The tracker is for user-created records only.
