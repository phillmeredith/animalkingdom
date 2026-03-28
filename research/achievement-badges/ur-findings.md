# UR Findings: Achievement Badges (Minimal Catalogue — Unblock checkBadgeEligibility)

> Feature: Achievement Badges (targeted minimal scope)
> Phase: A (User Research)
> Researcher: User Researcher agent
> Date: 2026-03-28
> Scope note: This is not the full Tier 4 Achievement Badges feature. This document
> covers only enough research to support a real, non-stub badge catalogue that
> unblocks `checkBadgeEligibility()` in `useProgress.ts`. It is intentionally
> constrained to the five eligible event types already wired: Racing, Arcade, Care,
> Marketplace, and Rescue.

---

## Evidence base and confidence levels

No primary research with Harry has been conducted on badge or achievement systems
specifically. All findings draw on:

| Source | Quality | Relevance |
|--------|---------|-----------|
| `research/tier3/ur-findings.md` — Harry's profile (ADHD, autism, age context) | High — detailed synthesis | High — establishes his motivation, emotional register, and response to rewards |
| `research/auctions/ur-findings.md` — reward, win/loss, and emotional design findings | High — feature-specific | High — badge awards are a reward moment with the same emotional design requirements |
| `research/racing-improvements/ur-findings.md` — timer, notification, and badge-valence findings | High — Harry-specific | High — nav badge valence findings apply directly to badge notification design |
| `research/schleich-collection-tracker/ur-findings.md` — collection motivation findings | High — Harry-specific | High — collection mechanics are directly analogous to badge earning |
| `research/player-listings/ur-findings.md` — attachment and emotional stakes findings | Medium — authored by UX Designer, not UR | Medium |
| Published developmental psychology: reward, mastery, and collection motivation ages 5-9 | Moderate — well-replicated | High |
| Autism-specific literature: routine, predictability, and unexpected rewards | Moderate — clinical | High |
| ADHD-specific literature: intermittent reinforcement, variable reward schedules | High — well-replicated | High |
| Child HCI: notification overload and badge fatigue | Moderate — limited child-specific studies | Medium |

**Note on Harry's age across the research corpus:**
Existing research documents record Harry's age inconsistently (6, 7, 8, 11 across different
documents). The brief for this feature specifies approximately 6 years old. This document
uses 6 as the working age. Where the age difference materially changes a finding, it is
flagged. In practice, the profile characteristics (ADHD, autism, animal collector,
independent iPad use) are consistent across all documents regardless of the stated age.

### What we do not have

- Any direct observation of Harry using a badge, achievement, or reward-unlock system
- Parental input on whether reward systems have caused Harry distress or over-fixation in
  other contexts (e.g. other games, school reward charts)
- Usage data on which app activities Harry does most frequently — relevant for which
  event types will yield his first badges soonest
- Any test of how Harry responds to a celebration overlay in this specific app (the
  `AuctionWonOverlay` pattern is the closest analogue, but it has not been usability-tested)

All gaps above are accepted risks for this minimal scope. They should be revisited when
the full Tier 4 feature is specified.

---

## 1. Motivation type: What kind of badge rewards work for Harry?

### Evidence summary

Three reward structures are relevant for this age and profile:

**Collection-based** ("earn them all"): Harry is an established collector. The Schleich
tracker research (ur-findings, section 1) documents that the act of cataloguing is
itself pleasurable for him — "not just the objects but the knowledge of the objects:
which ones he has, how many there are, which ones are still to get." This collection
motivation is a primary driver in his psychological profile.

**Milestone-based** ("first time X"): First-time achievements provide a moment of
recognised accomplishment at a point Harry cannot predict in advance. For autistic
children, unexpected positive events are a known source of genuine delight — provided
the event is clearly legible (what just happened, why, what it means). The risk is
confusion if the badge fires without clear connection to what caused it.

**Mastery-based** ("do X 10 times"): Mastery criteria require sustained engagement over
time. For a 6-year-old with ADHD, multi-session goals are attainable but depend on the
goal being visible, trackable, and achievable within a realistic number of sessions.
Mastery badges with opaque progress (e.g. no indication of how many times done vs. how
many needed) will not function as motivators — they will be invisible until they suddenly
fire.

