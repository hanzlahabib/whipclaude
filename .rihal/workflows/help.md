<purpose>
Display the Rihal command reference at the requested tier. Output ONLY the tier section. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
</purpose>

## Step 0 — Parse arguments

Read `$ARGUMENTS` and resolve to one of: `basic`, `intermediate`, `advanced`, `all`.

| Input | Tier shown |
|-------|------------|
| (empty) or `basic` or `1` | **TIER 1 — Basic** |
| `intermediate` or `int` or `2` | **TIER 2 — Intermediate** |
| `advanced` or `adv` or `3` | **TIER 3 — Advanced** |
| `all` or `full` | **All three tiers in sequence** |
| `--help` or `-h` | Show usage block, then exit |

Usage block:

```
Usage: /rihal:help [basic|intermediate|advanced|all]

  basic         Show the 8 essentials (default)
  intermediate  Show real-project ops (council, review, ship, capture)
  advanced      Show power tools (audits, workspaces, council variants, etc.)
  all           Show everything
```

## Step 1 — Render the requested tier

Output the matching `<tier-N>` block below verbatim. For `all`, output all three blocks separated by `---`.

---

<tier-1>
# Rihal — Tier 1 (Basic)

> **Rihal** is council-driven project automation built for solo agentic work in Claude Code.
> Tier 1 is everything you need to ship a small project end-to-end. **8 commands.**

## The loop

```
init → new-project → plan → execute → next → status → ship
```

## Commands

| Command | What it does |
|---------|--------------|
| `/rihal:init` | First-time setup in this repo. Detects state, asks config questions, writes `.rihal/RIHLA.md`. Run once per project. |
| `/rihal:new-project` | Take an idea to a planned roadmap. Questioning → optional research → REQUIREMENTS → ROADMAP. |
| `/rihal:plan <phase>` | Create executable plans for a phase. Produces `SPRINT.md` files. |
| `/rihal:execute <phase>` | Run all plans in a phase in dependency waves. Updates STATE on completion. |
| `/rihal:next` | Auto-route to the next logical step based on project state. Zero friction. |
| `/rihal:status` | Where am I — current phase, plan progress, recent decisions, blockers. |
| `/rihal:progress` | Visual progress + intelligent suggestion for next action. |
| `/rihal:help [tier]` | This reference. Add `intermediate`, `advanced`, or `all` for more. |

## Minimal happy path

```
/rihal:init
/rihal:new-project
/rihal:plan 1
/rihal:execute 1
/rihal:next
```

## Files Rihal creates

```
.planning/
├── PROJECT.md            # vision
├── REQUIREMENTS.md       # scoped requirements
├── ROADMAP.md            # phase breakdown
├── STATE.md              # project memory
└── phases/
    └── 01-foundation/
        ├── 01-01-SPRINT.md   # the plan
        └── 01-01-SUMMARY.md  # what got done
```

**Done with Tier 1?** → `/rihal:help intermediate` for council, review, ship, and capture.
</tier-1>

---

<tier-2>
# Rihal — Tier 2 (Intermediate)

> Real-project ops: strategic input, quality gates, capture, and session continuity.
> Assumes you know Tier 1. **~18 commands.**

## Strategy & input

| Command | When to use |
|---------|-------------|
| `/rihal:council <question>` | Strategic decision needing multiple perspectives — 3-5 agents debate in parallel, 2 rounds with cross-talk. |
| `/rihal:discuss <agent> <q>` | Quick single-agent sync — fast, conversational, no artifact. |
| `/rihal:discuss-phase <n>` | Gather context through adaptive questioning before planning. Produces CONTEXT.md. |
| `/rihal:explore <topic>` | Socratic ideation — think through ideas before committing to plans. |
| `/rihal:do <description>` | Smart router — natural language in, picks the right `/rihal:*` command. |

## Quality & shipping

| Command | When to use |
|---------|-------------|
| `/rihal:code-review` | Adversarial code review of changed files — bugs, security, style. |
| `/rihal:code-review-fix` | Auto-apply fixes from a code-review report. |
| `/rihal:verify-phase <n>` | Goal-backward audit — does the codebase deliver what the phase promised? |
| `/rihal:verify-work` | Conversational UAT against acceptance criteria. |
| `/rihal:ship` | Create PR, run review, prepare for merge after verification passes. |

## Phase & plan management

| Command | When to use |
|---------|-------------|
| `/rihal:show <id>` | Print a phase or plan in full with execution status. |
| `/rihal:add-phase <name>` | Append a new phase to the active milestone. |
| `/rihal:insert-phase <after> <name>` | Insert urgent decimal phase (e.g. 7.1) without renumbering. |
| `/rihal:remove-phase <n>` | Remove a future phase and renumber. |
| `/rihal:quick [flags]` | Small ad-hoc tasks with Rihal guarantees but skip optional agents. Flags: `--discuss`, `--research`, `--full`. |
| `/rihal:fast "<task>"` | Trivial inline task — typo, gitignore tweak, etc. No subagents, ≤3 file edits. |

## Capture & session continuity

