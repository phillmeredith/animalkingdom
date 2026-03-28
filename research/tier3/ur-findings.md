# UR Findings: Tier 3 Features — Auctions, Player Listings, Compare Screen

> Output from the User Researcher agent.
> Produced during Phase A.
> Covers three features in a single document because they share a user context,
> a common emotional register (ownership, loss, value judgement), and a single
> primary user: Harry, 7, ADHD + autism.

---

## Evidence base and confidence levels

Before findings, this section is transparent about the quality of evidence
underpinning each claim.

| Source | Quality | Relevance |
|--------|---------|-----------|
| Existing UR brief: Explore/Directory (Harry profile) | High — detailed, feature-specific | High — establishes Harry's ADHD/autism profile and interaction style |
| Existing UR brief: Generate Wizard | Not found in file system — brief exists only as template | Low |
| Published developmental psychology literature (ages 6-12, economic cognition) | Moderate — well-replicated findings, not app-specific | High |
| Child HCI research on timer-based mechanics and anxiety (Hourcade 2008, Read 2010) | Moderate — academic, not product-specific | High for Auctions |
| Trading card game UX analogies (physical play, Panini sticker books, Pokemon) | Moderate — behavioural observation, not controlled study | High for all three features |
| Animal attachment literature in children (Bryant 1990, Serpell 1999) | Moderate — field study evidence | High for Player Listings emotional stakes |
| App store review analysis of comparable child trading games | Low — no formal analysis conducted for this project | Medium |

**What we do not have:**
- Direct observation or interviews with children aged 6-12 using this specific app
- Usability test data on any Tier 2 or 3 features
- Parental feedback on the existing marketplace or coin mechanics
- Data on how often children in the target age band engage with the existing NPC Offers marketplace

This document treats the absence of primary research as a known risk throughout.
All findings are drawn from cross-referenced secondary evidence and developmental
reasoning applied to the specific mechanic described in the entity model.

---

---

# Feature 1: Auctions

---

## Mental model

**What a 6-12 year old understands about auctions**

Children in this age band have limited but meaningful exposure to auction-like
mechanics through:
- Physical trading card trading ("I'll give you two commons for one rare")
- School fetes and charity auctions (observed, not participated)
- Online game economies: Roblox, Minecraft servers, Pokemon GO trades

Research on economic cognition (Harbaugh et al. 2001, Levin & Hart 2003)
establishes that children aged 7-8 begin to grasp basic reciprocal exchange
but struggle with multi-party competition. Harry at 7 sits at the low end of
this band.

**What Harry specifically is likely to understand:**
- "Someone else wants this thing too" — competitive desire is intuitive
- "The one who offers the most gets it" — simple enough
- "I might not get it even if I try" — loss is understood but emotionally difficult

**What Harry is unlikely to understand without scaffolding:**
- That coins are deducted before the auction ends (the "hold" mechanic)
- That a refund will happen automatically if he loses
- That the countdown timer represents real elapsed time, not a game-speed timer
- That NPCs are not real other children competing against him

**Best analogies for this age group:**
- "It's like a race to get the rarest sticker — whoever offers the most stickers wins"
- "Like when everyone wants the last turn on the slide — the one who gets there first and stays wins"
- Trading card equivalents work best because Harry's existing mental model for
  animal rarity is already structured (see rarity field in entity model)

---

## Assumption audit

