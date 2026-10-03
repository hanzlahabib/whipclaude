# Model Profiles

Rihal v2 supports four model profile configurations that control which Claude model variant is assigned to each agent. Use the `resolve-model` subcommand to look up the model for a specific agent under the active profile.

## Profile definitions

### quality

Optimized for reasoning-heavy agents that make strategic decisions or verify work. Uses Claude 3.5 Opus for maximum capability on complex analysis; Haiku for lightweight utilities.

| Agent | Model | Role |
|-------|-------|------|
| rihal-sadiq | claude-3-5-opus-20241022 | Strategic priority, decision framing |
| rihal-waleed | claude-3-5-opus-20241022 | Architecture, technical feasibility |
| rihal-planner | claude-3-5-opus-20241022 | Plan generation and task breakdown |
| rihal-sprint-checker | claude-3-5-opus-20241022 | Plan verification and quality gates |
| rihal-fatima | claude-3-5-sonnet-20241022 | QA strategy and release readiness |
| rihal-executor | claude-3-5-sonnet-20241022 | Task execution and implementation |
| rihal-verifier | claude-3-5-sonnet-20241022 | Post-execution verification |
| All others | claude-3-5-haiku-20241022 | Utility agents, research, synthesis |

### balanced

Standard configuration. Uses Claude 3.5 Sonnet for all agents, balancing speed and capability.

| Agent | Model |
|-------|-------|
| All agents | claude-3-5-sonnet-20241022 |

### budget

Cost-optimized. Uses Claude 3.5 Haiku for all agents, prioritizing latency and cost over maximum reasoning capability.

| Agent | Model |
|-------|-------|
| All agents | claude-3-5-haiku-20241022 |

### inherit

No model override. Agents use the model specified by the parent session context (e.g., Claude Code's current model selection). Useful for keeping subagent model aligned with the user's environment.

| Agent | Model |
|-------|-------|
| All agents | (inherited from parent) |

## Configuration

The active profile is set in `.rihal/config.yaml` under the key `model_profile`:

```yaml
user_name: User
project_name: my-project
communication_language: English
mode: guided
model_profile: balanced
```

If `model_profile` is absent or unrecognized, the default is `balanced`.

## Usage

To query the model for an agent under the current profile:

```bash
node .rihal/bin/rihal-tools.cjs resolve-model <agent-id>
```

Example:

```bash
$ node .rihal/bin/rihal-tools.cjs resolve-model rihal-sadiq
claude-3-5-opus-20241022

$ node .rihal/bin/rihal-tools.cjs resolve-model rihal-executor
claude-3-5-sonnet-20241022
```

When spawning a subagent in a workflow, use the resolved model:

```bash
MODEL=$(node .rihal/bin/rihal-tools.cjs resolve-model <agent-id>)
# Pass $MODEL to the Task spawn instruction
```

## Design rationale

- **quality** is recommended for council (advisor agents) and plan/execute gatekeepers where reasoning depth matters.
- **balanced** is the default and suitable for most projects.
- **budget** is for rapid iteration cycles or cost-constrained environments where latency is acceptable.
- **inherit** allows parent context (Claude Code, IDE harness) to fully control model selection, useful when testing or when the user has explicit model preferences in their session.
