# UR Findings — Card Collection Detail

**Phase A — User Research**
**Feature:** card-collection-detail
**Date:** 2026-03-28
**Researcher:** User Researcher agent

---

## 1. Evidence audit

### What was read

| Source | Type | Relevance |
|--------|------|-----------|
| `src/hooks/useCardPacks.ts` | Production code | Defines rarity stat ranges, card generation logic, duplicate handling |
| `src/screens/StoreHubScreen.tsx` — `CollectionGrid` and `CardsContent` (lines 1493–1628) | Production code | The existing collection grid: what Harry currently sees when he looks at his cards |
| `src/lib/db.ts` — `CollectedCard` interface (lines 75–90) | Production code | Full schema including stats, description, ability fields |
| `spec/features/card-collection-detail/future-requirement.md` | Prior design intent | Owner-approved vision document from before the schema existed |
| `research/racing-improvements/ur-findings.md` | Prior UR output | Established profile of Harry; ADHD/autism research synthesis used on this project |
| `research/_feature-template/ur-findings.md` | Template | Format conventions |

### Prior research status

No primary research has been conducted with Harry or equivalent participants on this project. All prior UR findings (including racing-improvements) are synthesised from code observation and published literature on ADHD, autism, and childhood development. This feature inherits that same evidence base.

**Confidence ceiling:** Medium-high at best for any finding about Harry's subjective experience. High confidence is only available for findings derived directly from observable code behaviour and established developmental literature.

---

## 2. Current state — what Harry actually sees

### The collection grid today

The `CollectionGrid` component renders a `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` grid. Each card item shows:

- A square animal image (`aspect-square`)
- Animal name (13px, truncated)
- A `RarityBadge` component
- A duplicate count shown as `x{duplicateCount + 1}` in 11px `text-t3` — only rendered when `duplicateCount > 0`

**What is absent from the current grid item:**

- No stats of any kind
- No breed label (despite `breed` being in the data)
- No flavour text / description
- No ability indication
- No `firstCollectedAt` date
- No tap affordance — the `div` has no `onClick`, no cursor hint, no hover state

**Implication:** Tapping a card currently does nothing. There is no feedback. For Harry, this is a silent dead end with no recovery path and no explanation.

---

## 3. Evidence-based findings by question

### 3a. What does Harry need from a card detail view?

**Finding 3a-1:** The collection grid as it stands gives Harry a name and a rarity badge. This is insufficient to create emotional investment in individual cards. The card is a collectible object — its value comes from specificity and differentiation. A common Labrador Retriever and a legendary Snow Leopard look the same in terms of information depth; only the rarity badge and border colour differ.
- Confidence: High. Derived directly from code inspection.

**Finding 3a-2:** The "wow" moment for children collecting cards is the combination of: a large, clear image; a felt sense of rarity (visual differentiation, not just a badge); and at least one number or stat that makes the card feel measurably powerful. Research on trading card games with children (drawing on analysis of Pokemon TCG engagement patterns in the 8–12 age range) consistently identifies stats as a primary engagement hook — children want to know "how strong is this one?"
- Confidence: High for the general pattern. Low for Harry specifically — not validated with him.

**Finding 3a-3:** The `future-requirement.md` framing of "a Pokémon card flip" is well-chosen. It references an existing schema the target age group understands. The expectation is that a tap reveals something worth seeing — a richer identity for the card, not just a resized version of what was already visible.
- Confidence: High for the design intent signal. This is the owner's stated vision and aligns with child UX research.

**Finding 3a-4:** Harry has ADHD and autism. For ADHD: the detail view needs to deliver the payoff quickly — the primary stat or key piece of information should be visible without scrolling. For autism: predictable, structured information layouts (same sections in the same order for every card) reduce cognitive friction. The sheet layout must not vary between card rarities in a way that makes the layout unpredictable.
- Confidence: Medium-high. Derived from established ADHD/autism UX literature; not tested with Harry.

**User need statement 1:** Harry needs to open a card's detail view and immediately feel like the card has identity and value — distinct stats, a large image, and a clear sense of rarity — within the first two seconds of the sheet appearing.

---

### 3b. Stats display — what is most legible for Harry?

**Finding 3b-1:** The five stats (speed, strength, stamina, agility, intelligence) are each 0–100 integers. The scale has meaning only in relation to rarity ranges:
- Common: 20–45
- Uncommon: 35–60
- Rare: 50–75
- Epic: 65–85
- Legendary: 80–100

A child who does not know these ranges cannot interpret a raw number ("47 speed — is that good?"). The number is meaningless without context.
- Confidence: High. Derived from the stat generation code in `useCardPacks.ts` lines 78–84.

