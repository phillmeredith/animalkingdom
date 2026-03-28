# UR Findings — LeMieux Equipment System

Feature: `lemieux-equipment-system`
Phase: A (User Research)
Author: User Researcher
Date: 2026-03-28
Status: Complete — ready for UX Designer (Phase A parallel) and PO (Phase B)

---

## Evidence base

This document draws on:

- Direct sampling of `/lemieux/horsewear/products.json` (411 items across 9 categories) and `/lemieux/hobby-horses/products.json` (63 items)
- The existing item schema in `src/data/itemDefs.ts` (5 categories, 16 items — all fictional)
- The current `ShopScreen.tsx` and `MyAnimalsScreen.tsx` implementations
- The `shop-item-card` interaction spec (most recently shipped spec, dated 2026-03-27)
- The `AnimalEntry` type in `src/data/animals.ts`, which defines the app's animal catalogue
- The Design System (`design-system/DESIGN_SYSTEM.md`) — particularly its note that the app is "adapted for a child with ADHD and autism"

No direct user research with Harry exists in the `/research/` directory at the time of writing. All statements about Harry's behaviour or preferences are therefore inferences from the above context, not observed evidence. Confidence levels are declared throughout.

---

## 1. User need statement

**Evidence-grounded statement:**

Harry needs a way to dress and equip his virtual horses with real LeMieux products so that the horses he cares for in the app feel personally his and visually distinct — not generic — and so that caring for them feels like a genuine activity with visible, lasting results.

**Supporting rationale:**

The existing shop sells fictional items (Leather Saddle, Fleece Blanket, Hay Bale) with no visual representation on animals. Nothing Harry buys changes how his horse looks. This means ownership is invisible: buying a 400-coin Champion Saddle produces no meaningful signal in the animal view beyond a stat number. For a child, visible, persistent personalisation is a core driver of attachment to virtual pets (confidence: high — well-established in child game design research; no Harry-specific evidence).

The LeMieux brand is already the owner's chosen real-world reference point, which suggests Harry may already have familiarity with LeMieux products through the owner's interest in equestrian goods. This assumption is unvalidated.

**What Harry does not need:**

Harry does not need a technically accurate horse-care simulation. He is not learning to be a groom. The equip screen should feel like dressing-up, not a management task.

---

## 2. Mental model — Minecraft equipment slots on a child iPad user

**The Minecraft analogy is valid but needs adaptation. Confidence: medium.**

Minecraft's equipment screen presents a humanoid figure with named slots around it (helmet, chestplate, leggings, boots, offhand). Players drag items from their inventory into slots. This is a well-understood pattern for children who play Minecraft, and Harry's age group (school-age, owner has chosen an app designed for a child) makes Minecraft familiarity plausible.

However, four important differences must be accounted for:

**Difference 1 — Input modality.** Minecraft on PC uses mouse drag. On iPad, drag-and-drop uses touch. Touch drag on a child's finger introduces fat-finger risk: the hit target for a slot must be substantially larger than on a PC interface. Minecraft's mobile (Bedrock) version on iPad does use touch drag, but the slots are generously sized. A horse silhouette with small anatomical slots around it will be harder to target accurately than Minecraft's character screen.

**Difference 2 — Shape of the figure.** A horse silhouette is horizontal and longer than a humanoid figure. Slots arranged "around" a horse image will produce an irregular layout with slots at very different distances from one another. This is unlike Minecraft's symmetrical humanoid arrangement. The spatial mapping between slot position and body part may not be immediately legible.

**Difference 3 — Number of slots.** Minecraft's core equipment is 4 armour slots plus a weapon. A horse has more candidate slots (head, neck, body/rug, saddle, front legs x2, back legs x2, lead rope). Presenting 8+ slots around an image will produce a cluttered interface on a phone-sized viewport. On iPad at 1024px wide this is more manageable, but the UX Designer must explicitly address how many slots are shown simultaneously.