| Command | When to use |
|---------|-------------|
| `/rihal:note "<text>"` | Zero-friction idea capture — appends to dated note file. |
| `/rihal:add-todo [desc]` | Capture an idea or task as a todo (infers from conversation if no arg). |
| `/rihal:check-todos [area]` | List pending todos and pick one to work on. |
| `/rihal:plant-seed "<idea>"` | Capture a forward-looking idea with trigger conditions — surfaces at the right milestone. |
| `/rihal:resume-work` | Restore project context after a break. |
| `/rihal:pause-work` | Create HANDOFF.json and continue-here.md before stopping mid-phase. |
| `/rihal:session-report` | Work summary, decisions, open blockers from this session. |

**Done with Tier 2?** → `/rihal:help advanced` for audits, workspaces, milestone ops, and power variants.
</tier-2>

---

<tier-3>
# Rihal — Tier 3 (Advanced)

> Power tools: milestone ops, parallel workspaces, audits, council variants, and rare ops.
> Assumes Tier 1 + 2. Use these when you know exactly what you need.

## Milestone lifecycle

| Command | Use |
|---------|-----|
| `/rihal:new-milestone` | Start the next milestone — initializes ROADMAP, REQUIREMENTS, STATE. |
| `/rihal:complete-milestone <ver>` | Archive milestone → move to `.planning/milestones/`. |
| `/rihal:milestone-summary` | Human-readable summary of all phases, decisions, outcomes. |
| `/rihal:audit-milestone` | Cross-phase audit — verify completion against original goals. |
| `/rihal:plan-milestone-gaps` | Create phases to close gaps from the audit. |
| `/rihal:cleanup` | Archive accumulated phase dirs from completed milestones. |

## Workspaces & parallel work

| Command | Use |
|---------|-----|
| `/rihal:new-workspace` | Isolated workspace with separate ROADMAP/STATE for parallel work. |
| `/rihal:list-workspaces` | List all active workspaces. |
| `/rihal:remove-workspace` | Delete a workspace and clean up artifacts. |
| `/rihal:workstream` | Manage parallel workstreams (milestone tracks). |

## Audits & specialty review

| Command | Use |
|---------|-----|
| `/rihal:secure-phase <n>` | Retroactively verify threat mitigations exist in code. |
| `/rihal:validate-phase <n>` | Audit Nyquist validation gaps for a completed phase. |
| `/rihal:add-tests <n>` | Generate unit + E2E tests based on SPRINT/SUMMARY/CONTEXT. |
| `/rihal:audit-uat` | Cross-phase audit of all outstanding UAT items. |
| `/rihal:audit-fix` | Autonomous audit-to-fix pipeline — find, classify, fix, test, commit. |
| `/rihal:karpathy-audit` | Audit recent code against Karpathy's 4 LLM coding principles. |
| `/rihal:ui-phase <n>` | Generate UI design contract (UI-SPEC.md) for frontend phases. |
| `/rihal:ui-review` | Retroactive 6-pillar visual audit of completed UI work. |
| `/rihal:review-adversarial` | Hostile-perspective report — vulnerabilities, race conditions, abuse. |
| `/rihal:review-edge-case-hunter` | Enumerate edge cases by category and severity. |
| `/rihal:review` | Cross-AI peer review — invoke external AI CLIs to review plans. |

## Council variants & strategy power tools

| Command | Use |
|---------|-----|
| `/rihal:discuss-phase-power` | Bulk question generation with async UI for context-heavy phases. |
| `/rihal:chain <preset> <topic>` | Sequential agent pipeline (research → scope → build), typed artifacts. |
| `/rihal:brainstorm` | Guided brainstorming — pick a method, generate ideas systematically. |
| `/rihal:why <decision>` | Explain reasoning behind a decision, classification, or panel pick. |

## Document, scaffold, integrate

| Command | Use |
|---------|-----|
| `/rihal:map-codebase` | Brownfield: parallel Explore agents → 7 codebase docs. |
| `/rihal:scan` | Rapid codebase assessment — lighter than map-codebase. |
| `/rihal:document-project` | Audit missing/stale docs, file SPRINT tasks for each gap. |
| `/rihal:docs-update` | Generate or update docs verified against codebase. |
| `/rihal:install <module>` | Install a Rihal capability bundle into the project. |
| `/rihal:enable-hooks` | Install optional Rihal hooks into `.claude/settings.json`. |
| `/rihal:scaffold-project` | Scaffold a new project from the official Rihal template. |
| `/rihal:bootstrap` | Bootstrap repo with Vercel-linked resources and integrations. |

## Story-level epics workflow

