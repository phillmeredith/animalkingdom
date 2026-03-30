# UR Findings v2 — Rescue and Charity Journey
## Store Rewards / Rescue Mission Mechanic

**Feature:** `store-rewards`
**Researcher:** User Researcher (Phase A revision — owner-directed expansion)
**Date:** 2026-03-30
**Supersedes:** `research/store-rewards/ur-findings.md` (v1, 2026-03-30)
**Primary user:** Harry, ~11 years old, autistic, iPad Pro 11" portrait

**What changed in v2:**
This revision addresses four specific owner requirements that were not fully resolved in v1:
(1) Remove all school-subject framing from mission task descriptions.
(2) Award coins (bounty) at the end of rescue missions — determine framing and amount.
(3) Full-screen celebration at the moment an animal is freed to the wild.
(4) Homepage indicator for animals needing attention and missions in progress.

The revision also widens the scope from mission mechanics to the full rescue-and-charity
journey, identifying where the emotional arc is structurally thin.

**Confidence baseline:** No direct primary research with Harry exists. All findings are
synthesised from analogous product research, age-appropriate game design literature,
conservation education research, and Harry's known profile. Confidence levels are stated
per finding.

---

## Summary of key changes from v1

- Task descriptions in the current `useRescueMissions.ts` seed data contain explicit
  subject labels ("science questions", "geography questions"). These must be rewritten
  as conservation-action language before the feature ships. Specific rewrites are
  proposed in Finding 1.
- Coin bounties at mission end are motivationally sound but the framing matters as much
  as the amount. "Bounty" and "reward fund" language is recommended over "coins earned".
  Suggested amounts are calibrated to the existing economy, not arbitrary.
- The full-screen "freed to the wild" celebration is currently unspecified in the
  interaction spec — the spec covers "Release to wild" confirmation but the celebratory
  moment after confirmation is underdesigned. This is a critical gap.
- The homepage indicator is absent from both the spec and the hook. It is motivationally
  necessary — without a surface-level signal, Harry will forget missions are in progress
  between sessions. This is a retention-critical gap, not a polish item.
- The overall charity journey is thin. "Earn XP and a badge" is not a charity outcome
  for a child — it is a game mechanic wearing conservation clothing. What Harry does for
  the animal must feel consequential, not merely recorded.

---

## Section 1: What we know about Harry

### Profile (updated to age 11)

The v1 findings documented Harry as approximately 8–10 years old. The owner has
confirmed Harry is 11. This is a meaningful distinction for UX and UR purposes.

**What changes at 11 compared to 8–10:**

- **Longer planning horizon.** A child of 11 can hold a multi-day goal in mind without
  constant visual reinforcement. The v1 recommendation that missions be completable
  within 2 sessions was calibrated for a 7-year-old planning horizon. At 11, missions
  spanning 5–7 days are tolerable, and a longer investment can feel more earned.
  Confidence: Medium-high (developmental psychology literature; Piaget formal operations
  onset at approximately 11–12 years).

- **Sharper sense of fairness and authentic consequence.** Children aged 11 begin to
  distinguish "this matters in the real world" from "this is a game mechanic". They are
  more likely to experience shallow charity theming as hollow. The conservation framing
  must be specific and referential to real outcomes, not generic "help animals" copy.
  Confidence: Medium (based on conservation education research for KS2/KS3 transition).

- **Stronger resistance to being taught at.** The transition from KS2 to KS3 is the
  developmental moment when children most strongly resist content that feels like school.
  "Answer 3 science questions correctly" does not just feel like school — it explicitly
  is school. Reframing these as expedition or ranger actions is not cosmetic; it is
  motivationally load-bearing at this age.
  Confidence: High. Directly supported by adolescent learning motivation research
  (Eccles et al., 1993; Wigfield & Eccles, 2000 on declining intrinsic motivation at
  school-subject transitions).

- **Harry's autism profile modifies the above.** Autistic children do not always follow
  neurotypical age-band patterns. Harry may continue to engage with more structured,
  rule-based systems longer than neurotypical peers. The predictability principle from
  v1 remains in force. The planning-horizon estimates above are generalisations —
  individual observation of Harry's actual engagement with longer missions should
  inform future iterations.

### What creates emotional investment in virtual animals for Harry

This is grounded in v1 findings and extended here.

