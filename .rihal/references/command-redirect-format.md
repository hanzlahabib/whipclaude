# Rihal Command Redirect Format

Shared reference for all agents and workflows when they suggest the user run a different command.

## The rule

**When suggesting a `/rihal:*` command, print it on a single line for copy-paste.**

The user's terminal-style interface benefits from one-line commands they can select and paste without touching line-wrap issues. Never split a suggested command across multiple lines, never bullet it, never break arguments onto separate rows.

## Good format

```
Run: /rihal:council I'm in Pakistan, USD 1000 budget, want to dropship Gaming + Creator accessories to UAE. Should I build a Next.js custom app or use Shopify?
```

One line. User selects the whole line, pastes, presses enter.

## Bad format — do NOT do this

```
Run /rihal:council with the new question:
"I'm in Pakistan, USD 1000 budget, want to dropship Gaming + Creator accessories to UAE. Should I build a Next.js custom app or use Shopify?"
```

Two lines, with quotes, with a lead-in sentence. The user has to reconstruct the command mentally.

## When to redirect

Agents and workflows redirect when:
- An agent receives a question outside its domain (Sadiq gets a technical question → Waleed)
- A workflow gets an input type it doesn't handle (`/rihal:plan` gets a decision question → `/rihal:council`)
- The user's intent would be better served by a different command

## Template

```
<reason for redirect in one sentence>

Copy-paste this instead:

/rihal:<command> <exact arguments from user's original input>
```

The third line — the full command — is a single physical line, regardless of length. No wrapping. No quotes around the arguments unless the command itself requires them.

## For argument substitution

Pass `$ARGUMENTS` verbatim when redirecting plan → council or discuss → council. Do not modify punctuation, do not add quotes, do not summarize. The user said what they meant — preserve it.

## Multi-option redirects

If multiple commands could fit, list each on its own line as a complete single-line command:

```
Could be either — pick one:

/rihal:discuss waleed <your question>
/rihal:council <your question>
```

Not with lead-in prose for each option.
