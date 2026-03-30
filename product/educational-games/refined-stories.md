# Educational Games — Refined User Stories

> Feature: educational-games
> Author: Product Owner
> Status: Phase B complete — awaiting Owner approval before Phase C
> Last updated: 2026-03-29
> Depends on: interaction-spec.md (Phase A, UX), ur-findings.md (Phase A, UR)

---

## Owner decisions reflected in these stories

These stories incorporate the following confirmed Owner decisions. They are not
open for re-discussion in Phase C without Owner sign-off.

| Decision | Resolution |
|----------|-----------|
| Card type | `CollectedCard` in DB (not `SavedName` / named pets) |
| Stat persistence | Stats (speed/strength/stamina/agility/intelligence) are written to DB on correct answer |
| Year level framing | "Getting started" / "Going further" / "Expert mode" — never "Year 1-2" in Harry's UI |
| Initial year level | "Getting started" is the default on first play of each game |
| Auto-progression trigger | 80% accuracy over 3 consecutive sessions at current level advances to the next level |
| All 4 games | Launch in parallel — all 4 built in Phase C simultaneously |
| Card selection | Precedes every game session — Harry picks which card to play with |
| World Map navigation | Third tab inside CardsScreen: Packs | Collection | Map |
| Question source | Template-based using `card-catalogue-200.json` as data source |
| Cross-game vocabulary | Out of scope for Phase 1 |
| Educational badges | Existing arcade badges are sufficient for Phase 1 |

---

## Dependency chain

Story 1 (DB schema) must be complete before any other story can begin Phase C.
Stories 2, 3, 4, 5, 6 (game session content) all depend on Story 1 and Story 2
(card picker). Stories 7, 8, 9, 10 depend on Stories 1 and 2. No story should enter
Phase C until Story 1 is merged and the Dexie version bump is deployed.

```
Story 1: DB schema extension
  └── Story 2: Card picker (shared)
        ├── Story 3: Coin Rush questions
        ├── Story 4: Word Safari questions
        ├── Story 5: Habitat Builder questions
        ├── Story 6: World Quest questions
        ├── Story 7: Card level and XP progression
        ├── Story 8: Year level auto-progression
        └── Story 9: World Map tab
  └── Story 10: Card detail sheet — progression view
        (depends on Story 1 only; can run in parallel with Story 2)
```

---

## Story 1: DB schema extension for card progression

```
As a developer,
I need the CollectedCard DB record extended with progression and catalogue fields,
So that all four educational games can read and write card-specific data without
schema gaps or null-safety workarounds.
```

### Acceptance criteria

- [ ] `CollectedCard` TypeScript interface is extended with all fields listed in the
      "New fields" section below. No existing field is removed or renamed.
- [ ] DB version is incremented to v17. The migration upgrade callback backfills
      safe default values for every existing `collectedCards` row so no existing
      data is lost.
- [ ] `level` defaults to `1` on all existing rows.
- [ ] `xp` defaults to `0` on all existing rows.
- [ ] `yearLevel` defaults to `1` (Getting started) on all existing rows.
- [ ] `gameHistory` defaults to
      `{ wordSafari: 0, coinRush: 0, habitatBuilder: 0, worldQuest: 0 }` on all
      existing rows.
- [ ] Catalogue fields (`coordinates`, `biome`, `region`, `conservationStatus`,
      `countries`, `worldQuestMigrates`, `wordSafariVocab`, `coinRushFacts`,
      `habitatBuilderRole`, `habitatBuilderPrey`, `habitatBuilderPredators`,
      `worldQuestRegion`) are stored as optional (`?`) and null-safe on all
      existing rows (no backfill required — these fields are populated at card
      acquisition time, not retroactively).
- [ ] A utility function `enrichCardFromCatalogue(card: CollectedCard): CollectedCard`
      is added to `src/lib/cardCatalogue.ts`. It accepts a CollectedCard, looks up
      the matching entry in `card-catalogue-200.json` by `[animalType, breed]`, and
      returns the card with catalogue fields merged in. If no match is found, the
      card is returned unchanged.
- [ ] `card-catalogue-200.json` is imported at `/Users/phillm/Dev/Animalkingdom/src/data/card_catalogue_200.json`
      (copied into `src/data/` alongside the existing `animal_encyclopedia.json`
      pattern — no runtime fetch, no external API).
- [ ] All new DB writes that award XP or update stats wrap `db.collectedCards.update()`
      inside a `db.transaction('rw', ...)` — build defect if violated per CLAUDE.md.
- [ ] TypeScript compiles with no new errors introduced by the schema change.
- [ ] Tester can open the app, open a fresh card, and confirm it has `level: 1`,
      `xp: 0`, `yearLevel: 1`, `gameHistory.coinRush: 0` in the Dexie DevTools panel.

### New fields added to `CollectedCard`

