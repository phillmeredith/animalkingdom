# UR Findings: Auctions

> Feature: Auctions
> Phase: A (User Research)
> Researcher: User Researcher agent
> Date: 2026-03-28
> Status: Complete — ready for UX Designer and PO review

---

## How to use this document

This document is the primary research input for the UX Designer (interaction spec) and
the Product Owner (refined stories). It does not design solutions. Where it makes
recommendations, those are constraints and risks for the design team to resolve.

The existing `research/tier3/ur-findings.md` contains an earlier, cross-feature treatment
of auctions. This document extends, focuses, and updates that work using the schema
evidence from `src/lib/db.ts` (the `AuctionItem` and `AuctionBid` tables) and the
interaction spec already produced at `spec/features/auctions/interaction-spec.md`.

The interaction spec is noted as "Phase A — ready for Phase B (PO)". This document
reviews that spec for research alignment and surfaces where it diverges from or does not
yet address the evidence.

---

## Evidence base

| Source | Quality | Relevance to this feature |
|--------|---------|--------------------------|
| `research/tier3/ur-findings.md` — prior Auctions section | High — detailed synthesis | High — directly covers this feature |
| `src/lib/db.ts` — `AuctionItem`, `AuctionBid` schema | High — primary source | High — confirms mechanic structure |
| `src/hooks/useWallet.ts` — `spend()`, `earn()`, no hold primitive | High — primary source | Critical — reveals a technical gap |
| `spec/features/auctions/interaction-spec.md` — UX Designer output | High — complete spec | High — used to audit assumption alignment |
| `research/racing-improvements/ur-findings.md` — timer anxiety findings | High — same user | High — timer mechanic directly parallels auctions |
| Memory: Harry's device (iPad Pro 11-inch, ~820px portrait) | High — confirmed | Medium — affects touch target sizing |
| Developmental psychology: economic cognition ages 6-12 | Moderate — replicated | High |
| Child HCI: timer mechanics and anxiety | Moderate — academic | High |
| ADHD clinical literature: deadline framing, impulsive responding | High — replicated | High |

### What we do not have

- Any direct observation of Harry using a time-limited mechanic in this app.
- Usability test data from Tier 2 features (Marketplace, Racing) that share coin mechanics.
- Parental feedback on whether the existing NPC Marketplace has caused coin confusion.
- Data on Harry's actual session length or return rate — relevant to judging whether
  multi-hour auction windows will be experienced as one session or multiple.

Every finding below carries an explicit confidence rating. No finding has been inflated
beyond what the evidence supports.

---

## 1. Harry's motivation — why bid at auction?

### What generate already gives Harry

Harry can already obtain animals through the Generate Wizard. Generation is on-demand,
immediate, and requires no waiting. Every attempt produces an animal. The experience
is about discovery, not competition.

This matters because auctions must offer something meaningfully different, or Harry
has no reason to engage with them. The motivation gap is a real design risk.

### What auctions offer that generate does not

From the schema: `AuctionItem` includes `rarity`. The rarity system (common through
legendary) is already central to Harry's mental model — the Explore Directory, Cards
System, and Generate Rarity Gate all use it. Auctions can offer animals at higher rarity
tiers, or specific breeds not obtainable through generation. This is the core motivation
hook. The spec does not currently state this distinction explicitly.

**User need (confidence: high):**
Harry needs to understand at the point of browsing auctions that these animals are
*different* from what he can generate. The card design must signal this — through rarity
treatment, animal names, or explicit copy — not leave it implicit.

### The emotional appeal of bidding for a child

Children aged 6-9 understand competitive desire intuitively: "someone else wants this
and I want it more." The physical analogy is reaching for the last toy, or wanting the
rare sticker someone else has. The appeal is not primarily financial — it is about winning
a contest.

For Harry specifically, the appeal is likely to be:
- Acquiring an animal he cannot easily get elsewhere (scarcity motivation)
- The anticipation of waiting to find out if he won (intermittent reward, high engagement)
- The feeling of having "beaten" other bidders (competitive satisfaction)

What will NOT appeal to Harry:
- Complex strategy about optimal bid amounts
- Managing multiple simultaneous bids across auctions (cognitive overload risk)
- Any mechanic that feels like he could "get it wrong" and be punished

