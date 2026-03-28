# Hover State Consistency Audit

**Date:** 2026-03-27
**Auditor:** UX Designer
**Scope:** All interactive card components across the app

## Approved reference pattern (from ShopScreen ItemCard)

```
hover:border-[var(--border)]
motion-safe:hover:-translate-y-0.5
hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
transition-all duration-300
motion-safe:active:scale-[.97]
```

Parent grids containing hoverable cards must also carry `pt-1` to prevent the lift
from being clipped by the `overflow-y-auto` scroll container.

---

## Defect table

| Component / Location | File | Approx line | Current hover state | Missing classes | Parent grid needs `pt-1`? |
|---|---|---|---|---|---|
| `Card` (shared, `hoverable` prop) | `src/components/ui/Card.tsx` | 19 | Partial — has `hover:border-[var(--border)]`, `hover:-translate-y-0.5`, `hover:shadow-card`, `transition-all duration-300`. No `motion-safe` guards. No active scale. | Replace `hover:-translate-y-0.5` with `motion-safe:hover:-translate-y-0.5`; replace `hover:shadow-card` with `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`; add `motion-safe:active:scale-[.97]` | Depends on call site — see below |
| `PetCard` | `src/components/my-animals/PetCard.tsx` | 24 | Partial — has `hover:border-[var(--border)]`, `hover:shadow-[var(--sh-card)]`, `hover:-translate-y-0.5`, `transition-all duration-150`, `active:scale-[.97]`. No `motion-safe` guards. Shadow uses token alias not raw value. Duration wrong (150 not 300). | Replace `hover:shadow-[var(--sh-card)]` with `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`; replace `hover:-translate-y-0.5` with `motion-safe:hover:-translate-y-0.5`; replace `active:scale-[.97]` with `motion-safe:active:scale-[.97]`; change `duration-150` to `duration-300` | No — parent grid in `MyAnimalsScreen` already has `pt-1` (line 131) |
| `AnimalCard` | `src/components/explore/AnimalCard.tsx` | 19 | Partial — has `active:scale-[0.97]`, `transition-transform duration-150`. No hover border, no hover lift, no hover shadow. | Add `hover:border-[var(--border)]`; add `motion-safe:hover:-translate-y-0.5`; add `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`; change `transition-transform` to `transition-all`; change `duration-150` to `duration-300`; replace `active:scale-[0.97]` with `motion-safe:active:scale-[.97]` | Yes — `VirtualAnimalGrid` rows use `px-6 pb-3` with no `pt-1` (line 91). First row lift will be clipped. Add `pt-1` to the row wrapper `div.px-6.pb-3` |
| `FeaturedPetCard` (pet present state) | `src/components/home/FeaturedPetCard.tsx` | 59 | Missing — the inner `div` has only `cursor-pointer`, no transition, no hover classes | Add `hover:border-[var(--border)]`; add `motion-safe:hover:-translate-y-0.5`; add `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`; add `transition-all duration-300`; add `motion-safe:active:scale-[.97]`. Note: outer `RarityBorder` wrapper may constrain border changes — FE to verify the border target element. | N/A — single card, not in a grid |
| `FeaturedPetCard` (empty state — no pet) | `src/components/home/FeaturedPetCard.tsx` | 39 | Missing — the `div[role=button]` carries no hover or transition classes | Add `hover:border-[var(--border)]`; add `motion-safe:hover:-translate-y-0.5`; add `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`; add `transition-all duration-300`; add `motion-safe:active:scale-[.97]` | N/A — single card |
| `DailyBonusCard` | `src/components/home/DailyBonusCard.tsx` | 41 | Missing — the inner `div[role=button]` has no hover or transition classes | This is a transient notification, not a persistent interactive card. Hover lift is NOT appropriate here — the pattern would conflict with its auto-dismiss and motion-entry animation. No change required; document as intentional exception. | N/A |
| `HomeStatCards` (`StatCardItem`) | `src/components/home/HomeStatCards.tsx` | 30 | None — these `div` elements are not interactive (no onClick, no role=button). They are display-only stat surfaces. | Not applicable — no interaction to signal. Verify with PO that these are intentionally non-interactive. If they are ever made tappable, the full pattern must be applied at that point. | N/A |
| `OfferCard` (Marketplace NPC offers) | `src/screens/MarketplaceScreen.tsx` | 28 | Partial — has `active:scale-[.98]`, `transition-transform`. No hover border, no hover lift, no hover shadow. Active scale value is wrong (.98 not .97). | Add `hover:border-[var(--border)]`; add `motion-safe:hover:-translate-y-0.5`; add `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`; change `transition-transform` to `transition-all`; add `duration-300`; replace `active:scale-[.98]` with `motion-safe:active:scale-[.97]` | Yes — the Browse tab grids (lines 389, 397) have no `pt-1`. Add `pt-1` to both `div.grid` wrappers. |
| `RaceCard` (Racing — available races) | `src/screens/RacingScreen.tsx` | 42 | Missing — the outer `div` carries only border and background classes. It is not a `button`. | This `div` is not interactive itself — it contains a Button for the action. However the entire card visually presents as a selectable unit. Recommend FE convert the wrapping `div` to a `button` (or add `role=button`) and apply the full pattern. If the action remains inside the Button only, apply hover to the Button instead. Flag to PO for decision before FE implements. | Yes — the available races grid (line 270) has no `pt-1`. Add `pt-1` regardless of the above decision. |
| Running race `div` (Racing — in-progress) | `src/screens/RacingScreen.tsx` | 243 | None — this `div` is display-only; interaction is via the Button inside it. Correct as-is. | Not applicable | Races in progress grid (line 241) has no `pt-1`. The inner card is not hoverable but the grid may later contain hoverable items. Low priority — only add `pt-1` if RaceCard above is made fully interactive. |
| Recent results `div` (Racing) | `src/screens/RacingScreen.tsx` | 294 | None — display-only, no interaction. Correct as-is. | Not applicable | N/A |
| `PackCard` (Cards screen — Packs tab) | `src/screens/CardsScreen.tsx` | 34 | Missing — the outer `div` has no hover classes. The action is contained in a Button child. | The PackCard is a display container with a CTA Button, not a tappable card. Hover on the container is not appropriate. If the intent is for the whole card to be tappable, FE must convert the outer `div` to a `button` and apply the full pattern. Flag to PO. | N/A — packs are stacked vertically, not in a clipping grid |
| Collection card (`CollectionGrid` items) | `src/screens/CardsScreen.tsx` | 153 | Missing — the `div` has no hover, no transition, no active scale. It is rendered as a non-interactive display card. | If collection cards are intended to be tappable (e.g. to view card detail), convert to `button` and apply the full pattern. If display-only, no change required. Flag to PO for confirmation. | The grid already has `pt-1` (line 151) — correct. |
| Game cards (`PuzzleHubScreen`) | `src/screens/PuzzleHubScreen.tsx` | 100 | Partial — has `active:scale-[.98]`, `transition-transform`. No hover border, no hover lift, no hover shadow. Active scale value is wrong (.98 not .97). | Add `hover:border-[var(--border)]`; add `motion-safe:hover:-translate-y-0.5`; add `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`; change `transition-transform` to `transition-all`; add `duration-300`; replace `active:scale-[.98]` with `motion-safe:active:scale-[.97]` | Yes — the game grid `div.grid` (line 89) has no `pt-1`. Add `pt-1`. |
| Racing banner card (`PuzzleHubScreen`) | `src/screens/PuzzleHubScreen.tsx` | 153 | Partial — same as game cards: `active:scale-[.98]`, `transition-transform`, no hover classes, wrong scale value | Same fixes as game cards above. Note: this card uses amber accent border rather than `--border-s`, so the `hover:border-[var(--border)]` class will override to a neutral border on hover. This is acceptable for consistency but FE should verify it reads well visually against the amber rest state. | N/A — single card below the grid, not clipped |

