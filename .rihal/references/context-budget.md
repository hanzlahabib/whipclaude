# Context Budget Reference

Defines 4 degradation tiers for token usage and how workflows should adapt behavior based on remaining context.

## Configuration

Add to `config.yaml`:

```yaml
context_window_tokens: 200000  # default; adjust per model profile
```

Estimation rule: **1 token ≈ 4 characters**. Use this to predict token cost of reads.

## Degradation Tiers

### PEAK (0–30% used)
**Tokens remaining: >140,000**

- ✅ Full context available — deep reads encouraged
- ✅ Subagent dispatch OK (Explore, Research, etc.)
- ✅ Read entire files without hesitation
- ✅ Batch parallel reads (5+ files simultaneously)
- ✅ Fetch documentation and external context freely

**Behavior:** Aggressive exploration, thorough analysis.

---

### GOOD (30–60% used)
**Tokens remaining: 80,000–140,000**

- ✅ Full context still available
- ⚠️ Prefer Grep/Glob over Read for files >500 lines
- ⚠️ Read only necessary sections, use `limit` + `offset` parameters
- ✅ Batch parallel reads OK, but max 3–4 simultaneously
- ⚠️ Defer non-essential documentation fetches

**Behavior:** Balanced — read strategically, ask for sections not summaries.

---

### DEGRADING (60–80% used)
**Tokens remaining: 40,000–80,000**

- ⚠️ Read only frontmatter (first 50–100 lines) for files >500 lines
- ⚠️ Defer non-critical reads; consolidate questions
- ⚠️ No subagent dispatch — complete locally
- ⚠️ Warn user: **"Context at {percent}% usage. Work may slow."**
- ✅ Continue essential tasks

**Behavior:** Careful — read only what blocks progress.

---

### POOR (80%+ used)
**Tokens remaining: <40,000**

- 🚨 **Emergency mode**
- 🛑 Read ONLY what's strictly required to unblock next action
- 🛑 No exploratory reads, no documentation
- 🛑 Suggest `/rihal:pause-work` if task requires more context
- 🛑 Warn user: **"Context critical ({percent}%). Resume work to continue."**

**Behavior:** Survival — preserve tokens for final output only.

---

## How Workflows Check Budget

Place this check at the start of a heavy read phase:

```python
def check_budget(current_tokens, config):
    budget = config.get('context_window_tokens', 200000)
    used_pct = (current_tokens / budget) * 100
    
    if used_pct >= 80:
        return 'POOR', "Context critical. Suggest /rihal:pause-work"
    elif used_pct >= 60:
        return 'DEGRADING', "Context at {used_pct}%. Read frontmatter only."
    elif used_pct >= 30:
        return 'GOOD', "Balanced. Prefer Grep for large files."
    else:
        return 'PEAK', "Full context. Aggressive exploration OK."

# Usage in workflow:
tier, msg = check_budget(tokens_used, config)
if tier == 'POOR':
    return escalate_to_user(msg)
```

---

## Token Estimation Rules

- **Small file (<100 lines):** ~2,000 tokens
- **Medium file (100–500 lines):** ~10,000 tokens
- **Large file (500–2000 lines):** ~30,000 tokens
- **Grep result (50 matches):** ~3,000 tokens
- **Bash output (typical):** ~1,000 tokens
- **Conversation history (N turns):** ~500 tokens per turn

When close to limits, ask: *"Would reading this file block progress?"* If no, defer.
