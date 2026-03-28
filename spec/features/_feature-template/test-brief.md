# Tester Brief: [Feature Name]

## Context

[One paragraph: what this feature does and what the testing focus is. What are the highest-risk areas?]

---

## Test scenarios

> Use Given/When/Then format. Every acceptance criterion from the PO brief should map to at least one scenario.

### Scenario: [Happy path name]

```
Given: [preconditions — system state before the action]
When:  [user action or system event]
Then:
  - [Expected outcome 1]
  - [Expected outcome 2]
  - [Data persisted correctly]
  - [UI updated correctly]
  - [Notification fired if applicable]

Pass criteria: [measurable definition of pass]
```

---

### Scenario: [Error case name]

```
Given: [precondition that sets up the error]
When:  [action that triggers the error]
Then:
  - [Error handled gracefully]
  - [User-facing feedback shown]
  - [No data corrupted]
  - [State recoverable]

Pass criteria: [measurable definition of pass]
```

---

### Edge cases for [Scenario name]

- [Edge case 1]: [expected behaviour]
- [Edge case 2]: [expected behaviour]
- [Edge case 3]: [expected behaviour]

---

<!-- Add scenarios for every user story -->

---

## Integration test scenarios

> Tests that verify cross-feature wiring. Walk the full event-consequence chain.

### Scenario: [Full chain name]

```
Given: [setup across multiple features]
When:  [trigger event]
Then (in order):
  1. [Hook fires]
  2. [UI updates]
  3. [Second hook fires]
  4. [Second UI updates]
  5. [Notification appears]
  6. [Data persists correctly across all tables]

Verify on reload: [state survives app restart]
```

---

## State transition coverage

> Every transition from the state machine must be tested.

| Transition | Trigger tested | Side effects verified |
|------------|---------------|----------------------|
| [state] -> [state] | [ ] | [ ] |
| [state] -> [state] | [ ] | [ ] |

---

## Edge case catalogue

> Cross-feature conflicts and unusual scenarios.

- [User tries to [action] while [conflicting condition]]: [expected behaviour]
- [Two events fire simultaneously]: [expected behaviour]
- [App loses focus mid-[action]]: [expected behaviour]
- [App reopens after [event] completed in background]: [expected behaviour]
- [Storage quota exceeded]: [expected behaviour]
- [Rapid repeated taps on [button]]: [expected behaviour, double-action prevention]

---

## Accessibility tests

- [ ] All touch targets ≥ 44px
- [ ] Colour is not the only state indicator (text or icon accompanies colour change)
- [ ] prefers-reduced-motion: animations suppressed, state change still visible
- [ ] Screen reader: [any specific requirements for this feature]

---

## Mandatory scenarios by feature type

> **Apply every section below that matches this feature.** Check the box next to each category that applies, then include all scenarios from that section.

- [ ] This feature involves **coin spending or purchases** → include all PURCHASES scenarios
- [ ] This feature involves **card/reward opening flows** → include all CARD OPENING scenarios
- [ ] This feature involves **celebration animations** (confetti, glows, bursts) → include all ANIMATION scenarios
- [ ] This feature introduces **tabs, filters, or sort controls** → include all NAVIGATION scenarios

---

### PURCHASES AND COIN SPENDING

*(Include when the feature involves any spend of coins, items, or limited-use resources)*

**Scenario: Spend completes and delivery fires**
```
Given: Player has sufficient coins
When: Player completes the full purchase flow (confirmation CTA tap)
Then:
  - Coins deducted by the correct amount — exactly once
  - Purchased item/outcome is delivered in the same interaction (overlay opens, item appears)
  - No state exists where coins are spent but delivery has not fired
  - Wallet balance shown on screen matches post-spend value

Pass criteria: Coins deducted exactly once. Delivery fires. No spend-without-delivery gap.
```

**Scenario: Dismissal does not trigger spend**
```
Given: Player has opened a purchase confirmation sheet
When: Player dismisses by dragging, tapping backdrop, or tapping Cancel
Then:
  - Coins NOT deducted
  - No item added, no overlay opened
  - Wallet balance unchanged

Pass criteria: Wallet balance identical before and after dismissal.
```

**Scenario: Cannot afford — disabled state enforced end-to-end**
```
Given: Player's coin balance < item price
When: Player views the purchase entry point
Then:
  - CTA is visually disabled (red price colour per DS spec)
  - Tapping CTA has no effect
  - In-sheet CTA is also disabled if sheet is accessible
  - spend() is never called

Pass criteria: No code path allows spend() to fire when coins < price.
```

**Scenario: Double-tap prevention**
```
Given: Player taps the purchase CTA
When: Player taps again before the first async operation completes
Then: Second tap is a no-op — spend fires exactly once

Pass criteria: Coins deducted once regardless of rapid repeat taps.
```