```typescript
// Progression fields — persisted, updated by game hooks
level: number           // 1–10, starts at 1
xp: number              // cumulative XP within current level
yearLevel: 1 | 2 | 3   // 1 = Getting started, 2 = Going further, 3 = Expert mode
gameHistory: {
  wordSafari: number    // sessions played with this card in Word Safari
  coinRush: number      // sessions played with this card in Coin Rush
  habitatBuilder: number
  worldQuest: number
}

// Catalogue fields — populated on card acquisition, read-only in game hooks
coordinates?: { lat: number; lng: number }
biome?: string
region?: string
conservationStatus?: string
countries?: string[]
worldQuestMigrates?: boolean
wordSafariVocab?: string[]
coinRushFacts?: Record<string, number>
habitatBuilderRole?: 'carnivore' | 'herbivore' | 'omnivore'
habitatBuilderPrey?: string[]
habitatBuilderPredators?: string[]
worldQuestRegion?: string
```

### Out of scope

- Migration of `SavedName` records (named pets use a separate type and are not
  affected by this story).
- Populating catalogue fields retroactively on cards already in the DB. Catalogue
  fields are populated at card acquisition time (when packs are opened).
- Any game UI — this story is data layer only.

---

## Story 2: Card selection picker (shared across all 4 games)

```
As Harry,
I need to choose which of my cards to play with before a game session begins,
So that my card grows stronger from that session and the questions feel personal
to that specific animal.
```

### Acceptance criteria

- [ ] Tapping any GameCard in the Play hub (Coin Rush, Word Safari, Habitat Builder,
      World Quest) opens a BottomSheet card picker — it does NOT navigate directly
      to the game route.
- [ ] The card picker BottomSheet renders via `createPortal(content, document.body)`
      per CLAUDE.md portal rule. It is NOT rendered inside the Framer Motion
      animated parent of PlayHubScreen.
