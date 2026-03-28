# UR Impact Assessment — Technical Audit 2026-03-28

**Role:** User Researcher
**Date:** 2026-03-28
**Source defects:** Technical audit 2026-03-28 (11 defects across CRITICAL and HIGH bands)
**Primary user:** Harry, child aged approximately 7–12, using an iPad Pro 11-inch
**Confidence levels:** HIGH = robust multi-source evidence | MEDIUM = single source or inference | LOW = assumption or proxy data only

---

## Purpose of this document

This assessment translates technical defects into user harm. It is not a bug triage document. Its purpose is to ensure the team understands whose experience is being damaged and how, before deciding fix priority.

---

## 1. Trust impact — which bugs damage Harry's trust in the app

### Coin-loss bugs (acceptSellOffer, buyItem) — SEVERE trust damage

**HIGH confidence** (well-established in children's digital product research)

These are the most trust-damaging defects in the audit. Harry uses coins as his primary measure of progress and status. Losing coins without receiving the item they were spent on is not a minor inconvenience for a child — it is a felt injustice.

Children aged 7–12 have a sharp sense of fairness. Research on children's responses to perceived unfairness in games (Steinbeis & Singer, 2013; wider game design literature on children's virtual economies) consistently shows that a single instance of perceived theft — even unintentional — creates disproportionate negative affect compared to an equivalent real-world loss. The virtual coin means more, not less, because the child worked to accumulate it within the rules of the game they accepted.

Critically, Harry has no mental model for a "data corruption bug". He has only one available interpretation: the app took his coins and didn't give him what he paid for. This will be experienced as the app cheating him. A child who feels cheated does not file a bug report — they stop trusting the app, and may stop using it.

The `wallet?.balance always 0` bug compounds this. If Harry cannot see his correct balance during an auction, he may believe he is poor when he is not. He may lose bids on animals he could have afforded, feel frustrated, and attribute this to the app being broken or unfair — again, before any actual coin loss has occurred.

**wallet?.balance = 0 specifically**: this manifests as "you can't afford this" messages on items Harry may be able to afford. For a child this reads as the app calling him out as unable to participate. It is exclusionary in feel, even if technically accidental.

### PlayHubScreen crash — moderate trust damage

A blank screen with no way back is deeply disorienting for a child who is not a troubleshooter. Harry's likely response: tap everything, find nothing works, close the app. If this happens during or after a race — an emotionally invested moment — the trust damage is amplified because the crash occurs at a high-value point in his session.

### No global error boundary — moderate trust damage

Any unhandled error produces a blank white screen. This is indistinguishable from the app being completely broken. Harry has no mechanism to distinguish "this one thing crashed" from "the whole app is gone". He will likely assume the latter. Repeated exposure to blank screens trains him to expect the app to fail.

---

## 2. Engagement impact — which bugs are most likely to make Harry stop using the app

Priority order by disengagement risk:

**1. PlayHubScreen crash (CRITICAL)**
Racing is the highest-engagement mechanic in Animal Kingdom for the target age group. Speed, competition, and outcomes are among the top curiosity and engagement drivers for ages 8–12 (confirmed in ur-findings animal-detail-modal-v3 — superlatives and competitive framing drive repeat engagement). If the race hub crashes on a tap, Harry loses access to the feature most likely to bring him back. This is a session-ender, potentially a day-ender.

**2. 4,500+ animals rendered at once (HIGH)**
Children are the most impatient users of any digital product. Slow scroll, dropped frames, and visual lag on an iPad communicate "this is broken" before a child has time to wonder whether it is a performance issue. Harry will not wait for a janky grid to catch up with his scroll. He will swipe away.

This is particularly damaging because exploration — browsing animals — is a natural entry point into the app. It is the first thing a child does. If it is slow on first encounter, that first impression is negative and hard to recover from.

**3. 1.8MB bundle / slow initial load (HIGH)**
This affects the very first experience. A child loading an app has a short patience window. If the app takes several seconds to become usable on first open, Harry will have already done something else. The cost is not just this session — it is the habit loop. An app that feels slow to start does not become a daily routine.

**4. No loading skeletons (HIGH)**
Flash of blank content is interpreted by children as the app not working. Where an adult may recognise a loading state, a child's cognitive model is simpler: either content is there or something is wrong. Blank flashes interrupt the experience and create micro-moments of disengagement that aggregate into a sense the app is unreliable.

**5. Coin-loss bugs (CRITICAL)**
These are catastrophic for retention when they occur, but they require the specific transaction to be triggered. The performance and crash bugs affect every session. The coin-loss bugs affect sessions involving purchases. The stakes are higher per-incident, but lower-frequency.

---

## 3. Confusion risk — which bugs Harry will not understand

Children aged 7–12 are in the concrete operational stage of cognitive development. Abstract system failures (stacking contexts, transaction integrity, bundle size) are entirely invisible to them. What they see is unexplained behaviour, and their interpretation is always concrete: the app is broken, or the app is unfair.

