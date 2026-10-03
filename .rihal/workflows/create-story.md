# Workflow: rihal:create-story

<purpose>
Convert a single story from an EPIC file into a self-contained STORY.md file. This story is ready for `/rihal:dev-story` to be wrapped for AI-coder execution. Entry is gated by checklist-story-draft.md.
</purpose>


## Step 0 — Usage check

If `$ARGUMENTS` is empty or contains only `--help` or `-h`:

```
/rihal:create-story <argument-here>
```

**Examples:**
```
/rihal:create-story example 1
/rihal:create-story example 2
```

STOP — do not proceed.

## Step 0 — Validation

**If no arguments:**

```
Usage: /rihal:create-story <EPIC-file.md> [--story <id>]

Examples:
  /rihal:create-story .planning/epics/EPIC-01.md
  /rihal:create-story .planning/epics/EPIC-01.md --story EPIC-01.1
```

Stop and wait for arguments.

**Validate input file exists:**

```bash
if [[ ! -f "$EPIC_FILE" ]]; then
  echo "Error: File not found: $EPIC_FILE"
  exit 1
fi
```

**Parse flags:**

- `--story` (optional): specific story ID to extract (e.g., `EPIC-01.1`). If omitted, list stories and ask user to pick one.

## Step 1 — List Stories & Pick One

Read the EPIC file and extract all story IDs and titles:

```bash
STORIES=$(grep -E "^## Story" "$EPIC_FILE" | sed 's/^## Story //' | head -1 -c 20)
```

If `--story` flag not provided, ask the user to pick:

```
Which story from this epic?

- EPIC-01.1: {Title}
- EPIC-01.2: {Title}
- EPIC-01.3: {Title}

Select by ID:
```

Parse the selected story ID.

## Step 2 — Extract Story Content

Read the EPIC file and extract the chosen story:

```bash
STORY_ID="EPIC-01.1"
STORY_SECTION=$(sed -n "/^## Story $STORY_ID/,/^## Story /p" "$EPIC_FILE" | head -n -1)
```

Extract fields from the story markdown:

```bash
STORY_TITLE=$(echo "$STORY_SECTION" | grep "^## Story" | sed "s/^## Story [^ ]* //")
PERSONA=$(echo "$STORY_SECTION" | grep "^**Persona:**" | sed "s/^**Persona:** //")
ACTION=$(echo "$STORY_SECTION" | grep "^**Action:**" | sed "s/^**Action:** //")
CRITERIA=$(echo "$STORY_SECTION" | sed -n '/^### Acceptance Criteria/,/^### /p' | grep "^- " | sed 's/^- \[ \] //')
OUT_OF_SCOPE=$(echo "$STORY_SECTION" | sed -n '/^### Out of Scope/,/^### /p' | grep "^- " | sed 's/^- //')
EFFORT=$(echo "$STORY_SECTION" | grep "^**Estimate:**" | sed "s/^**Estimate:** //")
RATIONALE=$(echo "$STORY_SECTION" | grep -A1 "^**Rationale:**" | tail -1)
DEV_NOTES=$(echo "$STORY_SECTION" | sed -n '/^### Dev Notes/,/^---$/p' | sed '1d;$d')
```

## Step 3 — Load References

```bash
@.rihal/references/checklist-story-draft.md
@.rihal/references/checklist-story-dod.md
@.rihal/references/commit-conventions.md
```

## Step 4 — Check Entry Gate

Run story through checklist-story-draft.md validation:

- ✓ Persona named
- ✓ Action/outcome specified
- ✓ 3+ acceptance criteria
- ✓ Out-of-scope listed
- ✓ Effort estimated

If any check fails, print error and stop:

```
⚠️ Story does not pass draft checklist:

Missing: {failed checks}

Return to the EPIC file and fix before creating STORY.md.
```

Only proceed if ALL checks pass.

## Step 5 — Create STORY.md

Create `.planning/stories/{story-id}.md`:

```bash
mkdir -p .planning/stories
STORY_FILE=".planning/stories/${STORY_ID}.md"
```

Generate file with template:

```markdown
# Story: {Title}

**Epic:** {EPIC-XX} — {Epic title}

**ID:** {STORY_ID}

**Status:** Draft

---

## User Story

**Persona:** {Named persona with role}

**Action:** {As a X, I want to Y so that Z}

**Value:** {Expected business impact}

---

## Acceptance Criteria

- [ ] {Criterion 1 — testable condition}
- [ ] {Criterion 2 — testable condition}
- [ ] {Criterion 3 — testable condition}

Each criterion can be verified without implementation ambiguity.

---

## Out of Scope

- {What this story does NOT do}
- {What's in a future story}

Prevents scope creep during development.

---

## Effort Estimate

**Size:** {S | M | L}

**Why:** {Rationale from epic}

**Confidence:** {High | Medium | Low}

---

## Dev Notes

### Technical Approach

{Implementation hints from epic}

### Known Risks

- {Risk 1 and mitigation}
- {Risk 2 and mitigation}

### Dependencies

- {What must be done first}
- {External blockers}

### Testing Strategy

From **Definition of Done**:
- [ ] All acceptance criteria tested and passing
- [ ] Edge cases: {list specific edge cases relevant to this story}
- [ ] Tests written: {unit tests for X, integration tests for Y}
- [ ] Coverage: {target coverage %}

---

## Definition of Done

Use checklist-story-dod.md. A story is "Done" when:

### Acceptance Criteria Verification
- [ ] All {count} acceptance criteria met
- [ ] Edge cases handled
- [ ] No known stubs or TODOs left

### Testing
- [ ] Tests written for all new logic
- [ ] All tests passing
- [ ] Coverage adequate (80%+ on modified code)

### Code Quality
- [ ] No lint errors
- [ ] Follows project patterns
- [ ] Imports all correct

### Commits
- [ ] Conventional Commits format
- [ ] No AI attribution
- [ ] Meaningful messages

### Handoff
- [ ] Story summary written
- [ ] No blockers remain

---

## Workflow

**Before you start:** Review this story, dev notes, and dependencies.

**During development:** See `/rihal:dev-story` to wrap this STORY.md for AI-coder execution.

**After complete:** Run checklist-story-dod.md to verify done.

---

**Created:** {ISO date}

**Ready for:** /rihal:dev-story → /rihal:code → Definition of Done verification
```

## Step 6 — Commit Story File

```bash
git add "$STORY_FILE"
git commit -m "docs(story): create story $STORY_ID from epic"
```

Print:

```
📖 Story file created

Location: {path to STORY.md}
ID: {STORY_ID}
Title: {Story title}
Effort: {Estimate}
Persona: {Persona}

Next step: /rihal:dev-story .planning/stories/{story-id}.md
```

## Errors

- **Epic file not found:** print error and exit
- **Story ID not found in epic:** print available IDs and ask user to pick again
- **Story fails draft checklist:** print failures and ask user to return to epic

## Success Criteria

- [ ] Task completed as requested
- [ ] Output saved or reported
- [ ] State updated if necessary
- [ ] No errors encountered

## On Error

If arguments are invalid, missing files, or subagent fails:
- Validate inputs match expected format
- Check that required files exist
- Retry with clearer arguments or report the specific error to the user

