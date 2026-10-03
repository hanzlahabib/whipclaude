# Karpathy Coding Guidelines

Behavioral guidelines derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls. Every rihal agent that writes, reviews, or refactors code must internalize these four principles.

**Tradeoff:** These bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**Rihal application:** In Round 1 of council/chain, every agent's response must include an `## Assumptions` block listing load-bearing assumptions. rihal-planner must ask via AskUserQuestion before writing a plan when scope is ambiguous. rihal-executor must stop on Rule 4 deviations and return a checkpoint, not silently guess.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Test: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**Rihal application:** rihal-planner tasks must be single-purpose. rihal-executor must not add abstractions during task execution (deviation Rule 2 applies only to missing critical functionality, not speculative flexibility). rihal-code-review explicitly flags overengineering.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

**Rihal application:** rihal-executor commits must only include files its tasks touched. The deviation scope boundary (out-of-scope warnings logged to deferred-items.md, not fixed) enforces this. rihal-code-review-fix must not change style in files it's auditing.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**Rihal application:** Every task in a SPRINT.md must have a "Done when:" clause that's externally verifiable. rihal-executor self-check loop verifies Done-when conditions were met. rihal-sprint-checker rejects plans where tasks have vague success criteria.

## Enforcement

Agents that write or modify code (rihal-executor, rihal-planner, rihal-tech-writer, rihal-codebase-mapper when producing code docs) must:
1. @-include this file
2. Apply the 4 principles as hard constraints, not suggestions
3. Reference the specific principle when refusing to make a change (e.g., "Declining per Karpathy #3: that's adjacent to the requested change but not part of it")

## Credit

Original principles by Andrej Karpathy. Reference implementation by Forrest Chang at github.com/forrestchang/andrej-karpathy-skills. Adapted and extended for rihal's multi-agent architecture.
