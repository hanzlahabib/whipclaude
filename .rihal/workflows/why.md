<purpose>
Explain the reasoning behind a Rihal decision: why this panel was selected, why this question was classified, why this deviation was logged, or cite a prior decision from state.json.
</purpose>

## Step 0: Usage Check

Verify non-empty argument: `/rihal:why <topic-or-question>`

Examples:
- `/rihal:why should I use waleed for this question`
- `/rihal:why did it classify as codebase`
- `/rihal:why did we deviate from the plan`
- `/rihal:why choose this tech stack`

If empty: `Usage: /rihal:why <topic-or-question>`

## Step 1: Detect What User Is Asking About

Parse the question to determine category:

1. **Panel selection**: If contains "panel", "waleed", "hussain", "fatima", "sadiq" → Branch to Step 2a
2. **Classification**: If contains "classify", "type", "question type", "category" → Branch to Step 2b
3. **Deviation**: If contains "deviation", "deviate", "didn't follow" → Branch to Step 2c
4. **General decision**: Default → Branch to Step 2d

## Step 2a: Panel Selection Reasoning

Run: `node .rihal/bin/rihal-tools.cjs select-panel "$ARGUMENTS" --explain`

Output shows:
```json
{
  "panel": ["waleed", "hussain"],
  "scores": { "waleed": 85, "hussain": 78, "fatima": 62 },
  "question": "user question here"
}
```

Format output as:

```
📋 Panel Selection for: {question}

Selected: {panel agents joined with commas}

Scoring breakdown:
{table of all agents with scores, sorted descending}

Why this panel:
- {top agent}: {reason from scoring logic}
- {next agent}: {reason}

Alternative considered: {2nd place agent} scored {score} but lower fit for this question type
```

## Step 2b: Question Classification

Run: `node .rihal/bin/rihal-tools.cjs classify-question "$ARGUMENTS"`

Output shows classification type and signals matched.

Format output as:

```
🏗️ Question Classification: {question}

**Type:** {codebase|discovery|market|greenfield|team|release|design}

**Signals matched:**
{list the matched phrases from the question}

**What this means:**
- Codebase: existing code analysis — scan codebase, use engineer panel
- Discovery: choosing what to build — requires research/market context
- Market: external context — may need research agents
- Greenfield: starting from scratch — consider deep requirements phase
- Team: people/process questions — involve PM, leadership agents
- Release: production/shipping — involve ops, security agents
- Design: UX/visual — involve design agents

**Recommendation:** {brief next step based on classification}
```

## Step 2c: Deviation Reasoning

Read `.rihal/state.json` and extract `executions[].deviations[]`:

For each deviation in the most recent execution:

```
🛡️ Deviation: {deviation.title}

Reason: {deviation.reason}
Impact: {deviation.impact}
Timestamp: {when it occurred}
Context: {brief context from plan_id that was executed}
```

If no deviations found: `No deviations logged in current state.`

## Step 2d: General Decision Lookup

Read `.rihal/state.json` and search `decisions[]` for entry matching the topic.

If found:

```
📋 Decision: {decision.title}

**Made:** {timestamp}
**Category:** {category}
**Reasoning:** {decision.reasoning}
**Alternatives considered:** {decision.alternatives}
**Next decision point:** {decision.next_checkpoint}
```

If not found: `No recorded decision matches "{ARGUMENTS}". Use /rihal:progress to see recent context.`

## Success Criteria

- [ ] Category detected correctly
- [ ] Relevant data fetched from state.json or rihal-tools
- [ ] Output explains the "why" with data and reasoning
- [ ] Format is scannable (tables, bullets, clear sections)

## On Error

- rihal-tools error → Show error message
- state.json missing → `State not initialized. Run /rihal:new-project first.`
- No match found → Suggest `/rihal:progress` for context