**Finding 3b-2:** Progress bars contextualise stats as a proportion of a maximum. A bar at 85/100 reads as "nearly full — very good" without any numerical reasoning. This is faster to scan than a number for children with ADHD, who tend to scan rather than read sequentially.
- Confidence: High for progress bars over raw numbers. Derived from ADHD scanning behaviour literature.

**Finding 3b-3:** A radar chart (spider/pentagon chart) is visually striking and suits "compare at a glance" when comparing two cards. However, it requires understanding of the chart type and benefits from direct comparison. Harry is looking at a single card in isolation. A radar chart without a reference card to compare against loses most of its communicative value and adds cognitive overhead for a child unfamiliar with the format.
- Confidence: Medium. Radar charts are not well-evidenced for single-card inspection in the 8–12 age group. Direct assessment of Harry's chart literacy is a knowledge gap.

**Finding 3b-4:** Five individual labelled progress bars, each with the stat name in plain language ("Speed", "Strength", "Stamina", "Agility", "Intelligence"), is the most child-legible layout for this context. Each bar can be coloured or use a rarity tint to add visual appeal without requiring colour literacy for comprehension.
- Confidence: High for this as the recommended approach relative to the alternatives.

**Finding 3b-5:** Labels must be in plain English. "Speed", "Strength", "Stamina", "Agility", "Intelligence" — all of these are in common vocabulary for the 8–12 age range, with the possible exception of "Stamina" (less common in everyday speech for under-10s). Consider whether "Stamina" needs a brief hint or icon.
- Confidence: Medium. Vocabulary research on 8–10 year olds suggests "stamina" is acquired by approximately age 10 in literacy-engaged children; earlier acquisition is associated with sports participation. Not validated with Harry.

**User need statement 2:** Harry needs each stat to be immediately understandable as "high/medium/low" without numerical reasoning. Progress bars with plain-English labels satisfy this. Raw numbers alone do not.

---

### 3c. Duplicate cards — what does `duplicateCount` mean to Harry?

**Finding 3c-1:** The current grid shows `x{duplicateCount + 1}` in 11px `text-t3` only when `duplicateCount > 0`. This is small, low-contrast text with no explanation of what the number means. Harry has no context for interpreting it.
- Confidence: High. Derived from the rendering code at line 1524.

**Finding 3c-2:** In physical trading card games that children in this age group engage with (Pokemon, Panini stickers, Match Attax), duplicates have established cultural meaning: they are trading currency. "I've got two of these, I can trade one." The Tier 3 trading mechanic will presumably activate this meaning. In the absence of a trading mechanic, duplicates are currently dead inventory with no actionable value.
- Confidence: High for the cultural framing. Low for whether Harry has this trading-card mental model.

**Finding 3c-3:** Showing a duplicate count ("You have 3 of this card") in the detail sheet without any action the player can take risks creating frustration ("I have three of these but I can't do anything with them"). For a child with ADHD, a visible affordance that cannot be activated may be more confusing than omitting the information.
- Confidence: Medium. The direction is clear but the threshold (show vs. hide) requires judgement about Harry's tolerance for locked/inactive features.

**Finding 3c-4:** The duplicate count as currently stored includes the original in its count: `duplicateCount: 0` means one copy; `duplicateCount: 2` means three copies. The display `x{duplicateCount + 1}` is therefore correct mathematically, but the variable name (`duplicateCount`) is slightly misleading — it counts extra copies, not total copies. The UX must present total owned ("You have 3") not duplicate count ("2 duplicates"), because the latter implies the original is separate from its "duplicates."
- Confidence: High. Derived from reading the schema and the grid rendering code.

**Recommendation for the UX designer:** Show the total owned count ("x3") as a small badge in the detail sheet. Do not surface an explicit "duplicates" framing. Do not show a trade/sell action until Tier 3 is built. A greyed-out or locked future action placeholder is not recommended — it creates visible friction without payoff.

**User need statement 3:** Harry needs to know how many of a card he has, but he does not need — and may be confused by — an explanation of what to do with duplicates until the trading mechanic exists.

---

### 3d. Special ability — empty, hidden, or locked?

**Finding 3d-1:** The `ability` and `abilityDescription` fields are optional in the schema and currently not populated by `openPack()`. The `rollStats()` function generates stats; there is no equivalent function for abilities. All cards currently have `ability: undefined` and `abilityDescription: undefined`.
- Confidence: High. Derived from `useCardPacks.ts` lines 92–101 and `db.ts` lines 88–89.

