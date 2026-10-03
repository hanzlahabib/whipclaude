# Workflow: rihal:ui-phase

<purpose>
Produce UI-SPEC.md with formalized design contract: color tokens, typography system, component inventory, interaction states, accessibility requirements. Detects frontend keywords (React, Next.js, Vue, Tailwind, CSS, UI) and suggests this workflow early if UI-SPEC.md is absent.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:ui-phase <argument-here>
```

**Examples:**
```
/rihal:ui-phase example 1
/rihal:ui-phase example 2
```

STOP — do not proceed.

<available_agent_types>
- `rihal-ui-designer` — UI specification generator
</available_agent_types>

## Step 0 — Initialize

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init ui-phase "$ARGUMENTS")
```

Parse:
- `flags.existing_ui` — path to existing design system or Figma export
- `flags.design_system` — path to design tokens file
- `ui_spec_path` — `.rihal/UI-SPEC.md` (output location)

## Step 1 — Detect Existing UI Assets

If `flags.existing_ui` or `flags.design_system` provided:
```bash
EXISTING=$(node .rihal/bin/rihal-tools.cjs find-files --type=design-tokens)
```

Load existing design system, extract:
- Color palette (hex, variable names)
- Typography scales (font family, sizes, weights, line heights)
- Component list (buttons, forms, layouts, modals, etc.)
- Interaction patterns (hover, focus, active, disabled states)

## Step 2 — Spawn UI Designer

Spawn `rihal-ui-designer` subagent:

```
Task tool call:
  subagent_type: "rihal-ui-designer"
  description: "Generate UI-SPEC.md"
  prompt: |
    Generate a UI-SPEC.md file with the following structure:
    
    1. **Color Tokens** — semantic variable names, hex values, accessibility contrast ratios
    2. **Typography** — font family, scales (12px, 14px, 16px, 18px, 20px, 24px, etc.), weights, line heights
    3. **Component Inventory** — list of UI components with property variants (size, color, state, disabled)
    4. **Interaction States** — hover, focus, active, disabled, loading for interactive elements
    5. **Accessibility** — WCAG 2.1 AA compliance checklist, color contrast requirements, keyboard navigation rules
    6. **Responsive Breakpoints** — mobile, tablet, desktop breakpoints and stacking rules
    
    {existing_design_system_data_if_provided}
    
    Write to: {ui_spec_path}
```

## Step 3 — Store Reference in State

Update state with UI-SPEC.md location:
```bash
node .rihal/bin/rihal-tools.cjs state set --ui-spec-path ".rihal/UI-SPEC.md"
```

Print:
```
✅ UI-SPEC.md generated: {ui_spec_path}

Contains:
  • Color Tokens
  • Typography System
  • Component Inventory
  • Interaction States
  • Accessibility Checklist
  • Responsive Breakpoints

This spec will guide component development and design consistency.
```

## Step 4 — Modify plan.md Detection (referenced in plan workflow)

In plan.md workflow, add Step 0.6 — **Detect frontend keywords and suggest UI safety gate**

```bash
FRONTEND_KEYWORDS=$(node .rihal/bin/rihal-tools.cjs classify-tech --keywords "react,next.js,vue,tailwind,css,ui,component,design,frontend" "$ARGUMENTS")
```

**If `FRONTEND_KEYWORDS.has_frontend == true` AND UI-SPEC.md missing:**

Check `config.yaml` for `workflow.ui_safety_gate`:
```yaml
workflow:
  ui_safety_gate: true  # default true
```

If enabled, print:
```
⚠ Frontend project detected. Before planning, create a design contract:

/rihal:ui-phase

This ensures consistent UI patterns, accessibility, and design tokens across all components.
```

Offer via AskUserQuestion:
```
header: "UI Safety Gate"
question: "Should we define UI-SPEC.md before planning component development?"
options:
  - "Yes, run /rihal:ui-phase first"
  - "Skip for now, continue planning"
```

If "Yes, run /rihal:ui-phase first":
```
Run /rihal:ui-phase, then return to /rihal:plan
```

## Success Criteria

- UI-SPEC.md created with all 6 sections
- Color tokens documented with contrast ratios
- Component inventory complete with variants
- Accessibility checklist included
- State updated with UI-SPEC.md path

## On Error

- If subagent fails: provide template UI-SPEC.md
- If frontend detection fails: skip suggestion
- If config.yaml missing ui_safety_gate: default to true (suggest)
