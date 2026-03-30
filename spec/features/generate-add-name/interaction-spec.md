# Interaction Spec: Generate Add Name

> Feature: generate-add-name
> Author: UX Designer
> Status: Phase A complete — ready for Phase B (PO)
> Last updated: 2026-03-29

---

## Overview

The Generate Wizard's ResultsScreen presents the player with a short list of name
options to choose from before adopting their new animal. The current implementation
generates a fixed list once. This feature adds a "Get more names" button that generates
a fresh batch of name options without leaving the results screen.

The purpose is to reduce Harry's frustration when none of the initial names appeal to
him. Forcing him to re-run the full wizard (7 steps) to see different names is a
disproportionate penalty for a cosmetic preference. A simple in-place refresh resolves
this.

The primary user is Harry, aged 8–10, on iPad Pro 11" (~820px portrait). The action
must be immediately findable without explanation and feel lightweight — it is a helper
button, not a major feature.

---

## Mandatory spec requirements checklist

1. Interaction states — covered in section 5
2. Card anatomy — no new card components; name list items use existing list pattern;
   see section 3
3. Overlay surface treatment — no new overlays; existing ResultsScreen layout; see
   section 3
4. Consistency check — reviewed GenerateScreen.tsx and generate-wizard ux-brief.md;
   ResultsScreen name list pattern documented; see section 3
5. PageHeader slot assignment — ResultsScreen has no PageHeader; back action is inline
   top-left; section 6
6. Navigation ownership — no new navigation; section 6
7. Filter pill style — no new filter pills
8. Filter and sort row layout — no filter/sort row on this screen
9. Content top padding — ResultsScreen uses full-page scroll layout; class string in
   section 3

---

## 1. Existing ResultsScreen name list (context)

The current ResultsScreen layout (from generate-wizard ux-brief.md and live code):

```
[← Start over]                           top-left ghost btn
[animal image — full width, 4:3 ratio]
[RarityBadge]  [CategoryBadge]
"Choose a name"                          H4, t1
[name list — 3 options, tap to select]
[narrative text]                         body-sm, t2, italic
[pink btn: Adopt {name}]                 disabled until name selected
[ghost btn: Generate again]
```

The name list currently shows 3 names. Each name is a full-width tappable row with a
radio-style selection indicator.

This feature:
- Adds a "Get more names" button below the name list (before the narrative text)
- Replaces the current list contents with a new batch on tap
- Does NOT increase the maximum number of names shown at once

---

## 2. "Get more names" button

### Placement

The button sits between the name list and the narrative text, centred horizontally.
It is a compact secondary action — it must not compete visually with the primary "Adopt"
CTA below.

```
Position: below name list, above narrative text
Alignment: centre (mx-auto)
Margin-top: 16px (mt-4)
Margin-bottom: 16px (mb-4)
```

### Anatomy

```
Variant:    outline (transparent bg, 1.5px solid var(--border), var(--t1) text)
Size:       sm (height 36px, padding 0 16px, font 13px/600)
Icon:       RefreshCw (Lucide), 14px, strokeWidth 2, inline-start, gap 6px
Label:      "Get more names"
Radius:     100px (pill — all buttons are pill per DS)
```