### Assessment

**All three types have a role, but in a strict priority order:**

Priority 1 — Milestone badges (first-time events) are the most appropriate for a minimal
catalogue. They fire early, are non-repeating, require no progress tracking UI, and each
one represents a genuine first. For a 6-year-old, "first race entered", "first arcade
game completed", "first animal rescued" are all achievable in the first few sessions.
They function as a recognition layer over things Harry is already doing.

Priority 2 — Collection badges (earn a set): once enough activity badges exist, a
"collected X from this track" badge is appropriate. This is a meta-badge. Do not add
these to the minimal catalogue — they are Tier 4 scope.

Priority 3 — Mastery badges (do X times): appropriate only if the progress is visible and
the count is low (3-5, not 10+). A 6-year-old's sense of "a lot" tops out much sooner
than adults assume. "Complete 5 races" is an achievable mastery goal. "Complete 50 races"
is not. For the minimal catalogue, mastery badges should be limited to counts of 3 or 5.

**Confidence: medium-high.** Grounded in the established Harry profile and developmental
literature on intrinsic motivation in early childhood (Deci & Ryan, 1985; Lepper & Henderlong,
2000). Not tested with Harry on this specific mechanic.

---

## 2. Discovery: Hidden until earned vs. visible-but-locked upfront?

### Evidence summary

There is a meaningful tension between two design positions for this user:

**Hidden until earned** (surprise delight): the badge catalogue is not visible until a badge
is awarded. Each award is a surprise. For ADHD profiles, unpredictable variable rewards
produce high engagement — this is a well-replicated finding (Barkley, 1997). However, hidden
goals provide no motivational scaffolding: if Harry does not know a badge exists, it cannot
influence his behaviour in advance.

**Visible-but-locked** (motivating target): all badges are shown as greyed-out/locked shapes
with readable names. Harry can see what he is working toward. For autistic children, visible
targets with clear completion criteria provide a predictable structure that reduces ambient
anxiety: he knows what is available, what he has, and what is missing. The racing-improvements
research (section 2b) establishes that Harry needs to be able to predict when an experience
will end and what success looks like — the same principle applies here.

### Assessment

**Visible-but-locked is the right default for Harry, with one constraint.**

The autism-specific literature on predictability and routine (Attwood, 1998; Vermeulen, 2012)
consistently finds that visible structure reduces anxiety in autistic children more effectively
than surprise. The collection tracker research confirms Harry's motivation is driven by seeing
what he has vs. what he does not — this is the same pattern applied to badges.

The constraint: **badge names and criteria must be legible from the locked state.** A locked
silhouette with no name is not a target — it is ambiguity, which creates rather than reduces
anxiety. The locked badge must show its name (e.g. "First Finish Line") and, ideally, a
brief criterion ("Complete your first race"). The name alone at reading level is acceptable
as a minimum.

**Confidence: high.** Grounded in autism-specific predictability research, confirmed by
Harry's established pattern with the Schleich collection tracker (where the "not yet owned"
items are visible and motivating rather than hidden).

---

## 3. Notification: How should badge awards be surfaced?

### Evidence summary

The auctions research (section 5.1) establishes that Harry's ADHD profile means reward
moments require active, persistent signalling — he will not reliably notice a badge that
fires silently or leaves only a small indicator. The racing-improvements research (section
2c) establishes that:

- Nav badges must communicate "something good is waiting" rather than "you have a notification"
- Negative-valence signals (red dots, error-style indicators) risk avoidance for ADHD profiles
- Signals must remain visible until acted upon — transient signals are missed

The auctions research (section 5.4, "AuctionWonOverlay") establishes that celebration
overlays for genuinely significant moments are appropriate and expected. The concern is
accidental dismissal before the moment completes — for autistic children, an overlay that
disappears before they have processed it creates distress.

### Assessment

**Two-layer notification is appropriate for badge awards:**

