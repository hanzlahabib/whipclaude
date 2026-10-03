# No Unauthorized Git Operations

Shared reference `@`-included by every workflow and agent. This is a hard safety contract, not a suggestion.

## The rule

**Never perform these git operations without explicit, current, per-invocation user consent:**

- `git push` / `git push --force` / `git push --force-with-lease`
- `git worktree add` / `git worktree remove`
- `git branch <new-name>` (creating a new branch)
- `git checkout -b <new-name>` (creating and switching to a new branch)
- `git checkout --` / `git restore` / `git reset --hard` / `git clean -f` (destructive)
- `git rebase` / `git merge` (touching history)
- `git stash drop` / `git stash clear`
- `git tag` (creating tags)
- `git config --global` / `git config --system`

**Never pass `isolation="worktree"` to the Task tool without explicit user consent.** Worktree isolation silently creates a new git worktree under `.worktrees/` — that is a write operation the user may not want. If you believe isolation is genuinely needed, ask first via AskUserQuestion with explicit trade-offs.

## Why

These operations have one or more of:

- **Destructive** — can lose work (reset --hard, checkout --, clean -f)
- **Visible beyond local** — publishes state to remotes or affects other collaborators (push)
- **Creates state that requires cleanup** — worktrees, branches, tags
- **Hard to reverse** — rebase, merge, force-push

The user's trust surface is "I asked for X, I got X — nothing more." Silently adding branch/worktree/push operations violates that contract. One unauthorized worktree is irritating. One unauthorized force-push is lost work.

## What IS allowed without explicit consent

- `git status`, `git log`, `git diff`, `git show`, `git branch --show-current` (read-only)
- `git add <specific-files>` (stage specific files you're about to commit — never `-A` or `.`)
- `git commit -m "..."` (commit staged changes — subject + conventional format)
- `git stash push` (stash uncommitted changes before a read operation that might be destabilized)
- `git worktree list` (read-only inspection)

## Confirmation pattern

When a workflow genuinely needs a gated operation, use AskUserQuestion with:

1. **What the operation will do** (in plain English)
2. **Why it's needed for this task** (not abstract — specific)
3. **What the reversal path is** (how the user undoes it if they regret)
4. **Default = no** (the safe option must be the default)

Example:

```
Spawn the debug agent with git worktree isolation?

  • Creates a new worktree at .worktrees/debug-ttft-1959/
  • Agent edits stay isolated until you review + merge
  • Undo: git worktree remove .worktrees/debug-ttft-1959

[yes / no — default no]
```

## Agent enforcement

Every Rihal agent that can execute shell commands (rihal-executor, rihal-debugger, rihal-planner, rihal-tech-writer, etc.) must:

1. Reject any prompt asking them to perform a banned operation without a prior user-confirmed authorization in their input
2. Surface a warning if a parent workflow or user prompt tries to include a banned flag
3. Prefer read-only alternatives when the task can be accomplished without state mutation

## Escalation

If an operation seems necessary but falls in the banned list, STOP and ask. The cost of asking is 5 seconds. The cost of an unauthorized worktree, branch, or push can be lost work, confused collaborators, or broken trust.

The user typed "do X" — do exactly X. Never more.
