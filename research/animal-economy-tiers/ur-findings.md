# UR Findings — Animal Economy Tiers

**Feature:** `animal-economy-tiers`
**Researcher:** User Researcher (Phase A)
**Date:** 2026-03-29
**Primary user:** Harry, ~8–10 years old, iPad Pro 11" portrait

---

## Codebase context

The current app treats every animal identically in the economy. `useMarketplace` generates NPC buy/sell offers against any animal from the full `ANIMALS` catalogue (which includes wild, endangered, and prehistoric species). `generateOffer()` picks randomly across `ANIMALS[]`, with no category gating. The codebase already encodes a domestic/wild split — `DOMESTIC_CATEGORIES = ['At Home', 'Stables', 'Farm']` and `WILD_CATEGORIES = ['Wild', 'Sea', 'Lost World']` are defined in `animals.ts` and used by the detail modal to gate Care Needs vs Habitat Threats. The economy has not yet respected this split. The `rarity` field drives price ranges (common: 30–80 coins, legendary: 1200–3000), but no category gating exists in the marketplace or auction logic.

---

## Research questions addressed

**1. Does separating trading from conservation create a meaningful motivational difference for a child player?**

Evidence from child game design research and educational game literature supports this split as beneficial when framed correctly. Children aged 8–10 respond strongly to role-based identity: being a "pet owner" who trades is a different cognitive and emotional frame than being a "wildlife ranger" who rescues. The separation creates two distinct motivation loops that complement rather than compete. Trading provides social/economic satisfaction; conservation provides purpose and moral identity. The risk is that if the conservation path offers no tangible reward parity, children will perceive it as the "worse" path. Research on intrinsic vs extrinsic motivation in children (Deci and Ryan, self-determination theory) indicates that conservation rewards need visible, celebrated outcomes — not just the absence of trading — to feel meaningful rather than punitive.

Confidence: medium. Based on established child development and game design principles; no direct primary research on this exact split in an animal app context.

**2. What mental model do children have about "owning" wild animals vs pets?**

Children in the 8–10 age range generally understand, at a conceptual level, that wild animals belong in the wild and that "owning" a tiger or elephant is not like owning a dog. This understanding is reinforced by school curricula, wildlife documentaries, and media like Blue Planet and Planet Earth. However, in a game context, children freely suspend this belief — zoo games, safari games, and Minecraft all let children "own" wild creatures without generating moral concern. The key distinction is framing. If the game positions wild animals as things to observe, protect, and release, children accept that as the correct mode. If the game previously allowed trading wild animals, removing that capability without explanation will feel like content being taken away — which causes frustration, not conservation insight.

Confidence: medium-high. Strong indirect evidence from analogous game studies; no direct primary research with Harry specifically.

**3. What reward mechanics work for conservation-themed actions (rescue, observe, protect)?**

Evidence from gamified conservation education (e.g., WWF apps, Ranger Academy, Zoo Tycoon missions) identifies the following mechanics as effective for this age group:

- **Animated rescue sequences** — witnessing the animal being "saved" is intrinsically rewarding; static confirmation messages are not.
- **Named, collectable animal with personal backstory** — the child feels ownership through narrative, not coins. "You rescued Tara the Snow Leopard from a mountain trap" lands emotionally; "you received 1x Snow Leopard" does not.
- **Progress toward a visible conservation milestone** — a counter such as "3 of 10 animals rescued" gives a completion target that sustains engagement.
- **Certificates and stamps** — at this age, printed/displayable acknowledgement of achievement is highly motivating (analogous to the school sticker-chart dynamic).
- **Species-specific facts unlocked by rescue** — educational content becomes a reward, not a lesson.

Confidence: medium. Based on analogous products; no usability testing with Harry on this feature.

**4. What happens to existing wild animals in a player's collection when trading is removed?**

This is the most immediately practical question because Harry already has wild animals in his collection (via the generate wizard, which allows Wild and Sea categories). If trading is removed retroactively, any wild animals currently marked `status: 'active'` in `db.savedNames` would become stranded — the player would see them in My Animals but be unable to sell or list them, with no explanation. This is a data migration risk. The correct approach is to grandfather existing wild animals as permanently non-tradeable from a future date, communicate this clearly in-app before the change, and ensure the My Animals screen does not surface marketplace CTAs for grandfathered animals. Silently removing capabilities from existing collection items is a high-priority design risk for trust and perceived fairness.