Layer 1 — A persistent toast (not auto-dismissing) fires immediately when the badge is
earned, visible from wherever Harry is in the app. The toast must:
- Show the badge name in large text, styled warmly (amber or gold treatment, not red)
- Show a brief "what you did" caption ("You finished your first race!")
- Require an explicit tap to dismiss — do not auto-dismiss a badge award toast
- Persist as a nav-level dot indicator until Harry visits the badges section

Layer 2 — A brief celebration moment within the badge catalogue view, visible when Harry
first sees the newly earned badge. This can be a simple entrance animation on the badge
card — not a full overlay. The full overlay pattern (AuctionWonOverlay scale) is reserved
for significant milestones (e.g. completing an entire track's badge set), not every
individual badge.

**On duration:** The auctions research notes that autistic children find unexpected overlay
dismissal distressing (section 5.4, UX-Q6). An auto-dismissing toast for a badge award
would be dismissed before Harry has registered what happened. Tap-to-dismiss is correct for
a first-time badge. For a mastery badge (which Harry has been accumulating toward), the
arrival is expected and a shorter toast is acceptable.

**Confidence: medium-high.** Grounded in Harry's profile across multiple research documents.
The specific duration values (how many seconds before auto-dismiss becomes acceptable) are
not evidenced — the conservative position (tap-to-dismiss) is the appropriate default until
primary research is available.

---

## 4. Volume: How many badges per event type?

### Evidence summary

The Schleich collection tracker research (section 2, assumption A4) established that Harry can
manage catalogues of up to ~200 items per category when images are the primary navigation mode
and categories filter the scope. However, badge catalogues are different from product
catalogues: every badge is equally relevant (there are no "irrelevant" badges in the way that
most Schleich items are figurines Harry does not own). A badge catalogue that is too large
is not just cognitively demanding — it is demotivating, because completion feels out of reach.

Published research on achievement systems in children's games (Hamari & Eranti, 2011;
Lister et al., 2011) finds that badge catalogues perceived as completable within a few weeks
sustain engagement. Catalogues perceived as endless (no visible end state) do not. For a
6-year-old, a few weeks of consistent play means approximately 10-20 sessions, which means
the visible catalogue should contain a meaningful number of badges that can realistically
be earned in that window.

### Assessment

**Minimum viable count per event type: 3 badges.**

Three badges per track provides:
- A first-time badge (earnable in session 1)
- An early mastery badge (earnable within 3-5 sessions)
- A deeper mastery badge (earnable across 10-15 sessions)

This gives the catalogue a sense of depth without being overwhelming. Three badges per
track across five tracks = 15 total in the minimal catalogue. This is within the range
a 6-year-old can visually scan and retain as a mental map of "what I have and what I need".

**Upper bound for this scope: 5 badges per event type (25 total).**

Beyond 25 badges in a visible catalogue, the "completable" mental model breaks. 15-20 is
the recommended target for the minimal scope.

**Do not add "platinum" or tiered badge rarity for this scope.** Rarity tiers within badges
add a second layer of complexity on top of the animal rarity system already present. The
result is a confused value hierarchy. All badges in the minimal catalogue are the same
visual weight. Differentiation comes from the track/activity category, not from rarity.

**Confidence: medium.** The 15-20 range is consistent with children's game design literature
but has not been validated with Harry specifically. The "3 per track" minimum is a defensible
floor; the upper bound is an inference.

---

## 5. Naming: Playful/thematic vs. functional? What reading level?

### Evidence summary

The Schleich tracker research (section 2, assumption A9) establishes that Harry identifies
things by image first, name second. The auctions research (section 1, vocabulary guide)
establishes his effective reading age as approximately Year 2 level (UK Key Stage 1, ages
6-7). The auctions research also establishes a clear preference for emotional, active
language over transactional or adult vocabulary: "It's yours!" over "Purchase confirmed",
"Went to another home" over "Lost the auction".

The racing research notes that functional labels ("Sprint Race", "Endurance") may be
unfamiliar to Harry and should be re-examined. The same principle applies to badge names.

### Assessment

