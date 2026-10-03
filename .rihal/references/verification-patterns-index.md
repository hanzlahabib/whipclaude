# Verification Patterns — Quick Index

How to verify different types of artifacts are real implementations, not stubs or placeholders.

## Core Principle

**Existence ≠ Implementation**

A file existing does not mean the feature works. Verification must check:
1. **Exists** - File is present at expected path
2. **Substantive** - Content is real implementation, not placeholder
3. **Wired** - Connected to the rest of the system
4. **Functional** - Actually works when invoked

Levels 1-3 can be checked programmatically. Level 4 often requires human verification.

## Universal Stub Patterns

These patterns indicate placeholder code regardless of file type:

**Comment-based stubs:**
- Search for: `TODO`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER`
- Search for: `implement`, `add later`, `coming soon`, `will be`
- Search for: `// ...`, `/* ... */`, `# ...`

**Placeholder text in output:**
- Search for: `placeholder`, `lorem ipsum`, `coming soon`, `under construction`
- Search for: `sample`, `example`, `test data`, `dummy`
- Search for: `[...]`, `<...>`, `{...}` (unfilled template brackets)

**Empty or trivial implementations:**
- Functions that `return null`, `return undefined`, `return {}`, `return []`
- Search for: `pass`, `...`, `nothing`
- Log-only functions: `console.log('clicked')` (no actual behavior)

**Hardcoded values where dynamic expected:**
- Hardcoded string IDs instead of using variables
- Hardcoded counts/lengths instead of computing
- Hardcoded prices like `$50.00` instead of from database

## By Artifact Type

### React/Next.js Components
- Returns actual JSX, not `return null` or placeholder divs
- Uses props or state (`useState`, `useContext`, `props.field`)
- Includes meaningful event handlers (not empty callbacks)
- Imports and uses real data sources (API calls, database)

### API Routes
- More than 10-15 lines (real logic, not stub)
- Interacts with data source (Prisma, database, query)
- Has error handling (`try-catch`, throw)
- Returns meaningful response, not "not implemented"

### Database Migrations
- Creates/alters real tables with columns
- Defines constraints, foreign keys, indexes
- Has up() and down() functions for reversibility
- Not just comments or placeholder table names

### Tests
- Actually inverts assertions (test "should pass" then "should fail")
- Tests multiple cases (happy path + edge cases)
- Mocks dependencies properly
- Checks actual outputs, not just checking function exists

## How to Use

1. **Choose your artifact type** (React component, API route, test, migration, etc.)
2. **Run checks progressively** — Does it exist → Is it substantive → Is it wired → Does it work
3. **For failing checks** — Look for stub patterns above to diagnose what's missing
4. **For functional verification** — Often needs human testing (can't automate "does it look good?")

## Full Details

For complete patterns with grep examples, file-type specifics, and advanced verification strategies, see `/rihal/references/verification-patterns.md` (detailed reference).
