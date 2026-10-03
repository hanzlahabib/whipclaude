# Workflow: rihal:analyze-dependencies

<purpose>
Analyze ROADMAP.md phases for dependency relationships before execution. Detect file overlap between phases, semantic API/data-flow dependencies, and suggest `Depends on` entries to prevent merge conflicts during parallel execution by `/rihal:manager`.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:analyze-dependencies <argument-here>
```

**Examples:**
```
/rihal:analyze-dependencies example 1
/rihal:analyze-dependencies example 2
```

STOP — do not proceed.

## Step 0 — Load ROADMAP.md

**Action:** Read `.planning/ROADMAP.md` and extract all phases.

```bash
test -f .planning/ROADMAP.md || echo "No ROADMAP.md found — run /rihal:new-project first."
```

For each phase, capture:
- Phase number and name
- Scope/Goal description
- Files listed in `Files` or `files_modified` fields (if present)
- Existing `Depends on` field value

If file missing: exit with instructions to create project.

## Step 1 — Infer likely file modifications

**Action:** For each phase without explicit `files_modified`, analyze scope/goal and infer file domains.

Use heuristics to classify phases:
- **Database/schema phases** → migration files, schema definitions, model files
- **API/backend phases** → route files, controller files, service files, handler files
- **Frontend/UI phases** → component files, page files, style files
- **Auth phases** → middleware files, auth route files, session/token files
- **Config/infra phases** → config files, environment files, CI/CD files
- **Test phases** → test files, spec files, fixture files
- **Shared utility phases** → lib/utils files, shared type definitions

Group phases by inferred file domain (database, API, frontend, auth, config, shared).

## Step 2 — Detect dependency relationships

**Action:** For each pair of phases (A, B), check for three types of dependencies.

### File Overlap Detection
If phases A and B both modify files in same domain or same specific file, one must run before the other. The foundational phase runs first.

### Semantic Dependency Detection
Read each phase's scope/goal for patterns:
- Phase B mentions consuming/using something Phase A creates/implements
- Phase B references "API", "schema", "model", "endpoint", "interface" that Phase A builds
- Phase B says "after X complete", "once X built", "using the X from Phase N"
- Phase B extends code that Phase A establishes

### Data Flow Detection
- Phase A creates data structures/schemas → Phase B consumes/transforms them
- Phase A seeds/migrates database → Phase B reads from it
- Phase A exposes API contract → Phase B implements client for it

## Step 3 — Build dependency table

**Action:** Output dependency suggestions for each phase.

For each phase, print:

```
Phase N: <name>
  Scope: <brief scope>
  Likely touches: <inferred file domains>

  Suggested dependencies:
  → Depends on: <Phase M> — reason: <overlap/semantic/data-flow explanation>

  Current "Depends on": <existing value or "(none)">
```

For phase pairs with no detected dependency: "No dependency detected between Phase X and Phase Y."

## Step 4 — Summarize suggested changes

**Action:** Show consolidated diff of proposed ROADMAP.md `Depends on` changes.

```
Suggested ROADMAP.md updates:
  Phase 3: add "Depends on: 1, 2"   (file overlap: database schema)
  Phase 5: add "Depends on: 3"      (semantic: uses auth API from Phase 3)
  Phase 4: no change needed         (independent scope)
```

## Step 5 — Confirm and apply changes

**Action:** Ask user for confirmation and apply changes if approved.

```
Apply these Depends on suggestions to ROADMAP.md? (yes / no / edit)
```

Handle responses:
- **yes** — Write all suggested entries to ROADMAP.md. Confirm each write.
- **no** — Print suggestions as text only. User updates manually.
- **edit** — Present each suggestion individually with yes/no/skip per suggestion.

When writing:
- Locate phase entry and add or update `Depends on:` field
- Preserve all other phase content unchanged
- Do not reorder phases

After applying: "ROADMAP.md updated. Run `/rihal:manager` to execute phases in the correct order."

## Success Criteria

- [ ] All phases analyzed for dependencies
- [ ] File overlap detected correctly
- [ ] Semantic dependencies identified
- [ ] Data flow dependencies recognized
- [ ] Suggestions clear and justified
- [ ] User approval obtained before changes
- [ ] ROADMAP.md updated atomically

## On Error

- **ROADMAP.md missing:** Print error and suggest creating project first
- **Phase parsing fails:** Print which phase and why parsing failed
- **File write fails:** Print error and suggest manual update
