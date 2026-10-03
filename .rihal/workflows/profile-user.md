# Workflow: rihal:profile-user

<purpose>
Classify developer on 4 dimensions: communication style, autonomy preference, domain depth, and iteration speed. Spawn a profiler subagent to ask questions and produce a USER-PROFILE.md artifact with YAML frontmatter + structured classification.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:profile-user <argument-here>
```

**Examples:**
```
/rihal:profile-user example 1
/rihal:profile-user example 2
```

STOP — do not proceed.

<available_agent_types>
- `rihal-profiler` — user classification agent (spawned once per session)
</available_agent_types>

## Step 0 — Initialize

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init profile-user "$ARGUMENTS")
```

Parse:
- `flags.json` — if set, parse as pre-filled profile JSON (skip questions)
- `profile_path` — `.rihal/USER-PROFILE.md` (output location)

**If no arguments and `--json` not provided:** Use AskUserQuestion to collect 4 profile dimensions interactively.

## Step 1 — Collect Profile Data (if not `--json`)

Use AskUserQuestion with 4 separate calls (one per dimension):

**Q1: Communication Style**
```
header: "Communication"
question: "How do you prefer to receive technical guidance?"
multiSelect: false
options:
  - "Direct & dense (structured data, minimal prose)"
  - "Balanced (explanation + examples)"
  - "Narrative & conversational"
  - "Persona-driven (character voice OK)"
```

**Q2: Autonomy Preference**
```
header: "Autonomy"
question: "How should the agent handle decisions?"
multiSelect: false
options:
  - "Autonomous (just do it, report after)"
  - "Checkpoint-based (ask before each decision)"
  - "Guided (suggestions + approval loops)"
  - "Hands-off (full human control)"
```

**Q3: Domain Depth**
```
header: "Domain Depth"
question: "How deep should technical explanations go?"
multiSelect: false
options:
  - "Beginner (conceptual, no jargon)"
  - "Intermediate (standard patterns, some internals)"
  - "Advanced (architectural depth, trade-offs)"
  - "Expert (research papers, edge cases)"
```

**Q4: Iteration Speed**
```
header: "Speed"
question: "Preferred pace for feedback loops?"
multiSelect: false
options:
  - "Fast (minimal detail, quick feedback)"
  - "Balanced (normal pace)"
  - "Thorough (deep analysis, slower)"
  - "Adaptive (match the moment)"
```

Collect answers into `profile` object:
```json
{
  "communication": "Direct & dense",
  "autonomy": "Checkpoint-based",
  "domain_depth": "Intermediate",
  "iteration_speed": "Balanced"
}
```

## Step 2 — Generate Profile

**If `--json` provided:** Parse `flags.json` into `profile` object (skip questions).

**Otherwise:** Use answers from Step 1.

Spawn `rihal-profiler` subagent:

```
Task tool call:
  subagent_type: "rihal-profiler"
  description: "Generate user profile classification"
  prompt: |
    Generate a USER-PROFILE.md with the following profile data:
    
    Communication: {profile.communication}
    Autonomy: {profile.autonomy}
    Domain Depth: {profile.domain_depth}
    Iteration Speed: {profile.iteration_speed}
    
    Output format:
    1. YAML frontmatter with all 4 dimensions + metadata
    2. One paragraph per dimension explaining implications
    3. Recommended settings (e.g., verbosity, checkpoint frequency)
    
    Write to: {profile_path}
```

## Step 3 — Persist Profile

Store `profile` object in state:

```bash
node .rihal/bin/rihal-tools.cjs state set-user-profile --json '{json-string}'
```

Print:
```
✅ Profile saved: {profile_path}

Dimensions:
  • Communication: {communication}
  • Autonomy: {autonomy}
  • Domain Depth: {domain_depth}
  • Iteration Speed: {iteration_speed}

This profile will personalize future /rihal:council and /rihal:execute responses.
```

## Success Criteria

- USER-PROFILE.md created with YAML frontmatter
- All 4 dimensions documented
- Profile persisted to state.json
- Message confirms location and dimensions

## On Error

- If AskUserQuestion fails: retry or skip to default profile
- If subagent fails: manually create USER-PROFILE.md with frontmatter
- If state write fails: print warning but continue (profile still written to disk)
