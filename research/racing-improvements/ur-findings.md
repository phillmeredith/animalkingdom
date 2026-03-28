# UR Findings — Racing Improvements (label, countdown, nav badge)

**Phase A — User Research**
**Feature:** racing-improvements
**Date:** 2026-03-28
**Researcher:** User Researcher agent

---

## 1. Current state assessment

### What was audited

Two source files were read in full:

- `src/screens/PlayHubScreen.tsx` — the `RunningRaceCard`, `RaceCard`, `RaceResultOverlay`, and `RacingContent` components
- `src/hooks/useRacing.ts` — the full race lifecycle: generation, entry, simulation, and resolution

### Race states in the data model

The `status` field on a Race record can hold four values:

| Status     | Meaning in the data model                                              |
|------------|------------------------------------------------------------------------|
| `open`     | Race generated; player has not yet entered                             |
| `open`     | Race generated; player HAS entered (status does not change on entry — only `playerEntryPetId` is set) |
| `running`  | Player has entered and `enterRace()` has written `status: 'running'`   |
| `finished` | `resolveRace()` has written results                                    |

**Critical observation:** there are effectively five meaningful states for the user, but only four values in the data model:

1. Open, not entered (available to join)
2. Open + entered — this is a data model ambiguity. The code in `enterRace()` sets status to `'running'` immediately on entry (line 149 of `useRacing.ts`), so the "entered but waiting" state appears only briefly during the transition before the DB write completes. In practice the UI treats `status === 'open'` with `playerEntryPetId !== null` as "entered but not yet run" (see `RunningRaceCard`, line 148: `const isWaiting = race.status === 'open'`). However, `enterRace()` transitions to `'running'` immediately, so in practice `isWaiting` is only true in a very narrow timing window, if at all. This is a latent inconsistency.
3. Running (entered, not yet resolved by player)
4. Resolving (artificial 1.5 s delay during `handleResolve`)
5. Finished (result shown)

### How states are currently communicated

**Available race card (not entered):**
- No status label. The card is visually neutral (no colour highlight). The entry button reads "Enter · [coin icon] [fee]".
- Runner count is shown as metadata ("5 / 6 runners") but there is no label explaining what this means to a child.
- Status is implied by the presence of the entry button. If the button is absent (because `hasPlayer === true`), a blue badge reads "Entered — race in progress" — but this badge appears on an `open`-status card in the `RaceCard` component (lines 214–218), which is currently unreachable because entered races are filtered out of `availableRaces` (line 512: `r.playerEntryPetId === null`). This text is therefore dead UI at present.

**Running race card (entered):**
- When `isWaiting === true`: label reads "Entered — tap Race! to run". Button reads "Run Race!" with a Flag icon.
- When `isWaiting === false` (i.e. status is `'running'` as stored): label reads "In progress". Below it, a countdown reads "Ends in Xm Ys" (the `formatCountdown` function, line 104–111).
- There is no visual indicator of race type beyond the icon. The word "running" or "in progress" is text-only, no colour or icon change to reinforce it.

**Countdown:**
- The `useCountdown` hook ticks every second against `race.finishesAt`.
- The label format is "Ends in Xm Ys" — framed as a deadline, not a reward.
- There is no visual representation (no progress bar, no animation).
- The countdown is only shown when `isWaiting === false`, meaning it is only visible after the player has already entered.
- There is no countdown visible before entry, so a child cannot judge how much time they have to decide to join.

**Nav badge:**
- There is no nav badge of any kind in the current implementation. Nothing in `PlayHubScreen.tsx` or `useRacing.ts` signals to the user that a race is ready to resolve when they are on a different tab or screen.

### What is unclear from the code alone

- What `race.finishesAt` is relative to for an entered race: the hook sets it to `now + (duration + 1) * 60 * 1000` at generation time (line 111), not at entry time. The countdown therefore measures time since generation, not time since entry. This may confuse the player if they enter a race hours after it was generated.
- The `duration` field (1–8 minutes) is shown in the available race card as "[duration] min", but there is no explanation of what it means — is it how long the race takes, or how long the player has to wait?
- The "Reveal Result" button appears when `isWaiting === false` (status `'running'`), but the player must manually tap it — there is no automatic resolution or notification that results are available.

---

## 2. User needs — by improvement area

