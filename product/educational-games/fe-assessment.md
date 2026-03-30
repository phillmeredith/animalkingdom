# FE Technical Assessment — Educational Games Integration
**Date:** 2026-03-29
**Author:** Frontend Engineer
**Input spec:** `animal-kingdom-game-improvements.md`

---

## Executive Summary

All four game routes are already registered and all four screens already exist. The routes are not placeholders — they are fully functional, sharing a production-quality `ArcadeShell` component with question banks, XP tracking, coin rewards, and badge eligibility checks. The spec's vision requires a significant upgrade to this foundation: card-specific question personalisation, stat-based difficulty, year-level curriculum targeting, and two fundamentally different game modes (Habitat Builder simulation, World Quest map interaction) that cannot be served by the current multiple-choice shell.

The gap between the current build and the spec is substantial but well-structured. The routing and persistence infrastructure is in place. The data and question systems need to be rebuilt.

---

## 1. Routing

### Current state

All four routes are already registered in `AppRouter.tsx`:

```
/play/coin-rush       → CoinRushScreen
/play/word-safari     → WordSafariScreen
/play/habitat-builder → HabitatBuilderScreen
/play/world-quest     → WorldQuestScreen
```

The `PlayHubScreen` `GAMES` array references these routes and navigates to them via `useNavigate`. The `GamesContent` card grid is already wired.

### What needs to be added

Nothing at the routing layer. All four routes exist and render production screens. The work is entirely within those screens and their dependencies.

One consideration: the spec describes a card-selection step before the game begins (the player picks which of their collected animals to play with). This selection currently does not exist in the flow. The routing itself does not need to change, but the game screens need to accept and use a card context. The most natural implementation is a URL param (`/play/coin-rush?cardId=beagle`) or React context injected before navigation. This is a design decision for the interaction spec, not a routing architecture change.

---

## 2. Existing Data Gaps

### What animals.ts provides today

`AnimalEntry` in `animals.ts` has a rich field set: `habitat`, `diet`, `lifespan`, `region`, `facts`, `quiz` (one question per animal), `conservationStatus`, `socialBehaviour`, `careNeeds`, `predators`, `geographicRange`, `topSpeed`, `scientificName`, `taxonomy`, and more.

Critically, `AnimalEntry` does **not** have the four game stats the spec requires:
- Speed
- Strength
- Stamina
- Intelligence

These stats exist on `CollectedCard` (the `CardStats` interface in `db.ts`, added in schema v10) — but that is a DB record for a card the player has collected, not a catalogue entry. The catalogue entry and the collected card are different objects.

The spec assumes that playing a game with a "Beagle" card means using the Beagle's Speed stat (e.g. 50) as a number in a maths question. For that to work, the stat values must either:

(a) Live in `AnimalEntry` in `animals.ts` so any game can look up a stat before a card is collected, or
(b) Be derived from the player's `CollectedCard` DB record, which means the game only works with animals the player has already collected.

Option (b) is architecturally correct for the spec's vision (the spec explicitly describes "playing with your collected card") but it creates a chicken-and-egg problem for Phase 1 if the player has few or no collected cards.

### Schema changes needed

**To `AnimalEntry` (animals.ts):**
Add a `baseStats` field:
```typescript
baseStats?: {
  speed: number        // 0–100
  strength: number     // 0–100
  stamina: number      // 0–100
  intelligence: number // 0–100
}
```

These would be the canonical base values per species, independent of any individual card's collected state. This field is absent from every entry today. All ~50+ species in the Phase 1 catalogue would need hand-authored values.

**To `CollectedCard` (db.ts):** Already has `CardStats` with `speed`, `strength`, `stamina`, `agility`, `intelligence`. No schema change needed. However, `agility` is present in `CollectedCard` but not mentioned in the spec — the spec uses Speed, Strength, Stamina, Intelligence only. This is a minor alignment gap, not a blocker.