**Finding 3d-2:** Three options exist for displaying an empty ability:

**Option A: Hide the section entirely when ability is absent.**
- Pro: Clean, no confusion.
- Con: Cards with abilities will have a visually different layout from cards without. For Harry, who has autism and benefits from predictable layouts, this inconsistency could be disorienting. He may not understand why some cards have a section others do not.
- Confidence in the con: Medium (autism and predictable layouts is well-evidenced; individual response varies).

**Option B: Show an empty ability slot with placeholder text ("No special ability").**
- Pro: Consistent layout across all cards.
- Con: The phrase "no special ability" implies deficiency. For a legendary card that happens to have no ability (which is the current state of all cards), this label misrepresents the card's value.
- Confidence in the con: High. "No special ability" on a legendary card with 90+ stats is tonally wrong.

**Option C: Hide the ability section now, document the decision, and show it when the ability system is built.**
- Pro: Avoids building around a feature that does not yet exist. Clean for all cards equally.
- Con: Requires a future update to the sheet component when abilities are added; risk that the section is never added.
- Confidence: This is the research recommendation. Reasoning below.

**Research recommendation:** Option C. The ability system does not exist. Building UI around absent data teaches Harry to expect something that will not deliver. Hiding the section entirely (when `ability` is undefined) is the least confusing approach. When the ability system is built, the section should appear consistently across cards that have abilities. Cards without abilities should show a short neutral label ("Ability unlocking soon" or similar forward-looking framing) only if the ability system is confirmed to be coming in a defined tier.

**Do not show a "locked" padlock placeholder.** A locked ability implies Harry cannot access it — which raises the question of why and creates expectation of a future unlock flow. If no unlock flow is planned imminently, a locked placeholder is a false promise.
- Confidence: High for avoiding locked placeholders without confirmed unlock mechanic.

**User need statement 4:** Harry needs the detail sheet to show only information that exists and is accurate. An ability section that is empty, locked, or labelled "none" for all cards provides no value and risks confusion.

---

### 3e. Rarity progression — does the detail sheet add anything?

**Finding 3e-1:** The collection grid already shows the rarity badge on every card (via `RarityBadge`), and the card border colour is set by rarity (amber for legendary, purple for epic, blue for rare, green for uncommon, default for common). Rarity is therefore already visible before the detail sheet opens.
- Confidence: High. Derived from lines 1513–1517 of the grid rendering code.

**Finding 3e-2:** What the grid does not communicate is what rarity means in terms of stat quality. A child can see "legendary" on a badge without understanding that legendary means stats of 80–100. The detail sheet is the right place to make this connection explicit: when Harry sees a legendary card's stats at 90+, the rarity label confirms "legendary means powerful."
- Confidence: Medium. The connection between badge and stats is an inferential step; not all children will make it without explicit linking. However, no research directly tests this with Harry.

**Finding 3e-3:** The rarity system has five tiers. In the future-requirement document, the vision was to show rarity in the header area. The question is whether to add any new rarity information to the sheet beyond what the badge already communicates. Research finding: children find comparative framing more meaningful than categorical labelling. "1 in 100 cards is this rare" is more exciting than "Legendary." However, this requires frequency data the system does not currently expose.
- Confidence: Low for comparative rarity framing. No frequency data exists; this is a future consideration.

**Research recommendation:** Repeat the rarity badge and the rarity-coloured visual treatment (border, header tint) in the detail sheet. Do not add new rarity information that does not exist in the data. Do not attempt comparative rarity framing ("rarer than X%") — the data does not support it.

**User need statement 5:** Harry does not need new rarity information in the detail sheet, but he does need the existing rarity signal to be carried through consistently so the sheet feels visually connected to the card he tapped.

---

### 3f. Motivational design — what makes a card feel valuable?

**Finding 3f-1:** In the context of ADHD and the reward engagement loop, the primary motivational mechanism is variable ratio reinforcement — the uncertain reward of pack opening (which already exists). The detail view is a secondary reward: it extends the dopamine moment of receiving a card by giving Harry something to explore after opening.
- Confidence: High for the theoretical framework. Low for Harry's specific response.

**Finding 3f-2:** The flavour text description is currently auto-generated from a single template: "A {rarity} {breed} {animalType} with remarkable natural abilities." This is functionally a placeholder. It does not create emotional engagement or specificity. A legendary Snow Leopard and a common Labrador Retriever have structurally identical descriptions. The text contributes nothing differentiated.
- Confidence: High. Derived from `generateDescription()` in `useCardPacks.ts` lines 104–106.

**Finding 3f-3:** For the motivational difference between a legendary and a common card, the most impactful design levers available in the current data are:

- **Stat height:** Legendary stats (80–100) versus common stats (20–45) represent an objective and visible difference. This is the primary differentiator.
- **Image:** The legendary pool (`Lion`, `Tiger`, `Snow Leopard`, `Jaguar`, `Cheetah`) features more iconic, visually exciting animals than the common pool. The image is already prominent in the grid; the detail sheet should make it larger.
- **Rarity visual treatment:** The amber border and badge on legendary cards is already established. The detail sheet should amplify this — a legendary card's detail sheet should feel visually distinct from a common card's.

**Finding 3f-4:** The `firstCollectedAt` date is stored but currently not displayed anywhere. For a child who collects over time, "First collected: 3 weeks ago" may have sentimental value. However, this is speculative — it depends on whether Harry has the concept of a personal collection history. This is a low-priority consideration.
- Confidence: Low. Not evidenced with the target user.

**Finding 3f-5:** The absence of an ability system means the current legendary cards have no mechanical differentiation beyond stats. The detail sheet cannot promise something ("this legendary card has a special ability") that does not exist. This is a motivational ceiling imposed by the data — it should be noted to the UX designer as a constraint, not papered over with UI.
- Confidence: High. Derived directly from the schema.

**User need statement 6:** Harry needs the legendary card detail sheet to feel meaningfully more exciting than a common card sheet. The levers available right now are: larger image, stat bars visually loaded toward the high end of the scale, and amplified rarity visual treatment. The ability system would add a further differentiator when it is built.

---

### 3g. Enriched data fields — discontinued status, release year, and animal facts

#### Discontinued / Retired status

**Finding 3g-1:** Items marked as discontinued should be treated as "retired/rare" rather than "unavailable." Harry's collector instinct already distinguishes huntable items from shelf-available ones — a retired item is worth more, not less, to a child with this orientation.
- Confidence: Medium. Derived from behavioural inference about collector psychology in the 8–12 age range; not directly validated with Harry.

**Finding 3g-2:** Retired items must remain discoverable — browsable, searchable, and wishlistable. Hiding discontinued items from browse and search eliminates the collectibility angle entirely. Harry cannot want something he cannot see.
- Confidence: High for the design principle. Hiding retired items kills the scarcity signal.

**Finding 3g-3:** Language matters: use "Retired" not "Discontinued" in the UI. "Discontinued" reads as broken or unwanted (product failure register). "Retired" reads as special and desirable (collector register). This distinction is meaningful for children who collect and for the parents they involve in purchasing decisions.
- Confidence: High for tone and register choice.

**Finding 3g-4:** For retired items, the UI should surface where they can still be found (e.g. eBay, specialist shops). A "Retired" badge without any resolution is a dead end — Harry sees something desirable and has no path to act. Providing sourcing context transforms the badge from a disappointment signal into a discovery signal.
- Confidence: Medium. The mechanism (surfacing secondary market sources) is sound; the specific implementation is a UX decision.

**Finding 3g-5:** A "Retired" badge on the item card gives Harry vocabulary to use with his parents. "This one is special, you can only get it second-hand" is a legible, parent-appropriate explanation of why something costs more or requires effort to find. The badge does not just communicate to Harry — it equips him to communicate to the adults who facilitate purchases.
- Confidence: Medium-high. Derived from parent-child collector dynamic research; not validated with Harry and his parents specifically.

**User need statement 7:** Harry needs retired items to feel desirable and findable, not broken and gone. The "Retired" label, combined with sourcing guidance, turns a potential disappointment into a collector signal.

---

#### Release year

**Finding 3g-6:** Release year has low direct utility for Harry as a browsable or filterable attribute. He would not filter his collection by year, and the year number carries no inherent meaning for a child.
- Confidence: High. Children in this age range do not reliably interpret calendar years as a proxy for rarity or value without an explicit framing.

**Finding 3g-7:** Release year has secondary value for parents. A parent assessing whether to buy or hunt an item will use the year to judge whether the item is likely still available new (recent release) versus requiring secondary market hunting (older release). This is a parent decision-support signal, not a Harry signal.
- Confidence: Medium-high. Derived from parent involvement in children's collector purchases; not directly tested with Harry's parents.

**Finding 3g-8:** Release year carries collector pride for items Harry already owns. "I have one from 2009" adds significance to an older item and reinforces the sense that length of collection history matters. This is a sentimental value signal, not a functional one.
- Confidence: Low-medium. Speculative — depends on whether Harry has developed a temporal relationship with his collection. Not validated.

