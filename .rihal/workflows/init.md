# Workflow: rihal:init

<purpose>
Begin the rihla. This is the first command a user runs after dropping Rihal files into a project. It detects project state, asks a handful of configuration questions, scans existing context (if any), writes `.rihal/RIHLA.md` as the journey baseline, and routes to the right next command.

This replaces the older `/rihal:generate-project-context` workflow — init is the single entry point for configuring Rihal in a project.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` contains only `--help` or `-h`:

```
Usage: /rihal:init [--reset] [--skip-scan]

  --reset        overwrite existing .rihal/config.yaml and RIHLA.md
  --skip-scan    skip the codebase scan step

Examples:
  /rihal:init                  # first-time setup for this project
  /rihal:init --reset          # reconfigure from scratch
  /rihal:init --skip-scan      # config only, no codebase read
```

STOP here if just help was requested.

## Step 1 — Greet and detect state

Print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  السلام عليكم — Rihal init
  Configuring your rihla (journey)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Run detection in parallel:

```bash
# Rihal presence
test -f .rihal/config.yaml && echo "rihal-configured: yes" || echo "rihal-configured: no"
test -f .rihal/state.json && echo "state-present: yes" || echo "state-present: no"
test -f .rihal/RIHLA.md && echo "rihla-present: yes" || echo "rihla-present: no"

# Project presence
test -d .git && echo "git: yes" || echo "git: no"
ls package.json pyproject.toml Cargo.toml go.mod 2>/dev/null | head -3
find . -maxdepth 2 -type d \( -name src -o -name app -o -name lib \) 2>/dev/null | head -3

# Git history depth (if present)
git log --oneline 2>/dev/null | wc -l
```

Classify project into one of four states:

| State | Signal | Suggested next step |
|-------|--------|---------------------|
| `fresh` | No code, no git, no rihal | `/rihal:new-project` — let's design it |
| `existing-new-rihal` | Has code + git, no rihal | `/rihal:scan` or `/rihal:council` — understand before changing |
| `returning` | Rihal already configured | `/rihal:resume-work` or `/rihal:next` |
| `reset` | User passed `--reset` flag | Proceed with full reconfigure |

Print one-line state summary:

```
📁 State: {state}  |  Code: {detected or none}  |  Git: {commits or none}  |  Rihla: {present or new}
```

If `state === "returning"` and `--reset` not passed:

```
✓ Rihal is already configured here.

What next?
  /rihal:resume-work    — pick up where you left off
  /rihal:status         — see the dashboard
  /rihal:next           — suggested next action

Or run with --reset to reconfigure.
```

STOP here unless `--reset` was passed.

## Step 2 — Ask the questions

Use AskUserQuestion (one batched question with multiple fields if the tool supports; otherwise sequential).

**Pre-fill from existing `.rihal/config.yaml` if present, otherwise from defaults.**

Questions:

1. **Your name** (what Rihal calls you in state artifacts)
   - Default: `$USER` environment variable
2. **Communication language** (how agents talk to you)
   - Options: English, Urdu, Arabic, Roman Urdu, Mixed
   - Default: English
3. **Mode** (how Rihal proceeds at decision gates)
   - Options: `guided` (confirm at each gate), `yolo` (proceed autonomously)
   - Default: guided
4. **Model profile** (agent cost vs quality tradeoff)
   - Options: `quality` (opus for reasoning), `balanced` (sonnet), `budget` (haiku), `inherit` (use parent model)
   - Default: balanced
5. **Branching strategy** (how code commits land)
   - Options: `none` (current branch), `feature-branch` (one per phase), `worktree-isolation` (parallel-safe)
   - Default: none

## Step 3 — Write config + state seed

Write `.rihal/config.yaml` via `rihal-tools.cjs config set` (not direct file write):

```bash
node .rihal/bin/rihal-tools.cjs config set --key user_name --value "{name}"
node .rihal/bin/rihal-tools.cjs config set --key project_name --value "$(basename $(pwd))"
node .rihal/bin/rihal-tools.cjs config set --key communication_language --value "{lang}"
node .rihal/bin/rihal-tools.cjs config set --key mode --value "{mode}"
node .rihal/bin/rihal-tools.cjs config set --key model_profile --value "{profile}"
node .rihal/bin/rihal-tools.cjs config set --key git.branching_strategy --value "{strategy}"
```

Initialize state.json if missing:

```bash
test -f .rihal/state.json || node .rihal/bin/rihal-tools.cjs state init --project "$(basename $(pwd))"
```

## Step 4 — Scan existing context (skip if `--skip-scan`)

If the project has code (from Step 1 detection), produce `.rihal/RIHLA.md`. This is the journey baseline — a lightweight snapshot, not a full audit. Use `/rihal:map-codebase` or `/rihal:scan` later for deep analysis.

Gather (parallel reads, all bounded):

```bash
test -f README.md && head -80 README.md
test -f package.json && head -60 package.json
test -f pyproject.toml && head -40 pyproject.toml
test -f Cargo.toml && head -30 Cargo.toml
test -f go.mod && head -20 go.mod
test -f .env.example && head -30 .env.example
git log --oneline -15 2>/dev/null
git remote -v 2>/dev/null | head -2
find . -maxdepth 3 -type d ! -path "./node_modules*" ! -path "./.git*" ! -path "./.rihal*" ! -path "./.claude*" ! -path "./.planning*" 2>/dev/null | head -20
```

Write `.rihal/RIHLA.md` following this template (don't over-interpret — just record what's seen):

```markdown
# RIHLA — Project journey baseline