**No DB version bump is required** to add `baseStats` to `animals.ts` — it is a static data file change, not a DB schema change.

---

## 3. `useProgress` Compatibility

### What it supports today

`useProgress` tracks, per skill area (`maths`, `spelling`, `science`, `geography`):
- `xp` — cumulative, drives tier
- `tier` — integer derived from XP thresholds
- `totalCorrect`, `totalAttempted` — session-independent totals
- `currentStreak`, `bestStreak`
- `gamesPlayed`
- `lastPlayedAt`

`PuzzleHistory` stores every individual question answer: `area`, `questionId`, `tier`, `correct`, `answeredAt`.

`recordAnswer(area, questionId, tier, correct)` already takes a `tier` parameter and writes it to `puzzleHistory`.

### Gap 1: Per-card stat increases

The spec's core loop is "correct answer → stat increase" — the player's individual Beagle card's Speed goes from 50 to 51. This is a card-level mutation on `CollectedCard.stats`.

`useProgress` has no concept of this. It tracks aggregate skill XP, not per-card stat deltas. The hook that would handle this is `useSavedNames` or a new `useCardProgression` hook operating on `db.collectedCards`.

What's needed: a `incrementCardStat(cardId, stat, delta)` function, wrapped in a DB transaction, that updates `CollectedCard.stats` and emits the visual feedback trigger. This is new hook territory, not an extension of `useProgress`.

### Gap 2: Year-level storage

`SkillProgress` has no `yearLevel` field. The spec requires the game to know Harry is at Year 3 difficulty and serve Year 3 questions.

What's needed: either a new `yearLevel` column on `SkillProgress` (requires a DB version bump, currently v16), or a separate `PlayerSettings` table/localStorage value. Given this is a single-player app with one user (Harry), `localStorage` is the simplest path and avoids a schema migration. The value would be set once during onboarding or in Settings.

### Gap 3: Question difficulty tracking per card

The spec describes auto-adjusting difficulty targeting ~80% success rate. `puzzleHistory` stores `tier` and `correct` per question. The raw data is there, but there is no per-card difficulty tracking — only per-skill-area.

What's needed: extend `PuzzleHistory` to include an optional `cardId` field (nullable for questions not tied to a specific card). This allows a future query like "what is Harry's accuracy on Beagle-specific questions at Year 3?". This requires a DB version bump.

### Summary of `useProgress` gaps

| Gap | Severity | What's required |
|-----|----------|-----------------|
| No per-card stat mutation | Blocking for core loop | New `useCardProgression` hook + `incrementCardStat()` |
| No year-level field | Blocking for curriculum targeting | localStorage or new DB column |
| No per-card difficulty history | Phase 2 concern | Optional `cardId` on `PuzzleHistory`, new DB version |

The XP system (`addXp`, `recordAnswer`, tiers) can be reused as-is for aggregate progress. The per-card stat loop requires new infrastructure.

---

## 4. Question Data Architecture

The spec requires questions personalised to the selected card. A Beagle session produces different questions from a Red Panda session, and the numbers in the maths questions use that card's actual stat values.

### Current state

`arcadeQuestions.ts` is a flat bank of 20 static questions per skill area (80 total). Questions are animal-themed but generic — they are not tied to any specific card. `getArcadeQuestions()` shuffles and returns 10 at random.

The spec is architecturally incompatible with this approach for card-specific questions.

### Option A: Hardcode questions per animal in a JSON/TS file

Each animal in the catalogue gets a block of questions per game, authored by hand.

**What it requires:** For 50 species × 4 games × ~10 questions = ~2,000 authored question entries. Each maths question needs dynamic stat substitution (Beagle Speed = 50 today, 51 after a correct answer) which means either re-authoring when stats change, or using a templating convention like `"{{name}} runs at {{speed}} km/h. Add 5. New speed?"` that resolves at render time.

**Pros:** No external dependencies. Works fully offline. Predictable. Easy to QA. Appropriate for a single-user PWA. Content is explicitly authored and curriculum-aligned (no hallucination risk).

