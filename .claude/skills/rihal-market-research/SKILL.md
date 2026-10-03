---
name: rihal-market-research
description: >
  Analyze market size, competitive landscape, customer needs, and trends for
  a product or industry. Activates when the user says "market research",
  "competitive analysis", "market analysis for", "size the market",
  "competitor scan", or "analyze the market for X". Do NOT use for domain
  deep-dives (use rihal-domain-research) or technical feasibility.
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- Report: TAM/SAM/SOM (with sources) | Direct Competitors (3-5) | Indirect Alternatives | Customer Segments | Trends | Recommendation
- Every number cites a source
- Saved to .rihal/artifacts/research/market-{slug}.md
- Do NOT invent market sizes

## Examples

### Happy Path
**Input:** "Market research for AI legal assistants in the GCC"
**Expected behavior:** Source-backed TAM/SAM/SOM, competitor scan, segment analysis, recommendation.

### Edge Case: Niche Market
**Input:** (tiny addressable market)
**Expected behavior:** Report honestly: "SAM is ~$X — may be too small for VC-scale investment. Consider adjacency or pivot."