**Confidence: medium.** Grounded in developmental research on children's reward
motivation and the existing Harry profile. Not directly observed.

### Winning vs losing — the asymmetry

Winning an auction is a genuine moment: Harry gets an animal he wanted and competed for.
The emotional payoff is higher than generation because effort and waiting have preceded it.
The interaction spec's `AuctionWonOverlay` is appropriate for this moment.

Losing, however, requires careful handling. Research on children's emotional responses
to competitive loss (Zarbatany et al. 1985; Asher & Coie 1990) shows that ages 6-9
experience loss as personally meaningful, not abstractly game-mechanical. Harry's autism
profile increases the risk: once he has decided he wants an animal, the expectation of
winning it may be strong and the loss correspondingly distressing.

The key mitigation already in the spec — amber (not red) styling, no use of the word
"lost", "went to another home" framing — is correct and evidenced. This must be held
as a hard constraint, not a nice-to-have.

---

## 2. Cognitive load assessment

### The mechanic stack

An auction requires Harry to simultaneously hold in mind:
1. Which animal is up for auction and why he wants it
2. The current top bid (a number that changes)
3. His own bid amount (a different number)
4. The time remaining (a third value, also changing)
5. His available coins AND his held coins (two views of his wallet)
6. What happens at auction close (the outcome rules)

That is six concurrent information loads. For a child with ADHD and autism, this is
at the upper bound of manageable complexity. Any additional complexity — multiple active
bids, complex bid increment rules, anti-snipe mechanics — will push the experience past
what Harry can handle without distress.

**Assessment (confidence: high):**
The design must reduce, not add to, this stack. The UX Designer's job is to make items
1-6 individually trivial to perceive, not to make them collectively comprehensible.

### The hold mechanic — critical cognitive risk

The `useWallet.ts` hook exposes `spend()` and `earn()`, but no `hold()` primitive. The
interaction spec describes a "held coins" concept in the wallet display ("1,200 (120 held)").

This is the single highest-risk element in the feature from a user perspective.

Harry's mental model of coins is concrete: coins in his wallet are his. When the spec
says coins are "held", the underlying mechanism is that coins are spent at bid time and
refunded at loss. But the word "held" implies the coins never left. If Harry notices his
balance drop after placing a bid and before the auction closes, he will interpret this
as losing coins permanently.

The resolution is not just copy. It requires the wallet display to present an unambiguous
split between "your available coins" and "coins saved for your bids", backed by a
visible, animated refund when a bid is lost. The spec's current "1,200 (120 held)"
display addresses this partially, but the "held" label is adult financial vocabulary.

**User need (confidence: high):**
Harry needs the wallet to show "coins saved for bid" rather than "held" or "reserved".
The refund after an outbid or auction loss must be visually confirmed — an animated
coin-return moment, not a silent balance increment.

### Bid increment simplicity

The spec correctly defaults to stepper-based bidding (not free-text entry) with a minimum
increment. For Harry, the optimal bid UX is one where he does not need to decide a
*number* — he just decides yes or no. The stepper reduces decision load. This is correct.

**Risk:** If the increment is too large relative to Harry's typical wallet balance, even
one bid may represent a significant portion of his coins. The spec's "You'll be almost out
of coins" warning (amber, inline) is appropriate. The PO needs to specify the minimum
increment and the starting bid ranges relative to typical wallet size. See open questions.

---

## 3. Key user flows

### What the existing spec covers well

The interaction spec (`spec/features/auctions/interaction-spec.md`) maps five flows
and seven component states. From a research perspective, the following are well-handled:

- Discovery via the auction hub grid
- Bid placement flow (stepper, confirm, sheet state return)
- Outbid notification via toast
- Win overlay
- Loss handling (toast only, no overlay — correct for low-stakes framing)

### Gaps and risks in the mapped flows

**Flow gap 1: First encounter with auctions (not mapped)**

The spec assumes Harry knows what an auction is and how bidding works. The evidence
(tier3 ur-findings, assumption A5) says this cannot be assumed. There is no first-use
or empty-state onboarding in the spec.

Harry needs at minimum a one-time explanation of the mechanic visible on first visit to
the auction hub — ideally a single sentence integrated into the page rather than a modal
tutorial. "Find an animal you love, offer the most coins before the timer ends, and it's
yours!" is the level of explanation needed. This is absent from the spec.