**Animal-thematic naming is correct. Functional naming is wrong for this user.**

Badge names should:
- Reference animals, nature, or Harry's in-app actions in concrete, vivid terms
- Use active, warm language ("First Finish Line", "Wild Rescuer", "Ace Carer")
- Be short: 2-3 words maximum. A 6-year-old reading independently cannot reliably parse
  a 6-word badge name at a glance
- Avoid adult jargon: "Novice Competitor", "Market Participant", "Proficiency" — these
  are wrong for this user. "Race Starter", "Animal Buyer", "Top Carer" are correct
- Avoid negative framing: no badge should be named for what Harry did not do or for a
  difficulty ("Survived 3 Races" implies the races were hard to survive)

The criteria displayed below the name (in the locked state) should be one plain sentence
at Year 2 reading level: "Enter your first race." "Feed an animal 3 times." Not "Accumulate
three consecutive care interactions across a single pet within one session."

**Confidence: high.** Grounded in the established vocabulary evidence and Harry's
demonstrated reading-level profile. Consistent with developmental literacy research for
this age group.

---

## 6. Track structure: Should badges group by activity?

### Evidence summary

The Schleich tracker research confirms that Harry navigates primarily by category, not by
scrolling through an undifferentiated list. The auctions research (section 1) confirms
that he has an established mental model for animal rarity — a structured taxonomy he uses
successfully. The racing-improvements research confirms he responds well to clear status
categories (Open / Racing / Ready) when they are visible and colour-coded.

Developmental research on categorisation in children ages 5-8 (Markman, 1989; Waxman, 1991)
finds that children this age are strongly category-driven — they organise objects by kind
before organising by other attributes. Applied to badges: Harry will find "all my racing
badges" more cognitively manageable than "my 4 most recent badges".

### Assessment

**Badges must be grouped by activity track. Tracks must be the primary navigation layer.**

Five tracks correspond to the five eligible event types:
- Racing
- Arcade
- Care
- Marketplace
- Rescue

Each track should be visually distinguishable by colour, using the Design System tint pair
for each domain (these assignments are for the UX Designer to confirm against DS tokens —
I am not making specific colour decisions here).

Harry benefits from seeing his tracks because:
1. It matches his existing category-based navigation style (Schleich, Explore)
2. It makes progress visible within a domain he cares about ("I have 2 of 3 racing badges")
3. It prevents badge fatigue from a mixed list of unrelated achievements

**Within each track, display both earned and locked badges.** Do not hide locked badges
within the current track view — the visible-but-locked finding (section 2) applies at
track level, not just catalogue level.

**Confidence: high.** Consistent across Harry's profile, the Schleich tracker analogue,
and developmental categorisation research.

---

## 7. Criteria simplicity: What criteria are appropriate for a 6-year-old?

### Evidence summary

The auctions research (section 2, cognitive load assessment) establishes that Harry can
manage a maximum of approximately six concurrent information loads. Adding "work toward an
invisible goal" to an already-loaded activity creates cognitive overhead without immediate
reward. The correct approach is criteria that fire during the natural course of play, not
criteria that require Harry to change his behaviour.

The racing-improvements research establishes that Harry scans rather than reads — criteria
that require him to hold a number in his head across sessions ("do this 10 times") are
accessible only if there is a visible progress indicator showing the current count.

### Assessment

**Criteria must be simple, binary, and observable at the moment of firing.**

Appropriate criteria types (by complexity, in order of recommendation):

Tier A — First-time binary (preferred for at least 1 badge per track):
"Enter your first race." "Complete your first arcade game." "Rescue your first animal."
These fire once, never repeat, require no counting. Harry cannot fail to achieve them if
he uses the feature at all.

Tier B — Low-count mastery (appropriate for 1-2 badges per track):
"Do X three times." "Do X five times." Counts of 3 and 5 are within a 6-year-old's
immediate number sense. Progress toward these must be visible (a counter or progress bar
within the locked badge view). Without visible progress, these function as surprise badges,
not mastery badges.

