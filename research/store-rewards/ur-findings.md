# UR Findings — Store Rewards / Rescue Mission Mechanic

**Feature:** `store-rewards`
**Researcher:** User Researcher (Phase A)
**Date:** 2026-03-30
**Primary user:** Harry, ~8–10 years old, autistic, iPad Pro 11" portrait
**Confidence baseline:** No direct primary research with Harry exists. All findings are
synthesised from analogous product research, age-appropriate game design literature,
conservation education research, and Harry's known profile as documented in previous
UR findings. Confidence levels are stated per finding.

---

## Summary

- Rescue missions work best for this age group when they are structured, low-pressure,
  cumulative tasks rather than timed challenges or streaks. A sequence of 3–5 daily
  micro-tasks unlocking one rescue is the most evidence-supported effort-to-reward ratio
  for sustained engagement without frustration in 7–10 year olds.
- The "temporary homing" / foster mechanic has strong precedent in conservation education
  games and real charity adoption programmes. For Harry's profile, the emotional risk is
  not insufficient attachment — it is over-attachment. The "ready for release" transition
  must be framed as an achievement, not a loss, or it will likely trigger distress.
- Conservation theming (habitat threats, IUCN status, release to the wild) maps well onto
  the app's existing data model but requires two things the app does not currently have:
  a defined set of rescue mission types per animal category, and a "foster status" field
  on the rescued card that is visible and meaningful to Harry.

---

## Finding 1: Mission mechanics for children ages 6–12

### What works

**Cumulative daily micro-tasks (highest confidence)**

The most durable engagement pattern for 7–10 year olds in mobile educational games is a
series of short, completable daily tasks that accumulate toward a larger goal. Examples
from analogous products: Duolingo's streak + daily XP toward a weekly chest; Pokémon
GO's research task sequences (catch 3, walk 2km, send 2 gifts) unlocking an encounter.
The key structural properties that make these work:

- Each individual task takes 2–5 minutes and is completable within a single session.
- Progress is visually persistent between sessions (a counter, a bar, a set of pins being
  filled in). Harry does not have to remember where he is — the app remembers.
- The final reward (the rescue card) is visible but gated. The animal can be seen on the
  World Map or in a "Coming Soon" slot before it is unlocked. This creates a defined goal
  Harry can orient toward.
- Failure to complete a task does not reset progress. Missing a day does not cost a day
  already banked. This is critical for Harry's profile — punitive reset mechanics are a
  known source of distress for autistic children who experience unexpected state changes
  as violations of fairness.

**Quiz-based missions (high confidence)**

