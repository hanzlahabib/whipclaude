# rihal-create-milestone — Steps

This skill uses the same step-file architecture as `rihal-create-prd` and `rihal-create-epics-and-stories`.

## Status

- All 10 step files are **implemented and production-ready** as of #134.
- Scaffolded in #129; completed in #134; compliance re-verified in #137.
- If a step is missing from this directory at runtime, re-install the package — do not fall back to inline generation.

## Expected Step Files (per workflow.md)

| # | File | Purpose |
|---|------|---------|
| 1 | `step-01-init.md` | Load PRD, detect continuation, init frontmatter |
| 2 | `step-02-outcomes.md` | Extract major outcomes from PRD; user confirms |
| 3 | `step-03-sequencing.md` | Group outcomes into milestones; agree cut lines |
| 4 | `step-04-windows.md` | Assign date windows; verify realism |
| 5 | `step-05-kill-criteria.md` | Binary kill criteria per milestone |
| 6 | `step-06-phase-stubs.md` | Stub phases under each milestone |
| 7 | `step-07-backlog.md` | Parking-lot items |
| 8 | `step-08-write-roadmap.md` | Append milestones to ROADMAP.md |
| 9 | `step-09-state-sync.md` | Upsert into `.rihal/state.json` (see `_shared/state-sync-rule.md`) |
| 10 | `step-10-complete.md` | Summary + hand-off |

## Conventions

- Each step halts at a menu: `[A]ccept / [P]ropose change / [C]ontinue`.
- Each step updates `stepsCompleted` in ROADMAP.md frontmatter before loading the next.
- External citations require `WebFetch` (see `_shared/research-citation-rule.md`).
