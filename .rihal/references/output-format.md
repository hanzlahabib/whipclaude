<ui_patterns>

Visual patterns for user-facing Rihal output. Orchestrators @-reference this file.

## Stage Banners

Use for major workflow transitions.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Stage names (uppercase):**
- `ROUTING`
- `QUESTIONING`
- `RESEARCHING`
- `PLANNING SPRINT {NN.S}`
- `EXECUTING WAVE {N}`
- `VERIFYING SPRINT {NN.S}`
- `SPRINT {NN.S} COMPLETE ✓`
- `PHASE {NN} COMPLETE ✓`
- `MILESTONE COMPLETE 🎉`
- `COUNCIL CONVENING`
- `MAJLIS CONVENING`
- `BROWNFIELD DETECTED`
- `ERROR`

---

## Routing Output (for /rihal:do, /rihal:next, /rihal:progress)

Use this when a router command dispatches to another command:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: {user's question or intent}
Scope: {one-line summary of detected scope}
{optional: Blocker: {any blockers detected}}

Routing to: /rihal:{target-command}
Reason: {one-line why this command fits}

Handing off to the workflow now.
```

---

## Checkpoint Boxes

User action required. 62-character width.

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝

{Content}

──────────────────────────────────────────────────────────────
→ {ACTION PROMPT}
──────────────────────────────────────────────────────────────
```

**Types:**
- `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
- `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
- `CHECKPOINT: Action Required` → `→ Type "done" when complete`

---

## Status Symbols

```
✓  Complete / Passed / Verified
✗  Failed / Missing / Blocked
◆  In Progress
○  Pending / Planned
⚡ Auto-approved
⚠  Warning
🎉 Milestone complete (only in banner)
▶  Next up / active selection
```

---

## Progress Display

**Phase/milestone level:**
```
Progress: ████████░░ 80%
```

**Story level:**
```
Stories: 2/4 done
```

**Sprint level:**
```
Sprint 01.1: 8/13 points ████████░░░░░ 61%
```

**Velocity:**
```
Velocity: avg 11 pts (last 3 sprints)
```

---

## Spawning Indicators

```
◆ Spawning rihal-executor...

◆ Spawning 4 researchers in parallel...
  → Stack research
  → Features research
  → Architecture research
  → Pitfalls research

✓ rihal-executor complete: SUMMARY.md written
```

---

## TODO Lists (MANDATORY for multi-step workflows)

Any workflow with 3+ discrete steps MUST use `TaskCreate` to show a visible
todo list, and `TaskUpdate` as each completes. This gives users live
visibility into progress.

**Pattern at workflow start:**

```
TaskCreate: "Collect workflow config"
TaskCreate: "Write PROJECT.md"
TaskCreate: "Run domain research (4 parallel agents)"
TaskCreate: "Define REQUIREMENTS.md"
TaskCreate: "Build ROADMAP.md"
TaskCreate: "Finalize state + commit"
```

**As each completes, update status:**

```
TaskUpdate(taskId: <N>, status: "completed")
```

**Display pattern:**

```
✔ Map codebase: spawn 4 parallel mappers
✔ Collect workflow config (mode, granularity, git, agents)
◼ Write and commit PROJECT.md           ← currently in_progress
◻ Run domain research (4 parallel agents + synthesizer)
◻ Define REQUIREMENTS.md
◻ Spawn rihal-roadmapper to build ROADMAP.md
◻ Finalize: STATE.md, CLAUDE.md refresh, commit
```

**Status symbols in TODO lists:**
- `✔` completed
- `◼` in_progress (exactly one active)
- `◻` pending
- `✗` failed / blocked

**Rule:** Never leave all tasks in `pending` after starting. Always mark
one `in_progress` before beginning work on it, and `completed` immediately
after finishing (not batched at the end).

---

## Insight Block (pre-execution observations)

When a workflow inspects state/plans/scope before acting, emit a compact
insight block with 2-3 load-bearing observations. Format exactly:

```
★ Insight ─────────────────────────────────────
  - {observation 1: specific scope reality with files/IDs}
  - {observation 2: overlap / forced sequential / blocker}
  - {observation 3: checkpoint or human-in-loop flag}
─────────────────────────────────────────────────
```

Rules:
- Exactly 2-3 bullets (never 1, never 4+)
- Name specific file paths, plan IDs, agent names
- No generic advice ("consider testing", "might be slow")
- No restating what user already asked for

Use before Execution Plan tables and Three-Options blocks.

---

## Execution Plan Table (before multi-step work)

Render waves × plans with autonomy flags:

```
Execution Plan

Phase {NN}: {name} — {N} plans across {M} waves.

┌──────┬───────┬───────────────┬──────────────────────────────────────┐
│ Wave │ Plan  │   Autonomy    │           What it builds             │
├──────┼───────┼───────────────┼──────────────────────────────────────┤
│ 1    │ NN-01 │ 🛑 checkpoint │ {one-line outcome}                   │
│ 1    │ NN-02 │ auto          │ {one-line outcome}                   │
│ 2    │ NN-03 │ auto          │ {one-line outcome}                   │
└──────┴───────┴───────────────┴──────────────────────────────────────┘
```

Below table: one-line reality check about scope size, then one-line flag
for any wave forced to sequential and why (file overlaps, auth gates).

---

## Three-Options Block (before long-running execution)

Offer autonomy tradeoffs via AskUserQuestion:

- **A) Autonomous** — subagent per plan, fastest, highest token cost, least visibility
- **B) Interactive** (`--interactive`) — inline execution, pair-programming, lower cost, catches mistakes early
- **C) Wave-only** (`--wave N`) — staged, review between waves, lowest risk

Always end with a recommendation line: `My recommendation: {letter} because {one-clause reason}.`

Never silently pick for the user on large scope.

---

## Next Up Block

Always at end of major completions.

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**{Identifier}: {Name}** — {one-line description}

`/clear` then:

`{copy-paste command}`

───────────────────────────────────────────────────────────────

**Also available:**
- `/rihal:alternative-1` — description
- `/rihal:alternative-2` — description

───────────────────────────────────────────────────────────────
```

---

## Error Box

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

{Error description}

**To fix:** {Resolution steps}
```

---

## Tables

Use standard markdown pipe tables with status symbols:

```
| Phase | Status | Sprints | Progress |
|-------|--------|---------|----------|
| 01    | ✓      | 2/2     | 100%     |
| 02    | ◆      | 1/3     | 33%      |
| 03    | ○      | 0/2     | 0%       |
```

---

## Rihal-Specific Elements

**Majlis banner** (multi-agent council):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► MAJLIS CONVENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Agent header** (when an agent responds in council/discuss):
```
🧭 **Sadiq (صادق) — Director of Strategy:**
```

Use agent emoji + bilingual name prefix once per turn. No repeat in same response.

---

## Anti-Patterns

- Varying box/banner widths within same output
- Mixing banner styles (`===`, `---`, `***`)
- Skipping `RIHAL ►` prefix in stage banners
- Random emoji (`🚀`, `✨`, `💫`) outside the approved set
- Missing Next Up block after workflow completions
- Hardcoding references to other methodologies in rihal's UX

</ui_patterns>