### Blank screens (no error boundary, PlayHubScreen crash) — HIGH confusion
Harry has no framework for interpreting a white screen. He will not know whether:
- He did something wrong
- The app is broken
- His iPad has a problem
- Something is loading

He has no affordances to recover. There is no error message, no back button offered, no explanation. This is disorienting and mildly distressing for a younger child (7–9). For an older child (10–12) it becomes frustrating and is attributed to poor quality.

### RaceResultOverlay / CardReveal invisible or clipped — HIGH confusion
The race result and card reveal are emotionally significant moments. If the overlay is invisible or partially clipped, Harry sees a broken animation or nothing at all at the peak of his experience. He does not know the result. He cannot tell if the race happened. He may tap repeatedly, accidentally triggering other actions. This confusion is highest-stakes because it occurs at the moment of maximum engagement.

### Wallet balance showing 0 — HIGH confusion
Harry sees 0 coins and believes he is broke. He cannot explain why. He may remember earning coins in a previous session and be baffled. He cannot distinguish between "I spent them all" and "the number is wrong". This produces helpless confusion — the child knows something is wrong but has no way to fix it or understand it.

### Settings feedback failures (SettingsScreen) — MEDIUM confusion
Tapping "delete data" or "export" and seeing no response leaves Harry uncertain whether the action happened. For delete, this is particularly anxious — did he just delete his animals? Did anything happen? He may tap again, not knowing if the first tap worked. For export, he simply does not know if the file was saved. Adults tolerate ambiguity better; children often assume failure when there is no confirmation.

### GradientFade too small — LOW confusion, MEDIUM frustration
Content cut behind the nav bar is noticed but not confused about. Harry will scroll, hit the nav, and see content disappear behind it. He will not understand why. He may think there is less content than there is. This is more a comprehension problem than a confusion problem — he loses access to content he does not know exists.

---

## 4. Priority from user perspective — top 5 defects ranked by user harm

This ranking is based on user harm, not technical severity. It accounts for frequency of impact, emotional weight of the moment of impact, and reversibility of damage from the user's perspective.

### Rank 1 — Coin-loss bugs (acceptSellOffer, buyItem)

**User harm: Catastrophic, irreversible from user perspective**

A child who loses coins and receives nothing has been materially wronged within the rules of the game. He cannot self-recover — the coins are gone and no in-app explanation or recovery path exists. The emotional response (injustice, distrust) persists beyond the session. A single occurrence can end the child's relationship with the app. The `wallet?.balance = 0` bug is treated here as a separate manifestation of the same trust-destruction pattern (financial information the child cannot rely on) and is ranked jointly.

These defects must be fixed before Harry transacts again.

### Rank 2 — PlayHubScreen crash

**User harm: Severe, session-ending, affects highest-engagement feature**

Racing is the feature most likely to create habitual return visits for an 8–12-year-old. Crashing on the Settings icon tap — a likely accidental tap for a child in an action-oriented mode — means Harry loses access to races. Session ends. High probability of not returning in the same day.

### Rank 3 — RaceResultOverlay / CardReveal stacking context bug

**User harm: High, damages the most emotionally significant moments**

The race result and card reveal are designed as peak moments. They are the emotional payoff for participation. If these overlays are invisible or clipped, the payoff is stolen. The child has invested time in the race or card pull and receives nothing. This is distinct from a general performance problem — it targets the reward mechanic directly.

### Rank 4 — 4,500+ animals rendered simultaneously (performance)

**User harm: High, affects every exploration session**

Exploration is the natural default state between active play sessions. Janky scrolling on the animal grid affects Harry every time he browses. For a child on an iPad Pro, frame drops and slow response communicate "this is a bad app" before any content is evaluated. This is not a background problem — it is a foreground, every-session problem.

### Rank 5 — No global error boundary

**User harm: Moderate but compounding**

A blank white screen is distressing and confusing. This defect has low probability per-interaction but non-zero probability across any session. Its harm compounds over time: each blank screen visit reinforces that the app is unreliable. It also means any future bug manifests as the worst possible failure state. The absence of this safety net makes every other bug worse.

**Not ranked in top 5 but flagged:**
- No loading skeletons: affects perceived quality on every screen load, but does not cause data loss or block access
- SettingsScreen silent failures: serious UX problem but lower-frequency for a child who rarely accesses settings
- GradientFade: a real layout problem but not harmful to Harry's core experience or trust

---

## 5. Accommodation considerations — how these bugs affect a child differently than an adult