**Cons:** Significant content authoring burden. Scaling to 150 species means ~6,000 question entries. Maths questions that use real stat numbers need a template resolution layer (minor engineering, not complex). Questions must be updated when stat values change meaningfully.

**Assessment:** This is the correct approach for Phase 1. The content authoring burden is real but bounded. It pairs well with the existing `arcadeQuestions.ts` structure — the file format just gains a `cardId` field and template variables.

### Option B: Generate questions at runtime from animal data

Questions are generated by templates that inject animal data fields. For example, a maths template `"A {name} runs at {speed} km/h. After training it gains {delta} km/h. New speed?"` is filled from `AnimalEntry.baseStats.speed` and a computed delta.

**What it requires:** A template library per question type and year level. Template resolution logic that accesses the card's current stats at render time. A question randomisation system that selects from applicable templates for the current year level and game.

**Pros:** Scales to any number of animals without content authoring per animal. Questions always reflect current stat values (no stale authored values). Year-level curriculum targeting is encoded in the templates, not the data.

**Cons:** The curriculum alignment of generated questions is harder to guarantee — a maths template may produce trivially easy or impossibly hard questions depending on the stat values it receives. Spelling and vocabulary questions (Word Safari) cannot be meaningfully generated from data fields — they require authored word choices and distractors. The approach only works well for structured domains (maths with numerical stats, geography with region data). Science questions about food chains, adaptations, and life cycles are difficult to template meaningfully.

**Assessment:** Viable for Coin Rush maths questions (numerical stat substitution is straightforward). Not viable as the primary approach for Word Safari (spelling/vocabulary) or the ecology questions in Habitat Builder. A hybrid is realistic: use templates for maths stat-based questions, use authored content for vocabulary and science facts.

### Option C: External API/AI generation

Questions are generated by an LLM at session time, given the animal's data profile.

**What it requires:** An API key, network connectivity at session start, a backend proxy to avoid exposing keys in the client, latency management (question pre-fetching before the session), and error handling for offline/API-failure states.

**Pros:** Maximum content variety. Zero authoring burden. Adapts to any animal automatically.

**Cons:** This is an **offline-first PWA**. Network dependence for question generation is a structural risk. API costs at scale are non-trivial. LLM outputs require content moderation for a child audience. Latency (even with pre-fetching) adds friction to the session start. Curriculum alignment of LLM outputs cannot be guaranteed without extensive prompt engineering and validation. This introduces an external dependency that does not exist anywhere else in the stack.

**Assessment:** Not appropriate for Phase 1 of a single-user offline-first PWA. Consider only for Phase 3 as a supplementary content layer with a mandatory fallback to authored questions when offline.

### Recommendation

**Hybrid of Option A and Option B:**

- Coin Rush (maths): Option B template system with stat substitution. 15–20 templates per year level that accept `{name}`, `{speed}`, `{strength}`, `{stamina}`, `{intelligence}`, `{delta}` variables. These resolve at render time from the card's current stats.
- Word Safari (spelling/vocabulary): Option A authored questions per animal. Vocabulary, phonics, and etymology questions must be hand-curated to ensure curriculum alignment. Distractor choices cannot be safely generated.
- Habitat Builder (science): Option A authored facts per animal (food chain, habitat, adaptations). These are stable factual data that the animal catalogue already partially contains.
- World Quest (geography): Option B templates using `region`, `geographicRange`, `habitat`, `conservationStatus` from `AnimalEntry`. The data fields are mostly already present.

---

## 5. Habitat Builder Simulation Complexity

### Current implementation

`HabitatBuilderScreen.tsx` is a thin wrapper around `ArcadeShell`. It passes science questions and exits to `/play`. There is no simulation state, no survival loop, and no day/decision system.

### What the spec requires (Phase 1: Years 1-2)

