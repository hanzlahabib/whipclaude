# Step 6: Phase Stubs Under Each Milestone

**Progress: Step 6 of 10** — Next: Backlog parking lot

## STEP GOAL

For each milestone, list the phases it contains as **stubs** (number + name + one-line goal). No plan detail — phases get full plans via `/rihal:plan` later.

## MANDATORY RULES

- 🛑 Phase numbers follow Rihal's NN convention (01, 02, ..., 99, then 999.x for parking lot).
- 🛑 Do NOT generate plan content here. That's `/rihal:plan-phase`.
- 🛑 Each phase has one-sentence goal, max.
- ⏸️ HALT at menu.

## SEQUENCE

### 1. Propose phase stubs

Mirror the outcome-to-milestone mapping from step 3. Each outcome typically becomes 1–2 phases; a milestone typically has 3–6 phases.

```
Phase stubs:

M1 — MVP (Apr 24 → Jun 19)
  01  Setup & scaffolding — repo, CI, Vercel, Neon provisioned
  02  Auth — email/password + Google OAuth
  03  Project CRUD — list, detail, create, archive
  04  Data model hardening — migrations, seeds, indexes

M2 — Team collaboration (Jun 19 → Jul 31)
  05  Workspace model — users-in-workspaces
  06  Roles & permissions — admin/member/viewer
  07  Activity feed — who did what, when

M3 — Monetization (Jul 31 → Sep 11)
  08  Stripe integration — checkout + portal
  09  Usage metering — event ingestion + aggregation
  10  Billing UI — plans, invoices, receipts

[A] Accept
[P] Propose changes (add, remove, rename, renumber)
[C] Continue
```

### 2. Cross-check against outcomes

Every outcome from step 2 must be covered by at least one phase stub. If an outcome is uncovered, flag it:

> ⚠ O-11 "Admin audit log" does not appear in any phase. Add to M2 (phase 07)? Move to backlog? Drop?

### 3. Persist & advance

- Append phase stubs to each milestone block in `{outputFile}`.
- Update `stepsCompleted`.
- Load `./step-07-backlog.md`.