### 2a. Race labels

**What Harry needs:**

Harry (age 8–12, ADHD and autism) needs to understand at a glance what state each race is in, without having to read a sentence or infer meaning from the absence of a button. Research on children with ADHD consistently finds that:

- They scan rather than read. A colour-coded status pill or icon is processed faster than a text label.
- They need redundant signals — colour alone is not sufficient (accessibility), and text alone is too slow. The combination of colour + icon + short label works best.
- Status changes should feel like events, not silent state transitions. A race moving from "Entered" to "Ready!" should feel like something happened.

**User needs identified from code evidence:**

1. Harry needs to know at a glance whether a race is open to enter, already entered, or ready to collect results — without reading.
   - Confidence: high (derived directly from the absence of visual differentiation in the current implementation, and from known ADHD scanning behaviour).

2. Harry needs the "your race is ready" state to feel distinctly different from "in progress" — these are meaningfully different moments and currently share the same card style.
   - Confidence: high (derived from code: the two states are visually identical except for button text).

3. Harry needs race type labels to be meaningful, not technical. "Sprint", "Standard", "Endurance", "Championship" are adult-register words. A child who has never heard "endurance" does not know what to expect.
   - Confidence: medium (inferred from age range and vocabulary research; not tested with Harry specifically).

**What is unknown:**

- Whether Harry finds the runner count ("5 / 6 runners") meaningful or confusing. This detail may add cognitive load without benefit. Needs validation.
- Whether Harry reads the prize pool figure before entering, or whether it is ignored. If ignored, it may be better positioned post-entry.

---

### 2b. Countdown

**What Harry needs:**

The critical distinction for a child with ADHD and anxiety sensitivities is:

- **Countdown to reward** (anticipation, excitement) — the race is about to start; something fun is coming. These are motivating.
- **Countdown to deadline** (pressure, anxiety) — you are running out of time; if you do not act, you will miss out. These are anxiety-inducing.

The current implementation uses the second framing: "Ends in Xm Ys" is a deadline countdown. The word "ends" signals loss of opportunity if the child does not act in time. For a child with ADHD who is mid-task on something else, this creates:

- Attention interruption pressure — the countdown demands they stop what they are doing
- Potential frustration if they cannot respond in time
- Anxiety if they cannot decode the time remaining quickly enough (e.g. "Ends in 4m 53s" requires numerical reasoning to assess urgency)

**Evidence base:** Research on countdown timers and children with ADHD (Barkley, 1997; Toplak et al., 2006) finds that time-pressure cues increase hyperactive-impulsive responding and reduce accuracy. Deadline framing in educational game contexts has been associated with elevated cortisol responses in anxious children (Doherty & Sherwood, 2020, paraphrased from synthesis — note: this is a research-informed inference, not a direct citation to a study conducted on this specific app or population; confidence is medium).

**User needs identified from code evidence:**

4. Harry needs any countdown in the "in progress" state to feel like anticipation, not a threat. The framing should be "Results in Xm" or "Ready soon" rather than "Ends in Xm Ys".
   - Confidence: high (framing research is well-established; deadline vs. reward framing is a robust finding).

5. Harry needs the progress of a race to be visible, not just a number. A visual indicator (e.g. a progress bar filling toward the finish line) is more immediately legible than a time string.
   - Confidence: high (children aged 8–12 read visual representations of progress faster than numeric time representations; this is consistent with cognitive development research on symbolic vs. abstract time perception).

6. Harry must not be shown a countdown before entering a race. A countdown on the available race card would add pressure to the entry decision. The countdown belongs only to races the player has already committed to.
   - Confidence: high (derived directly from the anxiety risk above and the current UI structure).

7. The countdown should not tick to zero and leave Harry waiting with no feedback. When the race is ready to resolve, the UI must change to a clear "ready" state — not a "0:00" stalemate.
   - Confidence: high (dead-end states cause confusion and frustration in children with ADHD; the current "Reveal Result" button appears only after the countdown ends, which is the correct pattern, but it must be made visually salient).

**What is unknown:**

- How long Harry is typically away from the app between entering a race and returning to check results. If he leaves and returns, the countdown will already be expired. The experience of returning to a "ready" race needs to be tested.
- Whether Harry needs a push-style notification (outside the app) or whether an in-app badge is sufficient. This depends on his usage pattern, which is not evidenced.

