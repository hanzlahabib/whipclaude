# Rihal Commit Conventions

Shared reference `@`-included by every workflow that creates or modifies git artifacts.

## Detect project-local conventions FIRST (mandatory)

Before writing any commit, scan the project for local commit standards and let them **override** the defaults in this file. Check in this priority order — stop at the first one that yields a concrete allowed-types + allowed-scopes list:

1. **`commitlint.config.{js,cjs,ts,mjs,json}`** — most authoritative. Parse `rules['type-enum']` and `rules['scope-enum']`.
2. **`.github/workflows/semantic*.{yaml,yml}`** — GitHub Semantic PR action. Parse `types:` and `scopes:` blocks under `amannn/action-semantic-pull-request`.
3. **`.github/COMMIT_CONVENTIONS.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`** — look for sections naming allowed types/scopes.
4. **`git log --oneline -50`** — infer from past 50 commits: extract `type(scope):` prefixes, take the set that appears ≥2 times.

Run this cheaply before composing the commit:

```bash
# Priority 2 example — semantic PR action scopes
if [ -f .github/workflows/semantic.yaml ] || [ -f .github/workflows/semantic.yml ]; then
  echo "--- project semantic PR config ---"
  cat .github/workflows/semantic*.y*ml 2>/dev/null | sed -n '/types:/,/scopes:/{p}; /scopes:/,/[A-Za-z]*:/{p}'
fi
# Priority 4 fallback — infer from history
git log --oneline -50 | grep -oE '^[a-f0-9]+ [a-z]+\([a-z0-9-]+\):' | awk '{print $2}' | sort -u
```

**If the project defines scopes, you MUST pick from that list.** Do not invent new scopes (e.g., `branding` when only `web, server, docker, k8s, e2e, docs, ci, deps, ml, strapi` are allowed). A commit that fails the project's semantic PR check wastes the user's CI run and signals the workflow didn't read the repo.

If no project list exists, fall back to the generic rihal scopes in the "Format" section below.

## Format

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `revert`
- **scope** (optional): a short noun describing the affected area — `council`, `install`, `agents`, `workflows`, `references`, `cli`, `docs`, `test`
- **subject**: lowercase first letter, imperative mood, no trailing period, under 72 characters

Example:
```
feat(council): parallel subagent dispatch via Task tool
fix(install): hash-check skipped symlinked files
docs(agents): add Fatima's default moves
```

## The subject line is load-bearing

The subject is read by:

- Other engineers browsing `git log --oneline`
- `git blame` users hunting for context
- CI semantic-release parsers (which auto-bump versions)
- Future-you in 6 months

Every word counts. "fix bug" is never acceptable. "fix(council): panel scoring ignored --agents flag" is.

## Body

If the commit needs more than a subject, leave one blank line and write a body. The body explains **why**, not **what** — the diff already shows what changed.

```
feat(council): parallel subagent dispatch via Task tool

The v1 council fired 13 personas sequentially in one Claude context,
producing one voice with 13 hats. The v2 council spawns each selected
agent as a first-class subagent via the Task tool, running in parallel.

Benefits:
- Real independence — each subagent has its own context and cannot
  be biased by what the previous agent said
- Parallel latency — 3 agents respond in ~max(each) instead of sum
- Smaller orchestrator context — each subagent's output is summarized
  back rather than accumulated in the parent

Replaces cli/lib/council-panel.cjs caller paths in the slash command
template.
```

## What NOT to put in commits

Per `/home/hanzla/development/rihal-code/CLAUDE.md` and `AGENTS.md`:

- **Never** add `Generated with Claude Code` or `Co-Authored-By: Claude` trailers
- **Never** add `🤖 Generated` markers
- **Never** use `--no-verify` to bypass hooks
- **Never** use `git add -A` or `git add .` without reading what would be staged

The project explicitly rejects AI attribution in commit messages. Human authorship is the default and the only acceptable form.

## Staging

Always stage specific files:

```bash
git add rihal/agents/rihal-sadiq.md rihal/agents/rihal-waleed.md
```

Not:

```bash
git add .
```

The `.` form stages untracked config files, secrets, and scratch directories that shouldn't be in the commit. Specific staging forces you to see what you're committing.

## Push authorization

**Never run `git push` without explicit human approval on that specific push.** Prior authorization for one push does not transfer to the next. This is a hard rule in `AGENTS.md` and it applies to every workflow that touches git.

Workflows that produce commits must hand back to the user at the end and wait for an explicit "push" before running `git push`. If the user has not typed the word "push", the workflow stops at the commit step.

## Commit from a workflow

When a Rihal workflow creates a commit on the user's behalf:

1. **Run the "Detect project-local conventions" scan** above. Pick scope from the project's allowed list if one exists.
2. Stage only the files the workflow actually modified (never `-A`)
3. Write the subject as `type(scope): subject` using project-local types/scopes when defined, generic rihal scopes only as fallback
4. If the body adds real value (the why isn't obvious from the diff), include it
5. Do not sign with AI attribution
6. Print the commit SHA and one-line summary to the user
7. **Stop.** Do not push. Wait for explicit authorization.
