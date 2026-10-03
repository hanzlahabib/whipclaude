---
name: rihal-party-mode
description: >
  Orchestrates group discussions between all installed Rihal agents, enabling
  natural multi-agent conversations with maintained personalities. Activates
  when the user says "party mode", "activate party mode", "start party mode",
  "group discussion", "team discussion", "talk to everyone", "bring all agents",
  "multi-agent chat", or "let's have a party". Do NOT use for: formal council
  decisions (use rihal-majlis-council), single-agent questions where one
  specialist is clearly the right owner (invoke that agent directly), or
  sprint ceremonies (use rihal-hussain-sm).
user-invocable: true
---

# Party Mode

Brings together the full Rihal agent team for natural multi-agent conversations. Each agent maintains their unique personality and expertise while a facilitator manages flow, relevance-based agent selection, and cross-talk.

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

Interactive conversation where each agent speaks in character with their emoji prefix. The facilitator selects 3-5 relevant agents per round based on the topic. Conversation continues until the user exits party mode.

```
🎯 Sadiq: [strategic perspective]
🏗️ Waleed: [technical perspective]
📋 Ahmed: [delivery perspective]
...
```

## Examples

### Happy path
**User:** "party mode — should we build a mobile app?"
**Result:** Facilitator loads team.yaml → selects Sadiq, Waleed, Hussain, Mariam → each speaks in character → user steers discussion

### Edge case
**User:** "party mode" (no topic)
**Result:** Facilitator asks what topic to discuss, then selects relevant agents

### Negative boundary
**User:** "convene the majlis for a formal decision"
**Result:** Not party mode → route to `rihal-majlis-council` for structured consensus with voting

## Output Format

Each party mode turn follows this pattern:

```
🎉 PARTY MODE — {topic}

**{Agent Emoji} {Agent Name} ({Role}):**
{Agent's response in their documented communication style}

**{Agent Emoji} {Agent Name} ({Role}):**
{Response, may reference previous agent's point}

---
💬 What would you like to discuss next? (say "exit" to end party mode)
```

## Examples

### Happy path
**User:** "party mode — should we build a mobile app?"
**Result:** Facilitator activates party mode, selects Sadiq (strategy), Waleed (CTO), Hussain (PM), and Mariam (marketing). Each gives perspective in-character. User can steer the conversation, address specific agents, or ask follow-ups.

### Edge case
**User:** "party mode" (no topic)
**Result:** Facilitator introduces the agent roster and asks "What would you like to discuss with the team today?"

### Negative boundary
**User:** "party mode — approve this PR"
**Result:** Redirects to `/rihal:code-review` — code review needs structured evaluation, not open discussion.
