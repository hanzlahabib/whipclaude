# State Schema Reference

Documents every top-level field in `state.json`, used by rihal workflows for session persistence.

---

## File Structure

```json
{
  "version": "1",
  "project": "...",
  "created": "...",
  "updated": "...",
  "current_phase": "...",
  "current_plan": 1,
  "phases": [...],
  "executions": [...],
  "decisions": [...],
  "blockers": [...],
  "council_sessions": [...],
  "chains": [...],
  "last_session": "...",
  "workstreams": [...],
  "active_workstream": "...",
  "model_profile": "..."
}
```

---

## Field Reference

### `version`
**Type:** string  
**Example:** `"1"`  
**Written by:** `/rihal:install` (initialization)  
**Purpose:** Schema version for compatibility checks. Change if fields added/removed.

---

### `project`
**Type:** string  
**Example:** `"Rihal v2"`  
**Written by:** `/rihal:install` (reads from config.yaml)  
**Purpose:** Project name for context and reports.

---

### `created`
**Type:** ISO date string  
**Example:** `"2026-04-01T10:30:00Z"`  
**Written by:** `/rihal:install` (first session)  
**Purpose:** Timestamp of project creation, never changes.

---

### `updated`
**Type:** ISO date string  
**Example:** `"2026-04-12T15:45:30Z"`  
**Written by:** Any command that modifies state  
**Purpose:** Last write timestamp; aids session recovery.

---

### `current_phase`
**Type:** string or null  
**Example:** `"Phase 2: Authentication"` or `null`  
**Written by:** `/rihal:do`, `/rihal:next`, `/rihal:resume-work`  
**Purpose:** Name of active phase, null if no phase active.

---

### `current_plan`
**Type:** number  
**Example:** `2`  
**Written by:** `/rihal:do --execute` (incremented after each phase completion)  
**Purpose:** Counter for plan versions. Increments 1→2→3 as phases complete.

---

### `phases`
**Type:** array of objects  
**Example:**
```json
[
  {
    "number": 1,
    "name": "Setup & Scaffolding",
    "started": "2026-04-01T10:30:00Z",
    "completed": "2026-04-03T14:20:00Z",
    "sprints": [
      {
        "id": "01.1",
        "number": 1,
        "goal": "Project structure + CI",
        "status": "completed",
        "velocity_target": 13,
        "velocity_actual": 11,
        "started_at": "2026-04-01T10:30:00Z",
        "completed_at": "2026-04-02T18:00:00Z",
        "stories": [
          {
            "id": "01.1.01",
            "title": "Initialize repo with standard layout",
            "points": 3,
            "status": "done",
            "acceptance": "Repo has src/, tests/, CI config"
          },
          {
            "id": "01.1.02",
            "title": "Setup CI pipeline",
            "points": 5,
            "status": "done",
            "acceptance": "PR checks run lint + test"
          }
        ]
      }
    ]
  }
]
```
**Written by:** `/rihal:do --execute`, `/rihal:next`, sprint/story state tools  
**Purpose:** Tracks phases with nested sprints and stories.

**Sprint fields:**
- `id` — `{NN}.{S}` (phase.sprint)
- `goal` — one-sentence sprint focus
- `status` — `planned | active | completed`
- `velocity_target` — estimated story points
- `velocity_actual` — actual points completed (set on sprint complete)
- `stories[]` — array of story objects

**Story fields:**
- `id` — `{NN}.{S}.{TT}` (phase.sprint.story)
- `title` — story description
- `points` — story points (0 = unestimated)
- `status` — `todo | in_progress | review | done`
- `acceptance` — acceptance criteria (optional)

---

### `velocity_history`
**Type:** array of objects  
**Example:**
```json
[
  { "sprint": "01.1", "points": 11, "completed_at": "2026-04-02T18:00:00Z" },
  { "sprint": "01.2", "points": 13, "completed_at": "2026-04-05T16:00:00Z" }
]
```
**Written by:** `sprint complete` state tool  
**Purpose:** Rolling velocity log. Used to calculate average velocity for sprint capacity planning.

---

### `current_sprint`
**Type:** string (nullable)  
**Example:** `"01.1"`  
**Written by:** `sprint add`, `sprint start`, `sprint complete`  
**Purpose:** Currently active sprint. Null when no sprint in progress.

---

### `executions`
**Type:** array of objects  
**Example:**
```json
[
  {
    "plan": "01.02",
    "tasks": 3,
    "duration_ms": 3600000,
    "commit_hash": "abc123def456",
    "committed_at": "2026-04-03T14:20:00Z"
  }
]
```
**Written by:** `/rihal:execute` (after each plan completes)  
**Purpose:** Log of each plan execution. The `plan` field is the plan ID string (e.g., "01.02"), not a number.

---

### `decisions`
**Type:** array of objects  
**Example:**
```json
[
  {
    "summary": "Use JWT instead of session cookies",
    "phase": "Phase 2",
    "plan": 1,
    "date": "2026-04-04T09:15:00Z"
  }
]
```
**Written by:** `/rihal:council`, `/rihal:discuss`  
**Purpose:** Records architectural/strategic decisions for history.

---