A 5-day survival simulation:
- Daily action selection: Hunt, Drink Water, Find Shelter, Explore
- Consequence system: Stamina depletes over time, food increases with hunting, condition changes based on decisions
- Food chain display: grass → rabbit → beagle (card-specific)
- Simple adaptation facts: thick fur for winter

### State machine required

```
type SimDay = 1 | 2 | 3 | 4 | 5
type Action = 'hunt' | 'drink' | 'shelter' | 'explore'
type Condition = 'thriving' | 'healthy' | 'struggling' | 'critical'

interface SimState {
  day: SimDay
  stamina: number    // 0–100
  food: number       // 0–100
  shelter: number    // 0–100
  condition: Condition
  history: Array<{ day: SimDay; action: Action; staminaDelta: number; foodDelta: number }>
  phase: 'intro' | 'day' | 'consequence' | 'summary'
}
```

Each day the player picks an action, the consequence is calculated (card-specific rules: a Beagle hunting is more effective than a Beagle sheltering because of its natural behaviour), and all stats update. After 5 days, a summary screen shows survival outcome.

### Complexity assessment

This is significantly more complex than the other three games. Reasons:

1. **Non-MCQ interaction.** The other three games are multiple-choice questions served by `ArcadeShell`. Habitat Builder requires a spatial/narrative UI: a scene showing the habitat, action cards the player taps, an animated consequence display, stat bars updating in real time. `ArcadeShell` cannot be reused at all.

2. **Card-specific rule engine.** Each animal has a different action effectiveness profile. A Beagle hunting earns more food than a Beagle exploring. A Polar Bear sheltering costs less stamina in winter than in summer. These rules must be authored per animal and interpreted by a rule engine. This is a mini-game scripting system, not a question bank.

3. **Multi-day progression state.** The simulation must persist across the 5-day cycle. If the player exits mid-simulation, the state must be saved and resumable — or the session must be declared abandoned. This is stateful game logic that does not exist anywhere in the current codebase.

4. **Visual complexity.** The spec's framing ("5-day survival simulation with real-time consequences") implies animated consequence feedback — stat bars that fill and drain, visual condition changes on the animal. This is substantially more animation work than the progress bar in `ArcadeShell`.

5. **Years 3–6 complexity (Phase 2+).** Food webs, biome selection, predator-prey dynamics, natural selection simulation — these are an order of magnitude more complex than the Phase 1 needs.

### Recommendation

Habitat Builder should be scoped separately from the other three games. For Phase 1, scope it to: a 3-day (not 5-day) simplified simulation with 3 action choices, card-specific food chain display, and a pass/fail outcome. Build it as a standalone component tree, not a skin on `ArcadeShell`. Flag this as the highest-risk item in Phase 1.

If the PO needs to cut scope for Phase 1, deferring Habitat Builder to Phase 2 is the cleanest option. The other three games share a common shell and are achievable together. Habitat Builder is a parallel workstream of similar scope to the other three combined.

---

## 6. World Quest Map Interaction

### Current implementation

`WorldQuestScreen.tsx` wraps `ArcadeShell` with geography questions. There is no map component anywhere in the codebase.

### What the spec requires (Phase 1: Years 1-2)

- A UK map showing England, Scotland, Wales, Northern Ireland
- Tap-to-identify regions (directional language: north, south, left, right)
- Card origin marker ("Beagle comes from England")
- Habitat icons on the map

### What the spec requires (Phase 2+)

- Compass directions
- UK county boundaries
- Grid references
- Lat/long coordinates
- Migration route paths (animated)
- Climate zone overlays

### Mapping library options

The app currently has no mapping dependency. For a child-facing, offline-first PWA, the options are:

**Option 1: SVG-based custom map (no library)**
Author SVG files for UK regions (Phase 1) and a world map (Phase 2). Each region is an SVG `<path>` element that responds to pointer events. Hit detection is built-in via SVG's `pointer-events`. Visual styling (fill colour, label placement) is CSS.

