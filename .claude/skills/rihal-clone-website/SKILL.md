---
name: rihal-clone-website
description: >
  Reverse-engineer and clone any website pixel-perfectly — extracts assets,
  exact CSS via getComputedStyle, content section-by-section, and dispatches
  parallel builder agents in worktrees. Activates when the user says "clone
  this website", "clone this site", "rebuild this page", "replicate this
  UI", "pixel-perfect clone", "make exact UI like this", "copy this site",
  "reverse engineer this site", "build me a clone of", "aisi website banao",
  "yeh site clone karo", or "exact same UI chahiye like [URL]". Provide the
  target URL as input. Do NOT use for: creating original designs from scratch
  (use rihal-create-ux-design with Layla), writing new components from a
  brief (use rihal-dev-story with Hanzla or Bilal), or inspiration-only
  references without rebuild intent.
argument-hint: "<url>"
user-invocable: true
---

# Clone Website (Rihal)

You are about to reverse-engineer and rebuild **$ARGUMENTS** as a pixel-perfect clone.

This is not a two-phase process (inspect then build). You are a **foreman walking the job site** — as you inspect each section of the page, you write a detailed specification to a file, then hand that file to a specialist builder agent with everything they need. Extraction and construction happen in parallel, but extraction is meticulous and produces auditable artifacts.

## Pre-Flight

1. **Chrome MCP is required.** Test it immediately. If it's not available, stop and tell the user to enable it — this skill cannot work without browser automation.
2. Read `TARGET.md` for URL and scope. If the URL doesn't match `$ARGUMENTS`, update it.
3. Verify the base project builds: `npm run build`. The Next.js + shadcn/ui + Tailwind v4 scaffold should already be in place. If not, tell the user to set it up first.
4. Create the output directories if they don't exist: `docs/research/`, `docs/research/components/`, `docs/design-references/`, `scripts/`.

## Guiding Principles

These are the truths that separate a successful clone from a "close enough" mess. Internalize them — they should inform every decision you make.

### 1. Completeness Beats Speed

Every builder agent must receive **everything** it needs to do its job perfectly: screenshot, exact CSS values, downloaded assets with local paths, real text content, component structure. If a builder has to guess anything — a color, a font size, a padding value — you have failed at extraction. Take the extra minute to extract one more property rather than shipping an incomplete brief.

### 2. Small Tasks, Perfect Results

When an agent gets "build the entire features section," it glosses over details — it approximates spacing, guesses font sizes, and produces something "close enough" but clearly wrong. When it gets a single focused component with exact CSS values, it nails it every time.

Look at each section and judge its complexity. A simple banner with a heading and a button? One agent. A complex section with 3 different card variants, each with unique hover states and internal layouts? One agent per card variant plus one for the section wrapper. When in doubt, make it smaller.

**Complexity budget rule:** If a builder prompt exceeds ~150 lines of spec content, the section is too complex for one agent. Break it into smaller pieces. This is a mechanical check — don't override it with "but it's all related."

### 3. Real Content, Real Assets

Extract the actual text, images, videos, and SVGs from the live site. This is a clone, not a mockup. Use `element.textContent`, download every `<img>` and `<video>`, extract inline `<svg>` elements as React components. The only time you generate content is when something is clearly server-generated and unique per session.

**Layered assets matter.** A section that looks like one image is often multiple layers — a background watercolor/gradient, a foreground UI mockup PNG, an overlay icon. Inspect each container's full DOM tree and enumerate ALL `<img>` elements and background images within it, including absolutely-positioned overlays.

### 4. Foundation First

Nothing can be built until the foundation exists: global CSS with the target site's design tokens (colors, fonts, spacing), TypeScript types for the content structures, and global assets (fonts, favicons). This is sequential and non-negotiable. Everything after this can be parallel.

### 5. Extract How It Looks AND How It Behaves

A website is not a screenshot — it's a living thing. Elements move, change, appear, and disappear in response to scrolling, hovering, clicking, resizing, and time. If you only extract the static CSS of each element, your clone will look right in a screenshot but feel dead when someone actually uses it.

For every element, extract its **appearance** (exact computed CSS via `getComputedStyle()`) AND its **behavior** (what changes, what triggers the change, and how the transition happens).