Tier C — Contextual criteria (appropriate for 1 badge per track, cautiously):
"Win a race." "Buy an animal." These require a specific outcome rather than just
participation. They are achievable but not guaranteed. For Harry, failure to earn a
contextual badge (e.g. playing many races without winning) risks frustration. Use sparingly
and only where the target outcome is within Harry's control and achievable in normal play.

**Explicitly out of scope for this catalogue:**
- Time-based criteria ("complete a race in under 2 minutes") — requires Harry to hold a
  performance target that he cannot know he is approaching
- Combination criteria ("feed AND groom the same animal in one session")
- Comparative criteria ("score higher than your last result")
- Negative-avoidance criteria ("don't let any animal's happiness drop below 50%")

All out-of-scope criteria types introduce either cognitive load, hidden failure states, or
unpredictable firing conditions. None are appropriate for a 6-year-old with autism.

**Confidence: high.** The cognitive load and criteria simplicity findings are among the
strongest in Harry's profile and are consistent across all prior research documents.

---

## 8. Key user need: The single most important thing badges must do for Harry

### Finding

Badges must make Harry's existing activity visible to him as progress.

Harry is already racing, playing arcade games, caring for animals, buying at market, and
generating new animals. He is doing the things that badge criteria will recognise. The
risk is not that he will not engage with the badge system — it is that badges will feel
arbitrary ("why did this appear?") or invisible ("I got something but I do not know what").

A badge must feel like a moment of recognition: "The app noticed what I did and named it."
For an autistic child who may have limited experience of social recognition, and for a
child with ADHD whose self-monitoring of progress is effortful, this external recognition
is genuinely meaningful. It is not a game mechanic. It is the app reflecting Harry's
actions back to him with warmth.

**This determines three non-negotiable design constraints:**

1. The connection between action and badge must be immediate and causal. The badge fires
   the moment the criterion is met, not in a batch at end-of-session. A delayed badge is
   a disconnected badge.

2. The badge notification must name what Harry did. Not just "New badge!" but "You
   finished your first race!" The award toast must state the causal event, not just the
   badge name.

3. The badge catalogue must remain accessible and re-viewable at any time. Harry should
   be able to open his badge collection, see what he has earned, and revisit the moment
   each one was for. This is part of the collection satisfaction that the Schleich tracker
   research confirms as a primary motivation.

**Confidence: high.** This need is directly grounded in Harry's established profile
across the full research corpus — his collection motivation, his need for recognition, his
autism-specific preference for explicit structure, and his ADHD-associated difficulty with
self-monitoring progress.

---

## Assumption map

The following assumptions will be baked into any badge catalogue built from this research.
They are stated explicitly so the UX Designer and PO can challenge them before Phase C.

| ID | Assumption | Risk if wrong | Confidence it is correct | Recommendation |
|----|------------|---------------|--------------------------|----------------|
| A1 | Harry will notice and respond positively to a tap-to-dismiss badge toast | If wrong: toast interrupts flow and causes frustration, especially mid-race or mid-arcade | Medium | Validate by observing Harry's first badge award in a usability session if possible; otherwise accept as a design risk |
| A2 | Visible-locked badges (with name shown) do not create anxiety from an overwhelming list | If wrong: seeing all the badges he does not have causes distress rather than motivation | Medium-high | Cap the visible catalogue at 15-20 entries; watch for signs of overwhelm in early sessions |
| A3 | A 6-year-old can connect the toast copy ("You finished your first race!") to the badge without further explanation | If wrong: the badge feels arbitrary and its meaning does not land | Medium | Toast copy must be specific and causal — generic copy ("New achievement!") makes this assumption fail |
| A4 | Badge tracks mapping 1:1 to activity types (Racing, Arcade, etc.) are legible to Harry | If wrong: Harry does not recognise which track relates to which activity | Medium | Track names must match the screen names Harry already knows — do not rename activities for badge purposes |
| A5 | Harry will not over-fixate on a badge he cannot yet earn and become frustrated | If wrong: a visible locked badge with a criterion he cannot yet meet becomes a source of distress | Medium | The UX must avoid showing progress bars that are permanently at 0 with no visible path to increment |
| A6 | First-time badges across all 5 tracks are achievable in Harry's first 3-5 sessions | If wrong: Harry's earliest badge takes too long and the system appears broken | Medium-high | PO must confirm that each track's Tier A (first-time) badge fires within normal early-session activity |
| A7 | Badge awards in Arcade, Care, and Rescue feel equally meaningful to badges in Racing and Marketplace | If wrong: some tracks feel like "better" or "real" achievements and others feel trivial | Low | Monitor which tracks Harry engages with first; if Arcade badges fire too easily, they may reduce the perceived value of harder badges |

