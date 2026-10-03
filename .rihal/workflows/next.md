<purpose>
Detect current project state and automatically advance to the next logical Rihal workflow step.
Reads project state to determine: plan → execute → verify → complete progression.
Zero-friction — detects and invokes, no confirmation needed.
</purpose>

<required_reading>
@.rihal/references/output-format.md
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<output_format>
Print a routing banner when dispatching to the next command:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current: Phase {N} — {name} | Sprint {sprint_id}
Status:  {status description}

▶ Next: `/rihal:{command} {args}`
  {One-line explanation}
```

Follow all banner and status-symbol conventions from output-format.md.
</output_format>

<process>

<step name="detect_state">
Read project state to determine current position:

```bash
STATE=$(node .rihal/bin/rihal-tools.cjs state read 2>/dev/null || echo '{}')
SPRINT_STATUS=$(node .rihal/bin/rihal-tools.cjs state sprint status 2>/dev/null || echo '{}')
VELOCITY=$(node .rihal/bin/rihal-tools.cjs state sprint velocity 2>/dev/null || echo '{}')
```

Also read:
- `.planning/STATE.md` — current phase, progress
- `.planning/ROADMAP.md` — milestone structure and phase list

Extract from state JSON:
- `current_phase` — which phase is active
- `current_sprint` — active sprint ID (or null)
- `phases[]` — all phases with status
- `velocity_history[]` — sprint velocity data

If no `.planning/` directory AND no `.rihal/state.json`:
```
No Rihal project detected. Run `/rihal:new-project` to get started.
```
Exit.
</step>

<step name="safety_gates">
Run hard-stop checks before routing. Exit on first hit unless `--force` was passed.

If `--force` flag was passed, skip all gates.
Print: `Warning: --force — skipping safety gates`
Then proceed to `determine_next_action`.

**Gate 1: Unresolved checkpoint**
```bash
[ -f .planning/.continue-here.md ]
```
If found:
```
Stop: Unresolved checkpoint

`.planning/.continue-here.md` exists — a previous session left
unfinished work. Read it, resolve, then delete to continue.
Use `--force` to bypass.
```
Exit.

**Gate 2: Error state**
Check STATE.md for `status: error` or `status: failed`.
If found:
```
Stop: Project in error state

Resolve the error before advancing. Run `/rihal:health` to diagnose.
Use `--force` to bypass.
```
Exit.

**Gate 3: Unchecked verification**
Check if current phase has VERIFICATION.md with FAIL items:
If found:
```
Stop: Unchecked verification failures

Phase {N} has {count} unresolved failures. Address them first.
Use `--force` to bypass.
```
Exit.
</step>

<step name="determine_next_action">
Apply routing rules based on state:

**Route 1: No phases exist yet**
ROADMAP.md exists but no phase directories on disk:
Next: `/rihal:sprint-planning`

**Route 2: Phase exists but no sprint**
Current phase directory exists but has no SPRINT.md:
Next: `/rihal:sprint-planning --phase {current_phase}`

**Route 3: Sprint exists, stories incomplete**
SPRINT.md exists and has stories with status != done:
Next: `/rihal:execute .planning/phases/{phase_dir}/SPRINT.md`

**Route 4: All stories done, sprint not closed**
All stories are done but sprint status is still "active":
Next: complete the sprint via `rihal-tools.cjs state sprint complete`, then suggest `/rihal:sprint-planning` for next sprint

**Route 5: Sprint complete, next phase exists**
Current phase is complete, next phase exists in ROADMAP:
Next: `/rihal:sprint-planning --phase {next_phase}`

**Route 6: All phases complete**
All phases in ROADMAP are complete:
Next: `/rihal:complete-milestone`

**Route 7: Paused**
State shows paused_at is set:
Next: `/rihal:resume-work`

**Route 8: No sprint system, fallback**
State has no sprints[] data — legacy or empty project:
Next: `/rihal:sprint-planning`
</step>

<step name="show_and_execute">
Display the determination:

```
## Rihal Next

**Current:** Phase {N} — {name} | Sprint {sprint_id}
**Sprint:** {done}/{total} stories ({points_done}/{points_total} pts)

Next: `/rihal:{command} {args}`
  {One-line explanation}
```

Then immediately invoke the determined command.
Do not ask for confirmation — `/rihal:next` is zero-friction advancement.
</step>

</process>

<success_criteria>
- [ ] Project state correctly detected
- [ ] Next action correctly determined from routing rules
- [ ] Command invoked immediately without user confirmation
- [ ] Clear status shown before invoking
</success_criteria>
