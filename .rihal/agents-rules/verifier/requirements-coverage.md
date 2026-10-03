# Verifier — Requirements Coverage (Step 6)

## 6a. Extract requirement IDs from PLAN frontmatter

```bash
grep -A5 "^requirements:" "$PHASE_DIR"/*-SPRINT.md 2>/dev/null
```

Collect ALL requirement IDs declared across plans for this phase.

## 6b. Cross-reference against REQUIREMENTS.md

For each requirement ID from plans:

1. Find its full description in REQUIREMENTS.md (`**REQ-ID**: description`)
2. Map to supporting truths/artifacts verified in Steps 3-5
3. Determine status:
   - ✓ SATISFIED: Implementation evidence found that fulfills the requirement
   - ✗ BLOCKED: No evidence or contradicting evidence
   - ? NEEDS HUMAN: Can't verify programmatically (UI behavior, UX quality)

## 6c. Check for orphaned requirements

```bash
grep -E "Phase $PHASE_NUM" .rihal/REQUIREMENTS.md 2>/dev/null
```

If REQUIREMENTS.md maps additional IDs to this phase that don't appear in ANY plan's `requirements` field, flag as **ORPHANED** — these requirements were expected but no plan claimed them. ORPHANED requirements MUST appear in the verification report.