---

## Recommended minimal badge catalogue

This catalogue is a research-informed starting point only. The UX Designer and PO must
review and adapt it. Badge names and criteria are at the recommended reading level and
complexity tier. This is not a design deliverable — it is a constraints-and-examples
input for Phase B.

### Racing track (3 badges)

| Badge name | Criterion | Tier |
|-----------|-----------|------|
| First Finish Line | Enter your first race | A — first-time |
| Race Regular | Complete 3 races | B — low-count mastery (needs visible counter) |
| Race Winner | Win a race | C — contextual outcome |

### Arcade track (3 badges)

| Badge name | Criterion | Tier |
|-----------|-----------|------|
| Game Starter | Complete your first arcade game | A — first-time |
| Brain Trainer | Complete 5 arcade games | B — low-count mastery (needs visible counter) |
| Top Player | Score full marks in any arcade game | C — contextual outcome |

### Care track (3 badges)

| Badge name | Criterion | Tier |
|-----------|-----------|------|
| First Carer | Care for an animal for the first time | A — first-time |
| Good Keeper | Care for animals 5 times | B — low-count mastery (needs visible counter) |
| Happy Home | Keep an animal happy for 3 care sessions in a row | B — low-count mastery (sequential, needs visible counter) |

Note on "Happy Home": "3 care sessions in a row" is only appropriate if the UI makes the
current streak visible on the pet card. If streak is not surfaced, this badge is opaque
and should be replaced with a simpler count criterion.

### Marketplace track (3 badges)

| Badge name | Criterion | Tier |
|-----------|-----------|------|
| First Buy | Buy your first animal from the market | A — first-time |
| Animal Trader | Buy or sell 3 animals | B — low-count mastery (needs visible counter) |
| Big Spender | Spend 500 coins in the marketplace | B — low-count mastery (coin count; keep the threshold achievable relative to typical wallet size) |

Note on "Big Spender": This badge name has a neutral-to-positive tone in context, but PO
should confirm the 500-coin threshold relative to the actual coin economy. If 500 coins is
a very large sum, this badge becomes a long-range goal inconsistent with the minimal scope
intent. Adjust the threshold or replace with a simpler criterion.

### Rescue track (3 badges)

| Badge name | Criterion | Tier |
|-----------|-----------|------|
| First Rescue | Rescue (generate/adopt) your first animal | A — first-time |
| Animal Friend | Rescue 3 animals | B — low-count mastery (needs visible counter) |
| Rare Find | Rescue an uncommon or rarer animal | C — contextual outcome |

Note on "Rare Find": This criterion fires when the Generate Wizard produces an uncommon-or-
above result. Since rarity is partially random, Harry cannot directly control this outcome.
The badge should feel like a lucky discovery, not a blocked goal. The locked badge view
should not show a counter (there is nothing to count toward) — it should show the criterion
as a hint only. If this creates visible-but-unachievable anxiety, replace with a count badge.

---

## Flagged risks for the UX Designer and PO

### Risk 1: Badge fires mid-activity and interrupts flow (HIGH)

A badge that fires while Harry is in the middle of a race, an arcade game, or a
marketplace transaction may interrupt the primary activity. For autism: mid-activity
interruptions that change the screen state unexpectedly are a distress risk. For ADHD:
an interruption mid-task breaks concentration and the primary task may not be resumed.