**Flow gap 2: Returning to a won auction when the overlay was missed**

Flow 3 in the spec states: "If the player is offline, the outcome toast fires the next
time they open the app." But the `AuctionItem` schema has `status: 'won'`. There is no
flow defined for Harry returning to the auction hub and seeing a previously won animal
with status `won` but the celebration overlay already dismissed. Does the card show a
"Won" state? Can he navigate to the animal from there? This path is unspecified.

**Flow gap 3: What happens to a `won` auction card after the animal is delivered**

Once the animal is in `My Animals`, does the auction card disappear from the hub, or
persist in a "completed" state? The empty state implies cards disappear, but this is
not confirmed. Children (particularly with ADHD profiles) are sensitive to things
"disappearing" — a brief victory state on the card before it clears would be appropriate.

**Flow gap 4: Simultaneous active bids**

The schema supports multiple concurrent `AuctionBid` records. The spec does not address
what Harry sees if he has active bids on two auctions simultaneously. The hub grid would
show both as "Your bid: X". The wallet display would show combined held coins. Is there
a bid count indicator anywhere? This needs to be explicitly scoped by the PO.

### Revised flow: Outbid → rebid moment

The spec's outbid toast reads: "You've been outbid! Bid again to stay in." (copy spec)
and also in the outbid toast row: "[Name] went to someone else. Your coins are back."
These are two different states (outbid during an active auction vs. auction ended while
outbid) and the copy in the spec conflates them in places. Specifically:

- During-auction outbid: coins are NOT back yet; Harry is still in the running if he bids
  again. The copy "Your coins are back" must NOT appear here.
- Post-auction loss: coins ARE back; Harry has definitively not won.