The following considerations are grounded in developmental evidence (Piagetian literature, NNGroup children's web use research, engagement studies cited in ur-findings animal-detail-modal-v3). Where claims are inferred rather than directly evidenced, confidence level is noted.

### 5a. No mental model for system failure (HIGH confidence)

Adults understand that software crashes, has bugs, and recovers. They distinguish between "the app crashed" and "the app deleted my data". Children do not have this mental model. For Harry, a blank screen means the same as "everything is gone". The absence of an error boundary is not just a UX gap — it removes the child's ability to interpret what happened. The interpretive burden falls entirely on him, with no assistance.

**Implication:** error states must communicate clearly and specifically, not just exist. A generic "something went wrong" message is better than nothing, but a child needs "your race data is safe, try going back" — concrete reassurance about what was not lost.

### 5b. Higher emotional weight on virtual rewards (HIGH confidence)

Children invest emotionally in virtual currencies and collections with intensity that adults typically do not. The coin economy is not a proxy for something else — it is the thing itself. Losing coins is a real loss. This is well-established in children's game design literature and directly relevant to the coin-loss bugs ranked first above.

Harry will not frame a coin loss as "a bug I should report". He will frame it as "the app took my coins". The distinction does not exist for him. The team must treat coin integrity as an emotional safety issue, not only a technical one.

### 5c. Lower tolerance for unexplained waiting (HIGH confidence)

Research on children's attention and patience in digital contexts (NNGroup, 2010; subsequent replication studies) shows children have significantly lower tolerance for loading states than adults, and — critically — they interpret silence (no skeleton, no spinner, no progress indicator) as failure rather than loading. An adult waits; a child concludes it's broken.

The 1.8MB bundle and absent loading skeletons are more damaging for Harry than they would be for an adult user of the same app.

### 5d. Confusion without adult facilitation (MEDIUM confidence)

Many of the defects identified — blank screens, invisible overlays, silent failures — might lead an adult to try troubleshooting steps: refresh, navigate back, check settings. Harry is unlikely to do these independently. He is more likely to abandon and return later, or to ask a parent. The absence of recovery affordances is more costly for a child user.

If Harry asks a parent "why did the app steal my coins?", this creates reputational damage beyond the individual user. A child's negative report to a parent may result in the parent removing the app entirely — a permanent loss of the user, not just a session loss.

### 5e. Disproportionate impact on peak moments (MEDIUM confidence, inferred from engagement literature)

Children's engagement with apps is heavily anchored to reward moments — the reveal, the race result, the new animal unlocked. These are the memories children carry and report to friends. The stacking context bug that makes overlays invisible targets precisely these peak moments. An adult experiencing an invisible race result overlay thinks "there's a bug". A child thinks "the race didn't count" or "I didn't win anything". The emotional damage is at the highest point of the experience.

### 5f. Settings and data management (LOW relevance for Harry, but flag for guardians)

The SettingsScreen silent failure on delete and export is low-relevance for Harry directly — he is unlikely to export data or delete his account. However, if a parent or guardian accesses these settings on his behalf and receives no confirmation, they may believe the action succeeded when it did not (or vice versa). This is a low-frequency but high-stakes failure mode if it affects account deletion.

---

## 6. What is not evidenced — gaps the team should not close with assumption

- **Harry's specific age** is stated as "approximately 7–12" by the project owner. This assessment treats the full range, but the specific age would shift some priorities. A 7-year-old is more distressed by blank screens; a 12-year-old is more resentful about coin loss. Age confirmation would sharpen this assessment. Confidence: LOW on specific age.

- **Harry's experience of the coin economy** — we do not know how much Harry has earned, whether he actively trades, or how frequently he transacts. This affects how likely he is to encounter the coin-loss bugs. No first-party usage data exists. Confidence: LOW.

- **Whether Harry uses the app alone or with a parent present** — the accommodation analysis above assumes largely independent use. If Harry typically uses the app alongside a parent, some of the confusion and abandonment risks are mitigated by adult support. This is unknown. Confidence: LOW.

---

## 7. Summary table

| Defect | Trust damage | Engagement risk | Confusion risk | User harm rank |
|---|---|---|---|---|
| acceptSellOffer coin loss | Catastrophic | High (deters transactions) | High (unexplained loss) | 1 |
| buyItem coin loss | Catastrophic | High (deters transactions) | High (unexplained loss) | 1 (joint) |
| wallet balance = 0 | Severe | High (false exclusion) | High (can't afford = confusion) | 1 (joint) |
| PlayHubScreen crash | High | Severe (blocks racing) | High (blank screen) | 2 |
| Race/CardReveal overlay clipped | High | High (breaks peak moments) | High (result invisible) | 3 |
| 4,500 animals rendering | Low | Severe (every browse session) | Low | 4 |
| No global error boundary | Moderate | Moderate (compounding) | High | 5 |
| No loading skeletons | Low | Moderate | Moderate | 6 |
| SettingsScreen silent failures | Low (for Harry) | Low | Moderate | 7 |
| 1.8MB bundle / slow load | Low | Moderate (first impressions) | Low | 8 |
| GradientFade too small | None | Low | Low | 9 |

---

*This assessment is based on existing developmental and engagement research cited in ur-findings animal-detail-modal-v3, and does not represent direct observation of Harry using the app. Priority rankings reflect user harm, not engineering effort. Fix sequencing decisions belong to the Product Owner.*