### `blockers`
**Type:** array of objects  
**Example:**
```json
[
  {
    "description": "API rate limit blocks load testing",
    "phase": "Phase 3",
    "plan": 1,
    "date": "2026-04-05T11:00:00Z",
    "resolved": "2026-04-05T13:30:00Z"
  }
]
```
**Written by:** `/rihal:do`, `/rihal:health`  
**Purpose:** Tracks blockers, when identified, which phase, and resolution time.

---

### `council_sessions`
**Type:** array of objects  
**Example:**
```json
[
  {
    "date": "2026-04-04T10:00:00Z",
    "question_slug": "auth-strategy",
    "panel": ["rihal-sadiq", "rihal-waleed", "rihal-fatima"],
    "artifact_path": "rihal/artifacts/council-sessions/auth-strategy-20260404.md"
  }
]
```
**Written by:** `/rihal:council`  
**Purpose:** History of council deliberations, panelists, output artifacts.

---

### `chains`
**Type:** array of objects  
**Example:**
```json
[
  {
    "date": "2026-04-05T14:00:00Z",
    "slug": "implement-login-flow",
    "agents": ["rihal-waleed", "rihal-fatima"],
    "artifacts_dir": "rihal/artifacts/chains/implement-login-flow-20260405"
  }
]
```
**Written by:** `/rihal:chain`  
**Purpose:** History of multi-agent chains, participants, work artifacts.

---

### `last_session`
**Type:** ISO date string  
**Example:** `"2026-04-12T15:45:30Z"`  
**Written by:** Every subcommand that runs (updates at session end)  
**Purpose:** Enables `/rihal:resume-work` to find context from last session.

---

### `workstreams`
**Type:** array of objects  
**Example:**
```json
[
  {
    "name": "Frontend",
    "created": "2026-04-01T10:30:00Z",
    "active": true,
    "completed": null,
    "phases": [1, 2, 3]
  },
  {
    "name": "Backend API",
    "created": "2026-04-02T09:00:00Z",
    "active": true,
    "completed": null,
    "phases": [1, 2, 4]
  }
]
```
**Written by:** `/rihal:workstream --create`, `/rihal:do --execute`  
**Purpose:** Tracks parallel workstreams, which phases belong to each.

---

### `active_workstream`
**Type:** string or null  
**Example:** `"Frontend"` or `null`  
**Written by:** `/rihal:workstream --activate`, `/rihal:do`  
**Purpose:** Currently active workstream; null if no workstream focus.

---

### `model_profile`
**Type:** string  
**Example:** `"balanced"` (options: `quality`, `balanced`, `budget`, `inherit`)  
**Written by:** `/rihal:set-profile`  
**Purpose:** Model selection for council agents. Affects token spend and quality.

---

## Usage Examples

### Reading Phase Progress
```python
current_phase = state['current_phase']
completed_phases = [p for p in state['phases'] if p['completed'] is not None]
progress = f"{len(completed_phases)}/{len(state['phases'])} phases complete"
```

### Checking for Blockers
```python
unresolved_blockers = [b for b in state['blockers'] if b['resolved'] is None]
if unresolved_blockers:
    print(f"⚠️ {len(unresolved_blockers)} open blockers")
```

### Resuming Session
```python
last_session = state['last_session']
current_phase = state['current_phase']
# Provide context: "Last session: {last_session}. Phase: {current_phase}"
```

### Tracking Decisions
```python
phase_decisions = [d for d in state['decisions'] if d['phase'] == current_phase]
print(f"Decisions made in {current_phase}:")
for d in phase_decisions:
    print(f"  - {d['summary']}")
```

---

## ID Formats Accepted by resolve-id

The `state resolve-id <id>` command accepts the following formats:

| Format | Example | Resolves To | Notes |
|--------|---------|-------------|-------|
| `M{N}` | `M1`, `M2` | Milestone N | Lowercase or uppercase M |
| `{NN}` | `01`, `02`, `10` | Phase with number NN | Zero-padded two-digit phase number |
| `{NN.S}` | `01.1`, `02.3` | Sprint S in Phase NN | Sprint within a phase |
| `{NN.S.TT}` | `01.1.01`, `02.3.05` | Story TT in Sprint NN.S | Three-part hierarchical story ID |
| `{NN.M}` | `02.1`, `03.2` | Decimal phase (legacy) OR sprint | Context-dependent — prefer sprint interpretation |

**Examples:**
```bash
node .rihal/bin/rihal-tools.cjs state resolve-id M1          # → Milestone 1
node .rihal/bin/rihal-tools.cjs state resolve-id 02          # → Phase 02
node .rihal/bin/rihal-tools.cjs state resolve-id 01.1        # → Sprint 1 in Phase 01
node .rihal/bin/rihal-tools.cjs state resolve-id 01.1.03     # → Story 3 in Sprint 01.1
```

**Sprint state commands:**
```bash
node .rihal/bin/rihal-tools.cjs state sprint add --phase 01 --goal "Setup" --velocity 13
node .rihal/bin/rihal-tools.cjs state story add --title "Login" --points 5
node .rihal/bin/rihal-tools.cjs state story move --id 01.1.01 --status done
node .rihal/bin/rihal-tools.cjs state sprint velocity
```
