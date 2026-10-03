# Common Bug Patterns Catalogue

A reference of 15+ patterns that appear repeatedly across codebases. Each pattern shows the manifestation, how to detect it, and a fix template. Use this before forming debugging hypotheses.

---

## ASYNC PATTERNS

### Pattern 1: Race Condition in Concurrent Operations

**Description:** Two async operations run simultaneously on the same shared state without synchronization, causing unpredictable behavior.

**Manifestation:**
- Test passes once, fails randomly on re-run
- Behavior depends on network latency or CPU load
- "Flaky" test that passes sometimes
- Data gets lost or duplicated sporadically

**Detection Signal:**
- Multiple `Promise.all()` or concurrent callbacks modifying same variable
- No mutex, lock, or queue between writes to shared state
- Timestamps show two updates at nearly identical time

**Fix Template:**

```javascript
// BAD: Race condition
let counter = 0;
async function increment() { counter++; }
Promise.all([increment(), increment()]) // counter might be 1 or 2

// GOOD: Serialized via queue or lock
let counter = 0;
const queue = Promise.resolve();
async function increment() {
  return queue.then(() => { counter++; });
}
```

**Grep for:** `Promise.all` + shared variable modification, concurrent `.then()` chains

---

### Pattern 2: Missing await in Async Chain

**Description:** `await` keyword is forgotten, so code continues before the async operation completes.

**Manifestation:**
- Next line uses result from async function but gets `Promise` instead of value
- "Cannot read property X of undefined"
- `undefined is not a function`
- Data appears empty when it shouldn't

**Detection Signal:**
- `const x = fetchData()` (no `await`)
- Next line: `x.field` or `x.map()`
- Linter should catch this; check if ESLint is running

**Fix Template:**

```javascript
// BAD
const user = getUserFromDB(id);
console.log(user.name); // user is a Promise!

// GOOD
const user = await getUserFromDB(id);
console.log(user.name); // user is resolved
```

**Grep for:** `= await` in function, check for next line accessing `.property` or `.method()`

---

### Pattern 3: Unhandled Promise Rejection

**Description:** A promise rejects but there's no `.catch()` or `try-catch`, causing silent failure.

**Manifestation:**
- "UnhandledPromiseRejectionWarning" in logs
- Process doesn't crash but work is lost
- Error happens but nobody catches it
- Silent data loss

**Detection Signal:**
- Promise-based code with no `.catch()`
- No `try-catch` around `await`
- Rejection happens inside a callback with no error handler

**Fix Template:**

```javascript
// BAD: Silent rejection
fetchAPI().then(data => processData(data));

// GOOD: Catch and handle
fetchAPI()
  .then(data => processData(data))
  .catch(err => console.error('Failed:', err));

// Also GOOD with await
try {
  const data = await fetchAPI();
  processData(data);
} catch (err) {
  console.error('Failed:', err);
}
```

**Grep for:** `.then(` without `.catch(`, `await` without `try-catch` in top-level functions

---

## STATE MUTATION PATTERNS

### Pattern 4: Shared Reference Bug

**Description:** Multiple parts of the code reference the same object. One part mutates it, breaking others' assumptions.

**Manifestation:**
- Changing one thing mysteriously breaks another
- Array or object is modified and affects distant code
- "I didn't change this but it changed"
- State goes out of sync

**Detection Signal:**
- Same object passed to multiple functions
- One function does `obj.property = newValue`
- Other code later expects `obj.property` to have the old value
- No defensive copy

**Fix Template:**

```javascript
// BAD: Shared reference
const data = { name: "alice" };
function rename(obj) { obj.name = "bob"; } // Mutates the original!
rename(data);
console.log(data.name); // "bob" — affected original

// GOOD: Defensive copy
const data = { name: "alice" };
function rename(obj) { 
  const copy = { ...obj }; // Shallow copy
  copy.name = "bob";
  return copy;
}
const updated = rename(data);
console.log(data.name); // "alice" — original safe
```

**Grep for:** Pass object to function, then function does `param.prop =`, then code uses original object

---

### Pattern 5: Closure Over Loop Variable

**Description:** Loop variable is captured in a closure. By the time the closure runs, the variable has changed.

**Manifestation:**
- Loop iterates i=0,1,2,3
- Callback runs later with i=3,3,3,3
- All closures see the last value of the loop variable
- Off-by-one or wrong ID passed around

**Detection Signal:**
- Loop with index variable
- Callback or setTimeout inside loop captures loop variable
- Callback runs after loop completes

**Fix Template:**

