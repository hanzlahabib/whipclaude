<purpose>
Analyze freeform text from the user and route to the most appropriate Rihal command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
</purpose>

<required_reading>
@.rihal/references/output-format.md
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="parse_args">
Extract `$ARGUMENTS` and detect `--auto` flag (suppresses confirmation, dispatches immediately):

```bash
AUTO_MODE=false
QUESTION="$ARGUMENTS"
if [[ "$ARGUMENTS" == *"--auto"* ]]; then
  AUTO_MODE=true
  QUESTION=$(echo "$ARGUMENTS" | sed 's/--auto[[:space:]]*//' | xargs)
fi
```
</step>

<step name="validate">
**Check for input.**

If `$QUESTION` is empty, present the main menu via AskUserQuestion:

```
What would you like to do?

1. Quick chat with one expert (/rihal:discuss)
2. Convene the council (/rihal:council)
3. Discuss an unlocked phase (/rihal:discuss-phase)
4. Plan a phase (/rihal:plan)
5. Execute a phase (/rihal:execute)
6. Sprint planning (/rihal:sprint-planning)
7. Execute a sprint (/rihal:execute-sprint)
8. Check sprint status (/rihal:sprint-status)
9. Break milestone into epics & stories (/rihal:create-epics-and-stories)
10. Implement a story (/rihal:dev-story)
11. Check progress (/rihal:progress)
12. Auto-advance to next step (/rihal:next)
13. Debug an issue (/rihal:debug)
14. Resume paused work (/rihal:resume-work)
15. Add a note (/rihal:note)
16. Something else — describe it
```

If user picks 1-15, invoke that command. If 16, capture text and continue.
</step>

<step name="check_project">
**Check if project exists.**

```bash
INIT=$(node ".rihal/bin/rihal-tools.cjs" state load 2>/dev/null)
```

Track whether `.planning/` exists — some routes require it, others don't.
</step>

<step name="route">
**Match intent to command.**

Evaluate `$QUESTION` against these routing rules. Apply the **first matching** rule:

| If the text describes... | Route to | Why |
|--------------------------|----------|-----|
| Starting a new project, "set up", "initialize" | `/rihal:new-project` | Needs full project initialization |
| Mapping or analyzing an existing codebase | `/rihal:map-codebase` | Codebase discovery |
| A bug, error, crash, failure, or something broken | `/rihal:debug` | Needs systematic investigation |
| Exploring, researching, comparing, or "how does X work" | `/rihal:research-phase` | Domain research before planning |
| Scope unclear, conflicting UIs/options, "which one", "better UX", "still have confusion", "how should X look", brainstorming vision | `/rihal:discuss-phase` | Decisions not yet locked — gather before planning |
| A complex task: refactoring, migration, multi-file architecture, system redesign | `/rihal:add-phase` | Needs a full phase with plan/build cycle |
| Planning a specific phase, "plan phase N" | `/rihal:plan` | Direct phase-level planning |
| "Sprint planning", "plan the sprint", "next sprint", "what's in this sprint" | `/rihal:sprint-planning` | Sprint-level scope/capacity planning |
| Executing a sprint, "run the sprint", "start sprint", "work on sprint" | `/rihal:execute-sprint` | Sprint execution with wave batching |
| Sprint status, "how is the sprint going", "sprint board", "sprint progress" | `/rihal:sprint-status` | Current sprint state |
| "Create milestones", "plan milestones", "create roadmap", "what milestones do I need", "break project into milestones" | `/rihal:create-milestone` | Roadmap-level planning — designs M1..Mn from the PRD. Do NOT route to `create-epics-and-stories`; that skill decomposes a single milestone into epics |
| Break milestone into epics/stories, "create stories", "user stories", "epics" | `/rihal:create-epics-and-stories` | Milestone → epic → story decomposition (assumes roadmap already exists) |
| Create a single story, "add story", "write a story for X" | `/rihal:create-story` | Single story addition |
| Implement a story, "work on story", "dev story", "build story" | `/rihal:dev-story` | Story-level implementation |
| Find gaps in milestone plans, "gaps in plans", "missing plan", "unplanned phases" | `/rihal:plan-milestone-gaps` | Identify and fill planning gaps |
| Executing a phase, "build phase N", "run phase N", "implement phase" | `/rihal:execute` | Direct phase execution request |
| Running all remaining phases automatically | `/rihal:autonomous` | Full autonomous execution |
| A review or quality concern about existing work | `/rihal:verify-work` | Needs verification |
| "Council", "discuss strategy", "should we" | `/rihal:council` | Multi-agent strategic discussion |
| List plans across phases, "all plans", "show plans" | `/rihal:list-plans` | Cross-phase plan table |
| Checking progress, status, "where am I", "board" | `/rihal:progress` | Status check |
| Resuming work, "pick up where I left off" | `/rihal:resume-work` | Session restoration |
| A note, idea, or "remember to..." | `/rihal:note` | Capture for later |
| Adding tests, "write tests", "test coverage" | `/rihal:add-tests` | Test generation |
| Completing a milestone, shipping, releasing | `/rihal:complete-milestone` | Milestone lifecycle |
| A specific, actionable, small task (add feature, fix typo, update config) | `/rihal:quick` | Self-contained, single executor |
| Market/discovery/greenfield question (from classify) | `/rihal:council` | Needs multi-perspective discovery |