Pros: No external dependency. Fully offline. Lightweight (a simple UK map SVG is under 30KB). Complete visual control — can be styled to match the DS. Works at any resolution including iPad. Touch targets are the region shapes themselves, not overlaid div elements.

Cons: SVG paths for county-level detail (Phase 2) become complex. Migration route animations and lat/long grid overlays require additional engineering on top of the SVG. World map SVG with enough geographic accuracy for lat/long questions is a non-trivial asset to produce.

**Option 2: Leaflet.js with OpenStreetMap tiles**
Industry-standard web mapping library with offline tile support via service worker caching.

Pros: Rich feature set (markers, polylines for migration routes, zoom, pan). Geographic accuracy guaranteed. Supports lat/long natively.

Cons: External dependency (~150KB minified). Tile caching for offline use requires service worker configuration that the app does not currently have. Visual styling via Leaflet CSS is at odds with the DS — significant theming work to make it feel native. Interactive behaviour (tap to identify a region) requires GeoJSON data and vector tile configuration that is not trivial to set up. The UI will feel "map app" rather than "game" without extensive customisation. Overkill for Phase 1 UK region identification.

**Option 3: D3.js with GeoJSON**
Geographic data visualisation library. Renders SVG from GeoJSON data.

Pros: Professional geographic rendering. GeoJSON for UK regions is freely available. Supports projections, which matters for lat/long accuracy.

Cons: D3 is a large dependency (~240KB) for what is essentially a tap-a-region interaction in Phase 1. Learning curve. Output is SVG anyway — Option 1 achieves the same Phase 1 result with no dependency.

### Recommendation

**Phase 1: Custom SVG maps.** Commission (or generate) a simplified SVG of the UK's four nations. Author SVG paths for the four regions. Build a `<MapInteractive>` component that renders the SVG and wraps touch/pointer events on each path element. This is the correct approach for a child-facing game where visual clarity and tap accuracy matter more than geographic precision.

**Phase 2: Evaluate D3 + GeoJSON if county-level accuracy is required.** County boundaries at the level needed for grid references are difficult to hand-author in SVG. At that point, a GeoJSON-driven solution becomes justified.

### Risks

- SVG tap targets for Scotland and Northern Ireland will be small on iPhone (375px). Phase 1 is iPad-first (CLAUDE.md). This risk is lower at 1024px but must be verified on the secondary phone target.
- Migration routes (Phase 2) animated on a world map are a significant animation engineering task. Flag as Phase 2 only.
- The question format for map challenges is fundamentally different from MCQ: the answer is a spatial tap, not a button press. `ArcadeShell`'s answer handling does not support this. A map-specific question shell is required.

---

## 7. Game Session Shell

### Current shell: `ArcadeShell`

`ArcadeShell` already handles:
- `start` → `playing` → `results` phase state machine
- Progress bar (question index / total)
- Question display (text)
- 2×2 options grid (MCQ)
- Correct/wrong feedback (colour flash, 1s delay before advance)
- Score tracking
- XP award via `useProgress.addXp()`
- Coin award via `useWallet.earn()`
- `gamesPlayed` increment
- `recordAnswer()` call for puzzle history
- Reduced motion compliance
- Exit confirmation overlay
- Speech synthesis via `useSpeech`

### What the spec requires that `ArcadeShell` does not currently provide

**1. Card context.** The shell has no concept of which animal card is being played. All questions are card-agnostic. Adding card context requires passing a `card: AnimalEntry | CollectedCard` prop and threading it through the question resolution layer.

**2. Year-level selection.** No year level is tracked or passed. Questions are not difficulty-tiered. Adding year level requires either a player setting (read from localStorage or DB) passed as a prop, or a pre-game year selector on the start screen.

**3. Stat increase animation.** The spec's core feedback loop is a visible stat increase after a correct answer (e.g. Speed 50 → 51 appears on the card). This is not in the shell. It requires: calling `incrementCardStat()`, then showing an animation of the stat value changing on a small card thumbnail. This is a new UI region in the playing phase.

