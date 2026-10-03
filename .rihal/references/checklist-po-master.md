# Checklist: Product Owner Master Checklist

Use this checklist as a **Product Owner (or product lead)** deciding whether to **start work on a story or epic**.

This is the gate before planning or execution. If you cannot check all items, the work is not ready to start.

## Stakeholder Alignment

- [ ] **Who asked?** — Named stakeholder (not "the team", but "Mariam wants X" or "customer complaint #42")
  - If internal: Which team member? What's their role?
  - If external: Which customer? What's their use case?
- [ ] **Why now?** — Evidence the ask is urgent or has high impact
  - Market research data? Customer churn risk? Competitive pressure? Roadmap dependency?
  - Not: "Someone mentioned it"

## Problem & Impact

- [ ] **What gets worse if we DON'T build this?** — Be specific
  - Bad: "Users will be unhappy"
  - Good: "We lose 5+ customers per month due to missing export feature. Support tickets about this: 12/month."
- [ ] **Measurable outcome** — How will we know success?
  - "Reduce support tickets about this feature from 12/month to <2/month"
  - "Increase user retention by 3% in Q2"
  - "Enable 10 new enterprise customers who require SSO"

## Scope Boundary

- [ ] **Kill criterion defined** — When would we stop building this?
  - "If implementation requires breaking existing API contracts"
  - "If cost exceeds $50k in infrastructure changes"
  - "If we discover >30% of users don't use the feature after 2 weeks"
- [ ] **Opportunity cost named** — What ELSE are we not doing?
  - "We ship this, we delay bug fixes by 2 weeks"
  - "This takes 3 people for 1 sprint = 1 sprint delay on roadmap"

## Decision Criteria

- [ ] **Effort estimated** — Do we know roughly how long?
  - Work with CTO/architect: "This is probably a 2-3 week story" or "This needs deeper research first"
- [ ] **Risk identified** — What could go wrong?
  - "Depends on new vendor library (not battle-tested)"
  - "Requires database schema migration (rollback risk)"
  - "Affects 40% of users; bugs here are high-impact"
- [ ] **Alternatives considered** — Is building the only option?
  - "Could we fix this with a workaround instead?"
  - "Could we partner/integrate instead of building?"
  - "Could we defer this 1 quarter and see if the ask goes away?"

## Readiness Gate

✅ **Ready to plan/execute** when:
- All items checked
- Stakeholder has approved the kill criterion
- Team capacity confirmed

❌ **Not ready** when:
- Stakeholder is unclear
- Problem statement is vague
- Kill criterion missing (scope will creep)
- Opportunity cost not discussed with team

## Template

```markdown
## Work: [Feature Name]

**Stakeholder:** [Name, role, evidence they asked]

**Problem:** What gets worse if we don't build this?
- [Specific, measurable impact]
- [Data point supporting urgency]

**Success Metric:** How will we know this worked?
- [Measurable outcome]

**Kill Criterion:** When would we stop?
- [Specific condition that stops work]

**Opportunity Cost:** What are we NOT doing?
- [Team capacity impact]
- [Roadmap delay]

**Estimated Effort:** [S | M | L] — [Why this size]

**Risks:**
- [Risk 1]
- [Risk 2]

**Status:** ✓ Ready to plan
```

## When to Say "Not Ready"

1. **Stakeholder vague:** "Add notifications" without naming who asked or why
2. **Impact unclear:** "Would be nice to have" with no data
3. **Kill criterion missing:** Will expand forever
4. **Opportunity cost unknown:** Team doesn't know what they're delaying
5. **Risk not discussed:** Building on untested foundation

In these cases, ask for a council or discovery session before committing to work.
