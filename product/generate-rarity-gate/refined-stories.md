# Refined Stories — Generate Rarity Gate

Feature: `generate-rarity-gate`
Phase B: APPROVED
Last updated: 2026-03-27

---

## Context

Generation is limited to Common and Uncommon animals. Rare, Epic, and Legendary breeds may only be obtained via the Marketplace, Auctions, or special events. This gate must be enforced in the Generate Wizard and communicated clearly in the Explore screen's animal profile sheet.

Rarity is defined per breed in `src/data/generateOptions.ts` (`BREEDS_BY_TYPE`). The `Rarity` type is `'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'`.

---

## Story 1 — Player cannot generate a Rare/Epic/Legendary animal

**As a player,** I cannot tap a gated breed in the Generate Wizard and have it advance the wizard, so that the rarity economy is enforced.

**Acceptance criteria:**

- AC1.1: In Step 6 (Breed) of the Generate Wizard, any breed with `rarity === 'rare' || 'epic' || 'legendary'` in `BREEDS_BY_TYPE` renders as a locked card.
- AC1.2: Tapping a locked breed card produces no state change — the wizard does not advance to Step 7.
- AC1.3: No toast, error, or modal is shown when a locked card is tapped. The visual treatment is the sole affordance.
- AC1.4: After implementation, no animal can be generated with a rarity above Uncommon via the wizard. Verified by opening every animal type that has a gated breed and confirming no gated breed is selectable.
- AC1.5: Common and Uncommon breeds in the same list remain fully selectable and advance the wizard normally.

---

## Story 2 — Locked breeds are visible but clearly inaccessible

**As a player,** I can see which breeds are gated and understand they come from the Marketplace, so that I feel motivated to explore the shop rather than confused by missing options.

**Acceptance criteria:**

- AC2.1: Locked breed cards appear in the same grid as unlocked cards — they are not hidden or removed from the list.
- AC2.2: Locked cards display: the breed image at `opacity-40`, a `Lock` icon (Lucide, size 24, `var(--t3)`) centered over the image, the breed name in `text-t3`, and the sub-label `"Rare+ · Find in Marketplace"` in `text-[11px] text-t3`.
- AC2.3: Locked cards have `pointer-events-none` — no hover, focus, or active state is triggered.
- AC2.4: The breed grid renders 2 columns at 375px, 3 at 768px, and 4 at 1024px for all breed lists including those containing locked cards.
- AC2.5: A sighted user with no prior knowledge can distinguish a locked card from an unlocked card within 3 seconds. (Verified by reviewer inspection, not automated test.)

---

## Story 3 — Explore screen directs player to Marketplace for gated animals

**As a player,** when I view an animal profile in the Explore screen and that animal is Rare, Epic, or Legendary, I see a "Find in Marketplace" button instead of "Generate this animal", so I know exactly where to get it.

**Acceptance criteria:**

- AC3.1: In `AnimalProfileSheet`, when `animal.rarity` is `'rare'`, `'epic'`, or `'legendary'`, the "Generate this animal" button is not rendered.
- AC3.2: In its place, a full-width `variant="accent"` button labelled "Find in Marketplace" is rendered, with a `ShoppingBag` Lucide icon (size 16) to the left of the label.
- AC3.3: Tapping "Find in Marketplace" navigates to `/shop`.
- AC3.4: Below the button, the text `"Common & Uncommon only · Rare and above from marketplace"` is displayed in `text-[12px] text-t3 text-center mt-2`.
- AC3.5: When `animal.rarity` is `'common'` or `'uncommon'`, the sheet shows the existing "Generate this animal" button with no change.
- AC3.6: The swap is purely presentational — no data write, no coin spend, no navigation side-effect other than routing to `/shop`.

---

## Story 4 — Player can still generate any Common or Uncommon breed

**As a player,** Common and Uncommon breeds work exactly as they did before this feature, so that the gate does not break the existing generate flow.

**Acceptance criteria:**

- AC4.1: Every breed with `rarity === 'common'` or `rarity === 'uncommon'` in `BREEDS_BY_TYPE` remains tappable and advances the wizard to Step 7 (Colour).
- AC4.2: Selecting a Common or Uncommon breed produces an animal with `source: 'generate'` and `rarity` assigned by the existing `determineRarity()` function — no change to that logic.
- AC4.3: The Generate Wizard completes successfully (through to ResultsScreen and Adopt) for at least one Common breed and one Uncommon breed from each category that has them.
- AC4.4: No regression is introduced to Steps 1–5 or Step 7 of the wizard.

---

## Out of scope for this feature

- Enforcement at the database / hook layer (the rarity gate is UI-only; `useSavedNames.adoptPet()` does not need to re-validate rarity — the wizard gate is sufficient)
- Special event unlocks (future feature)
- Auction-acquired Rare/Epic/Legendary animals (already handled via `source: 'auction'` — no change)
