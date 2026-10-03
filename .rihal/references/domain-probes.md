# Domain Probes

When exploring an unfamiliar domain, ask structured questions to rapidly build a mental model. These probes are organized by category: **technical**, **product**, and **execution**. Use selectively — don't ask all 50 questions. Instead, identify which categories are most relevant to the current decision and ask 2-4 probes per category.

---

## Technical Probes

Ask these when exploring a tech stack, architecture, or infrastructure question.

### Stack & Constraints

- "What languages/frameworks does your codebase use?"
- "Are you locked into a specific tech stack, or can you choose?"
- "What's the oldest codebase you need to support — what Node/Python/Go version?"
- "Do you have legacy systems you must integrate with?"
- "What databases are currently in use, and can they be replaced?"

### Scale & Performance

- "How many requests/events per second does the system handle?"
- "What's your average response time today, and what's acceptable?"
- "How much data do you store, and is it growing? At what rate?"
- "Are you bottlenecked by computation, I/O, database, or something else?"
- "Do you need real-time or is eventual consistency acceptable?"

### Deployment & Operations

- "How is your code deployed — CI/CD, manual, containers, or serverless?"
- "Who operates the system? Is it self-managed or delegated to a platform team?"
- "How often do you deploy? Daily, weekly, or rare releases?"
- "Do you have monitoring/alerting, or is it seat-of-the-pants troubleshooting?"
- "What's your acceptable downtime — 99% uptime, 99.9%, or critical 24/7?"

### Dependencies & Integrations

- "What external APIs or services does this system depend on?"
- "Are there hard version requirements for any dependency?"
- "Do you have vendored (local copy) versions of any libs, or always use package managers?"
- "Are there compliance/licensing constraints — GPL, LGPL, commercial?"

---

## Product Probes

Ask these when exploring user needs, value, or competitive positioning.

### Users & Jobs to Be Done

- "Who is the primary user? (Developer, end-user, operator, etc.)"
- "What is the user trying to accomplish, and what currently gets in their way?"
- "How often do users interact with this? (Daily, weekly, one-time setup?)"
- "Are users internal (your team) or external (customers)?"
- "How many users are we talking about — 10s, 1000s, 1M+?"

### Success & Metrics

- "How will we know this feature is successful?"
- "What metric matters most — speed, reliability, cost, user satisfaction?"
- "What would constitute failure?"
- "Is there a measurable target — e.g., 'reduce bugs by 50%' or 'ship 3x faster'?"

### Constraints & Competition

- "Is there a competitive product your users might switch to?"
- "If so, what does the competitor do better/worse?"
- "Do you have unique IP or must you catch up on features first?"
- "Are there regulatory or compliance constraints (GDPR, SOC2, etc.)?"

### Business Context

- "Is this a revenue-generating feature or a cost-reduction tool?"
- "What happens if we don't build this — what's the status quo?"
- "Who funded this decision, and what's their main concern?"

---

## Execution Probes

Ask these when planning how to deliver and coordinate the work.

### Timeline & Resources

- "When do you need this ready — weeks, months, or after Q2?"
- "How many people can work on this? (You, a pair, a team?)"
- "Are people allocated full-time or splitting across projects?"
- "Do you have time for testing/QA, or is speed the only goal?"

### Knowledge & Unknowns

- "Has anyone on the team built something like this before?"
- "What's the biggest risk — technology, people, timeline, or budget?"
- "What do you NOT know yet, and when will you find out?"
- "Do you need research/spike, or can you start building immediately?"

### Handoff & Ownership

- "Who owns this after launch — the team that built it?"
- "Will someone need to operate/maintain this, and do they exist?"
- "Is this one-shot delivery, or ongoing iteration?"

### Decision Authority

- "Who decides if we're 'done' — you, a product owner, customers?"
- "Can decisions be changed mid-project, or are they locked?"
- "Who has veto power — budget, timeline, or technical choices?"

---

## How to Use Domain Probes

### In Conversation

1. **Identify the domain** — Technical? Product? Execution?
2. **Pick 2-3 relevant probes** from that category
3. **Ask conversationally** — Don't fire 10 at once
4. **Listen for gaps** — If an answer raises new questions, follow up
5. **Document assumptions** — Write down what you learned and what you're still unsure about

### In Written Briefs

If gathering info async:

```markdown
## Technical Questions

- [ ] What's your current tech stack?
- [ ] What's your scale — requests/sec, data volume?
- [ ] Bottleneck today: compute, I/O, database, or something else?
```

### Red Flags (Answer These First)

If you hear these answers, prioritize deeper exploration:
- "I don't know" (indicates missing context)
- "We haven't decided yet" (decision needed before planning)
- "It depends" (multiple scenarios — map them)
- Contradictory statements (reconcile before proceeding)

---

## Examples by Scenario

### Scenario: Adding a Search Feature

**Technical probes:**
- "How much data do you search across — 1K records, 1M?"
- "Real-time results or can it be eventual consistent?"

**Product probes:**
- "What do users search for — documents, users, something else?"
- "How many search queries per day?"

**Execution probes:**
- "Do you have a search library already (Elasticsearch, SQLite)?"
- "How much time to ship a basic version?"

### Scenario: Migrating to a New Framework

**Technical probes:**
- "How big is the current codebase — 10k, 100k, 1M+ lines?"
- "Are there third-party integrations we'd lose?"
- "What deployment platform — AWS, Docker, something custom?"

**Product probes:**
- "Does the end-user experience change, or is this internal?"
- "Will customers tolerate downtime during migration?"

**Execution probes:**
- "Can you migrate incrementally or must it be all-or-nothing?"
- "How much team momentum will this consume?"

### Scenario: Performance Crisis

**Technical probes:**
- "Bottleneck — slow queries, not enough cache, network bound?"
- "What's the acceptable latency target?"

**Product probes:**
- "How many users are affected?"
- "When did this start?"

**Execution probes:**
- "How urgent is this — hours or can we take a week?"
- "Who can debug this — someone on your team or do you need specialists?"

---

## Probe Patterns to Avoid

| Anti-Pattern | Problem | Better Approach |
|---|---|---|
| **Leading probes** | "You want to use Kubernetes, right?" | "What deployment platform are you considering?" |
| **Assumption stacking** | "Do you scale to 1M users with sub-100ms latency?" | Ask scale and latency separately |
| **Vague probes** | "What are your constraints?" | "What's your timeline, budget, and team size?" |
| **Too specific** | "Should we use PostgreSQL 14.5 or 15.2?" | "What database systems are you considering?" |
| **Skip unknowns** | Assume team knows answer | "Is this something you've solved before?" |

---

## Recovery: User Doesn't Know the Answer

If a user can't answer a probe:

1. **Validate uncertainty** — "That's common at this stage"
2. **Offer a default** — "Typical targets are X. Should we assume that?"
3. **Defer to research** — "We can spike on this before planning"
4. **Document the assumption** — "Assuming X. We'll revisit if wrong."

Example:
- Probe: "What's your scale target?"
- User: "I don't know"
- Response: "Typical starting point is 1K users. Should we design for that and revisit when you have clearer data?"
