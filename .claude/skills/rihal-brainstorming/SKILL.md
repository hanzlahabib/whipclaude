---
name: rihal-brainstorming
description: >
  Facilitate interactive brainstorming sessions using diverse creative
  techniques and ideation methods. Activates when the user says "brainstorm",
  "help me brainstorm", "help me ideate", "ideation session", "creative
  thinking", "generate ideas", "idea generation", "divergent thinking",
  "lateral thinking", or "think outside the box". Do NOT use for strategic
  analysis (use rihal-sadiq-analyst) or product requirements (use rihal-create-prd).
user-invocable: true
---

Structured brainstorming facilitator that guides users through creative ideation using techniques from brain-methods.csv. Aims for 100+ ideas before organizing, using anti-bias protocols to push past obvious solutions.

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

A brainstorming session document saved to `{output_folder}/brainstorming/` containing:
- Session metadata (date, topic, techniques used)
- Raw idea list (numbered, 100+ target)
- Grouped themes after divergent phase
- Top ideas selected by user with rationale

## Examples

### Happy path
**User:** "brainstorm features for our mobile app"
**Result:** Facilitator runs session setup → technique selection → 100+ ideas generated → grouped into themes → user selects top 5

### Edge case
**User:** "brainstorm" (no topic)
**Result:** Facilitator asks clarifying questions about domain, constraints, and goals before starting

### Negative boundary
**User:** "analyze our competitors"
**Result:** Not a brainstorming task → route to `rihal-sadiq-analyst`

Facilitates structured brainstorming with diverse creative techniques — SCAMPER, reverse brainstorming, mind mapping, six thinking hats, and more. Aims for 100+ ideas before organization using anti-bias protocols to push past obvious answers.

Follow the instructions in ./workflow.md.

## Output Format

```markdown
## 🧠 Brainstorming Session — {topic}

### Session Setup
- **Technique:** {technique-name}
- **Participants:** {user} + facilitator
- **Goal:** {session-goal}

### Ideas (Raw)
1. {idea-1}
2. {idea-2}
...

### Clusters
| Cluster | Ideas | Top Pick |
|---------|-------|----------|
| {name}  | #1, #5, #12 | {best} |

### Next Steps
- [ ] {action-1}
- [ ] {action-2}
```

## Examples

### Happy path
**User:** "brainstorm ways to improve our onboarding flow"
**Result:** Facilitator runs SCAMPER + reverse brainstorming, generates 40+ ideas, clusters into UX improvements / content changes / automation, surfaces top 5 actionable picks.

### Edge case
**User:** "brainstorm" (no topic)
**Result:** Facilitator asks "What topic or challenge would you like to brainstorm about?" before proceeding.

### Negative boundary
**User:** "brainstorm which tech stack to use"
**Result:** Redirects to `/rihal:council` or Waleed (CTO) — architecture decisions need structured ADR evaluation, not open ideation.
