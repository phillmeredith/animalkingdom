# Tier 0–2 UX Review
## Animal Kingdom — Cross-Feature Design Assessment

**Reviewer:** UX Designer
**Date:** 2026-03-27
**Input:** TIER012_QUALITY_AUDIT.md, DESIGN_SYSTEM.md, src/components/ui/Modal.tsx
**Scope:** All Tier 0, 1, and 2 features marked `complete` in BACKLOG.md — design-layer issues only

---

## Purpose

This review translates tester-identified defects and code observations into design decisions and rationale. It covers three things:

1. Design-layer issues surfaced by the QA audit that need a UX response before the developer fixes them.
2. A structural concern about the modal component that the QA audit flags as a surface-stack error.
3. A direct answer to the owner's design question about modal glass panels.

It does not duplicate the QA defect log. References to QA issue codes (QA-xxx) trace back to TIER012_QUALITY_AUDIT.md.

---

## Design Question — Modal Glass Panel

**Owner's question:** Should modals use the same glass panel style as BottomNav (`rgba(13,13,17,.85)` + `backdrop-filter: blur(20px)`) for visual consistency?

**Recommendation: No. Keep modals solid. Do not apply glass treatment to modal surfaces.**

### Rationale

The BottomNav glass effect works because of a specific context: the nav is a persistent layer floating above actively-scrolling content. The blur has material to work against — animated, colourful content is always moving beneath it. The glass communicates "this sits on top of live content" and the semi-transparency reinforces that the page is still there, just paused underneath.

A modal is a different pattern. It sits above a dark solid backdrop (`rgba(0,0,0,.65)`). The backdrop is intentional — it visually suppresses the page to focus the user on the modal task. Once the backdrop is applied, there is nothing beneath the modal panel except near-black overlay. A `backdrop-filter: blur` on the modal panel would be processing that near-black backdrop layer, not the page content. The visual result is imperceptible at best, and at worst produces a slightly washed-out or undefined surface edge that undercuts the crisp boundary a modal needs to feel trustworthy.

Beyond the rendering mechanics, there is a readability argument specific to this app's audience. The primary user is a seven-year-old with ADHD and autism. Modal tasks — adopt an animal, confirm a purchase, read care instructions — require concentrated reading. A solid surface at `var(--card)` (`#18181D`) gives text the maximum contrast anchor it can have. Glass introduces the possibility of background bleed, even marginal, which adds perceptual noise at the moment the child needs to process information clearly.

Consistency with BottomNav is a legitimate instinct, but the design principle here is not "same treatment everywhere" — it is "appropriate treatment for the layer's function." BottomNav uses glass because it persistently overlays live content. Modals use solid because they establish a focused, bounded task space.

### What the DS spec already says

The Design System is unambiguous. The modal card spec reads:

```
Background: var(--card) (#18181D)
Border:     1px solid var(--border-s)
```

No glass token is defined for modal surfaces. The BottomNav glass values exist only in the Navigation section and are not generalised. This is a deliberate separation, not an oversight.

### Middle ground assessment

A "glass drag handle or glass header strip only" approach would introduce a hybrid surface that has no DS precedent and no user benefit. The drag handle is already defined as `rgba(255,255,255,.2)` on a solid panel — it reads as a subtle affordance without needing glass. Adding a glass strip at the top of a bottom sheet would create a seam between two surface treatments on the same component, adding visual complexity for zero functional gain.

**Decision: solid `var(--card)` for all modal and bottom sheet surfaces. No exceptions unless the DS is updated explicitly by the owner with a new modal-glass token.**

---

## Design Issue 1 — Modal Surface Token (QA-004 context, from QA audit check 4)

The QA audit flags `src/components/ui/Modal.tsx` as using `bg-[var(--elev)]`. On reading the current file, line 53 shows `bg-[var(--card)]`, which is correct per the DS. The BottomSheet at line 110 also uses `bg-[var(--card)]`. The QA finding may have been based on an earlier file state.

