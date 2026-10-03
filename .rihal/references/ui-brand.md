# UI/Brand Questions

When exploring the UI design phase (/rihal:ui-phase), ask structured questions across these eight dimensions: **color palette**, **typography**, **voice/tone**, **accessibility**, **component inventory**, **responsive behavior**, **interaction patterns**, and **visual hierarchy**. These questions build the design contract.

---

## 1. Color Palette

Explore how color communicates brand, function, and hierarchy.

### Exploration Questions

- "What colors currently represent your brand, or do you have any brand guidelines?"
- "Are there colors users expect based on your industry? (e.g., fintech = trust colors like blue/green)"
- "Do you need to support dark mode, high contrast, or other accessibility variants?"
- "How many color tokens do you anticipate — 5 core colors, or 20+?"
- "Are there status colors you already use? (red = error, green = success, yellow = warning, etc.)"

### Decision Questions

- "Should the UI be vibrant (playful) or muted (professional)?"
- "Do you have a secondary/accent color for CTAs and emphasis?"
- "Is brand consistency more important than functional clarity, or equally weighted?"

---

## 2. Typography

Explore font choices, scales, and readability.

### Exploration Questions

- "Are you using a system font (e.g., -apple-system) or custom web fonts?"
- "Do you have a type scale already — how many sizes? (e.g., 12, 14, 16, 18, 20, 24, 32)"
- "What's your target reading audience — highly technical, general public, elderly users?"
- "Do you need to support non-Latin scripts?"
- "What font stack do you prefer — serif, sans-serif, or is it flexible?"

### Decision Questions

- "How many typefaces? (Most modern designs: 1 for body, 1 for headings, or monospace for code)"
- "Line height for body text — compact (1.4) or generous (1.6)?"
- "Font weight usage — do you plan bold, regular, and light variants?"

---

## 3. Voice & Tone

Explore how language reflects brand personality.

### Exploration Questions

- "Is your brand formal, conversational, playful, or something else?"
- "How do you address users — 'you', your name, or impersonal?"
- "Are there words/phrases that feel core to your brand?"
- "Do you use emojis, or is that out of brand?"
- "Is the product educational (explains features) or assumes user knowledge?"

### Decision Questions

- "For error messages, should you apologize ('Sorry!') or be neutral?"
- "For empty states, is humor appropriate or distracting?"
- "How verbose are labels/help text — minimal or descriptive?"

---

## 4. Accessibility

Explore inclusivity and compliance needs.

### Exploration Questions

- "Do you need to meet WCAG 2.1 Level AA, AAA, or no formal requirement?"
- "Are there users with color blindness, low vision, or screen readers?"
- "Do you need keyboard navigation only, or mouse/touch?"
- "What's your minimum font size you're comfortable with?"
- "Do you animate heavily, and are there users sensitive to motion (vestibular disorders)?"

### Decision Questions

- "Contrast ratio — are you aiming for 4.5:1 (AA) or 7:1 (AAA)?"
- "Focus indicators — visible outlines or your own custom style?"
- "For interactive elements, what's the minimum touch target size? (iOS: 44x44, WCAG: 24x24)"

---

## 5. Component Inventory

Explore what UI components you need and their behavior.

### Exploration Questions

- "What components do you already have, or are you starting from scratch?"
- "Do you use a component library (Material Design, shadcn/ui, Chakra, etc.), or custom?"
- "Are components documented in Figma, Storybook, or somewhere else?"
- "What interactions are essential? (dropdowns, modals, tooltips, tabs, forms, etc.)"
- "Do you need to match a design system someone else is using?"

### Decision Questions

- "How many variations per component? (e.g., button: primary, secondary, danger sizes: sm, md, lg)"
- "Is consistency more important than flexibility?"
- "Should components have built-in theming or external theming?"

---

## 6. Responsive Behavior

Explore how the UI adapts across devices.

### Exploration Questions

- "What devices do you support — mobile, tablet, desktop, or all?"
- "What are your breakpoints? (e.g., mobile: <480px, tablet: 481-1024px, desktop: >1024px)"
- "On mobile, do you use a hamburger menu or always show navigation?"
- "Is there a mobile app, or web-only?"
- "Do you support landscape orientation on mobile, or portrait-only?"

### Decision Questions

- "Is mobile-first (design mobile, enhance desktop) or desktop-first your approach?"
- "For touch vs. click, do you need different interaction patterns?"
- "How does form layout change on mobile vs. desktop?"

---

## 7. Interaction Patterns

