# Workflow: rihal:check-implementation-readiness

<purpose>
Pre-execution gate: verify PRD approved, architecture approved, external dependencies identified, and no blocking assumptions remain. Return pass/fail report. Used as guard in plan.md Step 0.8 and execute.md Step 0.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:check-implementation-readiness <argument-here>
```

**Examples:**
```
/rihal:check-implementation-readiness example 1
/rihal:check-implementation-readiness example 2
```

STOP — do not proceed.

## Step 0 — Initialize

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init check-implementation-readiness "$ARGUMENTS")
```

Parse:
- `flags.phase` — specific phase to check (optional, default: current_phase)
- `current_phase` — from state if --phase not provided
- `checklist_po_master_path` — `.rihal/references/checklist-po-master.md`

## Step 1 — Load Readiness Checklist

Read `.rihal/references/checklist-po-master.md` for required approval gates:

Expected sections:
1. **PRD Sign-Off** — requirements approved by stakeholders
2. **Architecture Approval** — design approved by tech lead
3. **Dependencies Identified** — all external APIs, services, data sources listed
4. **Assumptions Surfaced** — no blocking unknowns

## Step 2 — Check Each Gate

### Gate 1: PRD Approved

Check if `.rihal/PRD.md` or equivalent exists and has approval signature:

```bash
if grep -q "Approved by:" .rihal/PRD.md 2>/dev/null; then
  GATE_PRD="✓ PASS"
else
  GATE_PRD="✗ FAIL — PRD not approved"
fi
```

### Gate 2: Architecture Approved

Check if `.rihal/ARCHITECTURE.md` exists and has approval:

```bash
if grep -q "Approved by:" .rihal/ARCHITECTURE.md 2>/dev/null; then
  GATE_ARCH="✓ PASS"
else
  GATE_ARCH="✗ FAIL — Architecture not approved"
fi
```

### Gate 3: External Dependencies

Check if `.rihal/DEPENDENCIES.md` exists with identified external integrations:

```bash
if test -f .rihal/DEPENDENCIES.md && grep -q "^##" .rihal/DEPENDENCIES.md; then
  GATE_DEPS="✓ PASS"
else
  GATE_DEPS="✗ FAIL — External dependencies not documented"
fi
```

### Gate 4: No Blocking Assumptions

Check `.rihal/ASSUMPTIONS.md` for unresolved assumptions:

```bash
if grep -q "BLOCKING:" .rihal/ASSUMPTIONS.md 2>/dev/null; then
  GATE_ASSUMPTIONS="✗ FAIL — Blocking assumptions exist"
else
  GATE_ASSUMPTIONS="✓ PASS"
fi
```

## Step 3 — Generate Readiness Report

Collect gate results:

```bash
GATES=$(node .rihal/bin/rihal-tools.cjs state read-gates)
OVERALL_STATUS=$([[ "$GATE_PRD" == "✓"* ]] && [[ "$GATE_ARCH" == "✓"* ]] && [[ "$GATE_DEPS" == "✓"* ]] && [[ "$GATE_ASSUMPTIONS" == "✓"* ]] && echo "READY" || echo "BLOCKED")
```

Write `.rihal/READINESS-REPORT.md`:

```markdown
# Implementation Readiness Check

**Status:** {READY|BLOCKED}
**Checked:** {timestamp}

## Gating Criteria

| Gate | Status | Notes |
|------|--------|-------|
| PRD Approval | {✓/✗} | {message} |
| Architecture Approval | {✓/✗} | {message} |
| Dependencies Identified | {✓/✗} | {message} |
| No Blocking Assumptions | {✓/✗} | {message} |

## Blockers (if any)

{list_of_failed_gates_with_remediation}

## Remediation

{steps_to_resolve_blockers}
```

## Step 4 — Return Result

Print:
```
🛡️ Implementation Readiness: {READY|BLOCKED}

Gates:
  {GATE_PRD}
  {GATE_ARCH}
  {GATE_DEPS}
  {GATE_ASSUMPTIONS}

{IF_BLOCKED:
  Blockers:
  • {list}
  
  Resolve with:
  {remediation_commands}
}
```

**If READY:** return `{ status: "READY" }`
**If BLOCKED:** return `{ status: "BLOCKED", blockers: [...] }` and STOP plan/execute

## Integration: plan.md Guard

In plan.md workflow, **Step 0.8 — Pre-execution Gate** (after decision checkpoint):

```bash
if [[ "$FLAGS_SKIP_GATES" != "true" ]]; then
  READINESS=$(node .rihal/bin/rihal-tools.cjs check-implementation-readiness)
  if [[ "$READINESS" != "READY" ]]; then
    echo "⚠ Implementation not ready. Resolve blockers before proceeding."
    exit 1
  fi
fi
```

## Integration: execute.md Guard

In execute.md workflow, **Step 0 — Pre-execution Validation**:

```bash
READINESS=$(node .rihal/bin/rihal-tools.cjs check-implementation-readiness --phase "$PHASE")
if [[ "$READINESS" != "READY" ]]; then
  echo "Cannot execute plan — implementation not ready."
  exit 1
fi
```

Allow `--skip-gates` flag to override for emergency situations only.

## Success Criteria

- READINESS-REPORT.md created
- All 4 gates checked
- Status returned (READY or BLOCKED)
- Blockers clearly listed with remediation

## On Error

- If checklist files missing: treat as FAIL on that gate
- If state read fails: skip and report gates manually
- If file not found: treat as FAIL, suggest file location
