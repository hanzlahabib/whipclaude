# Workflow: rihal:discuss

<purpose>
Orchestrate a single-agent quick sync session. This is the lightweight alternative to council — one agent, one round, conversational tone, no mandatory artifact. Feels like texting one colleague, not calling a board meeting.
</purpose>

<output_format>
Lightweight — no full banner. Open with one-line header:
```
◆ Spawning {agent-id}...
```
Agent response opens with header: `🧭 **Sadiq (صادق) — Director of Strategy:**`.
No closure banner (discuss is lightweight). End with optional Next Up if the user should escalate: `Want to convene full council? /rihal:council <question>`.
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
/rihal:discuss [agent-name] <question>
```

**Examples:**
```
/rihal:discuss sadiq should I pivot this idea?
/rihal:discuss waleed what stack should I use for a multi-tenant SaaS?
/rihal:discuss what's the kill criterion for this project?
/rihal:discuss fatima is this release ready to ship?
```

Only after the user provides arguments, proceed to Step 0.5.

## Step 0.5 — Detect strategic decisions (redirect to council)

Run two checks in parallel — classifier AND panel scorer top-1. Either signal triggers the redirect.

```bash
TYPE=$(node .rihal/bin/rihal-tools.cjs classify-question "$ARGUMENTS" 2>/dev/null | grep -o '"type": *"[^"]*"' | cut -d'"' -f4)
TOP_AGENT=$(node .rihal/bin/rihal-tools.cjs select-panel "$ARGUMENTS" --top 1 2>/dev/null | grep -o '"panel": *\["[^"]*"' | cut -d'"' -f4)
```

**Redirect to council if EITHER condition holds:**

1. `question_type` is `market`, `discovery`, or `greenfield`
2. Top-scoring agent is `mariam` or `hussain-pm` (these signal market/scope intent — better answered by a council)

The classifier can mistype overloaded words like "launch", but the panel scorer uses richer keyword tables (Mariam owns dubai/uae/affiliate/launch/business). Combining both signals catches more cases.

If either condition holds:

```
⚠ Strategic / market decisions benefit from multiple perspectives.

/rihal:discuss is single-agent. For "should we" questions across domains, use:

/rihal:council $ARGUMENTS
```

Only proceed past this step if both checks pass — question is tactical or single-domain (codebase, team, release, design) AND top agent is sadiq/waleed/fatima.

After Step 0.5 confirmation, proceed to load references by Reading:
- `.rihal/references/council-protocol.md` (agent conventions and response format)

<available_agent_types>
Use these exact `subagent_type` values when calling the Agent tool:

- `rihal-sadiq` — 🧭 Sadiq (Strategy)
- `rihal-waleed` — 🏗️ Waleed (CTO)
- `rihal-fatima` — 🛡️ Fatima (QA)
- `rihal-mariam` — 📣 Mariam (Marketing)
- `rihal-hussain-pm` — 📋 Hussain-PM (Product)
</available_agent_types>

## Step 1 — Initialize

Call the helper binary to parse arguments and resolve the agent:

```bash
INIT_JSON=$(node .rihal/bin/rihal-tools.cjs init discuss "$ARGUMENTS")
```

Parse the JSON for:

- `agent_id` — resolved agent id (may be `null` if first token wasn't a known agent)
- `question` — the cleaned question text (with agent name stripped if it was the first token)
- `config` — `{ user_name, project_name, language, mode }` from `.rihal/config.yaml`
- `paths` — `{ state, planning_root, sessions_dir, ... }`
- `question_type` — classification result
- `installed_agents` — list of installed agent ids

## Step 2 — Resolve agent

**If `agent_id` is not null:** use it directly. The init command already identified the first token as a known agent.

**If `agent_id` is null:** auto-route to the best agent by calling:

```bash
node .rihal/bin/rihal-tools.cjs select-panel "$QUESTION" --top 1
```

Use the first (and only) agent in the returned `panel` array.

Print: `💬 Discussing with {agent display name}...`

Display name mapping:
- `sadiq` → `🧭 Sadiq (Strategy)`
- `waleed` → `🏗️ Waleed (CTO)`
- `fatima` → `🛡️ Fatima (QA)`
- `mariam` → `📣 Mariam (Marketing)`
- `hussain-pm` → `📋 Hussain-PM (Product)`

## Step 3 — Optional codebase scan

**Only run this if `question_type` is `codebase`, `team`, or `release`.**

```bash
test -f .rihal/config.yaml && cat .rihal/config.yaml
test -f README.md && head -30 README.md
git log --oneline -5 2>/dev/null
```

Produce a 3-5 line "Context" summary from the output.

**Skip this step entirely** for `market`, `discovery`, `greenfield`, and `design` question types — they don't need codebase context for a quick discuss.

## Step 4 — Spawn single agent

Spawn the resolved agent via the Agent tool with this prompt:

```
You are being spawned for a quick Rihal discuss session.

## The user's question
{question}

## Context
{the summary from Step 2, or "No codebase context needed for this question type." if skipped}

## Session metadata
- Project: {config.project_name}
- User: {config.user_name}
- Communication language: {config.language}

## Instructions
This is a quick discuss session — one round, conversational tone. Be direct and concise.
Scale your response to the substance — a simple question gets a short answer.
Start your reply with your icon + name header.
```

Use `subagent_type` = `rihal-{agent_id}` (e.g., `rihal-sadiq`).

## Step 5 — Print response verbatim

Print the agent's response exactly as returned. No orchestrator note, no round labeling, no summarization. This is a conversation, not a formal session.

## Success Criteria

- [ ] Single agent selected and spawned (Sadiq, Waleed, Fatima, Mariam, or Hussain-PM)
- [ ] Agent response printed verbatim to user
- [ ] If guided mode and user saves: artifact written to `.planning/council-sessions/discuss-{date}-{slug}.md`
- [ ] Session recorded in `state.json` via rihal-tools.cjs

## Step 6 — Offer to save (guided mode only)

**If `config.mode === 'guided'`:** ask the user via AskUserQuestion:

```
Save this discussion? [y/N]
```

**If yes:** write a minimal artifact to `{paths.sessions_dir}/discuss-{YYYY-MM-DD}-{slug}.md`:

```markdown
# Discuss — {short question summary}

**Date:** {ISO date}
**Agent:** {agent display name}
**Project:** {config.project_name}

## Question
{original question}

## Response
{verbatim agent response}
```

Create `{paths.sessions_dir}` with `mkdir -p` if needed. The `{slug}` is a lowercase-hyphenated slug of the first 6 words of the question.

Print: `💾 Discussion saved: .planning/council-sessions/discuss-{date}-{slug}.md`

Append footer:
```
─── ~10K tokens · {duration}s · 1 agent ───
```

(Use estimation from `.rihal/references/response-style.md#session-cost-footer`)

**If no, or `config.mode === 'yolo'`:** skip saving entirely.

## Step 7 — Update state

```bash
node .rihal/bin/rihal-tools.cjs state record-session
```

This records the discuss session in `.rihal/state.json` as `last_session`.

## On Error

- **Empty arguments:** print usage block and stop (Step 0).
- **Question redirects to council:** print redirect message (Step 0.5).
- **state.json missing or corrupted:** continue without error — session artifact is mandatory, state tracking is optional.
- **`rihal-tools.cjs` not found:** tell the user to run `rihal-code install-v2`.
- **No installed agents:** print "No agents installed. Run `rihal-code install-v2`."
- **Agent id not in installed list:** print available agents and ask the user to pick one.
- **Agent returns empty response:** print "Agent responded empty. Check question clarity and retry."

</process>
