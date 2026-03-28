# Tier 0/1/2 Fix Pass — UX Review
**Reviewer:** UX Designer
**Date:** 2026-03-27
**Scope:** Post-fix-pass quality review of 16 files across Tier 0, 1, and 2 features

---

## 1. AdoptionOverlay — `src/components/generate/AdoptionOverlay.tsx`

**PASS**

Emojis correctly replaced with a Lucide `Heart` icon at 56px. Auto-dismiss is set to 2000ms. `useReducedMotion` is wired. The spring animation on the heart icon (scale 0.5 → 1, stiffness 300, damping 20) is appropriate for a celebration moment. The overlay uses the DS hero gradient (pink → blue) with backdrop blur, which is correct for a reward moment.

One minor observation that does not block: the dismiss instruction "Tap anywhere to continue" is at `text-white/40` (line 57), which is very low contrast. For a 7-year-old this is fine as a secondary hint, but if accessibility mode is ever required this will need to lift to at least `text-white/60`. Not raising as a FAIL at this stage.

---

## 2. BottomNav — `src/components/layout/BottomNav.tsx`

**PARTIAL**

Labels do render. The render-prop pattern (`{({ isActive }) => ...}`) is correctly used and labels are included at line 46–49.

**Issue 1 — Nav height does not match DS spec.**
The DS specifies the bottom tab bar at `80px` height (line 492 of DESIGN_SYSTEM.md). The component sets `h-[68px]` on the inner flex container (line 25). The DS also specifies `height: 80px; padding: 8px 0 env(safe-area-inset-bottom)`. The nav is 12px shorter than specified. On an iPad this reduces the tap target area for the icon+label group.

**Issue 2 — Active label colour is `--blue`, not `--t1`.**
The DS tab item table (line 506–509) specifies active state as `icon: --blue`, `label: --t1`. The component applies `text-[var(--blue)]` to both icon and label when active (line 46). This means the active label is blue text rather than near-white. For a 7-year-old reading "My Animals" in a small label, blue-on-near-black has lower legibility than white-on-near-black. The DS intent is clear: the icon carries the colour, the label stays `--t1` for maximum readability.

**Issue 3 — Label font weight mismatch.**
DS specifies tab font as `11px / 500`. The label uses `font-600` (line 46). This is a minor drift but worth noting as it makes labels slightly bolder than the system intends, which could look heavy at 10px.

**Recommended fix:** Set nav container to `h-[72px]` (closest DS spacing value above the DS 80px target that also accounts for the safe-area padding being applied on the container, not the inner div), match active label colour to `text-t1`, and drop label weight to `font-500`.

---

## 3. PetCard — `src/components/my-animals/PetCard.tsx`

**PARTIAL**

Care state indicator is present and positioned correctly at `top-2 right-2` (lines 43, 48). Lucide icons are used. The pulse animation on `needs-care` (`animate-[pulse_1s_ease-out_1]`) fires once, which is appropriate — persistent looping animations are banned by the DS for non-loading elements.

**Issue — Icon size is too small for a child.**
The care state icon is `size={14}` (lines 43, 49). The DS minimum touch target is 44px, but this is a status indicator not a button, so touch target does not apply. However, 14px rendered in the top corner of a card that is already small in a 2-column grid on a phone will be extremely hard to read for a 7-year-old. The icon conveys critical information (does this pet need care?). Recommend increasing to `size={18}` and wrapping in a small circular background pill (`w-6 h-6 rounded-full bg-[var(--card)]`) to give it contrast against the image.

**Issue — Competing with "For Sale" badge.**
The "For Sale" badge sits at `top-2 left-2` and the care indicator sits at `top-2 right-2`. When a pet is both for sale AND needs care, both will appear simultaneously on a small card image. This is visually cluttered but functionally manageable. No code change needed — the positioning avoids overlap — but worth flagging for future visual testing.

---

## 4. MyAnimalsScreen — `src/screens/MyAnimalsScreen.tsx`

**PASS**

