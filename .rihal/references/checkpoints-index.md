# Checkpoints — Quick Reference

Plans execute autonomously. Checkpoints formalize interaction points where human verification or decisions are needed.

**Core principle:** the agent automates everything with CLI/API. Checkpoints are for verification and decisions, not manual work.

## Golden Rules

1. **If the agent can run it, the agent runs it** - Never ask user to execute CLI commands, start servers, or run builds
2. **The agent sets up the verification environment** - Start dev servers, seed databases, configure env vars
3. **User only does what requires human judgment** - Visual checks, UX evaluation, "does this feel right?"
4. **Secrets come from user, automation comes from the agent** - Ask for API keys, then the agent uses them via CLI
5. **Auto-mode bypasses verification/decision checkpoints** — When `workflow._auto_chain_active` or `workflow.auto_advance` is true in config: human-verify auto-approves, decision auto-selects first option, human-action still stops (auth gates cannot be automated)

## Checkpoint Types

| Type | Frequency | Use Case |
|------|-----------|----------|
| **human-verify** | 90% | Agent completed work, human confirms it's correct (visual checks, testing) |
| **decision** | 9% | Human must choose between options (tech selection, architecture, design) |
| **human-action** | 1% | Authentication gates or email verification links |

## Most Common Pattern: human-verify

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[What the agent automated and deployed]</what-built>
  <how-to-verify>[Exact steps to test - URLs, commands, expected behavior]</how-to-verify>
  <resume-signal>[How to continue - "approved", "yes", or describe issues]</resume-signal>
</task>
```

**Use for:**
- Visual UI checks (layout, styling, responsiveness)
- Interactive flows (click through wizard, test user flows)
- Functional verification (feature works as expected)
- Audio/video playback quality
- Animation smoothness
- Accessibility testing

## Execution Protocol

When the agent encounters `type="checkpoint:*"`:

1. **Stop immediately** - do not proceed to next task
2. **Display checkpoint clearly** using checkpoint format
3. **Wait for user response** - do not hallucinate completion
4. **Verify if possible** - check files, run tests, whatever is specified
5. **Resume execution** - continue to next task only after confirmation

## Full Details

For complete checkpoint examples, auth gate patterns, and decision-making templates, see `/rihal/references/checkpoints.md` (detailed reference with 30+ examples).