**Difference 4 — ADHD and autism context.** The DS notes the app is "adapted for a child with ADHD and autism." Drag-to-slot requires sustained attention to hold a drag gesture, locate the target, and release accurately. If Harry loses focus mid-drag or releases in the wrong place, the item does not equip and there is no clear feedback about where it went. This creates a frustration loop. Tap-to-equip (tap item, then tap slot) is two discrete steps rather than one continuous motor gesture, which may reduce this risk.

**Recommendation to UX Designer:** Do not commit to drag-to-slot without explicitly designing what happens on a failed drag (item returns to inventory clearly, no silent failure). Consider offering tap-to-slot as the primary interaction, with drag as an optional enhancement. See section 7 for full interaction analysis.

---

## 3. Equipment slot mapping — LeMieux categories to horse body slots

The following mapping is derived from reading the product catalogue. Confidence on primary mappings: high. Confidence on edge cases: medium.

### Primary mappable categories (produce visible on-horse equipment)

| LeMieux category | Items sampled | Horse body slot | Notes |
|---|---|---|---|
| horse-rugs (57 items) | Turnout Rugs, Stable Rugs, Rug Liners, Exercise Sheets, Fly Rugs, Cooler Rugs | Body / back | One rug at a time. Rugs cover the horse's back and sides — the most visually prominent slot. |
| fly-hoods (54 items) | Classic, Loire, Acoustic, Vogue, Crystal, Tie Down fly hoods | Head | A hood covers the ears and poll area. Strongly head-slot. High visual impact for the child. |
| boots-bandages (54 items) | Brushing, Dressage, Overreach, XC, Support, Stable, Turnout, Therapy, Travel Boots, Bandages | Legs (x4) | Boots go on individual legs. Four separate slots would be technically correct but creates 4 slots for one category — see risk note below. |
| headcollars-leadropes (51 items) | Vogue, Leather, Comfort, Yard, Safety Headcollars; Leadropes | Head / halter | A headcollar fits over the horse's nose and poll. Distinct from a fly hood — can be worn simultaneously in real life. As a game slot, head must be a single slot or split into "hood" and "halter" sub-slots. |
| saddlery-tack (47 items) | Bridles, Reins, Bit Accessories, Bridle Parts, Seat Savers, Studs, Accessories | Saddle slot + head (bridle) | Bridles are head-mounted. Saddles/seat savers go on the back. This category spans two body areas, which is a slot mapping problem the UX Designer must resolve. |
| fly-protection (36 items) | Fly Masks, Fly Boots, Nose Filters, Fly Sprays, Itch Relief | Head (mask) + legs (boots) | Fly protection also spans body areas. Fly masks are head slot; fly boots are leg slots. Fly spray is a consumable — see non-equippable section. |

### Categories that do not map to a visible slot (consumable or environmental)

| LeMieux category | Items sampled | Classification | Suggested treatment |
|---|---|---|---|
| grooming-care (59 items) | Brushes, Grooming Bags, Grooming Sets, First Aid, Hoof Care | Consumable care items | Used once for a hygiene/happiness stat boost, do not persist on horse. Maps to existing "brush" category behaviour. |
| stable-yard (30 items) | Horse Stable Toys, Stable Accessories, Haynets, Treats | Environmental / consumable | Treats and haynets are feed items. Stable accessories are environmental. None are wearable. Could provide a stable environment bonus. |
| supplements (23 items) | Calmers, Joints, Electrolytes, Performance, Digestion, Hoof | Consumable stat items | These are internal — a horse cannot "wear" a supplement. They logically provide a temporary stat boost when "used," not a persistent visible change. |

### The four-leg problem

Boots-bandages includes 54 items across 10+ sub-categories. In real life, a horse wears a boot on each leg, and the front and back legs often have different boot types. Implementing four individual leg slots creates complexity:

- Harry must acquire four matching or complementary boots
- The inventory and equip UI must handle partial leg coverage (e.g., only two boots equipped)
- This is technically correct but may feel like homework rather than dressing up

**Pragmatic simplification for child UX:** Consider a single "Legs" slot that equips a set of boots (all four legs change visually when one boot item is purchased). This maps to how LeMieux sells boots in practice — often as pairs or sets. This is an assumption that should be confirmed by the PO.