`CoinDisplay` is present in the header (line 75). Care state is correctly computed and passed to `PetCard` (lines 137–142). The `todayString()` comparison drives `cared-today` vs `needs-care` — every pet without a care log entry for today shows `needs-care`, which is the correct default. No native select elements are present; sort buttons use pill-shaped `<button>` elements. The `max-w-3xl mx-auto` constraint is not present on the grid container, but since the grid lives inside the padded scroll area at `px-6` this is acceptable. The `pb-24` bottom padding (line 122) is present and clears the 68px nav.

One note: new pets that have never had any care will show `needs-care` immediately on adoption. This is technically correct but may feel unwelcoming. This is a product decision, not a blocking UX issue.

---

## 5. MarketplaceScreen — `src/screens/MarketplaceScreen.tsx`

**PARTIAL**

Ghost buttons replaced: "Decline offer" uses `variant="outline"` (line 120) and "Pass" uses `variant="outline"` (line 163). Loading state uses `Loader2` spinner correctly. The `max-w-3xl mx-auto` content column is present on the Browse tab (line 385) and the My Listings component (line 190).

**Issue 1 — Naming sheet is dismissable when it should not be.**
The `BottomSheet` for naming (line 444) passes `onClose={() => {}}` — a no-op. This means the drag handle close button (the X rendered by `BottomSheet` when a `title` is passed, line 129–136 of Modal.tsx) will render and, when tapped, will call the no-op. The sheet will not close, which is the intended behaviour. However, the X button will still visually appear and a child who taps it expecting to dismiss will be confused when nothing happens. The sheet should either suppress the close button entirely or display a message explaining a name is required.

**Recommended fix:** Either pass `title={undefined}` and render the title inside the `NamingSheet` content (removing the X entirely), or add a `hideClose` prop to `BottomSheet`.

**Issue 2 — NamingSheet has no explanation of why the pet has no name yet.**
The sheet opens with "What will you name your new {breed}?" which is clear. However, there is no context about what prompted this (the player just bought the animal from the marketplace). For a 7-year-old who may not connect the naming step to the purchase that just happened, a one-line of context such as "Your new {breed} is ready to meet you!" would help orientation. Not a blocking defect.

**Issue 3 — Decline toast is missing on NPC buyer offer decline.**
At line 436–437, `declineNpcBuyerOffer` is called but no toast is shown on success. The buy-offer decline at line 478–479 correctly shows an "Offer declined" info toast. The NPC buyer decline silently removes the offer from the UI. A child with ADHD needs confirmation that an action completed. Recommend adding `toast({ type: 'info', title: 'Offer declined' })` after line 436.

---

## 6. Modal — `src/components/ui/Modal.tsx`

**PASS**

Modal surface correctly uses `bg-[var(--card)]` (line 53). BottomSheet also uses `bg-[var(--card)]` (line 110). Both are correct per the DS spec as written — modals and sheets sit on the `--card` surface level.

One observation: the DS specifies bottom sheet radius as `20px 20px 0 0` (top corners only). The component uses `rounded-t-xl` which maps to 20px top corners. Correct.

---

### Design Question — Modal Glass Panel

**Owner clarification received 2026-03-27:** The BottomSheet should use a glass/blur surface — consistent with the footer nav — so that page content is partially visible through the sheet during its rise animation. This is an intentional iOS-style pattern, not a departure from the system.

**Three options considered:**

**Option 1 — Full glass, no backdrop**
Sheet: `rgba(13,13,17,.85)` + `backdrop-filter: blur(20px)`. Backdrop div removed entirely.
Pros: maximum visual premium, content always visible behind sheet, perfect consistency with footer nav recipe. Cons: no visual separation between sheet and page for very long sheets with dense content — if the sheet covers the full viewport, the blur alone provides little contrast for text-heavy areas at the bottom of the sheet.

**Option 2 — Light scrim + glass**
Sheet: `rgba(13,13,17,.85)` + `backdrop-filter: blur(20px)`. Backdrop: `rgba(0,0,0,.3)`.
Pros: glass effect is fully visible during the rise animation (backdrop is light enough to see through), sheet retains legibility on all content lengths because the scrim reduces visual competition from page content, consistent with footer nav recipe on the sheet itself. Cons: marginally less "pure" than option 1, but imperceptible to most users.

