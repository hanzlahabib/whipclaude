# Rihal Executor: Execution Flow Details

## Full Step-by-Step Execution

### Step 1: Load Project State
Extract project state using the initialization tool:
```bash
INIT=$(node ".rihal/bin/rihal-tools.cjs" init execute "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

From the response, extract:
- `executor_model`: Model/agent name to use for execution
- `commit_docs`: Documentation style for commits
- `sub_repos`: Any sub-repositories to manage
- `phase_dir`: Phase directory path
- `plans`: Available plans for execution
- `incomplete_plans`: Plans that need continuation

Read `.planning/STATE.md` to determine:
- Current position in plan execution
- Any previous decisions made
- Known blockers or issues

### Step 2: Load Plan Metadata
Parse the SPRINT.md frontmatter to extract:
- `phase`: Phase identifier
- `plan`: Plan number
- `type`: Execution type (execute, tdd)
- `autonomous`: Whether plan has checkpoints
- `wave`: Execution wave number
- `depends_on`: Plan dependencies
- `requirements`: Requirement IDs being addressed

If CONTEXT.md is referenced in the plan, read it to understand the broader vision and any special instructions.

### Step 3: Determine Execution Pattern

**Pattern A: No Checkpoints**
- Tasks are all `type="auto"`
- Execute all tasks sequentially
- Create SUMMARY.md at end
- Update STATE.md with completion
- No human pauses

**Pattern B: Has Checkpoints**
- One or more tasks are `type="checkpoint:*"`
- Execute until first checkpoint
- STOP and return structured checkpoint message
- Wait for user response
- Resume from checkpoint (continuation handling)

**Pattern C: Continuation**
- Prompt contains `<completed_tasks>` with task hashes
- Verify those commits exist in git history
- DO NOT redo completed tasks
- Start from next incomplete task
- Handle based on checkpoint type (verify, decision, action)

### Step 4: Execute Tasks
For each task in sequence:

1. **If type="auto":**
   - Read task `<files>`, `<action>`, `<verify>`, `<done>`
   - Implement exactly as specified
   - If TDD mode: Follow RED→GREEN→REFACTOR
   - Commit individually with task name
   - Record commit hash
   - Move to next task

2. **If type="checkpoint:*":**
   - Complete all tasks up to this one
   - Prepare checkpoint response
   - STOP execution
   - Return checkpoint message
   - Wait for user input

3. **After each task completion:**
   - Verify criteria met
   - Check git status clean
   - Record state for recovery
   - **Append execution log:** Append to `.planning/{plan-dir}/EXECUTION-LOG.md`:
     ```
     {ISO timestamp} | {task-id} | completed | {commit-sha}
     ```
     This enables resume-work to see progress if executor crashes
   - Continue to next

### Step 5: Summary Creation (Pattern A only)
After all auto tasks complete:
1. Create SUMMARY.md at `.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md`
2. Use @.rihal/templates/summary.md as template
3. List completed tasks with commit hashes
4. Document any deviations from plan
5. Record metrics (task count, file count, duration)
6. Self-check: verify counts match
7. **After every 3 tasks completed**, write a checkpoint:
   - Create `.planning/{plan-dir}/SUMMARY-PARTIAL.md` with tasks 1-3, 4-6, etc.
   - This allows safe recovery if executor crashes mid-plan
   - Final SUMMARY.md integrates all partials

### Step 6: State Updates
```bash
node ".rihal/bin/rihal-tools.cjs" state advance-plan
node ".rihal/bin/rihal-tools.cjs" state update-progress
node ".rihal/bin/rihal-tools.cjs" state record-metric --phase "$PHASE" --plan "$PLAN" --duration "$DURATION" --tasks "$COUNT" --files "$FILES"
node ".rihal/bin/rihal-tools.cjs" roadmap update-plan-progress "$PHASE_NUMBER"
node ".rihal/bin/rihal-tools.cjs" requirements mark-complete $REQ_IDS
```

Extract requirement IDs from SPRINT.md frontmatter `requirements:` field.

### Step 7: Final Commit
```bash
node ".rihal/bin/rihal-tools.cjs" commit "docs({phase}-{plan}): complete [plan-name] plan" --files .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md
```
