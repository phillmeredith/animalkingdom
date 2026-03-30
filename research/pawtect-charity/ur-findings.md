# UR Findings — Pawtect Charity Donation System

**Feature:** `pawtect-charity`
**Researcher:** User Researcher (Phase A)
**Date:** 2026-03-29
**Primary user:** Harry, ~8–10 years old, iPad Pro 11" portrait

---

## Codebase context

The economy is coin-based, managed by `useWallet`. Coins are earned through marketplace sales, auction wins, racing, care actions, and arcade games. Spending is currently gated on transactions that return tangible items or entries (marketplace purchase, saddle equipment, card packs). There is no existing giving or donation mechanic. The wallet records `totalEarned` and `totalSpent` but has no category for charitable spend. Conservation context exists in the `animals.ts` data model (`conservationStatus`, `habitatThreats`) but is not currently surfaced in any interactive economic mechanic.

---

## Research questions addressed

**1. Does a charity mechanic feel meaningful or punitive to a child player (donating = losing coins)?**

This is the most critical question for this feature, and the answer depends heavily on what the donation is perceived to produce. Research on prosocial behaviour in children aged 8–10 (Eisenberg, Fabes) shows that children at this age are capable of genuine empathy-driven generosity when the recipient and impact are made concrete and visible. Abstract charity ("donate to help animals") generates little motivation; specific, narrative charity ("your 50 coins helped rescue Mira the snow leopard") generates substantially more.

The key design risk is the framing of loss. If donating is presented as "spending coins on charity", children will compare it unfavourably to spending coins on items. The coin balance going down without a tangible item arriving is cognitively similar to being fined, not to giving. The mechanic needs to frame donation as "unlocking" something (a rescue, a conservation outcome, a new animal) rather than "losing" something.

Games that have succeeded with charity mechanics for children (Charity Miles, various scout app mechanics, charity shop simulations) share a common pattern: the output of the donation is made immediately visible, emotionally salient, and attributed to the player's specific action.

Confidence: medium-high. Well-supported by child psychology literature; no direct testing with Harry.

**2. What ratio of donation to reward feels fair?**

No precise empirical answer exists from primary research for this specific context. However, analogous game design evidence suggests:

- Children aged 8–10 expect roughly 1:1 perceived value on any spend that does not yield a physical item. Donating 100 coins should feel like receiving something worth 100 coins.
- The reward does not need to be economic (more coins) — it can be social (an in-game animal saved), narrative (a certificate), or collectable (a special badge). But it must be proportionate and visible.
- Donation should not exceed approximately 10–15% of a typical session's coin earnings if it is to feel voluntary rather than obligatory. If a single meaningful donation event costs 500 coins and a child earns 200 coins in a play session, donations will feel out of reach and the mechanic will be ignored.
- Small, frequent donations (10–20 coins) with immediate visible impact are likely more engaging for this age group than large, infrequent donations with delayed outcomes.

Confidence: low-medium. Based on analogous game economics and child development principles; no empirical testing for this exact ratio.

**3. Should donations be visible to other players (social proof)?**

This is a single-player game — there is no multiplayer leaderboard or visible-to-others mechanic in the current codebase. Social proof in the standard sense (seeing other people donate) is not currently applicable. However, within the single-player frame, a donation wall or conservation ledger visible only to the player (showing "you have helped 7 animals this month") functions as a personal social proof mechanism and contributes to identity construction ("I am someone who helps animals"). This is developmentally appropriate and supported by research on self-concept in middle childhood.

If future multiplayer or shared-profile features are planned, a visible donation record would need privacy and safeguarding consideration — beyond scope for this feature. At the current single-player scope, a personal conservation record is low-risk and potentially high-value.

Confidence: medium. Architecture is single-player so external social proof is moot; personal record recommendation is grounded in child identity development research.

**4. What kind of outcomes should donations produce (unlock animal, rescue animation, certificate)?**

Evidence from analogous games and educational apps identifies the following as high-impact outcomes for this age group, in order of expected engagement:

1. **Named rescue animation** — a specific animal with a name and story is visibly rescued. The child sees the before (endangered, trapped, in need) and after (safe, released, thriving). This is the highest-impact outcome for emotional engagement.
2. **Conservation badge or certificate** — a collectible acknowledgement attributed to the player. Certificates particularly resonate with children who collect achievements across school and extracurricular contexts.
3. **Species fact unlock** — new educational content about the rescued animal becomes available. Functions as a reward for curious children.
4. **Animal added to a "Pawtect Hall" or conservation roster** — not owned by the player, but listed as an animal they helped. Distinct from the owned collection; maintains the framing that wild animals are not possessions.

Outcomes that are likely to feel unsatisfying: additional coins as reward (circular — donating to earn back coins), abstract progress bars with no narrative, unlocking cosmetic items unrelated to the animal.

Confidence: medium. Based on analogous product analysis and educational game design literature.

---

## Key user needs

- Harry needs donations to produce an immediately visible, emotionally concrete outcome — not just a coin deduction and a thank-you message.
- Harry needs the donation amount to feel proportionate to what the reward delivers. An expensive donation with a weak outcome will feel like a tax.
- Harry needs the option to donate to feel genuinely optional, not guilt-driven. Framing matters: "help Mira" is better than "donate or Mira suffers".
- Harry needs a personal record of his conservation contributions that he can browse and feel proud of — equivalent to the satisfaction of viewing his animal collection.
- Harry needs to understand what Pawtect is before he is asked to donate to it. An unfamiliar fictional charity with no established meaning will produce scepticism, not generosity.

---

## Assumptions being made

- **Assumption:** Harry has a discretionary coin surplus that makes donations feel optional. If coin earnings are tight relative to desired purchases, charitable spend will always lose to item spend. The economy balance needs to be checked before this feature is specced.
- **Assumption:** Pawtect is introduced through narrative before the donation mechanic is surfaced. If the player's first encounter with Pawtect is a "donate now" prompt, it will read as a cold solicitation. The brand needs context.
- **Assumption:** Donations are to a fixed in-game charity (Pawtect) rather than a real-world charity. This is confirmed by the brief. Any future pivot to real-world fundraising would require entirely different safeguarding, GDPR, and parental consent considerations.
- **Assumption:** Donations are made with in-game coins, not real money. Confirmed. This is essential and must never be blurred in the UI — in-app purchases for a children's product require parental consent flows not present in this codebase.
- **Assumption:** The donation outcome produces a conservation-themed reward, not a tradeable animal. This assumption is consistent with the `animal-economy-tiers` feature but must be confirmed in spec.

---

## Risks

**Risk 1 — Donation feels punitive if framed as "spending".**
A child watching their coin balance decrease without receiving an item will associate donation with loss. The UI must never show the coin balance decreasing without simultaneously showing the conservation outcome arriving. Severity: high.

**Risk 2 — Donation amounts miscalibrated to session earnings.**
If a single meaningful donation costs more than a typical play session earns, the mechanic will be functionally inaccessible. Economy balance must be confirmed before coin amounts are specced. Severity: high.

**Risk 3 — Pawtect has no established meaning before the mechanic appears.**
Introducing a fictional charity without prior narrative context results in a "who is this?" response rather than engagement. The charity needs an introduction — even a brief one — before the first donation prompt. Severity: medium.

**Risk 4 — Donation outcomes are perceived as cosmetic rather than consequential.**
If the outcome is a badge or a stamp but the animal does not visibly appear to be rescued (no animation, no named animal, no before/after), the donation will feel like a transaction with a decorative receipt. Severity: medium.

**Risk 5 — No conservation record to revisit.**
Without a browsable personal conservation history, donations are transactional and forgettable. The mechanic will not build the intended identity of "I am a conservation champion" without a persistent, reviewable ledger. Severity: medium.

---

## Recommendation

**Proceed with modifications.**

The mechanic is viable for this age group but requires careful framing — specifically, the donation must be structured as "unlock a rescue" rather than "spend coins on charity". The following design constraints should be requirements in the interaction spec:

1. Every donation must produce a named, animated rescue outcome — not a generic progress tick.
2. A personal Pawtect conservation record must be part of the feature scope, not a future enhancement.
3. Pawtect must be introduced through in-game narrative before the player encounters a donation prompt.
4. Minimum viable donation amount should be affordable within a single typical session (no more than 25% of average session earnings).

This feature has a dependency on `animal-economy-tiers` for the reward output framing (rescued animals are conservation-category, not tradeable). Spec should not be written until `animal-economy-tiers` res is resolved.