**Option 3 — Glass on rise only, backdrop animates to dark**
Sheet: glass throughout. Backdrop animates from `transparent` to `rgba(0,0,0,.65)` over 300ms after settle.
Cons: adds Framer Motion state complexity (requires tracking settle completion separately from sheet position), the transition from glass-visible to glass-obscured is perceptible and feels inconsistent — the most interesting part of the effect is removed just as the user starts reading the sheet. Not recommended.

---

**Recommendation: Option 2 — light scrim + glass.**

This is the correct implementation. It honours the owner's intent (glass effect visible during the rise, iOS-style pattern), uses the exact recipe already established in the DS for the footer nav (`rgba(13,13,17,.85)` + `backdrop-filter: blur(20px)`), and the `rgba(0,0,0,.3)` scrim is light enough to feel translucent while giving the sheet's in-content text enough contrast to remain readable on long sheets. The `backdrop-filter` blur on the sheet surface will be clearly visible through the scrim.

**Specific CSS values for `src/components/ui/Modal.tsx`:**

**`BottomSheet` sheet surface** — replace the className token `bg-[var(--card)]` on the `motion.div` (line 110) with an inline style:

```
style={{ background: 'rgba(13,13,17,.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
```

The `border border-[var(--border)]` and `rounded-t-xl` classes remain unchanged.

**Backdrop div** — the existing shared `Backdrop` component (lines 12–23) sets `bg-black/75` (`rgba(0,0,0,.75)`). This should NOT be used for the BottomSheet with the glass treatment — it is too dark and will negate the glass effect. Two implementation paths:

- **Preferred:** Give `BottomSheet` its own local backdrop element rather than sharing the `Backdrop` component, and set it to `rgba(0,0,0,.3)`. The `Modal` (centred) retains the existing `Backdrop` at `bg-black/75` — centred modals are fully opaque surfaces and do not need the glass treatment.
- **Alternative:** Add an optional `dimLevel` prop to `Backdrop` and pass `0.3` from `BottomSheet`.

The `Backdrop` component's `animate={{ opacity: 1 }}` and `initial={{ opacity: 0 }}` remain — the fade-in on the light scrim is correct.

**The centred `Modal` component is unchanged.** Glass treatment applies to `BottomSheet` only. Centred modals sit in the centre of the screen with a solid card surface — the context is different and the current opaque `--card` background is correct for that pattern.

**Accessibility note:** `backdrop-filter` is not supported in some older Android WebViews. The fallback (when blur is unsupported) will be the `rgba(13,13,17,.85)` background alone — nearly opaque at 85%, which is a fully legible fallback. No additional code needed; this degrades gracefully.

---

## 7. ExploreScreen — `src/screens/ExploreScreen.tsx`

**PASS**

`CoinDisplay` is present in the header (line 62). The `max-w-3xl mx-auto w-full` constraint is applied to the search bar and category pills containers (lines 64, 72), and to the grid+rail flex container (line 77). Empty search state is present with a Search icon, heading, description, and a clear button (lines 78–89). The "Clear search" button uses `variant="outline"` and correctly resets both `query` and `activeCategory` on click (line 86).

The empty state icon is `Search` at `size={48}` with `text-t3`, which matches DS empty state spec. The heading at `text-[17px] font-600` is close to DS H4 (22px/600) but close enough for a compact empty state. No blocking issues.

---

## 8. AnimalCard — `src/components/explore/AnimalCard.tsx`

**PASS**

`RarityBadge` is present at line 40, replacing the colour dot. The badge is positioned in the bottom-right of the card body alongside the animal type/category label. The layout uses flexbox with `justify-between` (line 36), which correctly separates the text label from the badge. No emoji present. DS patterns followed.

---

## 9. ArcadeShell — `src/components/arcade/ArcadeShell.tsx`

**PARTIAL**

Exit confirmation overlay is present (lines 254–269). Speech is wired via `useSpeech` and fires on question change (lines 68–72). Ghost button usage has been removed — the results screen uses `variant="outline"` on "Back to games" (line 238).

