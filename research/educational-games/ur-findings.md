# UR Findings: Educational Games Integration

> Output from the User Researcher agent.
> Produced during Phase A — review of `animal-kingdom-game-improvements.md` against
> Harry's known profile and existing system architecture.
> Date: 2026-03-29

---

## User profile summary

**Primary user:** Harry, estimated age 8–10 (the spec's stated range of 6–12 is wide; the
existing app's card mechanics, auction participation, and economy complexity are consistent
with an 8–10 year old rather than a 6-year-old).

**Confirmed characteristics:**
- Autistic. This is not a peripheral detail — it is the single most consequential fact about
  this user and it must inform every friction point, failure state, and pressure mechanism in
  the design.
- Intrinsically motivated by collection, ownership, and visible progression. He will engage
  repeatedly if the reward loop is intact.
- Motivated by the card game frame. He is not seeking educational content explicitly. The
  spec's stealth-learning premise is correctly identified as the right approach for this user.
- Unknown: his current school year level, his baseline attainment in each of the four
  subjects, and whether he has previously experienced negative associations with any of these
  subjects (particularly maths, which is a common area of anxiety for autistic children).

**Confidence level:** Medium. The above is based on inferred profile from observed app
design choices. No direct interview data from Harry exists in the research archive. The
absence of primary research from Harry is the most significant gap in this entire brief.

---

## Analysis by topic area

---

### 1. Stealth learning integrity

**Finding:** The spec's core framing is well-constructed for a neurotypical child and is a
reasonable starting point for Harry. However, three specific elements risk breaking the
"card game" illusion for an autistic user, where literal interpretation of language and
heightened sensitivity to inconsistency are common:

**Risk 1a — Subject-named games.** The game titles (Word Safari, Coin Rush, Habitat Builder,
World Quest) are successfully thematic. They do not name school subjects. This is correct.
However, the existing `PlayHubScreen.tsx` maps these to `SkillArea` values of `'spelling'`,
`'maths'`, `'science'`, and `'geography'`. If any of these internal labels surface anywhere
in the UI — as labels, toast messages, tier descriptions, badge names, or achievement
copy — the curriculum framing is exposed. The spec does not address this risk. Current
badge text in the codebase has not been audited for subject-naming.

**Risk 1b — Achievement language.** The spec proposes badge names such as "Speed Learner",
"Pattern Master", "Biome Expert", "Cartographer". "Speed Learner" contains the word
"Learner" — this signals educational context. "Biome Expert" and "Cartographer" are
thematic and safe. This inconsistency needs resolving. Any badge name containing
"Learner", "Scholar", "Student", or equivalent will break stealth for a user who is
sensitive to school-like framing.

**Risk 1c — Year-level copy.** The spec references "Year 1-2", "Year 3-4", "Year 5-6"
content levels in its design documentation. These must never appear in the UI in any form.
The spec does not explicitly state how difficulty level is communicated to the user (if at
all). A child of Harry's profile would likely resist any labelling that maps to school year
groups, even implicitly.

**Confidence:** High for risks 1a and 1c (structural — based on codebase inspection).
Medium for risk 1b (requires full badge catalogue audit, which has not been done here).

---

### 2. Year-level assessment

**Finding:** The spec requires the app to serve content matched to Harry's current UK
National Curriculum year level. The spec proposes "auto-adjust to ~80% success rate" as the
calibration mechanism, but does not specify how initial placement works — i.e., what Harry
experiences on his very first session before any calibration data exists.

**Critical gap:** There is currently no mechanism in the app to determine or store Harry's
school year. The `useProgress` hook tracks XP, tier (1–4), streak, total correct, and total
attempted per skill area. None of this maps to curriculum year level. Tier 1–4 as currently
implemented is a game progression tier, not a curriculum level proxy.

