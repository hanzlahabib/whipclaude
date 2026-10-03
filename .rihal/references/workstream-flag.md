# Workstream Flag — When to Use Workspace Isolation

This reference explains when to use `--workspace` flag vs. sequential phases in `.planning/`.

## Sequential Phases (Default)

Use the standard planning pipeline (`.planning/phases/`) for:

- **Linear work** — Phase 1, Phase 2, Phase 3 in order
- **Dependent phases** — Phase 2 cannot start until Phase 1 is done
- **Single focus** — One team/project working on one thing
- **Milestone-driven** — All phases contribute to the same goal

**Example:**
```
/rihal:plan Build authentication system
/rihal:plan Add user profile pages (depends on auth from Phase 1)
/rihal:plan Write deployment guide (depends on both phases complete)
```

These run sequentially, each depending on the previous phase's completion.

## Workspace Isolation (Parallel)

Use workspaces (`--workspace` flag) for:

- **Parallel work** — Multiple initiatives happening at the same time
- **Independent goals** — Each workspace has its own ROADMAP
- **Context switching** — "I need to pause Q2 roadmap and fix critical bugs"
- **Team separation** — Team A works on Feature X, Team B works on Feature Y
- **Risk isolation** — "Keep the hotfix separate from experimental work"
- **Deadline urgency** — "Fast-track this in a separate workspace while main work continues"

**Example:**
```
# Main workspace (Q2 roadmap)
/rihal:plan Build search feature

# Parallel workspace (critical bug)
/rihal:new-workspace Critical Hotfix
/rihal:plan Fix data corruption --workspace=Critical Hotfix

# Both run independently
# Query progress:
/rihal:list-workspaces
```

## Decision Matrix

| Scenario | Use | Why |
|----------|-----|-----|
| "Build feature A then feature B then feature C" | Sequential | Linear, dependent work |
| "Build feature A AND debug production issue simultaneously" | Workspace | Parallel, independent |
| "Phase 2 requires Phase 1 to be 100% done first" | Sequential | Depends-on relationship |
| "Two teams working on unrelated features" | Workspace | No dependency, separate concerns |
| "One-sprint roadmap with 5 tasks" | Sequential | Single focused initiative |
| "Pause roadmap, fix urgent bug, resume roadmap" | Workspace | Context switch without losing state |
| "Research + implementation of same feature" | Sequential | Both parts of one deliverable |
| "Experiment in parallel with stable features" | Workspace | Risk isolation |

## State Management

### Sequential (default)

- Single `.planning/STATE.md` — tracks all phases
- Single `.planning/ROADMAP.md` — one set of goals
- Phases inherit context from previous phases

### Workspaces (parallel)

- Each workspace has its own `STATE.md`
- Each workspace has its own `ROADMAP.md`
- No shared context between workspaces (intentional isolation)

## Switching Context

### Sequential phases

```bash
# View current phase
/rihal:status

# Execute next phase
/rihal:execute <phase>

# Switch to different task within same milestone
/rihal:quick <small task>
```

### Workspaces

```bash
# List all workspaces
/rihal:list-workspaces

# Work within a workspace
/rihal:plan <task> --workspace=Hotfix

# Switch to another workspace's context
/rihal:workspace <name>

# Return to main planning
/rihal:workspace main
```

## Merging Workspaces Back

If you started a workspace but it should merge back into main planning:

1. Complete the work in the workspace
2. Create a phase in main planning that incorporates the workspace's findings
3. Archive the workspace: `/rihal:remove-workspace <name> --archive`
4. Continue in main planning with unified context

## Common Patterns

### Pattern: Feature branch + hotfix

```bash
# Main work (Q2 roadmap)
/rihal:plan Implement real-time notifications

# Critical bug emerges
/rihal:new-workspace Critical
/rihal:plan Fix payment processing --workspace=Critical

# Two parallel tracks
/rihal:list-workspaces

# When bug is fixed
/rihal:complete-workspace Critical
# Resume main work
/rihal:execute <Q2 phase>
```

### Pattern: Research + implementation

```bash
# Sequential phases (both parts of same feature)
/rihal:plan Research WebSocket libraries and trade-offs
/rihal:plan Implement chosen library with tests
# Phase 2 reads Phase 1 findings
```

### Pattern: Experimental feature

```bash
# Keep experiments separate
/rihal:new-workspace Experiment: Dark Mode
/rihal:plan Build dark mode UI --workspace=Experiment
/rihal:plan Test across 10 browsers --workspace=Experiment

# Main work continues unaffected
/rihal:plan Improve search relevance

# If experiment succeeds, merge into main
# If it fails, just archive and delete
/rihal:remove-workspace --archive Experiment
```

## Summary

- **Default (sequential):** Linear work, dependencies, single focus
- **Workspaces (parallel):** Independent initiatives, context switching, risk isolation
- Use sequential for 95% of work
- Reach for workspaces when you truly have parallel, independent tracks