- [ ] The sheet displays Harry's collected cards (`collectedCards` table) in a
      grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pb-4`.
- [ ] Each tile shows: animal image (aspect-square, rounded-xl), card name (13px/600
      --t1, truncate), RarityBadge (tint-pair per DS), and a per-game level pill
      ("Lv 3" in game accent tint-pair; "New" in neutral `--t3`/`--border-s` if
      never played with this card in this game).
- [ ] A filter row above the grid contains: category pills (All, Mammal, Bird,
      Reptile, Fish, Amphibian) left-aligned using the CategoryPills tint-pair
      pattern; and a sort control (`ml-auto shrink-0`) with options "Name A–Z",
      "Recently used", "Highest level". This is a single shared row — not two rows.
- [ ] The most recently played card for this specific game is shown first, with a
      hairline label `"Last used"` in `11px/700 uppercase tracking-widest --t3`.
- [ ] Selecting a tile shows a selection indicator: border changes to
      `border-[var(--blue)]`, background gains `bg-[var(--blue-sub)]`, a `Check`
      icon (Lucide, 16px, `--blue-t`) appears in a 20px filled blue circle at the
      top-right of the image. This selection state is exempt from the tint-pair badge
      rule (it is a selection marker, not a content badge).
- [ ] On first play of each game, after card selection, Panel B (challenge level
      selector) slides in from below (`y: 16px → 0`, 200ms ease-out). On all
      subsequent plays, Panel B is skipped.
- [ ] The challenge level selector shows three stacked selectable rows: "Getting
      started", "Going further", "Expert mode". Labels and captions match the
      interaction spec section 4 exactly. The words "Year", "curriculum", or any
      school-year reference do not appear anywhere in this UI.
- [ ] "Getting started" is pre-selected on first play.
- [ ] A "Play" primary button at the bottom of the sheet is enabled only when a card
      is selected (and challenge level is confirmed on first play). The button is
      disabled (opacity-40, not interactive) with no card selected.
- [ ] Tapping "Play" navigates to the game route, passing `collectedCardId` and
      `challengeLevel` as navigation state (not query params).
- [ ] Empty state (no collected cards): shows CreditCard icon (48px, --t3), copy
      "You need a card to play" (17px/600 --t1), "Open a pack in the Collection tab
      to get your first card." (14px/400 --t2), and a "Go to Collection" accent
      button that closes the sheet and navigates to `/cards`. Filter row is hidden.
- [ ] Sheet close button (X, 32px circle, --elev) dismisses the sheet and returns
      focus to the GameCard that triggered it.
- [ ] Layout verified at 375px, 820px (iPad portrait), and 1024px (iPad landscape).
- [ ] No `ghost` variant used anywhere in this component. No hardcoded hex colours.

### Out of scope

- Saving the last-used challenge level silently for subsequent plays is covered by
  Story 8 (year level auto-progression), not this story. For MVP, the challenge
  level selector always appears on first play and is then remembered per-game.
- Parent settings route for challenge level adjustment.

---

## Story 3: Card-specific game questions — Coin Rush

```
As Harry,
I need Coin Rush questions to use my selected card's actual numbers,
So that the maths feels like it belongs to my specific card and the correct
answer increases that card's Speed stat.
```

### Acceptance criteria

- [ ] Coin Rush is a full-screen route at `/play/coin-rush`. The `ArcadeShell`
      component is NOT used. A bespoke session shell matching the interaction spec
      section 5 is built.
- [ ] The session shell includes: glass session header (portal-rendered, z-1100+),
      question area (scrollable, pt-[72px] to clear header), and XP progress strip
      (glass, fixed at bottom, 40px height). BottomNav is suppressed on this route.
- [ ] Questions are generated from the selected `CollectedCard`'s `coinRushFacts`
      field (populated from `card-catalogue-200.json`). If `coinRushFacts` is absent
      for a card, questions fall back to generic number bonds using the card's stat
      values (speed, strength, etc.) as operands.
- [ ] Getting started (yearLevel 1) sessions serve: subitising (dot array, Variant A),
      number line counting on/back (Variant C), and simple addition/subtraction using
      card stats. Question types rotate — no two consecutive questions share the same
      variant.
- [ ] Going further (yearLevel 2) sessions serve: bar model fractions (Variant B) and
      missing number equations (Variant D). No subitising.
- [ ] Expert mode (yearLevel 3) sessions serve: Variant D equations and Variant E
      fraction circles. Higher operand values derived from card stats.
- [ ] A session is 10 questions. Progress shown in the session header right slot as
      "Q 3 / 10".
- [ ] Correct answer: selected option transitions to green tint-pair
      (`bg-[var(--green-sub)] border-[var(--green)]` + Check icon 16px `--green-t`).
      A `"+1 Speed"` badge animates from the card thumbnail (portal-rendered, z-1150,
      300ms ease-out, fades at 1200ms). After 800ms the next question auto-advances.
      Speed stat on the `CollectedCard` is incremented by 1 in the DB.
- [ ] Incorrect answer: selected option pulses red tint-pair (`--red-sub` /
      `--red`) for 400ms then returns to default. Hint strip appears below the
      options (Lightbulb icon 16px `--amber-t`, "Try that one again" 13px/600 --t2,
      hint text 13px/400 --t3). No "Wrong" copy, no negative message.
- [ ] After a second wrong attempt, a "Skip this one" link (11px/600 --t3
      underline) appears. Skipping advances to the next question with no XP gain
      and no negative feedback. The skipped question does not count in the "Challenges
      answered" session summary.
- [ ] Streak counter is NOT displayed during the session. It may appear in the
      post-session summary only.
- [ ] XP is awarded: 10 XP per correct answer, 0 XP per skip. `CollectedCard.xp`
      is incremented accordingly. `SkillProgress` for `area: 'maths'` also receives
      the XP via the existing `addXp` call in `useProgress`.
- [ ] On session complete, `CollectedCard.gameHistory.coinRush` is incremented by 1.
- [ ] Quit confirmation banner (section 6 of interaction spec) is implemented. Back
      gesture and X button both trigger the banner. Session does not exit without
      confirmation. XP earned up to the exit point is still awarded on "Leave".
- [ ] Session complete overlay (portal, z-1200) shows: card image (w-24 h-24), card
      name, RarityBadge, XP gained (green tint-pair), coins earned (amber tint-pair),
      Speed stat increase (green tint-pair), XP bar progress, "Challenges: X / Y",
      "Play again" (primary), "Change card" (outline), "Back to games" (plain text
      link, not ghost variant). Confetti burst fires via portal per Framer Motion
      rule 3 particle spec.
- [ ] No audio output at any point in the session.
- [ ] No time pressure elements visible to Harry.
- [ ] Layout verified at 375px, 820px, and 1024px. At 1024px the question column is
      `max-w-2xl mx-auto`.
- [ ] All DS checklist items (10-point) pass at Tester Phase D.

### Out of scope

- Year-level auto-advancement (Story 8).
- Level-up rarity promotion (Story 7).
- "Speed mode" timer for Expert mode (parental setting, out of Phase 1 scope).

---

## Story 4: Card-specific game questions — Word Safari

```
As Harry,
I need Word Safari questions to use vocabulary specific to my selected card's
species,
So that the English challenges feel like they belong to that animal and the
correct answers increase my card's Intelligence stat.
```

### Acceptance criteria

- [ ] Word Safari is a full-screen route at `/play/word-safari`. Same bespoke session
      shell as Story 3 (shared component). BottomNav suppressed.
- [ ] Questions are generated from the selected `CollectedCard`'s `wordSafariVocab`
      field (populated from `card-catalogue-200.json`). If `wordSafariVocab` is absent
      or contains fewer than 3 terms, the session falls back to the card's
      `description` and `ability` fields for context, and generic phonics prompts for
      the vocabulary.
- [ ] Getting started (yearLevel 1) sessions serve: multiple choice word questions
      (Variant A), spelling input using letter tiles (Variant B), and rhyme recognition
      yes/no (Variant D). No drag-and-build morphology.
- [ ] Going further (yearLevel 2) sessions serve: multiple choice (Variant A) and
      drag-and-build morphology (Variant C). Variant D is not used at this level.
- [ ] Expert mode (yearLevel 3) serves: Variant A with longer/more complex terms and
      Variant C with advanced affixes. Subject vocabulary from the card's species
      description is used as distractor material.
- [ ] Spelling input (Variant B) uses a tap-to-fill letter tile interface. No native
      keyboard is triggered. `letter-spacing: 0.1em` is applied inside filled slots
      (dyslexia-friendly). Delete and Submit buttons are present.
- [ ] Drag-and-build (Variant C) degrades to a tap-to-select interface on phone (no
      drag required on touch without a mouse).
- [ ] Correct answer: Intelligence stat on the `CollectedCard` incremented by 1 in DB.
      `"+1 Intelligence"` badge animation fires (same portal pattern as Story 3).
- [ ] No consecutive question variants of the same type in a single session.
- [ ] Incorrect answer handling: same hint strip, 2-attempt limit, "Skip this one"
      link, no "Wrong" copy — identical to Story 3 pattern.
- [ ] Streak counter hidden during session. Post-session summary only.
- [ ] On session complete, `CollectedCard.gameHistory.wordSafari` incremented by 1.
      `SkillProgress` for `area: 'spelling'` receives XP.
- [ ] No audio at any point. Phoneme / rhyme tasks are visual-only.
- [ ] Layout verified at 375px, 820px, and 1024px.
- [ ] All DS 10-point checklist items pass at Phase D.

### Curricular accuracy gate

Before Phase D sign-off, the Tester must verify that at least 5 Getting started
questions and 5 Going further questions map to a named UK National Curriculum English
learning objective. The Tester records the objective reference alongside each sampled
question in `tests/educational-games/test-results.md`. Sessions with questions that
cannot be mapped are a defect.

### Out of scope

- Cross-game vocabulary reinforcement (Phase 2).
- Year-level auto-advancement (Story 8).

---

## Story 5: Card-specific game questions — Habitat Builder

```
As Harry,
I need the Habitat Builder simulation to use my selected card's actual role in
the food chain and its natural biome,
So that the decisions I make feel true to that animal and the correct choices
increase my card's Stamina and Strength stats.
```

### Acceptance criteria

- [ ] Habitat Builder is a full-screen route at `/play/habitat-builder`. Same bespoke
      session shell as Stories 3 and 4. BottomNav suppressed.
- [ ] A session is a 5-day simulation cycle. Each "day" presents a decision panel with
      three options. The simulation uses: `CollectedCard.habitatBuilderRole`,
      `habitatBuilderPrey`, `habitatBuilderPredators`, and `biome` to determine which
      decisions are offered and which outcomes are correct.
- [ ] Three resource bars are maintained across the 5 days: Stamina (green), Food
      (amber), Shelter (blue). Each bar starts at 60 out of 100. Correct decisions
      increase the relevant bar; incorrect decisions decrease it by a moderate amount
      (not catastrophic — see UR finding Risk C).
- [ ] Bar fill transitions animate at `600ms ease-out` after each decision.
- [ ] When any bar drops below 25%, the bar fill transitions to `var(--red)`. No other
      distress signal fires — no alarm copy, no negative message. The bar colour change
      is a visual cue only.
- [ ] There is NO "card condition decrease" mechanic and NO "animal in danger" message.
      UR Risk C identified this as a high-distress risk for Harry. The simulation
      outcome is framed as "your animal survived well" vs "your animal could have
      done even better" — never as failure or harm to the card.
- [ ] Getting started (yearLevel 1): decisions map to UK Science Year 1-2 content
      — basic needs, food vs non-food sources, simple habitat matching for the
      selected card's biome.
- [ ] Going further (yearLevel 2): decisions map to Year 3-4 — food web relationships,
      predator avoidance, adaptation to the specific biome.
- [ ] Expert mode (yearLevel 3): decisions map to Year 5-6 — energy transfer, natural
      selection pressures, conservation impact choices.
- [ ] Correct decision: decision row transitions to green tint-pair, bars update.
      Stamina or Strength on the `CollectedCard` is incremented by 1 in DB depending
      on which resource was primarily affected. `"+1 Stamina"` or `"+1 Strength"`
      badge animation fires.
- [ ] iPad layout: two-panel (habitat view left 50%, decision panel right 50%) per
      interaction spec section 9c. Phone layout: habitat view above (max-h-[200px]),
      decision panel stacked below.
- [ ] Day progress indicator shows `"Day 3 of 5"` (11px/700 uppercase tracking-widest
      --t3) and a 5-dot progress row.
- [ ] At Day 5 end, session complete overlay fires with final bar values shown in the
      summary alongside standard XP and coin rewards.
- [ ] A "Save and come back" option is available from the quit confirmation banner.
      Incomplete simulation state (current day, bar values) is saved to
      `CollectedCard.gameHistory` as a `habitatBuilderInProgress` sub-object. On next
      session start, the card picker detects in-progress state and offers "Continue
      where you left off" as a card selection label. This addresses UR Risk 4b.
- [ ] Session length is capped at approximately 15 minutes (5 days × ~3 minutes).
      Day count is sufficient to keep the session within this window.
- [ ] On session complete, `CollectedCard.gameHistory.habitatBuilder` incremented.
      `SkillProgress` for `area: 'science'` receives XP.
- [ ] Layout verified at 375px, 820px, and 1024px.
- [ ] All DS 10-point checklist items pass at Phase D.

### Curricular accuracy gate

Same as Story 4 — Tester must map at least 5 sampled decisions per year level to
named UK National Curriculum Science learning objectives before Phase D closes.

### Out of scope

- Year-level auto-advancement (Story 8).
- "Card condition" visual degradation mechanic — explicitly excluded by UR Risk C.

---

## Story 6: Card-specific game questions — World Quest

```
As Harry,
I need World Quest map questions to use my selected card's actual home region
and geographic data,
So that discovering where my card comes from feels like a real exploration and
the correct answers increase my card's Intelligence and Agility stats.
```

### Acceptance criteria

- [ ] World Quest is a full-screen route at `/play/world-quest`. Same bespoke session
      shell as Stories 3–5. BottomNav suppressed.
- [ ] The map is a custom SVG element — NOT a third-party map library. SVG map data
      covers UK for Getting started, UK + Europe for Going further, and world for
      Expert mode. The SVG is bundled at build time.
- [ ] Questions are generated from: `CollectedCard.worldQuestRegion`,
      `CollectedCard.countries`, `CollectedCard.coordinates`,
      `CollectedCard.worldQuestMigrates`, and `CollectedCard.conservationStatus`.
      If `worldQuestRegion` is absent, the session falls back to generic UK map
      questions (Getting started level).
- [ ] Getting started (yearLevel 1): UK map only. Tap-to-identify UK countries/
      regions. Simple N/S/E/W compass direction MCQ. Season/weather MCQ for the
      card's UK region.
- [ ] Going further (yearLevel 2): UK + Europe map. Compass point and grid reference
      questions. Habitat zone MCQ (biome matching using card's `biome` field).
- [ ] Expert mode (yearLevel 3): World map. Latitude/longitude MCQ. Migration route
      question if `worldQuestMigrates` is true for the selected card.
- [ ] Map colour tokens exactly match the interaction spec section 9d: background
      `#0D0D11`, country fills `#23262F`, borders `#353945`, highlighted country
      `var(--purple-sub)` + `1px stroke var(--purple)`, active answer target
      `var(--blue-sub)` + `1px stroke var(--blue)`. No deviation from these values.