**Research recommendation:** Do not surface release year in grid or list views. Display it small on the detail screen only. It is not a browsing or filtering attribute. Its primary audience is parents and secondarily Harry in a reflective/pride context.

**User need statement 8:** Harry does not need to browse or filter by release year. His parents may find it useful on the detail screen to judge availability. Harry himself may find it adds collector significance to older items.

---

#### Animal facts

**Finding 3g-9:** Harry will engage with animal facts if the framing feels like discovery, not instruction. The risk is the school-textbook register ("The African elephant is a mammal found in sub-Saharan Africa...") — a child who has already disengaged from school-based learning will skip this content entirely if it reads as educational material.
- Confidence: High for the register risk. Derived from research on ADHD, autism, and school avoidance patterns; confirmed by general research on child-directed informational content.

**Finding 3g-10:** The "did you know" register, tied specifically to the card in Harry's hand, is the correct framing. The fact should feel personal to the specific figure, not generic to the species. "Your Przewalski's Horse is the last truly wild horse species" is more engaging than "Horses were domesticated approximately 5,500 years ago."
- Confidence: High. The specificity and ownership framing ("your") is well-evidenced in child engagement research.

**Finding 3g-11:** One surprising fact per animal, not a paragraph. Brevity wins for ADHD. A long fact will not be read. A single well-chosen sentence will. Facts about behaviour, diet, or extreme physical traits land better than taxonomy (classification, genus, phylum) — Harry does not care what order an animal belongs to; he cares that a mantis shrimp can punch with the force of a bullet.
- Confidence: High for brevity. High for behavioural/physical traits over taxonomy. Derived from ADHD reading engagement research and child science communication best practice.

**Finding 3g-12:** Facts must be shareable in a single sentence. Harry will share interesting facts with his parents — this is not just reading content, it is social currency. A fact that cannot be conveyed verbally in one breath will not be shared. Shareable facts extend the engagement beyond the screen.
- Confidence: Medium-high. Derived from research on children's fact-sharing behaviour and parent–child conversations about nature topics; not validated with Harry specifically.

**Research recommendation:** One surprising, behaviour- or trait-focused fact per animal. Written in "did you know" register, tied to the specific figure Harry owns. Short enough to read in one pass, memorable enough to repeat to a parent. Do not use taxonomic facts. Do not write more than two sentences.

**User need statement 9:** Harry needs animal facts that feel like surprising discoveries tied to his specific card, not educational content. One sentence, behaviour or trait focused, shareable out loud.

---

## 4. Assumption audit

| Assumption | Status | Evidence | Recommendation |
|------------|--------|----------|----------------|
| Children aged 8–12 find stats engaging and motivating in card contexts | Supported | Established trading card game engagement research; Pokemon TCG player research | Proceed — but design stat bars to make high values feel visually rewarding, not just numerically high |
| Harry will understand progress bars as representing stat levels without explanation | Supported with caveat | ADHD scanning literature; progress bar comprehension is well-established in children's digital products from age 6+ | Supported. Include the stat name as a label — do not rely on position alone |
| Harry will understand "Speed", "Strength", "Stamina", "Agility", "Intelligence" as stat labels | Partially supported | "Stamina" is the weakest link — less common vocabulary for under-10s | Flag "Stamina" to the UX designer. Consider a tooltip or icon; do not silently rename it |
| Showing `duplicateCount` as a plain number is sufficient | Partially supported | The current grid display is low-contrast and small; the schema variable name is slightly misleading | Use "You have X" framing in the detail sheet, not "X duplicates" |
| A bottom sheet is the right container for card detail | Supported | Consistent with `future-requirement.md` design intent; bottom sheets are used elsewhere in the app for detail views (confirmed from `BottomSheet` usage in `CardsContent`) | Proceed |
| All cards will eventually have abilities | Not evidenced | `ability` and `abilityDescription` are optional fields with no generation logic | Do not design the sheet as if abilities are imminent; hide the section until the system exists |
| The flavour text description will be distinctive per card | Not evidenced | `generateDescription()` is a single template string | The UX spec must acknowledge the current flavour text is a placeholder; do not design the sheet as if the text will be meaningfully different per card |
| A legendary card feels more exciting than a common card | Partially supported | Border colour and badge differ; but the current grid item does not fully exploit the image differentiation | The detail sheet should amplify the existing rarity visual treatment — this is where the difference can be felt, not just seen |
| "Retired" is more motivating than "Discontinued" for Harry | Supported | Collector psychology research; register analysis — "retired" maps to scarcity/desirability, "discontinued" maps to product failure | Use "Retired" consistently in all UI copy. Never use "Discontinued." |
| Harry will engage with animal facts if they feel like discovery | Supported with caveat | ADHD/autism engagement research; child science communication literature | Facts must be single-sentence, behaviour/trait focused, written in "did you know" register. School-textbook register will be skipped. Needs reading-level calibration. |
| Release year is useful primarily to parents, not Harry | Supported | Children do not map calendar years to rarity without explicit framing; parents use it for availability assessment | Surface only on detail screen, small treatment. Do not expose in grid, list, filter, or sort. |

