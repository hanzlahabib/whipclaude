# {{project_name}} — Roadmap

**Milestone: M1 — Store launch** (v1.0)
Template: mobile-app · Seeded {{date}}

---

## Phase 01 — Scaffolding

**Goal:** App builds and runs on both platforms. Navigation is set up. Internal test builds can be distributed.

**Delivers:**
- Framework initialized (native / RN / Flutter — pick one, justify in ADR)
- Navigation graph with placeholder screens for the core loop
- CI producing signed iOS (TestFlight) and Android (Internal Track) builds on every main merge
- Crash reporting wired (Crashlytics / Sentry)

**Requirements:** REQ-MOBILE-SCAFFOLD, REQ-MOBILE-CI

---

## Phase 02 — Auth + onboarding

**Goal:** A new user can install, sign up, reach the core screen in <60 seconds.

**Delivers:**
- Sign up / sign in (email + at least one social)
- Onboarding flow (3-5 screens max — every extra screen costs activation)
- Permission priming screens for any runtime permissions needed (notifications, location, camera)
- Empty state for the core screen

**Requirements:** REQ-MOBILE-AUTH, REQ-ONBOARDING

---

## Phase 03 — Core feature

**Goal:** The one thing this app is for works end-to-end.

**Delivers:**
- The core action and its feedback loop, end-to-end, on both platforms
- Analytics on the 3-5 events that prove the loop is working
- At least one delightful moment (animation, haptic, micro-copy) that users will remember

**Requirements:** REQ-MOBILE-CORE

**Depends on:** Phase 02

---

## Phase 04 — Offline + sync

**Goal:** Losing connection does not lose work. Reconnecting does not cause duplicates.

**Delivers:**
- Local-first data model for the core action (write locally, sync when online)
- Conflict resolution strategy documented and tested
- Clear UI for pending/syncing/failed states
- Retry with backoff for failed sync

**Requirements:** REQ-MOBILE-OFFLINE

**Depends on:** Phase 03

---

## Phase 05 — Push + deep links

**Goal:** The app can notify users of time-sensitive events and resume the right screen when tapped.

**Delivers:**
- Push notification infrastructure (APNs + FCM)
- Deep links (universal links / app links) for core screens
- Notification center inside the app for users who missed the push
- Opt-out controls

**Requirements:** REQ-MOBILE-PUSH, REQ-DEEPLINKS

---

## Phase 06 — Store submission + launch

**Goal:** App is live on App Store + Play Store; you survived the first review round.

**Delivers:**
- Store listings: screenshots (5-6 per locale), description, privacy labels
- Review-ready demo account for Apple
- Privacy policy + support URL live
- Post-launch monitoring: crash-free rate, conversion from install, 1-day retention

**Requirements:** REQ-MOBILE-LAUNCH

**Depends on:** Phase 05
