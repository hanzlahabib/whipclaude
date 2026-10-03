# Output Realism — Batch, Confirm, Don't Silently Overrun

Shared contract for all Rihal agents and workflows that take user requests. Enforces honest pushback when scope can't fit one response, instead of producing thin or truncated output.

## The Rule

**A single agent response has finite output capacity.** Approximate working budget: **32,000 output tokens** (~12,000 words of prose, or ~1,500 lines of code). Large-context models extend *input*, not *output*.

Before committing to execute a request, estimate output size. If the work exceeds one response's budget, **STOP and propose a batch plan**. Do not start executing and stop mid-way — the user gets unfinished work and a confused transcript.

## When to Invoke

Any time a request implies output volume like:

- "Write N blog posts / pages / stories" where N × 1000 words > 10,000 words
- "Implement all of these features in one go" spanning > 10 files or > 1500 lines
- "Complete everything in this roadmap/backlog" without a scoped phase
- "Don't stop until done" paired with ambitious open-ended scope
- Generating long documentation sets (API docs, migration guides, full READMEs for multiple modules)
- Any refactor touching > 20 files

## The Response Pattern

When the budget analysis says the request can't complete in one response, reply with **four blocks**:

1. **Honest scope audit** — one-sentence summary of what the user actually asked for, then the realistic size (word/line/file count).
2. **Why one response won't fit** — specific bound (output tokens, file count, context window pressure on coherence). Name the constraint.
3. **Proposed batches** — 2-5 batches with clear names, contents, and acceptance. Highest-ROI batch first.
4. **Explicit ask** — "Batch 1 start karun?" / "Shall I start with Batch 1?" — wait for confirmation before any edits/writes.

Keep the whole response under ~300 words. Tone: colleague-honest, not apologetic.

## Anti-Patterns — Do Not

- **Silent truncation.** Writing 3 of 12 items without telling the user.
- **Thin content to fit.** Generating 12 × 300-word blog posts when 12 × 1000 was asked — Google penalizes thin/duplicate content.
- **"Let me try anyway."** Trying to cram → runs out mid-stream → user loses trust + has to re-prompt.
- **Refusing without a plan.** "Too big" alone isn't useful. Always propose batches.
- **Asking after starting.** Batch audit happens *before* the first edit/write, not after.

## Rihal Agent Specifics

- **rihal-planner:** If `## Scope` from orchestrator implies > 8 tasks of real work, return a PLANS.md with *multiple* SPRINT.md files (waves) instead of one overloaded plan.
- **rihal-executor:** If a SPRINT.md would require > 1500 lines of new/changed code to execute, stop at Step 2 (load plan) and return a "plan too large — suggest wave split" checkpoint instead of executing.
- **rihal-roadmapper:** Phase size cap: one phase = one coherent batch that a solo developer + AI can reasonably ship in 1-3 focused sessions.
- **/rihal:autonomous** and **/rihal:do --auto:** Even in auto mode, pause at the first batch boundary that exceeds output budget. "Don't stop until done" authorizes local commits, not output-budget violations.

## The Core Philosophy

> Quality > quantity. Confirming a batch plan takes 10 seconds. Recovering from a half-truncated response wastes both sides' time and erodes trust.

Honest pushback is a feature, not a bug.
