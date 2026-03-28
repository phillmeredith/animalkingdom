# Project Rules

---

## Primary target device — iPad

**This is an iPad-first PWA.** The default use case is iPad (1024×1366 portrait, 1366×1024 landscape). Every layout decision, column count, spacing choice, card size, and UX pattern should be designed for iPad first. Phone (375px) is a supported secondary target. Any layout that looks fine on phone but wastes space or looks sparse on iPad is wrong and must be fixed. UX specs must include explicit iPad layout decisions. FE must verify at 1024px before any other breakpoint.

---

## HARD GATES — Read these first, every session

These are non-negotiable. They cannot be skipped under "continue" pressure or any other instruction.

### Before writing any code for a feature:

1. **Is the feature listed in `spec/backlog/BACKLOG.md`?** If not — stop. Ask [OWNER] which feature to work on.
2. **Does `spec/features/{feature}/interaction-spec.md` exist?** If not — stop. Run Phase A (UR) and Phase B (UX) first.
3. **Does `product/{feature}/refined-stories.md` exist?** If not — stop. Run Phase B (PO) and ask [OWNER] for Phase B approval.
4. **Has [OWNER] explicitly approved Phase B?** If not — stop. Ask now.
5. **Declare the feature:** Write the feature name to `.claude/current-feature` so the pre-build hook can verify spec files.

If any of these is false — do not open a single source file.

### Before marking any feature complete:

1. **Does `tests/{feature}/test-results.md` exist with a Tester sign-off?** If not — stop. Run Phase D (Tester) first.
2. **Has the Definition of Done checklist in `spec/features/{feature}/done-check.md` been run?** If not — stop. Run Phase E.

If either is false — the backlog status stays `in_progress`. Do not write `complete`.

### When [OWNER] says "continue":

This means: **run the next phase properly**, not start coding immediately.
- If no spec exists for the next feature → run Phase A/B
- If spec exists but no Phase B approval → ask for it
- If Phase C is approved → declare the feature in `.claude/current-feature`, then build

### Tier transitions — mandatory full-team retro

**Before moving from one build tier to the next** (e.g., Tier 1 → Tier 2, Tier 2 → Tier 3), run a full-team retro. This is non-negotiable.

**Retro participants (all must contribute):**
- User Researcher — did the build reflect actual user needs? any accommodations missed?
- UX Designer — were specs complete? what was underspecified?
- Product Owner — were acceptance criteria sufficient? what AC gaps caused rework?
- Developer — any integration or error-handling issues? any hook patterns that need documenting?
- Frontend Engineer — any DS drift, Framer Motion issues, or reuse failures?
- Tester — what should Phase D have caught that didn't? any test gaps to close?

**Retro output:**
1. Update `CLAUDE.md` with new rules derived from the retro (the team writes the rules, not [OWNER])
2. Update `design-system/DESIGN_SYSTEM.md` if any component patterns were discovered or refined
3. Update brief templates (`spec/features/_feature-template/`, `product/_feature-template/`) with new requirements
4. Append a new entry to `/Users/phillm/Dev/Animalkingdom/RETRO.md` (running log of all tier retros)

The retro happens **in the same session** as the tier transition request. Do not skip it or defer it.

---

## Process

This project follows a structured build pipeline. You do not freestyle.

### Phase model (agents/team.md defines all roles)

```
Phase A (parallel):
  → User Researcher   — ur-brief.md → research/{feature}/ur-findings.md
  → UX Designer       — ux-brief.md → spec/features/{feature}/interaction-spec.md

Phase B:
  → Product Owner     — po-brief.md → product/{feature}/refined-stories.md
  → [OWNER] approves Phase B before Phase C begins

Phase C (parallel):
  → Developer         — dev-brief.md → src/hooks/ + src/lib/
  → Frontend Engineer — fe-brief.md  → src/components/{feature}/ + src/screens/

Phase D (sequential, after Phase C):
  → Tester            — test-brief.md → tests/{feature}/test-results.md

Phase E:
  → Run done-check.md checklist
  → Update backlog status to complete only after Tester sign-off
```