**UX position:** The current implementation is correct. If the developer confirms the file has been updated since audit, no action is required on surface tokens. If the audit file reflects the live state, the fix is straightforward: replace `--elev` with `--card` on both modal container classes. No design ambiguity.

The distinction matters because `--elev` (`#23262F`) is noticeably lighter than `--card` (`#18181D`) — it reads as an interior element, not a floating overlay. Using `--elev` as the modal surface would flatten the depth model, making the modal feel like part of the page rather than above it.

---

## Design Issue 2 — Adoption Celebration (QA-001)

The adoption moment is the single most emotionally significant interaction in the app. QA-001 correctly identifies that `❤️` and `🎉` emojis are doing the visual heavy lifting on `AdoptionOverlay.tsx`. The DS prohibits emojis as icons.

**UX direction for the developer fix:**

Replace the heart emoji with a Lucide `Heart` icon rendered at a large size (64px minimum) using the `--pink` fill. The animation spec for this icon should be the "celebration" duration band (800–1200ms) with a spring scale-in from 0 to 1.2 then settle to 1.0. Do not use a fill animation — just scale and opacity.

Replace the party-popper emoji (`🎉`) with copy only. The visual energy comes from the Heart icon and the surrounding grad-hero gradient treatment — a text description of the moment ("Your new animal is ready") does not need an emoji amplifier. Keep body copy at Body Lg (18px/400).

Do not replace emojis with animated GIFs or lottie files. The DS animation system is Framer Motion with defined tokens.

**Accessibility note:** The `Heart` icon must have `aria-hidden="true"` since the adjacent heading provides the semantic label. The overlay as a whole needs `role="dialog"` and `aria-labelledby` pointing to the heading.

---

## Design Issue 3 — BottomNav Labels Not Rendering (QA-002)

This is classified HIGH by the tester and is correct. Tab labels are navigation anchors. A child learning to read uses label text alongside icons to identify sections. An icon-only nav is a WCAG 2.1 failure under Success Criterion 1.3.3 (Sensory Characteristics) and is against the DS spec which explicitly defines label text per tab item.

**UX direction:**

The tab item layout is `flex-col, items-center, gap: 4px` per the DS. The icon renders at 24px. The label renders below at 11px/500 in the appropriate state colour (active: `--t1`, inactive: `--t3`). The current JSX omits the label `span` from the rendered output despite the label string existing in the data array. This is a single-line render fix, not a design change.

**Do not** use abbreviations for tab labels (e.g. "My" instead of "My Animals"). The full label text is short enough to fit within the 64px minimum tab width.

---

## Design Issue 4 — Rarity Indicator is Colour-Only (QA-011)

The `AnimalCard` communicates rarity via a 2x2px coloured dot. This fails two DS rules simultaneously: colour as the only differentiator, and hardcoded hex values.

**UX direction:**

Replace the dot with the `RarityBadge` component, which the QA audit confirms already exists in the codebase. Position the badge in the bottom-left of the card image area, overlapping the image edge by 50% of the badge height (standard card-badge placement in this DS). The badge uses the tint-pair colour system (translucent bg, light text) which meets contrast requirements on the `--elev` placeholder and on real imagery.

The 2x2px dot is too small to meet the DS minimum icon guidance regardless of colour. Even if colour-blind users were not a consideration, a 2x2px indicator is below the threshold of reliable perception on any screen.

---

## Design Issue 5 — DailyBonusCard Auto-Dismiss Timing (QA-007)

The 2500ms auto-dismiss is a specific accommodation failure for the stated user group. ADHD characteristics include attention capture by competing stimuli — at app open, a child is likely to be managing the transition to sitting and looking at the screen. 2.5 seconds is not enough reading time for Body text on a reward card.

**UX direction:**

Change the dismiss behaviour to tap-to-dismiss only. Remove the `setTimeout` auto-dismiss entirely. If the card must eventually clear without interaction (e.g. it would block the screen on return visits), introduce a generous timeout of no less than 8 seconds, with a visible progress indicator (thin border animation) so the child can see time remaining. Tap-to-dismiss takes priority over the timer regardless.