---

## Summary of actions required

### Must fix (confirmed interactive cards with missing/wrong hover pattern)

1. `AnimalCard` — full pattern missing; add all five classes; add `pt-1` to `VirtualAnimalGrid` row wrapper
2. `OfferCard` (Marketplace) — partial pattern, wrong active scale; add missing classes; add `pt-1` to both Browse grids
3. Game cards in `PuzzleHubScreen` — partial pattern, wrong active scale; add missing classes; add `pt-1` to game grid
4. Racing banner in `PuzzleHubScreen` — same as game cards
5. `FeaturedPetCard` (both states) — pattern entirely absent; add all five classes
6. `PetCard` — partial pattern: wrong shadow token, wrong duration, no motion-safe guards; correct all three
7. `Card` (shared component, `hoverable` prop) — partial pattern: no motion-safe guards, wrong shadow token; correct both

### Requires PO decision before FE implements

8. `RaceCard` — the interactive unit is a `div` not a `button`; needs structural change before hover pattern can be applied correctly
9. `PackCard` and collection cards in `CardsScreen` — unclear whether these are intended to be tappable

### Intentional exceptions (no change needed)

- `DailyBonusCard` — transient notification; hover lift would conflict with its entry animation
- `HomeStatCards` — display-only; not interactive
- Running race and recent result rows in `RacingScreen` — display-only containers

---

## Notes for FE

- The `motion-safe:` prefix on translate and active scale is required by WCAG 2.3.3 (Animation from Interactions). Do not use bare `hover:-translate-y-0.5` or bare `active:scale-[.97]` — always prefix with `motion-safe:`.
- The shadow value `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]` is the canonical arbitrary value from the reference implementation. The `hover:shadow-card` Tailwind shorthand and the `hover:shadow-[var(--sh-card)]` token alias are not equivalent — use the explicit value.
- `transition-all duration-300` is required. `transition-transform` alone will not animate the border or shadow changes.
- `pt-1` on the grid parent: this is only needed when the grid sits directly inside an `overflow-y-auto` container. The small top padding prevents the upward translate on the first row of cards from being clipped at the scroll boundary.
