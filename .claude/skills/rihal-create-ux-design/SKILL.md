---
name: rihal-create-ux-design
description: >
  Guide through realizing a UX design that informs architecture and
  implementation — user flows, wireframes, design system updates. Activates
  when the user says "create UX design", "design the user flow", "wireframe
  this", "UX plan", "design this screen", or "create the design for". Do NOT
  use for UI code (use rihal-dev-story) or visual code review.
---

## Workflow

Follow the instructions in ./workflow.md.

## Output Format

- UX spec saved to .rihal/artifacts/ux/{slug}.md
- Fixed sections: User Goal | Flow Steps | Screens with States | Design Tokens Used | Accessibility Notes
- All UI states listed (default/hover/focus/empty/loading/error/success)
- Accessibility notes cite WCAG 2.1 AA criteria
- Do NOT skip UI states

## Examples

### Happy Path
**Input:** "Create the UX design for password reset"
**Expected behavior:** Ask about user goal and constraints, map flow, define screens with all states, reference design system tokens, note a11y.

### Edge Case: No Design System
**Input:** (no design system exists)
**Expected behavior:** Respond: "No design system found. Either establish base tokens first, or I'll propose minimal ones and flag for later formalization."
