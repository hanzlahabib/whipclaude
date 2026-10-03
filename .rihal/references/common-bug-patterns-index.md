# Common Bug Patterns — Quick Index

A reference of 15+ patterns that appear repeatedly across codebases. Each pattern shows the manifestation, how to detect it, and a fix template. Use this before forming debugging hypotheses.

## Pattern Categories

### Async Patterns
- **Race Condition in Concurrent Operations** — Two async operations modify shared state without synchronization → "flaky" tests, data loss
- **Missing await in Async Chain** — Forgot `await` keyword → using Promise instead of value → "Cannot read property X of undefined"
- **Unhandled Promise Rejection** — Promise rejects with no `.catch()` or `try-catch` → silent failure

### State Mutation Patterns
- **Shared Reference Bug** — Multiple parts reference same object, one mutates it → "I didn't change this but it changed"
- **Mutation in Array/Map Iteration** — Modifying collection while iterating → skipped items, out-of-order processing
- **Stale Closure** — Function captures old variable state → wrong value after variable changes

### Type/Schema Patterns
- **Implicit Type Coercion** — `"5" == 5` behavior, Array operations behaving unexpectedly
- **Null/Undefined Confusion** — Treating null and undefined as same → access undefined property → crash
- **Schema Drift** — Code expects field that doesn't exist → "Cannot read property X of undefined"

### API & I/O Patterns
- **Retry Loop Without Backoff** — Same request loops rapidly → hammers server → blocks execution
- **Resource Leak** — DB connections, file handles never closed → "too many connections" error
- **Timeout Without Fallback** — Request hangs indefinitely → process blocks forever

### Logic Patterns
- **Off-by-One Error** — Loop boundary wrong → skips first/last item or crashes
- **Lost Update in Distributed Systems** — Two processes update same record → one write lost
- **Cascading Failures** — One service down takes out dependent services

### Configuration Patterns
- **Env Variable Not Loaded** — Code checks `process.env.FOO` but it's not set → silent default (often wrong)
- **Hardcoded Paths in Code** — Path works locally, breaks in CI/deployment → "file not found"

## How to Use

1. **Check Manifestation** — Does it match what you're seeing?
2. **Use Detection Signal** — Grep for the pattern in your codebase
3. **Apply Fix Template** — Copy pattern and adapt to your code

## Full Details

For complete examples with 30+ patterns, code snippets, and debugging strategies, see `/rihal/references/common-bug-patterns.md` (detailed reference).