---

## 4. Item compatibility — which animals can be equipped

**This is a high-priority knowledge gap. No evidence exists in the current codebase for how equip eligibility should be scoped.**

The current animal catalogue (`animals.ts`) defines six categories: At Home, Stables, Farm, Lost World, Wild, Sea. Harry owns virtual horses. The `AnimalCategory` type includes 'Stables' which is the natural home for horses. However, the app also includes dogs, cats, farm animals, dinosaurs, and sea creatures.

### What the data tells us

LeMieux horsewear is designed exclusively for horses and ponies. Fly hoods, rugs, and bridles do not fit a dog or a dinosaur. The product descriptions consistently reference "your horse" or "your equine companion."

The hobby horse product line (`hobby-horses/products.json`) is explicit that Toy Pony accessories fit "head only" (e.g., "Toy Pony accessories will fit (head only, e.g. Toy Pony Bridles, Headcollars, Fly Hoods)"). This is relevant because hobby horse accessories from the LeMieux toy range should only be purchasable/equippable on horse-type animals.

### Risks of unrestricted equipping

If a child can equip a saddle on a cat or a rug on a tyrannosaurus, the feature loses meaning and the real LeMieux brand association becomes nonsensical. This is a design risk, not a technical one.

### Assumption that needs validation

We do not know whether the owner wants equipping restricted to Stables-category animals only, or to a subset (horses and ponies specifically), or whether a broader metaphorical interpretation ("any animal can wear a blanket") is acceptable. This must be confirmed with the owner before Phase B is finalised.

**Working assumption for UX design purposes:** Equipping should be restricted to animals in the 'Stables' category. All other categories show an "equipment not available for this animal type" state in their animal detail view.

### Ponies vs. full-sized horses

The LeMieux range explicitly covers both full-sized horses and ponies — the Toy Pony line is one example. In the game, this distinction likely does not need to manifest as a mechanical restriction (a child should not be blocked from putting a rug on their pony because it is "the wrong size"). Size-restricted equipment is a complication that adds friction without adding play value for this age group.

---

## 5. Purchase flow — pre-condition states

**Buying items before owning a horse**

The current shop has no concept of which animal an item is for. Items are purchased into an inventory and used from there. This architecture is already established in `useItemShop` and `itemDefs.ts`. The LeMieux integration should preserve this: Harry buys items into his collection regardless of which horses he currently owns.

If Harry has no horses yet when he visits the shop, the shop should still be browsable and purchasable. However, the absence of a horse creates a dangling state: Harry owns a saddle but has nowhere to put it. Two risks arise:

- Harry is confused about what to do with the item ("I bought this saddle but nothing happened")
- Harry is frustrated because the equip screen shows no horses to equip

**Suggested handling (for UX to spec):** When Harry purchases a horse-specific item and has no Stables animals, a post-purchase prompt should guide him to generate a horse. The prompt is informational — it should not block the purchase. The item sits in his inventory until a horse is added.

**Running out of coins mid-wishlist**

The existing shop already handles the "cannot afford" state: the price row turns muted (--t4) and the buy button is disabled ("Not enough coins"). This pattern is established and should carry forward.

No evidence exists about whether Harry finds the "not enough coins" state frustrating or motivating. Children differ significantly on this: some find it motivating ("I need to earn more"), others find it a barrier that causes abandonment. This is a knowledge gap.

---

## 6. Collection view — what Harry wants to see

**No direct evidence. All statements here are inference. Confidence: low.**

The collection view request is to add an item collection in My Animals. Two conceptually different things are being combined here that the UX Designer should distinguish:

**Option A — Inventory view:** What Harry currently owns (purchased items not yet used up). This is a management screen. Children who care about collecting will value this. It answers "what have I got?"

**Option B — Wishlist / catalogue view:** All LeMieux items that exist, with owned/not-owned status. This is a browsing screen. It answers "what can I get?" and creates aspirational collection goals.

