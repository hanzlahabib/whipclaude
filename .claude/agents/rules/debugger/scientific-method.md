# Rihal Debugger: Scientific Method for Bug Investigation

## The Scientific Method in Debugging

Debugging is empirical investigation, not guessing. Follow the scientific method:

1. **Observation** — Describe precisely what happens
2. **Question** — What could cause this?
3. **Hypothesis** — Make a specific, testable claim
4. **Experiment** — Test the hypothesis
5. **Analysis** — What does the result tell us?
6. **Conclusion** — Is the hypothesis supported?

---

## Phase 1: Observation (Precise Description)

**Bad observation:** "It's broken"
**Good observation:** "Login button click does nothing, no error message, form stays visible"

### Documenting Observations

```
Symptom: User login fails intermittently
Expected: Form submits, shows loading state, redirects to dashboard
Actual: Form doesn't submit, button click has no effect
Frequency: Happens ~30% of the time, not consistent
When started: Today after deployment, worked yesterday
Environment: Chrome, macOS, localhost:3000
Error message: None visible (checked console too)
```

### Complete Reading Protocol

Read ENTIRE functions, not just "relevant" lines:
- Read the full function body (not just the error line)
- Read all imports (missing dependency?)
- Read function signature (wrong params?)
- Read calling code (are you using it right?)
- Read error handler (is it catching too broadly?)

Skimming misses crucial details like:
```javascript
// You spot the error here:
const user = getUserById(userId);  // userId might be undefined

// But you missed this earlier in the function:
if (someCondition) {
  userId = null;  // Aha! This sets it to null
}
```

---

## Phase 2: Question (What Could Cause This?)