**Agency and identity as carer.** The strongest driver of Harry's investment in the
care system is not the animal itself but what the care actions say about Harry. "I fed
the wolf today" is an identity statement, not a task completion. Mission framing that
positions Harry as a ranger, rescuer, or wildlife expert reinforces a positive
self-concept. Language that positions Harry as a student completing assignments works
against this.

Confidence: Medium. Drawn from self-determination theory (Ryan & Deci), autistic identity
research, and the observed engagement patterns with the existing care mechanic. Not
directly validated with Harry.

**Visible, persistent consequence.** Harry must see that what he did yesterday is still
recorded in the world. The World Map pin as a permanent release record directly serves
this. The homepage indicator (Finding 4 below) serves a more immediate version of the
same need: the mission is in progress, and the world is showing it.

**Narrative coherence.** The rescue arc must hang together as a story Harry can retell.
"I found a koala on the map, went on three ranger missions, brought it into care,
looked after it for a week, and released it back to Australia" is a coherent narrative
Harry can own. A sequence of disconnected tasks that happen to increment a counter is not.
The task descriptions are load-bearing parts of this narrative. Rewriting them (see
Finding 1) is therefore a narrative design decision, not a copy-editing task.

---

## Section 2: Current rescue journey gaps

### 2.1 Mission task descriptions — school-subject language

The current seed data in `useRescueMissions.ts` contains these task descriptions:

| Mission | Task | Current description |
|---------|------|---------------------|
| Grey Wolf | wolf-knowledge-1 | "Answer 2 science questions correctly" |
| Arctic Fox | fox-knowledge-1 | "Answer 2 science questions correctly" |
| Bottlenose Dolphin | dolphin-knowledge-1 | "Answer 3 science questions correctly" |
| Seahorse | seahorse-knowledge-1 | "Answer 3 science questions correctly" |
| Koala | koala-knowledge-1 | "Answer 4 geography questions correctly" |
| Giant Panda | panda-knowledge-1 | "Answer 5 questions correctly in any subject" |

"In any subject" is the least harmful of these but still carries a school-subject frame.
"Geography questions" is the most overtly academic. All six must be rewritten.

**Proposed rewrites — researcher recommendation (not final copy):**

The rewrites below replace the subject label with an action frame that connects to the
animal's conservation context. They should be reviewed by the UX Designer for tone and
by the Product Owner to confirm the underlying game mechanic (answering questions in the
existing quiz system) is unchanged.

| Mission | Proposed rewrite |
|---------|-----------------|
| Grey Wolf | "Complete the wolf ranger briefing — answer 2 questions about wolf behaviour and habitat" |
| Arctic Fox | "Complete the Arctic survival briefing — answer 2 questions about the Arctic fox's world" |
| Bottlenose Dolphin | "Complete the marine mission briefing — answer 3 questions about dolphin life in the ocean" |
| Seahorse | "Complete the reef survey briefing — answer 3 questions about seahorse habitat" |
| Koala | "Complete the bush ranger briefing — answer 4 questions about koala conservation in Australia" |
| Giant Panda | "Complete the sanctuary briefing — answer 5 questions about the giant panda and its forest home" |

The underlying mechanic (quiz questions, completed counter, `done` flag) is unchanged.
Only the display string changes. No hook or database schema changes are required for this.

**Confidence: High** that the reframe matters motivationally. **Low** confidence that
these specific wordings are optimal — they are a starting point, not validated copy.

### 2.2 Emotional arc — what is thin

The current journey from mission start to release has the following structure:

```
Start mission → complete 3 tasks (quiz, care, arcade/checkin) → claim rescue →
foster 3–14 days → release
```

The emotional arc is structurally weak at three points:

**Gap 1: The entry moment lacks urgency or invitation.**
The mission card currently reads as a to-do list. There is no narrative hook that
explains why this specific animal needs Harry specifically, now. The animal exists as a
static card with conservation status and a task list. There is no "distress signal",
no context for why the mission has appeared, no sense that Harry is the one who can help.

For a child of 11, the difference between "a card on a list that I can unlock" and "an
animal that needs rescue and I'm the ranger who got the call" is the entire
motivational difference between medium engagement and deep engagement. The current
spec and seed data are calibrated for the former.

Recommendation: Each mission card and mission brief sheet should open with 1–2 sentences
of urgent, specific context. Not conservation fact-text (which reads like a textbook) but
a mission brief: why now, what happened, what Harry's role is. Example for the Koala:
"Bushfire season has pushed this koala out of its forest. A ranger station near you has
asked for a foster carer while the forest recovers. You're the closest qualified ranger."