- [ ] Compass rose (static SVG, w-12 h-12, `--t3`) is visible at bottom-right of the
      map panel at all challenge levels.
- [ ] "Discovered" countries accumulate visually across sessions. On correct tap, the
      country retains a `var(--purple-sub)` fill state. Discovered countries are
      stored as `discoveredCountries: string[]` appended to the `SkillProgress` record
      for `area: 'geography'`. This requires the `SkillProgress` interface to be
      extended with an optional `discoveredCountries?: string[]` field (handled in
      Story 1 schema planning — Developer to confirm whether this is a Story 1 addition
      or a Story 6 schema addition; it must be documented before Phase C begins).
- [ ] Tap-to-answer map: correct country fills green tint-pair (400ms transition).
      Incorrect fills red-sub for 400ms then returns to default. Hint strip fires as
      per the shared pattern.
- [ ] Correct answer: Intelligence and Agility both incremented by 1 in DB.
      `"+1 Intelligence"` and `"+1 Agility"` badges fire sequentially (200ms apart).
- [ ] iPad layout: two-panel (map left 65%, question right 35%) per interaction spec
      section 9d. Phone layout: map fills full width at `aspect-[4/3]`, question
      panel below.
- [ ] On session complete, `CollectedCard.gameHistory.worldQuest` incremented.
      `SkillProgress` for `area: 'geography'` receives XP.