**On defects from Tester:** Dispatch only the affected agent(s) with the defect report. Do not re-run the full team.

**On tier completion:** Run the full-team retro (see "Tier transitions" above) before picking up any Tier N+1 feature.

---

## Design system

The design system lives at `design-system/DESIGN_SYSTEM.md`.

Read this file before making ANY visual decision. Do not guess colours, spacing, borders, typography, or component patterns. Every visual value must come from this file.

**Re-read after:**
- Starting a new build phase
- Every 10+ file edits (context drift is real)
- Any change to a shared component's background or surface level

---

## Self-review is mandatory

After building **every** component or hook, before moving to the next:

1. Re-read the relevant section of the design system
2. Compare what you built against the design system tokens
3. Compare what you built against the feature's `interaction-spec.md`
4. If other screens are already built, check visual consistency
5. Open the preview and scroll every screen to the bottom — check for cut-off content
6. Fix any drift before proceeding

This is not optional. If self-review is skipped, defects reach [OWNER]. That is a process failure.

**Developer — additional mandatory self-review checks after every hook:**

- **Integration map compliance:** Before marking any hook complete, verify every event in `INTEGRATION_MAP.md` that the hook participates in. For each event, check every listed consequence is implemented, transaction boundaries are correct (`earn()`/`spend()` must be inside the same `db.transaction()` as the records they relate to), and all downstream status side-effects are applied. Do not ship a hook with unverified integration consequences.
- **Badge and reward eligibility:** Any hook that triggers a badge-eligible event (care, rescue, racing, arcade, marketplace) must call `checkBadgeEligibility()` after the event fires. Do not stub this with an empty return. A stub that returns `[]` unconditionally is a build defect.
- **Error handling — BUILD DEFECT if violated:** Every async operation must be wrapped in a `try/catch` that calls `toast({ type: 'error', ... })` with a user-facing message. The following patterns are build defects and must be fixed before Phase C is marked complete — no exceptions, no "low priority" override:
  - `.catch(() => {})` — silent swallow, prohibited
  - `.catch((_) => {})` or `.catch((_err) => {})` — still a silent swallow, prohibited
  - `catch { }` or `catch (e) { /* ignore */ }` — prohibited
  - A `catch` block that only logs to the console without a toast — prohibited for any operation that affects player state (coins, pets, progress)

  The correct pattern for non-blocking fire-and-forget calls is `.catch(err => toast({ type: 'error', title: 'Something went wrong' }))`. If you believe a silent swallow is genuinely justified, you must leave a comment explaining why. No such calls currently exist in this codebase.

- **Spend-before-write transaction integrity — BUILD DEFECT if violated:** Any function that calls `spend()` must wrap `spend()` AND all DB writes that represent what was purchased inside a single `db.transaction('rw', ...)`. The pattern `await spend(...)` followed by separate `await db.table.add(...)` calls outside a transaction is a build defect. If `spend()` succeeds and a subsequent write throws, the player loses coins and receives nothing — this is data corruption with no recovery path. **Check every `spend()` call in the hook: is the DB write that delivers the purchased item inside the same `db.transaction()`?**

- **Portal requirement for overlays — BUILD DEFECT if violated:** Any component that renders with `position: fixed` or `position: absolute` above page content — Modal, BottomSheet, Toast, Drawer, confirmation overlay, celebration/confetti — must use `ReactDOM.createPortal(content, document.body)`. A `fixed` element inside the React tree is silently broken by any ancestor with a CSS `transform`, `filter`, `will-change`, or `contain` property (including Framer Motion animated parents). **Check: grep the component for `position: fixed` — if it is not inside a `createPortal` call, it is a build defect.**

- **Body scroll lock must be reference-counted:** Any component that applies `document.body.style.overflow = 'hidden'` must use a reference-counted mechanism rather than setting the value directly. Direct sets break when two overlays are open simultaneously (the first overlay to close sets `overflow = ''`, unblocking scroll while the second is still open). Check: can any screen open two overlay components simultaneously (e.g. BottomSheet that triggers a confirmation Modal)? If yes, direct `document.body.style.overflow` manipulation is prohibited.