Research on children's virtual collecting (e.g., Pokémon, trading cards, Tamagotchi-style games) strongly supports Option B: children are motivated by completeness goals ("I want to collect all the fly hoods") more than by inventory management ("I have 3 brushes"). The visible gap between what they own and what they could own is motivating, provided the unowned items are reachable through normal play rather than paywalled.

**Hybrid approach:** Show the full catalogue with clear owned/unowned state, link directly to the shop for unowned items. This is also consistent with how the existing shop already surfaces "owned" counts on item cards.

**What Harry likely does not want:** A flat list of item names with no images. The visual identity of LeMieux products (distinctive colourways, recognisable shapes) is what makes the collection feel real. Images are load-bearing for this feature to work as a collection view.

**Gap to flag:** The current LeMieux product data in `products.json` has significant image data quality issues. Many items share the same placeholder image (`1._hedgy-treats-1kg.jpg`) across multiple categories. A collection view that shows the same image for 30 different items will feel broken to a child. The owner needs to be informed that product images require attention before a collection view is viable.

---

## 7. Equip interaction — gesture analysis for child on iPad

**Three candidate interactions:**

### A — Drag-to-slot (Minecraft-style)
The user long-presses an item in their inventory, then drags it to a slot outline around the horse image and releases.

Advantages:
- Familiar to Minecraft players
- Spatially intuitive — the item travels from source to destination

Risks for this user:
- Requires sustained motor control through the drag gesture (ADHD attention risk)
- Failed drags are not immediately obvious — item may return to inventory without clear feedback
- Slot targets must be large enough for a child's finger (minimum 44px touch target per DS)
- On a horse silhouette, slots may be irregularly spaced, making some harder to reach than others
- If the horse image is small (phone viewport), the slots will be tiny

**Verdict:** Viable on iPad at full size, but requires large slot targets and very clear drag-failed feedback. High risk on phone viewport.

### B — Tap-to-equip (tap item, confirm)
The user taps an item in their inventory. A bottom sheet confirms which slot the item will occupy ("This rug goes on your horse's back"). One tap to confirm.

Advantages:
- No sustained drag gesture
- Clear confirmation moment reduces errors
- Works well at all screen sizes

Risks:
- Less spatial than Minecraft — the slot visualisation on the horse is decorative rather than interactive
- Less satisfying / "magical" — the item doesn't move visually to the horse

**Verdict:** Lowest friction. Best for accessibility. Least exciting.

### C — Tap-slot-then-pick (tap an empty slot, then choose from compatible items)
The user taps a slot on the horse image. A bottom sheet or panel shows all inventory items compatible with that slot. User taps one to equip.

Advantages:
- Spatially grounded — interaction starts with the horse, not the inventory
- Natural for someone who thinks "I want to put something on this slot" rather than "I have this item, where does it go?"
- Slot targets are hit first, which is a larger interaction than a drag-target

Risks:
- Requires the user to know that slots are tappable — may not be discoverable without onboarding
- Empty slots must clearly signal "tap me" — subtle slot outlines will be missed

**Verdict:** Most natural spatial flow for a dressing-up mental model. More discoverable if slots have a clear visual affordance (pulsing border, "+" indicator).

### Recommendation

**Primary: Option C (tap-slot-then-pick).** The horse is the hero of the screen. The child interacts with the horse first, not with an inventory list. This matches the dressing-up mental model better than inventory management.

**Secondary: drag-to-slot as an enhancement**, available for children who have the motor skill and the desire. Not the only way to equip.

The UX Designer should spec both paths, with tap-slot-then-pick as the primary flow. If drag-to-slot is included, specify the drag-failed state explicitly.

---

## 8. Unequip — removal and return to inventory

**No existing precedent in the codebase. No evidence about Harry's expectation. Confidence: low.**

In Minecraft, placing a new item in a slot automatically unequips the previous item (which moves to the inventory, not disappearing). This is the expected behaviour for children familiar with the model.

For this app, the following behaviours need explicit decisions:

**Can Harry remove an item from a slot without replacing it?** Yes — he should be able to unequip a rug and leave the body slot empty. The horse returns to its unequipped visual state.

**Where does the unequipped item go?** It must return to Harry's inventory (the item collection). Items should not be consumed by equipping. If a rug is equipped and then unequipped, Harry still owns it.

**Is equipping destructive?** Based on the existing shop model, items that have `uses: null` are permanent possessions. Rugs, saddles, and headcollars in the real LeMieux range are durable goods, not consumables. These should be non-destructive to equip and unequip. Consumable care items (brushes with uses, treats) should be used up when applied as care actions, not equipped persistently.

**Risk to flag:** If equipping is not clearly non-destructive, Harry may be reluctant to experiment — he will worry about "using up" his items. The interface must communicate that equipped items are still owned and recoverable.

---

## 9. Hobby horses — placement and treatment

The 63 hobby horse items include:
- Named hobby horse characters (Toby, Sundance, Poppy, Dazzle, Earl, Dakota, Dream, Razzle, Flash, Lemon, Spike and others) — physical toy horses
- Hobby horse accessories (bridles, headcollars, rugs, fly hoods, saddles — all miniature, designed for the toy horse heads)
- Hobby horse jumps (explicitly "not a toy", age 14+, for sport training)

**These items are categorically different from horsewear.** A hobby horse is a toy object, not horse equipment. Harry cannot "equip" a hobby horse onto one of his virtual horses — that makes no sense. A hobby horse is itself a collectible.

**Where they fit — two options:**

**Option A:** Hobby horses appear in the Shop as a purchasable collectible. Harry buys a named hobby horse (e.g., "Hobby Horse Lemon") and it appears in a dedicated "Toys" section of My Animals or his collection — not in the Stables category, but as a distinct toy category. This makes them displayable and collectable without conflating them with real horse equipment.

**Option B:** Hobby horses are out of scope for this feature and remain a separate consideration for a future feature.

**Recommendation:** Option A, but scoped narrowly. Hobby horses should appear in the Shop and be collectible, but they should not have equipment slots — they are display items, not horses to equip. The hobby horse accessories (miniature rugs, bridles) could equip onto the hobby horse collectible as a sub-system, but this adds significant scope. The PO should decide whether hobby horse equipping is in scope for this feature or a future one.

**Critical note on the show jump product:** The product data includes a "Hobby Horse Jump Purple" with an explicit warning "Not suitable for persons under 14 years of age." This product should be excluded from the in-app shop entirely. Including a product with an age-gating warning in a child's app is inappropriate regardless of the virtual context.

---

## 10. Non-equippable items — grooming, supplements, stable-yard

These three categories (112 items total) have no body slot to fill. They are consumables or environmental items.

**Grooming-care (59 items including Brushes, Grooming Bags, First Aid, Hoof Care):**

Maps naturally to the existing "brush" category in `itemDefs.ts`. These items are used in a care action and consumed over time. The distinction from the existing fictional items is that they now have real product names and images. No new interaction model needed — these slot into the existing care/hygiene system.

**Supplements (23 items — Calmers, Joints, Electrolytes, Performance, Digestion, Hoof):**

These are internally consumed products. In the game model, they logically provide a temporary stat boost. "Calmers" could provide a happiness or stress reduction effect. "Performance" supplements could boost speed temporarily. The virtual effect must be age-appropriately explained — a child should understand "this makes your horse feel better" without needing to understand supplement chemistry.

**Stable-yard (30 items — Haynets, Treats, Stable Accessories, Horse Toys):**

Haynets and treats are food — they map to the existing "feed" category. Horse Stable Toys and Stable Accessories could be environmental decorations for a stable view (which does not currently exist in the app). If no stable view is planned, these items have no place to live. The PO needs to decide whether a stable environment is in scope.

**Recommended treatment for all three categories:**

Do not create a "non-equippable items" graveyard in the item collection. Items that Harry cannot do anything with create a confusing ownership experience ("I have this calmer but I can't use it"). Either:

(a) Give every item a clear action ("Use" button that applies the stat effect), or
(b) Scope the initial release to equippable items only, with consumables handled in a later phase

Option (b) is safer for scope control and cleaner for the child's experience.

---

## 11. Knowledge gaps

The following are genuine unknowns that carry design risk. They are ordered by the severity of the risk they pose.

### Gap 1 — Harry's Minecraft familiarity (HIGH RISK)
The entire drag-to-slot mental model rests on Harry playing Minecraft. If Harry does not play Minecraft, the equipment slot concept has no existing mental model to anchor to and requires more onboarding. We have no evidence either way.

**Recommended resolution:** Owner to confirm whether Harry plays Minecraft and whether he is familiar with equipment screens. A five-minute conversation. Without this, the UX Designer should design for the case where Minecraft is not assumed — tap-slot-then-pick is the safer default.

### Gap 2 — Harry's ADHD/autism specifics as they apply to drag gestures (HIGH RISK)
The DS notes the app is designed for a child with ADHD and autism, but does not specify Harry's particular profile — whether fine motor control, sustained attention, or sensory sensitivity are prominent considerations. Drag-to-slot is a sustained fine motor task. If Harry has fine motor challenges or difficulty maintaining focus through a drag gesture, this interaction will produce repeated failures and frustration.

**Recommended resolution:** Owner to describe Harry's iPad use habits. Does he use drag gestures fluently in other apps? Does he get frustrated when things don't go where he intends? This shapes the primary interaction model significantly.

### Gap 3 — Image data quality for the LeMieux catalogue (HIGH RISK for collection view)
Sampling the product data reveals that a large proportion of items across multiple categories share the same placeholder image (`1._hedgy-treats-1kg.jpg`). Approximately half the fly hoods, most headcollars, most boots, and several saddlery items return this image. A collection view with duplicate placeholder images will look broken. The LeMieux website has real product photography but it is not in the scraped data.

**Recommended resolution:** Before the collection view is specced or built, the owner must confirm whether real product images will be sourced and how they will be structured. Building the collection view against the current image data will produce a broken result.

### Gap 4 — Coin economy balance for LeMieux pricing (MEDIUM RISK)
LeMieux products in the real world range from approximately £20 (treats) to £300+ (bridles). The in-game coin system uses prices from 20 coins (Rubber Ball) to 1,200 coins (Golden Saddle). We have no validated mapping of LeMieux product tiers to coin prices. If prices are too high, Harry is locked out of items he wants. If too low, he buys everything immediately and the collection loses aspirational value.

**Recommended resolution:** Owner to define the coin earning rate and the target time-to-purchase for an aspirational item (e.g., "Harry should be able to buy a nice fly hood after a week of daily play"). This informs pricing for Phase B.

### Gap 5 — Whether Harry's horses have names or individual identity (LOW-MEDIUM RISK)
The equip screen must be reached from a specific horse. The current `MyAnimalsScreen` shows all animals in a grid. If Harry has three horses, equipping must be per-horse (not per-species). This requires the equip screen to know which specific horse it is operating on. The current `SavedName` type includes `name` and `id`, so per-animal tracking is architecturally possible. However, we do not know whether Harry thinks of his horses as individuals (named, with specific looks) or as a generic collection.

If Harry thinks of horses as individuals, per-horse equipment is essential — he wants his horse "Thunder" to have the blue fly hood, not just "a horse." If he treats them generically, a shared wardrobe model could work. Per-horse equipment is the safer design assumption.

### Gap 6 — Whether Harry currently uses the shop at all (MEDIUM RISK)
The existing shop has 16 fictional items. We have no evidence that Harry has engaged with the shop, purchased items, or found the current item system meaningful. If the shop is currently ignored, the problem is not "replace fictional items with real ones" but something deeper about item relevance or purchase motivation. Replacing fictional items with real LeMieux ones may solve this if the problem is product authenticity, or it may not if the problem is that items have no visible effect on animals.

**Recommended resolution:** Owner to report whether Harry uses the current shop and what, if anything, he buys.

---

## 12. Accommodations — ADHD and neurodivergent considerations

