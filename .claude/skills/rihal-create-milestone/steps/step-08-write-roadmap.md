# Step 8: Write Final ROADMAP.md

**Progress: Step 8 of 10** — Next: State Sync

## STEP GOAL

Assemble everything collected in steps 2–7 into a clean, publication-quality ROADMAP.md. This is the document the user will reference, share, and revisit.

## MANDATORY RULES

- 🛑 Use the canonical ROADMAP.md structure (mirrors `docs/ROADMAP.md` pattern in Rihal Code itself).
- 🛑 Every milestone: name, window, goal, outcomes, phases, kill criteria.
- 🛑 Every phase stub: number, name, one-line goal.
- 🛑 Clean markdown — no debug sections, no "proposed" labels, no step headings.

## SEQUENCE

### 1. Template for each milestone block

```markdown
## Milestone M{N} — {Name}

**Window:** {start} → {end}
**Goal:** {one-sentence goal}
**Status:** {Planned | Active | Complete}

### Outcomes
- O-{nn} {Outcome name} (PRD §{section})

### Phases
| # | Name | Goal |
|---|------|------|
| {NN} | {phase-name} | {one-line goal} |

### Acceptance
{1–3 bullet acceptance criteria derived from outcomes}

### Kill criteria (binary)
- K{N}.{M}: {criterion with numeric threshold}

---
```

### 2. Assemble

- Top of file: title (project name + "Roadmap"), source PRD reference, hard deadline if any.
- Then all milestones in order.
- Then `## Backlog (parking lot)` section with 999.x items.
- Then a brief `## Kill criteria summary` reminder explaining binary-threshold semantics.

### 3. Overwrite {outputFile}

Replace the step-by-step accumulated content with the clean final version. Do NOT keep the intermediate "proposed" sections. The frontmatter stays and is updated.

### 4. Persist & advance

- Update frontmatter: `stepsCompleted` adds `step-08-write-roadmap`. Add `totalMilestones`, `totalPhases`, `hardDeadline` (if any).
- Load `./step-09-state-sync.md`.