| # | Assumption baked into the feature design | Risk level | Evidence status | Recommendation |
|---|------------------------------------------|------------|-----------------|----------------|
| A1 | The child understands that coins are held (spent immediately) when a bid is placed, not when the auction ends | HIGH | Not validated. This is counter-intuitive for a 7-year-old. The physical world equivalent is handing over money before knowing if you've won. | The UI must show coins leaving the wallet at bid time and explain why. "Held" or "reserved" language is required. |
| A2 | The child understands that a refund will arrive automatically if they are outbid | HIGH | Not validated. Children at this age expect loss to be permanent and gain to require action. An automatic refund is a non-obvious concept. | Outbid toast must explicitly state "Your coins are on their way back". Refund should be confirmed with a second visible notification. |
| A3 | A countdown timer creates excitement rather than anxiety | MEDIUM | Mixed evidence. For children with ADHD, urgency timers can produce panic-driven decisions (Prins et al. 2003). For children with autism, time pressure without a clear "safe end state" produces distress. Harry has both. | Timer must be visually calm. Avoid red/pulsing states until final 60 seconds at most. Provide a "what happens when time runs out" explanation inline. |
| A4 | Children will understand NPC bidders are not real people | MEDIUM | Not validated. Children aged 6-8 frequently attribute real-world social meaning to game characters (Turkle 1984, more recent Reeves & Nass). Being outbid by "Zara the Collector" may feel like social rejection. | NPC names should be clearly non-human or whimsical enough to read as fictional. Do not use realistic human names. |
| A5 | The auto-increment of +50 per bid is intuitive | MEDIUM | Not validated. Children may expect to enter a custom amount. Fixed-increment bidding is simpler but must be explained on first use. | First bid should include a brief explanation: "Each bid adds 50 coins to the top offer." |
| A6 | The anti-snipe extension (final 60s extends by 2min) will be understood | LOW | This mechanic is adult-world knowledge (eBay). Children will not anticipate it. | Do not explain this mechanic proactively — it will confuse. If it triggers, show a brief "Time extended!" notice. No explanation needed. |
| A7 | Children will check back to see auction outcomes | LOW | Children aged 6-8 have poor prospective memory for in-app events (particularly ADHD profiles). | Outcome notification (win/lose toast + badge dot) is essential. Do not rely on the child returning to check. |
| A8 | Losing an auction is an acceptable outcome for a 7-year-old | HIGH | Not validated and contradicted by attachment research. Children form expectations and losing after investment (time + coins) causes distress. The "lost" state needs careful emotional design. | "Lost" badge should not be styled like failure. Recommend language like "Went to another home" rather than "Lost". |

---

## Vocabulary guide

