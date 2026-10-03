# Investigation Protocol for Systematic Debugging

When debugging, follow a structured protocol that combines multiple investigation techniques. Pick the right technique for each phase of the investigation.

---

## Phase 1: Evidence Gathering

**Goal:** Establish facts before forming hypotheses.

### Technique: Reading the Error

Start with the **exact error message**, trace, or symptom.

**Steps:**
1. Find the exact error (not paraphrased, not guessed)
2. Read every line of the traceback
3. Note the file, line number, and function name
4. Copy the error verbatim — don't sanitize

**Example:**
- ✅ "TypeError: Cannot read property 'map' of undefined at processUsers (src/api.js:42)"
- ❌ "The code crashed when processing users"

### Technique: Code Review (Focused)

Read the **exact code** mentioned in the error.

**Steps:**
1. Open the file at the line mentioned
2. Read the entire function (not just the line)
3. Read imports/dependencies
4. Look for obvious issues (missing null checks, typos, logic errors)

### Technique: Reproduce the Bug

Get the bug to happen consistently.

**Steps:**
1. Follow the exact steps user described
2. Document what triggers it (specific input, state, timing)
3. Try variations (does it happen always, or only sometimes?)
4. If intermittent, investigate timing/concurrency

**Red Flag:** "I can't reproduce it" = you haven't understood the trigger yet. Keep trying.

---

## Phase 2: Hypothesis Formation

**Goal:** Generate 3+ independent hypotheses before investigating.

### Rule: Write Down Your Hypotheses

Don't hold them in your head. Write them explicitly.

**Format:**
```
Hypothesis 1: [Specific claim about root cause]
Evidence for: [Facts that support this]
Evidence against: [Facts that contradict this]
How to test: [Automated check that proves/disproves]

Hypothesis 2: ...
```

### Rule: Generate Multiple Hypotheses

Generate at least 3 before picking one to test. Why?
- First hypothesis is often wrong (confirmation bias)
- Multiple hypotheses prevent tunnel vision
- Testing one hypothesis can eliminate others

**Example: "Login button doesn't work"**

Hypothesis 1: Network request failing
- Check: Network tab shows request status
- Test: Mock API endpoint

Hypothesis 2: Form validation blocking submission
- Check: Console logs show validation error
- Test: Fill form with valid data, retry

Hypothesis 3: Click handler not registered
- Check: Console logs from click event
- Test: Add debug logs to handler function

---

## Phase 3: Systematic Testing

### Technique: Binary Search (for "which component")

When unsure which piece is broken, use binary search.

**Example: "Payments work, but shipping calculation is wrong"**
```
Test 1: Does shipping API respond at all?
  → Yes
Test 2: Is the shipping calc using correct input?
  → No — it's using stale address
Test 3: Where does stale address come from?
  → Form component not clearing on checkout start
```

Each test eliminates half the problem space.

### Technique: Rubber Duck Debugging

Explain the code out loud to an imaginary duck (or your screen).

**Process:**
1. Read code line by line
2. State what you expect each line to do
3. When you find a mismatch, you've found the bug

**Example:**
- Line 1: `const user = getUserFromId(id)` — "Get user by ID"
- Line 2: `return user.name` — "Return the user's name"
- Line 3: `if (user.is_admin)` — Wait, we checked `.name` on line 2, but line 3 assumes `user` exists. But what if `id` doesn't exist? `getUserFromId` might return `null`.

### Technique: Add Logging Strategically

Don't spam logs everywhere. Place them to test specific hypotheses.

**Strategic Logging:**
1. Log inputs to a suspicious function
2. Log the result/return value
3. Log control flow decisions (if branches)

**Example: "Login fails sometimes"**
```javascript
// Before login attempt
console.log('loginAttempt', { email, hasPassword: !!password });

// In login function
console.log('apiCall', { url, method });
console.log('apiResponse', { status, body });

// After response
console.log('loginSuccess', { tokenLength, userId });
```