Explore how users move through the UI and how feedback is provided.

### Exploration Questions

- "Are there standard flows (login, checkout, onboarding) that need special care?"
- "How do users discover features — obvious UI, help docs, or video?"
- "Do you use animations to guide attention, or are they minimal?"
- "How long can a user wait before showing feedback? (instant vs. 100ms vs. 500ms)"
- "What happens on errors — inline messages, toasts, modal?"

### Decision Questions

- "For loading states, show spinners, skeleton screens, or placeholders?"
- "Confirmation dialogs on destructive actions — always, or context-dependent?"
- "How many steps before requiring a 'save' action? (inline autosave or explicit save)"

---

## 8. Visual Hierarchy

Explore how users navigate information density and prioritization.

### Exploration Questions

- "What information is most important on a typical page?"
- "Do you show everything upfront, or progressive disclosure (reveal on interaction)?"
- "How much whitespace feels right — minimal density or generous spacing?"
- "Are there sections or cards that should stand out visually?"
- "Is information dense (dashboards, data tables) or content-light (marketing sites)?"

### Decision Questions

- "For dense tables/lists, how do you break visual monotony?"
- "Should less-important info be visible or hidden behind 'more' links?"
- "Sidebar navigation vs. top navigation — what fits your use case?"

---

## Workflow: Asking UI/Brand Questions

### Step 1: Orient (2-3 min)
Ask an opening question from **each dimension** that gives you quick context:
- "What does your brand look like today?" (Color, Voice)
- "Who are your users?" (Accessibility, Responsive)
- "What's the main interface — a dashboard, a simple form, a marketplace?" (Component Inventory, Hierarchy)

### Step 2: Deep-Dive (5-10 min)
For dimensions that revealed ambiguity or strong opinions, ask 1-2 follow-ups:
- User said "professional" → "WCAG AA or AAA?" + "Serif or sans-serif?"
- User said "mobile-first" → "Minimum font size?" + "Touch target size?"

### Step 3: Document (1-2 min)
Summarize decisions into a **UI Contract** (see example below).

---

## Example: UI Contract Output

```markdown
## UI/Brand Design Contract

### Color Palette
- **Primary:** #2563EB (trust blue)
- **Secondary:** #F59E0B (accent gold)
- **Status:** green=success, red=error, yellow=warning, gray=disabled
- **Dark mode:** Full support, auto-detect OS preference

### Typography
- **Font family:** Inter (sans-serif), Fira Code (monospace)
- **Scale:** 12, 14, 16, 18, 20, 24, 28, 32
- **Body line-height:** 1.6 (generous for readability)

### Voice & Tone
- Friendly, not corporate
- Address users as "you"
- Explain features clearly for non-technical users
- Minimal emoji (only for status icons)

### Accessibility
- WCAG 2.1 Level AA minimum
- Focus indicators: 2px solid outline in primary color
- Touch targets: 44x44px minimum (iOS standard)
- Contrast: 4.5:1 minimum

### Components
- **Core set:** Button, Input, Select, Modal, Toast, Badge, Card, Stepper
- **Variants:** Each has primary/secondary/danger + small/medium/large

### Responsive
- Mobile-first approach
- Breakpoints: 640px (tablet), 1024px (desktop)
- Mobile menu: Hamburger (hidden nav)

### Interactions
- Confirmations on delete/archive actions
- Loading states: skeleton screens for lists, spinner for single items
- Error messaging: inline + toast for non-field errors
- Autosave on form fields (debounced 500ms)

### Visual Hierarchy
- Progressive disclosure: Show essential info, collapse advanced options
- Cards for content grouping, generous spacing (24px padding min)
- Table rows highlight on hover
- Whitespace: Minimum 16px margins between sections
```

---

## Red Flags When Asking

| Flag | What It Means | Follow-Up |
|---|---|---|
| "I don't know" | Missing brand/design | Offer defaults: "Shall we start with a simple blue/white palette?" |
| "It depends" | Multiple contexts | "What's the primary use case?" |
| Contradictions | User unsure | "Earlier you said formal, now conversational. Which feels right?" |
| All micro-decisions | Overthinking | Simplify: "Choose 1 primary color and 1 accent. We refine later." |

---

## Time Box

A complete UI/Brand discussion should take **15-30 minutes**:
- **0-5 min:** Quick orientation (1 q per dimension)
- **5-20 min:** Deep dives on 2-3 dimensions where clarity matters
- **20-25 min:** Clarifying closes ("Did I get that right?")
- **25-30 min:** Document and confirm contract
