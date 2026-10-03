# Workflow: rihal:chain

<purpose>
Run a sequential agent pipeline — each agent receives the previous agent's output as input. Unlike `/rihal:council` (parallel debate with cross-talk), chain is a one-way pipeline for "do research → hand to PM → hand to CTO" patterns. Each stage's output is saved as a first-class artifact the next stage reads.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` is empty, print:

```
Usage: /rihal:chain <preset|agent-list> <topic or question>

Presets (common pipelines):
  research-plan      Mariam (research) → Hussain-PM (scope) → Planner (SPRINT.md)
  feasibility        Waleed (architecture) → Fatima (QA gates)
  gtm-to-build       Mariam (GTM) → Hussain-PM (scope) → Waleed (feasibility)
  full-discovery     Mariam → Sadiq (kill criteria) → Hussain-PM → Waleed → Planner

Custom agents (comma-separated, in order):
  /rihal:chain mariam,hussain-pm,waleed <topic>

Examples:
  /rihal:chain research-plan affiliate site in Dubai for mobile accessories
  /rihal:chain feasibility migrate our Postgres to Neon serverless
  /rihal:chain mariam,hussain-pm should we enter the SaaS bookkeeping market in Oman?
```

STOP here if no arguments.

## Step 0.5 — Detect pure decision questions (redirect to council)

If `$ARGUMENTS` is a pure decision question with no topic to work on (patterns like "should we", "A or B", "is X better than Y", "worth it") and does NOT contain a preset name or agent list:

```
⚠ /rihal:chain produces deliverables (RESEARCH.md, SCOPE.md, SPRINT.md).
For decisions only, /rihal:council is the right tool.

For a debate: /rihal:council $ARGUMENTS
For a research-to-plan pipeline: /rihal:chain research-plan $ARGUMENTS
```

Only proceed past this step if the input is a topic or deliverable request (e.g., "research affiliate site", "scope mobile app migration", "plan e-commerce platform").

## Step 1 — Resolve the chain

```bash
INIT=$(node .rihal/bin/rihal-tools.cjs init chain "$ARGUMENTS")
```

Parse:
- `chain` — array of agent ids in order (e.g. `["mariam", "hussain-pm", "planner"]`)
- `topic` — the user's question/topic (arguments minus the preset/agent-list)
- `preset` — preset name if matched, null otherwise
- `slug` — kebab-case slug from topic, max 40 chars
- `chain_dir` — `.planning/chains/{YYYY-MM-DD}-{slug}/`
- `config`, `paths` — standard

If the chain contains unknown or uninstalled agents, stop and list valid ones.

Print:
```
🔗 Chain: {preset or "custom"}
   Pipeline: {agent 1} → {agent 2} → {agent 3}
   Topic: {topic}
   Artifacts: {chain_dir}/
```

Create the chain directory.

## Step 2 — Run the chain (one stage at a time)

For each agent in `chain`, in order:

### Stage input
Build the prompt for this stage:

```
You are stage {N} of {total} in a Rihal chain.

## Topic
{topic}

## Pipeline
{full chain list with current stage marked}

## Previous stage artifacts
{contents of all artifacts from prior stages in chain_dir}

## Your task
Produce your output as a structured markdown artifact. This is not a conversation —
the next stage will read your output verbatim. Be specific, cite sources (for Mariam:
use WebSearch), and end with a clear handoff note for the next stage.

Save your output to: {chain_dir}/{stage_number}-{agent_id}-{artifact_name}.md
```

Artifact names by agent:
- `mariam` → `RESEARCH.md`
- `hussain-pm` → `SCOPE.md`
- `waleed` → `ADR.md`
- `fatima` → `QA-GATES.md`
- `sadiq` → `STRATEGY.md`
- `planner` → `SPRINT.md`

### Spawn the agent
Spawn exactly ONE agent at a time via the Agent tool with the prompt above. Wait for completion. Do not spawn the next stage until this one finishes.

### Save the artifact
The agent writes their artifact to the chain directory. After the agent returns, verify the file exists:
```bash
test -f {chain_dir}/{artifact filename}
```

If missing, the stage failed — print which stage, stop the chain, allow user to re-run.

### Print stage summary
```
✅ Stage {N}/{total} — {agent}: {artifact filename}
```

## Step 3 — Final output

After the last stage:

```
🔗 Chain complete.

Artifacts in {chain_dir}/:
  1-mariam-RESEARCH.md       (Mariam, stage 1)
  2-hussain-pm-SCOPE.md      (Hussain-PM, stage 2)
  3-planner-SPRINT.md          (Planner, stage 3)

Next step:
/rihal:execute {chain_dir}/3-planner-SPRINT.md

─── ~5K tokens per stage · {duration}s · {stage-count} agents ───
```

The "next step" line is a single copy-paste command — see `.rihal/references/command-redirect-format.md`. The footer uses the estimation from `.rihal/references/response-style.md#session-cost-footer`.

## Step 4 — Update state

```bash
node .rihal/bin/rihal-tools.cjs state record-chain \
  --slug "{slug}" \
  --agents "{comma-separated}" \
  --artifacts "{chain_dir}"
node .rihal/bin/rihal-tools.cjs state record-session
```

Silent on failure — state tracking is optional.

## Success Criteria

- [ ] All agents in the chain spawned and executed sequentially
- [ ] Each stage produces an artifact file in chain_dir
- [ ] Artifact filenames follow naming convention: `{stage}-{agent_id}-{artifact_name}.md`
- [ ] State updated with chain record and session timestamp

## Presets reference

| Preset | Chain | Use when |
|--------|-------|----------|
| `research-plan` | mariam → hussain-pm → planner | Have an idea, want SPRINT.md |
| `feasibility` | waleed → fatima | Technical decision with QA gate |
| `gtm-to-build` | mariam → hussain-pm → waleed | Market → scope → tech reality check |
| `full-discovery` | mariam → sadiq → hussain-pm → waleed → planner | Full validation before committing |

## Differences from /rihal:council

| | /rihal:council | /rihal:chain |
|--|--|--|
| Execution | Parallel (Round 1 + cross-talk Round 2) | Sequential (one at a time) |
| Output | One session artifact with all agent voices | One artifact per agent |
| Best for | Debate, disagreement, multiple perspectives | Pipelines where each stage builds on the last |
| Subsequent use | `/rihal:plan {session}` converts follow-ups to plans | Last stage often IS a SPRINT.md already |

## On Error

- **No arguments:** print usage block, stop.
- **Pure decision question detected:** redirect to council (Step 0.5).
- **Unknown preset:** list valid presets, stop.
- **Agent not installed:** print installed agents, suggest closest match.
- **state.json missing or corrupted:** continue without error — chain artifacts are mandatory, state tracking is optional.
- **Stage fails to produce artifact:** print stage number, allow `/rihal:chain --continue` to resume.
- **Agent returns empty output:** print "Agent produced no output. Check input and retry."
- **`rihal-tools.cjs` missing:** tell user to run `rihal-code install-v2`.
