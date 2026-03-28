# UR Findings — explore-rarity-filter

**Feature:** Rarity filter pills on the Explore screen
**Phase:** A (parallel with UX)
**Date:** 2026-03-28
**Researcher note:** This is a low-risk, clearly-scoped additive feature. Findings are drawn from existing evidence in the codebase and the established context of Harry's use patterns. No new primary research was conducted.

---

## Key insight

Harry already sees rarity information on every animal card in Explore via the `RarityBadge` component. The filter addresses a distinct need: he wants to browse the directory *by tier* — not just see what tier a card is once he finds it. The current state requires him to scroll the full grid or search by name to locate, for example, all Legendary animals. A rarity filter collapses that browsing effort to a single tap.

This is consistent with the rarity sort control already present in My Animals, which confirms the rarity dimension is meaningful to the user when navigating his collection. The Explore screen is the catalogue he browses *before* generating — making rarity filtering at this stage directly supports the decision of what to attempt to generate next.

The feature is additive and shares the row with the existing category pills. It does not displace any current affordance.

---

## Accessibility note

Rarity is already communicated via text label (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`) rather than colour alone. The `RarityBadge` component uses colour as a secondary reinforcement of the text. The filter pills in this feature use the same text-label values, which means the filter is readable without any colour distinction. This meets WCAG 2.1 AA SC 1.4.1 (Use of Colour) without any additional work.

---

## Knowledge gap

We do not have direct observation of how frequently Harry browses Explore versus going straight to Generate. If he primarily uses Generate directly and only visits Explore occasionally, the rarity filter is lower-frequency than assumed — but it carries no risk of harm. The feature is still worth building: it improves the quality of the one browsing session without degrading any other flow.

We also do not know the distribution of rarities in the ANIMALS catalogue. If Legendary and Epic animals are very sparse (e.g. 2–3 entries each), the filter result set for those tiers will be very small. This is not a problem — the empty state handles zero results — but the FE should verify that the existing empty state copy ("No animals found / Try a different search or clear filters") reads correctly when the cause is a rarity filter rather than a search query. See the interaction spec for the updated empty state requirement.
