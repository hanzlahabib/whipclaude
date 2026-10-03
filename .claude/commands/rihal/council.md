---
name: rihal:council
description: Convene the Rihal majlis — spawns 3-5 specialist subagents in parallel to answer a strategic question. Agents are picked by keyword scoring.
argument-hint: "<question> [--full] [--agents=a,b,c] [--explain]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Task
  - AskUserQuestion
---

<objective>
Convene 3-5 specialist agents in parallel to answer a strategic question. Agents picked by keyword scoring, responses synthesized into actionable decision.
</objective>

<execution_context>
@.rihal/workflows/council.md
</execution_context>

<process>
Execute the council workflow from @.rihal/workflows/council.md end-to-end.
Use rihal-tools.cjs classify-question and select-panel to pick agents. Spawn agents in parallel. Synthesize responses.
</process>
