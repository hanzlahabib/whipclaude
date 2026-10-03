# {{project_name}} — Mobile App

**Template:** mobile-app
**Created:** {{date}}

## What we're building
A mobile app for {{target_user}} that solves {{core_problem}}. iOS + Android from day one.

## Target user
- **Who:** {{user_segment}}
- **Context of use:** {{context}} (commute, at-desk, on-site, one-handed, etc.)
- **Device assumptions:** {{device_assumptions}} (min OS, connectivity, battery tolerance)

## Core value loop
_(Describe the repeatable loop — 2-4 steps — that drives retention.)_

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

## Non-negotiables
- Works offline for the core action (mobile users drop connectivity often)
- Respects device permissions — no surprise background GPS, no over-asking
- Respect platform conventions (iOS HIG, Material 3) before bespoke UX

## Explicitly out of scope
- Web app in v1
- Tablet-optimized UI (phone-first)
- Apple Watch / Wear OS

## Key risks
- **App Store review:** a single rejection can delay launch by 1-2 weeks; plan for it
- **Performance on low-end Android:** test on a real <$200 device early
- **Push opt-in rate:** <30% is common; design core loop to work without push

## Evolution
_(Updated after each phase completion by `/rihal:execute`.)_