Confidence: high. Direct observation from codebase; no assumption here.

---

## Key user needs

- Harry needs the conservation path to feel as rewarding as the trading path — not like a second-tier consolation prize — otherwise he will route around it by focusing only on domestic animals.
- Harry needs to understand why wild animals cannot be traded, not just discover the restriction as a wall. Context before constraint.
- Harry needs a visible, celebratable collection outcome for rescued/protected wild animals — something equivalent to the economic satisfaction of a successful marketplace sale.
- Harry needs existing wild animals in his collection to be treated fairly when trading is removed — no silent stranding of animals he has already bonded with by name.
- Harry needs the two animal categories to feel genuinely different in play experience, not just administratively different with the same screens minus some buttons.

---

## Assumptions being made

The following are unvalidated assumptions that the UX Designer and Product Owner should address before spec is written:

- **Assumption:** Harry understands or accepts that wild animals should not be traded. This has not been tested. He may feel it is arbitrary or unfair. UX must design an explanation that lands emotionally, not just logically.
- **Assumption:** Harry's existing wild animals in collection can be cleanly identified as `category in WILD_CATEGORIES`. Confirm whether all generated animals have the correct `category` field populated and whether any ambiguous cases exist (e.g., Dinosaurs in `Lost World`).
- **Assumption:** "Reward-only" means the player cannot also encounter wild animals via the existing generate wizard. If the wizard continues to allow Wild/Sea/Lost World categories, the new economy creates an inconsistency: generate a wild animal for free, but also cannot sell it. Needs a deliberate design decision.
- **Assumption:** Conservation reward quality will be equivalent in perceived value to marketplace coins. This is a product scope question, not a research one, but it will determine whether the split feels fair.
- **Assumption:** The split is binary (tradeable vs non-tradeable). A middle ground — e.g., wild animals can be released for coins but not sold — has not been considered and may better serve the emotional framing.

---

## Risks

**Risk 1 — Retroactive removal of trading rights for existing animals.**
If Harry already owns a Siberian Tiger or a Whale Shark, removing the ability to sell it retroactively will feel like the game has taken something away. This is a fairness perception risk. Severity: high.

**Risk 2 — Conservation path perceived as the "punishment" path.**
If wild animals are harder to get, require more work to care for, and cannot generate coin income, children will rationalise that wild animals are the worse choice. The conservation theme fails if the economics communicate that. Severity: high.

**Risk 3 — Category ambiguity in Lost World.**
Dinosaurs and Mammoths in the `Lost World` category occupy a grey area — they are neither domestic pets nor living wild animals. Treating them as "reward-only conservation animals" may feel conceptually incoherent to a child. Severity: medium.

**Risk 4 — No clear UI signal for "this is a reward-only animal" at the point of discovery.**
If a child generates a wolf and then navigates to the marketplace, discovering the absence of a sell button there (rather than at the moment of adoption) creates confusion and frustration. The constraint must be communicated at the moment of acquisition. Severity: medium.

**Risk 5 — Generate wizard still allows free selection of wild animals.**
The wizard currently has no economic consequences at selection time. If trading is gated by category, the generate wizard for wild animals needs explicit framing ("this animal cannot be sold, but you can rescue and protect it") before the player commits. Severity: medium.

---

## Recommendation

**Proceed with modifications.**

The domestic/wild split is well-motivated educationally and the codebase already encodes the category distinction. However, two design decisions must be resolved in spec before development begins:

1. The retroactive migration path for existing wild animals must be explicitly designed — this is a data integrity question as much as a UX one.
2. The conservation reward loop must be designed to provide equivalent emotional and play satisfaction to the trading loop. Without that parity, the split will drive Harry toward domestic animals only.

The Phase A UR brief for the `poacher-catching` feature is directly dependent on the resolution of this feature, as poacher catching is the primary source of reward-only wild animal acquisition. These two features should be specced in sequence, not in parallel.