- [ ] Layout verified at 375px, 820px, and 1024px.
- [ ] All DS 10-point checklist items pass at Phase D.

### Curricular accuracy gate

Tester must map at least 5 sampled questions per year level to named UK National
Curriculum Geography learning objectives before Phase D closes.

### Out of scope

- Third-party map API (Mapbox, Google Maps, Leaflet). SVG only in Phase 1.
- Migration route visualisation (Phase 2 — requires animated polyline on SVG).
- World Map tab in CardsScreen (that is Story 9, a separate story).

---

## Story 7: Card level and XP progression

```
As Harry,
I need my card to level up as I play more sessions with it,
So that I can see it growing stronger over time and have a reason to keep
playing with the same card.
```

### Acceptance criteria

- [ ] `CollectedCard.xp` accumulates across all game sessions played with that card.
      10 XP per correct answer is the baseline rate (all games).
- [ ] XP thresholds for each level (1–10) are defined in a constant in
      `src/lib/cardProgression.ts`. Suggested thresholds (Developer to confirm with
      UX spec): Lv 1→2: 50 XP, Lv 2→3: 100 XP, Lv 3→4: 150 XP, Lv 4→5: 200 XP,
      Lv 5→6: 250 XP, Lv 6→7: 300 XP, Lv 7→8: 350 XP, Lv 8→9: 400 XP, Lv 9→10: 450 XP.
      These are the proposed defaults — Owner must confirm or adjust before Phase C.