The tap target for dismiss must be the entire card, not just a close button. `44px` minimum touch target applies to the close control if one is used separately.

---

## Design Issue 6 — Empty Search State on Explore (QA-010)

When filtered results are empty, the grid renders nothing. This is a blank area with no explanation.

**UX direction:**

Use the DS `EmptyState` pattern:
- Lucide icon: `SearchX`, 48px, `--t4`
- Title: "No animals found" — H4 (22px/600), `--t1`
- Description: "Try a different name or remove a filter" — Body (15px/400), `--t3`, max-width 280px
- CTA button: "Clear search" — btn-md btn-outline, mapped to the clear-search action

Do not use "No results" as the title. "No animals found" is specific to the context and gives the child a clearer mental model of what the search is operating on.

---

## Design Issue 7 — ExploreScreen Content Width Constraint Missing (QA-005 context)

The DS requires `max-w-3xl mx-auto w-full` on the content column of every screen. Explore currently lacks this, allowing the animal grid to span full iPad landscape width (1366px).

**UX direction:**

The content constraint should wrap the search bar, filter rail, and virtual grid together as a single constrained column. The A-Z rail, if it sits outside this column (e.g. fixed to the right edge), is exempt from the content constraint — but it must remain within `24px` of the right edge of the safe area, not the right edge of the grid.

The virtual grid itself should use `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` per the DS responsive layout rules. Do not use lg:grid-cols-6 as implemented in ShopScreen (flagged separately in QA-005 context).

---

## Design Issue 8 — Ghost Button Variant Used for Visible Actions (QA-002 context)

The DS explicitly prohibits the `ghost` variant for visible interactive actions. The instances flagged are: FeaturedPetCard "View my animals", MarketplaceScreen "Decline offer", "Pass", "Decline" in NPC offers, and ArcadeShell "Back to games".

**UX direction:**

All of these must use `outline` variant. The `ghost` variant has a near-invisible background (`rgba(255,255,255,.06)`) that is appropriate only for very low-priority supplementary actions where the button almost disappears into the surface. A "Decline offer" action on a Marketplace screen is a primary decision point — it must read as a clear, tappable button. Using `outline` gives it a visible border and `--t1` text, which is scannable at a glance.

The one exception to consider: if "Back to games" in ArcadeShell follows an immediate celebratory state (e.g. after a correct answer), a lower-visual-weight button is acceptable — but `outline` still satisfies this. `ghost` is not the right tool.

---

## Summary — Priority Order for Developer Action

| Priority | Issue | QA Ref | File |
|----------|-------|--------|------|
| 1 | BottomNav labels not rendering | QA-002 | src/components/layout/BottomNav.tsx |
| 2 | Adoption overlay emojis | QA-001 | src/components/generate/AdoptionOverlay.tsx |
| 3 | Ghost button variants on visible actions | QA check (2) | Multiple (see Issue 8 above) |
| 4 | Rarity indicator colour-only | QA-011 | src/components/explore/AnimalCard.tsx |
| 5 | Empty search state missing | QA-010 | src/screens/ExploreScreen.tsx |
| 6 | DailyBonusCard auto-dismiss | QA-007 | src/components/home/DailyBonusCard.tsx |
| 7 | ExploreScreen content width constraint | QA check (5) | src/screens/ExploreScreen.tsx |
| 8 | Modal surface token (verify live state) | QA check (4) | src/components/ui/Modal.tsx |

---

## What This Review Does Not Cover

- Coin economy decisions (QA-003, QA-014) — these are Product Owner scope, not UX. A UX brief will be raised if the PO defines the coin cost model for adoption.
- Care system visual state design (QA-004) — the interaction spec for My Animals does not include a "needs care" indicator pattern. This requires a new UX brief before the developer builds a fix.
- Marketplace name-selection post-purchase (QA-005) — this requires a new interaction spec for the post-purchase name entry flow before it can be built.
- Hardcoded player name "Harry" (QA-006) — this is a data/settings concern, not a UX pattern gap.

---

*Produced by UX Designer. Refer to TIER012_QUALITY_AUDIT.md for full defect log and test-results detail.*