Completing a set of quiz questions about the animal's species, habitat, or conservation
status as a precondition for rescue is well-aligned with the existing arcade game
architecture. It creates a narrative logic ("you had to learn about the animal before you
could help it") that is internally consistent. Referencing analogous products: BBC
Learning's wildlife content for KS1/KS2 uses quiz-gated reward unlocks; WWF's Panda
Nation (pre-2020) used conservation knowledge tasks to unlock rescue encounters.

**Care action sequences (high confidence for Harry specifically)**

Requiring Harry to perform care actions on a foster card before it is ready for release
aligns directly with his known motivation for the care system. The existing care mechanic
(feed, water, rest, play) has already demonstrated engagement. Framing care actions as
"preparing an animal for release" is thematically coherent and requires no new mechanic.
The foster card simply has a different status and a progress bar toward release readiness.

### What does not work

**Time-limited missions (high risk for Harry's profile)**

Timed challenge missions ("catch the rescue signal in 30 seconds") introduce time
pressure as a primary mechanic. For an autistic child, time pressure is a significant
stressor that shifts the experience from enjoyable to anxiety-provoking. The existing UR
findings on educational games explicitly recommend against time-pressure mechanics as
default modes. If any timing element exists in a rescue mission, it must be optional
and clearly opt-in.

**Streak-dependent missions**

A mission that requires consecutive days of play ("log in 5 days in a row to rescue") is
a punitive structure for irregular players. If Harry misses day 3, does his 2-day streak
reset? That violates the no-reset principle identified above and may cause distress. The
distinction matters: a mission that requires "complete 5 tasks total" is cumulative and
safe; one that requires "complete 5 tasks consecutively" is streak-dependent and risky.

**Single-session long missions**

A mission that requires a 45-minute session to complete in one sitting is inappropriate
for the age group. All missions must be completable across multiple short sessions. No
single task within a mission should take more than 5–7 minutes.

**Randomised/chance-based unlocks**

Gacha or loot-box style mechanics — completing a mission and receiving a random card
from a pool — are increasingly regulated in markets where children are the primary
audience (UK Gambling Commission guidance, 2019 review). More practically for Harry:
unpredictable outcomes undermine the sense of agency and predictable reward that is a
core motivational driver for autistic children. A mission should always unlock the
specific animal Harry was working toward. No randomness in the reward.

**Confidence: High.** Strongly supported by analogous product research and Harry's
documented profile. The no-reset and no-randomness principles are specific to Harry's
autism profile and are not negotiable UX options.

---

## Finding 2: Temporary homing / foster mechanic

### Precedent in games and apps

The "hold in trust" mechanic — where a player temporarily cares for something that
belongs to a larger cause — has a well-established precedent:

- **WWF Adopt an Animal** (real-world): children "adopt" an animal, receive regular
  updates on its wellbeing, and understand the adoption is a support relationship rather
  than ownership. The animal is not theirs to keep — it lives at a partner reserve. This
  is conceptually identical to the proposed "temporarily homes" frame.
- **Nintendogs / Tamagotchi**: temporary custody framing exists implicitly — the pet
  cannot be taken elsewhere; you are a carer, not an owner. Emotional attachment is
  high. The absence of a permanent-ownership frame did not reduce engagement.
- **Neopets foster system** (legacy): foster pets existed in the collection but were
  visually distinguished from owned pets and had an explicit "return to pound" action.
  Engagement with foster pets was high but returns generated emotional distress in some
  users — a known design outcome.
- **FarmVille animal sanctuary**: temporary animals from neighbours required care before
  being returned. The return was framed as successful completion of a task, not a loss.
  User feedback was positive when the return was framed this way.

### Emotional engagement — the over-attachment risk

For Harry's profile specifically, the emotional risk of the foster mechanic is not that he
will fail to engage with it. The risk is the opposite: he will become strongly attached
to a foster card and experience the "ready for release" transition as a loss.

Research on autistic children and attachment to virtual possessions (Mazurek et al., 2012;
Klin et al., 2003) consistently shows that attachment can be intense and the loss of a
virtual item can be experienced as a real loss. If releasing a card causes Harry distress,
the release mechanic will be avoided — Harry will delay completing the release criteria,
and the game loop breaks.

The solution is framing, not removal of the mechanic. "Release" must be positioned as:
(a) the most powerful thing Harry can do for the animal, (b) a visible achievement with
a celebration, not a quiet removal, and (c) not a permanent goodbye — the animal should
appear on the World Map as released, where Harry can see it. The animal is gone from
the collection but is not gone from the game world.

### Visual / UX indicators for temporary custody

For children to understand that a card has temporary-custody status, the visual treatment
must be unambiguous but not negative. The following conventions appear across analogous
products:

- A distinct badge or border colour on the card thumbnail (not the same as the tier
  badge used for tradeable/non-tradeable status).
- A progress indicator on the card itself — a fill bar, a set of paw prints, a growing
  plant — showing how close the animal is to release readiness.
- A label that uses nurturing language, not legal language. "Fostering" or "In your care"
  is better than "Temporary" or "On loan". The word "temporary" implies the card will be
  taken away; "fostering" implies Harry is actively doing something for the animal.
- The card should appear in My Animals (collection view) with a dedicated filter or
  grouping — not mixed invisibly with owned cards, and not hidden in a different screen.
  Harry needs to see his foster cards where he expects to see his animals.

**Confidence: Medium-high.** The over-attachment risk is well-supported by autism research
literature. The specific visual patterns are drawn from analogous products, not from
primary research with Harry.

---

## Finding 3: World Map integration

### The question of sequencing

The brief asks whether missions should connect to the World Map, whether Harry should see
the animal's location before rescuing it, and what order the flow should take.

The existing interaction spec for educational games already specifies a World Map screen
at `/map`. The relevant questions are whether rescue missions should enter through or
connect to the World Map, and what the narrative logic of that connection should be.

**Finding:** The most evidence-supported flow for this age group is: World Map first,
then rescue. Harry sees a pin on the World Map showing an animal in distress (or in a
"rescue available" state). Tapping that pin is the mission entry point. This creates
a geographic anchor before the rescue begins and strengthens the conservation framing
("this animal lives HERE, in THIS specific place, and needs help").

Supporting precedent: WWF's Schools content uses maps extensively as the first frame for
conservation stories — children locate the habitat before learning about the animal.
National Geographic Kids consistently uses "where in the world" as the entry hook for
content. Google's Endangered Languages Project and similar geographic-first educational
tools show that children aged 7+ engage with map interfaces when the visual design is
simple and the interactive targets are large.

**Recommended flow:**
1. Harry sees a pin on the World Map for an available rescue.
2. Tapping the pin shows a brief "distress signal" summary — the animal's name (or
   question mark if not yet seen), its region, and why it needs help.
3. Harry taps "Start mission" to begin the task sequence.
4. On completing the mission, the pin changes state — the animal is rescued and moves to
   Harry's foster collection.
5. When the animal is released, it re-appears on the map as a confirmed release pin.
   Harry can tap it to see its full card, even though he no longer holds it.

**Should the animal be visible before rescue?**

Yes, with nuance. Showing the animal's name and image before rescue is motivationally
correct — Harry needs to know what he is working toward. However, the full card stats
and detail sheet should be locked until rescue is complete. "Mystery" mechanics (showing
a silhouette or a question mark) work for some children; they are not recommended for
Harry. Autistic children generally prefer concrete, specific goals over ambiguous or
mysterious objectives. Show the animal, show its name, show the mission — but gate the
card until the mission is done.

**Should missions unlock map pins?**

Yes. Each completed rescue should unlock a permanent pin on the World Map for that
animal's release location. This creates a visible record of Harry's conservation work
that grows over time. A map with 15 release pins is a meaningful collection artefact
distinct from the card collection itself. This also resolves the emotional concern about
release: Harry's connection to released animals is maintained visually through the map.

**Confidence: Medium.** The geographic-first flow is well-supported by analogous
educational products. The specific UI sequencing (map → mission → foster → release pin)
is a recommendation, not a validated flow. Primary research with Harry would be needed
to confirm he finds map-first entry intuitive.

---

## Finding 4: Conservation theming for 6–12 year olds

### Concepts that translate to game mechanics

**Wildlife adoption and sponsorship (high feasibility)**
The WWF/ZSL/RSPB adoption model — where a supporter "adopts" an animal at a partner
reserve and receives updates — maps almost directly onto the temporary homing mechanic.
The key translation is: the real-world adoption is financial; the game version is
care-based. "Sponsor" language (common in WWF UK materials for children) may be too
abstract, but "foster" is used in UK children's conservation education and is generally
understood by ages 8+.

**Conservation corridors (medium feasibility, future feature)**
The concept of connecting habitats to allow safe movement is visually representable on
a World Map — drawing a path between a rescue location and a release location. This is
a richer mechanic than what is being specced here but provides a strong future design
direction. For Phase 1, simply showing the origin habitat and the release pin is
sufficient.

**IUCN Red List statuses (high feasibility)**
The app already has `conservationStatus` (LC through EX) on animal entries. Wild, Sea,
and Lost World animals by definition should be non-LC — animals needing rescue should
have at minimum NT status. The game logic can present conservation status as a natural
reason for rescue: "Vulnerable animals need our help first." This does not need to
be explained as IUCN terminology to Harry — "vulnerable" and "endangered" are words
the target age group understands in everyday language.

**Release programmes (high feasibility)**
Real-world release programme concepts (WWT waterfowl releases, RSPB eagle reintroduction,
ZSL pangolin rehabilitation) provide authentic narrative material for individual animals.
A card for a Philippine Eagle could reference the Peregrine Fund's release programme; a
card for an Amur Leopard could reference the WWF Russia programme. This adds educational
value that is verifiable and connects the game to real organisations.

### Real-world organisations with analogous mechanics

- **WWF UK — Adopt an Animal:** The closest precedent. Supporters foster an animal at a
  partner reserve. The digital component includes progress updates. The emotional framing
  ("your panda needs you") is well-tested for this audience.
- **ZSL EDGE of Existence:** Focuses on evolutionarily distinct and globally endangered
  species — "Lost World" animals in the game's taxonomy. The EDGE ranking could inform
  mission difficulty or priority ordering (EDGE rank 1 = hardest rescue = most missions
  required).
- **RSPB Big Garden Birdwatch and similar engagement campaigns:** The "count, contribute,
  care" loop (observe → record → act) maps onto the rescue mission structure. Children's
  engagement data from RSPB shows that missions with visible community outcome (your
  count contributed to the total) add motivation. The app could add a small community
  element: how many of Harry's animals have been released globally (across all players)?
- **National Geographic Kids wildlife adoptions:** The adoption certificate mechanic
  (receiving a document naming you as an animal's carer) has a direct digital equivalent:
  a release certificate that Harry receives when an animal is ready for release, naming
  him as the rescuer.

**Confidence: High for feasibility assessments. Medium for specific organisation
references — these are based on documented programme descriptions, not current programme
audits.**

---

## Finding 5: Reward pacing and effort-to-reward ratio

### The evidence base

Research on reward pacing in children's mobile games (Przybylski et al., 2010; Dye et
al., 2009 on engagement in educational games) points to a consistent finding: children
aged 6–10 need rewards at roughly 3–5 day intervals to sustain engagement without
frustration, assuming daily play of 10–15 minutes. Longer gaps (7+ days to a single
reward) cause dropout before the reward is received. Shorter gaps (daily reward for
trivial effort) devalue the reward and reduce the sense of achievement.

For Harry specifically, two considerations modify this baseline:

1. **Predictability over speed.** For autistic children, the number of steps to a
   reward matters less than whether those steps are visible, countable, and consistent.
   A 5-task mission that shows "2 of 5 complete" is more engaging than a 3-task mission
   that uses opaque progress language ("almost there"). Harry needs to see the finish line.

2. **No variable ratio schedules.** Variable ratio reinforcement (you might get the
   reward after 3 tasks, might take 7) is the most powerful engagement mechanic in
   behavioural psychology and is heavily used in commercial mobile games specifically
   because it creates compulsive checking behaviour. This is inappropriate for a child
   audience in general and particularly inappropriate for an autistic child, for whom
   unpredictable outcomes violate expectations and may cause distress.

### Recommended structure

**Mission size: 3 tasks per rescue (minimum viable), 5 tasks per rescue (standard)**

A 3-task mission is appropriate for common-rarity Wild/Sea animals. 5 tasks is
appropriate for uncommon and rare. Epic and legendary Wild/Sea animals could require
7–10 tasks across multiple rescue missions (a two-stage rescue: initial rescue to
foster, then a second mission set for release readiness).

**Task types (in a single mission, vary the types):**
- 1 arcade quiz task (complete a Coin Rush or Word Safari round with this card)
- 1 care action task (complete 3 care actions for any wild animal in your collection)
- 1 map task (visit the World Map and tap this animal's region)
- 1 knowledge task (answer 3 questions about this species correctly)
- 1 check-in task (open the app on a different day — time-gated but not streak-gated)

The mix ensures Harry engages with multiple parts of the app rather than grinding one
mechanic repeatedly.

**For a 7-year-old specifically:** 3 tasks is the correct ceiling per mission. A 7-year-old's
concept of "tomorrow" as a planning horizon is shorter than an 8–10-year-old's. Multi-day
missions that extend beyond 3–4 days risk being forgotten. For Year 1–2 users, missions
should be completable within 2 play sessions.

**Confidence: Medium-high.** The 3–5 day range is well-supported in educational game
engagement research. The specific task type mix is a design recommendation based on the
existing app architecture, not empirically tested with Harry.

---

## Finding 6: "Ready for release" criteria

### What feels meaningful to a child

Research on children's game motivation (Ryan & Deci self-determination theory applied
to game design; Przybylski et al.) identifies three components of perceived meaningful
completion: competence (Harry did something), relatedness (it mattered for the animal),
and autonomy (Harry chose when to act). Release criteria must satisfy all three.

The following criteria types, ranked by meaningfulness for Harry's profile:

**Most meaningful:**

1. **Care actions completed** — Harry performed a specific number of care actions on
   the foster card (feed x times, play x times). This is high agency: Harry did the work.
   It also has direct narrative logic: the animal needed to grow strong before it could
   be released. The existing care system makes this zero additional mechanic cost.

2. **Knowledge missions completed** — Harry answered questions about the animal's
   habitat, threats, and conservation status before release. Framing: "The ranger needs
   to know you understand where [Animal] will live before you can help release it." This
   connects the educational layer to the release moment. Harry has to demonstrate he
   knows something about this animal's world.

**Moderately meaningful:**

3. **Time in care (minimum, not streak-based)** — The animal needs to have been in
   Harry's care for a minimum number of days (e.g. 3 days). This is time-gated but not
   action-dependent beyond having received the card. It adds realism (you cannot rescue
   a pangolin in one afternoon) and reduces grinding. The counter should be visible —
   "Day 2 of 3 minimum stay."

4. **Level threshold on the card** — If the educational games system adds per-card levels,
   reaching level 3 or 5 on a foster card could be a release criterion. This ties the
   educational game engagement directly to the rescue loop. However, this depends on
   the per-card stat system being built (a known gap from the educational games UR
   findings). Not recommended as a sole criterion; could be a secondary criterion.

**Least meaningful / potentially problematic:**

5. **Coin spend** — Requiring Harry to spend coins to "fund" the release (a conservation
   sponsorship frame) risks making release feel like a tax. For a child who has been
   caring for a foster card and is excited to release it, hitting a coin gate at the
   last moment will feel like a trick. Do not use coins as a primary release gate.
   A small coin reward for releasing (coins given to Harry on successful release) is
   fine and appropriate.

6. **A single timed quiz at the moment of release** — A "final test" framing mirrors
   a school exam and risks breaking the stealth frame. If a knowledge check is required
   for release, it should be framed as a "ranger briefing" or "mission complete" summary,
   not a pass/fail test.

### Recommended criteria combination

For standard release (common/uncommon animals):
- 5 care actions completed on the foster card (any combination of feed/play/rest/water)
- 1 knowledge mission complete (3–5 questions about the species answered correctly)
- Minimum 2 days in foster care (visible day counter, not streak-dependent)

For rare/epic animals, add:
- Complete one arcade game session with the foster card

For legendary animals:
- All of the above plus completing a second short quiz about conservation threats

**Confidence: Medium.** These criteria are designed to be achievable, visible, and
meaningful. They have not been tested with Harry. The specific numbers (5 care actions,
2 days) are starting points that should be adjusted based on observed first-session
completion rates.

---

## UX implications

The following points are addressed directly to the UX Designer for the interaction spec.

**1. Foster card visual treatment must be unambiguous but not negative**
The foster card needs a visible badge distinct from the tier badge and the rarity badge.
Do not use a padlock (implies locked/restricted). Do not use a clock (implies urgency/
pressure). A leaf, a rescue cross, or a shelter symbol is more appropriate thematically.
The badge colour should not be grey or red — those read as error or disabled states.
A warm amber or green tint-pair treatment is appropriate. The progress bar toward
release should be visible on the card thumbnail in My Animals, not only in the detail
sheet.

**2. The World Map must show rescue pins before they are available**
Harry needs to see upcoming rescue opportunities on the map before he is able to act
on them. A pin showing "rescue available" with a visible animal is motivating; a map
that only shows completed rescues is a blank canvas for a new player and provides no
call to action. The design must specify the state of map pins for: (a) rescue not yet
unlocked (locked pin), (b) rescue available and ready to start, (c) rescue in progress
(foster card in Harry's collection), (d) rescue complete and released.

**3. The Store entry point for rescue missions needs careful naming**
The brief calls this section "Rewards" in the Store. This word may not accurately
describe rescue missions to a child. "Rewards" implies something given; missions require
effort. Possible alternatives: "Rescue Centre", "Wildlife Missions", "Ranger Missions".
The UX Designer should specify the naming and test whether it is clear to the target age
group. The User Researcher notes this as an open naming question, not a UX decision to
be made in the spec without discussion.

**4. Release animation is a critical moment — it must be a celebration, not a removal**
The moment a foster card is released cannot look like a deletion or a card leaving the
collection. It must be a distinct, positive celebration state. The existing confetti/
celebration system (used in Generate Wizard) provides a precedent. The release animation
should show the animal "returning to the wild" (e.g. a card flying to the World Map pin)
with a release certificate / achievement unlocked. The animation should complete before
the card is removed from the collection view — removing the card and then celebrating
is the wrong order.

**5. The Store Rewards section cannot be the only entry point**
If rescue missions are only accessible through the Store, children (and specifically
Harry) who do not visit the Store frequently will miss available missions. The World Map
should be a parallel entry point. The Home screen "featured" section should surface active
missions. The UX spec must define all entry points — a single entry point is a funnel that
will not convert consistently.

**6. Mission progress must be visible across multiple surfaces**
Harry should see his mission progress in: (a) the foster card in My Animals, (b) the
mission detail in the Store/Rescue Centre, (c) the World Map pin, and (d) a home screen
widget/featured card if a rescue is in progress. Invisible progress — progress that exists
in the database but is not surfaced anywhere Harry looks by default — will create the
impression that nothing is happening.

**7. Session length expectations for missions**
Each individual mission task should complete in one app session (under 10 minutes). The
overall rescue mission (3–5 tasks) spans 2–5 days. The UX spec must communicate this
structure at the mission entry point: "3 short missions to rescue" not "complete in
3 days". The former is task-oriented and concrete; the latter is calendar-oriented and
abstract for a younger child.

---

## Risks and open questions

### Risk 1: Over-attachment to foster cards — release causing distress
- **Severity:** High for Harry's profile.
- **Mitigation:** Release must be a celebration and the animal must persist visibly on
  the World Map after release. The design must remove the card without it feeling like
  a loss.
- **Owner:** UX Designer must specify the release flow in detail. [OWNER] should review
  before the spec is approved, given Harry is the specific user.

### Risk 2: Wild/Sea/Lost World categories overlapping with tradeable mechanics
- **Finding:** The `animal-economy-tiers` feature has already implemented a tier system
  that marks Wild/Sea/Lost World animals as non-tradeable. The rescue-only acquisition
  mechanic must be consistent with that tier system. The research finding is that rescue
  as the only path to these animals is motivationally correct — scarcity and special
  acquisition method increases perceived value.
- **Risk:** If there is any other path to obtaining Wild/Sea/Lost World animals (e.g.
  through the Generate Wizard or through a glitch in the marketplace exclusion), the
  rescue mechanic loses its special-acquisition framing. The exclusivity of the rescue
  path must be technically enforced, not just design-documented.
- **Owner:** Developer must confirm that Wild/Sea/Lost World animal generation is gated
  and that no existing data path can produce these animals outside the rescue mechanic.

### Risk 3: Mission naming — "Rescue" vs "Reward" framing conflict
- **Finding:** The brief calls this a "Rewards" section. A reward is passive — received
  for existing behaviour. A rescue is active — requiring deliberate effort. These are
  different psychological contracts with the user. If Harry enters a "Rewards" section
  expecting to receive something and instead finds a list of tasks, he will experience
  the gap between expectation and reality.
- **Owner:** [OWNER] to confirm the intended naming. User Researcher recommendation:
  use "Rescue" or "Missions" language, not "Rewards".

### Risk 4: Loss of foster card if Harry sells or trades it by accident
- **Finding:** The proposed system implies foster cards can be held in My Animals. The
  existing care system applies to owned animals. If a foster card can accidentally be
  listed in the marketplace or sold, Harry loses a card he has invested care effort in.
  This would be experienced as a significant injustice.
- **Mitigation:** Foster cards must be explicitly non-tradeable at the data layer. The
  `for_sale` and marketplace hooks must check foster status and block listing attempts.
  This is a technical requirement that must be specified before Phase C.
- **Owner:** Developer.

### Risk 5: World Map must exist before rescue missions can ship
- **Finding:** The rescue flow depends on the World Map as an entry point and as a
  release destination. The educational games interaction spec already specifies a World
  Map at `/map` but this screen is not yet built. If rescue missions are built without
  the World Map, the entry point and the release destination are both absent.
- **Mitigation:** Rescue missions should be sequenced after the World Map screen is
  built. Alternatively, the Store/Rescue Centre can serve as the sole entry point for
  an MVP, with World Map integration as a Phase 2 enhancement. [OWNER] to confirm
  sequencing.
- **Owner:** Product Owner to sequence.

### Open question 1: How many Wild/Sea/Lost World animals exist in the catalogue?
The current catalogue prioritises domestic (At Home, Stables, Farm) animals for the
Generate Wizard. The rescue mechanic requires a meaningful set of Wild/Sea/Lost World
animals with IUCN status NT or higher (non-LC). The researcher has not audited the
catalogue for this. Before the PO writes acceptance criteria for mission pacing, the
total count of eligible rescue animals must be confirmed.

### Open question 2: Is there a maximum number of simultaneous foster cards?
Harry could in theory start rescue missions for every available animal and accumulate
multiple foster cards simultaneously. This is likely positive for engagement but creates
a care obligation — if Harry has 8 foster cards, he must complete care actions for all
8 to make progress. A cap on simultaneous foster cards (e.g. maximum 3 active rescues
at once) is worth considering. The UX Designer and PO should address this.

### Open question 3: What happens if Harry never completes the release criteria?
A foster card that sits in Harry's collection indefinitely — because he has met the
minimum care threshold for rescue but never completed the release criteria — is a design
edge case. The card sits in a perpetual "in care" state. Is there a time limit? A
nudge mechanism? Can Harry actively choose not to release? The spec must define this.

---

## Sign-off

UR findings complete for the store-rewards feature.

UX Designer may proceed to write the interaction spec with the following constraints:
- The release animation and foster-card visual treatment must be designed before the
  mission task list, because the emotional framing of the end state shapes the entire
  mechanic.
- [OWNER] must confirm Harry's emotional response profile to virtual item loss before
  the release mechanic is finalised. This is not a UX call alone.
- The Store section naming ("Rewards" vs "Rescue" / "Missions") must be resolved by
  [OWNER] before the spec is written.

[ ] [OWNER] has reviewed Risk 1 (over-attachment / release distress) before UX begins.
[ ] [OWNER] has confirmed catalogue count of eligible rescue animals (Open question 1).
[ ] [OWNER] has confirmed sequencing relative to World Map build (Risk 5).