- [ ] When `xp` reaches the threshold for the next level, `level` is incremented and
      `xp` resets to 0 (excess XP above the threshold carries over). This write must
      be inside the same `db.transaction('rw', ...)` as the XP increment. No
      split-transaction pattern.
- [ ] At level 4, the card's `rarity` is upgraded one tier:
      common → uncommon → rare → epic → legendary. Legendary cards do not upgrade
      further.
- [ ] At level 7, the card's `rarity` is upgraded one further tier.
- [ ] Rarity promotion is also inside the same DB transaction as the level-up write.
- [ ] When a level-up occurs during a session, the session complete overlay shows the
      level-up celebration: a larger confetti burst (Framer Motion particle rule 3
      applies), the text `"[Card name] levelled up! Level 3 → 4"` in 20px/700 --t1
      above the rewards, and the new RarityBadge if rarity was promoted.
- [ ] If a rarity promotion occurred, the session complete overlay shows the new
      RarityBadge with a brief scale entrance (300ms) next to the level-up text.
- [ ] The XP progress strip in the session header shows the selected card's XP bar
      filling toward the next level threshold in real time. Label: "X XP to next
      level" (11px/600 --t3). The bar uses the game's accent colour as fill.
- [ ] `CollectionGrid` card tiles show a level pill in the top-right corner of the
      image: "Lv 5" (10px/700). Level 1–3: neutral tint (`--t3` text, `--elev` bg,
      `--border-s` border). Level 4–6: green tint-pair. Level 7–10: amber tint-pair.
      No solid fills on level indicators.
- [ ] `checkBadgeEligibility()` is called after each level-up in case game-related
      badges are triggered. This must not be stubbed as an empty return.
- [ ] Layout and animation verified at 375px, 820px, and 1024px.

### Out of scope

- Cosmetic variants unlocked at specific levels (Phase 3).
- Card "evolution" visual transforms (Phase 3).

---

## Story 8: Year level auto-progression

```
As Harry,
I need the challenge level to increase automatically when I am consistently
answering challenges correctly,
So that the game stays interesting without anyone having to change a setting
or tell me it is getting harder.
```

### Acceptance criteria

- [ ] Year level progression is tracked per game per card. It is stored in
      `CollectedCard.yearLevel` and applies to all four games for that card.
      (Rationale: a card's competency level is shared — Harry's knowledge of the
      Beagle grows through all four games, not independently per game.)
- [ ] After each session, accuracy is calculated as: correct answers ÷ total
      questions attempted (excluding skipped questions from the denominator — skips
      are neutral, not wrong).
- [ ] The progression trigger is: 3 consecutive sessions at ≥80% accuracy on the
      current year level. "Consecutive" means the last 3 recorded sessions for
      this card across any game.
- [ ] Session accuracy records are stored in the DB. A new table `gameSessionLog`
      (or equivalent structure within `CollectedCard.gameHistory`) records per-session:
      cardId, game, yearLevel, correct, attempted, accuracy, playedAt. The Developer
      must decide at Phase C whether this is a separate Dexie table or a JSON field
      on CollectedCard — either is acceptable if the trigger logic can be computed
      without a full-table scan. This decision must be documented in the Developer
      brief before Phase C begins.
- [ ] When the trigger fires, `CollectedCard.yearLevel` is incremented (1 → 2 → 3).
      Maximum is 3. No further increment beyond 3.
- [ ] The advancement is completely invisible to Harry during the session. No message,
      no indicator change, no difficulty label.
- [ ] On the NEXT session start (not mid-session), the new year level is silently
      used. Questions served are from the new level without any announcement.
- [ ] The card picker sheet shows the current challenge level silently as part of the
      level pill (the level pill reflects game-specific sessions, not year level — do
      not surface year level in the picker at all).