**Recommendation:** Badge notifications must not interrupt active game states. The toast
should be queued and fired at the next natural break point — specifically after the
existing flow's completion overlay or result screen. The badge toast fires after the race
result overlay is dismissed, not during the race. This is a hook-level implementation
concern: `checkBadgeEligibility()` must fire after the event is recorded but the
notification must be queued, not immediate, when an active overlay is already present.

This is a build constraint the Developer must account for when `checkBadgeEligibility()`
is implemented.

### Risk 2: Mastery badge progress is hidden (MEDIUM)

If a Tier B badge (e.g. "Complete 3 races") shows no progress in the locked state, Harry
has no feedback that his activities are counting toward it. He may complete 3 races and
not notice the badge fired (ADHD prospective memory), or may not know he is close
(no progress signal). Either outcome means the mastery badge fails its motivational purpose.

**Recommendation:** Every Tier B badge in the locked state must show a count: "1 of 3
races completed." This is a UI requirement the UX Designer must specify. It is also a
data requirement: the badge system must persist the current count per criterion, not just
a boolean "earned / not earned".

This is a scope implication for Phase B: the refined stories must include criterion
progress tracking, not just badge award state.

### Risk 3: Badge system feels like school reward chart (MEDIUM)

Autistic children, and children who have experienced school-based reward charts, may have
mixed associations with visible achievement tracking. For some children, a visible list of
"what I have not done yet" reads as a list of failures or demands, not a motivating target.
Harry's relationship to school-based rewards is not evidenced in this corpus.

**Recommendation:** The badge catalogue must not use language that reads as assessment
("You need to do X to pass", "Level 1", "Grade: C"). All language must be celebratory and
forward-looking, never comparative or judgemental. This is a copy constraint, not a
structural one.

**Flag for [OWNER]:** If Harry has had negative experiences with visible reward systems
(star charts, behaviour boards) in educational contexts, the "visible-but-locked" approach
should be reconsidered. This is a parental-knowledge gap that only [OWNER] can resolve.
If uncertain, default to visible-but-locked and monitor for signs of distress.

### Risk 4: Badges are earned too quickly and lose value (LOW-MEDIUM)

If Harry earns 5 badges in his first session (one from each track, all Tier A), the badge
system may become background noise quickly. The first badge should feel significant. If
the first five fire in rapid succession, the award moment is diluted.

**Recommendation:** The PO should consider whether all five Tier A badges should be
achievable in the same session, or whether a soft pacing mechanism exists. For this minimal
scope, accepting rapid early achievement and relying on Tier B/C badges for sustained
engagement is acceptable. The risk is low because the Tier A badges fire once only and the
Tier B badges provide the ongoing motivation layer.

---

## Confidence summary

| Finding | Confidence |
|---------|------------|
| Visible-but-locked badges are correct for Harry's autism profile | High |
| First-time (Tier A) badges are the right foundation for a minimal catalogue | High |
| Badge names must be at Year 2 reading level, 2-3 words, animal-thematic | High |
| Activity tracks are the correct grouping structure | High |
| Toast must be tap-to-dismiss for badge awards, not auto-dismiss | Medium-high |
| 15-20 badges total is the right volume for this catalogue | Medium |
| Mastery criteria must not exceed counts of 5 for this user at this age | Medium |
| Badge toast must not interrupt active game states | Medium-high |
| Tier B badges require visible progress counters to function as motivators | Medium-high |
| School-reward-chart risk should be confirmed with [OWNER] before spec is finalised | Unknown — parental input needed |

---

## Sign-off

UR findings complete. UX Designer and PO may proceed to Phase B.

Outstanding item requiring [OWNER] input before Phase B is locked:
- Has Harry had negative experiences with visible reward/achievement tracking systems
  (school charts, behaviour boards) that would change the visible-locked approach?

---

*All findings based on: synthesis of existing research corpus for this project (listed in
evidence base above), published developmental psychology and autism/ADHD clinical
literature, and Harry's established profile from prior feature research. No primary research
has been conducted with Harry on badge or achievement systems specifically. All confidence
levels should be treated accordingly. Findings should be revisited if primary research
becomes available at any point before the full Tier 4 Achievement Badges feature is built.*
