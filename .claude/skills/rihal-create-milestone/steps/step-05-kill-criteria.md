# Step 5: Binary Kill Criteria

**Progress: Step 5 of 10** — Next: Phase Stubs

## STEP GOAL

For each milestone, define **binary** kill criteria — numeric thresholds that, if breached, trigger a pivot or sunset.

## MANDATORY RULES

- 🛑 Kill criteria must be binary (number + threshold), not adjectival.
  - ❌ "Low user satisfaction"
  - ✅ "NPS < 10 at 90 days post-launch"
- 🛑 Every milestone gets at least one kill criterion.
- 🛑 Every criterion cites a source — PRD success metric, Rihal standard, or user-provided number.

## SEQUENCE

### 1. Extract candidates from PRD

From `{inputFile}`'s Success Metrics section, flag any that naturally invert into kill criteria:

| Success metric | Natural kill criterion |
|---|---|
| ≥ 300 paid users in 90 days | MRR < $1,200 at 90 days |
| ≥ 40% D7 retention | D7 retention < 15% |
| ≥ 99.5% post-success rate | Success rate < 97% |

### 2. Assign to milestones

Match each kill criterion to the milestone whose outcomes it measures. If a metric is meaningful only post-M3 (e.g. MRR), it applies to M3's kill criterion.

### 3. Propose

```
Kill criteria (binary — two or more firing = pivot review):

M1 — MVP
  K1.1  Auth success rate < 99% at 2 weeks post-launch
  K1.2  Launch slips > 3 weeks past 2026-06-19

M2 — Team collaboration
  K2.1  < 30% of M1 users activate workspace feature
  K2.2  Workspace-creation error rate > 1%

M3 — Monetization
  K3.1  MRR < $1,200 at 90 days
  K3.2  Paid → churn within 30 days > 25%

[A] Accept
[P] Propose (add/remove/adjust thresholds)
[C] Continue
```

### 4. Persist & advance

- Append criteria to each milestone in `{outputFile}`.
- Update `stepsCompleted`.
- Load `./step-06-phase-stubs.md`.