- [ ] In Settings → Learning (parent-facing, out of Harry's direct view), the parent
      can see and manually override the year level for each card. This UI is out of
      scope for Phase 1 but the data model must support it (which it does via the
      `yearLevel` field on `CollectedCard`).
- [ ] Year level does NOT decrease on poor performance. It only advances. A child
      experiencing a difficult session does not regress. Calibration direction is
      upward-only (addresses UR Risk 5c).
- [ ] Tester can verify by playing 3 mock sessions at ≥80% accuracy and confirming
      `CollectedCard.yearLevel` increments in Dexie DevTools on the 3rd session
      complete. A second confirmation: playing 3 sessions at <80% confirms year level
      does NOT increment.

### Out of scope

- Year level decrement on poor performance (explicitly excluded by UR Risk 5c).
- Sub-topic tracking within a year level (Phase 2 — the spec acknowledges this
  complexity but it is not needed for Phase 1 calibration).
- Parent-visible accuracy statistics screen (Settings → Learning — Phase 2).

---

## Story 9: World Map tab in CardsScreen

```
As Harry,
I need to see all 200 animals on a world map inside my Collection tab,
So that I can discover where my cards come from and see which parts of the
world I have not yet explored.
```

### Acceptance criteria

- [ ] CardsScreen's PageHeader centre slot is updated from a 2-item segmented control
      (Packs | Collection) to a 3-item control (Packs | Collection | Map). The
      control remains `inline-flex` and compact — not full-width.
- [ ] The Map tab is a new `WorldMapView` component rendered inside CardsScreen's
      existing tab system. It receives `activeTab` as a prop — it does not render its
      own navigation control.
- [ ] The World Map uses a custom SVG world map. NOT a third-party map library.
      The same SVG used in World Quest (Story 6) may be reused or extended.
- [ ] Map markers are rendered for all 200 cards in `card-catalogue-200.json` using
      their `coordinates.lat` and `coordinates.lng` values.
- [ ] Four marker types are implemented per the interaction spec section 16:
      - Collected card: `var(--green-sub)` fill + `var(--green)` border + animal
        thumbnail inside the marker circle.
      - Discovered (not yet collected): outlined circle, `var(--border)` stroke,
        dashed. "Discovered" state comes from `discoveredCountries` in
        `SkillProgress.geography` (see Story 6).
      - Undiscovered: `?` text, `var(--elev)` fill, `var(--t4)` text.
      - Clustered (multiple markers close together): `var(--blue-sub)` bg +
        `var(--blue)` border + count label. Tap zooms to reveal individual markers.
- [ ] No solid fills on markers. All markers use tint-pair colours.
- [ ] Tapping a collected marker opens a bottom panel (collapsed by default, animated
      swipe-up) showing: animal image (w-20 h-20, rounded-xl), name, RarityBadge,
      card level (from `CollectedCard.level`), total game sessions played (sum of
      `CollectedCard.gameHistory`), and a "Play now" accent button that opens the
      card picker sheet for the last-used game (or Coin Rush as default if no game
      history).
- [ ] Tapping a discovered (not collected) marker shows: animal silhouette, name,
      region, and copy "Find this card in pack openings" (plain text, no button).
- [ ] Tapping an undiscovered marker shows: "?" with copy "Explore this region in
      World Quest to discover new animals" (plain text, no button).
- [ ] iPad landscape (1024px): two-panel layout — map left 65%, detail panel right
      35%. The right panel shows detail for the tapped marker without the bottom
      swipe-up panel.
- [ ] iPad portrait / phone: full-width map with swipe-up bottom panel for marker
      detail.
- [ ] Map background and country fill tokens match Story 6 World Quest spec exactly.
      Consistent SVG styling across both uses.
- [ ] Newly collected markers (card collected in current session) pulse with a subtle
      `box-shadow` ring animation using `var(--green)` at z-0 (not portal — the pulse
      is contained within the map layer).
- [ ] Content container class string: `px-0 pt-0 pb-0` — the map is full-bleed below
      the glass PageHeader. PageHeader floats above with `position: fixed` per DS
      glass rule.
- [ ] Layout verified at 375px, 820px, and 1024px.
- [ ] All DS 10-point checklist items pass at Phase D.

### Out of scope

- Dedicated `/map` route in the bottom navigation. The map lives inside `/cards?tab=map`.
  A `/map` route may be added later as a redirect if World Quest deep-linking requires it.
- Migration route animated polylines (Phase 2).
- Range polygon overlays (Phase 2).
- Biomes toggle in the map header (Phase 2).

---

## Story 10: Card detail sheet — progression view

```
As Harry,
I need to see my card's level progress and game history in the card detail sheet,
So that I can understand how strong my card is getting and see which games I have
played it in.
```

### Acceptance criteria

- [ ] `CollectedCardDetailSheet` is extended with two new sections inserted between
      the existing Stats section and the Duplicates section.
- [ ] New section 1 — "Card progression":
      - Header label: "Card progression" in DS section header style.
      - Overall level progress bar: `h-2 rounded-full`, fill uses green tint-pair for
        Lv 4+, amber tint-pair for Lv 7+, neutral (`--border-s`) fill for Lv 1–3.
      - Level label: "Level X / 10" (14px/600 --t1) left of bar.
      - Sub-label below bar: "Y sessions to Level X+1" (13px/400 --t3).
      - If the card is at Level 10, sub-label reads "Max level reached" (13px/400
        `--amber-t`).
- [ ] New section 2 — "Game sessions":
      - Header label: "Game sessions" in DS section header style.
      - Four rows, one per game. Row structure:
        `[Game icon 16px, game accent --X-t]  [Game name 14px/600 --t1]  [Session badge]`
      - Session badge uses the game's accent tint-pair pill:
        `bg-[var(--X-sub)] border border-[var(--X)] text-[var(--X-t)]`
        showing the session count (e.g. "8 sessions").
      - If a game has never been played with this card: badge reads "Not played yet"
        in `--t3` text with a muted (opacity-40) game icon.
- [ ] `CollectionGrid` card tiles receive a compact game session count row below the
      RarityBadge (not inside the detail sheet — this is a grid-tile addition):
      `[Game icon pair — 2 most-played games, 12px, --t3]  ["X sessions" 11px/400 --t3]`
      If total sessions across all games is 0, this row is hidden.
- [ ] `CollectionGrid` card tiles receive a level indicator pill at the top-right
      corner of the image. Level pill token rules: Lv 1–3 neutral, Lv 4–6 green
      tint-pair, Lv 7–10 amber tint-pair. "Lv X" format, 10px/700. No solid fills.
- [ ] No ghost variant used. No hardcoded hex colours.
- [ ] All DS 10-point checklist items pass at Phase D.
- [ ] Layout verified at 375px, 820px, and 1024px.

### Out of scope

- Per-game accuracy breakdown in the detail sheet (Phase 2 — would require
  sub-topic tracking data not available in Phase 1).
- Year level display in Harry's UI (year level is invisible to Harry — never shown
  in the card detail sheet or anywhere in Harry's interface).

---

## Open questions for Owner — must be resolved before Phase C

The following items are not implementation decisions. They require Owner input.

| # | Question | Impact |
|---|----------|--------|
| OQ-1 | XP thresholds for levels 1–10: are the values in Story 7 AC correct, or does Owner want different numbers? | Card progression pacing |
| OQ-2 | Should `yearLevel` be tracked per card (current spec) or per player across all cards for each game (global progression)? | DB schema and calibration logic |
| OQ-3 | Should the `discoveredCountries` field be added to `SkillProgress` (Story 1 + 6 dependency) or stored elsewhere? Developer to advise architecture; Owner to confirm data ownership. | Story 1 and Story 6 dependency |
| OQ-4 | Habitat Builder "save and continue" mechanic (Story 5 AC): should an incomplete simulation be saved as a sub-object of `CollectedCard.gameHistory` or in a new `habitatSimulationState` table? Developer to advise; Owner to confirm. | Story 1 and Story 5 dependency |

These questions should be answered in writing by Owner (in this document or a
separate decision log) before the Developer brief for Phase C is written.

---

## Stealth-learning compliance check

The following copy rules apply across all 10 stories. The Tester must verify
each one in Phase D:

- [ ] The words "Year", "Year 1", "Year 3", "Year 5", "curriculum", "National
      Curriculum" do not appear anywhere in Harry's UI (any screen, any toast, any
      button label, any hint strip copy).