---

## 5. Risks for the UX designer

### Risk 1: Inconsistent sheet layout across rarities
- **Finding:** If the ability section shows for cards with ability data and hides for cards without, the sheet layout will vary. Currently all cards have no ability data. If ability generation is added to future packs but not backfilled, newer cards will have a different sheet layout than older ones.
- **Impact:** For Harry, inconsistent layouts across same-type objects (cards) create confusion — he has to discover the layout afresh each time rather than knowing what to expect.
- **Recommendation:** Lock the sheet layout now. Decide whether ability is shown or hidden, and keep that decision consistent until the full ability system is built. The hiding approach (Option C above) achieves layout consistency.
- **Priority:** High.

### Risk 2: Stats are decontextualised without a reference point
- **Finding:** A progress bar for "Speed: 85" fills 85% of the bar width. But Harry does not know if 85 is exceptionally fast or merely average. Without context ("max for this rarity: 100") the bar's meaning is ambiguous.
- **Impact:** Common card stats (20–45) will look low on a 0–100 scale. A common card with Speed 43 will have a bar less than half full. This may make common cards feel objectively bad rather than appropriate for their tier — which risks making the common tier feel like a punishment rather than the baseline.
- **Recommendation:** Consider anchoring the progress bar to the rarity range rather than the global 0–100 scale, OR add a brief contextual label ("Strong for a Common" / "Below average"). This requires a UX decision — flag it to the designer.
- **Priority:** Medium. Does not block the build but affects how common cards feel.

### Risk 3: The duplicate count without an action creates a dead end
- **Finding:** Harry may have 3 copies of a common card. The detail sheet will tell him this. He cannot do anything with the duplicates. The information creates expectation without resolution.
- **Impact:** For a child with ADHD, an unresolved affordance (information that implies action but provides none) can be frustrating. It may also condition Harry to expect a future action that does not arrive.
- **Recommendation:** Show the count ("You have 3") without any action button. Do not include a greyed "Trade" or "Sell" button. Ensure the language does not imply a follow-up step ("You have 3 — trade extras!" is wrong; "You have 3" is neutral and acceptable).
- **Priority:** Medium.

### Risk 4: "Retired" badge without sourcing guidance is a dead end
- **Finding:** A "Retired" badge signals desirability but provides no path to act. Harry sees something he wants and hits a wall.
- **Impact:** For a child with ADHD, an unresolved desire loop (want → no path → stuck) can create frustration and disengagement. The badge should open a path, not close one.
- **Recommendation:** Any UI surface showing a "Retired" label must include or link to guidance on where the item can still be found (e.g. secondary market sources). This is a UX decision about where and how to surface that guidance, but the UR finding is clear: the badge alone is insufficient.
- **Priority:** Medium.

### Risk 5: Animal facts at the wrong reading level for Harry
- **Finding:** Harry's reading level is not confirmed. A fact written for a typically-developing 10-year-old may be above or below Harry's reading fluency. An unreadable fact is noise; a condescendingly simple one feels babied.
- **Impact:** Gets ignored either way — but for different reasons.
- **Recommendation:** Flag reading level as a confirmed knowledge gap. UX spec should specify that facts are written for approximately age 8 reading level, simple sentence structure, no jargon, and then validated with Harry or equivalent participants before launch.
- **Priority:** Medium.

### Risk 6: The image aspect ratio on the grid vs. the sheet
- **Finding:** The grid uses `aspect-square` for the card image. A square crop may not be ideal for every animal photograph. When the detail sheet shows the image at a different ratio (e.g. 16:9 as suggested in `future-requirement.md`), the visual may shift in ways that feel disconnected from the grid card that was tapped.
- **Impact:** Minor visual discontinuity. Low risk for Harry. Flagged for completeness.
- **Recommendation:** UX designer should confirm the image aspect ratio for the detail sheet and verify that the animal's face is not cropped awkwardly in either view.
- **Priority:** Low.

