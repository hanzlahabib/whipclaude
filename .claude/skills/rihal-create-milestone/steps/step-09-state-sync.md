# Step 9: Sync ROADMAP into state.json

**Progress: Step 9 of 10** — Next: Completion summary

## STEP GOAL

Call the state-sync CLI so `.rihal/state.json` reflects every milestone and phase we just wrote to `ROADMAP.md`. This closes the drift loophole documented in issue #126 and enforced by `_shared/state-sync-rule.md`.

## MANDATORY RULES

- 🛑 This step MUST run. Skipping it leaves `/rihal:status` and `/rihal:progress` showing stale data.
- 🛑 Report the sync result (pulled phases, existing phases updated, any errors) to the user.

## SEQUENCE

### 1. Run the sync

```bash
node .rihal/bin/rihal-tools.cjs state sync --from-disk
```

### 2. Parse and report

Expected JSON output shape:

```json
{
  "ok": true,
  "synced": true,
  "milestones_found": 3,
  "phases_found": 10,
  "phases_upserted": 10,
  "epics_found": 0,
  "roadmap_exists": true,
  "epics_exists": false
}
```

Report to the user:

```
State sync complete:
  Milestones:       3
  Phases:          10
  Phases upserted: 10 (new)
  Epics:            0 (none yet — run /rihal:create-epics-and-stories next)
```

### 3. Verify drift closed

Run a sanity check:

```bash
node .rihal/bin/rihal-tools.cjs state read | grep -E '"phases":|"name":'
```

Confirm the phase count matches what ROADMAP.md shows. If not, surface a warning and tell the user to run `state sync --from-disk` again or check for markdown malformation.

### 4. Advance

- Update `stepsCompleted`: add `step-09-state-sync`.
- Load `./step-10-complete.md`.
