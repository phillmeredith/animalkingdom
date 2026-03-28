# Toast Message Spec: Racing

> Feature: racing
> Author: UX Designer
> Status: Correction to existing build — applies immediately
> Last updated: 2026-03-28

---

## Issue: Inaccurate post-race toast message

### Problem

A toast message in the current build reads: **"Check Your Races"**

This message is misleading. There is no standalone "Races" destination in the app.
Races are a tab within PlayHubScreen, reachable via the Play tab in the bottom nav.
A user who reads "Check Your Races" and taps through to the app has no clear place to
navigate to. The message creates friction — the navigation intent is unclear.

This is a build defect per CLAUDE.md rule:

> "Any toast that says 'tap X' or 'find X' must be verified against actual post-action
> screen state. If the referenced UI element is not visible on screen when the toast fires,
> the message is misleading and must be rewritten."

---

## Corrected toast messages

### Scenario A — Race result is now available (race has finished)

**Context:** The player entered a race, navigated away, and the race has now resolved.
A toast fires to tell them the result is in.

**Incorrect (current):** "Check Your Races"

**Correct:** "Tap Play to see your race result"

Rationale: "Play" directly names the bottom nav tab label. The user knows immediately where
to go. The action is specific: one tap to the Play tab, then the Racing sub-tab.

```
Toast type:     info
Title:          "Your race is done!"
Body:           "Tap Play to see your race result."
Icon:           Trophy  (Lucide, 16px, --blue-t)
Auto-dismiss:   5s  (info warning variant duration from DS)
```

### Scenario B — Race is ready to run (player has entered a race and can run it)

**Context:** The player entered a race. The race is now in `open` state and ready to be
run. A toast or badge prompts them to act.

Note: This scenario is primarily handled by the nav badge dot on the Play tab
(see racing-improvements interaction spec, section 5). If a toast is also fired at
the moment the race becomes runnable, use the following message:

**Correct:** "Tap Play to run your race"

```
Toast type:     info
Title:          "Ready to race!"
Body:           "Tap Play to run your race."
Icon:           Flag  (Lucide, 16px, --blue-t)
Auto-dismiss:   5s
```

### Scenario C — Race result has been collected (coins awarded)

**Context:** The player taps "Reveal Result" and earns coins. A success toast fires.

This toast does NOT need to redirect — the player is already on the result screen.

**Correct:** "You earned [X] coins!"

```
Toast type:     success
Title:          "Race complete!"
Body:           "You earned [X] coins."
Icon:           Trophy  (Lucide, 16px, --green-t)
Auto-dismiss:   3s
```

---

## Rule for all racing toasts

**No racing toast must reference a screen, tab, or destination that is not directly
navigable from the current screen.**

- "Check Your Races" — prohibited (no such destination exists)
- "Go to Races" — prohibited (no Races route)
- "Tap Play" — permitted (Play is a visible bottom nav tab)
- "Go to Play → Racing" — acceptable but verbose; prefer "Tap Play to [action]"

The Play tab is the correct and only navigable destination for race-related toasts.

---

## Implementation note

Wherever the current toast with text "Check Your Races" is fired in the codebase, the
developer must:

1. Replace the toast title and body with the corrected copy above (Scenario A or B,
   whichever applies based on race state).
2. Verify the toast fires AFTER the navigation state update, so "Tap Play" reflects the
   actual current nav state when the toast appears.
3. Confirm the bottom nav Play tab is visible on screen when the toast fires. If the
   player is on a full-screen overlay (e.g. a modal), the toast should be deferred until
   the overlay closes, or the message adjusted to reflect that they need to dismiss first.

---

*This document is a correction to the existing build. It does not require Phase B approval
before the fix is applied — it is a wording defect, not a new feature. The developer should
fix the toast message as part of the next available build session.*
