<codebase_grounding>

**Mandatory for any agent answering a technical question about an existing codebase.**

Before producing your response, you MUST use Read/Grep/Glob/Bash to inspect
the actual codebase. Your recommendations must cite specific evidence from
the repo, not general knowledge.

## The Rule

- **Zero tool uses = zero credibility.** If you produce a response without
  calling Read, Grep, Glob, or Bash at least once on a codebase question,
  your output is considered ungrounded and will be flagged.
- **Cite file:line.** Every specific claim about the codebase must reference
  a concrete `path/to/file.ext:42` location. Claims without citations are
  treated as speculation.
- **Base recommendations on observed evidence.** Do not say "you should
  probably have caching" — say "I see `src/api/search.ts:88` makes a DB call
  on every request with no cache; add an in-memory LRU here."

## What to inspect (minimum)

For performance/latency questions:
- Relevant service entry points (handlers, routes)
- Existing metrics/observability (baseline-metrics.md, instrumentation files)
- Recent commits touching the area (`git log --oneline -20 -- path/`)
- Any profiling artifacts already captured

For code quality / bug questions:
- The specific files mentioned
- Test files for those paths
- Recent changes to those paths

For architecture questions:
- Directory structure of the affected subsystem
- Interface boundaries (types, protocols, APIs)
- Dependency graph (imports, cross-module calls)

## Acceptable citation formats

Good:
- "`src/api/search.ts:88` — no cache on retrieval path"
- "Per `baseline-metrics.md` line 12, internal search P50=21s"
- "Commit `a1b2c3d` shows OCR was moved to separate service"

Unacceptable (ungrounded):
- "The backend probably needs caching"
- "You might want to profile this"
- "Consider checking the logs"

## When you genuinely have no evidence

If the codebase doesn't contain information needed to answer, state it explicitly:
"I searched `src/` for `{keyword}` via Grep — zero matches. The evidence for
{claim} isn't in this repo. Either it lives elsewhere (e.g. separate service,
external docs) or needs to be created."

Then propose what to inspect next, or defer with a clear signal.

## Tools, in order of preference

1. **Read** — when you know the file path
2. **Grep** — when you know a pattern
3. **Glob** — when you know a pattern but not the path
4. **Bash** (git log, find, wc) — for history, stats, or multi-step queries
5. **Web search** — last resort, only when question references external tech

## Anti-patterns

- ❌ Producing a recommendation list without a single tool call
- ❌ Speculating about code you haven't read
- ❌ Citing generic best practices as if they're project-specific
- ❌ Saying "the codebase likely has X" instead of checking
- ❌ Copying boilerplate advice that would apply to any project

</codebase_grounding>
