# Git Integration Reference

Defines 3 branching strategies for rihal workflows and when to use each.

---

## Configuration

Add to `config.yaml`:

```yaml
git:
  branching_strategy: "feature-branch"  # options: none, feature-branch, worktree-isolation
```

---

## 3 Branching Strategies

### 1. None (Commit to Current Branch)

**Complexity:** ⭐ (minimal)  
**Cleanliness:** ⭐ (messy history)  
**Parallel Safety:** ⭐ (unsafe)

**How it works:**
- All commits go to current branch (typically main or v2-prototype)
- No branch creation; no cleanup
- Linear history but mixed concerns (planning, code, docs)

**When to use:**
- Solo development, local experimentation
- Fast prototyping where history doesn't matter
- Quick fixes, immediate merge to main

**Trade-offs:**
- ✅ Zero overhead
- ❌ Pollutes main with wip/planning commits
- ❌ Can't revert feature without reverting unrelated work
- ❌ CI might fail on intermediate commits

---

### 2. Feature-Branch (Auto-Create Per Phase)

**Complexity:** ⭐⭐⭐ (moderate)  
**Cleanliness:** ⭐⭐⭐⭐ (clean history)  
**Parallel Safety:** ⭐⭐ (limited)

**How it works:**
- Workflow auto-creates branch per phase: `phase/1-setup`, `phase/2-auth`, etc.
- All commits in phase go to phase branch
- PR to main when phase complete
- Delete branch after merge

**When to use:**
- Standard team workflow, code review required
- Multi-phase projects with clean phase boundaries
- Need clear history of which commits belong to which phase
- CI/CD integration with branch-based triggers

**Trade-offs:**
- ✅ Clean history, easy PR review
- ✅ Can revert entire phase with one revert commit
- ⚠️ Branch management overhead (create, delete, rebase)
- ❌ Can't work on multiple phases in parallel

---

### 3. Worktree-Isolation (Each Phase in Worktree)

**Complexity:** ⭐⭐⭐⭐⭐ (high)  
**Cleanliness:** ⭐⭐⭐⭐⭐ (pristine)  
**Parallel Safety:** ⭐⭐⭐⭐⭐ (safe)

**How it works:**
- Each phase runs in isolated `git worktree`
- Phase branch created, checked out in worktree
- Work in isolation; no interference with main or other phases
- Each worktree has independent working directory and index
- Switch between phases by exiting/entering worktrees

**When to use:**
- Parallel multi-phase execution
- Complex features needing isolated testing
- Multiple team members working different phases simultaneously
- High-risk changes requiring clean rollback

**Trade-offs:**
- ✅ True isolation, zero branch interference
- ✅ Parallel work on multiple phases
- ✅ Easy rollback (delete worktree, delete branch)
- ❌ Disk overhead (separate directory per phase)
- ❌ More cognitive load (track multiple worktrees)
- ⚠️ Requires git worktree knowledge

---

## Strategy Decision Tree

```
1. Solo development, quick fix?
   → Strategy: none

2. Team, need clean history, sequential phases?
   → Strategy: feature-branch

3. Parallel phases, isolated testing, or high risk?
   → Strategy: worktree-isolation
```

---

## Implementation Details

### None Strategy
```bash
# Just commit to current branch
git add <files>
git commit -m "feat(...): description"
```

### Feature-Branch Strategy
```bash
# Auto-created by workflow
git checkout -b phase/1-setup
git add <files>
git commit -m "feat(...): description"
# On completion: create PR, merge, delete branch
```

### Worktree-Isolation Strategy
```bash
# Workflow commands
/rihal:do --worktree phase/2-auth
# Internally:
git worktree add .claude/worktrees/phase-2-auth phase/2-auth
cd .claude/worktrees/phase-2-auth
# Work here, commit, test
# Exit: cd ../.. ; git worktree remove .claude/worktrees/phase-2-auth
```

---

## Config Example

```yaml
# Single-phase project: no branching needed
git:
  branching_strategy: "none"

# Multi-phase, team project: feature branches
git:
  branching_strategy: "feature-branch"

# High-risk, parallel work: worktrees
git:
  branching_strategy: "worktree-isolation"
```