Examples of behaviors to watch for:
- Navbar that shrinks/changes background/gains shadow after scroll threshold
- Elements that animate into view on viewport entry (fade-up, slide-in, stagger)
- Sections with `scroll-snap-type`
- Parallax layers
- Hover state transitions (duration and easing matter)
- Dropdowns/modals/accordions with enter/exit animations
- Auto-playing carousels
- Tabbed/pill content that cycles
- Scroll-driven tab/accordion switching (IntersectionObserver, NOT click handlers)
- Smooth scroll libraries (Lenis, Locomotive Scroll)

### 6. Identify the Interaction Model Before Building

This is the single most expensive mistake in cloning: building a click-based UI when the original is scroll-driven, or vice versa.

How to determine this:
1. **Don't click first.** Scroll through the section slowly and observe if things change on their own as you scroll.
2. If they do, it's scroll-driven. Extract the mechanism.
3. If nothing changes on scroll, THEN click/hover to test for click/hover-driven interactivity.
4. Document the interaction model explicitly in the component spec.

### 7. Extract Every State, Not Just the Default

For tabbed/stateful content: click each tab via Chrome MCP and extract content per state. For scroll-dependent elements: capture at scroll position 0 and after crossing the trigger threshold.

### 8. Spec Files Are the Source of Truth

Every component gets a specification file in `docs/research/components/` BEFORE any builder is dispatched. The builder receives the spec file contents inline in its prompt — the file also persists as an auditable artifact.

### 9. Build Must Always Compile

Every builder agent must verify `npx tsc --noEmit` passes before finishing. After merging worktrees, you verify `npm run build` passes.

## Phase 1: Reconnaissance

Navigate to the target URL with Chrome MCP.

### Screenshots
- Take **full-page screenshots** at desktop (1440px) and mobile (390px) viewports
- Save to `docs/design-references/` with descriptive names

### Global Extraction
Extract before anything else:

**Fonts** — Inspect `<link>` tags for Google Fonts or self-hosted fonts. Check computed `font-family` on key elements. Configure in `src/app/layout.tsx` using `next/font`.

**Colors** — Extract color palette from computed styles. Update `src/app/globals.css` with the target's actual colors.

**Favicons & Meta** — Download to `public/seo/` and update `layout.tsx` metadata.

**Global UI patterns** — Custom scrollbar, scroll-snap on page container, global keyframes, backdrop filters, smooth scroll libraries.

### Mandatory Interaction Sweep

**Scroll sweep:** Scroll the page slowly from top to bottom. Record header changes, viewport animations, auto-switching sidebars, scroll-snap points, smooth scroll libraries.

**Click sweep:** Click every element that looks interactive.

**Hover sweep:** Hover over every interactive element.

**Responsive sweep:** Test at 1440px, 768px, 390px. Note layout changes at each breakpoint.

Save findings to `docs/research/BEHAVIORS.md`.

### Page Topology
Map every distinct section from top to bottom. Give each a working name. Save as `docs/research/PAGE_TOPOLOGY.md`.

## Phase 2: Foundation Build

Sequential. Do it yourself:

1. **Update fonts** in `layout.tsx`
2. **Update globals.css** with target's color tokens, spacing, keyframes, scroll behaviors
3. **Create TypeScript interfaces** in `src/types/`
4. **Extract SVG icons** as React components in `src/components/icons.tsx`
5. **Download global assets** via `scripts/download-assets.mjs`
6. Verify: `npm run build` passes

### Asset Discovery Script

Run via Chrome MCP:

```javascript
JSON.stringify({
  images: [...document.querySelectorAll('img')].map(img => ({
    src: img.src || img.currentSrc,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight,
    parentClasses: img.parentElement?.className,
    position: getComputedStyle(img).position,
    zIndex: getComputedStyle(img).zIndex
  })),
  videos: [...document.querySelectorAll('video')].map(v => ({
    src: v.src || v.querySelector('source')?.src,
    poster: v.poster,
    autoplay: v.autoplay, loop: v.loop, muted: v.muted
  })),
  backgroundImages: [...document.querySelectorAll('*')].filter(el => {
    const bg = getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none';
  }).map(el => ({
    url: getComputedStyle(el).backgroundImage,
    element: el.tagName + '.' + el.className?.split(' ')[0]
  })),
  fonts: [...new Set([...document.querySelectorAll('*')].slice(0, 200).map(el => getComputedStyle(el).fontFamily))],
  favicons: [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({ href: l.href, sizes: l.sizes?.toString() }))
});
```

