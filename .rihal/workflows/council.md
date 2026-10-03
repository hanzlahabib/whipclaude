# Workflow: rihal:council

<purpose>
Orchestrate a parallel panel of Rihal specialist subagents answering a strategic question. This is the v2 council — deterministic panel scoring via `rihal-tools.cjs`, parallel Task-tool spawning (not sequential roleplay), and structured artifact output to `.planning/council-sessions/`.
</purpose>

<output_format>
Open with banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► MAJLIS CONVENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Question: {$ARGUMENTS}
Panel: {N} agents selected by keyword scoring
```
TaskCreate: "Classify question type", "Select panel ({N} agents)", "Spawn agents in parallel", "Collect + synthesize responses", "Write artifact to council-sessions/".
Per-agent spawn indicator:
```
◆ Spawning panel in parallel:
  → 🧭 Sadiq (strategy)
  → 🏗️ Waleed (architecture)
  → 🛡️ Fatima (QA)
```
Agent headers when presenting responses: `🧭 **Sadiq (صادق) — Director of Strategy:**`.
Closure: `RIHAL ► COUNCIL COMPLETE ✓` + Next Up with decision options.
</output_format>

<required_reading>
@.rihal/references/output-format.md
</required_reading>

<process>
## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:
- Print the usage block below
- STOP — do not proceed to Step 1, do not read any reference files

**Usage:**
```
/rihal:council <question> [--full] [--verbose] [--agents=a,b,c] [--explain] [--resume <session-path>]
```

**Flag semantics:**
- `--full` — expanded panel (5 agents instead of 3), full panelist roster
- `--verbose` — print full verbatim agent transcripts inline (default is compact summary; artifact always has full text)
- `--debate` / `--round-2` / `--deep` — force Round 2 cross-talk even if consensus

**Examples:**
```
/rihal:council should I start a new project or continue this one?
/rihal:council --agents=sadiq,waleed,fatima is this plan ready to ship?
/rihal:council --explain what stack should I use for a multi-tenant SaaS?
/rihal:council --full should we rewrite the auth layer?
/rihal:council --verbose --debate deep-dive the TTFT tradeoffs
/rihal:council --resume .planning/council-sessions/council-2026-04-12-should-i-start.md
```

**With --resume:** continue a prior council session with a new question. The prior session context is surfaced to the panel.

Only after the user provides arguments, proceed to Step 0.5.

## Step 0.5 — Detect --resume flag (continuation mode)

If `$ARGUMENTS` contains `--resume <session-path>`:

1. Read the session artifact at `<session-path>`
2. Extract the prior "Panel Responses" section
3. Set `INPUT_TYPE='resume'` and load the prior session content into the observation block (Step 1 will use this as context)
4. Continue with the NEW question provided (if any) or ask user for a follow-up question

Proceed to Step 1 with the prior session context pre-loaded.

## Step 0.6 — Detect single-agent questions (STOP and redirect)

If `$ARGUMENTS` starts with an agent name (sadiq/waleed/fatima/mariam/hussain-pm) and looks like a question directed at one person (e.g., "ask waleed about X", "what does fatima think"):

```
⚠ That looks like a single-agent question — /rihal:discuss is faster.

Council spawns 3-5 agents in parallel for debate. For one expert, use:

/rihal:discuss $ARGUMENTS
```

Only proceed past this step if the input is a true multi-perspective question (e.g., "should we...?", "is X a good idea?", "which approach is best?").

After Step 0.6 confirmation, proceed to load references by Reading:
- `.rihal/references/council-protocol.md` (the 5-step majlis protocol and cross-talk conventions)

<available_agent_types>
Read the `installed_agents` array from INIT_JSON. Every entry can be invoked as
`subagent_type: "rihal-{id}"`. The classifier and panel scorer will surface only
agents present in this list.

Currently registered council agents (always available if installed):
- rihal-sadiq, rihal-waleed, rihal-fatima, rihal-mariam, rihal-hussain-pm

Specialist agents that may be installed (add to panel if scorer surfaces them):
- rihal-architect, rihal-ux-designer, rihal-tech-writer
- rihal-codebase-mapper, rihal-project-researcher, rihal-roadmapper
- (and any other rihal-* agent in installed_agents)

Do not invoke `general-purpose` or any agent type not present in
`installed_agents`. If the scorer surfaces an unknown agent, drop it
from the panel silently.
</available_agent_types>

## Step 1 — Observe

Before initialization, gather initial context signals:

```bash
# Check for fresh project indicators
test -f README.md && echo "has_readme=1" || echo "has_readme=0"
test -f .rihal/config.yaml && grep -q "user_name:" .rihal/config.yaml && echo "has_config=1" || echo "has_config=0"
test -f .rihal/state.json && grep -q "phases\|decisions" .rihal/state.json && echo "has_state=1" || echo "has_state=0"
test -f package.json -o -f Cargo.toml -o -f go.mod -o -f pyproject.toml && echo "has_build=1" || echo "has_build=0"
```

Count the signals. If 0 of 4 are true (fresh project), continue to Step 1.5.

## Step 1.5 — Fresh project guard

If the project appears fresh (no README, default config, no state, no build manifest):

Print warning and use AskUserQuestion to confirm:

```
⚠ This appears to be a fresh project with no context.
Council answers may be generic without project-specific signal.

Run /rihal:init first for richer context, or proceed anyway?
```

Options:
- "Run /rihal:init first" → Print: `Copy-paste this: /rihal:init` and STOP
- "Proceed anyway" → Continue to Step 2

## Step 1 — Initialize

Call the helper binary once to load all context:

```bash
INIT_JSON=$(node .rihal/bin/rihal-tools.cjs init council "$ARGUMENTS")
```

Parse the JSON for:

- `question` — the cleaned question text (ARGUMENTS minus flags)
- `flags.full` — boolean, `--full` was passed
- `flags.agents` — string[], explicit `--agents=...` list or empty
- `flags.explain` — boolean, show panel scoring
- `panel` — string[], the pre-computed panel (respects `--full` and `--agents`)
- `scores` — object, per-agent scoring for explain mode
- `question_type` — `"codebase" | "discovery" | "market" | "greenfield"` — drives Step 1 branching
- `question_signals` — string[], matched phrases that drove the classification
- `config` — `{ user_name, project_name, language, mode }` from `.rihal/config.yaml`
- `paths` — `{ state, planning_root, sessions_dir, references_dir }`
- `state_exists` — boolean, `.rihal/state.json` present
- `installed_agents` — the authoritative list of installed agent ids (for validation)

**If the panel contains any id not in `installed_agents`:** stop, print `Unknown agent: {id}. Installed: {installed_agents.join(', ')}`, exit.

## Step 2 — Pre-consultation context gathering

📁 Session artifact will be saved to: `.planning/council-sessions/council-{date}-{slug}.md`

**Branch on `question_type`** (returned by `rihal-tools.cjs init` as `question_type`):

- `codebase` — existing code question → codebase scan
- `performance` — latency/p95/throughput → codebase scan + read `baseline-metrics.md` if present
- `ml` — OCR/retrieval/LLM → codebase scan + read ML service paths
- `frontend` — React/UI/a11y/RTL → codebase scan + read component dirs
- `team` — people/process question → codebase scan (for team context from README/state) + no external research
- `release` — shipping/incident → codebase scan
- `design` — UX/brand → codebase scan
- `market` — external plan/geography/regulation → research pre-step
- `discovery` — what to build/which sector → research pre-step
- `greenfield` — starting from scratch → research pre-step

**Context grounding is mandatory for concrete technical categories.** For
`codebase`, `performance`, `ml`, `frontend`, `release` — the orchestrator
MUST pass the full "Observed context" block into each subagent's prompt so
panelists start grounded, not speculating. Subagents then Read/Grep/Bash
specific files to deepen their answer.

### If `question_type` is `"codebase"`, `"team"`, `"release"`, or `"design"` — run the codebase scan

Run this block ONCE. Target < 2k tokens output. Do not read files not listed here.

```bash
# Cheap, bounded signals only — orchestrator uses the output to brief subagents.
test -f .rihal/state.json && cat .rihal/state.json
test -f .rihal/config.yaml && cat .rihal/config.yaml
test -f README.md && head -60 README.md