Outline variant is correct here: this is a utility escape action, not the primary CTA
(that's "Adopt", which is pink/accent). Blue primary would overshadow the adopt button.
Ghost variant is prohibited for visible actions (CLAUDE.md). Outline is the right weight.

### Loading state (while generating new names)

The button transitions to a loading state while `generateNames()` is running (this is
a synchronous JS function currently, but the spec treats it as potentially async for
future-proofing):

```
Icon:       Loader2 (Lucide), 14px, animated spin (CSS animation: spin 1s linear infinite)
Label:      "Getting names…"
State:      pointer-events none, opacity .6
```

Duration of loading state should match any artificial delay applied (the existing wizard
uses 1.5s for generation; name refresh should be instant — no artificial delay).

---

## 3. Name list behaviour on refresh

### Replacement, not append

New names REPLACE the current list. They do not append. Reasoning: if Harry has not
found a name he likes after two or three refreshes, the list is likely to grow long and
hard to scan. Replacement keeps the cognitive load constant.

Max names shown at once: 4 (up from the current 3). The current list is 3 names; this
spec increases it to 4 to give slightly more choice per batch. This is a data/logic
change that the Developer should note.

### Selection state on refresh

When Harry taps "Get more names":
1. If he has already selected a name from the current list, that selection is cleared.
2. The "Adopt" button returns to its disabled state until a new name is selected.
3. The new name list slides in with a brief fade-replace animation (opacity 0 → 1,
   duration 150ms, no slide — slide would be confusing in a static scroll context).

With `prefers-reduced-motion`, the fade is skipped — the list updates instantly.

### Name list item anatomy (existing, documented here for FE reference)

```
Height:     52px minimum (touch target)
Padding:    14px 16px
Background: var(--card)
Border:     1px solid var(--border-s)
Radius:     var(--r-md)  [12px]
Margin-top: 8px (gap between items)

Selected state:
  Background: var(--blue-sub)
  Border:     1px solid var(--blue)
  Radio dot:  filled, var(--blue), 10px circle

Unselected state:
  Radio dot:  empty circle, var(--border), 10px

Name text:   15px/500, var(--t1)
```

The name list is a vertical stack. Each item is a full-width button (entire row is
tappable, not just the radio dot). This is the existing pattern per generate-wizard ux-brief.

### Content container class string (FE reference)

ResultsScreen does not use PageHeader. The scrollable content area:
```
px-6 pt-6 pb-24 max-w-3xl mx-auto w-full
```

`pt-6` (24px) because there is no `below` slot content — the "← Start over" button
at the top acts as spacing before the image. This matches the DS rule: if no `below`
slot content, `pt-6` is correct.

---

## 4. Gate / cost model

"Get more names" is free, unlimited, and requires no coins.

Reasoning:
- The name step is cosmetic — it has no economic value.
- Gating a cosmetic name refresh behind coins would feel punitive for a child.
- Unlimited refreshes do not create any balance risk.
- A daily limit adds friction without benefit.

If the PO wishes to introduce a coin cost or limit, this spec should be revised at
Phase B before Phase C begins. The Developer must NOT implement a gate without a revised
spec.

---

## 5. Interaction states

### "Get more names" button

| State | Treatment |
|-------|-----------|
| Default | Outline: transparent bg, 1.5px solid var(--border), var(--t1) text, RefreshCw icon |
| Hover | Border var(--t3), bg rgba(255,255,255,.03) |
| Active | scale(.97), duration 150ms |
| Focus | 2px solid var(--blue), outline-offset 2px |
| Loading | Loader2 spin icon, "Getting names…" label, opacity .6, pointer-events none |
| Post-refresh | Returns to default state; name list refreshed |

### Name list items (existing — documented for completeness)

| State | Treatment |
|-------|-----------|
| Default (unselected) | var(--card) bg, var(--border-s) border, empty radio dot |
| Hover (unselected) | border var(--border), bg rgba(255,255,255,.02) |
| Selected | var(--blue-sub) bg, var(--blue) border, filled radio dot |
| Active (tap) | scale(.97), duration 100ms |
| Focus | 2px solid var(--blue), outline-offset 2px |

### "Adopt {name}" button (existing — affected by name refresh)

| State | Treatment |
|-------|-----------|
| Disabled (no name selected) | opacity .4, pointer-events none |
| Enabled (name selected) | variant accent (pink), fully interactive |

After refresh: "Adopt" button returns to disabled state until Harry selects a name
from the new list.

---

## 6. PageHeader slot assignment

ResultsScreen does not use PageHeader. Navigation is provided by the inline "← Start over"
top-left ghost button (existing pattern). This spec introduces no new navigation controls.

Navigation ownership: the "Get more names" button is a content action, not a navigation
control. It lives in the content flow, not in any header slot.

---

## 7. Screen inventory

| Surface | States |
|---------|--------|
| ResultsScreen — name list area | Default (name list + "Get more names" btn), loading (btn in loading state, list frozen), refreshed (new list, selection cleared) |
| "Adopt" button | Disabled (no selection), enabled (name selected), re-disabled after refresh clears selection |
| Toast | None — name refresh has no toast feedback. The visual update of the list is sufficient confirmation. |

No error state is defined for name generation failure. `generateNames()` is a
pure synchronous function with fallback names (`['Buddy', 'Luna', 'Star']`). It cannot
fail in a way that requires error UI. If the function is made async in future, an error
toast (`type: 'error'`, title: "Could not get names — please try again") must be added.

---

## 8. Accessibility

- "Get more names" button has a visible text label — no icon-only affordance.
- `aria-label` is not required because the button text is self-describing.
- When names refresh, the name list container should have `aria-live="polite"` so screen
  readers announce the new list without interrupting current speech. This is important
  for assistive technology users who may not perceive the visual swap.
- The loading state button must have `aria-busy="true"` while loading.
- Clearing the selected name on refresh: the "Adopt" button's disabled state change must
  be reflected in the DOM (`disabled` attribute), which is already the standard pattern.
- All touch targets meet 44px minimum (button is sm size at 36px height — FE must pad
  the hit area vertically to 44px using padding, not visual height).
- Animations respect `prefers-reduced-motion` — fade is skipped when reduced motion is
  preferred.

---

## 9. Handoff notes for Frontend Engineer

1. Add `refreshNames` state and handler to `ResultsScreen`. Handler calls
   `generateNames(animalType, gender, personality)` (already available via
   `generateOptions.ts`), sets the returned array as the new names list, and clears
   the selected name.

2. Change the name list to render up to 4 names (increased from 3). The
   `generateNames()` function must return 4 names; verify this in `generateOptions.ts`
   and update if needed.

3. "Get more names" button: `variant="outline"`, `size="sm"`, `RefreshCw` icon left,
   label "Get more names". Full spec in section 2. Centre-align with `mx-auto`.

4. Loading state: set `refreshing` boolean. While `true`: swap icon to Loader2, update
   label to "Getting names…", set opacity .6, pointer-events none. This is a local
   state — no async operation is currently needed, but handle the state machine
   correctly so it can be wired to an async call later without refactoring.

5. Name list fade animation: wrap the `<ul>` or name list container in an
   `<AnimatePresence>` with a keyed `<motion.div>` — key changes on each refresh,
   triggering exit/enter. Use `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`,
   `exit={{ opacity: 0 }}`, `transition={{ duration: 0.15 }}`. Respect `useReducedMotion`
   — set duration to 0 when reduced motion is preferred.

6. Selection clear on refresh: when `refreshNames` fires, also call `setSelectedName(null)`.
   This returns the "Adopt" button to its disabled state.

7. Do NOT use `AnimatePresence mode="wait"` around the name list if the "Adopt" button
   or any other sibling is also inside that AnimatePresence block. Per CLAUDE.md,
   `mode="wait"` exits ALL children before mounting new ones — this would freeze the
   rest of the screen. Give the name list its own isolated AnimatePresence wrapper.

8. Self-review gate: after building, open at 375px and 1024px. At 375px, confirm the
   "Get more names" button does not push the "Adopt" button off-screen. At 1024px,
   confirm the button is centred within the max-width content column (not full-width).
