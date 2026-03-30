# UR Findings — Poacher Catching Mechanic

**Feature:** `poacher-catching`
**Researcher:** User Researcher (Phase A)
**Date:** 2026-03-29
**Primary user:** Harry, ~8–10 years old, iPad Pro 11" portrait

---

## Codebase context

The current app has no adversarial or threat-response mechanic. Arcade games are knowledge-based (Coin Rush, Word Safari, Habitat Builder, World Quest) — none involve a physical threat or real-time catch mechanic. The `animals.ts` data model includes `habitatThreats` (an array of string threats for wild animals) and `conservationStatus` (IUCN Red List codes), indicating that the conceptual scaffolding for a conservation-threat narrative is already present in the data layer. The `useProgress` hook manages XP, badges, and skill progression. No event type currently exists for rescue or threat-response actions, though the badge catalogue includes `rescue-first-animal` and `rescue-five-animals` badges tied to `source` field values of `'rescue'` or `'generate'` in `db.savedNames`. The backlog lists this feature as depending on `animal-economy-tiers`.

---

## Research questions addressed

**1. Does a "catching poachers" mechanic match the conservation theme or feel violent/inappropriate for the age group?**

This is the highest-stakes question and requires careful analysis. The age group (8–10) is generally considered ready for conflict-and-consequence narratives, including situations where bad actors are stopped. Analogous products that have successfully framed similar mechanics for this age group include:

- Ranger games (e.g., Wildlife Rangers apps): poachers exist as antagonists who must be stopped through non-violent actions (planting cameras, filing reports, alerting rangers).
- Educational conservation games: players intercept threats by solving puzzles or completing tasks before the poacher/threat reaches the animal.
- Adventure games for this age (Pokémon, etc.): antagonists are stopped through skill challenges; no depiction of physical violence.

The critical distinction is between "catching" (as in intercepting, outsmarting, alerting authorities) and "fighting" (physical confrontation, harm). The former is entirely appropriate for this age group and conservation-themed. The latter is inappropriate and outside the emotional register of this app.

The brief mentions "a visual clip/animation of a rescue or arrest". An arrest animation is appropriate if the framing is: the poacher is apprehended by rangers/authorities, not by the child directly. The child's role should be detective/protector, not vigilante. This is consistent with how real conservation organisations (WWF, RSPCA) communicate anti-poaching for children.

Confidence: medium-high. Well-supported by analogous product analysis and age-appropriateness literature for 8–10 year olds; no direct primary research with Harry.

**2. What input pattern works for iPad touch? (tap, swipe, puzzle, timing)**

The primary device is iPad Pro 11" in portrait mode, CSS width approximately 820px. The existing arcade games use tap-to-select as the primary input (Coin Rush is floating targets; Word Safari is word selection; Habitat Builder is drag-and-drop). Harry's usage pattern in the existing arcade games provides implicit evidence that:

- Tap is the lowest-friction input and is used across all existing mini-games.
- Timed tap challenges (tap the target before it disappears) are established as familiar from Coin Rush.
- Puzzle-pattern inputs (solving a knowledge question to unlock an action) are established from all four arcade games.
- Swipe is currently unused in the game — introducing it as a new gesture requires explanation and is higher friction.

For a conservation-appropriate poacher-catching mechanic, the following patterns are ranked by fit:

1. **Timed tap or tap-to-spot** — tap on evidence, movement, or the poacher within a time window. Simple, familiar, appropriate.
2. **Puzzle gate** — answer a conservation knowledge question to "unlock" the ranger response. Connects the mechanic to the educational strand.
3. **Drag-and-drop** — place camera traps or evidence markers. More complex but has precedent from Habitat Builder.
4. **Swipe chase** — not recommended; new gesture, higher error rate on iPad, and framing of "chasing" risks physical-confrontation framing.

Confidence: medium. Based on existing in-app interaction patterns; no usability testing on the specific mechanic.

**3. Should rewards be permanent animals or consumable items?**

The `animal-economy-tiers` feature establishes that wildlife animals should be reward-only (not tradeable). The poacher-catching mechanic is the primary proposed delivery mechanism for those rewards. This means: yes, rewards should include permanent animals (specifically, rescued wild animals added to the collection with individual names and backstories). This is consistent with the existing `source: 'rescue'` field in `db.savedNames` and the rescue-themed badges already defined in the badge catalogue.

Consumable items (coins, care supplies, cosmetics) are appropriate as secondary rewards — they maintain engagement between major animal rewards and lower the stakes of any individual poacher event. A tiered reward structure — coins every time, special items occasionally, new animal rarely — is consistent with how the existing rarity and drop-rate system works in marketplace offers.

Permanent animals must be conservation-category (Wild, Sea, Lost World) and non-tradeable under the `animal-economy-tiers` model. This creates a clear and coherent reward hierarchy: tradeable domestic animals come from the marketplace; rescue-only wild animals come from conservation actions.

Confidence: high. Directly consistent with codebase model and the linked `animal-economy-tiers` feature.