# Only read build manifests for codebase/release questions
if [[ "$QUESTION_TYPE" == "codebase" || "$QUESTION_TYPE" == "release" ]]; then
  test -f package.json && head -40 package.json
  test -f pyproject.toml && head -40 pyproject.toml
  test -f Cargo.toml && head -40 Cargo.toml
  test -f go.mod && head -20 go.mod
fi

git log --oneline -20 2>/dev/null
ls -la
```

Emit a 5-8 line "Observed context" block to the user:

```
📁 Observed context (codebase)
   Stack: <detected stack>
   State: <current phase/sprint if any>
   Recent commits: <top 3 one-liners>
   Notable files: <any .md files that jump out>
```

### If `question_type` is `"market"`, `"discovery"`, or `"greenfield"` — run the research pre-step

Do NOT skip this step. A council that answers market questions from training data alone is producing confident guesses, not grounded advice.

1. Run 1-3 targeted `WebSearch` queries to gather real facts relevant to the question. Choose queries that will return authoritative sources (government plans, industry reports, named organizations).
2. Synthesize into a 6-10 line "Research context" block that names specific facts, sectors, figures, or constraints. This block is passed verbatim to every subagent.

```
📋 Research context (market/discovery)
   Source 1: <name + 2-line summary>
   Source 2: <name + 2-line summary>
   Key facts: <bullet list of 4-6 specific, citable data points>
   Constraints: <regulatory, geographic, or operational limits>
```

Also run the minimal codebase scan (config.yaml + README only) so subagents know the team's current capabilities:

```bash
test -f .rihal/config.yaml && cat .rihal/config.yaml
test -f README.md && head -40 README.md
```

This is the factual baseline every subagent will be briefed on. It replaces the v1 "vibes-based council" problem.

## Step 3 — Panel selection

**If `flags.explain` is true:** print the panel scoring table before proceeding:

```
Panel scoring:
  sadiq    [score]  — [top matched keyword or "padded"]
  waleed   [score]  — ...
  fatima   [score]  — ...

Selected: sadiq, waleed, fatima
```

**If `config.mode === 'guided'`:** confirm with the user:

```
Panel for this question: <comma-separated display names>
Proceed? [Y/n]
```

Use the AskUserQuestion tool (not raw stdin) for the confirmation.

**If `config.mode === 'yolo'`:** print the panel one-liner and proceed without confirmation.

## Step 4 — Spawn the panel in parallel (two rounds)

### Round 1 — Independent perspectives

**Spawn all panelists in a single response with multiple Task tool calls.** Do not spawn sequentially — the whole point of v2 is real parallel dispatch.

For each agent id in `panel`, build this prompt:

```
You are being spawned as part of a Rihal council session.

## The user's question
{question}

## Observed context
{the summary block from Step 1 — codebase scan OR research context depending on question_type}

## Session metadata
- Project: {config.project_name}
- User: {config.user_name}
- Communication language: {config.language}

## Instructions
This is Round 1 — give your independent perspective. Follow your agent file's
response format exactly. Scale to the substance — do not pad. Start your reply
with your icon + name header.
```

Spawn all at once:

```
(Task tool call with subagent_type = "rihal-sadiq", prompt = <above>)
(Task tool call with subagent_type = "rihal-waleed", prompt = <above>)
(Task tool call with subagent_type = "rihal-fatima", prompt = <above>)
```

All in the same assistant response block so they execute concurrently.

### Round 2 — Cross-talk

After Round 1 completes, spawn all panelists again in a single response. Pass each agent the full set of Round 1 responses and ask them to react:

```
You are in Round 2 of a Rihal council session.

## The user's question
{question}

## Observed context
{same summary as Round 1}

## Round 1 responses from your fellow panelists
### 🧭 Sadiq (Round 1)
{sadiq_round1_response}

### 🏗️ Waleed (Round 1)
{waleed_round1_response}

### 🛡️ Fatima (Round 1)
{fatima_round1_response}

## Instructions
This is Round 2 — cross-talk. Respond with **deltas only**:
- What changed in your position after reading your colleagues' Round 1 (walk-back, sharpen, narrow, extend)
- Where you specifically agree/disagree with another panelist (name them)
- If you hold your Round 1 position unchanged, say so in one sentence and stop.

