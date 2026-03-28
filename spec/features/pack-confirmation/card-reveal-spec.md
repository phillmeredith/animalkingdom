# Interaction Spec — Card Reveal (Improved Pack Opening)

Feature: `pack-confirmation` (addendum to existing interaction-spec.md)
Status: UX spec — awaiting Phase B approval before Phase C
Last updated: 2026-03-27

---

## Purpose of This Document

This is an addendum to the existing `interaction-spec.md` for `pack-confirmation`. That spec covers the confirmation BottomSheet. This document covers what happens after the player taps "Open Pack" in the sheet — the `CardReveal` overlay experience, from the moment the overlay appears to the moment the player returns to the Packs tab.

The current `CardReveal` (CardsScreen.tsx, lines 132–212) is functional but flat. It does a spring scale-fade on each card and provides a "Next card" / "Done" button. This spec replaces that animation sequence with a rarity-tiered reveal system and adds a summary screen after all cards are shown.

---

## Scope

This spec covers:

1. The revised `CardReveal` overlay — rarity-tiered animation sequences
2. A new `RevealSummary` screen — shown after all cards are tapped through
3. DS compliance for all new visual elements

This spec does NOT cover:

- The BottomSheet confirmation step (covered in `interaction-spec.md`)
- The `useCardPacks` hook or coin spend logic (no change)
- Sound effects (no audio API available in this app)

---

## 1. Design Rationale

The current reveal treats all cards identically. A legendary card arrives the same way as a common card. This wastes the rarity system — the player has no reason to feel anticipation or surprise.

The goal is a "Pokémon rip" moment: the reveal feels physical, dramatic, and appropriate to what the player is about to see. A common card is a quick, satisfying pop. A legendary card is a brief spectacle — bright, bold, and memorable — without being frightening or overwhelming for a child with ADHD/autism.

Constraints that shaped every decision below:

- Framer Motion only. No canvas, no WebGL, no particles library.
- `prefers-reduced-motion` must collapse every animation to an instant state change.
- Nothing looping indefinitely and blocking interaction — player must always be able to tap through.
- Appropriate for a child. Dramatic, not scary. Brief, not exhausting.
- iPad-first at 1024px portrait.

---

## 2. Overlay Container (unchanged from current)

The `CardReveal` overlay sits at `z-[1100]`, fixed inset-0.

**Background:** `rgba(13,13,17,0.96)` — near-black, slightly more opaque than the current `bg-black/90` to let rarity glows read clearly against the backdrop. Token: `--bg` at 96% opacity. Do not use `--card` or `--elev` here.

**No glass blur on the backdrop.** The backdrop is a solid dimmer. Glass treatment is for floating sheets only (see DS). A blurred backdrop here would compete with the card glow effects.

**Reduced motion:** If `useReducedMotion()` returns true, the overlay appears instantly (opacity 1, no transition). All per-card animations described below are skipped — the card appears immediately at its final state. The summary screen still shows; it just has no entrance animation.

---

## 3. Overlay Structure (top to bottom)

```
┌────────────────────────────────────────────────┐
│                                                │
│  [Progress dots]           centered, top 40px  │
│                                                │
│  [Rarity glow layer]       behind card         │
│  [Card]                    centred vertically  │
│                                                │
│  [CTA button]              below card, 32px gap│
│  [X of N counter]          below button        │
│                                                │
└────────────────────────────────────────────────┘
```

On iPad at 1024px, the card is `max-w-[320px]` centred. The glow layer extends beyond the card bounds — it is a radial-gradient `div` positioned absolutely behind the card, not tied to the card's border.

---

## 4. Progress Dots

No change from current. One dot per card. Filled dot (`--blue`) for cards revealed so far including current. Empty dot (`--border`) for cards not yet seen.

Size: 8×8px, `rounded-full`. Gap: 8px between dots.

Position: fixed top of overlay, `pt-10` (40px from top edge). Centred horizontally.

Animation: dot fills from `--border` to `--blue` as each card is revealed. Transition: `background-color 200ms ease-out`. No motion concerns — colour-only transition.

---

## 5. Card Anatomy in the Reveal

The card displayed during reveal uses the same surface as the collection grid:

```
Width:          max-w-[300px] on phone, max-w-[320px] on iPad (1024px)
Aspect:         image is square (aspect-ratio: 1/1, object-fit: cover)
                below image: name + rarity badge strip (p-4)
Border:         2px solid [rarity colour] — same as current
Border-radius:  16px (--r-lg)
Background:     var(--card)
```

The card itself does not change shape by rarity. The rarity expression lives in the border colour, the glow layer behind the card, and the entrance animation sequence. The card anatomy is identical across all tiers so the player builds a consistent mental model.

**"New!" label:** Shown below the animal name when `card.isNew === true`. Style: `11px / 700, uppercase, letter-spacing 1px, color: var(--pink-t)`. Changed from current `--blue-t` to `--pink-t` — pink is the reward/celebration colour in this DS, blue is utility.

**Rarity badge:** Uses the existing `RarityBadge` component. No change.

---

## 6. Rarity-Tiered Reveal Animations

Each tier has a named sequence. All sequences use Framer Motion. All sequences must collapse to "instant" when `reducedMotion` is true.

### 6.1 Common — "The Pop"

Clean, fast, satisfying. No glow. No pre-animation buildup.

**Sequence:**

1. Card enters with `AnimatePresence mode="wait"` (same as current).
2. Card initial state: `{ opacity: 0, scale: 0.88, y: 16 }`
3. Card animate state: `{ opacity: 1, scale: 1, y: 0 }`
4. Transition: `{ type: 'spring', stiffness: 320, damping: 26 }`
5. No glow layer. Background stays `rgba(13,13,17,0.96)`.

**Total perceived duration:** ~250ms. Fast and clean.

**Reduced motion:** Card appears at `{ opacity: 1, scale: 1, y: 0 }` instantly. No transition.

---

### 6.2 Uncommon — "The Lift"

Slightly more presence. A subtle green bloom behind the card to confirm something better than common arrived.

**Sequence:**

1. Card initial state: `{ opacity: 0, scale: 0.85, y: 20 }`
2. Card animate state: `{ opacity: 1, scale: 1, y: 0 }`
3. Transition: `{ type: 'spring', stiffness: 300, damping: 24 }`
4. Glow layer: `div` positioned absolutely behind the card, `w-[280px] h-[280px]`, `rounded-full`, `bg-[radial-gradient(circle,rgba(69,178,107,0.18)_0%,transparent_70%)]`. Animates from `{ opacity: 0, scale: 0.6 }` to `{ opacity: 1, scale: 1 }` with `{ type: 'spring', stiffness: 200, damping: 28 }` — starts 50ms after card animation begins (use `delay: 0.05` on the glow).

**Total perceived duration:** ~350ms.

**Reduced motion:** Card and glow appear instantly at final state. No transitions.

