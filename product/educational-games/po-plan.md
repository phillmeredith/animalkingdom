# Educational Games — PO Planning Document

**Date:** 2026-03-29
**Author:** Product Owner
**Status:** Draft — awaiting Owner review before backlog entries are added

---

## 1. Context and Framing

The educational spec describes a complete stealth-learning system layered over the existing card game. Four games already exist in the Play hub as built stubs — routing, icons, XP tracking, and skill areas (`maths`, `spelling`, `science`, `geography`) are all wired up in `useProgress`. What does not exist yet is any question engine, card-selection flow, or educational content.

The spec is comprehensive but explicitly sequential across three phases covering six months. This planning document treats Phase 1 of the spec as the build target and deliberately does not plan Phase 2 or 3. Those will be assessed after Phase 1 is complete.

**What the existing codebase already gives us for free:**

- `useProgress` with `recordAnswer`, `addXp`, `getRecentQuestions`, `checkBadgeEligibility` — the XP and badge plumbing is ready
- Four named skill areas already mapped to game routes
- `AnimalEntry` has rich card data: `region`, `habitat`, `diet`, `topSpeed`, `adaptations`, `conservationStatus`, `taxonomy`, `facts`, and one `quiz` question per animal
- `PlayHubScreen` already navigates to `/play/coin-rush`, `/play/word-safari`, etc.
- The existing `quiz` field on `AnimalEntry` means there is already a thin question data model

**What does not exist:**