Do NOT restate your Round 1 answer. Do NOT re-derive reasoning already in Round 1.
Target 6-12 lines max unless genuine new substance. Start with your icon + name header.
```

Spawn all at once (same pattern as Round 1).

**Default: SKIP Round 2.** Only fire Round 2 if at least ONE of these triggers:

1. **Disagreement** — Round 1 responses name contradictory approaches
   (e.g. Waleed says "rewrite", Yousef says "optimize in place"). Verbatim
   conflict, not stylistic difference.
2. **Unresolved dependency** — An agent explicitly said "I need X from {other agent}"
   or "this depends on {other agent}'s call."
3. **Question is strategic/ambiguous** — Classifier returned `discovery`,
   `greenfield`, or `market` (high-ambiguity categories). Not `codebase`,
   `performance`, `release`, `ml`, `frontend` (concrete technical categories).
4. **User requested deliberation** — `$ARGUMENTS` contains `--debate`, `--round-2`,
   or `--deep` flag.

If NONE of these fire, skip Round 2 and proceed to Step 5 (presentation).
Print one line: `✓ Round 2 skipped — {reason: "agents aligned" / "concrete technical question" / etc.}`.

**Rationale:** Round 2 doubles token cost and wall-clock. For concrete technical
questions (fix latency, add feature, debug bug), Round 1 responses grounded in
the codebase are enough. Cross-talk adds value only when there's genuine tension
to resolve or strategic ambiguity to explore.

## Step 5 — Present responses

Before saving any artifact, print the panel output inline. Two modes:

### Default mode (compact summary)

**Scannable in 20 seconds. No verbatim transcripts. Full text goes to the artifact file.**

Format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► COUNCIL VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**One-liners (Round 1)**
🧭 Sadiq:   {one-sentence position}
🏗️ Waleed:  {one-sentence position}
🛡️ Fatima:  {one-sentence position}

**Convergence / divergence**
| Issue | Sadiq | Waleed | Fatima |
|-------|-------|--------|--------|
| {axis 1} | {stance} | {stance} | {stance} |
| {axis 2} | {stance} | {stance} | {stance} |

{If Round 2 ran:}
**Round 2 deltas**
🧭 Sadiq:   {what changed, or "held position"}
🏗️ Waleed:  {what changed}
🛡️ Fatima:  {what changed}

**Orchestrator note**
{max 2 sentences — sharpest remaining disagreement OR clearest convergent action}

📄 Full transcripts: {artifact path}
```

Rules for compact mode:
- Each one-liner ≤ 25 words. Paraphrase, don't quote.
- Convergence table: 2-5 rows, only axes where panelists take a stance. Cells ≤ 6 words.
- Round 2 deltas: ≤ 15 words each. "Held position" is a valid delta.
- No section headers beyond the four above. No numbered story breakdowns. No tables from panelists verbatim.

### Verbose mode (`--verbose` flag)

Print Round 1 (and Round 2 if ran) verbatim in panel order. Do NOT summarize.

```
### Round 1

🧭 **Sadiq:**
<full verbatim response>

🏗️ **Waleed:**
<full verbatim response>

🛡️ **Fatima:**
<full verbatim response>

### Round 2 — Cross-talk
{same pattern}

---
**Orchestrator Note:** {max 3 sentences}
```

Before presenting, load the commit format reference:
- `.rihal/references/commit-conventions.md` (commit format rules for session-save artifact)

**Either mode:** the artifact file saved in Step 6 always contains full verbatim text — the compact/verbose flag only controls inline presentation.

## Step 5b — Drill-down question (MANDATORY when disagreement exists)

If Round 1 (or Round 2) surfaced a concrete disagreement between panelists,
you MUST use AskUserQuestion to force resolution before proceeding. Do NOT
just list "Next Up" options and leave — a disagreement with no decision
means nothing shipped.

Format the question as the specific tension the user needs to resolve,
with 2-4 concrete options reflecting the panelists' positions:

```
AskUserQuestion:
  question: "{Panelist A} says {X}. {Panelist B} says {Y}. Which do you pick?"
  header: "{short label}"
  options:
    - label: "{A's position, paraphrased}"
      description: "{tradeoff in one line — what you gain, what you lose}"
    - label: "{B's position, paraphrased}"
      description: "{tradeoff}"
    - label: "Both — in parallel tracks"
      description: "{only offer if feasible}"
    - label: "Discuss further with {agent-name}"
      description: "Route to /rihal:discuss for a deeper 1:1"
```

After the user picks, emit a one-line decision record and proceed to
Save step. The chosen path is what goes into the "Next Up" block —
the options list is no longer needed once a decision is made.

**Skip Step 5b only if:** there was genuine consensus (all agents aligned)
or user passed `--no-followup` flag.

## Step 6 — Save the session

Write the session artifact to `{paths.sessions_dir}/council-{YYYY-MM-DD}-{slug}.md`:

```markdown
# Council Session — {short question summary}

**Date:** {ISO date}
**Panel:** {comma-separated display names}
**Mode:** {guided | yolo}
**Project:** {config.project_name}

## Question
{original question}

## Observed Context
{the Step 1 summary block}

## Panel Responses

### Round 1
#### 🧭 Sadiq
{verbatim}

#### 🏗️ Waleed
{verbatim}

#### 🛡️ Fatima
{verbatim}

### Round 2 — Cross-talk
#### 🧭 Sadiq
{verbatim}

#### 🏗️ Waleed
{verbatim}

#### 🛡️ Fatima
{verbatim}

## Orchestrator Note
{if any}

## Follow-ups
{Extract concrete action items from the session. Read through ALL panelist responses and pull out:
- Explicit "next step" statements ("first, validate X", "before committing, answer Y")
- Open questions that need a human decision
- Risks that were named but not resolved
Format each as a checkbox:}
- [ ] {action item}
```

The `{slug}` is a lowercase-hyphenated slug of the first 6 words of the question. Create `{paths.sessions_dir}` if it doesn't exist (`mkdir -p`).

**Follow-ups must NOT be empty.** Every council session produces at least one actionable item. If panelists only asked clarifying questions, the follow-up is "Answer the panel's clarifying questions and re-run /rihal:council".

Print the artifact path to the user at the end:

```
💾 Session saved: .planning/council-sessions/council-2026-04-12-should-i-start-new-project.md

─── ~50K tokens · {duration}s · {5-agents} agents ───
```

(Use the footer format from `.rihal/references/response-style.md#session-cost-footer`)

### Step 6b — Update state (silent)

After the artifact is written, update `.rihal/state.json` with the council session record and session timestamp. These commands run silently — do not print output to the user for this step.

```bash
node .rihal/bin/rihal-tools.cjs state record-council \
  --slug "{slug}" \
  --panel "{comma-separated panel names}" \
  --artifact "{artifact path}"
node .rihal/bin/rihal-tools.cjs state record-session
```

> **Note:** If `rihal-tools.cjs` state commands fail (e.g. state.json missing or not yet initialized), continue without error — state tracking is optional, the session artifact saved in Step 5 is mandatory.

## Success Criteria

- [ ] All panelists selected and spawned in Round 1
- [ ] Round 1 responses collected from all agents
- [ ] Round 2 cross-talk executed (unless consensus or agent deferred)
- [ ] Session artifact written to `.planning/council-sessions/council-{date}-{slug}.md`
- [ ] State updated with session record and timestamp

## On Error

- **Empty arguments or --help:** print usage block (Step 0), stop.
- **Single-agent question detected:** redirect to `/rihal:discuss` (Step 0.5).
- **`rihal-tools.cjs` not found:** user has v1 installed or package broken. Tell user to run `rihal-code install-v2`.
- **Panel contains unknown agent:** print the installed-agent list and exit.
- **state.json missing or corrupted:** continue without error — session artifact is mandatory, state tracking is optional.
- **All panelists return empty responses:** likely subagents were spawned without proper prompts. Re-check Step 4 prompt construction.
- **`.rihal/config.yaml` missing:** warn and use defaults (`user_name=User`, `language=English`, `mode=guided`).

</process>