| Command | Use |
|---------|-----|
| `/rihal:create-prd` | Create a PRD from scratch through guided facilitation. |
| `/rihal:edit-prd` | Update an existing PRD with revisions or clarifications. |
| `/rihal:validate-prd` | Validate an existing PRD for completeness and consistency. |
| `/rihal:create-epics-and-stories` | Parse a PRD into numbered epic + story files. |
| `/rihal:create-story` | Prepare a dev-ready STORY.md with full implementation context. |
| `/rihal:dev-story <file>` | Execute an approved STORY by writing tests + code per AC. |
| `/rihal:check-implementation-readiness` | Verify PRD + architecture + epics aligned before build. |
| `/rihal:create-architecture` | Write an Architecture Decision Record (ADR). |
| `/rihal:create-ux-design` | Realize a UX design that informs architecture and implementation. |
| `/rihal:correct-course` | Course-correct mid-sprint when major change is discovered. |
| `/rihal:sprint-planning` | Compute capacity, prioritize stories, create SPRINT.md. |
| `/rihal:sprint-status` | Sprint progress — stories, points, velocity, burndown. |
| `/rihal:list-plans` | Table of every SPRINT.md across phases — goal, stories, points, state. |
| `/rihal:decisions` | Browse decisions across every Rihal project (~/.rihal/decisions.jsonl). |
| `/rihal:replay <slug>` | Re-run a past council session with the same question — fresh panel round. |
| `/rihal:export-to-github` | Push phases/stories/decisions to GitHub issues (wraps `rihal-code github-sync`). |
| `/rihal:notify-test` | Verify Slack/Discord/MS Teams webhook wiring — posts a test message. |
| `/rihal:from-template <type>` | Seed .planning/ from a starter template (saas-b2b, api-backend, mobile-app). |
| `/rihal:retrospective` | Run an epic retrospective and produce owned action items. |

## Operational / rare

| Command | Use |
|---------|-----|
| `/rihal:debug "<issue>"` | Systematic debugging with persistent state across `/clear`. |
| `/rihal:forensics` | Diagnose incomplete executions — timeline of what broke. |
| `/rihal:undo <id>` | Safe git revert for a phase or plan with dependency checks. |
| `/rihal:rerun <id>` | Re-execute a phase or plan, resetting state, fresh commits. |
| `/rihal:diff <a> <b>` | Show changes to plans and state between commits. |
| `/rihal:import <path>` | Ingest external plans with conflict detection against decisions. |
| `/rihal:inbox` | Triage incoming issues and PRs against contribution templates. |
| `/rihal:pr-branch` | Create clean PR branch — filter out `.planning/` commits. |
| `/rihal:autonomous` | Run remaining phases autonomously — plan → execute → verify cycles. |
| `/rihal:research-phase <n>` | Standalone research (usually use `/rihal:plan` instead). |
| `/rihal:analyze-dependencies` | Suggest "Depends on" entries for ROADMAP.md. |
| `/rihal:list-phase-assumptions <n>` | Surface agent's intended approach before planning. |
| `/rihal:profile-user` | Classify developer on 4 dimensions, produce profile artifact. |
| `/rihal:dashboard` | Start the Diwan view-only dashboard (port 7717). |
| `/rihal:health` | 6-point health check of the Rihal installation. |
| `/rihal:stats` | Phases, plans, decisions, council sessions, timeline. |
| `/rihal:settings` | Interactive config wizard — model profile, gates, branching. |
| `/rihal:config` | View or edit Rihal configuration directly. |
| `/rihal:update` | Update Rihal to latest version with changelog preview. |
| `/rihal:note` | (also Tier 2) Inline note capture. |

## Common compound flows

**New project (full quality):**
```
/rihal:new-project → /clear → /rihal:plan 1 → /clear → /rihal:execute 1 → /rihal:verify-phase 1 → /rihal:ship
```

**Mid-milestone urgent work:**
```
/rihal:insert-phase 5 "Critical security fix" → /rihal:plan 5.1 → /rihal:execute 5.1
```

**Resume after break:**
```
/rihal:resume-work   # or just /rihal:next
```

**Debug across context resets:**
```
/rihal:debug "form submission fails" → ...investigation... → /clear → /rihal:debug   # resumes
```

**Complete + start next milestone:**
```
/rihal:audit-milestone → /rihal:plan-milestone-gaps → /rihal:complete-milestone 1.0.0 → /rihal:new-milestone
```

## Configuration reference

`.planning/config.json`:

```json
{
  "mode": "interactive",            // or "yolo"
  "planning": {
    "commit_docs": true,            // false = .planning/ kept local
    "search_gitignored": false      // true = ripgrep with --no-ignore
  }
}
```

## Where to find context

- `.planning/PROJECT.md` — vision
- `.planning/STATE.md` — current memory
- `.planning/ROADMAP.md` — phase status
- `.planning/RETROSPECTIVE.md` — living retrospective
- `.planning/codebase/` — brownfield maps (STACK, ARCHITECTURE, etc.)

**End of reference.**
</tier-3>

## Success Criteria

- [ ] Correct tier section is rendered based on `$ARGUMENTS`
- [ ] No extra analysis, commentary, or project state added
- [ ] "Next tier" pointer present at end of Tier 1 and Tier 2
- [ ] `all` renders all three tiers separated by `---`
- [ ] Unknown args fall back to Tier 1 silently (do not error)

## On Error

- If unable to load or render reference: display fallback `See rihal/workflows/help.md for full reference`
- Handle missing sections gracefully without breaking output