**Written by:** /rihal:init
**Date:** {ISO date}
**Project:** {project_name}
**Detected state:** {fresh | existing-new-rihal | returning}

## At a glance

- **Primary language:** {detected from files: JS/TS/Python/Go/Rust/etc or "none yet"}
- **Framework signals:** {Next.js / Django / Express / etc, if obvious from package.json}
- **Git history:** {N commits, first: YYYY-MM-DD, last: YYYY-MM-DD} or "not a git repo"
- **Top-level dirs:** {list of ~8 most relevant}

## What's here

{80-line README excerpt, or "no README" if absent}

## Dependencies (from package manifest)

{top 15 dependencies with one-line context — NOT all of them}

## Recent work (last 10 commits)

{git log oneline, or "no commits yet"}

## Not scanned

This file is a journey baseline — intentionally shallow. For deep analysis run:
- `/rihal:map-codebase` — structured codebase documents per focus area
- `/rihal:scan` — rapid codebase assessment
- `/rihal:explore` — socratic ideation against the codebase
```

If no code detected, write a minimal RIHLA.md with just the header and a "fresh project — no code yet" note.

## Step 5 — Suggest the next step

Print a contextual recommendation, **one line of copy-paste per suggestion** (per `.rihal/references/command-redirect-format.md`):

**If `fresh`:**
```
✓ Rihal configured. Your journey begins.

Ready to design a new project? Try:

/rihal:new-project {your-project-name}

Or think through an idea first:

/rihal:explore what should I build?
```

**If `existing-new-rihal`:**
```
✓ Rihal configured. RIHLA.md written as your baseline.

Recommended first move — understand before changing:

/rihal:scan

Or strategic question about the codebase:

/rihal:council {your question}
```

**If `returning` with `--reset`:**
```
✓ Rihal reconfigured. Prior state preserved in state.json.

Pick up where you left off:

/rihal:resume-work
```

## Step 6 — Update state

```bash
node .rihal/bin/rihal-tools.cjs state record-session 2>/dev/null || true
```

Silent if state tools fail.

## Success Criteria

- [ ] `.rihal/config.yaml` written with user's answers
- [ ] `.rihal/state.json` exists (created or preserved)
- [ ] `.rihal/RIHLA.md` written (unless `--skip-scan` or no code)
- [ ] State detected correctly (fresh / existing-new-rihal / returning)
- [ ] Contextual next-step suggestion printed as single-line copy-paste

## On Error

- **AskUserQuestion unavailable:** fall back to reading defaults from env / existing config and skip the interactive step.
- **config.yaml write fails:** print permission error and stop.
- **git not installed:** skip git detection, still proceed.
- **rihal-tools.cjs not found:** this command requires the installer to have run — point user to `install-v2.js`.
- **Existing RIHLA.md without `--reset`:** do NOT overwrite; note it in Step 4 output.