The following are design accommodations informed by general ADHD and autism UX research, applied to the specific interaction contexts of this feature. These are not Harry-specific — they are appropriate defaults given the design system's explicit note about the target user. Confidence: medium (general research basis, not Harry-specific evidence).

### Equip screen

**Reduce working memory load.** The equip screen should show Harry's horse and its current equipment state in a single view. He should not need to navigate between an inventory screen and an equip screen — item selection and slot assignment should happen in one place.

**Progress should be visible and permanent.** When Harry equips a fly hood, the horse should immediately display the hood. The visual change is the reward, not a separate congratulation screen. Delay between action and visual feedback is a common frustration trigger for ADHD.

**Avoid modal interruptions during equipping.** Confirmation dialogs ("Are you sure you want to equip this?") add friction and interrupt the flow. For equipping actions that are reversible (all non-consumable items), confirmation should not be required. For consumable use (applying a grooming item), a single tap confirm is sufficient.

**Provide clear affordances for interactive slots.** Empty slots should have a visible "tap here" state — pulsing border, dashed outline, or "+" indicator. An autistic child may not infer from context that a blank area is tappable. Affordances must be explicit, not suggested.

**Avoid all-or-nothing fail states.** If Harry partially equips a horse (e.g., headcollar but no rug), the horse should still look good and the interface should not imply the horse is "incomplete" or "wrong." Partial states are valid and should be celebrated rather than flagged.

### Collection view

**Category filters must be visible and stable.** A horizontal scroll of category pills (consistent with the existing `MyAnimalsScreen` pattern) is appropriate. Hidden filter controls or controls that move when selected create disorientation.

**Unowned items should be present but clearly differentiated.** Greyed-out or locked items that are present in the collection create "gap" motivation without hiding what is available. However, fully opaque locked items that provide no information about what they are will frustrate — show the item name and image even for unowned items.

**No time pressure.** The equip screen and collection view should have no time-based elements, no animations that auto-advance, and no prompts that disappear. Harry should be able to take as long as he needs.

### Shop integration

**Real product names may be long.** Many LeMieux items have names like "NAF Hedgy Treats" or "Acoustic Fly Hoods." The existing shop card truncates item names to 2 lines (`line-clamp-2`). The UX Designer should verify that real LeMieux product names fit within the card without critical information being cut. Brand names at the start of names (e.g., "NAF") may not help Harry identify what the item is — consider whether the category label carries more weight than the brand name.

---

## Summary — priority decisions for Phase B

The following questions must be resolved before the PO writes refined stories. Each is a genuine decision, not a default:

1. **Are equipment slots per-horse (individual animals have their own loadout) or shared (any horse in your stable can use any equipped item)?** Recommendation: per-horse.

2. **Are legs treated as a single slot or four individual slots?** Recommendation: single "Legs" slot for simplicity.

3. **Is equipping restricted to Stables-category animals only?** Recommendation: yes.

4. **Are hobby horses in scope as a collectible (purchasable but not a base animal), and are hobby horse accessories in scope for equipping onto hobby horse collectibles?** Recommendation: hobby horses in scope as collectibles, accessories scoped to a future feature.

5. **Are non-equippable items (supplements, stable-yard, grooming) in scope for this feature, or deferred?** Recommendation: grooming maps to existing care system; supplements and stable-yard deferred unless owner confirms a use.

6. **Is the collection view a catalogue of all available items (with owned/unowned state) or only items Harry owns?** Recommendation: full catalogue with owned/unowned state.

7. **Are real product images available and of sufficient quality for a collection view?** Must be confirmed before Phase C begins.

8. **What is the coin price mapping for LeMieux product tiers?** Must be defined in Phase B.

---

*All findings in this document are inferences from code, data, and design documentation. No direct user research with Harry has been conducted. Confidence levels are declared per section. The highest-priority gap before finalising the UX spec is Gap 1 (Minecraft familiarity) and Gap 2 (Harry's fine motor and attention profile during drag gestures), as these directly determine the primary interaction model.*