- [ ] The words "correct" and "wrong" and "incorrect" do not appear anywhere in
      Harry's session UI. "Try that one again" and "Skip this one" are the only
      failure-adjacent copy allowed.
- [ ] No streak counter is visible to Harry during an active game session.
- [ ] No difficulty percentage, accuracy percentage, or adaptive message appears
      during or between sessions in Harry's view.
- [ ] Challenge level labels in Harry's UI are exactly: "Getting started",
      "Going further", "Expert mode". No other level terminology.
- [ ] Achievement or badge names do not contain the words "Learner", "Scholar",
      "Student", or any synonym that maps to a school context.
- [ ] `SkillArea` internal values (`'maths'`, `'spelling'`, `'science'`,
      `'geography'`) are never surfaced as visible labels in any part of Harry's UI.

---

## Notes to Developer and Frontend Engineer

**Catalogue import pattern:**
`card-catalogue-200.json` must be imported at `src/data/card_catalogue_200.json`
and consumed via a lookup utility in `src/lib/cardCatalogue.ts`. Do not reference the
file from `research/educational-games/` at runtime — that directory is not in the
Vite source tree.

**Portal requirement:**
Session header, XP burst overlay, and session complete overlay are all portal-rendered
per CLAUDE.md. Any `position: fixed` element inside a Framer Motion animated parent
is a build defect if not portal-rendered.

**Spend-before-write transaction integrity:**
Any function that increments a card stat AND writes XP in the same operation must wrap
both writes inside a single `db.transaction('rw', db.collectedCards, ...)`. Separate
sequential awaits are a build defect.

**Error handling:**
Every async DB write in game hooks must be wrapped in `try/catch` with a
`toast({ type: 'error', ... })` call. Silent swallows (`.catch(() => {})`) are a build
defect per CLAUDE.md.

**No audio:**
No sound output of any kind. No `new Audio()`, no Web Audio API, no `<audio>` elements.
This is an absolute prohibition, not a preference.
