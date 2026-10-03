---
main_config: '{project-root}/.rihal/config.json'
outputFile: '{planning_artifacts}/ROADMAP.md'
inputFile: '{planning_artifacts}/prd.md'
---

# Create Milestone / Roadmap Workflow

**Goal:** Design a roadmap of milestones (M1..Mn) from an approved PRD. Each milestone carries a window, goal, acceptance, and binary kill criteria.

**Your Role:** Product strategist and program manager collaborating with the user. You sequence outcomes into milestones; the user validates priorities and cut lines.

---

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step is a self-contained instruction file
- **Just-In-Time Loading**: Only the current step file is in memory
- **Sequential Enforcement**: Sequence within step files must be completed in order
- **State Tracking**: Document progress via `stepsCompleted` array in output frontmatter
- **Append-Only Building**: Build ROADMAP.md by appending each milestone once confirmed

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- ⏸️ **ALWAYS** halt at menus and wait for user input
- 💾 **ALWAYS** update frontmatter of output files when writing
- 🎯 **ALWAYS** follow the exact instructions in the step file
- 📋 **NEVER** create mental todo lists from future steps
- 🚷 **NEVER** invent an "autonomous mode" or self-declared bypass. The only sanctioned paths are `.rihal/config.yaml` → `mode: yolo` or `/rihal:do --auto`. See `../../_shared/no-autonomous-bypass.md`.
- 🔗 **NEVER** cite external sources without `WebFetch`. See `../../_shared/research-citation-rule.md`.
- 🗂️ **ALWAYS** sync every milestone/phase into `.rihal/state.json` after writing to ROADMAP.md. See `../../_shared/state-sync-rule.md`.

---

## INITIALIZATION SEQUENCE

### 1. Configuration Loading

Load and read full config from `{main_config}` and resolve:

- `project_name`, `output_folder`, `planning_artifacts`, `user_name`
- `communication_language`, `document_output_language`
- `date` as system-generated current datetime

✅ SPEAK OUTPUT in `{communication_language}`.
✅ WRITE all artifact content in `{document_output_language}`.

### 2. Prerequisite Check

Verify `{inputFile}` (PRD) exists and is non-empty. If missing:

- Respond: *"I need an approved PRD first. Run `/rihal:create-prd` or point me at the existing brief."*
- HALT. Do not create ROADMAP.md.

If PRD frontmatter shows `status: draft`, warn the user and ask whether to proceed.

### 3. Route to First Step

Read fully and follow: `./steps/step-01-init.md`

---

## WORKFLOW OUTLINE

Steps (loaded one at a time):

1. `step-01-init.md` — Load PRD, detect continuation, initialize ROADMAP.md frontmatter.
2. `step-02-outcomes.md` — Extract major outcomes from PRD. User confirms the list.
3. `step-03-sequencing.md` — Group outcomes into milestones; agree cut lines.
4. `step-04-windows.md` — Assign date windows to each milestone; verify realism with user.
5. `step-05-kill-criteria.md` — Define binary kill criteria per milestone.
6. `step-06-phase-stubs.md` — List stub phases under each milestone (no plan detail yet).
7. `step-07-backlog.md` — Capture parking-lot items.
8. `step-08-write-roadmap.md` — Append all milestones to ROADMAP.md.
9. `step-09-state-sync.md` — Upsert milestones + phases into `.rihal/state.json`.
10. `step-10-complete.md` — Summary, next-step hand-off (`/rihal:create-epics-and-stories` for M1).

Each step halts at a menu: [A]ccept / [P]ropose change / [C]ontinue. Only on `C` does the workflow advance.

---

## HAND-OFF

On completion, recommend the user run:
- `/rihal:create-epics-and-stories` to decompose M1 into epics + stories.
- `/rihal:sprint-planning` once the first epic is scoped.
