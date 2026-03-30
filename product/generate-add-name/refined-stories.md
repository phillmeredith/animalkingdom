# Refined Stories: Generate — Additional Names Button

> Output from the Product Owner agent.
> Produced during Phase B after UR findings and interaction spec are complete.
> Phase B decisions confirmed by [OWNER] 2026-03-29.
> This is the acceptance criteria the Tester validates against.

---

## Feature goal

Remove the frustration of having no suitable name in the initial Generate Wizard results
by letting Harry request a fresh batch of names in place — without re-running the
seven-step wizard.

---

## Owner's Phase B decisions (binding)

- 4 names per batch (up from the current 3)
- Free and unlimited re-generates: no coin cost, no daily limit, no session cap
- Replace behaviour: new names replace the current list entirely on each refresh
- All other details follow the interaction spec

**PO note on UR recommendation to preserve a selected name across refresh:**
UR recommended a cumulative/pin model to prevent loss-anxiety. The Owner has chosen
full replacement for simplicity. This is a known scope trade-off. If Harry feedback
post-launch shows loss-anxiety is a real problem (he repeatedly refreshes trying to
recover a name he saw earlier), revisiting a "keep one" pattern is the recommended
first iteration. This risk is accepted and documented here.

---

## Scope (confirmed)

**In scope:**
- "Get more names" button on the Generate Wizard ResultsScreen
- Name list increased from 3 to 4 items per batch
- Selection cleared and Adopt button re-disabled on each refresh
- Fade animation on name list replacement (150ms opacity, reduced-motion safe)
- `generateNames()` updated to return 4 names

**Out of scope (this iteration):**
- Pinning or preserving a selected name across re-generates (Owner decision)
- Displaying previously generated names from prior sessions (name history)
- Any coin cost or re-generate limit (Owner decision: free and unlimited)
- Re-generate during the wizard steps (before ResultsScreen)
- Session counter display ("2 re-generates used") — not applicable given unlimited model

---

## Dependencies

Before Phase C starts, the following must be in place:
- `GenerateScreen` and `ResultsScreen` components exist (they do)
- `generateNames()` function in `generateOptions.ts` accessible and understood by Developer
- Developer verifies name pool depth: three consecutive calls to `generateNames()` with the
  same parameters must return meaningfully different results. If pools are too shallow,
  the function must be expanded before Phase C starts — this is a prerequisite, not
  a Phase C task.

---

## Refined user stories

### Story 1: "Get more names" button on the Results screen

As Harry,
I want to be able to request a fresh set of name options on the results screen without
going back through the wizard,
So that if none of the initial names feel right, I can try again instantly without losing
the animal I just generated.

**Acceptance criteria:**
- [ ] A "Get more names" button renders on the ResultsScreen between the name list and the
  narrative text.
- [ ] The button is centre-aligned (`mx-auto`, displayed as a block or `flex justify-center`).
  At 1024px it does not stretch to full width.
- [ ] Button anatomy: `variant="outline"` (transparent bg, 1.5px solid `var(--border)`,
  `var(--t1)` text), `size="sm"` (height 36px, padding 0 16px, font 13px/600), `RefreshCw`
  Lucide icon (14px, strokeWidth 2) left of label with 6px gap, label "Get more names",
  100px pill radius. Hit area padded to minimum 44px height.
- [ ] The button has margin-top 16px from the bottom of the name list and margin-bottom 16px
  before the narrative text.
- [ ] The button is present from the moment the ResultsScreen renders (not added only after
  a first re-generate).
- [ ] Tapping the button immediately replaces the name list with 4 new names. At 375px the
  Adopt button is visible on screen without scrolling after the refresh.
- [ ] The name list transitions with an opacity fade (0 to 1, 150ms). With
  `prefers-reduced-motion`, the list updates instantly with no transition.
- [ ] Any previously selected name is cleared when the refresh fires. The Adopt button
  returns to its disabled state (opacity .4, `pointer-events: none`) until a name from
  the new list is selected.