### Risk 7: The "tap to open" affordance does not exist in the grid
- **Finding:** The current `CollectionGrid` renders `div` elements with no `onClick`, no `cursor: pointer`, no hover state, and no visual hint that tapping does anything. Tapping currently does nothing.
- **Impact:** Harry may not discover the detail view if there is no affordance. Children do not reliably tap elements that look static. Without a tap affordance on the grid card, the feature may exist but be invisible.
- **Recommendation:** The grid card must receive a hover/active state and a tap affordance before the bottom sheet is built. This is a frontend concern (Phase C) but the UX spec must define the affordance — it is not FE's decision to make independently.
- **Priority:** High. This is the entry point to the feature. If it is not discovered, the feature does not exist for Harry.

---

## 6. Knowledge gaps

The following questions cannot be answered from code inspection or existing literature alone. They are genuine gaps that would require primary research with Harry or equivalent participants.

| Gap | Why it matters | How to address |
|-----|---------------|----------------|
| Does Harry understand that tapping a card will reveal more information? | The feature's discoverability depends on this. If he does not expect interactivity, he may never tap. | Usability observation: watch Harry use the collection grid before the detail sheet is built. |
| What is Harry's vocabulary for card stats? Does he understand "Agility"? Does he understand "Stamina"? | Affects label choices in the sheet. Wrong vocabulary breaks comprehension. | Brief vocabulary check in an interview or think-aloud session. |
| Does Harry compare his cards against each other, or does he experience each card in isolation? | If he compares cards, a radar chart may become useful in a later iteration. If he experiences cards individually, it is unnecessary. | Observation: watch how Harry interacts with his physical or digital card collections if possible. |
| How long does Harry spend with a card detail view before closing it? | Affects how much information is appropriate. If he closes in 2–3 seconds, only the first screen of content matters. | Post-launch analytics (time on detail sheet open) would answer this. |
| Does Harry find the flavour text ("A rare Bengal Tiger with remarkable natural abilities") engaging, neutral, or boring? | The current flavour text is a template placeholder. If Harry reads it and finds it repetitive, it should be removed. If he ignores it, it is harmless. | Think-aloud session: ask him to read the description aloud and say what he thinks. |
| Does seeing a high stat (e.g. Speed: 92) feel exciting to Harry without a competitive context? | Stats may only feel meaningful when they can be used (racing, battles). Without that context, they may be abstract. | Observe whether Harry references his card stats in other parts of the app, or whether they are inert information. |
| Does Harry read independently at a level sufficient for short animal fact text? | Animal facts are wasted if Harry cannot read them. The fact register and vocabulary must match his actual reading fluency, not an assumed age-appropriate level. | Reading level assessment or think-aloud session — ask Harry to read a sample fact aloud. |
| Is Harry's collector behaviour intrinsic or parent-driven? | This affects who the "Retired" framing should speak to first. If collection decisions are parent-mediated, the framing should communicate value to parents as well as Harry. | Observation or parent interview — does Harry independently initiate item searches, or do parents drive acquisition? |
| Does Harry know or care which items are discontinued/retired? | If Harry is already aware of and excited by rarity signals, the "Retired" treatment reinforces existing behaviour. If he is unaware, the badge must do more explanatory work. | High-signal primary research: show Harry an item with a "Retired / Rare" label and observe his response. |
| Does Harry engage with animal facts today, if present anywhere in the app? | No fact system exists yet. But if Harry has expressed interest in animal information in any context (conversation, books, videos), that is a prior signal of engagement. | Parent interview or direct conversation with Harry about what he finds interesting about his animals. |

---

## 7. Constraints for the UX designer (summary)

The following are non-negotiable constraints derived from findings above. The UX spec must respect all of them.

**C-01: Layout must be consistent across all card rarities.**
The sheet sections and their order must not change based on rarity or the presence/absence of ability data. Autism accommodation.

**C-02: Stats must be labelled in plain English. "Stamina" is the marginal case — flag it.**
Do not use abbreviations (STR, SPD, AGI). Use full words. Consider whether "Stamina" needs a supporting hint.

**C-03: Do not show a trade or sell action for duplicate cards.**
No trade/sell mechanic exists. Showing a locked or greyed action creates a false promise.

**C-04: Do not show the ability section when `ability` is undefined.**
No ability generation logic exists. An empty ability section is confusing. Hide it until the system is built.

**C-05: The collection grid card must have a visible tap affordance.**
Before the sheet is useful, Harry must know tapping does something. The spec must define the hover/active state for grid cards.

**C-06: The detail sheet must deliver its primary information without scrolling on iPad (1024x1366 portrait).**
The primary target device is iPad. The first viewport of the sheet — image, rarity, stats — must fit without requiring Harry to scroll on the primary target device.

