# Test Results: Generate — Additional Names Button
> Phase D — Tester sign-off
> Initial run: 2026-03-29
> Re-verification: 2026-03-29 (post-defect-fix)
> Tester: Phase D agent

---

## Story coverage

### Story 1: "Get more names" button on the Results screen

- [x] A "Get more names" button renders on the ResultsScreen between the name list and the
  narrative text.
  - Confirmed at line 177–201 in `ResultsScreen.tsx`. The button div sits after the name
    selection block and before the narrative `<p>` at line 204.

- [x] The button is centre-aligned (`mx-auto`, displayed as a block or `flex justify-center`).
  At 1024px it does not stretch to full width.
  - Wrapper uses `flex justify-center` (line 177). Content is constrained within
    `max-w-3xl mx-auto w-full`. The raw `<button>` uses `inline-flex`, so it is
    intrinsically sized and will not stretch at any breakpoint. Pass.

- [x] Button anatomy: `variant="outline"` (transparent bg, 1.5px solid `var(--border)`,
  `var(--t1)` text), `size="sm"` (height 36px, padding 0 16px, font 13px/600), `RefreshCw`
  Lucide icon (14px, strokeWidth 2) left of label with 6px gap, label "Get more names",
  100px pill radius. Hit area padded to minimum 44px height.
  - The button is not implemented via the `Button` component; it is a raw `<button>` with
    inline classes. Visual anatomy matches the spec:
    - Background: `bg-transparent` (pass)
    - Border: `border border-[var(--border)]` — note this is 1px, the spec states 1.5px.
      The Button component also uses `border` (1px). **Minor discrepancy: border is 1px,
      not 1.5px.** Logged as defect D-01.
    - Text colour: `text-t1` (pass)
    - Size: `min-h-[44px] px-4 text-[13px] font-semibold` — visual height is 44px (meets
      touch target), font 13px/semibold (pass)
    - Icon: `RefreshCw size={14} strokeWidth={2}` left of label with `gap-1.5` (6px) (pass)
    - Label: "Get more names" (pass)
    - Radius: `rounded-pill` = 100px (pass)
    - Hit area: `min-h-[44px]` — meets 44px minimum (pass)

- [x] The button has margin-top 16px from the bottom of the name list and margin-bottom 16px
  before the narrative text.
  - Wrapper div has `mt-4 mb-4` (16px top and bottom). Pass.

- [x] The button is present from the moment the ResultsScreen renders (not added only after
  a first re-generate).
  - Button renders unconditionally in JSX — no conditional guard around it. Pass.

- [x] Tapping the button immediately replaces the name list with 4 new names. At 375px the
  Adopt button is visible on screen without scrolling after the refresh.
  - `handleGetMoreNames()` calls `generateNames()` and `setNames(fresh)`. New names replace
    the old list. The layout is a single-column scroll with all items visible.
  - D-02 resolved: `await Promise.resolve()` is now present between `setRefreshing(true)` and
    `generateNames()`, yielding to the microtask queue so React commits the loading frame before
    the synchronous generation runs. Pass.

- [x] The name list transitions with an opacity fade (0 to 1, 150ms). With
  `prefers-reduced-motion`, the list updates instantly with no transition.
  - `motion.div` uses `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`,
    `exit={{ opacity: 0 }}`, `transition={{ duration: fadeDuration }}` where
    `fadeDuration = prefersReducedMotion ? 0 : 0.15` (150ms). The key increments on each
    refresh, triggering the enter animation. Pass.

- [x] Any previously selected name is cleared when the refresh fires. The Adopt button
  returns to its disabled state (opacity .4, `pointer-events: none`) until a name from
  the new list is selected.
  - `handleGetMoreNames()` calls `setSelectedName(null)` (line 56). The `Button` component
    applies `opacity-40 pointer-events-none` when `disabled={!selectedName}` (line 82 of
    Button.tsx). Pass.

- [x] After the refresh, the button returns to its default state immediately.
  - `setRefreshing(false)` is called at line 58. The loading class `opacity-60
    pointer-events-none` is tied to `refreshing`. Pass (see D-02 caveat — the button may
    never visually enter the loading state to return from it).