**Gap 2: The foster period is passive.**
Once a rescue card is claimed, Harry must wait 3–14 days and perform care actions.
The progress bar and day counter give visibility. But there is no evolving narrative
during this period. The animal's "story" does not advance. Harry has no way to know
whether the care actions are having an effect beyond a counter incrementing.

This is a known-difficult problem in care game design. The most successful analogues
(Tamagotchi, Nintendogs) keep the foster period engaging by showing visible state
changes in the animal's representation — the animal looks healthier, shows new
behaviours, reacts differently. The current architecture (a static image with a
progress bar) does not do this. The UR recommendation is not to redesign the system
now but to flag this as a known engagement risk for future iterations. For the first
build, an intermediate toast or notification during the foster period ("Your koala has
gained enough weight to begin the trek home — 3 more days of care needed") would
bridge this gap at low cost.

**Gap 3: The release decision is framed as binary but feels like a loss.**
The "Release to wild" vs "Keep caring" modal is structurally correct. However, the copy
in the current spec reads as confirmation of a technical action ("You'll earn bonus XP
and a Conservation Hero badge moment"). For an 11-year-old who has cared for this
animal for 7–14 days, the motivating frame for release is not XP — it is that the
animal is now healthy and belongs in the wild. The copy must centre the animal's
outcome, not the player's reward.

Proposed framing direction: "Your koala is strong enough to go home. The bush ranger
station has cleared a safe corridor back to the forest. Ready to release?"

This reframe does not change the mechanic. It changes what the release means to Harry.

---

## Section 3: Charity journey — what does "charity" mean here?

### 3.1 What charity means to an 11-year-old

The term "charity" in the brief needs unpacking before it is designed for. Children of
11 understand charity in several registers:

- **Instrumental charity:** Doing something specific that causes a specific outcome
  ("I collected tins for the food bank and 30 families got food"). The causal chain is
  clear.
- **Symbolic charity:** Wearing a badge, participating in a sponsored event, being
  part of a group that cares. The outcome is diffuse but belonging and identity are
  strong.
- **Transactional charity:** Doing something to earn something (a sticker, a certificate).
  The motivator is the reward rather than the outcome.

All three work for children. The risk is building symbolic or transactional charity
experiences while claiming to deliver instrumental ones. "Earn a Conservation Hero badge"
is transactional charity. "Your care actions contributed to the koala's release, which
adds to the koala population in protected reserves" is instrumental charity — even if
the connection to the real world is metaphorical.

The UR recommendation is to frame the rescue-and-release journey as instrumental charity
even where the outcomes are simulated. Harry should be told, at the point of release,
what his actions contributed to — in language that is specific and real-world anchored,
even if the specific animal is fictional.

Example release certificate language: "You cared for this koala for 7 days before it
was strong enough to return to Gondwana Link, a 2-million-hectare restored bushland
corridor in Western Australia. Conservation rangers report that 400 koalas now live
in protected sections of this corridor."

This is real data (Gondwana Link is a real project). The fictional frame (Harry's
specific koala contributing to it) is clearly metaphorical but grounded. This is how
WWF's adopt-an-animal programme communicates to child supporters.

Confidence: Medium. This is a design recommendation derived from conservation education
best practice, not validated with Harry.

### 3.2 What would make Harry feel genuinely impactful?

The following are ranked by evidence strength for an 11-year-old autistic child:

**Highest impact — specific, named outcomes.**
"The koala you fostered has been released into Gondwana Link Reserve. Koalas in this
reserve now number 412." A number that changes (even if simulated) is more impactful
than a vague statement. Harry can say the number. It is his.

**High impact — a permanent personal record.**
The World Map release pin (specified in v1 and retained in the interaction spec) is the
most powerful single design decision for the charity journey. Every released animal is
permanently visible on the map at its real-world release location. Over time, Harry's
map fills with pins that represent real conservation places, real species, real projects.
This is a portfolio of care, not a score. It must be designed as a primary surface for
the charity journey, not a background feature.

**Medium impact — a certificate or artefact Harry can show others.**
The interaction spec mentions a "release certificate / achievement unlocked" in the
mission complete overlay (§2.4). This is motivationally correct. The certificate must
name Harry, name the animal, name the real-world location/programme, and include a date.
It should be shareable (a screenshot-friendly design) or printable. The ability to show
a parent "I released a koala to Gondwana Link" — with something that looks like a real
certificate — converts a game moment into a social and identity moment.

**Medium impact — real organisation connection.**
Linking each rescue animal to a named real-world organisation (WWF, ZSL, RSPB, Gondwana
Link, Snow Leopard Trust) adds authentic weight. The organisation name should appear on
the animal's mission card and on the release certificate. This does not require a
commercial partnership — it is a factual reference to real programmes.

**Lower impact — coin/XP rewards alone.**
XP and coins signal game progress. They do not signal real-world impact. They should
remain present (see Finding 4 below on bounty framing) but they are not what makes
Harry feel his care work mattered to an actual animal. Do not lead with coins at the
release moment.

---

## Section 4: Coin bounty — framing and amount

### 4.1 Why awarding coins is motivationally correct

The current `releaseToWild` function awards 50 XP but no coins. The owner has specified
that coins (bounty) should be awarded at mission end. This is motivationally sound for
three reasons:

1. It signals that the rescue journey has economic weight in the game world — it is not
   just a "special" system separated from the main economy.
2. It gives Harry a tangible, spendable outcome that connects the rescue loop to the
   store and economy loops.
3. For an 11-year-old, coin awards at effort-scale communicate fairness. A rescue that
   takes 10 days of play should yield more coins than a 1-day arcade session.

The coin award should fire at two points, not one:
- **On mission complete / claim rescue:** A "mission bounty" for completing the task sequence.
- **On release to wild:** A "release bonus" for completing the full foster-and-release arc.

Splitting the reward across two points reduces the risk of Harry feeling he received
nothing during the long foster period.

### 4.2 Suggested amounts — calibrated to economy context

These are researcher recommendations, not final values. The Product Owner and Developer
must cross-reference against the existing economy model (coin earn rates, store item costs).

The principle: **a rescue bounty should feel like a meaningful earn, not a trivial top-up,
but should not make rescue the dominant coin source** (which would incentivise rescue
grinding and undermine the care and arcade economies).

Based on the rarity tiers and the effort involved:

| Animal rarity | Mission bounty (on claim) | Release bonus (on release) | Total |
|--------------|--------------------------|--------------------------|-------|
| Common       | 25 coins                 | 25 coins                 | 50    |
| Uncommon     | 40 coins                 | 35 coins                 | 75    |
| Rare         | 60 coins                 | 50 coins                 | 110   |
| Epic         | 90 coins                 | 75 coins                 | 165   |
| Legendary    | 130 coins                | 100 coins                | 230   |

These amounts assume the existing coin economy. If the Developer confirms that a typical
care session earns approximately 10–15 coins, a common rescue (50 total) represents
roughly 3–5 care sessions of equivalent earn — appropriate for 3–7 days of mission effort.

### 4.3 Framing the coin award

The word "coins" is generic. The brief uses "bounty". UR recommendation: use the word
"rescue fund" or "ranger reward" rather than "bounty" in child-facing copy. "Bounty"
has piracy connotations that clash with the conservation theme. "Ranger reward" is
thematically coherent.

At the claim moment: `"Mission complete. You've earned 25 Ranger Coins for rescuing [Name]."`
At the release moment: `"[Name] is free. You've earned a 25 Ranger Coin bonus for completing
the full rescue."`

Whether to use a renamed currency ("Ranger Coins") or the standard currency name is an
owner decision. The UR recommendation is to use the standard currency but add the
thematic label in the toast: "25 coins — ranger rescue reward".

---

## Section 5: Full-screen celebration — "freed to the wild"

### 5.1 Why the current spec is insufficient at this moment

The interaction spec (§2.6) specifies a confirmation modal before release and a toast
after. The spec does not specify a full-screen celebration at the moment of release.

This is the single most emotionally significant moment in the entire rescue journey.
Harry has spent 3–14 days caring for this animal. The release is the culmination. A toast
saying "released! You earned 50 XP" is a category mismatch between the emotional weight
of the moment and the design response to it.

The owner has explicitly specified a full-screen celebration when an animal is "freed".
The UR findings strongly support this on motivational and emotional design grounds.

### 5.2 What the celebration must do

The celebration moment must:

1. **Make Harry the protagonist, not the observer.** The animation should show the animal
   moving — going somewhere — not the card being removed. Harry is not deleting a card.
   He is releasing an animal back to its habitat.

2. **Complete before the card disappears.** This is specified in v1 (§UX implication 4)
   and must be reiterated here: the card must not visually disappear until the celebration
   animation has run. If the card is gone before the celebration fires, Harry experiences
   a deletion followed by a party. The emotional logic is wrong.

3. **Name a real place.** The celebration should include the release location by name.
   Not "returned to the wild" — "returned to Gondwana Link Reserve, Australia". This is
   what converts a game moment into a charity moment.

4. **Issue the coin award at this moment visibly.** The release bonus should animate onto
   the screen during the celebration — coins "arriving" into Harry's wallet, with the
   amount stated. This is not a toast; it is part of the celebration.

5. **Show the map pin landing.** A brief representation of the World Map pin appearing at
   the animal's release location — even as a static image or simplified illustration —
   connects the celebration to Harry's permanent record.

6. **Offer the certificate.** The release certificate (named above) should appear at the
   end of the celebration as a swipeable final frame before dismissal.

### 5.3 Specific design recommendations for the UX Designer

These are UR recommendations framed as design constraints, not design decisions:

- The celebration overlay must be full-screen (full viewport, z-index above everything).
- The background treatment should reference the animal's habitat, not a generic gradient.
  A forest gradient for a koala; an ocean gradient for a dolphin. This can be achieved
  with a token-mapped palette per habitat type — it does not require bespoke artwork.
- The animal image should animate — a simple transition from static to a slight upward
  motion or scale-out to suggest departure. This is achievable within the existing Framer
  Motion architecture.
- The celebration must not be dismissible by accident. It should auto-progress through
  its phases and then offer a clear "Done" button. A celebration that Harry accidentally
  swipes away mid-animation is a broken moment.
- Duration: approximately 4–5 seconds of animated content, then a static "certificate"
  frame that persists until Harry taps "Done". Do not auto-dismiss the certificate.

### 5.4 Accessibility note for the celebration

The celebration overlay is a significant sensory event for an autistic child. Harry may
enjoy it strongly, or it may be overwhelming, or it may vary day to day. Two provisions:

- Provide a clear, immediately-visible skip or dismiss option throughout the animation
  (small "skip" button in the corner, not just at the end).
- Do not autoplay sound effects without a setting to disable them. The existing app
  settings model should include a "celebration animations" or "sound effects" toggle.
  If that setting does not exist, this celebration is the trigger to create it.

---

## Section 6: Homepage indicator

### 6.1 Why this is retention-critical, not a polish item

The v1 findings flagged homepage surfacing as a UX implication (§5 of v1 UX implications).
This revision escalates it. Here is why it is retention-critical specifically for Harry:

An 11-year-old autistic child is likely to have a fixed app-opening pattern. Harry opens
Animal Kingdom on his iPad, navigates to his preferred section (likely My Animals or
the play hub), does his habitual actions, and closes the app. If the rescue mission
section requires Harry to navigate to Store > Marketplace > Rewards to check progress,
the probability that Harry remembers to do this between sessions is low.

The research basis for this: autistic children's executive function patterns typically
include reduced prospective memory (remembering to do things in the future without an
external cue). An unobtrusive, always-present indicator on the home or My Animals
screen serves as the external cue that Harry's cognitive profile requires.

Confidence: Medium-high. This is based on autism executive function research (Hill, 2004;
Ozonoff & Strayer, 1997) and the known pattern of prospective memory difficulty in
autism. It is not directly validated with Harry.

### 6.2 What the indicator should communicate

The indicator has two distinct states:

**State A — "A rescue animal needs attention today."**
Triggered when: Harry has a fostered animal and has not completed care actions for that
animal today (or in the last X hours, to be defined by PO).
Urgency: Low-medium. This is a nudge, not an alarm. The animal will not die.
Required information: Which animal. How many care actions remain today.

**State B — "A mission is in progress."**
Triggered when: Harry has an in-progress or claimable rescue mission.
Urgency: Low. This is a status reminder.
Required information: Which animal. How many tasks remain. Whether it is claimable now.

**State C — "A new rescue is available."**
Triggered when: A new rescue mission has entered the available state that Harry has not
yet started.
Urgency: Low-medium. This is an invitation.
Required information: Which animal is waiting.

### 6.3 Where the indicator should appear

**Primary surface: My Animals screen.**
Harry visits My Animals more than any other screen. A "Missions" section or a
"Rescue" card group at the top of the My Animals scroll is the natural home for
rescue-status indicators. The indicator should be embedded in the content, not a
floating badge — Harry's visual attention in My Animals is on the card grid.

**Secondary surface: Home screen or Play Hub (if either serves as a "dashboard").**
The brief mentions a homepage indicator. The current app architecture should be checked
for which screen functions as Harry's landing screen. The indicator should appear there.
If the app has no true home screen and the bottom nav is the primary navigation, an
unread badge on the Store nav item (for claimable missions) is the minimum viable
indicator.

**What the indicator must not be:**
- A push notification (outside scope, and likely not appropriate for this audience
  without explicit opt-in from a parent).
- A modal that interrupts the current session when Harry opens the app ("A mission is
  waiting!" blocking the screen). This is disruptive and will cause frustration, not
  motivation.
- A persistent floating button or badge that obscures content.

### 6.4 Design recommendation for UX Designer

The indicator should be implemented as an in-content card or banner at the top of the
relevant screen, using the same surface language as the mission cards (same border,
same tint treatment for the status state). It should be:

- Always present when the condition is true.
- Tappable, navigating to the relevant mission or foster card directly.
- Visually compact — it is one item among many on the screen, not the focal point.

For the badge on the nav item (minimum viable): a small dot indicator using the
existing amber or green tint-pair is appropriate. A number badge ("2") is less
appropriate — Harry does not need to know the count at a glance, he needs to know
something requires attention.

---

## Section 7: Assumptions we are making

The following are assumptions embedded in the current spec and hook implementation
that have not been validated with Harry. They are stated here so the team can make
conscious decisions about whether to validate them before shipping.

### Assumption 1: Harry will understand "fostering" as distinct from ownership

**What we are assuming:** That Harry will understand that a rescued card with status
"rescued" / "In your care" is temporarily in his collection, not permanently owned.

**Risk if wrong:** Harry treats foster cards as permanent pets, becomes distressed when
the "Release to wild" option appears, and refuses to engage with release. The game loop
breaks at its resolution point.

**Evidence status:** Not validated. The v1 UR findings flagged over-attachment as the
primary risk. The interaction spec addresses this through the "In your care" badge and
the homing status block in PetDetailSheet. Whether these visual signals are sufficient
for Harry to internalise the distinction is unknown.

**Recommended action:** [OWNER] should confirm whether Harry understands the
fostering concept before Phase C ships. A brief conversation or show-don't-tell
demonstration (showing Harry the flow on paper or in a prototype) would reduce this
risk significantly. If Harry shows distress at the concept of a favourite animal
leaving, the "Keep caring" option becomes the primary path and the release moment
needs to be introduced very gradually.

### Assumption 2: Harry will find conservation language motivating rather than adult-coded

**What we are assuming:** That words like "conservation status", "IUCN", "native region",
"endangered", and "release corridor" will feel exciting and expert to Harry rather than
formal and school-like.

**Risk if wrong:** Harry skips or ignores the conservation context text entirely, treating
the mission cards as task lists rather than story entries.

**Evidence status:** Not validated. This is drawn from analogous products (WWF UK
children's content) that do use this language with 8–12 year olds. However, Harry's
relationship with formal language may differ from the typical population.

**Recommended action:** Observe Harry's engagement with the conservation text during
the first session after launch. If he scrolls past it, it should be shortened and
made more immediate in the next iteration.

### Assumption 3: The 3–5 task mission structure is the right length for Harry at 11

**What we are assuming:** That 3–5 tasks spanning 3–7 days is the correct effort
calibration for an 11-year-old.

**Risk if wrong:** If too short, missions feel trivial and the animals they unlock
feel underearned. If too long, Harry loses the mission thread between sessions and
disengages.

**Evidence status:** Medium confidence. The v1 recommendation was calibrated for
7–10 year olds (3 tasks, 2 sessions). The update for 11 years extends the horizon but
the specific numbers are not empirically tested for Harry.

**Recommended action:** Start with the current task counts (3–5 per mission) and
observe completion rates. If Harry completes all common missions in the first week,
the tasks are too easy. If no mission has been completed after two weeks, the tasks
are too numerous or too obscure.

### Assumption 4: Coins at mission end will motivate Harry without creating grind behaviour

**What we are assuming:** That awarding coins as a bounty will feel like a reward
without Harry optimising for the most coin-efficient rescue path (grinding the easiest
missions repeatedly).

**Risk if wrong:** Harry completes the two common missions repeatedly (if possible)
for coin farming, bypassing the rarer and more narratively interesting missions.

**Evidence status:** Low confidence. This depends on whether missions can be
"replayed" for coins once completed. The current hook architecture does not appear to
support repeat missions (missions are seeded once, status is final once released).
If that is correct, the grind risk does not apply. The Developer should confirm.

### Assumption 5: The homepage indicator will prompt Harry to open the rescue mission section

**What we are assuming:** That a visible indicator on Harry's primary screen will
increase the frequency with which he visits the rescue mission section.

**Risk if wrong:** Harry notices the indicator but ignores it consistently because
the rescue section requires navigation steps that feel like friction. The indicator
exists but does not convert to action.

**Evidence status:** Not validated. This is drawn from notification psychology
research in mobile apps generally. Harry's specific response to in-app indicators is
unknown.

**Recommended action:** Track (if analytics are available) whether indicator-present
sessions show higher rescue mission engagement than indicator-absent sessions. Adjust
indicator prominence based on observed conversion.

---

## Section 8: Key insight recommendations

These are the anchoring insights that the UX Designer and Product Owner should use to
drive design decisions. Each is stated as an insight (what is true) followed by the
design implication.

### Insight 1: Harry is a ranger, not a student

**What is true:** An 11-year-old autistic child who has chosen an animal care game is
motivated by identity and agency in a carer/expert role. Tasks framed as school work
undermine this identity. Tasks framed as ranger or expedition actions reinforce it.

**Design implication:** Every task description, button label, toast message, and piece
of copy in the rescue flow must speak to Harry as a ranger, conservationist, or wildlife
expert. "Answer 3 science questions" is a student task. "Complete the Arctic briefing"
is a ranger task. This is not copy polish — it is motivational architecture.

### Insight 2: The release is not the end of the relationship — it is the proof of it

**What is true:** The deepest engagement risk in the rescue flow is over-attachment
causing Harry to refuse or delay release. The design solution is not to reduce
attachment but to reframe what release means. Release is the most powerful thing
Harry can do for an animal. It is the proof that his care worked.

**Design implication:** Every piece of language and design around the release moment
must convey that Harry is making the best possible choice for the animal — not giving
it up. The full-screen celebration must be positioned as Harry's conservation victory,
not as the system removing a card. The World Map pin is Harry's trophy, not a consolation
prize for losing the animal.

### Insight 3: Charity requires a specific, nameable outcome — not a badge

**What is true:** "Conservation Hero" as a badge is a game mechanic. What makes a child
feel genuinely charitable is believing their specific action contributed to a specific
real-world outcome. The release certificate with a real programme name and real data
is the design instrument for this. Without it, the rescue journey is themed game content.
With it, it becomes a genuine charitable act in a child's experience.

**Design implication:** Every animal should have a named real-world programme, a named
geographic location, and a specific outcome statement on its release certificate. The
UX Designer must spec this as a first-class element of the release celebration, not an
optional detail. The Product Owner must include sourcing these real-world references
as an acceptance criterion.

### Insight 4: Invisible progress does not exist for Harry

**What is true:** If mission progress is only visible by navigating to Store > Rewards,
the missions will be forgotten between sessions. For Harry's cognitive profile, an
external cue is not optional — it is the mechanism by which Harry remembers a mission
exists. The homepage indicator is not a UX enhancement. It is a functional requirement.

**Design implication:** Mission progress must be surfaced on at least two screens Harry
visits habitually (My Animals, Home/Play Hub). The indicator must be in-content
(not a floating overlay or notification) and must navigate Harry directly to the
relevant animal or mission without requiring further menu navigation.

### Insight 5: The effort-to-reward ratio must feel fair, not generous

**What is true:** For autistic children, unpredictable or variable reward amounts cause
distress. Overly generous rewards reduce the signal that hard work was required.
The coin bounty must be consistent, rarity-scaled, and explained at the point of award.
Harry should be able to predict, before starting a mission, approximately what he will
earn on completion.

**Design implication:** The mission card in the Rewards tab must show the expected coin
bounty for mission completion. Not as a guarantee, but as a visible pre-commitment. "Earn
25 Ranger Coins on rescue" should be visible on the card before Harry starts the mission.
This is motivating (Harry knows what he is working toward) and fair-signalling (the
reward was declared upfront, not handed out arbitrarily).

---

## Updated risks and open questions

The following are additions to or updates of the risks identified in v1.

### Risk A: "Freed to the wild" celebration — no spec currently exists for this moment

**Severity:** High. The owner has explicitly specified this as a requirement. The
interaction spec (§2.6) covers the confirmation modal and a toast but not a full-screen
celebration.

**Mitigation:** The UX Designer must add a §2.6b (or equivalent) to the interaction spec
before Phase C begins, specifying the full-screen celebration in the same level of detail
as §2.4 (mission complete overlay). This is blocking for Phase C.

**Owner:** UX Designer.

### Risk B: Coin bounty has no implementation in the current hook

**Severity:** High. `releaseToWild()` in `useRescueMissions.ts` calls `earn(50, ...)`
but this awards XP, not coins (depending on how `earn()` is implemented). The mission
complete / claim path awards nothing. The owner requirement for a coin bounty requires
a hook change. The Developer must confirm whether `earn()` awards coins, XP, or both,
and whether the claim path needs a coin award added.

**Owner:** Developer.

### Risk C: Full-screen "freed" celebration fires inside a motion.div ancestry

**Severity:** Medium. The release flow originates in `PetDetailSheet`, which is itself
a BottomSheet rendered via `createPortal`. The celebration overlay must also be via
`createPortal(content, document.body)` and must not be a child of the BottomSheet's
React tree. If the celebration is rendered inside the sheet's JSX, it will be subject
to the sheet's `backdrop-filter` stacking context and will not correctly occupy the
full viewport.

**Owner:** Developer / Frontend Engineer.

### Risk D: Homepage indicator requires a new surface or slot not currently specced

**Severity:** Medium. The indicator requires design decisions about which screen is
Harry's primary landing screen, what slot the indicator occupies, and what the
interaction on tap does. These decisions are not in the current spec.

**Owner:** UX Designer to spec; Product Owner to confirm which screen serves as the
landing surface.

### Risk E: Mission tasks referencing school subjects are live in seed data

**Severity:** Medium. The seed data in `useRescueMissions.ts` will create these
missions on first mount for any new install. If the task descriptions are not updated
before launch, Harry will see the school-subject language from his first session.
This is a data file change, not a schema change — it is low engineering effort but
must be done before Phase C is marked complete.

**Owner:** Developer (data file edit to task description strings).

### Open question 1 (carried from v1): Catalogue count of eligible rescue animals

Not yet confirmed. Blocking for PO acceptance criteria on mission pacing. The Developer
or Product Owner must audit the `ANIMALS` data file for Wild/Sea/Lost World animals
with IUCN status NT or higher before the PO can write complete acceptance criteria.

### Open question 2 (new): Does `earn()` award coins, XP, or both?

The current hook calls `earn(50, ...)`. The bounty requirement requires coins specifically.
The Developer must confirm the earn API before the PO writes AC for the coin bounty.

### Open question 3 (new): Can missions be replayed once released?

The current seed architecture seeds missions once. Once an animal is released, the
mission is in a terminal state (`releasedAt` set). Can Harry "rescue the same wolf again"
or is each mission a one-time event? This is a product decision with UX and economy
implications. [OWNER] to confirm.

### Open question 4 (new): What is Harry's primary landing screen?

The homepage indicator recommendation assumes a primary landing screen. The current
architecture needs to be checked for which screen Harry lands on when he opens the app.
If there is no home screen (only the bottom nav), the indicator strategy changes.
Developer to confirm current app navigation architecture.

---

## Sign-off

UR findings v2 complete.

**Blocking for Phase C (additions beyond v1):**

- [ ] UX Designer must add a full-screen "freed to the wild" celebration spec (§2.6b or
  equivalent) to the interaction spec. This moment is currently unspecified and is a
  first-class owner requirement.
- [ ] UX Designer must spec the homepage indicator and the My Animals rescue section
  indicator. Location, content, and tap behaviour must all be specified.
- [ ] Developer must confirm whether `earn()` awards coins, XP, or both, so the PO can
  write AC for the coin bounty.
- [ ] Developer must update task description strings in `useRescueMissions.ts` to remove
  school-subject language before Phase C completes (data edit, not a schema change).
- [ ] [OWNER] must confirm Harry's understanding of fostering vs ownership before the
  release mechanic is finalised (Risk 1 from v1, unresolved).
- [ ] [OWNER] must confirm whether missions are one-time events or replayable (Open
  question 3 above).
- [ ] [OWNER] must confirm coin/currency naming ("Ranger Coins" vs standard currency).