```javascript
// BAD: Closure captures loop variable
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // Prints 3,3,3
}

// GOOD: Use const in let-scoped block
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // Prints 0,1,2
}

// Also GOOD: Explicit closure factory
for (var i = 0; i < 3; i++) {
  (function(idx) {
    setTimeout(() => console.log(idx), 100); // Prints 0,1,2
  })(i);
}
```

**Grep for:** `for (var i` + callback inside, `for (var` + `addEventListener`, `for (var` + `setTimeout/setInterval`

---

### Pattern 6: Mutating Object Used as Key

**Description:** Object is used as a dictionary key, then the object is mutated, breaking the lookup.

**Manifestation:**
- Object stored as key in Map
- Object properties change
- Lookup of "same" object fails
- Can't find data by object reference

**Detection Signal:**
- `map.set(obj, value)` where obj is mutable
- Later: `map.get(obj)` returns undefined
- Object identity changed but code assumes it didn't

**Fix Template:**

```javascript
// BAD: Mutable object as key
const cache = new Map();
const user = { id: 1, name: "alice" };
cache.set(user, "data");
user.name = "bob"; // Mutated the key!
console.log(cache.get(user)); // Still works, but confusing

// GOOD: Use ID as key instead
const cache = new Map();
const user = { id: 1, name: "alice" };
cache.set(user.id, "data"); // Key is immutable number
user.name = "bob"; // Doesn't affect lookup
console.log(cache.get(user.id)); // ✓ works
```

**Grep for:** `map.set(` with object, then modify that object, then `map.get(` expecting to find it

---

## IMPORT & DEPENDENCY PATTERNS

### Pattern 7: Circular Import

**Description:** Module A imports Module B, which imports Module A, creating a cycle.

**Manifestation:**
- "Cannot read property X of undefined" when module loads
- Module exports `undefined` unexpectedly
- Import order matters
- Webpack/Rollup bundle size warning about circular deps

**Detection Signal:**
- `import ... from './a'` in module-b.js
- `import ... from './b'` in module-a.js
- Or indirect: A → B → C → A

**Fix Template:**

```javascript
// BAD: Circular
// a.js: import { funcB } from './b';
// b.js: import { funcA } from './a';

// GOOD: Break the cycle with a third module
// shared.js: export both utils
// a.js: import from './shared'
// b.js: import from './shared'

// Or lazy load one side
// a.js: import { funcB } from './b'; // at module load
// becomes:
// a.js: const funcB = () => require('./b').funcB; // on first use
```

**Grep for:** Same module name in both `import from X` and `import from Y` where X imports Y

---

### Pattern 8: Dependency Version Mismatch

**Description:** Two packages depend on incompatible versions of a third package.

**Manifestation:**
- "Unexpected token" or "module not found" at runtime
- Two versions of same package in `node_modules/`
- Different APIs called unexpectedly
- `typeof X !== 'function'` when it should be

**Detection Signal:**
- `npm list <package>` shows multiple versions
- Stack trace references same package twice
- Works locally, fails in CI or production

**Fix Template:**

```javascript
// In package.json:
// BAD: Loose, conflicting ranges
{
  "dependencies": {
    "lodash": "^4.0.0",
    "some-lib": "^1.0.0"  // might depend on "lodash": "^3.0.0"
  }
}

// GOOD: Pin version or use resolutions
{
  "dependencies": {
    "lodash": "4.17.21",
    "some-lib": "^1.0.0"
  }
}

// Or in pnpm/yarn:
{
  "resolutions": {
    "lodash": "4.17.21"
  }
}
```

**Grep for:** `npm list` showing duplicate package names with different versions

---

## TYPE COERCION PATTERNS

### Pattern 9: JavaScript == vs === Pitfall

**Description:** Using loose equality (`==`) instead of strict (`===`) causes unexpected type coercion.

**Manifestation:**
- `"1" == 1` is true (coercion)
- `0 == false` is true (coercion)
- `undefined == null` is true (coercion)
- Logic produces unexpected results

**Detection Signal:**
- Use of `==` operator
- Code comparing different types
- ESLint should flag this

**Fix Template:**

```javascript
// BAD: Loose equality
if (value == 0) { /* runs for 0, false, "", null */ }
if (str == false) { /* runs when str is "", 0, false, null */ }

// GOOD: Strict equality
if (value === 0) { /* only true if value is exactly 0 */ }
if (str === false) { /* only true if str is boolean false */ }

// Type convert first if needed
if (Number(str) === 0) { /* convert to number first */ }
```

