# Workflow: rihal:ui-review

<purpose>
Retroactively audit completed UI work against the UI-SPEC.md contract. Validates across 6 pillars: color consistency, typography compliance, component inventory coverage, accessibility requirements, responsive behavior, and design coherence. Produces audit report with pass/fail per pillar.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:ui-review <argument-here>
```

**Examples:**
```
/rihal:ui-review example 1
/rihal:ui-review example 2
```

STOP — do not proceed.

<available_agent_types>
- `rihal-ui-auditor` — UI compliance auditor
</available_agent_types>

## Step 0 — Initialize

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init ui-review "$ARGUMENTS")
```

Parse:
- `flags.phase` — audit specific phase (optional, default: all completed phases)
- `flags.detailed` — include detailed findings per component
- `spec_path` — load UI-SPEC.md if exists
- `phase_name` — phase to audit

## Step 1 — Validate UI-SPEC.md Exists

```bash
test -f ".rihal/UI-SPEC.md"
```

**If missing:**
```
⚠ UI-SPEC.md not found. Run /rihal:ui-phase first to create design contract.
```

Exit.

## Step 2 — Load UI-SPEC.md and Codebase

Read UI-SPEC.md for:
- Expected color tokens and contrast ratios
- Typography scales (sizes, weights, line heights)
- Component inventory with variants
- Accessibility requirements
- Responsive breakpoints

Scan phase/codebase for:
- Component files (*.tsx, *.jsx, *.vue)
- CSS/styling files (*.css, *.module.css, tailwind.config.js, etc.)
- Accessibility attributes (aria-label, role, aria-describedby, etc.)
- Media queries and responsive rules

## Step 3 — Spawn UI Auditor

Spawn `rihal-ui-auditor` subagent:

```
Task tool call:
  subagent_type: "rihal-ui-auditor"
  description: "Audit UI against UI-SPEC.md"
  prompt: |
    Audit the completed UI implementation against UI-SPEC.md contract.
    
    **UI-SPEC.md Reference:**
    {contents_of_ui_spec_md}
    
    **Codebase to Audit:**
    {component_files_list}
    {styling_rules}
    {accessibility_attributes}
    
    **Audit 6 pillars (pass/fail + findings):**
    
    1. Color Consistency — All text/backgrounds match color tokens, contrast ratios >= WCAG AA
    2. Typography Compliance — Font sizes, weights, line heights match typography scales
    3. Component Inventory — All specified components present, all variants implemented
    4. Accessibility — aria-labels, roles, keyboard navigation, focus rings per WCAG 2.1 AA
    5. Responsive Behavior — Breakpoints match, layouts stack correctly, touch targets >= 44px mobile
    6. Design Coherence — Visual consistency, spacing system, interaction patterns uniform
    
    {detailed_findings_if_flag_set}
    
    Output format: UI-REVIEW.md with per-pillar assessment + remediation tasks
```

## Step 4 — Generate Audit Report

Store audit report at:
- `.rihal/UI-REVIEW-{phase-name}.md` (if phase specified)
- `.rihal/UI-REVIEW.md` (if all phases)

Print:
```
📋 UI Audit Complete

Pillars:
  {pillar_name}: {PASS|FAIL} {summary}

Detailed findings: {audit_report_path}

{failed_pillar_remediation_recommendations}
```

## Success Criteria

- UI-SPEC.md loaded and parsed
- All 6 pillars audited
- Audit report generated with pass/fail per pillar
- Remediation tasks filed (if issues found)

## On Error

- If UI-SPEC.md invalid: print error and suggest recreating
- If codebase has no components: report as INCOMPLETE
- If audit agent fails: provide template audit report structure