If no rule matches, fall back to the classifier:

```bash
CLASSIFY=$(node ".rihal/bin/rihal-tools.cjs" classify-question "$QUESTION")
```

Parse `type` from JSON — map codebase/team/release → `/rihal:discuss`; market/discovery/greenfield → `/rihal:council`. Default: `/rihal:discuss`.

**Requires `.planning/` directory:** All routes except `/rihal:new-project`, `/rihal:map-codebase`, `/rihal:help`, `/rihal:discuss`, `/rihal:council`. If the project doesn't exist and the route requires it, suggest `/rihal:new-project` first.

**Ambiguity handling:** If the text could reasonably match multiple routes, ask the user via AskUserQuestion with the top 2-3 options. Prefer `discuss-phase` over `plan`/`add-phase` when scope-uncertainty signals are present ("confusion", "not sure", "which one", "better way", "how should", ≥2 conflicting UIs/options mentioned).

Example:

```
"Refactor the auth system" could be:
1. /rihal:add-phase — Full planning cycle (recommended for multi-file refactors)
2. /rihal:discuss-phase — Gather decisions first (recommended if scope is fuzzy)
3. /rihal:quick — Quick execution (if scope is small and clear)

Which approach fits better?
```
</step>

<step name="display">
**Show the routing decision.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RIHAL ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: {first 80 chars of $QUESTION}
Scope: {one-line scope summary}
Routing to: {chosen command}
Reason: {one-line why}
```
</step>

<step name="dispatch">
**Invoke the chosen command.**

If `AUTO_MODE` is true OR routing is unambiguous, invoke immediately:

```
/rihal:{command} {arguments}
```

Otherwise show suggestion and ask via AskUserQuestion:

```
Based on your request, I'd use: /rihal:{command} {arguments}

1. Yes, run it
2. Pick a different route
3. Cancel
```

If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via AskUserQuestion.

After invoking the command, stop. The dispatched command handles everything from here.
</step>

</process>

<success_criteria>
- [ ] Input validated (not empty)
- [ ] Intent matched to exactly one Rihal command
- [ ] Ambiguity resolved via user question (if needed)
- [ ] Scope-uncertainty signals steer to `/rihal:discuss-phase` over planning routes
- [ ] Project existence checked for routes that require it
- [ ] Routing decision displayed before dispatch
- [ ] Command invoked with appropriate arguments
- [ ] No work done directly — dispatcher only
</success_criteria>
</content>
</invoke>