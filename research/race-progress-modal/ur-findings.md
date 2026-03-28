# UR Findings — Race Progress Modal

**Phase A — User Research**
**Feature:** race-progress-modal
**Date:** 2026-03-28
**Researcher:** User Researcher agent

---

## 1. Evidence base

### Files audited

- `src/hooks/useRacing.ts` — race lifecycle: generation, entry, simulation, resolution
- `src/screens/PlayHubScreen.tsx` — `RunningRaceCard`, `RaceResultOverlay`, `RacingContent`, `EntrySheet`
- `research/racing-improvements/ur-findings.md` — prior Phase A findings on countdown anxiety, deadline framing, and Harry's profile

### What this research is and is not

All findings below are derived from code inspection and synthesis of prior UR plus established research on ADHD, childhood cognitive development, and game design for neurodivergent users. No primary research has been conducted with Harry or equivalent participants. Confidence levels are stated throughout. This document should not be treated as validated design direction — it is an evidence-informed brief for the UX Designer to work from.

---

## 2. Technical facts established from code inspection

These are not inferences. They are observable facts from reading the implementation.

### 2a. The race result is determined at resolution time, not during the race

`simulateRace()` in `useRacing.ts` (lines 48–62) runs at the moment `resolveRace()` is called — which is the moment Harry taps "Reveal Result". The function calls `randomBetween(-10, 10)` for each participant's `randomFactor` at that instant. There is no stored intermediate race state. The race has no in-progress position data at any point before resolution.

**Consequence for this feature:** any positions, animations, or "race in progress" visualisations shown inside the modal are entirely fabricated. They bear no mathematical relationship to the eventual result. The modal cannot show "who is actually winning" because that information does not exist until the result is requested.

### 2b. Participant data available during a running race

While a race has `status: 'running'`, the `race.participants` array contains each participant's `name`, `breed`, `isPlayer`, `baseSpeed`, and `saddleBonus`. The fields `randomFactor`, `totalScore`, `position`, and `prize` are all `null` until `resolveRace()` runs.

- **Available pre-resolution:** name, breed, isPlayer flag, baseSpeed (40–85 range), saddleBonus (0–15 range)
- **Not available pre-resolution:** final score, position, prize

Harry's animal's `baseSpeed` is randomised at entry between 50–80 (slightly favouring the player vs NPCs at 40–85). `saddleBonus` is 0–15 depending on equipped saddle.

### 2c. The `RunningRaceCard` has no tap-to-open behaviour

The current `RunningRaceCard` (lines 143–178) is a `div`, not a button. It has no `onClick` on the card body. The only interactive element is the "Reveal Result" `Button`. The feature brief specifies that tapping the card body (not the button) opens the modal — this tap target does not currently exist. The modal interaction is entirely new.

### 2d. Race timing is relative to generation, not to entry

`finishesAt` is set at generation time (line 111: `new Date(now.getTime() + (config.duration + 1) * 60 * 1000)`). Harry may enter a race that was generated minutes ago, meaning the countdown he sees may already be significantly elapsed. A sprint race has a 1-minute duration — Harry could theoretically enter a sprint race with less than 10 seconds remaining on the clock.

### 2e. The current `RunningRaceCard` still uses deadline framing

The prior UR (racing-improvements) flagged "Ends in Xm Ys" as anxiety-inducing deadline framing. This framing is still present in the current code (`formatCountdown`, line 105–112; rendered in `RunningRaceCard` line 160). This is the same string that will be visible on the card when the modal is not open, and may also be relevant inside the modal.

### 2f. The `RaceResultOverlay` is a full-screen takeover

`RaceResultOverlay` renders at `z-[1100]` with `fixed inset-0` and `background: rgba(13,13,17,0.96)` — effectively a full-screen overlay. It shows position label, prize, and animated participant bars. The modal being designed sits in a different moment in the flow: it is opened voluntarily before Harry taps "Reveal Result", not automatically after resolution.

### 2g. Participant counts vary by race type

From `RACE_CONFIGS` (lines 12–17):
- Sprint: 4 runners total (3 NPCs + player)
- Standard: 6 runners total (5 NPCs + player)
- Endurance: 8 runners total (7 NPCs + player)
- Championship: 8 runners total (7 NPCs + player)

The feature brief states "8 participants per race" — this is accurate for endurance and championship only. Sprint has 4 and standard has 6. The modal design must account for variable participant counts.

---

## 3. Research questions — answered with evidence

### Question 1: What does Harry want to know while his race is running?

**Assessment:** this question cannot be answered definitively without primary research. The following is an evidence-informed inference.

