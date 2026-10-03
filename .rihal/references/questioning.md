# Questioning Patterns

Effective exploration relies on **Socratic questioning** — progressively uncovering assumptions, clarifying intent, and narrowing scope through structured dialog.

## Question Types

### Open-Ended (Exploration Phase)
Probe for breadth and depth without constraining answers.

**Purpose:** Discover unknowns, surface vague thinking, generate ideas.

**Examples:**
- "What problem are you trying to solve?"
- "Walk me through how this currently works."
- "What would success look like?"
- "What constraints haven't we discussed yet?"

**When to use:**
- First contact with a new domain
- User's intent is fuzzy ("build a dashboard")
- Exploring edge cases or variations
- After a checkpoint, to reset assumptions

---

### Closed / Clarifying (Verification Phase)
Pin down specifics with binary or bounded responses.

**Purpose:** Confirm understanding, verify assumptions, reduce ambiguity.

**Examples:**
- "So you need real-time sync, not eventual consistency?"
- "Is this for internal use only, or customer-facing?"
- "Must this work offline?"
- "Budget constraint is $10k/month?"

**When to use:**
- You've heard the answer and need to confirm
- Narrowing from many options to the chosen few
- Verifying a critical decision before planning
- During a gate (approval/abort checkpoint)

---

### Follow-Up (Depth Phase)
Dig deeper into a specific answer without abandoning the main thread.

**Purpose:** Uncover hidden assumptions, validate reasoning, stress-test ideas.

**Examples:**
- "Why did you choose that approach?"
- "What would break if you didn't do X?"
- "Have you considered Y as an alternative?"
- "When did this constraint become important?"

**When to use:**
- A user answer is incomplete or hand-wavy
- Detecting contradictions between stated goals and requirements
- Stress-testing a design decision
- Building confidence that the user understands their own problem

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Fix |
|---|---|---|
| **Loaded questions** | "You do want scalability, right?" | Ask neutral: "What's your scalability target?" |
| **Question stacking** | "Is it real-time, cloud, and multi-tenant?" | Ask one at a time |
| **Assuming expertise** | "What's your latency budget in ms?" | Context first: "Do you have SLA constraints?" |
| **Freeform overload** | Multiple open-ended with no structure | Bracket by topic; use closed to confirm each bracket |
| **Interrupting answers** | "So it's like Netflix?" | Let the user finish, then follow up |

---

## Freeform Rule

When a user selects "Other" or provides freeform text:

1. **Read the text literally** — Don't paraphrase or "help" the user by guessing what they meant
2. **Ask one clarifying question max** — Confirm you understood the specific freeform input
3. **Don't drill into theory** — Stay focused on their stated goal, not the general problem space

**Example:**
- User: "Other: I want to sync data between 3 databases"
- Good follow-up: "Are these databases already running, or do you need to set them up?"
- Bad follow-up: "Have you considered the CAP theorem? Let me explain eventual consistency..."

---

## Socratic Conversation Structure

A well-paced Socratic conversation follows a natural arc:

```
1. Open Question (5-10 min)
   ↓ User provides high-level intent + constraints
2. Clarifying Questions (3-5 min)
   ↓ You confirm key decisions + rule out ambiguities
3. Follow-Up Questions (3-5 min)
   ↓ You stress-test reasoning + surface hidden assumptions
4. Summary + Confirmation (1-2 min)
   ↓ User confirms you understand correctly
5. Decision Gate
   ↓ Proceed to planning or revisit if gaps remain
```

Each phase should feel **natural, conversational**, not like a checklist. If the user volunteers information, use it; don't force a predetermined sequence.

---

## Context Checklist

After Socratic questioning, verify these dimensions were covered:

- [ ] **User intent** — What success looks like, why it matters
- [ ] **Scope** — Feature, product, initiative, or experiment?
- [ ] **Constraints** — Budget, timeline, team size, tech stack
- [ ] **Known unknowns** — What research is needed before planning?
- [ ] **Success metrics** — How will we measure completion?

If gaps remain after natural conversation, weave questions naturally. Don't suddenly shift to checklist mode.

---

## Recovery Patterns

### User Gives Vague Answer

**Pattern:** "I need it to be fast."

**Response:** 
1. Accept the answer (don't dismiss)
2. Clarify specifics: "What does 'fast' mean for your users — sub-second response, or <5 seconds?"
3. Offer benchmarks if user has none: "Typical targets are 100ms for web, 1s for mobile."

### User Contradicts Earlier Statement

**Pattern:** "We need real-time" vs. later "batch job at midnight is fine."

**Response:**
1. Surface the contradiction neutrally: "Earlier you mentioned real-time. Now you're describing batch?"
2. Let user reconcile: "Help me understand — which requirement is driving your design?"
3. Document the clarified intent

### User Says "I Don't Know"

**Pattern:** "I don't know how many users we'll have."

**Response:**
1. Validate the uncertainty: "That's common at this stage."
2. Propose exploration: "Should we scope for 100 users initially and design for 10k later?"
3. Document as a risk: "Scale assumptions to be revisited when user count is clearer."

---

## Tempo Rules

- **Early questions:** Slower, more open. Give user space to think.
- **Mid-conversation:** Tighter, more specific. Confirm each decision.
- **Late-stage:** Faster, very closed. Lock in decisions for planning.

If conversation stalls, revert to open questions to restart momentum.