Then check logs to see which step fails.

---

## Phase 4: Root Cause Confirmation

### Rule: One Change at a Time

Fix one hypothesized issue, test, observe.

**Why:** Multiple changes mask which one worked (or if any did).

**Example:**
- ❌ "I added a null check AND updated the API call AND refactored the loop"
- ✅ "I added a null check. Testing now. If it fixes the issue, I'll commit. If not, I'll revert and try the next hypothesis."

### Rule: Verify the Fix Works

Fix is confirmed when:
1. **Bug reproducer now passes** — The exact steps that broke it now work
2. **No regressions** — Tests that passed before still pass
3. **Root cause is understood** — You can explain WHY the bug happened

**Red Flag:** "I made a change and the bug went away, but I don't know why" = Not fixed, just lucky. Revert and investigate properly.

---

## Common Investigation Patterns

### Pattern 1: Null/Undefined Reference

**Symptoms:** "Cannot read property X of undefined"

**Investigation:**
1. Find the line that crashed
2. What variable was being accessed?
3. Where did that variable come from?
4. What could make it null/undefined?

**Example:**
```
Error: Cannot read property 'name' of undefined at getUserDisplay

Line: return user.name

Where did `user` come from?
→ const user = fetchUser(id)

What if fetchUser fails?
→ It returns undefined (no error thrown)

Fix: Check if user exists before accessing user.name
```

### Pattern 2: Off-by-One Error

**Symptoms:** "Wrong item selected", "loop processes 1 less than expected"

**Investigation:**
1. Identify the loop or index operation
2. Trace what indices it uses
3. Print the range (start, end, count)
4. Verify it matches expectations

**Example:**
```
for (let i = 0; i < items.length - 1; i++) {
  // This skips the last item!
  process(items[i]);
}

Fix: Remove the "- 1"
```

### Pattern 3: Async/Timing Issues

**Symptoms:** "Sometimes it works, sometimes it doesn't", "Order of events is wrong"

**Investigation:**
1. Identify all async operations (API calls, timeouts, promises)
2. Trace the exact order they execute
3. Identify what SHOULD happen and what ACTUALLY happens
4. Add timestamps to logs

**Example:**
```
// Bad: Race condition
updateUser(data);  // async
saveToLocalStorage(data);  // sync, runs before updateUser finishes

// Fixed: Wait for async to finish
await updateUser(data);
saveToLocalStorage(data);
```

### Pattern 4: State Mutation

**Symptoms:** "Changing A affects B somehow", "Undo doesn't work", "Component renders wrong"

**Investigation:**
1. Find where state is mutated
2. Check if it's mutated directly or a copy
3. Verify unrelated changes don't affect state

**Example:**
```
// Bad: Mutates shared reference
const newUsers = users;
newUsers[0].name = "Updated";  // Also changes original `users`

// Fixed: Create copy
const newUsers = [...users];
newUsers[0] = { ...newUsers[0], name: "Updated" };
```

---

## When to Stop & Restart

After 30 minutes with no progress, consider restarting:

1. **Close all files** — Fresh eyes
2. **Write down facts** — What you KNOW is true
3. **Write down ruled-out hypotheses** — What you've eliminated
4. **Generate NEW hypotheses** — Different from before
5. **Begin evidence gathering again**

Restarting is not giving up — it's getting unstuck.

---

## Documentation as You Go

Maintain a log in `.rihal/debug/investigation.md`:

```markdown
## Bug: [Symptom]
Date: [When investigated]

### Evidence
- [Fact 1]
- [Fact 2]

### Hypotheses Tested
1. [Hypothesis] → DISPROVEN because [evidence]
2. [Hypothesis] → CONFIRMED because [evidence]

### Root Cause
[Explanation of why the bug happens]

### Fix
[Code change + test verification]
```

This log survives context resets and helps if you return to the bug later.