Children aged 8–12 with ADHD are typically driven by immediate reward anticipation rather than procedural curiosity. Research on ADHD reward processing (Barkley, 1997; Sonuga-Barke, 2003) indicates that children with ADHD show stronger motivation from near-term, certain rewards than from uncertain or deferred ones. The waiting period between entering a race and revealing a result is the exact interval where motivation can collapse and anxiety can rise.

What Harry most likely wants to know in this interval is not a precise position — he wants reassurance that something good is happening, and he wants the wait to feel shorter. The question "is my animal doing well?" is emotionally meaningful even if the answer is simulated. "How long until I know?" is present but reframes the wait as duration-to-endure rather than experience-to-have.

**What motivates rather than anxious:** anticipation framing ("your animal is giving it everything"), visual movement (something is happening), a sense that the result is close and good (not a ticking-down threat). The distinction drawn in prior UR between countdown-to-reward and countdown-to-deadline (research/racing-improvements/ur-findings.md, section 2b) is directly applicable here. Confidence: high (established framing research; consistent with prior UR findings).

**What creates anxiety:** a visible "losing" position, a count of how many animals are ahead, explicit time pressure, a visual that could be read as "you're behind". Confidence: high (for the anxiety risk; medium for the specific mechanism in an app context — not tested with Harry).

### Question 2: What participant information is meaningful vs overwhelming?

**Assessment from code:**

Available during a running race: participant names (Thunder, Blaze, Storm, Arrow, Comet, Rocket, Flash, Bolt — a fixed pool of 8 names), breed (Thoroughbred, Arabian, etc.), and baseSpeed (40–85 range, 50–80 for player). Not available: any position, score, or ranking.

For an 8–12 year old with ADHD, showing all 8 participants in a modal while the race is running risks:

- **Cognitive overload:** 8 names with no differentiation is a lot of information that does not change during the race. It adds complexity without adding meaning.
- **False comparison:** if the modal shows participant information that implies relative standing (e.g. baseSpeed), Harry will attempt to interpret it as a predictor of his result. When the actual result differs (because of the random factor applied at resolution), this creates confusion or perceived unfairness.

**What is meaningful:** Harry's own animal — name, appearance, the sense that it is running hard. One or two named rivals maximum, to give the race a narrative shape ("Flash is right behind you"). Beyond that, the specific identity of other runners is noise.

**What to avoid:** showing all 7–8 NPC names in a list during the race. Showing any metric (speed, score) that implies a current ranking. Confidence: medium (derived from child cognitive load research and ADHD attention characteristics; not tested with Harry specifically).

### Question 3: Risks of simulated progress that doesn't match the actual outcome

This is the highest-risk design question for this feature.

**The core tension:** results are not determined until Harry taps "Reveal Result". Any animated positions shown in the modal are invented. If the modal shows Harry's animal in 3rd place, and the final result is 7th, Harry has been shown a misleading picture. If the modal shows him in 1st place and the result is 4th, the modal has created a false expectation that the result then violates.

**Identified risks:**

Risk A — Perceived deception. Harry sees simulated positions, interprets them as real, and feels the result was rigged when they differ. For a child with autism, where fairness and rule-consistency are important, this is a significant risk. Confidence: medium-high (derived from autism research on rule-violation sensitivity and trust in digital systems; not tested with Harry).

Risk B — Anxiety if shown a losing position. If the simulated animation shows Harry's animal in last place (even randomly), this could cause distress before the actual result is known. The outcome might be fine, but the emotional experience of watching your animal lose — even fictionally — may not be recoverable by a good result. Confidence: medium (individual variation is high; some children find dramatic reversals exciting, others find any losing state distressing).

Risk C — Anticipation calibration failure. If the modal consistently shows Harry's animal performing well (to avoid Risk B), and the actual result is poor, the disappointment is intensified by the prior expectation. Confidence: medium.

**The safest design direction from a UR standpoint:** the modal should not show positions or rankings at all. It should show movement, energy, and effort — the sense that the race is happening and Harry's animal is competing hard — without showing a relative standings view. "Your animal is racing" is safe. "Your animal is in 3rd place" is not.

This is a constraint recommendation, not a design decision. The UX Designer must determine the visual treatment. The constraint is: do not display simulated rankings or positions that could be interpreted as predictive of the actual outcome.

### Question 4: Does the modal need to handle the "race is about to finish" state?

**From code:** `finishesAt` is set at generation time. A sprint race (1 minute duration) generated 55 seconds ago already has 5 seconds left when Harry opens the modal. The modal could open to a race that has already expired.