**Issue 1 — Exit overlay button order may confuse a child.**
The exit confirmation (lines 259–265) has "Keep playing" as the first button (primary, top) and "Leave" as the second (outline, bottom). For a destructive confirmation, the DS pattern and general child UX convention is: the safe/cancel action is secondary (smaller, less prominent) and the confirming action is primary. Here, "Keep playing" IS the safe action and it is correctly styled as primary — this is correct and intentional. No issue.

**Issue 2 — "Leave" button label is ambiguous for a 7-year-old.**
"Leave" is adult vocabulary. A child may understand "Stop playing" or "Quit" more readily. "Leave" is technically correct but marginally less child-friendly than the rest of the interface vocabulary. Low severity — not a blocking defect.

**Issue 3 — Exit overlay has no visual description of what will be lost.**
"You'll lose your progress." (line 258) references "progress" which is an abstract concept for young children. A more concrete message such as "You'll lose your score and coins for this game." would be clearer. Not a blocking defect but worth addressing.

**Issue 4 — Speech fires on `currentIndex` and `phase` but missing `speak` in dependency array.**
The `useEffect` at line 68 has `eslint-disable-line react-hooks/exhaustive-deps`. `speak` and `speechEnabled` are used inside the effect but excluded from deps. This can cause stale closures — if `speechEnabled` changes mid-game the effect will not re-run. This is a technical concern logged here as it affects the speech feature's reliability for the target audience who depend on audio support.

---

## 10. ShopScreen — `src/screens/ShopScreen.tsx`

**PASS**

"Not enough coins" message is present in the buy button label (line 151) and also as a secondary message below the price row (lines 154–158). The undo toast is wired via `onUndo` callback (lines 186–188). Grid columns use `grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4` (line 254), which is correct responsive behaviour.

The "Not enough coins" affordance at lines 154–158 is well designed — it shows the player's current coin balance alongside the item price. This is concrete and useful for a child learning about budgets.

---

## 11. CarePanel — `src/components/my-animals/CarePanel.tsx`

**PASS**

`Loader2` spinner used while busy (line 77), `Check` icon used when done (line 77), original action icon used at rest. The tri-state icon is correct. Done state uses `bg-[var(--green-sub)] border-[var(--green)]` which follows DS tint pair rules. Label colour shifts to `text-[var(--green-t)]` when done (line 81). All correct.

---

## 12. CardsScreen — `src/screens/CardsScreen.tsx`

**PASS**

`pb-24` is present on the packs tab content (line 236) and on the collection grid (line 151). Both scrollable areas clear the fixed nav. No issues found.

---

## 13. DailyBonusCard — `src/components/home/DailyBonusCard.tsx`

**PARTIAL**

Auto-dismiss timer is correctly set to 5000ms (line 19). The card is tappable via `onClick={onDismiss}` (line 42) and has `role="button"` and `aria-label` (lines 43–44). `useReducedMotion` is respected. Lucide `Coins` icon is used. No emojis.

**Issue — Motion variant pattern has a gap.**
The `variants` object (lines 23–29) defines `initial`, `animate`, and `exit` but the `motion.div` at line 32 passes these as `initial`, `animate`, and `exit` props directly, not via `variants`. When `reducedMotion` is true, the variants are set to empty objects `{}`, but the transition (line 37) is always applied regardless of reducedMotion. For a user with `prefers-reduced-motion`, the transition duration of 0.3s will still apply to the empty animations — technically harmless since there is nothing to animate, but the `useReducedMotion` hook should ideally suppress the transition entirely. The DS spec says "instant state change, no movement, no scale transforms" for reduced motion. Low severity.

**Issue — No visual progress indicator on the 5s auto-dismiss.**
For a child who taps the card expecting to interact further, there is no indication the card will disappear on its own. A subtle progress bar or countdown would help set expectations. This is an enhancement, not a defect. Not blocking.

---

## 14. FeaturedPetCard — `src/components/home/FeaturedPetCard.tsx`

**PASS**

`variant="outline"` is used on the "View my animals" button (line 79), replacing the previous ghost variant. The button correctly calls `e.stopPropagation()` (line 82) to prevent double-navigation. The whole card is also tappable via the parent `div` with `role="button"` (line 58). No emojis. DS patterns followed.

---

## 15. PetDetailSheet — `src/components/my-animals/PetDetailSheet.tsx`

