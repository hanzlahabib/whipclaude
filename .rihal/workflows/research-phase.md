<purpose>
Research how to implement a phase. Spawns rihal-phase-researcher with phase context.

Standalone research command. For most workflows, use `/rihal:plan` which integrates research automatically.
</purpose>

<available_agent_types>
Valid Rihal subagent types (use exact names — do not fall back to 'general-purpose'):
- rihal-phase-researcher — Researches technical approaches for a phase
</available_agent_types>

<process>

## Step 0: Resolve Model Profile

@.rihal/references/model-profile-resolution.md

Resolve model for:
- `rihal-phase-researcher`

## Step 1: Normalize and Validate Phase

@.rihal/references/phase-argument-parsing.md

```bash
PHASE_INFO=$(node ".rihal/bin/rihal-tools.cjs" roadmap get-phase "${PHASE}")
```

If `found` is false: Error and exit.

## Step 2: Check Existing Research

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null || true
```

If exists: Offer update/view/skip options.

## Step 3: Gather Phase Context

```bash
INIT=$(node ".rihal/bin/rihal-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# Extract: phase_dir, padded_phase, phase_number, state_path, requirements_path, context_path
AGENT_SKILLS_RESEARCHER=$(node ".rihal/bin/rihal-tools.cjs" agent-skills rihal-researcher 2>/dev/null)
```

## Step 4: Spawn Researcher

```
Task(
  prompt="<objective>
Research implementation approach for Phase {phase}: {name}
</objective>

<files_to_read>
- {context_path} (USER DECISIONS from /rihal:discuss-phase)
- {requirements_path} (Project requirements)
- {state_path} (Project decisions and history)
</files_to_read>

${AGENT_SKILLS_RESEARCHER}

<additional_context>
Phase description: {description}
</additional_context>

<output>
Write to: .planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md
</output>",
  subagent_type="rihal-phase-researcher",
  model="{researcher_model}"
)
```

## Step 5: Handle Return

- `## RESEARCH COMPLETE` — Display summary, offer: Plan/Dig deeper/Review/Done
- `## CHECKPOINT REACHED` — Present to user, spawn continuation
- `## RESEARCH INCONCLUSIVE` — Show attempts, offer: Add context/Try different mode/Manual

</process>
