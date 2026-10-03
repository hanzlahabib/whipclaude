# Workflow: rihal:brainstorm

<purpose>
Guided brainstorming session using structured methods. User provides a challenge; the workflow presents available methods, applies the selected one, and generates ideas in a structured format. Output is a brainstorm artifact stored in `.planning/brainstorms/` with the chosen method, raw ideas, and synthesis.
</purpose>

## Step 0 — Usage check

If `$ARGUMENTS` is empty or only contains `--help` or `-h`:

```
/rihal:brainstorm <challenge> [--method=METHOD] [--people=N] [--personas=LIST]
```

**Examples:**
```
/rihal:brainstorm how to improve user onboarding
/rihal:brainstorm --method=SCAMPER reduce API latency
/rihal:brainstorm --method=Rolestorming --personas=competitor,child reduce churn
```

STOP — do not proceed. Only proceed when the user provides a challenge.

## Step 1 — Parse arguments

Extract from `$ARGUMENTS`:
- `$CHALLENGE` — the core challenge/problem text (everything before flags)
- `--method=METHOD` — optional method name (validate against brain-methods.csv)
- `--people=N` — optional number of participants (for 6-3-5 method)
- `--personas=LIST` — optional comma-separated personas (for Rolestorming)

If `$CHALLENGE` is empty, ask:
```
AskUserQuestion(
  header: "Brainstorming Challenge",
  question: "What challenge do you want to brainstorm?",
  followUp: null
)
```

## Step 2 — Load brainstorming methods

Read `rihal/references/brain-methods.csv` and parse it.

If `--method` was specified:
- Validate the method exists in the CSV
- If not found, list all available methods and ask user to select
- Skip to Step 4

If no method specified:
- Display all available methods with brief descriptions
- Prompt user to select one:

```
Available brainstorming methods:

1. SCAMPER — Apply 7 transformations (Substitute/Combine/Adapt/Modify/etc.)
2. Random Stimulus — Introduce random word/object, force connections
3. Reverse Brainstorm — How to make the problem worse, then flip to solutions
4. Brainwriting — Silent written ideation, pass around for refinement
5. 6-3-5 — Structured method for teams (6 people, 3 ideas, 5 rounds)
6. Mind Mapping — Radial structure with main idea + branches
7. Starbursting — Explore using Who/What/When/Where/Why/How questions
8. Rolestorming — Generate ideas from different personas

AskUserQuestion(
  header: "Select Method",
  question: "Which method? (enter number 1-8 or method name)"
)
```

Store selected method as `$METHOD_NAME`.

## Step 3 — Gather input based on method

**For 6-3-5:**
- Ask: "How many people participating?" (default 6, must be at least 3)
- Store as `$PARTICIPANT_COUNT`
- Ask for list of 3 initial ideas per person (or generate 3 yourself as starter ideas)

**For Rolestorming:**
- Ask: "Which personas? (e.g., competitor, 10-year-old, luddite, expert)" or use `--personas` if provided
- Store as `$PERSONAS` array (at least 2)

**For Starbursting:**
- Confirm challenge is clear for question generation

**For others:**
- Proceed directly with the method

## Step 4 — Execute brainstorm method

### SCAMPER

For each transformation (Substitute, Combine, Adapt, Modify, Put-to-other-uses, Eliminate, Reverse):
1. Prompt: "{transformation}: What if we {transformation_prompt}?"
   - Substitute: "replace a key part of this?"
   - Combine: "merge this with something else?"
   - Adapt: "borrow from a different domain?"
   - Modify: "change shape, size, or attributes?"
   - Put-to-other-uses: "use this for a completely different problem?"
   - Eliminate: "remove a core feature or step?"
   - Reverse: "flip the direction or order?"
2. Capture 1-3 ideas per transformation
3. Output format: Markdown list grouped by transformation

### Random Stimulus

1. Present a random word: "[word]"
2. Ask: "How is [challenge] like [word]?"
3. Capture free associations (no filtering)
4. Ask: "How can we use this absurd connection to improve [challenge]?"
5. Refine absurdities into viable ideas
6. Output format: Stimulus → Associations → Absurd ideas → Refined concepts

### Reverse Brainstorm

1. Restate challenge as opposite: "How to FAIL at [challenge]?"
2. Generate 8-10 bad outcomes
3. For each, write the flip (good version)
4. Output format: Two-column table (Bad idea / Good idea)

### Brainwriting

1. Write 3 initial ideas
2. Describe: "These ideas are written down. If you were passing this to the next person, how would you extend or refine each?"
3. Simulate 2-3 rounds of refinement (improve ideas iteratively)
4. Output format: Evolution markers showing round-by-round refinement

### 6-3-5

1. Generate 3 starter ideas (or use user's)
2. Simulate `$PARTICIPANT_COUNT` people over 5 rounds
3. Each round: previous ideas are refined/extended
4. Output format: Matrix showing idea evolution across 5 rounds

### Mind Mapping

1. Place challenge in center
2. Ask: "What are the 3-5 main themes or subtopics?"
3. For each theme, ask: "What are 2-3 sub-ideas?"
4. Optionally connect related nodes across branches
5. Output format: ASCII indented tree or text outline

### Starbursting

1. For each of Who/What/When/Where/Why/How, generate 3-5 sub-questions about the challenge
2. For each question, brainstorm what emerging ideas it suggests
3. Output format: Six sections (one per letter), each with sub-questions and ideas

### Rolestorming

1. For each persona in `$PERSONAS`, ask: "If you were a [persona], what would you think about [challenge]? What ideas come to mind?"
2. Capture 5-10 ideas per persona
3. Output format: Markdown sections by persona, each with ideas

## Step 5 — Synthesize and save

After method execution:

1. Display all generated ideas in the structured format defined by the method
2. Ask: "Any immediate combinations or refinements?" (optional follow-up ideation)
3. Create artifact file: `.planning/brainstorms/{TIMESTAMP}-{METHOD_NAME}.md`

**Artifact structure:**

```markdown
# Brainstorm: {CHALLENGE}

**Method:** {METHOD_NAME}
**Date:** ISO-DATE
**Participant count:** N (if applicable)

## Generated Ideas

{structured output from method}

## Synthesis

[User's optional refinements or combinations]

## Next Steps

To turn ideas into features/tickets:
- `/rihal:plan <idea description>` — for detailed implementation plan
- `/rihal:council is this idea worth pursuing?` — for strategic discussion
```

4. Print summary: "{N} ideas generated using {METHOD_NAME}"

## Success Criteria

- User selects or is assigned a brainstorming method
- Method is executed with structured prompts
- Ideas are captured in the format defined by the method
- Artifact is saved to `.planning/brainstorms/`
- User can see all generated ideas clearly

## On Error

If method execution fails or user cannot articulate challenge:
- Provide a fallback free-form brainstorm: "Let's just list ideas without structure"
- Save output as `.planning/brainstorms/{TIMESTAMP}-freeform.md`