## Phase 3: Component Specification & Dispatch

For each section (top to bottom): **extract → write spec file → dispatch builders**.

### Step 1: Extract

1. **Screenshot** the section in isolation
2. **Extract CSS** via this script (replace SELECTOR):

```javascript
(function(selector) {
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Element not found: ' + selector });
  const props = [
    'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
    'textTransform','textDecoration','backgroundColor','background',
    'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
    'margin','marginTop','marginRight','marginBottom','marginLeft',
    'width','height','maxWidth','minWidth','maxHeight','minHeight',
    'display','flexDirection','justifyContent','alignItems','gap',
    'gridTemplateColumns','gridTemplateRows',
    'borderRadius','border','borderTop','borderBottom','borderLeft','borderRight',
    'boxShadow','overflow','overflowX','overflowY',
    'position','top','right','bottom','left','zIndex',
    'opacity','transform','transition','cursor',
    'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
    'whiteSpace','textOverflow','WebkitLineClamp'
  ];
  function extractStyles(element) {
    const cs = getComputedStyle(element);
    const styles = {};
    props.forEach(p => {
      const v = cs[p];
      if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') styles[p] = v;
    });
    return styles;
  }
  function walk(element, depth) {
    if (depth > 4) return null;
    const children = [...element.children];
    return {
      tag: element.tagName.toLowerCase(),
      classes: element.className?.toString().split(' ').slice(0, 5).join(' '),
      text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 200) : null,
      styles: extractStyles(element),
      images: element.tagName === 'IMG' ? { src: element.src, alt: element.alt, naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight } : null,
      childCount: children.length,
      children: children.slice(0, 20).map(c => walk(c, depth + 1)).filter(Boolean)
    };
  }
  return JSON.stringify(walk(el, 0), null, 2);
})('SELECTOR');
```

3. **Extract multi-state styles** — capture before AND after trigger states
4. **Extract real content** — all text, alt, aria labels
5. **Identify assets** — which downloaded images/videos/icons
6. **Assess complexity** — split if necessary

### Step 2: Write Component Spec File

Template at `docs/research/components/<component-name>.spec.md`:

```markdown
# <ComponentName> Specification

## Overview
- **Target file:** `src/components/<ComponentName>.tsx`
- **Screenshot:** `docs/design-references/<screenshot-name>.png`
- **Interaction model:** <static | click-driven | scroll-driven | time-driven>

## DOM Structure
<hierarchy>

## Computed Styles (exact values)
### Container
- display, padding, maxWidth, etc.

### <Child element>
- every relevant property

## States & Behaviors
### <Behavior name>
- **Trigger:** <exact mechanism>
- **State A (before):** CSS values
- **State B (after):** CSS values
- **Transition:** transition CSS
- **Implementation approach:** <CSS transition | IntersectionObserver | etc.>

## Assets
- Background/overlay images with paths
- Icons used from icons.tsx

## Text Content (verbatim)
<copy-pasted from live site>

## Responsive Behavior
- Desktop (1440px): <layout>
- Tablet (768px): <changes>
- Mobile (390px): <changes>
- Breakpoint: ~<N>px
```

### Step 3: Dispatch Builders

**Simple section** (1-2 sub-components): One builder agent.
**Complex section** (3+ sub-components): Break up. One agent per sub-component + one for wrapper.

Each builder receives:
- Full spec file contents inline
- Path to section screenshot
- Which shared components to import
- Target file path
- Instruction to verify `npx tsc --noEmit`

**Don't wait** — as soon as one builder is dispatched, move to next section extraction.

### Step 4: Merge

As agents complete: merge worktree branches, verify build passes, fix conflicts intelligently.

## Phase 4: Page Assembly

