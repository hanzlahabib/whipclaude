# Step 7: Backlog Parking Lot

**Progress: Step 7 of 10** — Next: Write ROADMAP.md

## STEP GOAL

Capture everything that is **not** in M1..Mn but was considered. Use Rihal's `999.x` parking-lot convention so items can be promoted later via `/rihal:plant-seed` or `/rihal:review-backlog`.

## MANDATORY RULES

- 🛑 Pull explicit "Out of scope" items from the PRD into the backlog — do not silently drop them.
- 🛑 Each backlog item gets a one-line reason ("deferred: needs user auth from M1").
- ⏸️ HALT at menu.

## SEQUENCE

### 1. Collect backlog items

Sources:
- PRD's explicit "Out of scope" section.
- Outcomes that got cut in step 3 sequencing.
- Ideas raised during step 4-6 that did not make it into a milestone.

### 2. Number using 999.x convention

```
Backlog (999.x — promotable with /rihal:plant-seed):

  999.1  Cross-post to LinkedIn          — deferred: requires LinkedIn OAuth (M2+)
  999.2  Auto-DM feature                 — deferred: abuse risk, needs rate-limit design
  999.3  Mobile native app               — deferred: PWA sufficient for launch
  999.4  Enterprise SSO                  — deferred: no enterprise customers yet
  999.5  Audit log export                — deferred: nice-to-have for M2

[A] Accept
[P] Add, remove, re-number
[C] Continue
```

### 3. Persist & advance

- Append backlog section to `{outputFile}`.
- Update `stepsCompleted`.
- Load `./step-08-write-roadmap.md`.