**4. How often should poacher events appear to maintain engagement without fatigue?**

Research on event frequency in children's games (Przybylski, Rigby, and Ryan; self-determination theory in games) suggests that variable-ratio reinforcement schedules (rewards at unpredictable intervals) are most motivating but also most potentially habit-forming. For a children's educational app, a predictable-but-not-constant schedule is preferable.

Evidence from comparable conservation games and Tamagotchi-adjacent apps suggests:
- 1–2 poacher events per day creates anticipation without dominating play.
- Events should not expire within a single session — a child who cannot check the app daily should not miss out entirely. 48-hour event windows are more inclusive than 24-hour.
- Events should have a clear notification signal (a badge or in-app indicator) so the child knows when one is active. Without a signal, events become invisible.
- If events appear too rarely (less than 3 per week), they will be forgotten between occurrences and lose narrative momentum.

Confidence: low-medium. Based on analogous product analysis; no empirical data from Harry's actual session frequency.

---

## Key user needs

- Harry needs the mechanic to feel like a detective or ranger action, not a fight. The framing must centre protection and cleverness, not confrontation.
- Harry needs the outcome to feel meaningful — a named animal visibly rescued, not an abstract counter incremented.
- Harry needs poacher events to be discoverable at the right moment — not so frequent they feel like chores, not so rare they feel forgotten.
- Harry needs the reward to be appropriate to the effort — if the mechanic requires skill or time, the animal or coins received must reflect that.
- Harry needs the mechanic to connect to what he already knows about conservation through the existing `habitatThreats` and `conservationStatus` data — the app has already established that wild animals face real threats. The poacher mechanic should feel like a continuation of that established world.

---

## Assumptions being made

- **Assumption:** The poacher-catching mechanic is intended for the Wild/Sea/Lost World animal categories. If it extends to domestic animals (someone stealing pets), the framing and reward logic change substantially. Clarify scope.
- **Assumption:** "Arrest" in the animation means rangers/authorities apprehend the poacher, not that Harry's character does so physically. This framing must be confirmed as a design constraint — it is not a stylistic choice but an age-appropriateness requirement.
- **Assumption:** Events are triggered by the system on a schedule, not by player-initiated actions. If events must be triggered by the player (e.g., "go on patrol"), the session frequency question becomes a player agency question and the design is substantially different.
- **Assumption:** The mechanic is a mini-game or mini-challenge, not a standalone screen. The backlog lists this as a high-complexity feature; scope boundaries need to be defined in spec.
- **Assumption:** The `source: 'rescue'` field already present in `db.savedNames` is the intended destination for rescued animals. Confirm this is the canonical source value for poacher-rescue animals and that badge eligibility is correctly wired.

---

## Risks

**Risk 1 — Violent or frightening framing.**
A poacher-catching animation that depicts physical confrontation, weapons, or a visibly distressed animal could be disturbing for some children in this age group. The framing must be "clever interception leads to safe rescue" rather than "confrontation and defeat". Severity: high.

**Risk 2 — Mechanic isolated from educational content.**
If catching poachers is purely an action mini-game with no connection to the animal's conservation status or real-world threats (already in `habitatThreats` data), a significant educational opportunity is missed and the mechanic becomes just another arcade game. The spec should require integration with existing conservation data. Severity: medium.

**Risk 3 — Fatigue if events appear too frequently or feel repetitive.**
Without variety in the event format (different animal species, different scenarios, different challenge types), repeated poacher events will feel like a grind. A minimum of 3–4 distinct scenario templates is recommended to avoid sameness. Severity: medium.

**Risk 4 — Feature depends on `animal-economy-tiers` being resolved first.**
The reward output (non-tradeable rescued animal) is only meaningful if the category-based trading restriction exists. Building the poacher mechanic before `animal-economy-tiers` is specced and approved means the reward logic may need to be reworked. The backlog correctly lists this dependency. Severity: medium.

**Risk 5 — Session frequency assumptions are wrong for Harry's actual play pattern.**
If Harry plays in long infrequent sessions (e.g., weekends only) rather than short daily sessions, the recommended 1–2 events per day will produce a backlog of events that feel overwhelming. Session frequency data for Harry's actual usage is not available. A catch-up mechanism or event queue cap should be considered. Severity: low-medium.

---

## Recommendation

**Proceed with modifications.**

The mechanic is appropriate for the age group when correctly framed. The core design constraints that must be written into the interaction spec are:

1. The player's role is ranger/detective — interception through cleverness, never physical confrontation.
2. The arrest/rescue animation must show rangers or authorities as the agents of resolution, not Harry's avatar.
3. Reward structure must include a named, backstory-bearing rescued animal as the primary reward for meaningful events, consistent with the `animal-economy-tiers` model.
4. At least three distinct scenario templates must be designed to prevent repetition fatigue.
5. This feature must not enter Phase C before `animal-economy-tiers` has Phase B approval, consistent with the backlog dependency.
