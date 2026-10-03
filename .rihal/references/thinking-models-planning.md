# Thinking Models for Planning

Four mental models for rigorous planning: pre-mortem, MECE decomposition, constraint analysis, and reversibility testing.

---

## 1. Pre-Mortem Analysis

**What it counters:** Optimism bias, overlooked failure modes

**How it works:**
Imagine the project has failed 6 months from now. Work backward: *What went wrong?*

**Prompt template:**
```
Imagine we're in month 6 and {phase} failed catastrophically.
What is ONE thing that went wrong to cause this failure?
List 5 plausible failure modes (technical, social, scope).
For each, describe the early warning sign we missed.
```

**Planning step:**
- After drafting SPRINT.md, ask pre-mortem questions
- Add risk mitigation to Phase {N}
- Example: *"Failure mode: UI doesn't resize on mobile. Early signal: No responsive testing in Phase 2. Mitigation: Add device testing checkpoint."*

---

## 2. MECE Decomposition

**What it counters:** Gaps, overlaps, incomplete task lists

**How it works:**
Break work into Mutually Exclusive, Collectively Exhaustive buckets—no overlap, no gaps.

**Prompt template:**
```
Decompose {phase_goal} into MECE categories.
Each task should:
- Belong to exactly ONE category (no overlap)
- Contribute to the phase goal (no stragglers)
- Be independently verifiable

List categories, tasks per category, dependencies.
```

**Planning step:**
- Use MECE to structure Phase {N} tasks
- Verify no task appears twice, no category is empty
- Example: *"Phase: Build user auth. Categories: (1) Schema design, (2) JWT logic, (3) Route protection, (4) Testing. Zero overlap, complete coverage."*

---

## 3. Constraint Analysis

**What it counters:** Wasted effort on non-binding constraints

**How it works:**
Identify the ONE binding constraint (the bottleneck limiting progress). Attack it first.

**Prompt template:**
```
List all constraints on {phase}:
- Technical (API limits, performance)
- Social (team availability, approval)
- Temporal (deadline, dependencies)
- Resource (budget, tooling)

Rank by impact: Which constraint, if removed, would accelerate most?
This is the binding constraint.
```

**Planning step:**
- Run constraint analysis before Phase {N}
- Reorder tasks to address binding constraint first
- Example: *"Binding: API review (1-week SLA). Move API design to start of Phase 3. Unblock subsequent tasks."*

---

## 4. Reversibility Test

**What it counters:** Irreversible decisions made without sufficient deliberation

**How it works:**
Classify each decision as one-way door (hard to undo) or two-way door (reversible).

**Prompt template:**
```
For each decision in {phase}:
- Tech stack choice → one-way door (costly to change)
- Testing strategy → two-way door (can pivot mid-phase)

List one-way decisions. For each, answer:
- What would I regret if this is wrong?
- What information would reduce regret?
- Is delaying decision worth the information gain?
```

**Planning step:**
- Flag one-way decisions in SPRINT.md with `[ONE-WAY]` tag
- For one-way decisions, add deliberation time before Phase {N}
- Example: *"[ONE-WAY] Framework choice (Next.js vs Remix). Allocate 1 day for prototyping before commit."*

---

## Integration in SPRINT.md

Add a **Planning Context** section:

```markdown
## Planning Context

### Pre-Mortem
- Failure mode 1: [mitigation in phase N]
- Failure mode 2: [mitigation in phase N]

### MECE Structure
- Category A: [tasks 1–3]
- Category B: [tasks 4–6]
- Coverage: ✅ Complete, ✅ Non-overlapping

### Binding Constraint
- [Constraint name]: addressed in task {N}

### One-Way Decisions
- [Decision]: Deliberation time allocated in phase {N-1}
```