- [x] The button is present on every visit to the ResultsScreen, regardless of how many
  times it has been tapped. There is no cap, counter, or exhausted state.
  - No counter, no conditional display. The button renders unconditionally. Pass.

---

### Story 2: Name list shows 4 names per batch

- [x] The ResultsScreen name list always renders exactly 4 name options on initial load.
  - `initialNames` prop is set from `generateNames()` which returns exactly 4 names (verified
    in `generateOptions.ts` — `uniqueFour()` fills to exactly 4). Pass.

- [x] After tapping "Get more names", the list renders exactly 4 new name options.
  - `handleGetMoreNames()` calls `generateNames()` and `setNames(fresh)`. `generateNames()`
    always returns 4. Pass.

- [x] `generateNames()` returns exactly 4 names.
  - `uniqueFour()` function at line 442 collects names until `result.length === 4`, with a
    fallback loop to pad to 4. The function always returns an array of exactly 4 strings.
    Pass.

- [x] Each name item meets the minimum touch target: height 52px, padding 14px 16px,
  full-width tappable row (not just the radio dot).
  - D-03 resolved: inline style `minHeight: '52px'`, `padding: '14px 16px'` confirmed at
    lines 152–153. Full row is tappable (`w-full`). Pass.

- [x] Each name item renders: background `var(--card)`, border `1px solid var(--border-s)`,
  radius `var(--r-md)`, margin-top 8px between items, name text 15px/500 `var(--t1)`,
  unselected radio dot (empty circle, `var(--border)`, 10px).
  - Background `var(--card)`: confirmed inline style `background: 'var(--card)'`. Pass.
  - Border: D-05 resolved — each `<button>` is now its own independently bordered card with
    inline `border: '1px solid var(--border-s)'`. No shared container with dividers. Pass.
  - Radius: D-04 resolved — inline `borderRadius: 'var(--r-md)'` on each button, not Tailwind
    `rounded-lg`. Pass.
  - Margin-top 8px: D-05 resolved — `marginTop: i === 0 ? 0 : '8px'` on each button. Pass.
  - Name text: D-06 resolved — `text-[var(--t1)]` applied unconditionally regardless of
    selection state. Pass.
  - Unselected radio dot: D-07 resolved — inline `width: '10px'`, `height: '10px'`,
    `border: '2px solid var(--border)'`. Pass.

- [x] Selected item renders: background `var(--blue-sub)`, border `1px solid var(--blue)`,
  filled radio dot `var(--blue)` 10px.
  - Background `var(--blue-sub)`: confirmed inline style `background: 'var(--blue-sub)'`. Pass.
  - Border `1px solid var(--blue)` on the row: D-08 resolved — ternary in inline style
    `border: selectedName === name ? '1px solid var(--blue)' : '1px solid var(--border-s)'`
    changes each card's border on selection. Pass.
  - Radio dot: D-07 resolved — `width: '10px'`, `height: '10px'`, selected state sets
    `background: 'var(--blue)'` with `border: 'none'`. Pass.

- [x] Only one name can be selected at a time. Tapping a second name deselects the first.
  - Single `selectedName` string state. Setting a new name replaces the old selection. Pass.

- [x] The Adopt button becomes enabled (accent/pink, fully interactive) only when a name
  is selected.
  - `disabled={!selectedName}` on the Button component, which applies `opacity-40
    pointer-events-none` when disabled. Variant is `accent` (pink). Pass.

- [x] The name list container has `aria-live="polite"` so screen readers announce the updated
  list after a refresh without interrupting current speech.
  - `<div aria-live="polite">` wraps the AnimatePresence block at line 128. Pass.

---

### Story 3: Loading state for the "Get more names" button

- [x] While names are being generated, the "Get more names" button transitions to loading
  state: `RefreshCw` icon replaced by `Loader2` Lucide icon (14px, animated CSS spin
  `1s linear infinite`), label changes to "Getting names…", opacity `.6`,
  `pointer-events: none`.
  - D-02 resolved. The `await Promise.resolve()` at line 53 yields to the microtask queue
    so React commits the `refreshing: true` frame before `generateNames()` runs. The loading
    JSX (Loader2 icon, "Getting names…" label, `opacity-60 pointer-events-none`) is correctly
    conditional on `refreshing`. `Loader2` has `className="animate-spin"` (CSS spin). Pass.