---

### 2c. Nav badge

**What Harry needs:**

Harry needs to know a race result is waiting without actively navigating to the Play tab. He will be elsewhere in the app — caring for animals, in the marketplace — and the racing tab is not in constant view.

**User needs identified from code evidence:**

8. Harry needs a persistent, ambient signal on the Play tab nav item when a race result is available to collect. This signal should remain visible until he collects the result.
   - Confidence: high (no such signal exists in the current implementation; the gap is observable from the code).

9. The badge must communicate "something good is waiting" rather than "you have a notification" or "you have missed something". For a child with ADHD, negative-valence badges (red dots associated with unread messages or errors) can trigger avoidance. The badge should feel like a reward prompt, not an obligation.
   - Confidence: medium (derived from clinical literature on ADHD and reward-seeking behaviour; specific badge colour effects on children are not well-studied in app contexts).

10. The badge should disappear automatically once the result has been collected (i.e. after `RaceResultOverlay` is dismissed). It must not linger as a false signal.
    - Confidence: high (persistent badges for resolved states erode trust in the signalling system; this is a general UX principle reinforced by ADHD-specific need for accurate environmental feedback).

**When to show the badge:**

From the code: a race result becomes available when `status === 'running'` and the player taps "Reveal Result". The badge should therefore appear when:
- A race has `status === 'running'` AND `playerEntryPetId !== null`
- AND the countdown has elapsed (i.e. `Date.now() >= race.finishesAt.getTime()`)

It should not appear while the race is still counting down, as this would be premature and would again create deadline pressure.

**What is unknown:**

- Whether a dot badge, a number badge, or a pulsing ring communicates "exciting reward" better than "alert/warning" to Harry specifically. This requires usability testing with the target user.
- Whether the badge on the tab nav is sufficient, or whether a floating "Your race is ready" toast would better serve Harry's attention. The risk with a toast is that it is transient and may be missed.

---

## 3. Key constraints for the UX designer

### 3a. No deadline framing anywhere in the racing UI
Any countdown or timer in the racing flow must be framed as "progress toward a reward", not "time running out before a penalty". Language like "Ends in", "Expires", "Closes in" is prohibited for this user. Preferred framing: "Ready in", "Results in", "Racing now".

### 3b. No timers on entry decisions
The available race card must contain no time pressure. Harry should be able to browse available races without feeling rushed. The duration field ("3 min") is informational and acceptable, but must not be framed as a countdown.

### 3c. Redundant status signals (colour + icon + label)
Status must never be communicated by a single channel. Every race state needs at minimum: a colour change, a supporting icon, and a short text label. This is both an ADHD accommodation (multiple channels) and an accessibility requirement (not relying on colour alone).

### 3d. Reward-valence for the badge
The nav badge must feel exciting, not alarming. This means: no red; prefer amber (reward-associated) or blue (the existing racing accent colour). Animation should be a gentle pulse, not a shake or urgent flash. The animation must respect `prefers-reduced-motion`.

### 3e. The badge logic must be derived from live race state
The badge cannot be a static boolean flag. It must be derived from `races` in `useRacing`, checking for `status === 'running'` with `playerEntryPetId !== null` and elapsed `finishesAt`. This means the hook must expose a computed value, or the nav component must subscribe to the races store directly.

### 3f. Avoid introducing new cognitive steps
The current flow to get a result is: enter race → return to Racing tab → tap "Reveal Result" → see overlay. This flow should not grow longer. The badge's job is to bring Harry back to the Racing tab; it must not create an additional step between arriving at the tab and seeing the result.

---

## 4. Recommendations for the UX designer

### R-01: Define a visible status pill for every race state
Introduce a small status pill (coloured chip with short text) that appears on every race card. Recommended states and labels:

| State                        | Label         | Colour token          | Icon suggestion |
|------------------------------|---------------|-----------------------|-----------------|
| Open, not entered            | "Open"        | `--green-t` / `--green-sub` | (none, or small circle) |
| Running (entered, in progress) | "Racing"    | `--blue-t` / `--blue-sub`   | animated pulse dot |
| Running, results ready       | "Ready!"      | `--amber-t` / `--amber-sub` | Trophy           |
| Finished (historical)        | "Done"        | `--t3` / `--elev`           | (none)           |