- **Pet status enforcement:** Any hook or screen that displays or acts on pets must check `pet.status`. A `for_sale` pet must not accept care actions, must not be releasable without first cancelling its active listing, and must not appear in flows that assume active ownership. Unhandled status values are a build defect.
- **Hook state machine validation:** Any hook with a status state machine (e.g. `open → running → finished`) must verify that every derived collection (e.g. `openRaces`, `runningRaces`) explicitly accounts for all reachable statuses. A collection named `openRaces` that excludes `running` is wrong if `running` is a state the player actively participates in. Trace every status transition against every derived collection before marking the hook complete.
- **Toast message accuracy:** Any toast that says "tap X" or "find X" must be verified against actual post-action screen state. If the referenced UI element is not visible on screen when the toast fires, the message is misleading and must be rewritten. This requires the FE to trigger the action in the preview and confirm the element exists where the toast says it is.

---

## Design system compliance — no exceptions

Every value in the UI must trace to a token in `design-system/DESIGN_SYSTEM.md`.

**Prohibited:**
- Emojis used as icons anywhere in the app — use Lucide icons only
- Hardcoded hex values not in the DS token sheet
- Spacing values outside the DS scale (4 6 8 10 12 14 16 20 24 28 32 40 48 56 64 80)
- `ghost` button variant for visible actions — use `outline`, `primary`, or `accent`
- Drop shadows on static elements
- Native select elements without custom styling

**Icons:**
- Icon library: Lucide (`lucide-react`), stroke-width 2, size from DS scale
- No emojis in JSX, data files, toast messages, or button labels
- Data files (`.ts`) must not contain emoji characters — store icon names as strings, resolve to Lucide components in the rendering layer

**Glass rule — non-negotiable:**

Any element with `position: fixed` or `position: absolute` that sits above page content uses the glass treatment. Opacity depends on backdrop presence:

- **BottomNav** (no backdrop): `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.04–.06)`
- **Modal / BottomSheet** (with backdrop): `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.06)` — backdrop must be `bg-black/10`, never higher
- **Toast**: `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)`

Why the difference: a backdrop darkens the blur source. `.80` over `bg-black/10` reads as the same material as `.88` over no backdrop. Hard opaque surfaces (`var(--card)`, `var(--elev)`) are **never** used on floating/overlay elements. FE must visually compare every new overlay against the BottomNav — they must read as the same material.

**Gradient fade rule — non-negotiable:**

The BottomNav always has a gradient fade above it (`height: 48px, linear-gradient to top, rgba(13,13,17,.85) → transparent`). Any screen where content scrolls behind the nav must have this fade rendered. A hard edge between content and nav is an incomplete build.

**10-point DS checklist — mandatory after every component (FE) and in every test-results.md (Tester):**

Checks 1–6 apply per-batch. Checks 7–10 apply **app-wide** (not scoped to the current batch — search the full codebase).

All ten checks must be explicitly listed and passed in every `tests/{feature}/test-results.md` before Tester sign-off is valid.

1. **No emojis used as icons** — Lucide only, everywhere in JSX, data files, toast messages, and button labels
2. **No `ghost` variant on visible actions** — use `outline`, `primary`, or `accent`. Search the **entire codebase** for `variant="ghost"` (not just files changed in this batch). Any pre-existing ghost button found during a new feature's Phase D must be logged as a defect against the screen that owns it.
3. **All colours trace to `var(--...)` tokens** — no hardcoded hex values. Alpha composites of DS tokens (e.g. `rgba(13,13,17,.88)`) are permitted only where documented in the DS glass rule.
4. **Surface stack is correct** — component steps up exactly one level from its container; glass rule applies to all fixed/absolute overlays
5. **Layout verified at 375px, 768px, and 1024px** — no wasted space, no cut-off content. Resize the browser window to each breakpoint; do not rely on CSS inspection alone.
6. **All scrollable content has `pb-24` minimum** — no content hidden behind the fixed nav
7. **Top-of-screen breathing room** — on every screen with a sticky glass header, scroll to the top and confirm the first content element has at least `pt-4` clearance below the header bottom edge. Content flush against the glass header is an incomplete build.
8. **Navigation controls are compact and consistent** — compare any tab switcher, filter pill row, or sort control against the Explore screen (the canonical reference). Controls must not span full width when compact/centred is specified. Cross-screen inconsistency is a defect. Filter pills must use the tint-pair active style (`--blue-sub` bg + `--blue` border + `--blue-t` text), never a solid fill.
9. **Animation parameters match the spec** — for every animation introduced (entrance, celebration, confetti, glow, pulse), record observed values (size, speed, spread, duration) and compare against spec-defined values. If the spec does not define animation parameters, raise a spec gap before Phase D closes — do not let FE decide independently.
10. **Spec-to-build element audit** — scroll every built screen top to bottom and list every visible element. Compare against the interaction spec layout. Any element present in the build but absent from the spec (e.g. duplicate navigation), or absent from the build but present in the spec, is a defect.

