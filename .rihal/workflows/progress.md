<purpose>
Render project progress: what was accomplished, where you are, what's pending, what's next. All data comes from a single `rihal-tools progress init` call. This workflow is a pure renderer — no direct markdown parsing, no state.json grep, no phase-directory walk.

**SSOT:** `.rihal/state.json`, surfaced through `rihal-tools progress init`. `/rihal:progress` and `/rihal:status` call the same CLI and cannot disagree (issue #131 closed).

For a sprint-board view, use `/rihal:sprint-status`. For a concise dashboard, use `/rihal:status`. This workflow gives the full narrative view with recent-work excerpts and an intent-tree Next Up menu.
</purpose>

<required_reading>
@.rihal/references/output-format.md
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<output_format>
Banner from output-format.md:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use ✓ complete / ◆ in_progress / ○ planned / 🅿 parking-lot throughout.
End with a Next Up block rendered from the CLI's `routes[]` array.
</output_format>

<process>

<step name="init_context">

## 1. Init context

Fetch the full progress snapshot in a single call:

```bash
SNAPSHOT=$(node .rihal/bin/rihal-tools.cjs progress init)
```

Parse as JSON.

If `SNAPSHOT.project` is null AND `SNAPSHOT.phases[]` is empty:

```
No planning structure found.

Run /rihal:new-project to start a new project.
```

Exit.

Read `DISCUSS_MODE` from config (separate cheap call):

```bash
DISCUSS_MODE=$(node .rihal/bin/rihal-tools.cjs config 2>/dev/null | grep -oE '"discuss_mode"\s*:\s*"[^"]*"' | cut -d'"' -f4 || echo "discuss")
```

</step>

<step name="recent_work">

## 2. Recent work excerpts

For the last 2-3 phase directories with SUMMARY.md, pull the one-liner field surgically:

```bash
# find the 3 most recent SUMMARY.md files
(find .planning/phases -name "SUMMARY.md" -o -name "*-SUMMARY.md" 2>/dev/null) | xargs -r ls -t 2>/dev/null | head -3 | while read f; do
  node .rihal/bin/rihal-tools.cjs summary-extract "$f" --fields one_liner,status
done
```

Each call returns `{ ok: true, one_liner: "...", status: "..." }`. Collect into an in-memory list for rendering. This avoids loading full SUMMARY.md bodies — context-expensive and unnecessary.

</step>

<step name="insights">

## 3. Insights — surface what the CLI noticed

`SNAPSHOT.insights[]` contains drift warnings, between-milestone detection, phase-dir undercount. Render above the progress bar so the user sees divergences immediately:

```
⚠ {insight.message}     (severity: warn)
ℹ {insight.message}     (severity: info)
```

Each insight that mentions a fix command should have it surfaced exactly as-is — e.g. "Run: node .rihal/bin/rihal-tools.cjs state sync --from-disk".

</step>

<step name="report">

## 4. Render the progress view

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# {SNAPSHOT.project}

{insights block — printed FIRST if present}

**Progress:** {SNAPSHOT.bar}
**Milestone:** {SNAPSHOT.milestone or "—"}
**Discuss mode:** {DISCUSS_MODE}

## Recent Work
- [Phase {N}]: {one_liner extracted in step 2}
- [Phase {N}]: {one_liner}

## Current Position
Phase [{SNAPSHOT.current_phase}] of [{SNAPSHOT.phase_count}]
Plan progress: {completed_count}/{phase_count}

## Key Decisions
- {SNAPSHOT.decisions[].summary} — [{phase}.{plan}], {date}

## Blockers
- ⚠ {SNAPSHOT.blockers[].description} — [{phase}.{plan}]

## Pending Todos
- {todo count} pending — /rihal:check-todos to review
(Skip if count = 0)

## Active Debug Sessions
- {count} active — /rihal:debug to continue
(Skip if count = 0)
```

Omit any section whose underlying array is empty — don't print "Key Decisions" with zero entries.

</step>

<step name="next_up">

## 5. Next Up — intent tree

Render `SNAPSHOT.routes[]` as a grouped menu. Group by `letter` field (A / B / C). Multiple routes per letter print indented under that letter's heading:

```
▶ Next Up

  [A] Execute unfinished work
      → /rihal:execute-phase 999.5
      → /rihal:execute-phase 66

  [B] Plan researched-but-unplanned phases
      → /rihal:plan-phase 68

  [C] Close out current milestone
      → /rihal:audit-milestone
      → /rihal:complete-milestone
```

The CLI derives routes from current disk state (researched-not-planned phases, phases with pending plans, all-complete detection for milestone closure). Do NOT second-guess by walking disk yourself.

If `SNAPSHOT.routes[]` is empty or only has fallback entries, print:

```
▶ Nothing obvious on deck.

  [A] /rihal:progress          — refresh
  [B] /rihal:council            — start a conversation on what next
  [C] /rihal:new-milestone     — if the current cycle is done
```

</step>

</process>

## Success Criteria

- [ ] `progress init` called once — not repeatedly per section
- [ ] No direct parsing of ROADMAP.md, epics.md, or SUMMARY.md in the workflow body
- [ ] Recent work uses `summary-extract --fields one_liner` (surgical read)
- [ ] Insights section rendered when non-empty
- [ ] Next Up is a grouped route tree, not a single suggestion

## On Error

- **CLI missing:** "Rihal Code install missing or stale. Run: npx @hanzlahabib/rihal-code install"
- **CLI returns `ok: false`:** surface the CLI's error verbatim. Do not attempt to compensate — the CLI's failures are the source of truth on what's wrong.
- **Network-dependent insights:** there should be none. Insights are computed from local state + disk only.
