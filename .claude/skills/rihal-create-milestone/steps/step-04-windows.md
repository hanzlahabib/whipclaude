# Step 4: Assign Date Windows

**Progress: Step 4 of 10** — Next: Kill Criteria

## STEP GOAL

Give each milestone a start / end date. Verify realism with the user using rough capacity math.

## MANDATORY RULES

- 🛑 NEVER invent velocity numbers. If the PRD has "target launch" dates, use those. If not, ASK.
- 🛑 Windows must not overlap unless the user explicitly says parallel tracks exist.
- ⏸️ HALT at menu.

## SEQUENCE

### 1. Establish capacity

If the PRD specifies team size / target launch, use those. Otherwise ask:

```
To size these milestones realistically:
1. How many devs will work on this? (default: 1)
2. When is the target launch for M1?
3. Any hard external deadlines (client commit, event, regulatory)?
```

Do NOT proceed until numeric answers are on the table (unless `mode: yolo` or `--auto` — see `../../../_shared/no-autonomous-bypass.md`).

### 2. Propose windows

Simple rule of thumb: 6–10 weeks per milestone for a 1–2 person team, 4–6 weeks for a 3–5 person team. Adjust based on outcome complexity from step 2.

```
Proposed windows:

M1 — MVP                    {start}  →  {start + 8 weeks}  (2026-04-24 → 2026-06-19)
M2 — Team collaboration    (M1 end) →  +6 weeks           (2026-06-19 → 2026-07-31)
M3 — Monetization          (M2 end) →  +6 weeks           (2026-07-31 → 2026-09-11)

Total: ~20 weeks / 5 months.

[A] Accept windows
[P] Propose changes (shift, compress, extend)
[C] Continue to step 5
```

### 3. Realism check

Before accepting, briefly call out risks:
- "M1 at 8 weeks with 1 dev is tight — auth alone is often 3-4 weeks."
- "M3 monetization after only 14 weeks of combined M1+M2 assumes no pivots on pricing."

The user decides. You surface the risk; you do not refuse the window.

### 4. Persist & advance

- Append windows to each milestone block in `{outputFile}`.
- Update `stepsCompleted`.
- Load `./step-05-kill-criteria.md`.