The interaction spec's state table (Section 4) does distinguish these states correctly.
But the copy in Section 5 ("Outbid toast: [Name] went to someone else. Your coins are
back.") is the post-loss copy, not the during-auction outbid copy. This should be
clarified before Phase B to prevent a development error.

**User need (confidence: high):**
The during-auction outbid notification must say something like "You've been pipped — want
to offer more?" It must not say "Your coins are back" because they are not back yet.

---

## 4. Risk areas

### Risk A: Coin confusion when balance drops at bid time (HIGH)

Previously identified in tier3 findings (Risk 1). Confirmed by code review.

`useWallet.spend()` deducts coins immediately and writes a transaction record. There is
no hold mechanism in the wallet schema. The "held" concept is entirely a UI abstraction.

This means:
- Harry's visible wallet balance drops when he places a bid
- If he navigates away and returns, his balance is lower than before bidding
- There is no persistent "you have X coins in bids" indicator outside the auction context

The spec's "coins held" display in the wallet header is a mitigation, but it is not
sufficient on its own. The `PlayerWallet` schema has no `heldCoins` field. This means
the "held" amount must be computed at render time by summing active bid amounts from
`AuctionBid` and comparing to auction statuses. This is a hook responsibility that the
spec defers to Phase C without specifying the data source.

**Flag for PO and Developer:** The spec says "wallet shows 1,200 (120 held)" but the
wallet schema cannot produce this figure without a query across `auctionBids` and
`auctionItems`. This must be in scope for the `useAuctions` hook, not an afterthought.

### Risk B: Timer anxiety and impulsive bidding (MEDIUM-HIGH)

Previously identified in tier3 findings (Risk 2) and confirmed by racing-improvements
ur-findings which found the same risk pattern in the racing timer.

The spec addresses this well: the `AuctionCountdown` component uses calm colour
transitions (green → amber → red) and a progress bar. The `aria-live` region updates
every 30 seconds, not every second. Reduced-motion mode stops animation.

One unaddressed element: the spec allows red colouring at "< 10 minutes". For Harry's
profile, 10 minutes may be sufficient urgency that red is appropriate. But if Harry has
already placed a bid and cannot afford to raise it, seeing a red countdown with no
available action creates trapped anxiety — urgency without agency. The design should
ensure that a player who cannot afford to bid higher has a clear "I'm in, let's wait"
state that visually deactivates the urgency signals.

### Risk C: NPC names creating social antagonism (MEDIUM)

Previously identified in tier3 findings (Risk 3).

The `AuctionItem` schema includes `currentBidder: string` — this is the NPC name
displayed as the current high bidder. The `BidHistoryList` component in the spec shows
the last 3 bids with bidder names. If the same NPC name appears across multiple auctions
or multiple bid history rows, Harry may experience this as a recurring antagonist.

The spec does not specify how NPC names are generated or rotated. This is a PO/hook
responsibility. The research finding stands: NPC names must not persist as recurring
characters across sessions, and the outbid copy should focus on the animal, not name
the NPC.

### Risk D: Accidental bids (MEDIUM)

The BidConfirmState requires a two-step confirmation (tap "Place a bid", then tap
"Confirm bid"). This is the correct pattern for an irreversible action involving coins.
The spec includes a "Cancel" button. This is well-handled.

One residual risk: the stepper "+" button on the confirm screen can raise the bid amount
before confirming. A child may tap "+" multiple times thinking it submits, then tap
"Confirm bid" at a higher-than-intended amount. The spec's note "Cannot go below the
minimum valid bid" is correct, but there is no cap on how high the stepper can go relative
to the player's wallet balance. The "You'll be almost out of coins" warning addresses the
low-balance scenario, but a child could raise the stepper to their entire wallet and
confirm. This is technically permitted but experientially risky.

**Recommendation for UX Designer:** Consider capping the stepper at 80% of available
wallet balance, or requiring a second confirmation prompt if the bid amount exceeds half
of available coins. This is a design decision, not a research finding.

### Risk E: Session interruption — auction closes while Harry is away (LOW-MEDIUM)

The spec addresses offline outcome delivery: "the outcome toast fires the next time they
open the app." For Harry's ADHD profile, this cold notification may land without context.
He may not remember he placed a bid. A "You had a bid on this animal" reminder before
the outcome is delivered would help orient him.

This is a low-priority risk because the spec's toast copy ("Your coins are back") already
provides the essential information. The risk is mild disorientation, not distress.

---

## 5. Accommodation notes — autism and ADHD

### 5.1 Time pressure and Harry

Harry has autism and ADHD. These interact with time-pressure mechanics in specific ways
that the UX must account for.

**ADHD effects (confidence: high based on established clinical research):**
- Urgency cues (red colours, pulsing elements, countdown numbers) can trigger
  hyperactive-impulsive responding: bids placed too quickly, at amounts not considered.
- Prospective memory is impaired: Harry may not remember he placed a bid and be surprised
  by the outcome.
- Returning to check auction status requires sustained intent — the nav badge (tab-level
  indicator) is essential, not optional.

**Autism effects (confidence: medium — Harry-specific profile not directly observed):**
- Unexpected state changes — timer extension, being outbid mid-flow — can cause
  disproportionate distress because they violate the expected mental model.
- The anti-snipe timer extension is particularly high-risk: Harry believes the auction
  is ending, builds toward closure, and then the timer resets. This unexpected reversal
  is the type of unpredictability that autistic children find most distressing.
- Clear explanation of the end state ("when the time runs out, whoever offered the most
  wins their animal") must be available at all times during an active bid, not just at
  first encounter.

### 5.2 The anti-snipe mechanic — specific recommendation

The anti-snipe timer extension is mentioned in the tier3 research (assumption A6) and
dismissed as something to handle silently. This document revises that recommendation.

The silent approach is wrong for Harry's profile. A surprise extension with no explanation
reads as a malfunction. The correct approach is:
- Show "A bit more time added!" as a positive event (not a glitch to be apologised for)
- Show this once, briefly (a toast or inline notice, 3 seconds)
- Do not show the before/after timer values side by side — just show the new end time

This is a firm UX constraint, not a suggestion.

### 5.3 What the interaction spec has already accommodated

The following autism/ADHD accommodations in the spec are correct and should be preserved
without modification:

- Reduced-motion support throughout (progress bar, sheet, overlay, countdown)
- `aria-live` updates every 30 seconds (not every second) to prevent announcement overload
- Amber (warning) styling for the loss state rather than red
- No use of the word "lost" in any copy
- "Your coins are back" explicit in the loss toast
- Stepper-not-keyboard on iPad (prevents children entering arbitrary values)
- "Ending soon!" copy replacing the numerical countdown when < 10 minutes

These have been carried through from the tier3 research into the spec correctly.

### 5.4 What the spec does not yet address

**Sensory: No mention of sound.** If the app uses sound anywhere, the auction feature
should not introduce new auditory urgency cues (ticking, countdown beeps). Harry's
autism profile makes unexpected sounds a potential distress trigger. Sound decisions
should be explicit in the spec, not left to implementation. The spec is currently silent
on this.

**Transition anxiety: Sheet opening and closing.** The BottomSheet spring animation is
referenced throughout the spec. The reduced-motion path (opens instantly) is specified.
What is not specified is what happens if the sheet is dismissed mid-bid — does the bid
state persist? Does Harry lose progress? The spec says "Sheet returns to detail, 'Your
bid' row now visible" after a successful bid, but does not describe what happens if the
sheet is closed before confirming. For an autistic child, unconfirmed intent (started a
bid, didn't finish, sheet closed) can create significant uncertainty: did I bid? did I
not? This must be explicit.

**Distress exit: No way to cancel an active bid after confirmation.** The spec does not
include a "cancel my bid" option after the bid is confirmed. For Harry, being locked into
a financial commitment he cannot reverse may be distressing if he later regrets it or
if his coins drop below a threshold that makes him anxious. Whether to allow bid
cancellation is a PO decision (it affects NPC auction integrity), but the UX must at
minimum acknowledge the scenario and make a deliberate choice.

---

## 6. NPC auction design

### What NPCs are for in this context

In Tier 3 Auctions, NPCs serve two functions:
1. As the seller (listing the animal)
2. As competing bidders (creating tension and driving the price up)

These are different roles with different design requirements. The entity model has
`npcName` and `npcPersonality` on `AuctionItem` (the seller), and `currentBidder` on
the same entity (the current top bidder, which may be an NPC name). The `AuctionBid`
table has `bidder: string` — either `'player'` or an NPC name.

The spec's `BidHistoryList` shows the last 3 bids with bidder names. The seller's name
and the bidder names may be the same or different. This is unspecified in the schema.

### How competitive should NPC bidding feel?

The core tension of auctions is: will I win? For a child, this tension must resolve
positively often enough to keep engagement, but infrequently enough to make wins feel
earned. This is a calibration question that requires a clear answer before Phase C.

**Research grounding (confidence: medium — based on games literature, not Harry-specific):**

Children's games research (Vorderer et al. 2006) finds that a win rate of approximately
60-70% sustains engagement for ages 6-9 without creating either boredom (too easy) or
frustration (too hard). Below 50% win rate for this age group, engagement drops sharply.

For Harry specifically, his ADHD profile means intermittent variable reward is highly
engaging — this is consistent with the general research. His autism profile means he needs
to be able to predict the pattern somewhat: if wins feel random and unreachable, he will
disengage rather than persist.

**Recommended NPC bidding parameters (for PO to decide):**

| Parameter | Recommended range | Rationale |
|-----------|------------------|-----------|
| Player win rate (across all auctions Harry bids on) | 60-65% | Sustains engagement; consistent with children's game research |
| NPC bid delay after player bid | 3-12 seconds | Creates tension without triggering panic; below 3s feels instant and threatening |
| Maximum NPC bids per auction | 3-4 | Limits the "fight" to a manageable contest; unlimited NPC rebidding is exhausting |
| NPC bid increment | Same as player increment | Prevents NPC from using unfair-feeling larger jumps |
| Rarity scaling | Higher rarity = more NPC competition | Aligns effort with reward; common animals should be easy wins |

### NPC character design constraints

Based on the parasocial risk (Risk C above), the following constraints apply to how NPC
bidders are presented:

- NPC names must be clearly non-human or whimsical (e.g. "The Collector", "Wild Wanderer",
  "Safari Seeker"). Realistic human names (e.g. "Zara", "Jake") risk reading as real peers.
- NPC names must rotate — the same name should not appear as an antagonist in consecutive
  auctions visible to Harry in the same session.
- The outbid notification must not foreground the NPC name. The focus should be on the
  animal or the bid amount, not on who outbid Harry.
- NPC bidders should not have visible personality traits in the bid history — just a name
  and an amount. Personality copy ("Zara says: I always get what I want!") would be
  highly provocative for this age and profile.

### The winnable design

An NPC auction should be designed so that Harry can always win if he has enough coins and
chooses to use them. The NPC should not have an unlimited budget. The cap on NPC bidding
should be set at a level that a player with a healthy wallet can realistically exceed.

Whether Harry knows about this cap is a separate question. He should not need to know —
the experience should simply feel like he can win if he tries hard enough. A player who
can never win regardless of coins spent would quickly identify the rigged dynamic, which
is more distressing than ordinary competitive loss.

---

## 7. Assumption map — what the team is treating as true without validation

| ID | Assumption | Feature area | Risk if wrong | Evidence status |
|----|-----------|-------------|--------------|-----------------|
| A1 | Harry understands that held coins are still his | Wallet / coin display | HIGH — sees balance drop as loss | Not validated; no primary research |
| A2 | Harry will understand that a refund arrives automatically after a loss | Loss flow | HIGH — expects loss to be permanent | Not validated |
| A3 | A countdown timer creates excitement rather than anxiety for Harry | Countdown component | MEDIUM-HIGH — may trigger panic bidding | Not validated; racing evidence suggests risk |
| A4 | NPC bidder names will not be interpreted as real peers | NPC design | MEDIUM — social rejection reading | Not validated; developmental literature supports risk |
| A5 | Harry will return to the app to find out if he won | Outcome delivery | MEDIUM — ADHD prospective memory impairment | Not validated; no session data |
| A6 | The anti-snipe extension will be understood as a positive event | Timer extension | MEDIUM — unexpected reversal risk for autistic children | Not validated |
| A7 | A stepper (not free text) is preferred by Harry for bid entry | Bid confirm UX | LOW — stepper is the safer default | Not validated; assumption is probably correct |
| A8 | Harry understands what makes an auction animal different from a generated animal | Discovery / motivation | MEDIUM — if unclear, the feature has no hook | Not validated; spec does not address this |
| A9 | Losing 40-50% of auctions will not cause sustained disengagement | NPC competition calibration | HIGH — children age 6-9 disengage below ~60% win rate | Not validated; no win-rate data |
| A10 | Closing the BottomSheet mid-bid leaves Harry with a clear understanding of his bid status | Sheet close behaviour | MEDIUM — unresolved state causes uncertainty | Not addressed in spec |

---

## 8. Open questions for the UX Designer and PO

These are genuine knowledge gaps. They must be resolved before or during Phase B.
They are not rhetorical — each one has a downstream impact on the spec or stories.

### For the UX Designer

**UX-Q1:** What is the first-encounter experience for auctions? The spec has no onboarding
or explanation of the mechanic for a child who has never bid before. A single-sentence
explanation integrated into the hub (not a modal) is needed. What does this look like?

**UX-Q2:** What happens when the BottomSheet is closed during the BidConfirmState before
the bid is submitted? Does the in-progress bid amount reset? Does the sheet return to the
detail view? Harry needs a clear "nothing bad happened" signal if he accidentally closes
mid-flow.

**UX-Q3:** What is the "can't bid higher" state for a player who is outbid but cannot
afford to rebid? The spec shows an outbid banner and a "Bid again" button. But if
the player has insufficient coins to meet the new minimum, the button should be disabled
with an explanation — not simply active but failing on tap. Is this state specified?

**UX-Q4:** How does the wallet display change during an active bid? The spec mentions
"1,200 (120 held)" but does not specify where this appears in relation to the header
CoinDisplay, how it behaves when Harry is on a non-auction screen, or whether the
"held" amount is visible globally or only on the auction screens.

**UX-Q5:** The anti-snipe timer extension — what does Harry see when it fires? The spec
does not specify this state. A toast? An inline notice in the countdown component? This
must be defined before Phase C.

**UX-Q6:** Does the AuctionWonOverlay allow dismissal by tapping outside ("tap backdrop to
dismiss")? For autistic children, an accidental dismiss of a celebration moment before
it completes is distressing. Consider requiring the explicit "Go to My Animals" tap.

### For the Product Owner

**PO-Q1:** What is the target win rate for Harry across auctions he actively bids on?
This must be specified before the NPC bidding logic is built. Recommended: 60-65% win
rate. If no target is set, the developer will choose a value independently.

**PO-Q2:** What is the NPC bid cap per auction? Is there a maximum number of times an
NPC will rebid, and a maximum total budget? If there is no cap, Harry can always be
outbid indefinitely, which breaks the feature's viability for this user.

**PO-Q3:** How many auctions are active simultaneously? The spec says "a rotating daily
selection." How many is that? One? Three? Eight? This directly affects cognitive load on
the hub screen and the held-coins display (if Harry bids on multiple auctions, his
effective wallet is reduced significantly).

**PO-Q4:** What is the bid increment? The spec says "minimum increment" but never
specifies the value. This must be a PO decision based on the coin economy — a 50-coin
increment at a 300-coin starting bid is a very different dynamic from a 200-coin
increment at a 1,000-coin starting bid.

**PO-Q5:** Can Harry cancel a confirmed bid before the auction closes? If yes, what is the
mechanic? If no, the spec must make this unambiguously clear at the point of confirmation
("Once confirmed, your bid cannot be cancelled").

**PO-Q6:** What happens to the auction card after Harry wins and the animal is delivered
to My Animals? Does the card persist in a "You won this!" state, disappear immediately,
or move to a "Past auctions" section? The spec's empty state implies cards disappear but
does not confirm this.

**PO-Q7:** Should auctions have a rarity floor — i.e. only offer animals at uncommon
rarity or above? This would differentiate auctions from generation and give Harry a clear
motivation for using them. If common-rarity animals appear in auctions, the feature has
no scarcity advantage over free generation.

---

## 9. Insight summary — for the UX Designer to act on immediately

The following five insights are prioritised by impact on Harry's experience. They are
stated as user needs, not design directions.

**Insight 1 — The wallet is the heart of the feature.**
Harry needs to understand at all times where his coins are. During an active bid, his
wallet balance is temporarily lower than his "real" total. This must be made visible,
warm in tone, and immediately reversible-feeling. Any wallet display that requires him
to deduce that held coins still exist is a design failure. Confidence: high.

**Insight 2 — Winning must feel earned, losing must feel gentle.**
The emotional asymmetry between winning and losing requires deliberate design. The win
overlay is well-specified. The loss path needs equal care: it must feel like the animal
went somewhere nice, Harry's coins came home, and a better animal might be waiting
tomorrow. Confidence: high.

**Insight 3 — Complexity must be front-loaded into explanation, not scattered through the UI.**
Harry cannot learn how auctions work by exploring. He needs a brief, plain-language
explanation of the mechanic at first encounter — not a tutorial, not a modal, just one
or two sentences integrated naturally into the hub. Confidence: medium-high.

**Insight 4 — NPCs must feel like friendly competition, not antagonists.**
The NPC system can create fun competitive tension if designed correctly — whimsical
names, rotating identities, capped bidding. If designed poorly, NPCs become recurring
villains who "always" beat Harry. The NPC bidding design is an area where copy and
character design decisions have outsized impact. Confidence: medium.

**Insight 5 — The session-gap problem is underspecified.**
Auctions run over hours or days. Harry's ADHD means he will forget about active bids.
The nav-level signal (badge/indicator), the toast on outcome, and the "Your coins are
back" confirmation must all function as a complete notification chain without requiring
Harry to remember what he bid on. Confidence: high.

---

## Confidence summary

| Finding | Confidence |
|---------|------------|
| Coin hold mechanic is cognitively hostile for this age group | High |
| Timer urgency risks panic-bidding or abandonment for ADHD/autism profile | High |
| NPC names carry parasocial risk for ages 6-9 | Medium |
| Win rate below 60% will cause disengagement for this age group | Medium |
| Outbid copy conflation (during-auction vs post-auction) in spec | High (code-level observation) |
| First-encounter onboarding gap in spec | High (spec gap directly observable) |
| Anti-snipe extension is high-risk for autistic users | Medium-high |
| Sound design decisions absent from spec | High (spec gap directly observable) |
| Sheet close mid-bid behaviour unspecified | High (spec gap directly observable) |
| Rarity differentiation needed to motivate auction engagement | Medium |

---

*All findings based on: schema analysis, interaction spec review, prior tier3 research
synthesis, published developmental psychology and child HCI literature, and Harry's
established profile. No primary research (interviews, observation, usability testing)
has been conducted with Harry on this feature or equivalent mechanics. All findings
should be revisited if primary research becomes available.*
