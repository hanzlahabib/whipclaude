---
name: rihal-technical-research
description: >
  Research technical feasibility, architecture options, and implementation
  approaches for a proposed product or feature. Activates when the user says
  "technical research", "feasibility study", "research implementation
  options", "how would we build X", "what stack for", or "technical
  feasibility for". Do NOT use for final architecture decisions (use
  rihal-create-architecture) or market analysis.
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Report: Problem Framing | Approach Options (3+) | Trade-off Table | Recommended Approach | Risks | Next Steps
- Each approach is feasible and buildable with known tech
- Do NOT propose speculative tech without disclaimer
- Saved to .rihal/artifacts/research/technical-{slug}.md

## Examples

### Happy Path
**Input:** "Technical research: how to build real-time collaboration like Figma"
**Expected behavior:** Compare CRDTs vs OT vs event sourcing, trade-off table, recommended approach with risks.

### Edge Case: Speculative Request
**Input:** "Research how to build AGI"
**Expected behavior:** Decline speculative. "This is a research problem, not a technical feasibility. I can research narrower applications of current AI tech instead."
