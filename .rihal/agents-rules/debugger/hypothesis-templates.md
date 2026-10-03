# Hypothesis Templates for Common Bug Types

When debugging, use these templates to structure hypotheses quickly. Fill in specifics for your bug.

---

## Template 1: Null/Undefined Reference

**Symptom:** "Cannot read property X of undefined" or "TypeError: Y is not a function"

**Hypothesis Template:**

```
Hypothesis: [Variable Name] is null or undefined

Why it might be true:
- [Source of variable] can return undefined
- [Check for null handling]

How to test:
1. Add log: console.log('${variable}:', ${variable})
2. Verify log shows null, undefined, or correct value
3. Check if there's a null check before accessing property

Expected result if true:
- Log shows undefined or null
- Code accesses property without checking
```

**Example:**

```
Hypothesis: user object is undefined when accessed

Why it might be true:
- fetchUser() doesn't error on 404, just returns undefined
- No null check before accessing user.name

How to test:
1. Add log: console.log('user:', user) before line 42
2. If user is undefined, add guard: if (user) { ... }

Expected result if true:
- Log shows "user: undefined"
- Adding guard fixes the crash
```

---

## Template 2: Async/Timing Issue

**Symptom:** "Sometimes works, sometimes doesn't", "Race condition suspected"

**Hypothesis Template:**

```
Hypothesis: [Operation A] starts before [Operation B] completes

Why it might be true:
- [Operation B] is async but not awaited
- [Operation A] doesn't wait for [Operation B]'s result

How to test:
1. Add timestamps: console.time('B') and console.timeEnd('B')
2. Verify order of logs
3. Check if A accesses B's results before they're ready

Expected result if true:
- Logs show A happens before B finishes
- Adding await/then() fixes the issue
```

**Example:**

```
Hypothesis: saveToDatabase() starts before fetchUser() completes

Why it might be true:
- fetchUser() is async but not awaited
- saveToDatabase() runs immediately with incomplete data

How to test:
1. Add: console.time('fetchUser') and console.timeEnd('fetchUser')
2. Add: console.log('About to save:', data)
3. Verify order: does "About to save" appear before "fetchUser" completes?

Expected result if true:
- Logs show saveToDatabase runs before user data loads
- Adding await fetchUser() fixes inconsistency
```

---

## Template 3: State Mutation / Reference Sharing

**Symptom:** "Changing A affects B", "Undo doesn't work", "Array modified unexpectedly"

**Hypothesis Template:**

```
Hypothesis: [Variable A] is a reference to [Variable B], not a copy

Why it might be true:
- [Variable A] was assigned from [Variable B] directly
- No copy operation (spread, slice, clone) was used

How to test:
1. Add: console.log('A before:', A)
2. Modify A
3. Add: console.log('B after:', B)
4. If B changed too, it's a shared reference

Expected result if true:
- B also changes when A is modified
- Creating a copy (spread operator, Object.assign) fixes it
```

**Example:**

```
Hypothesis: newUsers array is a reference to users array

Why it might be true:
- const newUsers = users (no spread or copy)
- Modifying newUsers affects original users

How to test:
1. console.log('users before:', users)
2. newUsers[0].name = 'Updated'
3. console.log('users after:', users)
4. If users[0].name is 'Updated' too, shared reference confirmed

Expected result if true:
- users array is modified when newUsers is modified
- Fix: const newUsers = [...users]
```

---

## Template 4: Logic Error / Conditional Bug

**Symptom:** "Code takes wrong branch", "Condition never true", "Loop doesn't execute"

**Hypothesis Template:**

```
Hypothesis: Condition [EXPRESSION] evaluates incorrectly

Why it might be true:
- [Type comparison issue: == vs ===]
- [Truthy/falsy misunderstanding]
- [Logic operator order (AND vs OR)]

How to test:
1. Add: console.log('[EXPRESSION]:', [EXPRESSION])
2. Verify actual value vs expected
3. Check operator precedence

Expected result if true:
- Log shows condition is false when it should be true
- Fixing operator or type comparison resolves issue
```