- Any actual game screen behind those routes
- A multi-question session (the existing quiz field is a single question, not a session)
- Card selection before a game session starts
- Year-level / difficulty routing
- Card-specific question generation (the spec's core mechanic)

---

## 2. Feature Decomposition

The spec must be split. Playing all four games with full Year 1-6 content is not one feature — it is at minimum six features, and probably eight. Below is the decomposition I am recommending.

### 2a. Shared infrastructure (must come first)

**Game session shell**
A shared component and hook that handles: card selection (pick one owned animal), session flow (N questions → results), XP award, and session completion screen. No game-specific content — just the container that every game populates. This is the most foundational piece and nothing else can be built without it.

**Question data model**
The existing `quiz` field is a single `AnimalQuiz` with one question per animal. A session needs 10-15 questions per game, each card-specific. Before any game content can be authored, the team needs to agree on where these questions live and how they are structured. This is a scope and data architecture decision (see Section 4).

### 2b. First game content (Year 1-2 only)

**Coin Rush — Year 1-2 content**
Number bonds, subitising, counting on/back, doubling. The spec recommends starting here because the question types are the most straightforward to author and test. Harry's current age maps to approximately Year 3-4, so Year 1-2 Coin Rush will be accessible from day one while still being educationally appropriate as a warm-up tier.

**Word Safari — Year 1-2 content**
CVC words, phoneme-grapheme mapping, word family chains. More complex to implement than Coin Rush because phonics questions require specific question types (sound matching, completion) rather than simple multiple-choice maths. Builds on the session shell established for Coin Rush.

### 2c. Remaining Phase 1 game content

**Habitat Builder — Year 1-2 content**
The spec describes this as a 5-day survival simulation rather than a Q&A session. This is architecturally different from Coin Rush and Word Safari — it requires simulation state (stamina, food, shelter), daily decision prompts, and consequence tracking. It should be treated as a separate feature with higher complexity than the Q&A games, not bundled with the session shell.

**World Quest — Year 1-2 content**
UK location maps, directional language, weather and seasons. Requires map rendering (interactive UK map or equivalent). The spec describes visual map-based challenges, which again require different UI infrastructure to the Q&A games. Separate feature.

### 2d. Difficulty routing (can be deferred within Phase 1)

**Year-level difficulty routing**
Auto-adjusting difficulty based on performance, or explicit year-level setting. The spec describes an 80% success-rate target and auto-adjustment. This is a quality-of-life feature that can be added after the first game is working — it is not needed to launch Coin Rush Year 1-2 for Harry. However, it must be planned and the data model for it must be agreed before Phase C begins on any game content, because the question schema needs to carry a difficulty/year field.

---

## 3. Dependency Map

```
Question data model
  └── Game session shell (card picker + session flow + XP award)
        ├── Coin Rush Year 1-2 content
        │     └── Word Safari Year 1-2 content
        │           └── Year-level difficulty routing
        │                 └── Coin Rush Year 3-4+ content (Phase 2)
        │
        ├── Habitat Builder Year 1-2 content (parallel, different architecture)
        └── World Quest Year 1-2 content (parallel, different architecture)
```

**Key constraint:** Habitat Builder and World Quest are architecturally different (simulation and map-based respectively). They share the card-selection mechanism from the session shell but do not share the Q&A question engine. They can be built in parallel with Coin Rush/Word Safari once the session shell exists, but must not block on the Q&A question engine.

**Hard dependency chain before any Phase C work begins:**
1. Owner answers the scope questions in Section 4
2. Question data model is agreed and documented
3. Session shell is specified (Phase A/B) and approved
4. Only then: game content features can proceed

---

## 4. Phase 1 Recommendation

The spec's own Phase 1 (Foundation) covers all four games across Year 1-4 content. That is too broad to build as a single sprint. My recommendation for the first buildable slice is:

**Build target: Game session shell + Coin Rush Year 1-2**

Specifically:
- Card picker: select one owned animal before starting a session
- Session flow: present 10 questions, show result on each, track streak
- XP award: call `addXp` on session complete (existing hook, already wired)
- Session completion: summary screen showing questions answered, XP earned, card stat preview
- Question content: number bonds, subitising, counting on/back — framed using the selected card's data (name, stats, species facts)
- Difficulty: Year 1-2 only, no auto-adjustment yet — fixed tier

**Why start with Coin Rush and not Word Safari:**

Coin Rush Year 1-2 is the simplest question type to author and test. Every question is a number problem with a definitive correct answer. Word Safari Year 1-2 requires phonics content (CVC words, sound matching) which is harder to author correctly and carries higher risk of curricular errors. Getting the session shell right with Coin Rush first, then porting to Word Safari, is lower risk.

**Why Year 1-2 first when Harry is approximately Year 3-4:**

Year 1-2 content serves as the entry tier. Harry starting on accessible content is intentional — the spec explicitly says the system should begin easy and scale up. It also lets us verify the session shell is working before adding harder content. Year 3-4 questions should be added as a follow-on story once Year 1-2 is complete and Harry has played at least a few sessions.

**What this does not include:**

- Card stat increases (see scope decision below)
- Auto-difficulty adjustment
- Cross-game vocabulary reinforcement
- Habitat Builder or World Quest (those are separate features)
- Any Year 3-4 or higher content

---

## 5. Scope Decisions Needed from Owner

The following must be answered before Phase A/B can produce complete specs. None of these are implementation details — they are product decisions that change the scope and data model of every subsequent feature.

### Decision 1: Year-level setting — explicit or auto-detected?

**The question:** Should Harry be able to set his year level in Settings (e.g. "Year 3"), which routes him to the appropriate question difficulty? Or should the app start at Year 1-2 and auto-promote based on performance (e.g. 80%+ accuracy on 20 questions triggers a tier increase)?

**Why it matters:** The question data schema must carry a year/difficulty field regardless. But the routing logic is either a simple settings flag (low complexity) or a performance-based state machine per game per card (high complexity). The data model for year-level progress needs to be settled before any question content is authored.

**Suggested default if no strong view:** Explicit setting in Settings, starting at Year 3 (Harry's current level), with manual promotion. Auto-detection can be added later. This is lower build risk and means Harry is not held at Year 1 content longer than necessary.

### Decision 2: Stat increases — persisted or visual-only?

**The question:** The spec says correct answers visibly increase card stats (e.g. "Speed 50 → 51"). Does this mean the `SavedName` record in the DB has its stats updated? Or is the stat increase a visual-only reward shown during the session, with no permanent write?

**Why it matters enormously:** If stats are persisted, we need stat fields on the `SavedName` schema (currently not present — `SavedName` tracks rarity, source, care, but not numeric stats). This is a DB schema change that affects My Animals, the Marketplace listing, Auctions, Player Listings, and any card comparison feature. It is a significant data integrity risk if done mid-project. If visual-only, there is no schema change and the reward is cosmetic.

**My recommendation:** Visual-only for Phase 1. The reward feeling is preserved. Persisted stat changes should be scoped as a separate backlog item once the schema implications are fully understood.

### Decision 3: Where do questions come from?

**The question:** The spec requires card-specific questions — different questions for Beagle vs Red Panda, using each animal's actual stats and facts. Where does this content live?

**Option A — Hardcoded in the app:** A `questions.ts` data file per game with question templates per animal. E.g. a Coin Rush template: `"[Animal] runs at [topSpeed]. Add 5. New speed?"` populated at render time from the `AnimalEntry`. This is the approach most consistent with the existing `quiz` field pattern. Authoring is manual but entirely within the codebase. No external dependency.

**Option B — Generated at runtime by AI:** Question text generated using the card's attributes. No authoring overhead, but introduces API calls, latency, and potential for curriculum-inaccurate questions. Significant build complexity and offline risk (the app is a PWA).

**Option C — Separate JSON data file per game per year level:** Questions authored offline in a structured JSON schema, imported at build time. More structured than Option A, easier to update without code changes.

**My recommendation:** Option A with a template pattern for Phase 1. The existing `AnimalEntry` already has the data needed (region, diet, topSpeed, conservationStatus, facts). A question template approach lets us launch with a small number of high-quality questions per game tier without API dependencies. Option C is the right migration path once the template pattern is validated.

### Decision 4: Cross-game vocabulary reinforcement — in scope for Phase 1?

**The question:** The spec describes vocabulary introduced in Word Safari appearing in World Quest descriptions (e.g. MIGRATION, HABITAT, LATITUDE). This is a significant feature — it requires the app to track which vocabulary a player has encountered and surface it contextually in other games.

**My recommendation:** Out of scope for Phase 1. This is a Phase 2 feature once all four games are independently working. Adding vocabulary tracking to Phase 1 significantly increases complexity without Harry noticing the benefit until he has played all four games extensively.

### Decision 5: Achievement badges for games — priority change?

**The question:** The spec describes 30+ achievement badges for game mastery (Speed Learner, Pattern Master, Biome Expert, etc.). The existing backlog has "Achievement Badges" at Tier 4 as a general system. The existing `checkBadgeEligibility` already handles arcade badges (first game, ten games, streak-five, all-subjects). Does the educational games spec change the priority of expanding this?

**My recommendation:** The existing arcade badges are sufficient for Phase 1. The educational game-specific badges (Speed Learner, Biome Expert, Cartographer, etc.) belong in a separate "Educational game achievements" backlog entry at Tier 3 or 4, to be scoped after Phase 1 games are live. Do not block Phase 1 on this.

---

## 6. Recommended Backlog Entries

The following six entries are proposed for addition to `spec/backlog/BACKLOG.md`. They are presented in dependency order — each entry should not begin Phase C until the entry above it has completed Phase C.

**Pending Owner answers to Section 5 before these are finalised.**

---

### Entry 1: Game session shell

| Field | Value |
|-------|-------|
| Feature name | `Game session shell` |
| Tier | 2 |
| Dependencies | Coin Rush (existing), Word Safari (existing), Habitat Builder (existing), World Quest (existing) |
| Complexity | Medium |
| Description | Shared card-picker and session-flow component used by all four educational games: select one owned animal, present N questions, record answers, award XP on completion. |

**Why Tier 2:** The game routes already exist and are complete stubs. The session shell fills in that stub, making the Play hub genuinely playable for the first time. It is foundational infrastructure for all subsequent game content.

---

### Entry 2: Question data model

| Field | Value |
|-------|-------|
| Feature name | `Educational question data model` |
| Tier | 2 |
| Dependencies | Game session shell |
| Complexity | Low |
| Description | Agree and implement the question schema: template structure, year-level field, card-attribute bindings, and de-duplication logic for recently-seen questions. No UI — data layer only. |

**Why separate from the session shell:** The question data model is an architectural decision that affects all four games. Getting it wrong means reworking all game content. It should be agreed, reviewed, and locked before any question content is authored.

**Note:** This entry can be resolved in Phase A/B alongside the session shell and does not need to be a separate Phase C build if the schema is simple enough. Listing it separately ensures it is not skipped inside a larger feature spec.

---

### Entry 3: Coin Rush — Year 1-2 content

| Field | Value |
|-------|-------|
| Feature name | `Coin Rush — Year 1-2 educational content` |
| Tier | 2 |
| Dependencies | Game session shell, Educational question data model |
| Complexity | Medium |
| Description | 10-question maths sessions for Year 1-2 UK curriculum: number bonds, subitising, counting on/back, doubling. Questions framed using selected card's name and attributes. |

**Why start here:** Simplest question types to author and verify for curricular accuracy. Unblocks the session shell in a working, playable state for Harry without introducing the architectural complexity of Habitat Builder or the phonics-authoring risk of Word Safari.

---

### Entry 4: Word Safari — Year 1-2 content

| Field | Value |
|-------|-------|
| Feature name | `Word Safari — Year 1-2 educational content` |
| Tier | 2 |
| Dependencies | Game session shell, Educational question data model, Coin Rush Year 1-2 (session shell validated) |
| Complexity | Medium |
| Description | 10-12 question English sessions for Year 1-2 UK curriculum: CVC words, phoneme-grapheme matching, word family chains. Questions reference selected card's species vocabulary. |

**Phonics authoring risk:** Word Safari Year 1-2 requires phonics content to be curriculularly accurate. The UX spec must define question types clearly (multiple choice, spelling completion, sound matching) so question authors know what format is required. Do not begin Phase C until question format is agreed.

---

### Entry 5: Habitat Builder — Year 1-2 content

| Field | Value |
|-------|-------|
| Feature name | `Habitat Builder — Year 1-2 educational content` |
| Tier | 3 |
| Dependencies | Game session shell, Educational question data model |
| Complexity | High |
| Description | 5-day survival simulation for Year 1-2 UK Science: basic needs, food chains, simple adaptation. Simulation state (stamina, food, shelter), daily decision prompts, and consequence feedback. Card-specific: decision options and outcomes based on selected animal's diet, habitat, and category. |

**Why Tier 3 and high complexity:** The spec describes a simulation, not a Q&A session. This requires its own state machine (day counter, resource levels, outcome branching) separate from the shared session shell. It also requires the most card-specific authoring — the "right" choices for a Beagle are different to those for a Red Panda. It should be built after Coin Rush and Word Safari validate the session shell.

---

### Entry 6: World Quest — Year 1-2 content

| Field | Value |
|-------|-------|
| Feature name | `World Quest — Year 1-2 educational content` |
| Tier | 3 |
| Dependencies | Game session shell, Educational question data model |
| Complexity | High |
| Description | 10-12 question Geography sessions for Year 1-2 UK curriculum: UK nation locations, directional language, weather and seasons. Card-specific: selected card's region of origin provides geographical context. Map-based question types require interactive or visual map component. |

**Map rendering decision needed:** The spec describes visual map-based challenges. Before Phase A/B can complete for World Quest, Owner must confirm whether this means an interactive SVG UK map (custom build), a static image with hotspot areas, or something simpler (text-based location multiple choice). Map complexity is the main risk driver for this feature.

---

## 7. What is explicitly out of scope for Phase 1

The following are in the spec but should not be built in Phase 1:

- Year 3-6 content for any game (Phase 2 per the spec's own schedule)
- Persisted card stat increases (scope decision required, recommend visual-only)
- Cross-game vocabulary reinforcement (Phase 2)
- Timed/speed mode for Coin Rush Year 5-6 (Phase 2/3)
- Weekly challenges and tournament system (Phase 3)
- Leaderboards (Phase 3)
- Variant cards unlocked through World Quest (Phase 3)
- Natural difficulty auto-adjustment at 80% target (can follow Phase 1 with a separate backlog entry)
- Educational game-specific achievement badges beyond the existing arcade badges

---

## 8. Risks and Observations

**Curricular accuracy is a build quality gate, not a polish step.** Every question authored must map to a named UK National Curriculum learning objective. This is not optional — the spec is explicit that "nothing is filler." The UX spec for each game must include a curriculum mapping table, and the Tester must verify question accuracy before Phase D can close.

**Card-specific questions require enough animal data.** The existing `AnimalEntry` has `topSpeed`, `region`, `diet`, `facts`, `adaptations` — enough to template Coin Rush and Word Safari Year 1-2. However, not all animals in the catalogue have these fields populated. The question data model should either handle missing fields gracefully (fallback to generic number bonds values) or gate game sessions to animals with sufficient data. This must be decided in Phase A/B.

**Harry's year level is unknown.** The spec targets Years 1-6 but we do not know Harry's actual curriculum position across subjects. Phill should advise on Harry's current level in each subject before question content is authored. Starting at Year 3-4 (approximately age 7-9) is a reasonable default for a child described as 8-10 years old, but phonics (Word Safari Year 1-2) may be too basic or may be exactly what is needed depending on Harry's reading level.

**The existing `gamesPlayed` counter increments per session.** The `useProgress` hook already tracks games played, but there is no session record (which card was used, which questions were answered, at what difficulty). If the year-level auto-adjustment feature is built later, it will need a richer session history. The question data model (Entry 2 above) should include a game session record table even in Phase 1, even if the auto-adjustment logic is not yet built. Adding a table schema later is more disruptive than adding it now.

---

*This document is a planning input, not a commitment. Backlog entries will not be added until Owner has reviewed Section 5 and confirmed the scope decisions.*
