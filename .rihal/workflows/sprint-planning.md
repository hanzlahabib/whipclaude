# Workflow: rihal:sprint-planning

<purpose>
Plan the next sprint: compute capacity from velocity history, prioritize stories from phase scope, create SPRINT.md, register sprint + stories in state.json.

Uses rihal-tools.cjs sprint/story state commands for tracking.
</purpose>

<output_format>
Open with banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► PLANNING SPRINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
TaskCreate: "Load phase scope + velocity", "Curate stories with user", "Register sprint + stories in state", "Write SPRINT.md", "Start sprint".
Closure: `RIHAL ► SPRINT {NN.S} READY ✓ ({N} stories, {M} points)`
Next Up: `/rihal:execute .planning/phases/{phase}/SPRINT.md`
</output_format>

<required_reading>
@.rihal/references/output-format.md
</required_reading>

<process>
## Step 0 — Usage check

If `$ARGUMENTS` contains `--help` or `-h`:

```
/rihal:sprint-planning [--phase <NN>] [--velocity <points>] [--goal "Sprint goal"]
```

**Examples:**
```
/rihal:sprint-planning
/rihal:sprint-planning --phase 01 --goal "Auth system MVP"
/rihal:sprint-planning --velocity 13
```

STOP — do not proceed.

## Step 1 — Load context

```bash
STATE=$(node .rihal/bin/rihal-tools.cjs state read)
VELOCITY=$(node .rihal/bin/rihal-tools.cjs state sprint velocity)
```

Extract:
- Current phase from state
- Velocity history + average from velocity output
- Phase scope from `.planning/phases/{phase}/SCOPE.md` (if exists)

If no phases in state:
```
No phases found. Run /rihal:new-project first to create a roadmap.
```
Exit.

## Step 2 — Determine capacity

**If velocity history exists:**
- Use rolling 3-sprint average as capacity baseline
- Commit max 80% of average (buffer for interrupts + unknowns)

**If no velocity history (first sprint):**
- Ask user: "This is your first sprint. How many story points can you commit to? (Typical: 8-13 for solo dev + AI)"
- Or use `--velocity` flag

Store as `velocity_target`.

## Step 3 — Curate stories

Read phase scope (SCOPE.md, REQUIREMENTS.md, or ROADMAP.md phase section).

For each requirement/feature in scope:
1. Break into stories: `As a [user], I want [action] so that [outcome]`
2. Estimate: XS(1) / S(2) / M(3) / L(5) / XL(8)
3. Stories > 8 points → split immediately
4. Prioritize: must-have first, nice-to-have last

Present story table to user:

```markdown
| # | Story | Points | Priority | Acceptance |
|---|-------|--------|----------|------------|
| 1 | Login endpoint | 5 | must | Returns JWT on valid creds |
| 2 | Register endpoint | 3 | must | Creates user, hashes password |
| 3 | Rate limiting | 2 | should | 429 after 10 req/min |
```

**Capacity check:** Total committed points <= velocity_target.
If over: "We're at {N} points vs {target} capacity. Move story #{X} to next sprint?"

Wait for user confirmation before proceeding.

## Step 4 — Create sprint

After user confirms stories:

```bash
# Register sprint in state
node .rihal/bin/rihal-tools.cjs state sprint add \
  --phase "{phase_name}" \
  --goal "{sprint_goal}" \
  --velocity {velocity_target}

# Register each story
node .rihal/bin/rihal-tools.cjs state story add \
  --title "{story_title}" \
  --points {points}
```

Write SPRINT.md to `.planning/phases/{phase_slug}/SPRINT.md` using the template at `rihal/templates/sprint.md`. Fill in:
- Sprint goal
- Stories table (from user-confirmed list)
- Capacity section (velocity target, average, buffer)
- Dependencies
- Risks (if identified during estimation)

## Step 5 — Start sprint

```bash
node .rihal/bin/rihal-tools.cjs state sprint start
```

## Step 6 — Summary

```
Sprint {sprint_id} created and started.

Goal: {sprint_goal}
Stories: {count} ({total_points} points)
Capacity: {velocity_target} points ({buffer}% buffer)

Next:
  /rihal:execute .planning/phases/{phase}/SPRINT.md   ← execute the sprint
  /rihal:sprint-status                                ← check progress anytime
```

## Output Format

- SPRINT.md at `.planning/phases/{phase_slug}/SPRINT.md`
- Sprint + stories registered in `.rihal/state.json`
- Console summary with next-step commands

## Examples

### Happy Path
**Input:** `/rihal:sprint-planning --phase 01 --goal "Auth MVP"`
**Expected:** Load phase scope, estimate stories, present table, confirm, create SPRINT.md + register in state, start sprint.

### Edge Case: Over capacity
**Input:** 15 points of stories but velocity avg is 10
**Expected:** Flag over-commitment, suggest deferring lowest-priority story.

### Edge Case: No scope
**Input:** Phase has no SCOPE.md or requirements
**Expected:** "No scope found for this phase. Run /rihal:new-project or write a SCOPE.md first."

### Negative Test
**Input:** `/rihal:sprint-planning` with no phases in state
**Expected:** Graceful exit suggesting /rihal:new-project.

</process>
