# Checklist: Product Manager Pre-Execution Checklist

Use this checklist as a **Product Manager or execution lead** deciding whether a story/epic is **ready to execute** (all dependencies gathered, team aligned, blockers cleared).

This gate happens RIGHT BEFORE execution (after planning, before dev work starts).

## Market & Customer Evidence

- [ ] **Market research complete** — Do we know customer need?
  - Mariam (Growth) completed discovery: surveys, competitor analysis, use case documentation
  - Reference: `.planning/research/[feature-name]-market-analysis.md`
  - Output: "10 potential customers need X", "Current gap in market"
  
- [ ] **Customer validation** — Have we talked to actual users?
  - "5 customers asked for this in last 6 months"
  - "Support tickets: 20+ about this issue"
  - NOT: "We think users would like this"

- [ ] **Business case documented** — What's the revenue/retention impact?
  - "Estimated $50k ARR impact if we build"
  - "Reduces churn by 5% (12 customers @ $5k each = $60k)"
  - "Unblocks 3 enterprise deals stuck on this feature"

## Scope & Story Definition

- [ ] **Scope defined** — What's in, what's out?
  - User stories written following checklist-story-draft
  - MoSCoW prioritization applied (Must, Should, Could, Won't)
  - Out-of-scope list prevents creep
  
- [ ] **Acceptance criteria clear** — Can QA verify completion?
  - All stories have 3+ acceptance criteria
  - Each criterion is testable (not vague)
  - Reference: User stories in `.planning/stories/[feature-name].md`

- [ ] **Dependencies mapped** — What do we need first?
  - "This feature depends on API endpoint from backend team (eta: 2026-04-15)"
  - "Requires design approval from Layla (scheduled for 2026-04-10)"
  - "Blocks downstream feature: user preferences (can start after this ships)"

## Technical Feasibility

- [ ] **Waleed (CTO) confirmed feasible** — Is the architecture possible?
  - "Reviewed architecture; can be done with current stack"
  - "No blocking unknowns"
  - Reference: `.planning/technical-feasibility/[feature-name].md`

- [ ] **Tech debt considered** — Does this create problems?
  - "Will need refactoring in area X (planned for Q3)"
  - "No new security issues"
  - "Performance impact assessed: <5% overhead"

- [ ] **Dependencies available** — Do we have what we need?
  - "All required libraries exist and are maintained"
  - "No new tooling needed" OR "New tools procured and tested"
  - "Environment setup documented"

## QA & Quality Gates

- [ ] **Fatima (QA Lead) signed off** — Can we test this thoroughly?
  - "Test plan created: 15 manual test cases + 20 automated tests"
  - "Performance regression tests specified"
  - "Security tests identified (if applicable)"
  - Reference: `.planning/qa/[feature-name]-test-plan.md`

- [ ] **Release gate defined** — What makes this shippable?
  - "All acceptance criteria passed"
  - "Zero critical bugs, <5 P2 bugs"
  - "Performance benchmarks met (load test: 1k users/sec)"
  - "No console.log left; no TODO comments"

- [ ] **Rollback tested** — Can we undo this?
  - "Database migration is reversible"
  - "Feature flag allows instant disable"
  - "Rollback tested; confirmed takes <5 min"

## Strategic Alignment

- [ ] **Kill criterion from Sadiq (Strategy)** — When would we stop?
  - "If implementation exceeds 3 weeks, defer to Q3"
  - "If performance regression >10%, reconsider approach"
  - "If customer feedback shows demand is lower than expected"

- [ ] **Roadmap impact clear** — What else does this affect?
  - "Delays bug fixes by 1 week" OR "Doesn't delay roadmap"
  - "Unblocks 3 other features"
  - "Team capacity confirmed: 2 people, 3 weeks"

## Customer Handoff

- [ ] **First customer named** — Who gets this first?
  - "Mariam identified 3 beta customers; Mariam (customer) is priority #1"
  - "Rollout plan: beta with 3 customers first, then all users"
  - "Communication plan: send announcement on 2026-05-01"

- [ ] **Success metrics defined** — How do we measure impact?
  - "Target: 10+ customers using feature in first month"
  - "Target: <2 support tickets about this feature after launch"
  - "Target: NPS score increase by 2 points in follow-up survey"

## Sign-Off Gate

This story is **READY TO EXECUTE** when:

```markdown
## Pre-Execution Sign-Off

✓ Market research complete (Mariam)
✓ Scope defined with MoSCoW (Hussain-PM)
✓ Technical feasibility confirmed (Waleed)
✓ QA test plan ready (Fatima)
✓ Strategy/kill criterion from Sadiq
✓ First customer identified (Mariam)

**Status:** Ready to start execution on 2026-04-15
**Estimated completion:** 2026-05-01
**Expected impact:** +$50k ARR, 5% churn reduction
```

Story is **NOT READY** if any of:
- Stakeholder missing (no Mariam research, no Waleed feasibility)
- Scope fuzzy ("nice to have" or unclear acceptance criteria)
- No customer identified
- No rollback plan
- Kill criterion missing

## Template

```markdown
# Pre-Execution Checklist: [Feature Name]

## Market & Customer
- [x] Market research: [Mariam's doc path] — 10 customers need this
- [x] Customer validation: [Support tickets + survey feedback]
- [x] Business case: [$50k ARR impact, 5% churn reduction]

## Scope
- [x] Stories written: [Count and link to stories]
- [x] MoSCoW applied: Must (8), Should (3), Could (2)
- [x] Dependencies: [Backend API ready by 2026-04-15]

## Technical
- [x] Feasibility: [Waleed approved] — no blocking unknowns
- [x] Architecture: [No new tech, fits current patterns]
- [x] QA plan: [Fatima: 15 manual + 20 automated tests]

## Strategy
- [x] Kill criterion: [Stop if >3 weeks or >10% perf regression]
- [x] Roadmap impact: [Delays bug fixes 1 week]
- [x] Rollout plan: [Beta with 3 customers, then all users]

## Status
✓ Ready to execute on 2026-04-15
```