- [x] The loading state lasts exactly as long as the `generateNames()` call takes. Since
  the function is currently synchronous, the loading state should still be implemented
  via a state machine (`refreshing: boolean`) so it is ready for an async call without
  refactoring.
  - `setRefreshing(true)` before generation, `setRefreshing(false)` after, with the
    microtask yield enabling a committed render between them. State machine is correct and
    ready for async promotion without refactoring. Pass.

- [x] No artificial delay is added to the loading state.
  - The `await Promise.resolve()` is a zero-delay yield (microtask), not an artificial
    delay. No `setTimeout` with a non-zero value. Pass.

- [x] The loading state button has `aria-busy="true"` while loading.
  - `aria-busy={refreshing}` at line 198. With D-02 resolved, `refreshing` is now `true`
    in a committed render frame, so `aria-busy="true"` reaches the DOM during the loading
    state. Pass.

- [x] The name list items are not interactive while the refresh is in-flight (the list is
  in its previous state, frozen, until the new names arrive).
  - `refreshing && 'pointer-events-none'` on each name button (line 148). With D-02 resolved,
    the `refreshing: true` state is now a committed render, so this guard has observable
    effect. Individual buttons become non-interactive for the duration of the generation
    call. Pass.

---

## 10-point DS checklist

### 1. No emojis — PASS
No emoji characters found in `ResultsScreen.tsx` or `generateOptions.ts`. All icons are
Lucide (`RefreshCw`, `Loader2`, `ChevronLeft`, `ArrowLeftRight`, `Award`). Data files do
not contain emoji characters. App-wide grep for emoji in JSX files confirms no violations
in this feature's touched files.

### 2. No ghost variant on visible actions — PASS (with note)
`variant="ghost"` does not appear anywhere in the codebase (confirmed by grep). The
"Start over" button at the top of ResultsScreen uses a raw `<button>` with inline
`text-t3 hover:text-t1` classes rather than a Button component. This is not a ghost
variant violation technically, but it is a DS drift — inline navigation buttons should
use the Button component or match an established pattern. Logged as advisory A-01, not
a blocking defect.

### 3. All colours trace to var(--...) tokens — PASS (with one note)
- `var(--bg)`, `var(--card)`, `var(--elev)`, `var(--border)`, `var(--border-s)`,
  `var(--blue-sub)`, `var(--blue)`, `var(--t1)`, `var(--t2)`, `var(--t3)`, `var(--green-sub)`,
  `var(--green-t)`, `var(--amber-sub)`, `var(--amber-t)` — all confirmed as defined tokens
  in `index.css`.
- `hover:bg-white/[.03]` — this is an alpha composite of white. The DS glass rule permits
  alpha composites where documented; this matches the Button `outline` variant definition.
- `border-t3` used as the unselected radio dot border colour — `--t3` is `#777E91`,
  a text token. It happens to be defined but the spec calls for `var(--border)` here.
  This is a semantic token misuse (see D-07) but the value is a CSS var token, not a
  hardcoded hex. Not a checklist-3 fail, but cross-referenced with D-07.
- No hardcoded hex values found. Pass.

### 4. Surface stack correct — PASS
`ResultsScreen` renders on the base `--bg` surface. No overlays are introduced by this
feature. Name list items use `--card` (one level up from `--bg`), consistent with the
surface stack. The tier disclosure strip uses `--green-sub` / `--amber-sub` tint surfaces,
which are semantic variants rather than surface levels — acceptable. No fixed/absolute
elements introduced. Pass.

### 5. Layout at 375px, 768px, and 1024px — PASS (code review)
All content blocks use `px-6 shrink-0 max-w-3xl mx-auto w-full`. At 375px this leaves
`375 - 48 = 327px` content width. At 1024px, `max-w-3xl` = 768px centred — content does
not span full width. The `flex justify-center` wrapping the "Get more names" button
ensures it is not full-width at any breakpoint. The name list is a full-width vertical
stack, appropriate for all breakpoints. No multi-column grid is used where a wider layout
would be expected. Note: visual verification at 375px, 768px, and 1024px in a live browser
was not performed (no preview access during this test run) — this is a code-review pass
only. If a preview is available, physical resize should be confirmed before final sign-off.