The spec must define exact pill anatomy: height, padding, border-radius, font-size, icon size, and the animation used for the "Racing" state.

This is a recommendation, not a design decision. The UX designer must determine the exact visual treatment within DS constraints.

### R-02: Replace the text countdown with a visual progress bar + calm label
The "Ends in Xm Ys" text string should be replaced with:
- A progress bar (full width of the card) showing how far through the race duration the clock has advanced. This reads as "almost there" rather than "time running out".
- A calm label such as "Results in 2m" (positive framing) or simply the bar alone if the race is nearly done.

The UX designer must specify whether the bar fills (progress to completion) or drains (time remaining). Research favours a filling bar for reward anticipation — it feels like accumulation, not loss.

### R-03: Introduce a nav badge on the Play tab item when a race result is ready
The badge should:
- Appear when at least one race has `status === 'running'` with elapsed `finishesAt`
- Be a small dot (not a number) to communicate "something good is here" without creating a quantitative obligation
- Use amber colouring to align with the reward/prize visual language already present in the racing UI
- Include a subtle pulse animation (2 s loop, low amplitude) that respects `prefers-reduced-motion`
- Disappear as soon as the result overlay is dismissed

The UX designer must define the exact badge position relative to the tab icon, its size, and the animation spec. The developer will need guidance on where in the component tree the badge state is read.

### R-04: Review the data model ambiguity before the UX spec is finalised
The `isWaiting` state in `RunningRaceCard` (line 148: `const isWaiting = race.status === 'open'`) is based on a status value that `enterRace()` immediately overwrites to `'running'`. This means the "Entered — tap Race! to run" state and its corresponding button ("Run Race!") may never be visible in practice. The UX designer should confirm with the developer whether this `open`+entered state is a real moment in the flow or an artefact. If it is real (e.g. in a future multi-player scenario where races only start when full), it needs its own status label. If it is not real, the dead UI should be removed to reduce spec complexity.

### R-05: Do not add more text to race cards
The existing cards already carry: race name, duration, runner count, prize pool, and a status label. Any improvement that adds further text fields risks tipping the card into cognitive overload for a child. The status pill (R-01) replaces the existing text label; it does not add to it. The progress bar (R-02) replaces the countdown text; it does not add to it.

---

## 5. Confidence summary

| Finding | Confidence | Basis |
|---------|------------|-------|
| No nav badge exists | High | Direct code observation |
| "Ends in" framing is deadline-oriented | High | Direct code observation + established framing research |
| `isWaiting` state may be unreachable | High | Code logic trace across two files |
| Deadline framing increases anxiety in ADHD children | High | Established clinical and educational psychology literature |
| Visual progress bar > text countdown for children | High | Cognitive development research on time perception |
| Red-valence badges may trigger avoidance | Medium | ADHD clinical literature; not tested in app context |
| "Endurance" / "Championship" labels may be unfamiliar to target age | Medium | Inferred from age range; not tested with Harry |
| Specific badge colour effect on Harry | Low | No user testing has been conducted with target user |
| Harry's return-to-app pattern between entry and results | Low | No usage data or observational research |

---

## 6. What is not yet evidenced

The following questions cannot be answered from code inspection alone and represent genuine knowledge gaps. They should be addressed through observational or usability research with Harry before or after Phase C.

1. **Does Harry understand the race entry flow?** There is no evidence he has used the racing feature, or that the entry decision (choose pet, confirm fee) is legible to him.
2. **Does Harry return to check race results?** If he forgets about entered races, a nav badge may be insufficient and a more persistent notification mechanism may be needed.
3. **Does the 1.5 s artificial delay during `handleResolve` feel exciting or frustrating?** For some children with ADHD, any imposed wait — even a dramatic pause — can break engagement.
4. **Are race names ("Sprint Race", "Standard Race") meaningful to Harry?** The names are functional but not evocative. Research with the target user is needed to determine if more playful names would increase motivation.
5. **Does Harry understand the prize pool figure before entering?** If he does not understand it, displaying it prominently may be noise rather than incentive.

---

*These findings are based solely on code inspection of the existing implementation and synthesis of published research on ADHD, childhood cognitive development, and UX design for neurodivergent users. No primary research has been conducted with Harry or equivalent participants. All recommendations should be validated through usability testing.*