---

### CARD OPENING FLOWS

*(Include when the feature involves revealing cards, items, or randomised rewards)*

**Scenario: Full open-to-summary state machine completes**
```
Given: Player initiates a pack open from the Packs tab
When: Player completes the full flow: confirm → reveal all cards → summary → Done
Then:
  - State machine fires in order: CONFIRMING → spend → REVEALING[0..N] → SUMMARY → IDLE
  - No state skipped or repeated
  - Summary shows all cards from the opened pack
  - Cards added to collection during or immediately after reveal

Pass criteria: Full state machine traced end to end. Every step fires.
```

**Scenario: Reveal overlay opens immediately after spend**
```
Given: Player taps "Open Pack" on the confirmation sheet
When: spend() call fires
Then:
  - CardReveal overlay opens within the same interaction
  - No visible gap between sheet closing and overlay appearing
  - Correct cards shown (not another pack's cards, not empty)

Pass criteria: Overlay visible before player's finger leaves the screen.
```

**Scenario: "See All" label correct on final card, "Next card" on all others**
```
Given: Player is on card N-1 of N
When: Player taps through to the last card
Then:
  - CTA label changes from "Next card" to "See All"
  - "See All" leads to summary screen
  - All non-final cards show "Next card"

Pass criteria: CTA label correct at every index.
```

**Scenario: reduced-motion collapses all animation, flow still completable**
```
Given: prefers-reduced-motion: reduce is set
When: Player opens a pack and taps through to summary
Then:
  - No entrance/exit animations play
  - No glow, sweep, pulse, or burst effects play
  - Full flow completable without interacting with any animation
  - State changes still visible (card content visible without animation)

Pass criteria: Full flow completable. No blocked interaction states.
```

---

### ANIMATION SEQUENCES

*(Include when the feature introduces celebration effects, ambient animations, or particle bursts)*

**Scenario: Animation parameters match spec**
```
Given: A named animation plays (confetti, glow bloom, ray burst, pulse ring, sweep)
When: Animation plays
Then:
  - Record observed values: element size, duration (ms), spread/reach, opacity range, colour
  - Compare observed values against spec-defined values
  - If spec does not define a parameter → raise spec gap, block sign-off until spec is updated

Pass criteria: Every observable parameter within ±10% of spec value, OR spec updated with owner acknowledgement.
```

**Scenario: Animation does not block user interaction**
```
Given: Any animation sequence is playing
When: Player taps the primary CTA during the animation
Then:
  - Tap registers and advances state
  - Player is never trapped waiting for animation to finish

Pass criteria: Every CTA is tappable before animation ends, OR spec defines interaction-blocking duration with upper bound.
```

**Scenario: prefers-reduced-motion respected**
```
Given: prefers-reduced-motion: reduce is set
When: Any celebration animation would normally play
Then:
  - Animation does not play
  - Outcome state (coins credited, item delivered) still shown
  - No functional step hidden behind the animation

Pass criteria: Full feature functionality accessible without any animation.
```

---

### NAVIGATION CONSISTENCY

*(Include when the feature introduces tabs, filter pills, sort controls, or secondary navigation)*

**Scenario: Filter/sort controls match Explore screen canonical pattern**
```
Given: New screen introduces tab switcher, filter pill row, or sort control
When: Screen rendered at 375px, 768px, 1024px
Then:
  - Section-switching tabs: compact + centred in PageHeader centre slot (not full-width)
  - Content filter pills: tint-pair active style (--blue-sub bg + --blue border + --blue-t text)
  - Sort controls: right-aligned on the same row as category filters (ml-auto shrink-0)
  - Treatment matches Explore screen unless spec explicitly documents a divergence

Pass criteria: Side-by-side visual comparison with Explore screen confirms consistent treatment.
```

**Scenario: No navigation control appears at two levels of the same screen**
```
Given: Screen has both a header area and a content area
When: Tester scrolls top to bottom
Then:
  - Every navigation control (tab, filter, sort) appears exactly once
  - No control duplicated between header and content component
  - Document every navigation control found with its position in test-results.md

Pass criteria: Every navigation control appears exactly once.
```

**Scenario: Glass header clears first content element**
```
Given: Screen uses PageHeader (sticky glass header)
When: Player scrolls to top of screen
Then:
  - First content element has minimum pt-4 gap below header bottom edge
  - Content does not merge with or disappear under header on scroll

Pass criteria: Visible breathing room between header and first content element at all three breakpoints.
```

---

## Output expected

- Test plan with all scenarios documented and results recorded
- Edge case analysis with recommendations for any unhandled cases
- Integration test results
- Accessibility audit results
- Sign-off or defect list (severity: blocker | major | minor)
- Save to: tests/[feature]/test-results.md