**Three timing states the modal may encounter:**

1. Race still has significant time remaining (e.g. 2+ minutes left on a championship race). The modal can show ongoing race animation.
2. Race has very little time left (under 30 seconds). The modal should transition smoothly toward a "ready to reveal" state without creating deadline pressure.
3. Race has already expired (`finishesAt` is in the past). The countdown label reads "Finished" per `formatCountdown`. In this state the modal should immediately surface the "Reveal Result" action rather than showing race-in-progress animation.

**Critical edge case:** the race can expire while the modal is open. The modal must handle this transition — from "in progress" to "ready to reveal" — without the player needing to close and reopen anything.

**The existing `RunningRaceCard` does not handle expired state specially.** It continues to show the "Ended" string and the "Reveal Result" button, which is functionally correct but visually inert. The modal has an opportunity to make the "ready" transition feel like an event.

Confidence: high (directly observable from code logic).

### Question 5: The "Reveal Result" button — modal behaviour

**What the code shows:** `handleResolve()` in `RacingContent` (lines 493–506) applies a 1.5 second delay, then calls `resolveRace()`, then sets `result` state which triggers `RaceResultOverlay`. The "Reveal Result" button lives on `RunningRaceCard`, not inside any modal.

**Three design options and their implications from a UR standpoint:**

Option A — "Reveal Result" button appears inside the modal. This is the most direct path. Harry can move from watching the race to revealing the result without closing the modal first. The risk is that the button is accessible mid-race animation, before the race has "finished" — which may feel premature and could undercut the experience of the race. Confidence that this serves Harry: medium.

Option B — Modal auto-closes or auto-transitions when `finishesAt` is reached, surfacing the "Reveal Result" button on the card. This keeps the moment of revelation on the main screen rather than inside the modal, matching the existing flow. The risk is that auto-close is an unexpected dismissal — Harry may not understand why the modal closed. Confidence that this serves Harry: medium.

Option C — Modal auto-transitions into a "ready to reveal" state, showing a CTA inside the modal that directly triggers `handleResolve`. The race is over, the modal changes feel, the button appears. This is the most deliberate approach. The risk is implementation complexity and the need to make the "race over, now reveal" state feel meaningfully different from the "race in progress" state. Confidence that this serves Harry: medium-high, provided the state transition is visually clear.