**Risk 2a — Cold start problem.** If the first session serves Year 1–2 content to a Year 4
or 5 child, Harry will immediately perceive the questions as too easy and disengage. For an
autistic child with a strong sense of fairness and intelligence, being patronised by
trivially easy content is not a neutral experience — it may create a negative association
with the game that is difficult to recover from.

**Risk 2b — Initial level prompt.** The obvious solution is to ask Harry (or a parent) to
set his year group during onboarding. However, the spec does not address onboarding at all.
If a year-group prompt is shown within the game itself (e.g. "What year are you in?"), it
exposes the curriculum framing and breaks stealth. This is a design tension the spec leaves
unresolved.

**Risk 2c — Incorrect placement by parent.** If a parent sets the year level, they may
choose aspirationally (above Harry's actual attainment) or conservatively (below). Either
results in mis-calibration. The spec's 80% success rate mechanism is intended to correct
this over time, but the correction speed is not specified. A child who is failing 40% of
questions in early sessions may disengage before calibration completes.

**Confidence:** High. This is a structural gap, not an inference.

---

### 3. Card-specific questions — data requirements vs existing data

**Finding:** The spec states "every question is personalized to the selected card." This is
the central differentiation of the educational system and the primary anti-brute-force
mechanism. Delivering on this requires specific data to be present per card.

**Current data in `animals.ts`:**
The `AnimalEntry` type includes: `name`, `animalType`, `breed`, `category`, `rarity`,
`habitat`, `diet`, `lifespan`, `region`, `facts` (3 strings), `quiz` (one question per
card), `superpower`, `conservationStatus`, `adaptations`, `predators`, `geographicRange`,
`taxonomy`, `physicalSize`, `physicalWeight`, `topSpeed`, `reproduction`.

**What the spec needs but the data does not currently provide:**

- **Numeric stats (Speed, Strength, Stamina, Intelligence) per card.** Coin Rush requires
  using card-specific numbers ("Beagle runs at 50 km/h. Add 5 km/h."). The existing data
  has `topSpeed` as a string (e.g. "50 km/h") for some cards, but this is not universally
  populated across the catalogue, and it is a formatted string rather than a raw integer.
  `physicalWeight` is similarly a string. There are no `strength`, `stamina`, or
  `intelligence` numeric fields in the current data model.

- **Origin country as a reliable field.** World Quest Year 1–2 requires "Beagle comes from
  England." The `region` field exists and is populated (e.g. "England" for Beagle), but
  this field's format is inconsistent across the catalogue — some entries contain a country,
  others a region description, others a breeding-origin note. It is not a clean ISO country
  name and would require normalisation before use in geographic questions.

- **Vocabulary terms specific to each card.** Word Safari requires card-specific vocabulary
  (e.g. "SCENT" for Beagle, "ALTITUDE" for Red Panda). The `facts` array contains relevant
  sentences but not extracted vocabulary terms. There is no `vocabulary` or `keyTerms` field.
  The single `quiz` question per card covers one question type only and is not a vocabulary
  list.

- **Food chain / predator-prey data for Habitat Builder.** The spec requires "Beagle hunts
  rabbits (not berries)." `predators` is populated for some animals but covers what hunts
  the animal, not what the animal hunts. A `prey` field does not exist in the current model.

- **Biome / habitat type as a structured field.** The `habitat` field is a string ("Home",
  "Forest", "Ocean") but is not a structured enum that maps to the spec's biome system
  (forest, savanna, ocean, desert, bamboo forest, etc.). Habitat Builder's biome selection
  mechanic requires a reliable biome mapping.

**Scale gap:** The existing catalogue has hand-crafted detail for a small subset of animals
(Beagle is a clear example of a fully enriched entry). The broader auto-generated catalogue
entries (`animals_catalog.json`) are likely to have far less structured data. The spec
assumes card-specific questions are possible for all 50+ Phase 1 cards. This assumption is
not validated by the current data.

**Confidence:** High. Based on direct inspection of the data model and the spec's
requirements.

---

### 4. Session length

**Finding:** The spec states 12–20 minutes per session. Word Safari and Coin Rush target
12–15 minutes; Habitat Builder targets 15–20 minutes for its simulation cycle.

**Assessment for Harry's profile:**

12–15 minutes is within the range that is generally considered appropriate for a child of
8–10 with an autism profile, assuming the task is intrinsically motivating and not
cognitively taxing in a way that creates dysregulation. The spec's own note that 60–90
minutes per week (not per session) is the wellbeing target is consistent with 4–5 sessions
of 12–15 minutes.

**Risk 4a — Habitat Builder session length.** At 15–20 minutes, the simulation game is
meaningfully longer than the other three. For an autistic child, the simulation's
consequence-and-repair loop (stamina depletes, food decreases) introduces a form of
sustained low-level pressure. If the simulation reaches a negative state (animal in danger)
close to the natural end of Harry's tolerance window, he may disengage at the worst moment
and experience the session as a failure. The spec does not address graceful session
interruption for this game.

**Risk 4b — No session length control.** There is currently no session timer, no "pause and
save" mechanism, and no explicit session boundary in the existing games infrastructure. The
spec does not address how a session ends if Harry stops mid-way. For Habitat Builder in
particular, an incomplete 5-day simulation needs a defined save state behaviour.

**Risk 4c — Invisible session length.** The spec does not propose showing Harry how long a
session will take before he starts. For an autistic child, uncertainty about duration is a
significant stressor. A child who starts a game not knowing it will take 15 minutes may
experience distress if interrupted or if the game does not end when expected.

**Confidence:** Medium-high. Informed by general research on autism and screen time
tolerance. Not specific to Harry.

---

### 5. Failure handling

**Finding:** The spec proposes "No wrong answer" — feedback framed as "Try again" rather
than an error state. This is a well-established pattern for autistic learners and aligns
with the growth mindset framing in the spec.

**Current state of the app:** The existing quiz mechanic in `animals.ts` is a single
multiple-choice question per animal with no visible failure state designed for the
educational games context. The `recordAnswer` function in `useProgress` records correct/
incorrect and updates streak, but there is no specification for how an incorrect answer is
presented to the user in the current games (Word Safari, Coin Rush, etc. are not yet built
as interactive games — the routes exist in the nav but the game screens are placeholders).

**Risk 5a — Streak counter visibility.** The current `useProgress` hook maintains a
`currentStreak` and `bestStreak` per skill area. If streak counts are surfaced in the game
UI, a broken streak (any incorrect answer) is a visible, countable loss. For an autistic
child, a broken streak can be a significant negative event disproportionate to the learning
outcome. The spec does not address streak visibility within a session.

**Risk 5b — Retry loop without exit.** "Try again" framing is correct, but the spec does
not define how many retries are offered before the answer is revealed or the question is
skipped. An unlimited retry loop can itself become a fixation point for an autistic child
— either refusing to move on until the "correct" answer is found, or becoming distressed
at repeated failure on a single item. A maximum of 2–3 attempts with a graceful reveal is
best practice; the spec does not specify this.

**Risk 5c — Implicit difficulty increase on wrong answers.** The 80% calibration mechanism
adjusts difficulty based on performance. If incorrect answers trigger harder questions
(standard adaptive learning), this punishes the child for getting something wrong by
immediately making the game harder. This is the opposite of a supportive failure pattern.
The spec does not specify the direction of difficulty adjustment on failure.

**Confidence:** High for risks 5a and 5b (structural gaps in the spec). Medium for risk 5c
(depends on implementation of adaptive algorithm, which is not specified).

---

### 6. Card selection flow

**Finding:** The spec states "Before each game, Harry must pick a card to play with." This
is a meaningful piece of interaction design that the spec describes as motivating (the card
is the lens through which all questions are personalised) but does not detail as a flow.

**Current app state:** The "My Animals" screen (`MyAnimalsScreen`) holds Harry's owned
collection. Cards can be viewed in `PetDetailSheet`. There is no existing flow that takes a
card from the collection into a game session.

**Assessment for Harry's profile:**

Card selection is likely to be enjoyable for Harry — choosing a favourite card is a low-
stakes, high-ownership action. This is consistent with his motivation profile.

**Risk 6a — Collection size friction.** If Harry has a large collection (the engagement
spec targets 47+ cards within a few months), a selection step that requires scrolling
through all owned animals adds pre-game friction. There is no evidence for how Harry
responds to choice overload, but research on autism and decision-making suggests that an
unfiltered list of 40+ choices can itself be a barrier, particularly in the moment of
wanting to start a game quickly.

**Risk 6b — Selection from a different screen.** The natural entry point for a game is the
Play tab. The natural location of the collection is the My Animals tab. Requiring Harry to
navigate between these tabs to select a card, then return to Play, creates a multi-screen
flow that is not reflected in the current app architecture. If card selection happens inside
the Play tab (a sub-selection step before launching the game), the design needs to specify
this explicitly.

**Risk 6c — No card = no game?** If Harry has no owned animals (new user, or all animals
are listed for sale), the game cannot start. The spec does not address this state.

**Confidence:** Medium. The selection flow is not specified in enough detail to assess
friction precisely. This is a gap for UX to resolve.

---

### 7. XP / stat feedback loop — system gap analysis

**Finding:** The spec proposes "Correct answer = visible stat increase" as the core
educational feedback loop. Specifically, a card's Speed, Strength, Stamina, or Intelligence
stat increases visibly when a correct answer is given.

**Current `useProgress` system:**
The hook tracks XP per `SkillArea` (maths, spelling, science, geography), tier (1–4 based
on cumulative XP thresholds), streak, total correct, and total attempted. XP accumulates at
the skill-area level, not at the per-card level.

**Critical gaps:**

- **No per-card stat system exists.** The `AnimalEntry` type in `animals.ts` does not
  include Speed, Strength, Stamina, or Intelligence as numeric fields. The `SavedName`
  type (which represents an owned animal in the player's collection) would need equivalent
  fields. Neither the data model nor the database schema (`db.ts`) contains these fields.
  This is not a small gap — it requires a new data model, new DB columns, and a new
  write path.

- **Current XP is skill-area-global, not card-local.** The existing system accumulates XP
  across all games in a subject area. The spec requires XP (or stat) gains to be visible on
  the specific card that was used in the session. These are different data structures. The
  existing `addXp` function in `useProgress` writes to `skillProgress` by area, not by
  `savedNameId`.

- **Tier system (1–4) is not the same as card level.** The spec describes card levelling
  ("every 20–30 sessions = level up") and card evolution (rarity increase every 3–4 levels).
  The current tier system is a player-level progression, not a per-card progression. These
  are parallel systems, not the same system.

- **Stat increase animation requires a stat to exist.** "Speed 50 → 51" as shown in the
  spec requires a base numeric value per card. As noted in section 3, this does not exist
  in the current data model.

**Confidence:** High. This is a structural data model gap confirmed by direct inspection.

---

### 8. Priority of games for Phase 1

**Assessment for Harry's profile:**

**Recommended first: Coin Rush (Maths)**

Rationale: The feedback loop is the clearest. A number answer is objectively correct or
incorrect, and the "Try again" framing is least ambiguous when the domain is numeric. The
card-specific personalisation (using card stats as numbers) is achievable with less
vocabulary/semantic data than Word Safari requires. The risk of culturally loaded content
(incorrect cultural assumptions) is lowest in a maths context. The spec's Year 1–2 content
for Coin Rush (number bonds, counting on) is also the least dependent on card-specific
vocabulary, which reduces the data gap risk identified in section 3.

**Second: World Quest (Geography)**

Rationale: The `region` field in `animals.ts` already provides a geographic anchor for
each card. UK geography (Year 1–2 content) is concrete and visual. Map interaction is a
form of spatial reasoning that is often a relative strength for autistic learners. The
stealth framing is strong — "discover where your card comes from" is a natural collection
mechanic.

**Third: Word Safari (English/Spelling)**

Rationale: Phonics and spelling are valuable but the personalisation requirement is the most
data-intensive of the four games. Generating card-specific vocabulary (SCENT for Beagle,
ALTITUDE for Red Panda) requires either a rich structured vocabulary field per card (which
does not exist) or a generative content approach (which introduces quality and
consistency risks). Additionally, spelling and phonics are the subjects most likely to have
negative prior associations for an autistic child who may have experienced literacy
difficulties. This does not mean the game should not be built — it means it should be built
third, after the data model and failure handling patterns are well-established.

**Highest risk: Habitat Builder (Science)**

Rationale: This is the most complex game in the spec. It is the only one framed as a
simulation with consequences (stamina depletes, condition changes). The session length (15–
20 minutes) is the longest. The "Wrong choices create immediate consequences (less food =
lower stamina)" mechanic introduces a form of real-time failure that is qualitatively
different from a question you get wrong and retry. The spec acknowledges "Card condition can
decrease, creating stakes without pressure" — but decreasing card condition is a negative
state for a child who has strong ownership attachment to his cards. For an autistic child,
the distinction between "stakes" and "pressure" may not be as clean as the spec assumes.
This game should not be built until the simpler question-based games have established Harry's
tolerance for in-game failure and the "Try again" pattern is well-validated.

**Confidence:** Medium. Based on profile inference and spec analysis. Not validated with
Harry directly.

---

### 9. Assumptions to validate

**Assumption A: Auto-difficulty calibration to 80% success rate can work without knowing
Harry's baseline.**

Assessment: This assumption is questionable. The 80% target is a well-established
educational threshold (Vygotsky's zone of proximal development; Bjork's desirable
difficulty research). However, calibration algorithms require data to calibrate. In the
first session, with no prior answer history, the system cannot know whether to serve Year 1
or Year 5 content. The cold start must be resolved by either:
(a) an initial placement mechanism (which risks breaking stealth if framed as a test), or
(b) starting at a conservative baseline (Year 1–2) and calibrating up, which risks
patronising an older or higher-attaining child.

There is a third approach the spec does not raise: using Harry's existing in-game tier
(his overall game progression level, currently Tier 1–4) as a proxy for initial curriculum
placement. This has the advantage of being invisible to Harry and derived from behaviour
he is already exhibiting. However, game tier and curriculum attainment are not reliably
correlated, and this assumption should be treated with caution.

Confidence level on this assumption: Low. Cannot be validated without observing Harry's
first session.

**Assumption B: Cross-game vocabulary transfer is realistic.**

Assessment: The spec proposes that vocabulary learned in Word Safari (e.g. "ENDANGERED",
"MIGRATION") will be recalled and used in Habitat Builder and World Quest. This is a
hypothesis about learning transfer, not a feature that can be implemented — it is a
learning science claim. Transfer of vocabulary between contexts is well-supported in
research when: (a) the same term appears in multiple contexts, (b) sufficient time has
elapsed between encounters, and (c) the learner has achieved some level of fluency with
the term in the first context.

The spec's cross-game architecture is designed to create these multiple-context encounters,
which is well-reasoned. However, for an autistic learner, context-switching between
subjects may work differently — vocabulary strongly associated with one game context
(SCENT = hunting challenge in Word Safari) may not transfer intuitively to a different game
context (SCENT = science concept in Habitat Builder). Whether this is a genuine barrier or
not is unknown for Harry specifically.

Confidence level on this assumption: Low. It is plausible but not validated. Treat as
aspirational for Phase 1; measure transfer in Phase 2 with observable outcomes.

---

## Assumption audit

| Assumption | Status | Evidence | Recommendation |
|------------|--------|----------|----------------|
| Harry is motivated by card progression and collection | Validated | App design and engagement architecture are built on this; Harry is the stated primary user | No action required |
| Stealth learning frame is appropriate for Harry | Validated with conditions | Correct framing for autistic learners; however three specific elements risk exposure (see findings 1a, 1b, 1c) | Badge names and any copy containing "learner", "scholar", "year group" must be audited |
| 12–15 min session length is appropriate | Amended | Appropriate for Harry's profile in general; Habitat Builder at 15–20 min introduces additional risk given its sustained-failure mechanic | Cap Habitat Builder at 15 min or provide explicit save-and-exit at any point |
| Card-specific questions are possible with existing data | Rejected | Current `animals.ts` lacks numeric stats, structured vocabulary, prey data, and consistent region/biome fields | New data fields required before any game can be built to spec |
| Per-card stat increases connect to existing XP system | Rejected | `useProgress` operates at skill-area level, not per-card level; no stat fields exist on `AnimalEntry` or `SavedName` | New data model required |
| Auto-calibration can start without baseline data | Not validated | Cold-start problem is unresolved; initial content level must be determined somehow | Needs design decision: silent proxy (game tier) vs explicit placement vs conservative start |
| Cross-game vocabulary transfer will occur | Aspirational — not validated | Plausible learning science basis but unvalidated for Harry specifically; context-switching may work differently for autistic learners | Measure in Phase 2; do not rely on transfer as a Phase 1 success criterion |
| "Try again" framing fully mitigates failure risk | Amended | Correct approach but incomplete: retry limits, streak visibility, and difficulty direction on failure are unspecified | Spec must define: max retries, whether streaks are shown within a session, calibration direction on failure |
| Habitat Builder consequence mechanic creates "stakes without pressure" | Not validated | For autistic users, decreasing card condition is not a neutral stakes event — it may be experienced as distress | Do not build Habitat Builder until simpler games are validated with Harry |

---

## Flagged risks

### Risk A: Data model is insufficient for card-specific questions
- **Finding:** `animals.ts` lacks numeric stats (Speed, Strength, Stamina, Intelligence), a structured vocabulary field, a prey/diet-target field, and consistent numeric values for physical attributes. The `region` field is not normalised as a clean country name.
- **Impact:** No game can be built to spec without this data. The card-specific personalisation — the central anti-brute-force mechanism — cannot function.
- **Recommendation:** Data model requirements must be defined before UX spec is written for any game.
- **Priority:** High

### Risk B: Cold-start curriculum placement is unresolved
- **Finding:** The app has no mechanism to determine Harry's school year. The 80% calibration mechanism cannot function in the first session.
- **Impact:** First session will either patronise Harry (too easy) or overwhelm him (too hard). Either outcome creates a negative first impression that is difficult to recover from, particularly for an autistic child who may not give the app a second chance.
- **Recommendation:** A placement strategy must be decided before any game is specced. Three options with tradeoffs exist (game-tier proxy, explicit prompt, conservative start). This is a design decision for UX and PO, informed by [OWNER]'s knowledge of Harry's current school year.
- **Priority:** High

### Risk C: Habit Builder consequence mechanic carries high distress risk
- **Finding:** Decreasing card condition as a game consequence is presented in the spec as creating "stakes without pressure." For an autistic child with strong card ownership attachment, this characterisation is not reliable.
- **Impact:** Card condition decrease may be experienced as real harm to a valued possession. This is qualitatively different from getting a question wrong.
- **Recommendation:** Do not build Habitat Builder until after Word Safari or Coin Rush have been shipped and Harry's tolerance for in-game failure is observable. The "stakes" mechanic should be reviewed at that point.
- **Priority:** High

### Risk D: Streak counter visibility may amplify failure
- **Finding:** `useProgress` maintains a streak counter. If surfaced in-game, any incorrect answer visibly breaks the streak, making failure countable and public.
- **Impact:** For an autistic child with perfectionist tendencies, a broken streak can cause session abandonment or distress disproportionate to the learning cost of a single wrong answer.
- **Recommendation:** Streaks should not be shown within an active game session. Post-session summary (best streak, questions answered) is lower risk than real-time streak display.
- **Priority:** High

### Risk E: "Speed Learner" and similar badge names break stealth framing
- **Finding:** The spec's proposed badge name "Speed Learner" contains language that signals educational context. The word "Learner" is a school-associated term.
- **Impact:** If Harry encounters this badge, the stealth framing is compromised. For an autistic child who may have negative associations with school-context language, this creates an unnecessary aversion risk.
- **Recommendation:** All achievement and badge names must be reviewed against a simple criterion: could this appear on a school report card? If yes, reframe it in card/collection language.
- **Priority:** Medium

### Risk F: Session duration is not visible before starting
- **Finding:** No game communicates expected duration before Harry commits to starting. For an autistic child, uncertainty about when something will end is a recognised source of anxiety.
- **Impact:** Harry may start a 15-minute game without knowing it is 15 minutes, and become distressed if interrupted or if the game does not end when he expects.
- **Recommendation:** Each game entry point should show an expected duration in a thematic way (not "this takes 12 minutes" — that is clinical — but something like "5 rounds" or "10 challenges").
- **Priority:** Medium

### Risk G: Card selection flow is architecturally unspecified
- **Finding:** The spec requires selecting a card before each game but does not define where this happens in the app or how it integrates with the My Animals collection.
- **Impact:** Without a defined flow, UX may design a solution that creates multi-screen navigation (Play → My Animals → back to Play), introduces choice overload with large collections, or fails to handle the zero-animals edge case.
- **Recommendation:** Card selection flow must be designed explicitly in the interaction spec. It should not be treated as a detail left to FE discretion.
- **Priority:** Medium

---

## Remaining knowledge gaps

- **Harry's current school year and attainment baseline:** Not available from the research archive. This is the single most important missing data point for initial curriculum placement. Must be provided by [OWNER] as a product input, not derived from app data.
- **Harry's prior experience with the four subject areas:** Whether Harry has positive or negative associations with any of the four subjects is unknown. Particularly relevant for English/spelling (literacy difficulties are common alongside autism) and maths (anxiety is common). Until this is known, failure handling design must be maximally cautious.
- **Harry's response to in-game negative states (depleting stats, broken streaks):** Not tested. This is the primary unknown for Habitat Builder. It should be treated as an observation target once the first simpler game is live.
- **The data completeness of `animals_catalog.json` beyond the hand-crafted entries:** The auto-generated catalogue is referenced in `animals.ts` but its field completeness is unknown from the research perspective. If the majority of the 50+ Phase 1 cards lack the structured data required for card-specific questions, the entire personalisation premise requires rethinking.
- **Whether the 80% calibration target is achievable without explicit topic sequencing:** The spec assumes a single difficulty-adjustment axis. UK National Curriculum content is not uniformly distributed on a single difficulty axis — a child can be strong at number bonds (Year 1 maths) but weak at place value (Year 3 maths) in the same subject area. Sub-topic tracking may be necessary before cross-topic calibration is meaningful.

---

## Sign-off

UR findings complete. UX may proceed on Coin Rush and World Quest only — these have the most supportable data foundations and the lowest risk profile for Harry's specific needs.

UX must not proceed on Habitat Builder until the consequence mechanic and distress risk have been reviewed with [OWNER] against Harry's known responses to negative game states.

UX must not proceed on any game until [OWNER] confirms Harry's current school year as a product input — this is required to resolve the cold-start placement problem.

[ ] High-risk findings (A, B, C, D) have been reviewed by [OWNER] before UX begins.