**Grep for:** `==` (not `===`), especially in conditionals

---

### Pattern 10: undefined vs null Inconsistency

**Description:** Code mixes `undefined` and `null`, leading to checks that miss one or the other.

**Manifestation:**
- Check for `if (x === undefined)` misses `null`
- Check for `if (x === null)` misses `undefined`
- Default parameters don't work as expected
- "Cannot read property X of null/undefined"

**Detection Signal:**
- `if (x === undefined)` without also checking `null`
- `x ?? defaultValue` coalesces both correctly
- Inconsistent null handling across codebase

**Fix Template:**

```javascript
// BAD: Checks only undefined
if (response === undefined) { /* misses null */ }

// GOOD: Checks both
if (response == null) { /* true for undefined AND null */ }

// ALSO GOOD: Nullish coalescing
const value = response ?? defaultValue; // Coalesces both

// AVOID: Falsy checks for null
if (!response) { /* catches null, undefined, 0, "", false */ } // Too broad
```

**Grep for:** `=== undefined`, `=== null` used separately (should use `== null` or `??`)

---

### Pattern 11: Array.includes() on Falsy Values

**Description:** Using `includes()` to find falsy values (`0`, `false`, `""`) works, but loose equality bugs mask it.

**Manifestation:**
- `if (nums.includes(0))` works fine
- But `if (nums.includes(value))` fails if value is 0 due to nearby `==` bugs
- NaN in array cannot be found (special case)

**Detection Signal:**
- `arr.includes(0)` not matching when 0 is in array
- NaN in array and `arr.includes(NaN)` returns false

**Fix Template:**

```javascript
// GOOD: includes() works for falsy values
const nums = [0, 1, 2];
console.log(nums.includes(0)); // true

// GOTCHA: NaN is special
const vals = [NaN, 1, 2];
console.log(vals.includes(NaN)); // true (includes uses === for NaN)
console.log(vals.indexOf(NaN)); // -1 (indexOf uses == for NaN)

// WORKAROUND for older code:
if (arr.some(x => x === value)) { /* works for NaN and falsy */ }
```

**Grep for:** `includes(0)` or `includes(false)` that's failing; check for `==` bugs nearby

---

## ENVIRONMENT PATTERNS

### Pattern 12: Environment Variable Not Loaded

**Description:** Code references an env var that's not set at runtime, so it's `undefined`.

**Manifestation:**
- API key is undefined at startup
- Code behaves differently in dev vs prod
- "Cannot read property X of undefined" where undefined is the env var
- Works locally, fails in CI

**Detection Signal:**
- `process.env.SOME_VAR` is undefined
- `.env` file exists locally but CI doesn't load it
- Startup error: "API key missing"

**Fix Template:**

```javascript
// BAD: Assumes env var is set
const apiKey = process.env.API_KEY;
const client = new APIClient(apiKey); // apiKey is undefined!

// GOOD: Validate at startup
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable not set');
}
const client = new APIClient(apiKey);

// ALSO GOOD: Use dotenv to load .env
require('dotenv').config();
const apiKey = process.env.API_KEY;
```

**Grep for:** `process.env.` references, check if `.env` is loaded via `dotenv.config()`

---

### Pattern 13: Hardcoded Path Assumptions

**Description:** Code assumes files are at relative paths that only work in specific directory contexts.

**Manifestation:**
- "ENOENT: no such file or directory" when running from different directory
- Tests fail with path errors but main code works
- Works on one machine, fails on another
- Relative paths like `../../config.json`

**Detection Signal:**
- `fs.readFileSync('../config.json')`
- `require.resolve('./data')` without validating existence
- Different behavior based on `process.cwd()`

**Fix Template:**

```javascript
// BAD: Assumes current directory
const config = require('../../config.json'); // Fragile!

// GOOD: Use __dirname or module root
const path = require('path');
const configPath = path.join(__dirname, '../../config.json');
const config = require(configPath);

// ALSO GOOD: Resolve from package root
const configPath = require.resolve('config.json'); // Looks in node_modules or package.json#main
```

**Grep for:** `'../', '../../'`, `fs.readFile` with relative paths, test files that change `process.cwd()`

---

## TIMING & LIFECYCLE PATTERNS

### Pattern 14: Resource Leaked in Error Path

**Description:** Code opens a resource (file, connection, socket) but doesn't close it if an error occurs.

**Manifestation:**
- File descriptors keep increasing
- "EMFILE: too many open files" after running for a while
- Connections pile up and timeout
- Memory leaks