**4. Vocabulary/fill-in-the-blank input.** Word Safari questions like "Beagle hunts by following ____" require a text input (or a word-selection from 3–4 options). The current 2×2 options grid handles multiple choice only. For phonics years, a drag-letter-into-blank interface would be ideal. For morphology years, MCQ with word options is fine. The shell needs an input type variant.

**5. Subitising (visual dot display).** Coin Rush Year 1 requires "see 5 dots, recognise 5 without counting." This needs a rendered dot grid, not a text question. A new question variant type is needed.

**6. Map interaction.** World Quest requires spatial tap answers. This is a completely different interaction model from MCQ. `ArcadeShell` cannot accommodate this.

**7. Session length.** The spec defines 10–12 questions per session. The current shell takes whatever question count is passed. This is compatible — the caller just passes the right count.

### Recommended architecture

Extend `ArcadeShell` to support:
- A `cardContext?: AnimalEntry` prop (optional — if absent, falls back to current generic question mode)
- A `yearLevel?: number` prop
- An `onCardStatUpdate?: (stat, newValue) => void` callback for post-correct feedback
- A `questionVariant` discriminated union on `ArcadeQuestion`:
  - `'mcq'` — current 2×2 grid (no change)
  - `'fill-blank'` — word bank selection (4 word chips, player taps the correct one)
  - `'dot-count'` — rendered subitising display (Year 1 Coin Rush)
  - `'map-tap'` — spatial selection (World Quest only; may warrant its own shell)

The `map-tap` variant is sufficiently different that a `WorldQuestShell` component diverging from `ArcadeShell` may be cleaner than forcing both into one abstraction.

---

## 8. Reuse Opportunities

These existing components can be used as-is or with minor extension in game UIs:

| Component | Location | Reuse |
|-----------|----------|-------|
| `Button` | `src/components/ui/Button.tsx` | Action buttons throughout — start game, answer options, exit |
| `AnimalImage` | `src/components/ui/AnimalImage.tsx` | Card thumbnail on game start screen and stat increase feedback |
| `RarityBadge` | `src/components/ui/Badge.tsx` | Card header in game start/results screen |
| `TierBadge` | `src/components/ui/TierBadge.tsx` | Year level display |
| `StatCard` | `src/components/ui/StatCard.tsx` | Stat display panels on card context header (assess for fit first) |
| `BottomSheet` | `src/components/ui/Modal.tsx` | Card selection sheet before game start |
| `Toast` | `src/components/ui/Toast.tsx` | XP and coin reward toasts after session |
| `CoinDisplay` | `src/components/ui/CoinDisplay.tsx` | Header coin count during session |
| `PillToggle` | `src/components/ui/PillToggle.tsx` | Year level selector on game start screen |
| `ArcadeShell` | `src/components/arcade/ArcadeShell.tsx` | Reuse or extend for Coin Rush, Word Safari (MCQ variants) |
| `PageHeader` | `src/components/layout/PageHeader.tsx` | Game screen header bar |
| `useProgress` | `src/hooks/useProgress.ts` | XP, tier, streak tracking (as-is) |
| `useWallet` | `src/hooks/useWallet.ts` | Coin rewards (as-is) |
| `useSpeech` | `src/hooks/useSpeech.ts` | Question read-aloud (as-is) |
| `useReducedMotion` | `src/hooks/useReducedMotion.ts` | Animation guard (as-is) |

Components that **cannot** be reused without significant rework:
- `ArcadeShell` for map interaction (World Quest Years 3+)
- `ArcadeShell` for the Habitat Builder simulation (fundamentally incompatible)

---

## 9. Build Complexity Ranking (Phase 1 — Foundation Level Only)

Ranked simplest to most complex:

### Rank 1: Coin Rush (Maths) — Lowest complexity