---

## Responsive layout rules

Every screen is a **tablet-first PWA** (primary target: iPad Air, 1024×1366 portrait, 1366×1024 landscape).

**Required on every screen:**
- Content column: `max-w-3xl mx-auto w-full` — never let content span the full iPad width
- Single-column card lists: `grid grid-cols-1 md:grid-cols-2` on screens ≥768px
- Animal/item grids: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` minimum
- Bottom padding: `pb-24` on all scrollable content (clears the 68px fixed nav)
- The FE self-review checklist MUST include: resize the preview to 768px and 1024px wide and verify layout

**The FE agent must check at three breakpoints:** 375px (phone), 768px (iPad portrait), 1024px (iPad landscape). If a layout looks wrong at any breakpoint, fix it before marking Phase C complete.

**Responsive layout is a hard requirement, not a polish step.** Any single-column card list rendering on a screen wider than 768px is a layout failure and must be fixed before Phase C is marked complete. A screen missing `max-w-3xl mx-auto w-full` on its content column, or missing `pb-24` on its scrollable content, is an incomplete build.

**FE — hover state and clip self-review (mandatory after building any card grid):**

1. Every interactive card must use the approved DS hover pattern:
   `motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300`
2. Hover over every card in the preview and verify the lift does not clip against the scroll container. If it clips, add `pt-1` to the parent grid.
3. If a screen has multiple card types, all must use the same hover pattern — inconsistency is a defect.
4. The Tester must physically hover over cards in every screen during Phase D.

---

## FE — Framer Motion self-review (mandatory after any component using motion)

Run these checks before marking any component that uses Framer Motion complete.

### 1. AnimatePresence mode="wait" sibling check

`<AnimatePresence mode="wait">` exits **every direct child** before mounting the next one. It is a sequential animation primitive — not a wrapper for unrelated components that happen to animate independently.

Before placing any component inside an `<AnimatePresence>` block, answer: is this component an exit candidate that should block the next child from mounting? If not — it must not be a direct child of that block.

**Rule:** Every direct child of `<AnimatePresence mode="wait">` must have a comment justifying its presence as a controlled exit target. Any component that should animate independently (e.g. a celebration overlay, a toast, a particle burst) must be rendered outside the `AnimatePresence` block entirely. If it needs to be conditionally rendered, give it its own `<AnimatePresence>` wrapper.

Violation that prompted this rule: `ConfettiBurst` rendered as a sibling of the card flip inside a shared `mode="wait"` block — the flip blocked until the burst had fully exited.

### 2. Fixed-position stacking context check

`position: fixed` does **not** mean "relative to the viewport" when any ancestor has one of these CSS properties:

- `transform` (any value, including Framer Motion animated transforms)
- `opacity` less than 1 (including Framer Motion `initial={{ opacity: 0 }}` and in-progress animations)
- `filter` (any value)
- `will-change: transform` or `will-change: opacity`
- `perspective` (any value)

Any of these on an ancestor creates a new containing block. The fixed child is contained inside that ancestor, not the viewport. Clipping, z-index, and positioning all behave unexpectedly.

**Rule:** Any `position: fixed` element must be traced up its ancestor tree before shipping. If any ancestor uses motion on the above properties, the fixed element must be moved to a `createPortal(…, document.body)` call. This is not optional for celebration overlays, confetti, modals, toasts, or any fixed-position layer rendered inside a `motion.*` subtree. See "Portal Pattern for Fixed Overlays" in `design-system/DESIGN_SYSTEM.md`.

Violation that prompted this rule: confetti container with `position: fixed` inside a `motion.div` with `initial={{ opacity: 0 }}` — fixed children were trapped inside the stacking context.

### 3. Particle burst / confetti initial state

`initial={{ scale: 0 }}` is a reveal animation — the element grows into existence from nothing. It is correct for cards, badges, and modals appearing on screen. It is **not** correct for burst particles, confetti, or scatter effects. A burst particle that starts at `scale: 0` reads as a slow bloom from the origin. An explosion requires particles at full size from frame zero, translating outward.

**Rule:** For any particle, confetti, or scatter animation, the `initial` state must be `scale: 1`, `opacity: 1`, `x: 0`, `y: 0`, `rotate: 0`. Animate `x`, `y`, `rotate`, and `opacity` over time. Never animate `scale` from 0 on a burst particle.

Violation that prompted this rule: `initial={{ scale: 0 }}` on confetti particles — particles grew from invisible instead of flying outward from the burst origin.

### 4. Existing component check before any new pill / chip / tag / filter

Before implementing any interactive pill, chip, category tag, filter button, or badge:

1. Search `/src/components/` for an existing implementation: glob `**/*Pill* **/*Chip* **/*Tag* **/*Filter* **/*Badge*`
2. If one exists — read it. Use it or extend it. Do not re-implement inline.
3. Implementing inline styles for a tint-pair pattern that already has a named component is a build defect.

The correct tint-pair pattern for active pills is defined in the Design System (Tint Pair System section) and implemented in `src/components/explore/CategoryPills.tsx`:
- Active: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`
- Inactive: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`

Do not use solid `--blue` background with white text on a pill. That violates the DS tint-pair rule.

Violation that prompted this rule: filter pills implemented with solid blue fill instead of the existing `CategoryPills` tint-pair pattern.

### 5. Badge / indicator tint-pair gate — per-element, not end-of-feature check

Before rendering any badge, dot, icon-in-circle, status indicator, or owned/equipped marker, answer both questions immediately after writing the JSX — not at end of Phase C:

1. **Solid colour + white/light text?** → STOP. Use the tint-pair: `var(--X-sub)` bg + `1px solid var(--X)` border + `var(--X-t)` text. Never `var(--green)` background with `#fff` text.
2. **Filter pill active state using solid fill?** → STOP. Active filter pills are always: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`. Solid `bg-[var(--blue)]` with white text is for primary action buttons only.

This is a per-element check. It runs the moment you write the badge JSX — before moving to the next element.

Violations that prompted this rule (2026-03-28 retro):
- SchleichCard owned badge: solid `var(--green)` + white `Check` → should be `var(--green-sub)` tint-pair pill
- StoreHubScreen filter pills: solid `var(--blue)` + white text → should be `var(--blue-sub)` tint-pair
- SchleichDetailSheet dividers: Tailwind `divide-x` with no-op `divideColor` inline style → should be explicit `border-left: 1px solid var(--border-s)`

### 6. Ghost variant — per-file gate, not end-of-feature check

The prohibition on `ghost` variant for visible actions is already in the 6-point DS checklist (item 2). The defect recurred because the checklist was treated as a final pass rather than a per-file gate.

**Rule:** The 6-point DS checklist item 2 (no `ghost` on visible actions) must be verified on every screen file individually, immediately after building it. Do not defer to an end-of-feature pass. When working across multiple screen files in a session, run the check after each file before opening the next.

Violation that prompted this rule: ghost variant used in SettingsScreen, TraderPuzzle, and RenameInput across a single build phase — three separate files, each individually in violation, each missed because the checklist was deferred to the end.

### 7. BottomSheet image pattern check (mandatory before any new detail sheet)

Before building any new `BottomSheet` that displays an animal or item, read at least one existing BottomSheet implementation (`PetDetailSheet.tsx` is the canonical reference) and match its image treatment.

**Rule:** Animal/item images inside a `BottomSheet` use the compact header row pattern:
- `w-20 h-20 rounded-xl object-cover shrink-0` image thumbnail on the left
- Name, rarity badge, and metadata stacked on the right
- **Never** use a full-width `aspect-video` or `aspect-square` image inside a BottomSheet

`aspect-video` is the correct treatment for grid cards (AuctionCard, AnimalCard). It is **never** correct for a detail sheet. A detail sheet has constrained vertical space and the full-width hero pushes all interaction elements off-screen on a phone.

**Check:** Before marking any BottomSheet component complete, answer: does this sheet display an image? If yes — open `PetDetailSheet.tsx` and confirm your image sizing matches its header row.

Violation that prompted this rule: `AuctionDetailSheet` used `w-full aspect-video` inside a BottomSheet — copied from the `AuctionCard` grid card without checking the sheet pattern.

---

## UX Designer — mandatory interaction spec requirements

Every interaction spec (`spec/features/{feature}/interaction-spec.md`) must include:

1. **Interaction states section:** for every interactive element (card, button, input), specify hover, active, focus, and disabled states. "Hover: lift pattern per DS" is acceptable if the DS defines it — but the spec must explicitly reference it. FE must not choose hover behaviour independently.
2. **Card anatomy section:** any spec that introduces a card component must define icon size, colour pair assignment (which DS tint pair), information hierarchy (what text at what size), empty state, and owned/active state treatment. A card without a defined anatomy in the spec is an **incomplete spec** — do not proceed to Phase C.
3. **Overlay surface treatment:** any spec that introduces a BottomSheet, Modal, Toast, or overlay must explicitly state the glass rule applies. Not left to FE discretion.
4. **Consistency check:** before finalising a spec, check: does this card/component already exist elsewhere in the app? If so, the new spec must match the existing pattern or explicitly document why it differs.
5. **PageHeader slot assignment:** every spec that introduces a header-level control must declare which slot it occupies. Use exactly these terms:
   - `centre` slot — section switchers (controls that select which major content area is visible). Must be compact (`display: inline-flex`, not full-width). Never placed in the `below` slot.
   - `below` slot — content filters and search bars (pills and inputs that operate on content within the current section). Never used for section switchers.
   If a control is not assigned to a named slot, the spec is incomplete. Do not proceed to Phase C.
6. **Navigation ownership:** any spec that introduces a tab control or section switcher must name exactly one place where that control lives. If the control lives in the `below` slot of PageHeader, the spec must explicitly state: "The content component receives the active value as a prop. It does not render its own tab control." Dual navigation (the same control appearing in both the header and inside a content component) is a build defect. The spec must prevent it, not the Tester.
7. **Filter pill style:** any spec that introduces filter pills must reference the CategoryPills pattern from ExploreScreen by name. The active state for filter pills is always tint-pair: `background: var(--blue-sub); border: 1px solid var(--blue); color: var(--blue-t)`. Solid fill (`background: var(--blue); color: white`) is for primary action buttons only, not filter pills. Do not write a new colour treatment — cross-reference the existing pattern or explicitly document why it differs.
8. **Filter and sort row layout:** any spec that introduces both a category filter row and a sort control must explicitly state whether they occupy one shared row or separate rows. If shared: state which is left-aligned and which is right-aligned, and confirm `ml-auto shrink-0` for the right-aligned group. Page structure diagrams must match this decision exactly — a diagram showing two rows will be built as two rows.
9. **Content top padding:** every spec must state the full class string for the content container immediately below the PageHeader. The minimum is `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`. The `pt-4` (16px) is mandatory — it prevents content sitting flush against the glass header border. If a screen has no `below` slot content, `pt-6` (24px) is the correct value. FE must not choose this value independently.

---

## What to ask [OWNER]

- Which feature to work on next (if not in backlog)
- Design decisions not covered by the design system
- Scope questions when the brief is ambiguous
- Approval before moving from Phase B to Phase C

Do not ask [OWNER] to verify visual consistency, check integration wiring, or confirm code quality. **That is the team's job, not [OWNER]'s.**