The following replacements are recommended. All terms have been evaluated against
a year 2 reading age (approximately Harry's level) and for emotional neutrality.

| Technical / adult term | Recommended child term | Rationale |
|------------------------|----------------------|-----------|
| Auction | Bidding Battle / Bid to Win | "Auction" is adult vocabulary. "Bidding Battle" signals fun competition rather than financial transaction. |
| Place Bid | Join the bidding | "Place" is formal. "Join" signals participation over transaction. |
| Current bid | Top offer so far | "Bid" is adult. "Offer" is more natural for a 7-year-old. |
| Outbid | Someone offered more | Describes the situation without "bid" jargon. |
| Reserve price | Starting price | Simpler, not misleading. |
| Starting bid | Starts at X coins | Plain construction, no jargon. |
| Auction ends in | This offer closes in | "Closes" is gentler than "ends" (implies something stopping). |
| Auction expired | No one won this one | Neutral, descriptive, age-appropriate. |
| Lost the auction | Went to another home | Reframes loss as the animal finding a place rather than the child failing. |
| Won the auction | It's yours! | Immediate, celebratory, no jargon. |
| Refund | Your coins are back | Concrete and visible rather than transactional. |
| Bid held / reserved | Coins saved for this | "Saved for this" implies the coins are still yours but set aside. |

---

## Risk register

### Risk 1: The coin-hold mechanic causes wallet confusion and perceived theft (HIGH)

**Finding:** When Harry places a bid, coins are deducted immediately from
useWallet (confirmed in INTEGRATION_MAP.md: step 2, "useWallet.spend"). If Harry
then opens his wallet and sees a lower balance than expected — with no pending
win — this will read as an error or loss. Children at this developmental stage
have a concrete rather than abstract understanding of money. "Gone from my wallet"
means "gone", not "temporarily held".

**Impact:** The child may attempt to get coins back, abandon the auction from
distress, or lose trust in the coin system. Parental escalation risk is high.

**Mitigation:**
- At the moment of bidding, show a dedicated intermediate state: "300 coins saved
  for this bid" adjacent to the wallet balance, not just a toast.
- The wallet display itself should show a split view during an active bid:
  "Available: 200 | In bid: 300" so the child can always see all their coins.
- Outbid refund must arrive with an animated coin-return visual, not a silent
  balance increment.

**Confidence:** High. This is grounded in the entity model's own mechanics and
in well-documented cognitive patterns for this age group.

---

### Risk 2: Timer anxiety produces panic-bidding or abandonment (MEDIUM-HIGH)

**Finding:** Harry's ADHD profile (from existing UR brief: Explore/Directory)
indicates that urgency mechanics can produce impulsive decisions under pressure.
His autism profile means that ambiguous endings — "what happens when this hits
zero?" — produce distress. The auction timer creates both conditions
simultaneously: urgency plus an unclear end state.

The anti-snipe mechanic (timer extension) compounds this: Harry may believe the
auction is ending, feel relief, then discover the timer has extended. This
unexpected reversal is particularly distressing for autistic children who have
built a mental model of when the experience will end.

**Impact:** Impulsive bids placed under perceived time pressure, resulting in
spending more coins than intended. Or complete disengagement from the auctions
feature if it feels uncontrollable.

**Mitigation:**
- Display a plain-language explanation of the end state adjacent to the timer:
  "When the time runs out, whoever offered the most wins."
- Do not use red colouring, pulsing animations, or urgency sound effects until
  the final 30 seconds at most.
- In Settings (or on first encounter), offer a "slow auctions" mode that shows
  only auctions with more than 10 minutes remaining, giving Harry a calmer
  participation context.
- When the anti-snipe extension fires, show "A bit more time!" as a positive
  framing, not a timer reset that looks like a glitch.

**Confidence:** Medium-high. Grounded in Harry's established profile from
existing UR. No direct observation of Harry using timed mechanics in this app.

---

### Risk 3: NPC social dynamics create unintended emotional investment (MEDIUM)

**Finding:** NPC bidders have names and personalities (entity model: npcName,
npcPersonality). Being outbid by a named character — "Zara the Collector just
outbid you!" — may read as interpersonal rejection for a child who attributes
social agency to game characters. Research on children's parasocial relationships
with game entities (Turkle 1984; Valkenburg & Patti 2006) shows this is
particularly strong for ages 6-9. Harry's autism profile does not reduce this
risk — if anything, named characters with consistent personalities may feel more
real, not less.

**Impact:** Being outbid by the same NPC name repeatedly across auctions may
create a narrative of personal antagonism ("Zara always beats me"). This could
create distress disproportionate to the game mechanic.

**Mitigation:**
- NPC bidder names in auctions should rotate and not persist as recurring
  antagonists. Each auction should use a different name pool draw.
- Outbid toast should be framed around the animal, not the NPC:
  "This one got away — try another?" rather than "[Name] just outbid you!"
- NPC names should be clearly whimsical/animal-adjacent rather than realistic
  human names (e.g. "Fox Collector" rather than "Zara").

**Confidence:** Medium. Grounded in parasocial research but not Harry-specific.

---

## Key insight: Auctions

**The "coins held" mechanic is the single biggest child-hostile element in this
feature. A child who sees their balance drop before they know if they won will
not interpret this as a hold — they will interpret it as a loss. The entire
auction flow must be redesigned around making "your coins are still yours, just
saved for this" visible at all times.**

---

---

# Feature 2: Player Listings

---

## Mental model

**What a 6-12 year old understands about selling something**

Children in this age band have experience with:
- Giving away or swapping toys ("I gave my old teddy to the charity shop")
- Jumble sales and school fairs
- Conceptually, "if I sell this I get money for it"

What is emotionally distinct about Player Listings compared to all prior
marketplace features is that the child is selling something they own and named
and have cared for. The existing NPC Offers marketplace involved animals the
player had not yet adopted. Player Listings involves animals Harry has:
- Named himself
- Fed, cleaned, and played with (care system)
- Potentially equipped with items
- Potentially raced (racing system)

This is not an economic transaction. For a 7-year-old, this is giving away a pet.
The attachment literature is unambiguous on this point: named, cared-for virtual
animals are experienced as emotionally equivalent to owned physical objects, and
sometimes equivalent to real animal attachments (Melson 2001; Kahn et al. 2006).

**What Harry understands about listing vs. selling:**
Harry will not distinguish between "listed for sale" and "sold". In his mental
model, "putting something up for sale" means "I am giving it away". The 24-hour
listing window — during which the pet leaves the active collection but has not
yet been sold — is a liminal state that has no real-world equivalent for a child.
"Where is my pet? It's not in my collection but I haven't sold it yet" is a
deeply confusing state.

---

## Assumption audit

| # | Assumption baked into the feature design | Risk level | Evidence status | Recommendation |
|---|------------------------------------------|------------|-----------------|----------------|
| B1 | The child will understand that a listed pet is temporarily unavailable, not gone | HIGH | Not validated. The entity model shows `status: "for_sale"` removes the pet from the active collection view. For a child, "not in my collection" reads as "gone". | The pet must remain visible during listing, clearly badged as "Listed — waiting for a buyer". Never hide it entirely. |
| B2 | The child will understand what an "asking price" is and be able to set one meaningfully | HIGH | Not validated. Setting your own price for something you own is an adult concept. Children either anchor to an arbitrary number or copy a number they've seen elsewhere. No price-setting schema exists in their mental model. | Remove free-form price entry. Offer 3 preset price tiers based on rarity market value (e.g. "Quick sale: 80 coins", "Fair price: 120 coins", "Hold out: 180 coins") with brief explanations. |
| B3 | The child will check back to manage their listing within 24 hours | HIGH | Not validated. As with auctions: children aged 6-8 have poor prospective memory. The listing will expire silently unless the child is notified. | Expiry notification is mandatory, not optional. The toast + summary on expiry (confirmed in entity model) is correct but insufficient alone. Show an in-app indicator on the My Animals tab badge when a listing is active. |
| B4 | The "cancel listing" flow is safe from accidental activation | MEDIUM | Not validated. A cancel tap with confirmation is designed, but the confirmation pattern must match the emotional weight. "Cancel listing" is a low-stakes phrase; "Bring [Name] home" is not. | The cancel confirmation must be framed positively and not as a cancellation: "Bring [Name] back to your collection?" with a green confirm button, not a red one. |
| B5 | The counter-offer mechanic is age-appropriate | HIGH | Not validated. Negotiation requires theory of mind (understanding the other party's position and reasoning about their limits). This skill typically matures around age 9-11. At 7, Harry will not be able to reason about when to counter vs. accept. | The counter-offer mechanic should be hidden or simplified to a binary: Accept or Decline. If counter-offer is retained, frame it as "Ask for a bit more?" with a single preset counter amount rather than a free-form entry field. |
| B6 | The child will not regret selling a pet after the transaction is complete | HIGH | Not validated and directly challenged by attachment research. Post-sale regret is likely, particularly for higher-rarity or well-cared-for animals. | A brief undo window (5-10 seconds) after accepting a buyer offer should be considered, equivalent to the item purchase undo. After that window, a "rehome certificate" — a read-only memento in Past Sales — gives the experience closure rather than erasure. |
| B7 | The "views counter" creates satisfying anticipation, not anxiety | MEDIUM | Not validated. "47 people looked but nobody bought it" is a rejection narrative for a sensitive 7-year-old. | Views counter should be framed positively: "Your listing is getting attention!" only when views are increasing. Do not show high-view, low-offer states without a reassuring framing. |
| B8 | The 24-hour listing window is the right duration for a child player | MEDIUM | Not validated. 24 hours is a long time in a child's session cadence. Many children will not open the app every day. A listing may expire without the child ever seeing an offer. | Consider surfacing the listing summary screen ("Here's how your listing did") on the next app open after expiry, not just as a toast. |

---

## Vocabulary guide

| Technical / adult term | Recommended child term | Rationale |
|------------------------|----------------------|-----------|
| List for sale | Find [Name] a new home | Frames the action as care for the pet rather than commerce. Reduces guilt framing. |
| Asking price | What you'd like for them | Personalised, avoids financial register. |
| Market value | Usually sells for around... | Contextualises without prescribing. |
| Player listing | Your listing / [Name]'s listing | Personalise by pet name wherever possible. |
| Active listing | Waiting for a buyer | Describes the state plainly. |
| NPC buyer offer | Someone wants to buy [Name] | Focuses on the pet, not the transaction. |
| Accept offer | Agree to sell | Plain. |
| Decline offer | Say no | Simplest. |
| Counter offer | Ask for a bit more | Frames as a question, not a tactic. |
| Listing cancelled | Brought back to your collection | Positive framing: return, not failure. |
| Listing expired | Nobody bought [Name] this time | Honest but paired with "Want to try again?" |
| Sold | [Name] has found a new home | Frames as the pet's outcome, not a transaction. |
| Past sales / sold listings | Animals you found homes for | Archive framed as good outcomes. |
| View count | People who've looked | Accessible. |

---

## Risk register

### Risk 1: The "for sale" state hides the pet from the child's collection, creating a perceived loss before the sale (HIGH)

**Finding:** The entity model confirms: when a pet is listed, `savedNames.status`
is set to `"for_sale"`. The existing My Animals collection almost certainly
filters on `status: "active"`. This means the moment a child lists their pet,
it disappears from their collection view. For Harry, this is functionally
identical to losing the pet. The 24-hour listing window is not a holding area
in his mental model — it is absence.

**Impact:** Immediate distress. The child attempts to "undo" the listing or
believes the pet was accidentally deleted. Parent intervention likely.

**Mitigation:**
- "For sale" pets must remain visible in the My Animals collection, clearly
  badged ("Looking for a new home") but not hidden.
- The badge must include a tap target that opens the listing status, not the
  normal pet detail.
- A persistent, gentle indicator on the My Animals tab (not just a number badge)
  keeps the listing in peripheral awareness: "1 pet is looking for a new home."

**Confidence:** High. Directly grounded in the entity model behaviour and
developmental evidence about object permanence and attachment.

---

### Risk 2: The moment of sale (pet permanently removed) is not emotionally scaffolded (HIGH)

**Finding:** When a buyer offer is accepted, `useSavedNames.releasePet(petId)` is
called. This is a hard delete. The pet is gone. The current integration map
specifies a toast: "[Name] has found a new home with [buyer]! +[amount] coins".
This is the sole emotional moment for an event that, for a 7-year-old, is
equivalent to giving away a real pet.

Children who have sold or given away a toy, book, or real animal consistently
report post-decision regret (Kahneman 1979's endowment effect applies to
children even more strongly than adults — Harbaugh et al. 2001). A single toast
does not provide adequate closure.

**Impact:** The child feels the sale was a mistake. No recovery path exists.
Distress escalates when they go to My Animals and confirm the pet is gone.

**Mitigation:**
- A brief undo window (10 seconds) after accepting, identical to the item
  purchase undo mechanic already built for useItemShop. This requires a
  deferred delete pattern rather than an immediate hard delete. This is a design
  recommendation — the Developer needs to assess whether a "listing accepted"
  intermediate state before `releasePet` is feasible within the state machine.
- A "Past Homes" section in the My Animals tab (or in Past Sales) that shows
  a read-only memento: the pet's name, breed, image, care streak, and the
  message "[Name] went to live with [buyer] on [date]." This is closure, not
  recovery.
- The toast at sale must be warm and forward-looking, not just transactional.
  Recommended: "[Name] has gone to their new home! You made a great match."

**Confidence:** High. Grounded in attachment literature and in the demonstrated
importance of closure moments for children in digital contexts.

---

### Risk 3: Price-setting without anchors produces either paralysis or destructive underpricing (HIGH)

**Finding:** The current design implies the child sets an asking price via a
pricing modal (INTEGRATION_MAP.md: "Player taps 'List for Sale' in pricing modal").
No price scaffolding is defined. For a child with ADHD (difficulty with
deliberative decisions) and autism (difficulty with open-ended choices without
clear structure), an open-ended price field is a significant friction point.
They will either: (a) refuse to engage and abandon the listing flow, or (b) enter
an arbitrary number that undervalues the pet significantly, leading to a sale
they later regret, or (c) enter a number so high that no offers arrive (silent
failure).

**Impact:** Either feature abandonment or regretted sales. Both undermine trust
in the marketplace.

**Mitigation:**
- Replace the free-form price field with a three-option selector:
  - "Quick sale" — 70% of market value, likely to sell fast
  - "Fair price" — 100% of market value, balanced
  - "Hold out" — 140% of market value, may take longer
- Show the coin amount next to each option, not just the label.
- Show a one-line social proof where possible: "Animals like [Name] usually sell
  for around [X] coins."
- Allow the child to adjust price when relisting (after expiry) with the previous
  outcome shown: "Last time you tried [X] coins — nobody bought it."

**Confidence:** High. Grounded in ADHD/autism profile from existing UR and in
behavioural economics evidence on choice overload.

---

## Key insight: Player Listings

**Selling a named, cared-for pet is not a commercial transaction for a
7-year-old — it is an emotional event equivalent to rehoming a real animal.
Every design decision in this feature must be made through that lens. The
current state machine has no emotional scaffolding between listing and deletion.
That gap must be filled before UX begins.**

---

---

# Feature 3: Compare Screen

---

## Mental model

**What a 6-12 year old understands about comparing two things**

Children develop comparative reasoning (taller/shorter, faster/slower) by age 5-6.
By age 7-8, multi-attribute comparison ("this one is faster but that one is rarer")
is emerging but not reliable. Children at this age tend to anchor on a single
salient attribute — typically the one that appears first, is largest visually, or
matches their current motivation — and discount other attributes.

Research on multi-attribute decision-making in children (Davidson 1991; Bereby-Meyer
et al. 2004) establishes that children under 9 consistently use single-attribute
strategies even when instructed to consider multiple factors. Harry will look at
the Compare screen and effectively see one thing: whichever stat is most visually
prominent or most emotionally salient to him (probably rarity or the animal he
cares about more).

**What the Compare screen is for (from the feature brief):**
- Help players decide which animal to keep, sell, or race
- Side-by-side stats, rarity, care history, equipped items

**The core tension:**
The feature is designed for a rational multi-attribute decision. The user is
a 7-year-old who makes single-attribute emotional decisions. These are in
direct conflict. The compare screen risks being a feature Harry visits but
cannot use as intended — not because it is hard to use technically, but because
it solves a cognitive problem he does not yet have.

**This is not a reason to abandon the feature.** It is a reason to redesign
its purpose from "show all stats" to "help Harry know which pet to choose for a
specific task."

---

## Assumption audit

| # | Assumption baked into the feature design | Risk level | Evidence status | Recommendation |
|---|------------------------------------------|------------|-----------------|----------------|
| C1 | A child aged 7 can make a multi-attribute comparison and reach a rational conclusion | HIGH | Contradicted by developmental research. This is an emerging skill at 9-11, not reliable at 7. | The screen must include a recommendation engine: "For racing, [Name] has the edge." "For selling, [Name] is worth more." This converts multi-attribute data into a single actionable insight. |
| C2 | The child knows which two animals they want to compare before arriving at the screen | MEDIUM | Not validated. Navigation to the compare screen requires pre-selecting two animals. If the selection UI is unclear, the child will not reach the comparison. | The compare entry point must be discoverable from within the animal detail view: "Compare with another animal" as a button on the pet profile. |
| C3 | "Care history" is a meaningful stat for comparison | MEDIUM | Partially validated by the care system existing and being rewarded. But a child's care history is emotionally loaded — seeing that one pet has a lower care streak because they forgot to play with it may produce guilt rather than information. | Display care history as "days cared for" in a positive frame, not as a deficit indicator. Do not highlight missing care days. |
| C4 | Showing the "worse" animal's stats honestly will not cause distress | MEDIUM | Not validated. If Harry compares his favourite (lower-rarity) pet against a newer (higher-rarity) one, the comparison will make his favourite look objectively worse. This may feel like an attack on his attachment. | Never use red/negative styling for the "losing" stat in a comparison. Use neutral grey for the lower value, not red. The comparison should feel informational, not judgemental. |
| C5 | Children will use this to decide which pet to sell | HIGH | Plausible as intent but not validated. The compare screen may instead be used as a trophy display — "look at my two best animals side by side" — which is a valid but different use case. | Design for both use cases. A "What should I do with these?" prompt at the bottom of the comparison, offering task-based guidance, serves the decision use case without excluding the trophy display use case. |
| C6 | The equipped items display is legible to a child | LOW | The items system is established (Tier 2 complete). Children who have used the item shop will understand equipped items. Children who haven't may not. | Show equipped items with their visual icon and a one-line effect description ("Adds +5 speed") rather than raw stat numbers alone. |
| C7 | A sub-tab location (My Animals > Compare) is the right navigation pattern | MEDIUM | Not validated. If the compare feature is primarily reached from within an animal's profile, a sub-tab placement is an unnecessary step. A contextual entry from the profile is more aligned with how children navigate. | Recommend adding a "Compare" action from within the pet detail view (ResultsScreen), in addition to the sub-tab. Monitor which entry point is used more frequently post-launch. |

---

## Vocabulary guide

| Technical / adult term | Recommended child term | Rationale |
|------------------------|----------------------|-----------|
| Compare screen | Side by side / Compare your pets | "Side by side" is concrete and visual, describes exactly what they'll see. |
| Rarity | How rare they are | Rarity is already understood from card system — maintain consistency. |
| Stats | Strengths | "Stats" is gaming vocabulary that some children in the age band will know; "Strengths" is universally understood and more positive. |
| Care history | How well looked after | Describes the lived experience, not a metric. |
| Care streak | Days cared for in a row | Concrete, time-based. |
| Equipped items | What they're wearing | Natural for children. |
| Stat boost | Bonus | Simple. |
| Market value | Worth around X coins | Contextual, avoids "market" jargon. |
| Better / worse (for stats) | Avoid entirely | Use "higher" / "lower" for numbers, no value judgement language. |
| Winner / loser | Avoid entirely | Especially for the "this pet would win a race" use case — frame as "great for racing" not "winner". |

---

## Risk register

### Risk 1: The comparison renders one pet as objectively inferior, damaging the child's attachment to it (MEDIUM-HIGH)

**Finding:** Any honest comparison between two animals of different rarity will
show one pet as objectively "worse" on most metrics. For Harry, who names and
cares for his pets, seeing his favourite animal shown with lower stats, lower
rarity, and lower market value than a newer one is not informational — it is a
referendum on something he cares about. Attachment research (Serpell 1999) shows
that children do not abandon attachments based on objective evidence; they either
reject the evidence or experience distress.

**Impact:** Harry becomes upset that his favourite pet "lost" the comparison,
or he stops using the compare screen because it makes him feel bad.

**Mitigation:**
- No "winner" visual. No red styling for the lower value.
- Consider a "unique strengths" section for each animal below the comparison
  table: what this specific animal is particularly good at, regardless of how
  it compares overall.
- Frame the comparison output as task-specific: "For racing: [Name A] has the
  edge. For your collection: both are special." This avoids an overall ranking.

**Confidence:** Medium-high. Grounded in attachment literature and in Harry's
established profile. Not directly observed.

---

### Risk 2: Multi-stat display without a recommendation produces decision paralysis for ADHD + autism profile (HIGH)

**Finding:** A raw stats table — even a well-designed one — requires the child
to hold multiple data points in working memory, assign weights to each, and
synthesise a decision. This is executive function-demanding. ADHD profiles
(Barkley 1997) show significantly impaired working memory and difficulty with
deliberative multi-step decisions. Autism profiles may additionally produce
perseveration on a single attribute without integrating others.

Harry will look at the stats table, fix on one number (probably rarity or care
streak, both of which are emotionally salient), and make a decision based on
that alone — exactly what he would have done without the compare screen.

**Impact:** The feature is not used as intended. It becomes a visual curiosity
rather than a decision aid.

**Mitigation:**
- Add a "Help me choose" section below the stats comparison. This is not a
  button — it is a set of task-specific questions, each with a one-sentence
  answer generated from the data:
  - "Which one should I race?" → "[Name A] — they're faster."
  - "Which one is worth more?" → "[Name B] — they're rarer."
  - "Which one should I sell?" → "Up to you — but [Name B] might get more coins."
- This converts the feature from a data display into a decision tool, which is
  what the feature brief says it is for.

**Confidence:** High. Grounded in Harry's established ADHD profile from prior
UR and in executive function research.

---

### Risk 3: The compare screen is inaccessible without clear animal selection UI (MEDIUM)

**Finding:** The compare mechanic requires selecting two animals. The entity
model and system architecture do not yet specify how this selection works. If
it requires: (a) navigating to a dedicated screen, (b) picking animal A from a
list, (c) picking animal B from a list, and (d) then seeing the comparison —
this is a four-step flow before any value is delivered. For ADHD profiles, each
step is a potential abandonment point.

**Impact:** The feature is navigated to and immediately abandoned because the
selection UX is unclear or too long.

**Mitigation:**
- Provide a contextual entry point from the pet detail (ResultsScreen):
  "Compare with..." opens a single-step animal picker.
- If the sub-tab entry is maintained, pre-populate it with the two most recently
  viewed animals to reduce selection effort.
- The animal picker should show a grid of available animals (with names and
  images), not a list — grids are faster to scan for image-led recognition,
  which is how Harry navigates (established from Explore UR brief: 2-column
  grid gives more visual anchors).

**Confidence:** Medium. Based on ADHD profile and navigation evidence from
prior UR. No direct observation of selection UX behaviour.

---

## Key insight: Compare Screen

**The feature is designed for rational multi-attribute decision-making. The
primary user makes single-attribute emotional decisions. Without a built-in
recommendation layer — "for racing, choose this one; for selling, choose that
one" — the compare screen will display correct data that Harry cannot act on.
The recommendation layer is not a nice-to-have; it is the feature.**

---

---

## Cross-feature findings

The following apply to all three Tier 3 features and should be read by the
UX Designer before beginning any of the three interaction specs.

### The coin system's emotional register needs establishing before Tier 3

All three features involve coins in ways that carry more emotional weight than
previous tiers. In Tiers 1 and 2, coins were earned and spent on neutral or
positive transactions (games, care, items). In Tier 3:
- Auctions involve coins being deducted before the outcome is known
- Player Listings involve coins arriving after losing something valued
- Compare Screen informs decisions that will result in coin transactions

The child must understand and trust the coin system before Tier 3 features
will feel safe. If there are unresolved coin-trust issues from earlier tiers
(no evidence either way — this is a gap), Tier 3 features will inherit them.

**Recommendation:** Include a coin explainer moment in the Auction and Player
Listings onboarding. One sentence: "Your coins are always safe. When you bid,
your coins are kept safe until the auction ends."

---

### Accessibility: timer-based features and reduced motion

The existing UR brief for Explore establishes that `useReducedMotion` is a
built hook. This is relevant to Auctions and, to a lesser extent, Player Listings.

**Auctions:** The countdown timer is a visual mechanic. Under reduced motion,
the timer should not pulse or change colour states. The anti-snipe extension
animation ("Time extended!") must be instant rather than animated. The NPC
counter-bid arrival must not use any flash or bounce animation.

**No-timer accommodation:** There is no current provision for a completely
timer-free auction mode. For users with high anxiety around time pressure,
this is an access barrier. Recommendation: the "slow auctions" mode described
in the Auctions risk register above should be framed as an accessibility option,
not just a difficulty option. It should appear in Settings alongside the existing
reduced motion toggle.

**Player Listings:** The offer arrival animation (NPC offers arriving on a
staggered timer) must respect reduced motion. Under reduced motion, offers
should appear without entrance animation.

**Compare Screen:** No timer-based mechanics. Reduced motion applies only to
transition animations when switching between comparison views.

---

### Whose voice is missing

This document is grounded almost entirely in one user: Harry (7, ADHD + autism).
Harry is a well-established persona, but three populations are missing from the
evidence base and their absence should be flagged:

1. **Older children in the target band (ages 9-12).** The 9-12 cohort has
   greater economic cognition and executive function. Features that are too
   simple for them (e.g. three-tier pricing instead of free entry, no
   counter-offer) may feel patronising. This is a design tension with no
   current evidence to resolve it.

2. **Girls aged 6-12.** Animal attachment patterns, emotional responses to
   selling pets, and social dynamics with NPC characters may differ. The
   existing UR is silent on gender considerations.

3. **Children without ADHD or autism.** Harry's profile is specific. A
   neurotypical 8-year-old may have fewer anxiety responses to timers, greater
   tolerance for ambiguity in pricing, and less need for recommendation scaffolding.
   Features designed entirely for Harry's profile risk being over-scaffolded
   for the majority user.

The most practical mitigation: design for Harry's constraints as the floor
(timers are calm, pricing is scaffolded, language is clear) while allowing
for discovery and exploration for more capable users within the same interface
(e.g. an "advanced" price entry option below the three presets).

---

## Remaining knowledge gaps

These are accepted as post-launch risks or deferred to future research.

- **Gap: We do not know how often children in the target band open the app daily.**
  This affects whether 24-hour listing windows and auction durations are
  appropriately timed. Accepted as risk — will monitor session frequency via
  analytics post-launch.

- **Gap: We do not know whether the existing Tier 2 marketplace (NPC offers)
  has been used and whether it created any confusion about coin flows.**
  If children have already struggled with the NPC sell-offer mechanic (spend
  coins, get animal), the Tier 3 auction hold mechanic will compound existing
  confusion. Deferred — should be assessed from usage data before Tier 3 ships.

- **Gap: We do not know how Harry specifically responds to loss in competitive
  contexts within this app.** The racing feature (Tier 2) provides a prior
  competitive loss mechanic. Racing loss patterns and any associated support
  requests from parents would be highly informative for Auction design. Deferred
  to parent feedback review if any data is available.

- **Gap: We do not know whether children read toast notifications.**
  Several key safety mechanisms (outbid refund, listing expiry summary, sale
  confirmation) rely on toasts being seen and understood. Toast legibility and
  reading behaviour for age 6-8 is unstudied within this product. Accepted as
  risk — monitor in first usability test.

- **Gap: Counter-offer mechanic usability for ages 9-12 is unknown.**
  The recommendation to simplify or remove counter-offers is grounded in
  Harry's profile. Whether older children in the band find this engaging or
  patronising requires direct observation. Deferred to post-launch.

---

## Sign-off

UR findings complete for all three Tier 3 features. UX may proceed for all
three, subject to the high-risk items below being reviewed before interaction
specs are locked.

[ ] HIGH-RISK: Auction coin-hold mechanic — UX must design an always-visible
    "coins saved for this bid" wallet state before beginning the auction flow
    spec. Do not begin auction screen design without this resolved.

[ ] HIGH-RISK: Player Listings pet visibility — UX must confirm that "for sale"
    pets remain visible in the My Animals collection with a "looking for a new
    home" badge. Do not design a hidden-on-listing flow.

[ ] HIGH-RISK: Player Listings sale moment — UX must design an emotional
    scaffolding moment at the point of sale (undo window + memento). Raise the
    undo window requirement with the Developer — this requires a state machine
    change (deferred delete).

[ ] HIGH-RISK: Compare Screen recommendation layer — UX must include a
    task-specific "help me choose" section in the interaction spec. A stats
    table without this layer does not meet the feature's stated purpose for
    the primary user.

[ ] HIGH-RISK findings have been reviewed by [OWNER] before UX begins.