**Why:** The current implementation is already a working maths quiz. Phase 1 (Years 1-2) questions are addition, subtraction, counting — straightforward MCQ. Stat-based question templates are the primary addition: a template system that substitutes `{speed}`, `{strength}` etc. into question text. The existing `ArcadeShell` handles the rest. Card-specific questions just require adding `baseStats` to animal entries and a question template file for maths.

Additional work: template resolution function, `baseStats` authoring for ~50 animals, card selection step before session. No new UI patterns.

### Rank 2: Word Safari (Spelling/English) — Low-medium complexity

**Why:** Phase 1 (Years 1-2) is phonics and CVC words — MCQ answer format is entirely appropriate. The current spelling question bank is already doing this (just not card-specifically). Card-specific questions require an authored vocabulary bank per animal (what words relate to this animal's behaviour and biology?). The `fill-blank` input variant is an addition to `ArcadeShell` that is mechanical but new UI work.

The Year 1-2 scope avoids the complex morphology and etymology of Years 3-4+. Distractors must be carefully authored to be phonically plausible without being confusing — this is a content quality requirement, not a technical one.

Additional work: per-animal vocabulary questions (authored), `fill-blank` question variant in `ArcadeShell`, card selection step. No new major UI patterns beyond the fill-blank input.

### Rank 3: World Quest (Geography) — Medium complexity

**Why:** Phase 1 (Years 1-2) requires a UK map with four tap-to-identify regions. This is new UI territory — no map or SVG interaction component exists in the codebase. However, the UK-four-nations SVG is manageable in scope and the interaction (tap a region) is a single pointer event handler pattern. Card origin markers ("Beagle comes from England") are a positioned element on the SVG.

The Phase 1 question types (UK location, direction words, habitat identification) can be split between map-tap interactions and standard MCQ for non-spatial questions (weather, seasons). This hybrid approach limits the custom map work to spatial location questions only.

Additional work: SVG map asset (UK four nations), `MapInteractive` component, touch target sizing validation on iPad and phone, card origin marker logic, hybrid question routing (map-tap vs MCQ). Moderate new component surface area.

### Rank 4: Habitat Builder (Science) — Highest complexity

**Why:** As detailed in section 5, Habitat Builder requires a fundamentally different game mode. It is not a question-and-answer loop. It is a simulation with state that evolves over multiple turns, card-specific rule sets, narrative consequence feedback, and animated outcome display. The `ArcadeShell` cannot be used as the foundation. A new game component tree of comparable scope to the rest of the game system is required.

Phase 1 (Years 1-2) is the simplest version of the simulation — 3-5 day cycle, 3-4 actions — but even this requires a rule engine per animal, a turn-based state machine, and UI to visualise habitat status. The risk is not complexity per se but scope uncertainty: the simulation's feel is qualitatively different from the other three games and will require iteration that a rigid spec cannot fully anticipate.

Additional work: full simulation state machine, per-animal rule sets (authored), turn UI (action cards, habitat display, stat bars), consequence animation system, multi-day progression UI, summary screen. This is the most substantial build in the feature set.

---

## Summary Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| `baseStats` authoring for 50+ animals | Medium | Sprint 0 content task; unblock before Phase C starts |
| `ArcadeShell` card context plumbing | Low | Additive prop — backward compatible |
| Per-card stat increase DB hook | Medium | New hook; requires careful transaction design |
| Year-level storage design | Low | localStorage acceptable for single-user; decide before Phase C |
| World Quest SVG map asset | Medium | Commission SVG before Phase C; not a code task |
| World Quest touch targets on phone | Low | Test on iPhone 12 after build; 375px is secondary target |
| Habitat Builder simulation complexity | High | Scope Phase 1 to 3-day cycle; consider deferring to Phase 2 |
| Habitat Builder card-specific rules | High | Requires authored rule sets per animal before Phase C |
| No existing mapping library | Medium | Custom SVG is correct for Phase 1; do not add Leaflet for Phase 1 |
| LLM question generation (Option C) | Deferred | Not appropriate until Phase 3; offline-first requirement is blocking |
