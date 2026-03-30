# UR Findings — Generate: Additional Names Button

**Feature:** `generate-add-name`
**Researcher:** User Researcher (Phase A)
**Date:** 2026-03-29
**Primary user:** Harry, ~8–10 years old, iPad Pro 11" portrait

---

## Codebase context

The current `generateNames()` function in `generateOptions.ts` returns exactly 3 names, drawn from pools filtered by gender and personality. Names are generated locally (no API call); the function is synchronous and fast. The ResultsScreen displays these 3 names for the player to select from. Once a name is chosen and the animal is adopted, navigation proceeds forward. There is no re-generate mechanic in the current flow. The `useNameHistory` hook writes all generated name sets to history, but the history is not surfaced to the player on the results screen. A `TraderPuzzle` component exists in the generate flow, suggesting that some gated interactions (requiring a challenge to unlock) are already established as a pattern.

The `generateNames` function produces `uniqueThree([pool1, pool2, pool3])` — 3 unique names drawn across 3 pools. Generating more names would either require expanding pool variety or risk duplicates across sessions, which the current deduplification logic (`uniqueThree`) is designed to avoid but does not track across sessions.

---

## Research questions addressed

**1. How many name options should be shown at once?**

Evidence from naming UX research and child decision-making literature (Lepper, Iyengar — choice overload applies to children more acutely than adults) suggests:

- 3 options is at the lower edge of satisfying but is cognitively comfortable. Children can compare 3 items without feeling overwhelmed.
- 5–6 options is the upper limit before choice overload produces paralysis or anxiety for this age group. More than 6 names on screen simultaneously would likely result in random selection rather than considered choice.
- The current 3 is functional but may feel sparse if none of the three names resonate. The desire to generate more names is a signal that 3 is occasionally insufficient, not that 3 is generally wrong.

Recommendation: Show 3 names initially; allow the player to request more in batches of 3, up to a maximum of 6 visible at once (i.e., one re-generate adds 3 new names, replacing or supplementing the first set). Do not display more than 6 simultaneously.

Confidence: medium-high. Grounded in established choice architecture research for children; not primary research with Harry specifically.

**2. Should re-generating replace all names or add to the list?**

This is a meaningful UX distinction with different implications:

- **Replace all:** simpler UI, no growing list to manage, but risks discarding a name the player liked from the first set. Creates anxiety about loss of a good option.
- **Add to list (cumulative):** the player builds up options and chooses from the full set. Avoids the loss-anxiety problem but risks list growing too long and producing choice overload.
- **Replace with kept option:** the player can pin one name from the current set before re-generating, then receives 3 new options alongside the pinned one. This is the most sophisticated approach but introduces a new interaction (pin) that adds friction.

For an 8–10 year old, the loss-anxiety of "replace all" is a real risk — if Harry saw a name he liked and tapped re-generate, discovering it is gone would be frustrating. The cumulative approach up to a visible cap (6) avoids this. Beyond 6, new names should replace the oldest unpinned names rather than extending the list further.

Confidence: medium. Based on child decision-making principles and analogous naming UX in games (Pokémon naming, Tamagotchi naming, character creators); no primary testing.

**3. What is the cost/gate (free, coins, limited per day)?**

The existing codebase provides relevant context. The `TraderPuzzle` in the generate flow establishes that knowledge challenges can gate adoption. The broader economy (coins, rarity gate for rare+ breeds) establishes that not everything in the generate flow is free. Name generation currently has no cost.

Evidence from game design research on friction and value perception: small costs attached to secondary choices (not core actions) increase perceived value of the outcome without creating meaningful barriers. However, a coin cost for re-generating names introduces a specific problem: if Harry is near broke and cannot afford a re-generate, the one mechanic that should be frictionless (naming an animal he has already committed to adopting) becomes a wall. This creates frustration at exactly the wrong moment — just before adoption.

Options, ranked by recommended approach:

1. **Free but limited per session (2–3 re-generates):** no coin cost, no barrier, but creates a soft scarcity that increases the perceived value of each set. Counter displayed clearly. Best for this feature's low complexity and low stakes.
2. **Completely free and unlimited:** maximum flexibility, zero friction, but removes any sense of choice consequence. May reduce name consideration if the player simply hammers re-generate.
3. **Small coin cost (5–10 coins) per re-generate:** adds economy engagement but risks frustration at the moment of adoption. Not recommended for this feature.
4. **Daily limit across all generate sessions:** too complex to communicate clearly to a child; confusing if the counter is not visible.

Confidence: medium. Based on game design economics and child friction tolerance; no primary research.

---

## Key user needs

- Harry needs to feel confident in the name he picks. If none of the 3 initial names feel right, he needs a low-friction way to see more options without feeling like he has wasted a re-roll.
- Harry needs any previously seen names he liked to remain accessible after re-generating. Losing a good option to a re-generate will produce regret and potentially re-generate again trying to recover it — a frustrating loop.
- Harry needs re-generating to feel quick and satisfying, not like a separate navigation event or a loading screen. Name generation is synchronous and fast; the interaction should feel instant.
- Harry needs to understand any re-generate limit clearly and in advance. Discovering a limit after it is exhausted ("you have used all your re-generates") will feel like a punishment rather than a feature.

---

## Assumptions being made

- **Assumption:** The desire to re-generate names comes from none of the 3 names feeling suitable, not from a desire to see every possible name. The interaction should be framed as "try again" rather than "see all names".
- **Assumption:** The `generateNames` function has sufficient pool variety that repeated calls will produce meaningfully different results. A quick check of the name pools in `generateOptions.ts` should be done before spec: if the pools are small and heavily overlapping, re-generation will frequently surface the same names, making the feature feel broken.
- **Assumption:** Name history (`useNameHistory`) is not surfaced to the player during this feature. If previously generated names from prior sessions were shown, Harry could select from his own history. This is a richer but more complex direction and should be noted as a future enhancement, not in scope for this feature.
- **Assumption:** The re-generate action happens on the results screen (after the 7-step wizard completes), not during the wizard. If the intent is to add a re-generate button mid-wizard (before the results screen), the scope and interaction design change substantially.

---

## Risks

**Risk 1 — Re-generation reveals thin name pools.**
If `generateNames` is called multiple times in sequence and produces the same names (or names that feel very similar), the feature will feel pointless and may make the underlying generation system feel low-quality. Pool depth should be verified before spec is written. Severity: medium.

**Risk 2 — Replace-all behaviour causes loss-anxiety.**
If re-generating replaces all current names without allowing Harry to preserve a favourite, repeated re-generations become a source of frustration rather than exploration. Severity: medium.

**Risk 3 — Feature is trivially small but spec process overhead is disproportionate.**
This feature is listed in the backlog as low complexity and is a direct response to an observed player frustration (wanting more names). The interaction spec should be lightweight and not over-designed. Risk of over-engineering a simple "show 3 more names" button. Severity: low — but flag to PO that minimal scope should be respected.

**Risk 4 — No visible counter for limits.**
If a re-generate limit is implemented (recommended: 2–3 per session), the remaining count must be visible before the player uses their last re-generate. A hidden limit that surfaces only on exhaustion is a UX failure for any age group. Severity: low-medium.

---

## Recommendation

**Proceed — this is a small, low-risk, player-need-grounded feature.**

The design should be minimal: a single "try different names" button below the name list, available up to 2 free uses per generate session, which adds 3 new names in place of the 3 current names but preserves any name the player has already selected or highlighted. No coin cost. Counter should be visible ("2 tries remaining") from the moment the results screen appears.

Before spec is written, the UX Designer should verify pool depth in `generateOptions.ts` (specifically the `CLASSIC_NAMES_M`, `CLASSIC_NAMES_F`, `BRAVE_NAMES`, `GENTLE_NAMES`, `NATURE_WORDS`, and `DINO_NAMES` arrays) to confirm that three consecutive calls to `generateNames` can reasonably be expected to return distinct results.