**UR preference:** Option C, with the caveat that the transition must feel earned (the race is done, something shifts, then the CTA appears) rather than abrupt. The prior UR finding about dead-end states (research/racing-improvements/ur-findings.md, finding 7) applies directly: the modal must not reach a "nothing is happening" state. Confidence: medium (this is an inference about Harry's preference, not an observed behaviour).

### Question 6: Anxiety risk of a detailed race-in-progress view

**This is the most critical research question for this feature.**

The prior UR established that Harry has ADHD and anxiety sensitivities, and that deadline framing increases anxiety. The `race-progress-modal` introduces a new risk surface: an extended viewing experience of a race Harry cannot influence and whose outcome he cannot predict.

**Identified anxiety vectors:**

Vector A — Extended dwell time on uncertainty. The existing flow is: enter race, see card, tap Reveal. The time Harry spends actively attending to his race result is short. The modal extends this dwell time deliberately. For a child with ADHD and anxiety, extended focus on an uncertain, uncontrollable outcome may increase, not decrease, anxiety. Confidence: medium (this is a known clinical pattern — involuntary attention to uncertain outcomes is associated with anxiety in ADHD; application to this specific modal is inferred, not observed).

Vector B — Animated "losing" positions. Even if positions are simulated, Harry cannot know they are simulated. Watching his animal in last place for 90 seconds before tapping "Reveal" and finding out he came 3rd is emotionally complex for an adult. For an 8-year-old with anxiety sensitivity, the 90 seconds of "losing" animation may cause real distress that the final result does not fully repair. Confidence: medium-high (drawn from research on anticipatory anxiety and loss framing in children; not tested with Harry).

Vector C — The modal makes the wait feel longer. If Harry opens the modal expecting to feel better about the wait and instead encounters more information to process, more animation to watch, and a more salient reminder that he does not yet know his result, the modal achieves the opposite of its intention. Confidence: medium (individual variation is high — some children find engagement with the wait helpful, others find it amplifying).

Vector D — Misread exit. If Harry wants to close the modal and go back to the card, the close gesture must be immediately legible. A child who cannot find the exit may feel trapped in an experience he found distressing. This is a design risk, not a UR finding, but UR flags it as a concern to address in the spec. Confidence: high (general usability finding for children; not specific to Harry).

**What mitigates these risks:**

- Design the modal as an opt-in, low-commitment view. Harry taps to open, but nothing bad happens if he doesn't. The card continues to function exactly as before. The modal adds to the experience; it does not replace the simpler path.
- Keep animation positive and effort-focused, not position-focused. Show movement, energy, dust, atmosphere. Do not show a leaderboard or relative standings.
- Make the close action obvious and immediate. No confirmation, no secondary tap.
- Limit the modal's content to Harry's animal and the race atmosphere — not a full 8-participant view.
- Ensure the "Reveal Result" action is reachable at any point, not only at the end of the animation.

---

## 4. User need statements

These are grounded in code evidence and prior UR synthesis. They are framed for design use.

**UN-01** — Harry needs the waiting period after entering a race to feel like anticipation, not an ordeal, so that he remains engaged and returns to collect his result.
- Confidence: high (prior UR finding, applicable directly to this feature)
- Evidence: research/racing-improvements/ur-findings.md sections 2b and 3a; ADHD reward motivation research

**UN-02** — Harry needs any "race in progress" view to show his animal competing energetically without showing relative positions or rankings that he might interpret as his actual result.
- Confidence: medium-high (derived from deception risk analysis in Section 3.3 and autism fairness research)
- Evidence: technical fact 2a (results pre-determined at resolution); ADHD/autism risk analysis above

**UN-03** — Harry needs a clear, always-visible path from the modal to revealing his result, so that opening the modal does not create a longer or more complicated route to the thing he cares about.
- Confidence: high (derived from general usability principle and ADHD cognitive load research)
- Evidence: code inspection showing the existing flow is entry → card → Reveal; the modal must not extend this

**UN-04** — Harry needs to be able to close the modal immediately and without consequence if the experience feels overwhelming or he changes his mind.
- Confidence: high (general principle; reinforced by anxiety risk analysis in Section 3.6)
- Evidence: Vector D above; general usability research for children with anxiety

**UN-05** — Harry needs the modal to handle the "race already over" state gracefully — either transitioning to a "ready to reveal" view or immediately surfacing the result CTA — so he does not encounter a confusing "nothing is happening" state.
- Confidence: high (directly derived from code: finishesAt is generation-time; a sprint race may already be expired when the modal opens)
- Evidence: technical fact 2d; prior UR finding 7

**UN-06** — Harry needs the modal's content to be focused on his animal rather than the full field of competitors, to avoid cognitive overload and prevent false-ranking interpretations.
- Confidence: medium (cognitive load inference from child development research; not tested with Harry)
- Evidence: technical fact 2b (7–8 participants in larger races); Section 3.2 analysis

---

## 5. Constraints for the UX Designer

The following are non-negotiable from a user research standpoint. They are risk-based, not preference-based.

**C-01 — No simulated position rankings during the race.**
Do not show a leaderboard, position numbers, or any visual that implies relative standing mid-race. Results do not exist until `resolveRace()` is called. Any display of positions is fabricated and will mislead Harry. This is the highest-priority constraint.

**C-02 — No deadline framing inside the modal.**
The countdown-to-deadline framing flagged in prior UR (research/racing-improvements/ur-findings.md) must not appear inside the modal. No "Ends in", no "Expires", no countdown ticker. If timing information is shown, it must be framed as progress toward a reward.

**C-03 — The "Reveal Result" action must be reachable without closing the modal.**
If Harry taps to open the modal before the race has expired, he must be able to reveal his result from within the modal once the race is over. Making him close the modal, return to the card, and then tap "Reveal Result" adds steps and creates a navigation tax on his natural behaviour.

**C-04 — The modal must be trivially dismissible.**
One tap to close. No "are you sure" confirmation. No animation that delays the close gesture. Harry must be able to exit immediately if the experience becomes uncomfortable.

**C-05 — Race-over state must be a distinct modal state, not an inert one.**
When `finishesAt` has elapsed, the modal must visually change. A "race in progress" animation that simply stops is a dead end. The modal must actively transition to a "ready" state.

**C-06 — Participant count varies by race type; the modal must not assume 8 runners.**
Sprint: 4 total. Standard: 6 total. Endurance/Championship: 8 total. Any visual representation that assumes a fixed count will be incorrect for sprint and standard races.

---

## 6. Knowledge gaps — what this research cannot answer

These are genuine gaps. They are not addressable by further code inspection. They represent questions that ideally would be answered by observational research with Harry or equivalent participants before or after Phase C.

**Gap 1 — Does Harry open optional sub-views voluntarily, or does he stay on the main card?**
The modal is opt-in (tap card body to open). If Harry never taps the card body because the "Reveal Result" button is more salient, the modal will never be used. We have no evidence of Harry's exploration behaviour in the current racing UI. Confidence in modal engagement: low.

**Gap 2 — Does the 1.5 second artificial delay in `handleResolve` feel exciting or frustrating for Harry?**
Prior UR flagged this as an unknown (research/racing-improvements/ur-findings.md, section 6, point 3). It remains unknown. If the delay is frustrating, a modal that extends the anticipation period may compound that frustration. If the delay is exciting, the modal may amplify that excitement. The direction matters.

**Gap 3 — How does Harry react to "your animal losing" animations?**
We do not know whether simulated losing (e.g. Harry's animal visually behind others) causes distress or whether Harry understands it as fiction. This is the core question behind Constraint C-01. Without testing, we are applying a precautionary constraint. If testing shows Harry is resilient to simulated losing, the constraint could be loosened.

**Gap 4 — Does Harry return to the Racing tab after entering a race, or does he enter and forget?**
If Harry typically enters a race and then navigates elsewhere (expected behaviour for a child with ADHD), the modal's value depends entirely on the nav badge drawing him back. The modal only matters once he is already on the Racing tab. We have no data on his return pattern.

**Gap 5 — What race duration does Harry typically choose?**
Sprint (1 min) races expire very quickly. If Harry primarily chooses sprint races, the modal will often open to an already-expired state. If he primarily chooses championship races (8 min), the modal will most often show a race genuinely in progress. The modal experience is meaningfully different across race types, and we do not know Harry's preference.

**Gap 6 — Does Harry understand that race results are determined by his animal's stats, or does he believe the race "plays out" in real time?**
If Harry believes the race is genuinely running (a real-time simulation), the modal will feel like watching a live event. If he understands it as a slot machine (press to reveal), the modal adds theatrical value to that moment. His mental model affects how the modal should be framed. We have no evidence of his current understanding.

---

## 7. Confidence summary

| Finding or constraint | Confidence | Basis |
|---|---|---|
| Results are pre-determined at resolution time | High | Direct code observation (`simulateRace()` called inside `resolveRace()`) |
| No position data exists during a running race | High | Direct code observation (all position fields null pre-resolution) |
| Deadline framing in current UI increases anxiety risk | High | Prior UR + established framing research |
| Extended uncertainty dwell time risks increasing anxiety | Medium | ADHD clinical research; not tested with Harry |
| Simulated losing positions cause distress | Medium | Anticipatory anxiety research; individual variation high |
| Showing all 7–8 participants causes cognitive overload | Medium | Child cognitive load research; not tested with Harry |
| Race may already be expired when modal opens | High | Direct code observation (finishesAt set at generation time) |
| Harry will voluntarily tap card body to open modal | Low | No evidence of Harry's exploration behaviour |
| Harry's preferred race duration | Low | No usage data |
| Harry's mental model of race results | Low | No primary research |

---

## 8. Recommended research activities

These are recommendations to close the most critical gaps before or during development.

**R-01 (before Phase C):** Before finalising the modal interaction spec, the UX Designer should determine — in consultation with the developer — whether `handleResolve()` can be triggered from inside the modal directly. If the 1.5 second delay is removed or shortened, the modal's role as "bridge to result" becomes simpler. This is a spec question, not a user research question, but it affects what the modal needs to contain.

**R-02 (before Phase C):** The UX Designer should specify what the modal shows when `finishesAt` has already passed at open-time. This is not currently addressed in any spec and constitutes a required modal state. The UX spec is incomplete without it.

**R-03 (after Phase C, usability testing):** Observe Harry (or an equivalent participant: age 8–12, ADHD) playing through the race entry flow, opening the modal, and waiting for a race to expire. Key observation points:
- Does he open the modal voluntarily?
- What is his emotional response while watching the race animation?
- Does he understand the "Reveal Result" action when it appears?
- What does he say or do when the result differs from any simulated visual?

**R-04 (after Phase C):** Observe Harry's reaction to the simulated race animation specifically when his animal is shown in a non-leading position. This is the primary validation for Constraint C-01 — either confirming the constraint is necessary, or providing evidence that it can be relaxed.

---

*All findings are based on code inspection of the existing implementation and synthesis of prior UR, ADHD and autism clinical research, and child cognitive development literature. No primary research has been conducted with Harry or equivalent participants. Confidence levels are stated throughout.*