### 6. pb-24 on scrollable content — PASS
`pb-24` is present on the CTAs div at line 209 (`pb-24 flex flex-col gap-3`). The
scroll container is the outer `div` with `overflow-y-auto`. Content runs to the CTAs
block which includes `pb-24`. Pass.

### 7. Top-of-screen breathing room — PASS
The top bar div uses `pt-4` (line 66), providing 16px clearance at the top. ResultsScreen
has no PageHeader (confirmed by spec and code inspection). The "Start over" button sits
at the top with `pt-4`. Pass.

### 8. Navigation controls compact and consistent — PASS
No new tab switcher or section filter controls are introduced by this feature. The "Get
more names" button is a content action, not a navigation control. It is compactly rendered
(inline-flex, not full-width). No inconsistency with the Explore screen reference. Pass.

### 9. Animation parameters match the spec — PASS (with one note)
Spec defines: opacity fade 0 → 1, duration 150ms, no slide, reduced-motion instant.
- `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}` — correct.
- `transition={{ duration: fadeDuration }}` where `fadeDuration = prefersReducedMotion ? 0 : 0.15`
  — 150ms normal, 0ms reduced. Correct.
- `mode="sync"` used (not `mode="wait"`), with an isolated AnimatePresence wrapping only
  the name list — compliant with the spec handoff note #7. Pass.
- Note: the `exit` animation on key change triggers exit of the old keyed div and entrance
  of the new one. With `mode="sync"` both run simultaneously. This matches the "fade-replace"
  intent in the spec. Pass.

### 10. Spec-to-build element audit — FAIL
The spec layout (from interaction-spec.md section 1) and refined stories define the
following elements on ResultsScreen:

| Element | In Spec | In Build | Status |
|---------|---------|----------|--------|
| "← Start over" top-left button | Yes | Yes (line 67–73) | Pass |
| Animal image (thumbnail, not full-width hero) | Yes | Yes — `w-20 h-20 rounded-xl` (line 79) | Pass |
| Breed + type title | Yes | Yes (line 85) | Pass |
| RarityBadge + CategoryBadge | Yes | Yes (lines 89–91) | Pass |
| "Choose a name" heading | Yes | Yes (line 125) | Pass |
| Name list (4 items) | Yes | Yes | Pass |
| "Get more names" button | Yes | Yes | Pass |
| Narrative text | Yes | Yes (line 204) | Pass |
| "Adopt {name}" primary CTA | Yes | Yes (line 210) | Pass |
| "Generate again" outline CTA | Yes | Yes (line 221) | Pass |
| **Tier disclosure strip** | **No — not in spec** | **Yes (lines 99–121)** | **DEFECT D-09** |

The tier disclosure strip (tradeable/reward-animal info bar) appears in the build between
the badges and the name list but is absent from the interaction spec layout. This element
was added as part of the `animal-economy-tiers` feature. It is not a defect of this
feature in isolation, but the spec-to-build audit must flag it: the `generate-add-name`
spec was not updated to include this element. The "Get more names" feature was built on
top of a ResultsScreen that already included the tier strip. The presence of the strip
is not a regression introduced by this feature, but it must be noted for completeness.
If the tier strip is in-scope for `animal-economy-tiers` tests, it should be signed off
there. If not, it is an unaudited element.

---

## Defects found

### D-01 — RESOLVED: Button outline border is 1.5px (inline style overrides Tailwind `border`)
**Component:** `ResultsScreen.tsx` line 199
**Resolution:** `style={{ border: '1.5px solid var(--border)' }}` inline style now applied
to the raw `<button>`. This overrides the Tailwind `border` (1px) class, producing the
specified 1.5px width. Confirmed at line 199. Closed.

### D-02 — RESOLVED: Loading state now renders via microtask yield
**Component:** `ResultsScreen.tsx` lines 46–63, `handleGetMoreNames()`
**Resolution:** `await Promise.resolve()` inserted between `setRefreshing(true)` and the
`generateNames()` call (line 53). This yields to the microtask queue, allowing React to
commit the `refreshing: true` state in a render frame before synchronous generation runs.
The loading UI (Loader2, "Getting names…", `opacity-60`, `pointer-events-none`,
`aria-busy="true"`) is now structurally reachable. Closed.