**DS token:** Glow colour uses `rgba(69,178,107,0.18)` — this is `--green` (#45B26B) at 18% opacity, slightly stronger than `--green-sub` (12%) to read as a bloom on a near-black background.

---

### 6.3 Rare — "The Flash"

A brief flash of blue precedes the card. The card arrives with more weight. The player feels something good is coming before they see it.

**Sequence:**

1. A `div` fullscreen overlay at `z-[1101]` (above the backdrop, behind the card) flashes in. Initial: `{ opacity: 0 }`. Animate: `{ opacity: [0, 0.12, 0] }` (keyframe array). Transition: `{ duration: 0.35, ease: 'easeOut', times: [0, 0.3, 1] }`. Background: `rgba(55,114,255,0.12)` — `--blue` at 12%. This creates a brief blue wash across the whole overlay.
2. Card appears 120ms after flash starts (use `delay: 0.12` on card entrance). Initial: `{ opacity: 0, scale: 0.82, y: 24 }`. Animate: `{ opacity: 1, scale: 1, y: 0 }`. Transition: `{ type: 'spring', stiffness: 280, damping: 22 }`.
3. Glow layer behind card: `w-[320px] h-[320px]`, `rounded-full`, `bg-[radial-gradient(circle,rgba(55,114,255,0.22)_0%,transparent_65%)]`. Animates from `{ opacity: 0, scale: 0.5 }` to `{ opacity: 1, scale: 1 }` with `delay: 0.14, { type: 'spring', stiffness: 200, damping: 26 }`.

**Total perceived duration:** ~500ms from flash start to card settled.

**Reduced motion:** Skip the flash overlay entirely. Card and glow appear instantly.

**DS token:** Flash and glow use `--blue` (#3772FF). Flash at 12% (`--blue-sub`). Glow at 22% (stronger than sub, appropriate for a bloom on near-black).

---

### 6.4 Epic — "The Pulse"

Two pulses of purple light ripple outward from the card position before the card appears. Creates anticipation without being jarring.

**Sequence:**

1. Two `div` elements, both absolutely positioned behind the card, `rounded-full`, same centre point. These are the pulse rings — they expand outward and fade.

   **Pulse ring 1:** Initial: `{ opacity: 0.6, scale: 0.3 }`. Animate: `{ opacity: 0, scale: 1.8 }`. Transition: `{ duration: 0.5, ease: 'easeOut' }`. Background: `rgba(151,87,215,0.15)` — `--purple` at 15%. Size: `w-[200px] h-[200px]`.

   **Pulse ring 2:** Same as ring 1 but `delay: 0.15`. This staggers the two pulses so they feel like distinct beats.

2. Card appears at `delay: 0.2`. Initial: `{ opacity: 0, scale: 0.78, y: 20, rotateY: 8 }`. Animate: `{ opacity: 1, scale: 1, y: 0, rotateY: 0 }`. Transition: `{ type: 'spring', stiffness: 260, damping: 20 }`. The slight `rotateY` twist on entry gives a hint of a card flipping into view without a full 180-degree flip (which would obscure content and feel slow).

3. Glow behind card after settle: `w-[340px] h-[340px]`, `rounded-full`, `bg-[radial-gradient(circle,rgba(151,87,215,0.25)_0%,transparent_60%)]`. Animates from `{ opacity: 0, scale: 0.4 }` to `{ opacity: 1, scale: 1 }` with `delay: 0.22, { type: 'spring', stiffness: 180, damping: 24 }`.

**Total perceived duration:** ~650ms from first pulse to card settled. Child-friendly — two clear beats then the reveal.

**Reduced motion:** Skip pulses and rotateY. Card appears instantly.

**DS token:** `--purple` (#9757D7). Pulses at 15%. Glow at 25%.

**Implementation note on `rotateY`:** The card's parent `div` needs `style={{ perspective: '800px' }}` for the Y-axis rotation to read correctly in 3D space. Without perspective the rotation looks like a horizontal squish. Add `transformStyle: 'preserve-3d'` to the card's motion.div.

---

### 6.5 Legendary — "The Spectacle"

This is the maximum drama moment. It uses three layers: a full-screen amber sweep, a starburst of lines radiating from the card, and a strong persistent amber glow. The card arrives last, deliberately, after the spectacle has primed the player.

**Layer 1 — Full-screen amber sweep:**
A `div` fixed inset-0, `z-[1099]` (behind card but above backdrop). Background: `radial-gradient(ellipse at center, rgba(245,166,35,0.22) 0%, transparent 65%)`. Animate: `{ opacity: [0, 1, 0.6] }`. Transition: `{ duration: 0.8, ease: 'easeOut', times: [0, 0.4, 1] }`. After this animation, it holds at `opacity: 0.6` for the duration the card is shown (it is a persistent glow, not a flash that fully disappears).

**Layer 2 — Ray burst:**
Eight thin lines (`div` elements) radiating from the card centre at 45-degree intervals (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°). Each ray is a `div` with: `width: 2px, height: 80px, background: linear-gradient(to bottom, rgba(245,166,35,0.7), transparent), border-radius: 1px`. Positioned absolutely, `transform-origin: bottom center`, rotated to their angle.

Rays animate: `{ opacity: [0, 0.8, 0], scaleY: [0, 1, 0.4] }`. Transition: `{ duration: 0.6, ease: 'easeOut', delay: 0.2 }`. Rays appear 200ms into the sweep, reach full height, then fade back to 40% (not fully gone — they persist faintly while the card is shown).

Note: Implement rays as a single `motion.div` container that wraps all 8 rays. The container positions at the card's expected centre point (the card centre is known since the card is centred on screen). Use `position: absolute` with `top: 50%, left: 50%, transform: translate(-50%, -50%)` on the container.

**Layer 3 — Card entrance:**
Card appears at `delay: 0.35` (mid-way through sweep). Initial: `{ opacity: 0, scale: 0.70, y: 28, rotateY: 12 }`. Animate: `{ opacity: 1, scale: 1, y: 0, rotateY: 0 }`. Transition: `{ type: 'spring', stiffness: 240, damping: 18 }`. The combination of scale and Y-rotate creates a strong physical "landing" feel.

Parent `div` needs `style={{ perspective: '800px' }}` (same as Epic).

**Persistent glow (stays while card is shown):**
`w-[380px] h-[380px]`, `rounded-full`, `bg-[radial-gradient(circle,rgba(245,166,35,0.35)_0%,transparent_60%)]`. Animates from `{ opacity: 0, scale: 0.3 }` to `{ opacity: 1, scale: 1 }` with `delay: 0.3, { type: 'spring', stiffness: 160, damping: 22 }`. This is the largest and strongest glow in the system.

**Total perceived duration:** ~900ms from sweep start to card settled.

**Reduced motion:** Skip sweep, skip rays. Card appears instantly. Glow may be shown at its final state without animation — it is a tinted background element, not a moving one, and is acceptable even under reduced motion as a visual indicator of rarity (colour-only, no movement). FE may choose to omit the glow entirely under reduced motion if the static amber radial gradient feels distracting — this is the one judgment call delegated to FE.

**DS tokens:**
- Sweep and glow: `--amber` (#F5A623). Sweep at 22%, glow at 35% — both stronger than `--amber-sub` (12%) because the near-black backdrop requires higher opacity to read as a true colour bloom.
- Rays: `rgba(245,166,35,0.7)` at peak, fading to transparent.
- The shimmer CSS class (`.shimmer`) already exists in `index.css` for `--amber`. FE should apply `.shimmer` to the card border — the existing keyframe runs a background-position sweep. This means the card's 2px amber border will shimmer while it is displayed. This is already the DS-specified treatment for legendary rarity (`RarityBorder.tsx` line 11).

---

## 7. CTA Button and Counter

No layout change from current.

**Button:**
- Label: "Next card" (cards remaining) or "See All" (final card)
- Variant: `primary` (blue) — unchanged
- Size: `lg` (48px height, 28px padding) — unchanged
- Width: `max-w-[300px]` on phone, `max-w-[320px]` on iPad, full-width within that constraint
- Position: `mt-8` below the card

The final card changes the button label from "Next card" to "See All" — not "Done". The player still has one more screen to visit (the summary). "Done" implies they are finished; "See All" invites them forward.

**Counter:** `"{revealed + 1} of {cards.length}"` — unchanged. `13px, var(--t3)`, `mt-3` below button.

---

## 8. Inter-Card Transition

When the player taps "Next card", the current card exits before the next enters. This uses `AnimatePresence mode="wait"` (already in current implementation).

**Exit animation:** `{ opacity: 0, scale: 0.92, y: -12 }`. Transition: `{ duration: 0.18, ease: 'easeIn' }`. The card slides slightly upward and fades — reads as the card "filing away" before the next one arrives.

The glow layer is keyed to the same `revealed` index as the card. When the card exits under `AnimatePresence`, the glow exits with it. The next card's glow (appropriate for its rarity tier) enters with the next card.

The full-screen sweep (Rare flash, Legendary sweep) does NOT replay between cards in the same pack. It plays once, on the first appearance of that tier within this pack opening. If the player opens a legendary card and there is another card after it, the next card — regardless of rarity — gets a simple common-tier entry. This prevents the spectacle from becoming tiresome or overwhelming. The sweep is a "this pack contains something special" moment, not a per-card ceremony.

---

## 9. Summary Screen

### 9.1 Why include it

After tapping through 3–5 individual cards, the player has seen each card in isolation. The summary gives them a moment to see their full haul together, celebrate (or commiserate), and feel the session is complete before returning to the Packs tab. Without it, "Done" on the last card returns them abruptly to the static Packs tab — the experience ends with no payoff.

### 9.2 Trigger

After the player taps "See All" on the final card, `CardReveal` transitions to `RevealSummary` within the same fixed overlay. The overlay does not close and reopen — it crossfades within the z-[1100] container.

Transition: `AnimatePresence mode="wait"` at the overlay level, switching between a `CardRevealStep` view and a `RevealSummary` view. The backdrop stays constant — only the content inside changes.

### 9.3 RevealSummary — Structure

```
┌────────────────────────────────────────────────┐
│                                                │
│  "Your cards!"           H3 (28px/600), --t1   │
│                          centered, pt-12       │
│                                                │
│  Rarity highlight pill   centered, mb-8        │
│  (if epic or legendary)                        │
│                                                │
│  Card grid               3-across (phone: 2)   │
│  (mini cards)            centered, pb-8        │
│                                                │
│  "Open another pack?"    if player can afford  │
│  [Open Another] [Done]   2 buttons, stacked    │
│                                                │
└────────────────────────────────────────────────┘
```

Content column: `max-w-3xl mx-auto w-full px-6`. This centres content on iPad at 1024px and prevents card grid from running full viewport width.

### 9.4 Headline

"Your cards!" — H3 style, 28px/600, `var(--t1)`, centred. This is a child-facing celebration moment; plain, direct language.

Entrance animation: `{ opacity: 0, y: -12 }` → `{ opacity: 1, y: 0 }`. Transition: `{ duration: 0.3, ease: 'easeOut' }`. Reduced motion: instant.

### 9.5 Rarity Highlight Pill (conditional)

Shown only when the pack contained at least one epic or legendary card.

Logic: take the highest rarity in the opened cards array. If it is epic or legendary, show the pill. Common, uncommon, rare — no pill.

**Legendary pill:**
`"Legendary find!"` — tinted amber badge style: `background: var(--amber-sub); color: var(--amber-t); padding: 4px 12px; border-radius: 100px; font: 13px/600`. Icon: `Sparkles` from lucide-react, 14px, `var(--amber-t)`, left of text with 5px gap.

**Epic pill:**
`"Epic pull!"` — tinted purple badge: `background: var(--purple-sub); color: var(--purple-t)`. Icon: `Zap` from lucide-react, 14px, `var(--purple-t)`.

Entrance animation: `{ opacity: 0, scale: 0.8 }` → `{ opacity: 1, scale: 1 }`. Transition: `{ type: 'spring', stiffness: 300, damping: 24, delay: 0.15 }`. Reduced motion: instant.

**Rationale for Sparkles and Zap icons:** These are the closest Lucide icons to a celebration/energy concept without using emoji. `Star` is already used in the DS for ratings; `Sparkles` is distinct and child-appropriate. `Zap` conveys epic energy. Both are from lucide-react with stroke-width 2, consistent with the icon system.

### 9.6 Card Grid (mini cards)

All cards from the opened pack displayed simultaneously in a grid.

**Grid layout:**
- Phone (375px): `grid-cols-2`
- iPad (768px+): `grid-cols-3`

If the pack has exactly 3 cards, the grid is 3 columns on iPad — all cards in one row. On phone, 2 columns with 1 card in the second row (centred using `justify-items-center` on the grid, or place the third card in a centred single-column row).

**Mini card anatomy:**
```
Container:    rounded-xl border-2 [rarity colour] bg-[var(--card)] overflow-hidden
Image:        aspect-ratio 1/1, object-fit cover, full width
Footer:       p-2
  Name:       11px/600 var(--t1) truncate
  Rarity badge: existing RarityBadge component, sized sm
```

Width is determined by the grid — `w-full` within the grid column. On iPad 3-column, each card is approximately 180px wide. On phone 2-column, approximately 150px wide.

**Mini card entrance animation:**

Cards stagger in from `{ opacity: 0, scale: 0.85 }` to `{ opacity: 1, scale: 1 }`. Each card delays 80ms more than the previous (`delay: index * 0.08`). First card starts at `delay: 0.1` (after headline has entered). Transition per card: `{ type: 'spring', stiffness: 300, damping: 26 }`.

Reduced motion: all cards appear simultaneously at final state, no delay, no scale.

**New! indicator on summary cards:** Small pink dot (6×6px, `bg-[var(--pink)]`, `rounded-full`) in the top-right corner of the image if `card.isNew === true`. This is a position-absolute dot overlaid on the image, not text, so it does not require space in the footer.

### 9.7 CTA Buttons

Two buttons, stacked vertically with `gap-3`, in a `flex flex-col max-w-[300px] mx-auto` container. Shown `mt-6` below the card grid.

**Button 1 — "Open Another Pack" (conditional):**

Only shown if `canAfford(openedPackPrice)` is true — the player can afford the same pack they just opened.

`variant="accent"` (pink), `size="lg"`, `className="w-full"`. Icon: `ShoppingBag` size 16, left. This calls `onOpenAnother()` — the parent dismisses the overlay and immediately opens the confirmation sheet for the same pack again. FE: expose a new `onOpenAnother` prop on `CardReveal` that the `CardsScreen` implements.

**Button 2 — "Done":**

Always shown. `variant="outline"`, `size="lg"`, `className="w-full"`. No icon. Calls `onDone()` which closes the overlay and returns the player to the Packs tab — same as current "Done" behaviour.

**If player cannot afford another pack:** Only the "Done" button is shown. The button becomes `variant="primary"` (blue) in this case since it is the only action and should feel inviting, not like a dismissal.

---

## 10. Full State Machine

```
State: IDLE
  → Player taps "Open Pack" on PackCard
  → [BottomSheet opens — covered in interaction-spec.md]

State: CONFIRMING
  → Player taps "Open Pack" in BottomSheet
  → Coins spent, overlay enters with fade

State: REVEALING (index: 0..N-1)
  → Rarity-tiered animation sequence plays for cards[index]
  → Player taps "Next card" → index increments, card exits, next card enters
  → Player taps "See All" (at index N-1) → transition to SUMMARY

State: SUMMARY
  → RevealSummary shows all cards + CTAs
  → Player taps "Done" → overlay exits, return to IDLE
  → Player taps "Open Another Pack" → overlay exits, BottomSheet opens for same pack
```

The `CardReveal` component manages the `REVEALING` and `SUMMARY` states internally via a local `phase` state variable (`'reveal' | 'summary'`). The component exposes `onDone` and `onOpenAnother` to `CardsScreen`.

---

## 11. Interaction States

### Progress dots

| State | Appearance |
|---|---|
| Not yet revealed | 8×8px circle, `--border` |
| Revealed (including current) | 8×8px circle, `--blue` |
| Transition | `background-color 200ms ease-out` |

### Card (per rarity — see Section 6)

| State | Rarity | Key treatment |
|---|---|---|
| Entering | Common | Spring scale+fade |
| Entering | Uncommon | Spring + green bloom |
| Entering | Rare | Blue flash + spring + blue bloom |
| Entering | Epic | Double purple pulse + slight Y-rotate + purple bloom |
| Entering | Legendary | Amber sweep + ray burst + strong Y-rotate + amber bloom + shimmer border |
| Exiting | All | Fade + slight upward slide, 180ms |

### Reduced motion (all cards)

| State | Behaviour |
|---|---|
| Any animation | Skip. Card at final state instantly. |
| Glow layer | May omit or show at final opacity instantly. |
| Summary stagger | All cards appear together, no delay. |

### "See All" / "Next card" button

| State | Label | Variant |
|---|---|---|
| Cards remaining | "Next card" | `primary` (blue) |
| Final card | "See All" | `primary` (blue) |

### Summary CTAs

| Player affordability | Buttons shown |
|---|---|
| Can afford another | Accent "Open Another Pack" + Outline "Done" |
| Cannot afford | Primary "Done" only |

---

## 12. Accessibility Notes

- The overlay is `role="dialog" aria-modal="true"` with `aria-label="Card reveal"`. This is not stated in the current implementation and must be added.
- The "Next card" / "See All" / "Done" buttons must have explicit `aria-label` values when their visual label is insufficient — these are already clear labels, so no additional aria-label is needed beyond the button text.
- Focus must be moved to the first button when the overlay opens (`autoFocus` on the button, or a `useEffect` that focuses it on mount).
- The progress dots are decorative — they must have `aria-hidden="true"`. The "X of N" counter below the button communicates the same information to screen readers and is the accessible equivalent.
- The `Sparkles` and `Zap` icons in the summary rarity pill must have `aria-hidden="true"` — they accompany text that already conveys the information.

---

## 13. DS Compliance Notes

### New visual elements and their tokens

| Element | Token(s) used |
|---|---|
| Overlay backdrop | `rgba(13,13,17,0.96)` — `--bg` at 96% |
| Common card entrance | Spring only, no colour element |
| Uncommon glow | `rgba(69,178,107,0.18)` — `--green` at 18% |
| Rare flash | `rgba(55,114,255,0.12)` = `--blue-sub` |
| Rare glow | `rgba(55,114,255,0.22)` — `--blue` at 22% |
| Epic pulse rings | `rgba(151,87,215,0.15)` — `--purple` at 15% |
| Epic glow | `rgba(151,87,215,0.25)` — `--purple` at 25% |
| Legendary sweep | `rgba(245,166,35,0.22)` — `--amber` at 22% |
| Legendary rays | `rgba(245,166,35,0.7)` fading to transparent — `--amber` at 70% |
| Legendary glow | `rgba(245,166,35,0.35)` — `--amber` at 35% |
| Legendary border shimmer | `.shimmer` class (existing, `index.css`) + `--amber-sub` / `--amber` |
| Summary headline | `--t1` (#FCFCFD), H3 (28px/600) |
| Summary "New!" dot | `--pink` (#E8247C) — reward colour |
| Legendary pill | `--amber-sub` bg, `--amber-t` text |
| Epic pill | `--purple-sub` bg, `--purple-t` text |
| "Open Another Pack" button | `accent` variant = `--pink` bg |
| "Done" (sole button) | `primary` variant = `--blue` bg |
| "Done" (secondary button) | `outline` variant |

All glow radial gradients use the solid colour token (e.g. `--amber` = `#F5A623`) with explicit opacity values rather than the sub token (e.g. `--amber-sub` = `rgba(245,166,35,.12)`). This is intentional: the sub tokens at 12% opacity are designed for flat tinted backgrounds on cards, not for radial bloom effects on a near-black surface. Higher opacities (18–35%) are required for the glow to read clearly without feeling neon or aggressive.

No hardcoded hex values. All RGB values above derive from the DS token hex values: `--green` = #45B26B → `rgb(69,178,107)`, `--blue` = #3772FF → `rgb(55,114,255)`, `--purple` = #9757D7 → `rgb(151,87,215)`, `--amber` = #F5A623 → `rgb(245,166,35)`.

### 6-point DS checklist for FE self-review

1. No emojis — `Sparkles`, `Zap`, `ShoppingBag` icons from lucide-react only. No emoji in JSX or data.
2. No `ghost` variant — buttons use `primary`, `accent`, `outline` only.
3. All colours trace to `var(--...)` tokens or RGB derivations of those tokens (documented above). No invented hex values.
4. Surface stack: overlay backdrop is `--bg` at 96% (deepest level). Card surface is `--card` (one level up). Glow layers are transparent on top of backdrop. No glass blur on overlay — glass is for floating sheets only.
5. Layout verified at 375px (phone), 768px (iPad portrait), 1024px (iPad landscape). Card max-width adjusts. Summary grid is 2-col at 375px, 3-col at 768px+. Content column is `max-w-3xl mx-auto`.
6. Summary scrollable content has `pb-8` minimum. The overlay is fixed inset-0 and scrollable internally if content overflows — ensure `overflow-y-auto` on the inner scroll container and `pb-8` on the last element.

---

## 14. What FE Should Not Decide Independently

The following are not delegated to FE discretion:

- Which rarity gets which animation tier — defined in Section 6, fixed.
- Glow opacity values — defined in Section 13. Do not increase or decrease.
- Whether to skip the summary screen — it is required. It adds closure and a potential re-purchase moment.
- The "See All" button label on the final card — not "Done", not "Finish". Exactly "See All".
- The "Open Another Pack" button variant — accent (pink), not primary (blue). Pink is the purchase/reward colour in this DS.
- Whether the full-screen Legendary sweep replays between cards — it does not (Section 8).

---

## 15. Out of Scope (do not implement)

- Haptic feedback (not available in PWA without Vibration API — this is a separate decision for [OWNER])
- Sound effects (no audio API)
- Card flip showing a "back" face before revealing the animal — adds complexity and obscures content. The rarity animation provides the anticipation; the flip is not needed.
- Particle systems or canvas-based confetti — not in constraint set.
- Per-rarity background colour changes to the overlay backdrop — the backdrop stays constant at `rgba(13,13,17,0.96)` across all cards. The glow layers provide the rarity colour without the backdrop changing.