For each observation, list EVERY possible cause (don't judge yet):

**Observation:** Form doesn't submit when clicking button

**Possible causes:**
1. Click handler never fires (listener not attached)
2. Click handler fires but form validation fails silently
3. API call doesn't happen (async issue)
4. API call fails (network error)
5. API response causes error (bad data)
6. Button is disabled (CSS display: none?)
7. Async/await missing (call doesn't wait)
8. Event prevention (stopPropagation?)
9. Race condition (another handler removes button)
10. Browser issue (console errors hidden)

Write them all down. You'll test them later.

---

## Phase 3: Hypothesis Formation

Transform each possibility into a testable, specific claim:

**Bad (unfalsifiable):**
- "Something is wrong with the form"
- "The timing is off"
- "There's a race condition"

**Good (falsifiable):**
- "Click handler doesn't fire because addEventListener() wasn't called"
- "Form validation fails silently because error handler catches all exceptions"
- "API call completes after unmount, causing state update on unmounted component"

**The difference:** Specificity. Good hypotheses make claims you can test.

### Hypothesis Template
```
Hypothesis: [Specific, testable claim]

If TRUE, I should observe:
  - [Observable evidence 1]
  - [Observable evidence 2]

If FALSE, I should observe:
  - [Contradicting evidence]

How to test:
  - [Specific test steps]
```

### Example:
```
Hypothesis: Click handler doesn't fire because addEventListener() was never called

If TRUE, I should observe:
  - console.log() inside click handler never executes
  - Breakpoint in handler never hits

If FALSE, I should observe:
  - Handler runs but something else prevents submission

How to test:
  1. Add console.log('Button clicked') at start of handler
  2. Click button
  3. Check browser console for log message
```

---

## Phase 4: Experiment (Design and Run Test)

For each hypothesis, design ONE experiment that tests it:

### Experimental Design Template

```
Hypothesis: [Claim]

Prediction: If H is true, I will observe [X]

Test Setup:
  1. [Precondition]
  2. [Precondition]

Action:
  1. [Do this]
  2. [Do that]

Measurement:
  - What exactly am I measuring?
  - How do I know if X occurred?

Success Criteria:
  - Result supports hypothesis: [What would prove it true?]
  - Result contradicts hypothesis: [What would prove it false?]

Expected Outcome:
  [What I think will happen]

Actual Outcome:
  [What actually happened]

Conclusion:
  [Does this support or refute the hypothesis?]
```

### Example Test

```
Hypothesis: Click handler doesn't execute because addEventListener wasn't called

Prediction: console.log inside handler never runs

Test Setup:
  1. Open browser DevTools Console
  2. Navigate to login page

Action:
  1. Click the Login button

Measurement:
  I'm looking for a console message "Button clicked"

Success if:
  - No message appears → Handler didn't run → Hypothesis TRUE
  - Message appears → Handler ran → Hypothesis FALSE

Expected: No message (I think the handler isn't attached)

Actual: Message DOES appear "Button clicked"

Conclusion: Hypothesis is FALSE. Handler DOES execute. Problem is elsewhere.
```

---

## Phase 5: Analysis (What Does Evidence Tell Us?)

After each experiment:

1. **Record the result** — Exactly what happened, not what you expected
2. **Compare to prediction** — Did reality match expectation?
3. **Assess evidence quality** — Strong or weak?
4. **Extract learning** — What did this rule out? What's new?
5. **Update mental model** — Based on evidence, what's likely now?

### Evidence Quality

**Strong evidence:**
- Directly observable (I see X in logs)
- Repeatable (X happens every time)
- Unambiguous (Definitely X, not Y)
- Independent (X happens even without Y)

**Weak evidence:**
- Hearsay (I think I saw X once)
- Non-repeatable (X failed once, can't replicate)
- Ambiguous (Maybe X, could be Y)
- Confounded (X happened after A AND B AND C)

---

## Phase 6: Hypothesis Refinement

When a hypothesis is **refuted:**

```
Hypothesis: Click handler doesn't run
Result: Handler DOES run (console.log proved it)

What this rules out:
  - addEventListener() missing ✓ (handler runs, so it exists)
  - Event listener detached ✓

What this reveals:
  - Handler executes successfully
  - Problem is AFTER handler, not in handler
  - Next place: form submission or API call

New hypothesis to test:
  Form.submit() doesn't actually submit (event default prevented? form validation fail?)
```

When a hypothesis is **supported:**

```
Hypothesis: API call fails with 401 error
Result: Network tab shows POST /api/login returns 401

What this confirms:
  - Authentication failing (could be: token expired, wrong creds, header missing)

What to test next:
  - Is Authorization header present?
  - Is token valid/non-expired?
  - Are credentials correct?
```

---

## The Debugging Loop

```
┌─ Observation (What's broken?)
│
├─ Questions (What could cause this?)
│
├─ Hypothesis (Specific testable claim)
│
├─ Experiment (Test the claim)
│
├─ Analysis (What does evidence show?)
│
├─ Refine Hypothesis (Based on analysis)
│
└─ Repeat until root cause found
```

---

## Common Mistakes in Scientific Method

### Mistake 1: Falling in Love with First Hypothesis
**Problem:** You form one hypothesis and spend hours defending it.
**Fix:** Generate 3+ independent hypotheses before investigating any.

### Mistake 2: Confirmation Bias
**Problem:** You only look for evidence supporting your hypothesis.
**Fix:** Actively seek disconfirming evidence. "What would prove me wrong?"

### Mistake 3: Testing Multiple Variables at Once
**Problem:** You change three things and it works. Which one fixed it?
**Fix:** Test ONE hypothesis at a time. Change one variable per experiment.

### Mistake 4: Acting on Weak Evidence
**Problem:** "It seems like maybe this could be..." → You change code.
**Fix:** Wait for strong, unambiguous evidence before acting.

### Mistake 5: Abandoning Rigor Under Pressure
**Problem:** "Just let me try this..." without hypothesis/experiment.
**Fix:** Double down on method when pressure increases. Speed comes from efficiency, not skipping steps.

---

## When to Restart

Consider starting fresh when:

1. **2+ hours, no progress** — You're likely tunnel-visioned
2. **3+ "fixes" that didn't work** — Your mental model is wrong
3. **Can't explain current behavior** — Don't layer changes on confusion
4. **Debugging the debugger** — Something fundamental is wrong
5. **Fix works but you don't know why** — This isn't fixed, it's luck

Restart protocol:
1. Close all files and terminals
2. Write down what you KNOW for certain (not guesses)
3. Write down what you've RULED OUT
4. List NEW hypotheses (different from before)
5. Begin again from Observation phase