Wire everything together in `src/app/page.tsx`:
- Import all section components
- Implement page-level layout (scroll containers, z-index)
- Connect real content to component props
- Implement page-level behaviors (scroll-snap, smooth scroll, theme transitions)
- Verify `npm run build` passes

## Phase 5: Visual QA Diff

Take side-by-side screenshots with original. Compare section by section at 1440px AND 390px. For each discrepancy: re-extract, update spec, fix component. Test all interactive behaviors.

## Pre-Dispatch Checklist

Before dispatching ANY builder:
- [ ] Spec file written with ALL sections filled
- [ ] Every CSS value is from `getComputedStyle()`, not estimated
- [ ] Interaction model identified and documented
- [ ] All states captured (not just default)
- [ ] Scroll/hover triggers with before/after/transition recorded
- [ ] All images identified including overlays
- [ ] Responsive behavior documented
- [ ] Text content verbatim
- [ ] Builder prompt ≤150 lines

## Output Format

- Every builder dispatches with an inline spec (not a file reference)
- Every commit keeps `npm run build` green
- Final report structure:
  - Total sections built: N
  - Total components created: N
  - Total spec files written: N (must match components)
  - Total assets downloaded: N
  - Build status: PASS/FAIL
  - Visual QA discrepancies: list
- Do NOT include: vague status like "mostly done", builders dispatched without spec files, or estimated CSS values
- Do NOT merge with red builds
- Do NOT skip responsive extraction

## Examples

### Happy Path
**Input:** "clone https://linear.app"

**Expected behavior:**
1. Pre-flight: verify Chrome MCP, base Next.js+shadcn scaffold
2. Reconnaissance: full-page screenshots, global extraction (fonts/colors/favicons), interaction sweep
3. Foundation build: update layout.tsx fonts, globals.css colors, icons.tsx, download assets
4. For each section top-to-bottom: extract CSS via getComputedStyle, write spec file, dispatch builder in worktree
5. Merge branches as builders complete, keep build green
6. Visual QA diff at desktop + mobile
7. Report with component counts, asset counts, build status

### Edge Case: Missing Chrome MCP
**Input:** "clone this site: https://example.com"

**Expected behavior:** STOP immediately. Respond: "Chrome MCP not available. Enable it first — this skill requires browser automation to extract computed styles and screenshots. Without it, I'd be guessing from HTML which produces bad clones."

### Edge Case: Scroll-Driven Site Mistaken for Click-Driven
**Input:** User asks to clone a site with scroll-driven tabs

**Expected behavior:** During interaction sweep, scroll BEFORE clicking. If content switches on scroll, document as "INTERACTION MODEL: scroll-driven with IntersectionObserver". Do NOT build click-based tabs.

### Edge Case: Builder Prompt Too Long
**Input:** (Extracting a complex section with 4 card variants)

**Expected behavior:** Check the 150-line rule. If spec exceeds it, split: one builder per card variant + one for the section wrapper. Do NOT override with "it's all related."

### Negative Test
**Input:** "Design a new landing page for our Rihal product"

**Expected behavior:** Stay silent. This is original design work — not cloning. Redirect: "This needs original design — invoke Layla (rihal-agent-layla) for UX or Bilal (rihal-agent-bilal) for direct build. I clone existing sites, not create new ones."

## What NOT to Do

- Don't build click-based tabs when the original is scroll-driven
- Don't extract only the default state of tabbed content
- Don't miss overlay/layered images
- Don't build HTML mockups for content that's actually videos/Lottie/canvas
- Don't approximate CSS classes — extract exact values
- Don't build monolithic commits
- Don't reference external docs from builder prompts — inline everything
- Don't skip asset extraction
- Don't give a builder too much scope
- Don't bundle unrelated sections into one agent
- Don't skip responsive extraction at 1440/768/390
- Don't forget smooth scroll libraries (Lenis, Locomotive)
- Don't dispatch builders without a spec file

## Completion Report

- Total sections built: N
- Total components created: N
- Total spec files written: N
- Total assets downloaded (images/videos/SVGs/fonts): N
- Build status: `npm run build` result
- Visual QA results: any remaining discrepancies
- Any known gaps or limitations