**Detection Signal:**
- `open()` or `connect()` followed by code that might throw
- No `finally` or `try-finally` block
- No explicit `.close()` or `.destroy()` on error

**Fix Template:**

```javascript
// BAD: Leak on error
const file = fs.openSync('data.txt');
processData(file); // might throw!
fs.closeSync(file);

// GOOD: Guarantee close
const file = fs.openSync('data.txt');
try {
  processData(file);
} finally {
  fs.closeSync(file); // Always runs
}

// ALSO GOOD: Use async with-pattern
const file = await fs.promises.open('data.txt');
try {
  await processData(file);
} finally {
  await file.close();
}
```

**Grep for:** `open(`, `connect(`, `createConnection(` followed by code without `try-finally` or cleanup

---

### Pattern 15: Event Listener Not Removed

**Description:** Event listener is attached but never removed, causing duplicate callbacks on re-initialization.

**Manifestation:**
- Same callback runs multiple times when it should run once
- Memory grows over time
- Event listeners pile up on reinitialization
- "Already listening" or duplicate notifications

**Detection Signal:**
- `addEventListener()` without corresponding `removeEventListener()`
- Re-initialization code adds listeners without cleanup
- Tests fail if run twice in sequence

**Fix Template:**

```javascript
// BAD: Listener added multiple times
function init() {
  button.addEventListener('click', handleClick); // Added every time init() runs!
}
init(); init(); // Now click fires twice!

// GOOD: Remove old listener first
function init() {
  button.removeEventListener('click', handleClick); // Clean up old
  button.addEventListener('click', handleClick);
}

// ALSO GOOD: Use { once: true }
button.addEventListener('click', handleClick, { once: true });

// ALSO GOOD: Cleanup function
let unsubscribe;
function init() {
  if (unsubscribe) unsubscribe(); // Clean up from previous init
  unsubscribe = () => button.removeEventListener('click', handleClick);
  button.addEventListener('click', handleClick);
}
```

**Grep for:** `addEventListener` without matching `removeEventListener`, `on(` without `off()`, re-initialization functions

---

## PATTERN SUMMARY TABLE

| # | Pattern | Symptom | Detection | Fix |
|----|---------|---------|-----------|-----|
| 1 | Race condition | Flaky test, random failures | Concurrent Promise.all + shared state | Serialize with queue/lock |
| 2 | Missing await | "Cannot read X of undefined" | `const x = async()` no await | Add `await` |
| 3 | Unhandled rejection | Silent failure, UnhandledPromiseRejection | `.then()` no `.catch()` | Add `.catch()` or try-catch |
| 4 | Shared reference | Unexpected mutation | Object passed to multiple functions | Defensive copy with `{...}` |
| 5 | Closure loop var | All callbacks see last value | `for (var i` with callback | Use `let` instead of `var` |
| 6 | Mutable dict key | Map lookup fails | `map.set(obj)` then mutate obj | Use immutable ID as key |
| 7 | Circular import | "undefined is not a function" | A imports B imports A | Use shared module or lazy load |
| 8 | Dependency version mismatch | "Unexpected token" | `npm list` shows duplicates | Pin version or use resolutions |
| 9 | == coercion | Unexpected truthiness | `==` instead of `===` | Use `===` |
| 10 | undefined vs null | Checks miss one or other | `=== undefined` without null | Use `== null` or `??` |
| 11 | includes() falsy | includes(0) fails mysteriously | NaN or loose equality issues | Use `.some(x => x ===)` |
| 12 | Missing env var | "Cannot read X of undefined" | `process.env.VAR` is undefined | Validate at startup or load .env |
| 13 | Hardcoded paths | ENOENT different directories | `'../../file'` relative paths | Use `__dirname` or `path.join()` |
| 14 | Resource leak | EMFILE or connection pile-up | `open()` without `.close()` in finally | Use try-finally or async cleanup |
| 15 | Listener not removed | Callback fires multiple times | `addEventListener` without remove | Call `removeEventListener` first |

---

## How to Use This Catalogue

1. **Hypothesis formation:** When debugging, scan this list for the symptom
2. **Detection:** Look for the detection signals in your code
3. **Fix:** Apply the fix template as a starting point
4. **Prevention:** Add ESLint rules for patterns 9, 10 (use strict equality by default)

**Reference this before running hypotheses:**
- New bug → scan this list for matching symptom
- Deploying code → check for patterns 12, 13, 14 (env, paths, cleanup)
- Refactoring → check for patterns 4, 5, 6 (mutation, closure, keys)