**PARTIAL**

The 2×2 footer grid is present (lines 194–225) with Rename, Release, List for Sale, and Compare. The equipment section (lines 153–190) scrolls horizontally. The empty state for equipment (lines 184–185) says "No saddles owned — buy one in the Shop" which is clear and actionable.

**Issue 1 — Release button uses a raw custom `className` instead of a DS variant.**
The Release button (lines 201–208) uses `variant="outline"` with a class override: `className="border-[var(--red)] text-[var(--red-t)] hover:bg-[var(--red-sub)]"`. This is acceptable as a pattern for a danger variant — the colours are all DS tokens. The concern is consistency: if a danger button variant were added to the DS, this would need updating in multiple places. Noting it, not raising as a FAIL.

**Issue 2 — "List for Sale" and "Compare" are placeholder buttons with no action or disabled state.**
Both buttons call `() => {/* Tier 3 */}` (lines 213, 219). They are not disabled and have no visual indication they are non-functional. For a 7-year-old, tapping a button that does nothing is confusing and may feel broken. These buttons should either be removed until Tier 3 is built, or rendered with `disabled` styling and a tooltip/toast explaining they are coming soon.

**Recommended fix:** Add `disabled` prop to both placeholder buttons, or conditionally hide them until the feature exists.

**Issue 3 — Equipment section only shows saddles.**
The section label reads "Equipment" but the filter at line 154 limits to `category === 'saddle'`. This is fine for Tier 2 scope but the section title implies broader functionality. This is a product scope note, not a UX defect at this tier.

**Issue 4 — 2×2 grid on 375px screen width.**
At 375px viewport, `px-6` padding (24px each side) leaves 327px for the grid. Each of 4 buttons in a 2×2 grid with `gap-2` (8px gap) will be approximately (327 - 8) / 2 = 159px wide. At `size="md"` (44px height), button text like "List for Sale" at 14px/600 is borderline for a 159px button. The text will truncate or wrap. Recommend testing at 375px and either shortening "List for Sale" to "Sell" or accepting wrapping.

---

## 16. ReleaseConfirm — `src/components/my-animals/ReleaseConfirm.tsx`

**FAIL**

**Issue 1 — Cancel button uses `variant="ghost"` — prohibited on visible actions.**
Line 36 uses `variant="ghost"` for the Cancel button. The CLAUDE.md project rules explicitly state: "`ghost` button variant for visible actions — use `outline`, `primary`, or `accent`". The DS ghost variant has `rgba(255,255,255,.06)` background — it is very low contrast on the `--card` sheet surface. For a 7-year-old, a low-contrast Cancel button inside a destructive confirmation is a serious usability risk. The child needs to clearly see they can back out safely. Change to `variant="outline"`.

**Issue 2 — Button order is inverted for a destructive confirmation.**
The layout order is Cancel first (top), then the red Release button second (bottom, line 45). On a bottom sheet this means the Release button is closest to the thumb and the Cancel button is further away. For a destructive action, the safe exit (Cancel) should be the easiest to reach — i.e. at the bottom, closest to the user's thumb. The current order puts the destructive action at the most reachable position. Invert the order: red Release button on top, Cancel (outline) at the bottom.

**Issue 3 — Copy is acceptable but the permanence signal could be stronger.**
"Are you sure you want to say goodbye to {petName}? This can't be changed." — the tone is gentle and age-appropriate. "This can't be changed" adequately signals permanence. No change needed on copy.

**Issue 4 — Release button uses a raw `<button>` element with inline style.**
Lines 45–56 use a raw `<button>` with `style={{ backgroundColor: 'var(--red)' }}` rather than the DS Button component. This bypasses the DS button system — the button does not inherit the DS pill radius correctly unless `rounded-pill` is manually applied (which it is, line 48). The button does have `rounded-pill` and correct height `h-12`. However the `font-600 text-[15px]` sizing matches `size="lg"` only approximately. Using the Button component with a danger variant className (as done in PetDetailSheet) would be more consistent. Minor inconsistency, but raises risk of future drift.

---

## 17. RacingScreen — `src/screens/RacingScreen.tsx`

**PASS**

