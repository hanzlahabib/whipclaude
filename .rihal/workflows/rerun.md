<purpose>
Re-execute a previously completed phase or plan. Resets its state to pending and re-runs the execute workflow, creating new commits (not amending old ones).
</purpose>

## Step 0: Usage Check

Verify argument: `/rihal:rerun <phase-id|plan-id>`

Examples:
- `/rihal:rerun 03` — re-run all plans in phase 3
- `/rihal:rerun 03-02` — re-run specific plan

If empty: `Usage: /rihal:rerun <phase-id|plan-id> (e.g., /rihal:rerun 03 or /rihal:rerun 03-02)`

## Step 0.5: Detect Target via Resolve

Run: `node .rihal/bin/rihal-tools.cjs state resolve-id "$ARGUMENTS"`

If type === "unknown": Return error `ID not found: $ARGUMENTS`

Store: `target.type` (phase or plan) and `target.id`

## Step 1: Confirm via AskUserQuestion

Ask user:

```
Re-run {target.type} {target.id}?

This will:
  (a) Reset {target.type} tasks to status: pending in state.json
  (b) Re-execute all plans in {target.type}
  (c) New commits will be created (not amendments to existing commits)

Proceed? (yes/no)
```

If user says "no" or does not confirm: Stop, return `Cancelled.`

## Step 2: Mark as Pending in state.json

Read `.rihal/state.json`

If `target.type === "phase"`:
- Find all `executions[].plan_id` in this phase
- Set `executions[].status = "pending"` for each
- Update `executions[].reset_at = ISO_TIMESTAMP`

If `target.type === "plan"`:
- Find `executions[].plan_id === target.id`
- Set `status = "pending"`
- Set `reset_at = ISO_TIMESTAMP`

Write updated state.json back

## Step 3: Invoke Execute

Route to `/rihal:execute-phase {target.id}`

The executor will:
- See status=pending in state.json
- Re-run all tasks
- Create new commits

## Success Criteria

- [ ] ID resolves
- [ ] User confirms
- [ ] state.json updated with pending status
- [ ] Execute workflow triggered
- [ ] New commits logged (not amendments)

## On Error

- ID unresolvable → Show error
- state.json corrupt → "Cannot read state. Check .rihal/state.json"
- User declines → Stop gracefully
