# Workflow: rihal:settings

<purpose>
Interactive configuration wizard for Rihal project settings. Collects user preferences for model profile, research strategy, execution gates, and branching strategy, then writes them back to .rihal/config.yaml.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:settings <argument-here>
```

**Examples:**
```
/rihal:settings example 1
/rihal:settings example 2
```

STOP — do not proceed.

<available_tools>
- AskUserQuestion — collect user input
- Read — read current config.yaml
- Write — write updated config.yaml
- Bash — validate git state if needed
</available_tools>

## Step 1 — Initialize

Load current settings from `.rihal/config.yaml`:

```bash
[ -f .rihal/config.yaml ] && cat .rihal/config.yaml || echo "# No config yet"
```

Parse the config to extract current values:
- `model_profile` (default: "balanced")
- `enable_research_pre_step` (default: "false")
- `enable_plan_checker_loop` (default: "true")
- `enable_post_execute_verifier` (default: "false")
- `branching_strategy` (default: "none")

Store these as `current_*` variables for pre-fill use.

## Step 2 — Collect Settings

Use AskUserQuestion to prompt the user for each setting. Pre-fill current values where applicable.

### Setting 1: Model Profile

```
Question:
Which model profile would you like to use?

Options:
  1. quality (Opus for reasoning agents, Sonnet for executor, Haiku for utilities)
  2. balanced (Sonnet across the board) [CURRENT]
  3. budget (Haiku across the board)
  4. inherit (Use parent session model, no override)

Your choice: [pre-filled with current_model_profile]
```

Valid responses: 1, 2, 3, 4, or exact names (quality, balanced, budget, inherit).
Map numeric choices to profile names. Store as `new_model_profile`.

### Setting 2: Enable Research Pre-step

```
Question:
Enable research pre-step in /rihal:plan by default?

This runs a research phase before planning if enabled, providing additional context.

Options:
  1. Yes
  2. No [CURRENT]

Your choice:
```

Valid responses: 1/yes/y or 2/no/n. Store as `new_enable_research_pre_step` (true/false string).

### Setting 3: Enable Plan-Checker Loop

```
Question:
Enable sprint-checker loop during /rihal:plan?

This verifies and repairs plans before execution if enabled.

Options:
  1. Yes [CURRENT]
  2. No

Your choice:
```

Valid responses: 1/yes/y or 2/no/n. Store as `new_enable_plan_checker_loop` (true/false string).

### Setting 4: Enable Post-Execute Verifier Gates

```
Question:
Enable post-execute verifier gates?

This runs verification after each task execution to catch regressions and issues.

Options:
  1. Yes
  2. No [CURRENT]

Your choice:
```

Valid responses: 1/yes/y or 2/no/n. Store as `new_enable_post_execute_verifier` (true/false string).

### Setting 5: Branching Strategy

```
Question:
What branching strategy should workflows use?

Options:
  1. none (No branching, work on current branch)
  2. feature-branch (Create feature branches, leave checkout to user)
  3. worktree-isolation (Use git worktrees for isolated work)

Your choice: [pre-filled with current_branching_strategy]
```

Valid responses: 1, 2, 3, or exact names (none, feature-branch, worktree-isolation).
Map numeric choices to strategy names. Store as `new_branching_strategy`.

## Step 3 — Write Config

After collecting all settings, write them back to `.rihal/config.yaml` using `rihal-tools.cjs config set`:

```bash
node .rihal/bin/rihal-tools.cjs config set --key model_profile --value "$new_model_profile"
node .rihal/bin/rihal-tools.cjs config set --key enable_research_pre_step --value "$new_enable_research_pre_step"
node .rihal/bin/rihal-tools.cjs config set --key enable_plan_checker_loop --value "$new_enable_plan_checker_loop"
node .rihal/bin/rihal-tools.cjs config set --key enable_post_execute_verifier --value "$new_enable_post_execute_verifier"
node .rihal/bin/rihal-tools.cjs config set --key branching_strategy --value "$new_branching_strategy"
```

## Step 4 — Confirm and Print

Print a summary of the new settings:

```
✓ Settings updated successfully!

Model Profile: $new_model_profile
Research pre-step: $new_enable_research_pre_step
Plan-checker loop: $new_enable_plan_checker_loop
Post-execute verifier: $new_enable_post_execute_verifier
Branching strategy: $new_branching_strategy

Settings saved to: .rihal/config.yaml
```

Print a tip:

```
Tip: Use /rihal:resume-work to reload config and continue work.
```

## Success Criteria

- [ ] Task completed as requested
- [ ] Output saved or reported
- [ ] State updated if necessary
- [ ] No errors encountered

## On Error

If arguments are invalid, missing files, or subagent fails:
- Validate inputs match expected format
- Check that required files exist
- Retry with clearer arguments or report the specific error to the user

