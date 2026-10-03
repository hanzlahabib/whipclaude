# {{project_name}} — Requirements

Canonical REQ IDs for a mobile app. Edit titles/acceptance, do not rename IDs once phases reference them.

---

## REQ-MOBILE-SCAFFOLD — App scaffolding
Both platforms build, run, and navigate between placeholder core screens.

## REQ-MOBILE-CI — Continuous delivery to testers
Every main merge produces a signed build available to internal testers on both platforms within ~30 min.

## REQ-MOBILE-AUTH — Authentication
Sign up + sign in flows work on both platforms. Session persists. At least one social provider.

## REQ-ONBOARDING — Activation flow
New user can reach the core screen in under 60 seconds on a mid-tier device. Drop-off tracked per onboarding step.

## REQ-MOBILE-CORE — Core feature
The one thing this app is for works end-to-end on both platforms, with analytics on the 3-5 events that prove it.

## REQ-MOBILE-OFFLINE — Offline + sync
Core action writes locally, syncs when online. Conflicts have a defined resolution. UI states for pending/syncing/failed.

## REQ-MOBILE-PUSH — Push notifications
APNs + FCM wired. Permission priming before the OS dialog. Opt-out respected. In-app inbox for missed notifications.

## REQ-DEEPLINKS — Universal / app links
Deep links open the app if installed, route to the correct screen, and fall back to web / store if not.

## REQ-MOBILE-LAUNCH — Store launch
Listings live on both stores with screenshots, privacy labels, demo account for Apple review, privacy policy URL.