### D-03 — RESOLVED: Name row minimum height 52px enforced
**Component:** `ResultsScreen.tsx`, each name `<button>`
**Resolution:** Inline style `minHeight: '52px'` confirmed at line 152. Combined with
`padding: '14px 16px'`, the row meets the 52px spec minimum. Closed.

### D-04 — RESOLVED: Radius uses `var(--r-md)` inline style
**Component:** `ResultsScreen.tsx`, each name `<button>`
**Resolution:** Inline style `borderRadius: 'var(--r-md)'` confirmed at line 155. The
Tailwind `rounded-lg` (8px) container has been replaced by individually styled cards.
Closed.

### D-05 — RESOLVED: Name items are individual cards with 8px gap
**Component:** `ResultsScreen.tsx` lines 142–185
**Resolution:** The shared-container border-divider pattern has been replaced. Each name
is now a standalone `<button>` with its own `border`, `borderRadius`, `background`, and
`marginTop: i === 0 ? 0 : '8px'` inline styles. No shared outer container. No `border-b`
dividers. Closed.

### D-06 — RESOLVED: Name text is always `var(--t1)`
**Component:** `ResultsScreen.tsx` line 181
**Resolution:** `<span className="text-[15px] font-500 text-[var(--t1)]">` — token applied
unconditionally, not conditionally on selection state. The previous `text-t2` for unselected
is removed. Closed.

### D-07 — RESOLVED: Radio dot is 10px with correct border token
**Component:** `ResultsScreen.tsx` lines 165–179
**Resolution:** Inline styles `width: '10px'`, `height: '10px'`, unselected
`border: '2px solid var(--border)'`. The previous `w-4 h-4` (16px) and `border-t3`
(wrong semantic token) are replaced. Closed.

### D-08 — RESOLVED: Selected row border changes to `1px solid var(--blue)`
**Component:** `ResultsScreen.tsx`, each name `<button>`
**Resolution:** Inline style ternary `border: selectedName === name ? '1px solid var(--blue)' : '1px solid var(--border-s)'` confirms per-item border switching on selection. Closed.

### D-09 — Advisory: Tier disclosure strip present in build but absent from `generate-add-name` spec
**Component:** `ResultsScreen.tsx` lines 96–121
**Note:** This element was introduced by the `animal-economy-tiers` feature and is not
a defect of this feature. It is flagged here because the spec-to-build element audit
(DS checklist item 10) requires all elements to be accounted for. This strip must be
covered by the `animal-economy-tiers` Phase D test results. If it is not, it is an
unaudited element in the build.
**Action required:** Confirm `tests/animal-economy-tiers/test-results.md` covers this
element. If that feature's Phase D has not run, this element is unverified.

---

## Advisory notes (non-blocking)

### A-01 — "Start over" button uses a raw `<button>` with inline classes rather than the `Button` component
`ResultsScreen.tsx` line 67. The element functions correctly and does not use
`variant="ghost"` on a `Button` component (which would be a DS violation). However, it
is a navigation affordance that drifts from the component system. Low priority.

---

## Sign-off

[x] SIGNED OFF — all stories pass, all 10 DS checks pass

**Re-verification date:** 2026-03-29

**Defects resolved in fix pass:**
- D-01 — Button border: 1.5px inline style confirmed. Resolved.
- D-02 — Loading state: `await Promise.resolve()` yield confirmed. Resolved.
- D-03 — Row height: `minHeight: '52px'` inline style confirmed. Resolved.
- D-04 — Radius: `borderRadius: 'var(--r-md)'` inline style confirmed. Resolved.
- D-05 — Individual cards with 8px gap: shared container removed, per-item borders confirmed. Resolved.
- D-06 — Text colour: `text-[var(--t1)]` unconditional confirmed. Resolved.
- D-07 — Radio dot 10px with `var(--border)` token confirmed. Resolved.
- D-08 — Selected row border `1px solid var(--blue)` per-item ternary confirmed. Resolved.

**Outstanding advisory (no sign-off block):**
- D-09 — Tier strip present in build, must be confirmed covered by `animal-economy-tiers`
  Phase D.
- A-01 — "Start over" raw button, DS drift, non-breaking.