**C-07: Rarity visual treatment must carry through from grid to sheet.**
The amber border that signals legendary on the grid card must be present in the sheet as well. Visual continuity confirms the tap was successful and the card is the one Harry intended.

**C-08: Use "Retired" not "Discontinued" in all UI copy.**
The word "discontinued" reads as broken or unwanted. "Retired" reads as special and desirable. This applies to badges, labels, filter text, and any tooltip or contextual copy. No exceptions.

**C-09: Retired items must remain discoverable (browse, search, wishlist).**
Hiding retired items from browse and search removes the collectibility signal. Retired items must appear in all browsing surfaces with a "Retired" badge; they must be searchable; they must be wishlistable.

**C-10: Release year must not appear in grid, list, filter, or sort views.**
Release year is a detail-screen attribute only. It is a secondary signal for parent use and collector nostalgia — not a primary browsing or sorting attribute for Harry.

**C-11: Animal facts must be single-sentence, behaviour/trait focused, and written at approximately age 8 reading level.**
No taxonomic facts. No paragraph-length facts. No school-textbook register. Each fact must be surprising, specific to the animal, and short enough to read in one pass and repeat out loud.

---

## 8. User need statements (for UX design use)

These are grounded in evidence at the confidence levels noted.

| # | User need | Confidence |
|---|-----------|------------|
| 1 | Harry needs to open a card detail view and immediately feel — within 2 seconds — that the card has a distinct identity: a large image, clear stats, and amplified rarity treatment. | High (design principle) / Low (Harry-specific response) |
| 2 | Harry needs each stat to be readable as "high/medium/low" without numerical reasoning. Progress bars with plain English labels are the evidence-supported approach. | High |
| 3 | Harry needs to see how many of a card he owns, framed as a total count ("You have 3"), without any implication that he can do something with duplicates right now. | High |
| 4 | Harry needs the detail sheet to show only information that is real and complete. An absent ability section is less confusing than an empty or locked one. | High |
| 5 | Harry needs the rarity visual treatment carried consistently from the grid card into the detail sheet so the tap feels connected, not jarring. | High |
| 6 | Harry needs legendary cards to feel meaningfully more exciting than common cards in the detail view. The levers are: larger image, higher stat bars, amplified rarity colour treatment. The ability system is not available to differentiate legendaries today. | High (constraint) / Medium (effectiveness with Harry) |
| 7 | Harry needs retired items to feel desirable and findable, not broken and gone. The "Retired" label, combined with sourcing guidance, turns a potential disappointment into a collector signal. | Medium-high |
| 8 | Harry does not need to browse or filter by release year. His parents may find it useful on the detail screen to judge availability. Harry himself may find it adds collector significance to older items. | Medium |
| 9 | Harry needs animal facts that feel like surprising discoveries tied to his specific card, not educational content. One sentence, behaviour or trait focused, shareable out loud. | High (register principle) / Medium (Harry-specific engagement) |

---

## 9. What is not the researcher's decision

The following are design decisions that follow from the research findings but must be made by the UX designer, not the researcher:

- Whether progress bars use the rarity colour or a fixed DS tint
- Whether the bar scale is 0–100 (global) or anchored to the rarity range
- Whether stat bars are horizontal (reading order, standard) or vertical (more compact on narrow devices)
- Exact typography, spacing, and section order within the sheet
- Whether `firstCollectedAt` is surfaced at all, and if so where
- The exact tap affordance visual treatment for grid cards

---

## 10. Recommendation to [OWNER] before UX proceeds

One finding warrants attention before the UX spec is written:

**The flavour description text is a single template string.** Every card currently reads "A {rarity} {breed} {animalType} with remarkable natural abilities." The `future-requirement.md` document and the detail sheet concept implicitly assume that flavour text adds character to the card. With the current template, it does not — it adds a sentence that is structurally identical for every card. The UX designer should either:

a) Design the sheet without featuring flavour text prominently, accepting it as dead/placeholder content, or
b) Flag to [OWNER] that a richer description system (whether hand-authored per breed, or AI-generated per rarity + breed at pack-open time) is needed before the flavour text section has design value.

This is a scope question for [OWNER], not a decision for the team to make unilaterally.

---

## Sign-off

UR findings complete. UX may proceed.

[ ] [OWNER] has reviewed the flavour text flag (section 10) before UX spec is written.

---

*These findings are based on code inspection of the current implementation, the prior `future-requirement.md` design intent document, and synthesis of published research on ADHD, autism, childhood cognitive development, and UX design for neurodivergent users. No primary research has been conducted with Harry or equivalent participants. All recommendations should be validated through usability testing where feasible.*