- [ ] After the refresh, the button returns to its default state immediately.
- [ ] The button is present on every visit to the ResultsScreen, regardless of how many
  times it has been tapped. There is no cap, counter, or exhausted state.

**Notes from UX / UR:**
- UR Risk 2 (loss-anxiety from replace-all) is accepted per Owner decision. If post-launch
  data shows Harry repeatedly refreshing trying to recover a name he saw, the "keep one"
  pattern should be the first follow-on iteration.
- UR Risk 1 (thin name pools) must be resolved before Phase C begins. Developer must
  verify pool depth as a dependency check.

---

### Story 2: Name list shows 4 names per batch

As Harry,
I want each batch of names to give me 4 options instead of 3,
So that I have a slightly wider choice without feeling overwhelmed.

**Acceptance criteria:**
- [ ] The ResultsScreen name list always renders exactly 4 name options on initial load.
- [ ] After tapping "Get more names", the list renders exactly 4 new name options.
- [ ] `generateNames()` returns exactly 4 names. If the function previously returned 3,
  the Developer updates it to return 4. Tester confirms by inspecting the rendered list,
  not by reading source code.
- [ ] Each name item meets the minimum touch target: height 52px, padding 14px 16px,
  full-width tappable row (not just the radio dot).
- [ ] Each name item renders: background `var(--card)`, border `1px solid var(--border-s)`,
  radius `var(--r-md)`, margin-top 8px between items, name text 15px/500 `var(--t1)`,
  unselected radio dot (empty circle, `var(--border)`, 10px).
- [ ] Selected item renders: background `var(--blue-sub)`, border `1px solid var(--blue)`,
  filled radio dot `var(--blue)` 10px.
- [ ] Only one name can be selected at a time. Tapping a second name deselects the first.
- [ ] The Adopt button becomes enabled (accent/pink, fully interactive) only when a name
  is selected.
- [ ] The name list container has `aria-live="polite"` so screen readers announce the updated
  list after a refresh without interrupting current speech.

---

### Story 3: Loading state for the "Get more names" button

As Harry,
I want to see clear feedback that new names are being fetched when I tap the button,
So that I know the tap registered and the app is working.

**Acceptance criteria:**
- [ ] While names are being generated, the "Get more names" button transitions to loading
  state: `RefreshCw` icon replaced by `Loader2` Lucide icon (14px, animated CSS spin
  `1s linear infinite`), label changes to "Getting names…", opacity `.6`,
  `pointer-events: none`.
- [ ] The loading state lasts exactly as long as the `generateNames()` call takes. Since
  the function is currently synchronous, the loading state should still be implemented
  via a state machine (`refreshing: boolean`) so it is ready for an async call without
  refactoring.
- [ ] No artificial delay is added to the loading state. The user must not wait longer than
  necessary.
- [ ] The loading state button has `aria-busy="true"` while loading.
- [ ] The name list items are not interactive while the refresh is in-flight (the list is
  in its previous state, frozen, until the new names arrive).

---

## Definition of Done (confirmed)

This feature is complete when:
- [ ] All three stories above pass all acceptance criteria
- [ ] Developer has verified `generateNames()` pool depth: three consecutive calls return
  meaningfully different results (this is a dependency gate, not a Phase D check)
- [ ] "Get more names" button verified at 375px: Adopt button visible on screen after
  refresh without scrolling
- [ ] "Get more names" button verified at 1024px: button is centred within `max-w-3xl`
  content column, not full-width
- [ ] Fade animation verified: opacity transition on name list replacement; instant update
  with `prefers-reduced-motion: reduce`
- [ ] `aria-live="polite"` on name list container confirmed in DOM
- [ ] Adopt button confirmed to return to disabled state after each refresh
- [ ] Tester has verified all ten DS checklist points in test-results.md
- [ ] Tester sign-off received
- [ ] No disconnected functionality

---

## Sign-off

Refined stories complete. Phase C may begin after [OWNER] approval.