**Example:**

```
Hypothesis: Loop condition i < items.length - 1 skips last item

Why it might be true:
- Loop uses i < items.length - 1 instead of i < items.length
- Off-by-one error in boundary

How to test:
1. Add: console.log('Loop at i:', i, 'items.length:', items.length)
2. Verify if loop stops before processing last item
3. Count iterations

Expected result if true:
- Last item is skipped in loop
- Removing "- 1" processes all items
```

---

## Template 5: External Dependency Issue

**Symptom:** "Library doesn't work as expected", "API returns wrong format", "Function call fails"

**Hypothesis Template:**

```
Hypothesis: [Library/API] [does not work / changed behavior] due to [version/configuration]

Why it might be true:
- Version mismatch between package.json and installed version
- Configuration was not set
- API changed in new version

How to test:
1. Check version: npm list [library]
2. Check documentation for [version]
3. Test library in isolation: [test code]
4. Verify configuration is applied

Expected result if true:
- Version mismatch or config missing
- Updating version or config fixes issue
```

**Example:**

```
Hypothesis: bcrypt.compare() doesn't work due to missing await

Why it might be true:
- bcrypt.compare() returns a Promise
- Code doesn't await the promise

How to test:
1. Check bcrypt docs: confirm it's async
2. Test in isolation: const result = await bcrypt.compare(...)
3. Verify result is boolean, not Promise

Expected result if true:
- Without await, result is Promise (truthy)
- With await, result is actual boolean
```

---

## Template 6: Environment/Configuration Issue

**Symptom:** "Works locally, fails in production", "Missing env variable", "Wrong configuration loaded"

**Hypothesis Template:**

```
Hypothesis: [Configuration/Env Variable] is missing or incorrect in [Environment]

Why it might be true:
- Variable not set in [Environment]'s .env file
- Fallback not provided
- Wrong value loaded

How to test:
1. Check: console.log('Config:', process.env.[VAR_NAME])
2. Verify against .env files
3. Check if code handles missing config gracefully

Expected result if true:
- Log shows undefined or wrong value
- Adding to .env fixes issue
```

**Example:**

```
Hypothesis: API_URL is missing in production environment

Why it might be true:
- .env file not deployed to production
- Environment variable not set on server
- Fallback URL doesn't exist

How to test:
1. SSH to production: echo $API_URL
2. If empty, environment variable not set
3. Check if code has fallback for missing API_URL

Expected result if true:
- $API_URL is empty or unset
- Setting it in production environment fixes requests
```

---

## Template 7: Data Format Mismatch

**Symptom:** "Data validation fails", "Type error on valid data", "Parsing fails"

**Hypothesis Template:**

```
Hypothesis: Input data format [ACTUAL] does not match expected format [EXPECTED]

Why it might be true:
- API response changed format
- Database schema doesn't match expectations
- Type conversion not happening

How to test:
1. Log the actual data: console.log('Raw input:', JSON.stringify(input, null, 2))
2. Compare against expected schema
3. Check parsing/conversion logic

Expected result if true:
- Log shows format mismatch
- Adding parsing/validation layer fixes issue
```

**Example:**

```
Hypothesis: API returns timestamp as string, code expects number

Why it might be true:
- API changed response format
- Timestamp parsing was removed
- Code assumes number but API returns ISO string

How to test:
1. Log response: console.log('Timestamp:', response.timestamp, typeof response.timestamp)
2. Verify API documentation
3. Check conversion logic

Expected result if true:
- typeof timestamp is 'string', not 'number'
- Parsing with new Date(timestamp).getTime() fixes calculations
```

---

## Using These Templates

1. **Pick the template** matching your symptom
2. **Fill in specifics** for your bug
3. **Follow the testing steps** to confirm/disprove
4. **Record the result** in investigation.md

Don't use hypotheses as crutches — they should guide testing, not replace actual investigation.