The copy fix has been applied. Race result uses "You won!" (line 177), ordinal suffixes are correct (nd/rd/th, lines 176–177). The `max-w-3xl mx-auto w-full` content column is applied to the scroll area (line 236). `pb-24` is present. `CoinDisplay` is in the header. Toast at line 215 reads "You're in! Tap Race to see what happens." which is clear and child-appropriate. No issues found.

---

## Summary Table

| Component | File | Result |
|-----------|------|--------|
| AdoptionOverlay | AdoptionOverlay.tsx | PASS |
| BottomNav | BottomNav.tsx | PARTIAL |
| PetCard | PetCard.tsx | PARTIAL |
| MyAnimalsScreen | MyAnimalsScreen.tsx | PASS |
| MarketplaceScreen | MarketplaceScreen.tsx | PARTIAL |
| Modal | Modal.tsx | PASS |
| ExploreScreen | ExploreScreen.tsx | PASS |
| AnimalCard | AnimalCard.tsx | PASS |
| ArcadeShell | ArcadeShell.tsx | PARTIAL |
| ShopScreen | ShopScreen.tsx | PASS |
| CarePanel | CarePanel.tsx | PASS |
| CardsScreen | CardsScreen.tsx | PASS |
| DailyBonusCard | DailyBonusCard.tsx | PARTIAL |
| FeaturedPetCard | FeaturedPetCard.tsx | PASS |
| PetDetailSheet | PetDetailSheet.tsx | PARTIAL |
| ReleaseConfirm | ReleaseConfirm.tsx | FAIL |
| RacingScreen | RacingScreen.tsx | PASS |

---

## Blocking Issues (must fix before sign-off)

### FAIL: ReleaseConfirm — ghost button on Cancel + inverted button order

**File:** `src/components/my-animals/ReleaseConfirm.tsx`, lines 36 and 44–56

The Cancel button is `variant="ghost"` which is prohibited on visible actions (CLAUDE.md hard rule, DS rule). This is a child safety concern: a ghost-style Cancel button is nearly invisible, making it harder for a 7-year-old to find their safe exit from a destructive action.

Additionally the button order puts the red Release button at the bottom of the sheet (closest to the thumb) and Cancel at the top. For a destructive confirmation on a bottom sheet, this arrangement nudges the user towards destruction. Cancel should be at the bottom, Release at the top.

**Required fix:**
1. Change Cancel to `variant="outline"`.
2. Move the Release button above the Cancel button in the DOM order.

---

## Non-Blocking Issues (should fix in next sprint)

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 1 | BottomNav.tsx | 25, 46 | Nav height 68px vs DS 80px; active label colour should be `--t1` not `--blue` |
| 2 | PetCard.tsx | 43, 49 | Care state icon at size 14 is too small; needs a background circle for contrast against image |
| 3 | MarketplaceScreen.tsx | 444–459 | Naming sheet X button renders but calls no-op — confusing for a child; suppress the close button |
| 4 | MarketplaceScreen.tsx | 436–437 | NPC buyer offer decline shows no confirmation toast — child gets no feedback |
| 5 | ArcadeShell.tsx | 257–258 | Exit copy "lose your progress" is abstract — make it concrete ("lose your score and coins") |
| 6 | PetDetailSheet.tsx | 211–224 | "List for Sale" and "Compare" are clickable but do nothing — add disabled state or remove until Tier 3 |
| 7 | PetDetailSheet.tsx | 194–225 | "List for Sale" label may overflow at 375px — test and shorten if needed |
| 8 | DailyBonusCard.tsx | 37 | Transition applies even in reduced-motion mode; suppress transition entirely when reduced motion is on |

---

## Overall Verdict

**REQUIRES FIXES**

One hard FAIL in `ReleaseConfirm.tsx` blocks sign-off: a ghost Cancel button on a destructive confirmation is a prohibited pattern and a real usability risk for the target age group. This must be corrected before the fix pass can be marked complete.

All other issues are non-blocking but issues 1 (BottomNav height/label colour), 4 (silent decline on marketplace), and 6 (non-functional buttons in PetDetailSheet) should be prioritised in the next sprint as they each affect daily-use flows for a 7-year-old.
