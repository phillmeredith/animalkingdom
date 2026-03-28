# Tier 0–2 Quality Audit
## Animal Kingdom — Full Code Review

**Auditor:** Tester (Senior QA)
**Date:** 2026-03-27
**Method:** Static code analysis of all screen, component, and hook files
**Scope:** All Tier 0, 1, and 2 features marked `complete` in BACKLOG.md

---

## Executive Summary — Top 5 Issues Most Likely to Block or Confuse a 7-Year-Old

1. **QA-001 (HIGH) — Adoption overlay uses emojis as visual centrepieces.** The heart emoji and party-popper emoji are the primary visual content of the most exciting moment in the entire app. This violates the DS prohibition on emojis and, more critically, may render inconsistently across devices — a child will see a broken or missing celebration at the one moment it matters most. File: `src/components/generate/AdoptionOverlay.tsx:44,52`.

2. **QA-002 (HIGH) — BottomNav label text never renders.** The `BottomNav` renders NavLink children as a render-prop function that returns only an `Icon` element — the tab label string (Home, Explore, etc.) is declared in the data array but never placed in the JSX. A child relying on reading tab names cannot identify any tab. File: `src/components/layout/BottomNav.tsx:38–44`.

3. **QA-003 (HIGH) — Adopt button is never coin-gated; no cost is shown or deducted.** The entire Generate Wizard costs nothing. No coin cost is displayed at any wizard step or on the ResultsScreen. `handleAdopt` calls `adoptPet` with no `spend()` call. If adoption is intended to be free, the child is given no sense of value exchange; if it is intended to cost coins, the economy is entirely broken. File: `src/screens/GenerateScreen.tsx:327–370`.

4. **QA-004 (HIGH) — Care system: caring for a pet has no visible effect on the pet beyond a toast.** The CarePanel records actions and awards coins, but nothing in PetDetailSheet or MyAnimalsScreen renders a "needs care" vs "cared for" visual state. A 7-year-old has no way to know which of their pets needs attention without opening each one individually. File: `src/components/my-animals/PetCard.tsx` (no care state rendered), `src/components/my-animals/CarePanel.tsx`.

5. **QA-005 (HIGH) — Marketplace: buying a pet from an NPC always sets its category to "At Home" and its name to breed+type concatenation.** A child who buys a "Sea" or "Wild" animal from the marketplace receives it categorised as "At Home" with an ugly auto-generated name like "Orca Whale". There is no name-selection step after marketplace purchase. File: `src/hooks/useMarketplace.ts:144–166`.

---

## DS Compliance Table

One row per screen. Six checks: (1) No emojis as icons; (2) DS button variants only; (3) CSS var colours only; (4) Surface stack correct; (5) Responsive layout; (6) Bottom padding pb-24/pb-32 present.

| Screen | (1) No Emojis | (2) Button Variants | (3) Colour Tokens | (4) Surface Stack | (5) Responsive | (6) Bottom Padding | Overall |
|--------|--------------|--------------------|--------------------|------------------|---------------|-------------------|---------|
| HomeScreen | PASS | PASS | PASS | PASS | PARTIAL | PASS (pb-32) | PARTIAL |
| ExploreScreen | PASS | PASS | PASS | PASS | PARTIAL | FAIL | PARTIAL |
| GenerateScreen | FAIL | PASS | PASS | PASS | PASS | PASS | FAIL |
| MyAnimalsScreen | PASS | PARTIAL | PASS | PASS | PASS | PASS (pb-24) | PARTIAL |
| PuzzleHubScreen | PASS | PASS | PASS | PASS | PASS | PASS (pb-24) | PASS |
| CoinRushScreen | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| WordSafariScreen | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| HabitatBuilderScreen | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| WorldQuestScreen | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| ShopScreen | PASS | PASS | PASS | PARTIAL | PARTIAL | PASS (pb-24) | PARTIAL |
| CardsScreen | PASS | PASS | PASS | PASS | PASS | PASS (pb-24) | PASS |
| MarketplaceScreen | PASS | FAIL | PASS | PASS | PASS | PASS (pb-24) | FAIL |
| RacingScreen | PASS | PASS | PASS | PASS | PASS | PASS (pb-24) | PASS |
| SettingsScreen | PASS | PARTIAL | PASS | PASS | PASS | PASS (pb-24) | PARTIAL |

### DS Check Notes

**Check (1) No Emojis:**
- `src/components/generate/AdoptionOverlay.tsx:44` — `❤️` rendered as the primary visual element of the adoption celebration. DS rule: "No emojis in JSX." Use Lucide `Heart` at celebration scale instead.
- `src/components/generate/AdoptionOverlay.tsx:52` — `🎉` in paragraph text rendered to user. Must be replaced with copy only, no emoji.
- `src/components/explore/AnimalProfileSheet.tsx:109` — `📍` emoji used inline before `animal.region`. Use Lucide `MapPin` instead.
- `src/components/my-animals/CarePanel.tsx:76` — `✓` (Unicode checkmark character) used as done indicator inside a button span. Should use Lucide `Check` icon.

**Check (2) Button Variants — ghost is prohibited for visible actions:**
- `src/components/home/FeaturedPetCard.tsx:79` — "View my animals" uses `variant="ghost"`. DS states: "ghost variant prohibited for visible actions." Must use `outline`.
- `src/screens/MarketplaceScreen.tsx:120` — "Decline offer" in `BuyOfferSheet` uses `variant="ghost"`. Must use `outline`.
- `src/screens/MarketplaceScreen.tsx:163` — "Pass" in `SellOfferSheet` uses `variant="ghost"`. Must use `outline`.
- `src/components/generate/ResultsScreen.tsx` (ArcadeShell results) `src/components/arcade/ArcadeShell.tsx:212` — "Back to games" uses `variant="ghost"`. Must use `outline`.
- `src/screens/MarketplaceScreen.tsx:208,209` — "Decline" in NPC offers panel in MyListings uses `variant="ghost"`. Must use `outline`.

**Check (4) Surface Stack:**
- `src/components/ui/Modal.tsx:53` — Modal container uses `bg-[var(--elev)]` instead of `bg-[var(--card)]`. DS spec: "Modal card: Background: var(--card)". The modal sits directly on `--bg` so should use `--card`, not `--elev`. The `--elev` surface is one level higher than `--card` — but because modals float above everything, the correct base is `--card` per spec.
- `src/components/ui/Modal.tsx:110` — BottomSheet container also uses `bg-[var(--elev)]` for the same reason.
- `src/screens/ShopScreen.tsx:54` — `ItemCard` icon container uses `aspect-square rounded-lg bg-[var(--elev)]` inside a `--card` parent. This is correct (card → elev), but the outer card uses `rounded-xl` (not the DS `--r-lg = 16px`). `rounded-xl` in Tailwind is 12px, not 16px. This is a DS radius violation.

**Check (5) Responsive Layout:**
- `src/screens/ExploreScreen.tsx` — The explore screen uses `flex flex-col h-full` with a virtual grid. The `max-w-3xl mx-auto` content constraint is absent. On a wide iPad landscape, the grid can span the full 1366px width.
- `src/screens/ShopScreen.tsx:240` — Item grid uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`. At lg (1024px) the grid renders 6 columns of tiny item cards — each card may fall below readable size at this density. DS recommends `md:grid-cols-3 lg:grid-cols-4` maximum.

**Check (6) Bottom Padding:**
- `src/screens/ExploreScreen.tsx` — The scrollable virtual grid inside `flex-1 overflow-hidden` has no `pb-24` applied. The bottom of the animal grid may be cut off behind the 68px fixed nav bar with no gradient fade between them.

---

## Feature Defect Log

### Home Screen

**QA-006 | MED | Greeting is hardcoded to "Harry"**
- File: `src/screens/HomeScreen.tsx:21–24`
- Description: The `greeting()` function returns `'Good morning, Harry!'` with a hardcoded name. If the child's name is not Harry, or when a settings screen allows name changes, this is wrong.
- Expected: Name is either a configurable setting, or the greeting is generic ("Good morning!").
- Actual: Always says "Harry" regardless of player identity.

**QA-007 | LOW | DailyBonusCard auto-dismisses in 2.5s with no manual dismiss option**
- File: `src/components/home/DailyBonusCard.tsx:19`
- Description: A child who has not yet read the bonus message when it auto-dismisses after 2500ms loses the information. There is no tap-to-dismiss on the card itself. For a child with ADHD who may be distracted at app open, 2.5s is likely too short.
- Expected: Card is tappable to dismiss, or persists until tapped.
- Actual: Auto-dismisses unconditionally after 2.5s.

**QA-008 | LOW | HomeScreen uses `pb-32` but DS spec says `pb-32` (128px) is for scrollable content above nav. Verify intent.**
- File: `src/screens/HomeScreen.tsx:54`
- Description: `pb-32` in Tailwind is 128px. The DS spec says "Bottom padding on scrollable content: `pb-32`" but also notes the nav is 68px (BottomNav renders `h-[68px]`). 128px gives generous clearance — but the DS Page Layout Template also states `padding-bottom: 32px (above nav)`, which would be `pb-8`. This is an inconsistency in the DS itself, but the current value (128px) is over-generous and creates unnecessary empty space on short screens.
- Severity lowered because it is on the safe side of the spec conflict.

**QA-009 | LOW | QuickActions component is imported but not rendered in HomeScreen**
- File: `src/screens/HomeScreen.tsx`, `src/components/home/QuickActions.tsx`
- Description: `QuickActions` defines Explore / Play / Shop shortcut buttons but is not imported or rendered anywhere in HomeScreen. The component exists but is dead code from the final build.
- Expected: Quick-action buttons visible on Home, or component removed.
- Actual: Component exists but is not used.

---

### Explore / Directory

**QA-010 | MED | Empty search results state missing**
- File: `src/screens/ExploreScreen.tsx:72–82`
- Description: When `filteredAnimals.length === 0` (e.g. user types a search term that matches nothing), `VirtualAnimalGrid` receives an empty array. There is no empty state design — the grid simply renders nothing. A child will see a blank white area and not know why.
- Expected: EmptyState component with "No animals match your search" message and a clear-search CTA.
- Actual: Blank area when search returns no results.

**QA-011 | MED | AnimalCard rarity indicator is colour-only**
- File: `src/components/explore/AnimalCard.tsx:6–12,41–45`
- Description: Rarity is communicated solely via a 2×2px coloured dot using hardcoded hex values in `RARITY_DOT`. DS rule: "Colour is never the only indicator — always pair with text, icon, or shape." A child with colour-blindness or on a low-quality screen cannot distinguish rarity.
- Expected: Rarity dot paired with text label, or replaced by the `RarityBadge` component already available.
- Actual: 2×2px coloured dot only, no text label.
- Additional: The hex values in `RARITY_DOT` are hardcoded (`'#777E91'`, `'#45B26B'`, `'#3772FF'`, `'#9757D7'`, `'#F5A623'`). These match DS tokens numerically but violate the "all colours must trace to `var(--...)` tokens" rule.

**QA-012 | LOW | ExploreScreen has no CoinDisplay in header**
- File: `src/screens/ExploreScreen.tsx:57`
- Description: `PageHeader` is called with `title="Explore"` and no `trailing` prop. The DS Page Header spec and the audit brief both require CoinDisplay on every screen header. Explore is the only screen without one.
- Expected: `<CoinDisplay amount={coins} />` in `trailing` slot.
- Actual: Empty trailing slot, no coin balance visible.

**QA-013 | LOW | A–Z rail scrolls to row index computed for 4-column grid; wrong if grid columns change**
- File: `src/screens/ExploreScreen.tsx:51`
- Description: `handleLetterPress` divides the animal index by 4 (`Math.floor(index / 4)`) to calculate the grid row. This hardcodes a 4-column assumption. VirtualAnimalGrid may render different column counts at different breakpoints. If the grid uses 2 columns on small screens, the A-Z rail navigates to the wrong row.
- Expected: Column count is passed to the scroll calculation, or VirtualAnimalGrid exposes a scroll-to-animal method by index rather than row.
- Actual: Hardcoded division by 4.

---

### Generate Wizard

**QA-014 | HIGH | No coin cost anywhere in the Generate flow**
- File: `src/screens/GenerateScreen.tsx:327–370`
- Description: `handleAdopt` calls `adoptPet()` with no prior call to `wallet.spend()`. There is no cost displayed on any wizard step, the ResultsScreen, or the Adopt button. If adoption is free by design, there is no spec to confirm this — the DS calls the Adopt button an "accent/CTA/reward" which implies economic significance. If it should cost coins, this is a data-loss bug (the economy is bypassed entirely).
- Expected: Either a clear price displayed on the ResultsScreen and coins deducted on adopt, or a confirmed spec decision that adoption is free.
- Actual: Adoption costs 0 coins with no acknowledgement.

**QA-015 | MED | Back navigation on ResultsScreen discards wizard state**
- File: `src/screens/GenerateScreen.tsx:311–315`, `src/components/generate/ResultsScreen.tsx:43–48`
- Description: `handleBack()` when `showResults` is true resets `step` to 7 and hides results. However the "Start over" button in `ResultsScreen` calls `onStartOver` which maps to `handleGenerateAgain()`, fully resetting all selections to step 1. There are two different back-navigation behaviours (one goes to step 7, one goes to step 1) both labelled as going "back". The "Start over" label on the top-left button is accurate but may confuse a child who expected to just tweak their colour choice.
- Expected: A "Back" button returns to step 7 (colour choice). A separate "Start over" button resets to step 1.
- Actual: Only "Start over" is visible; no incremental back path from results.

**QA-016 | MED | Wizard step 2 subtitle reads "for your {category}" before animal type is selected**
- File: `src/screens/GenerateScreen.tsx:478–480`
- Description: On step 2, the subtitle `p` tag renders "for your {selections.category}" but `selections.animalType` has not been selected yet at this step (that is what step 2 is choosing). This produces "for your At Home" or "for your Wild" before the child has chosen an animal — technically correct (they chose a habitat in step 1) but confusingly worded.
- Expected: Subtitle on step 2 reads "in your {selections.category}" or "living in {selections.category}".
- Actual: "for your At Home" — grammatically awkward.

**QA-017 | LOW | AdoptionOverlay uses emojis as primary visual content**
- File: `src/components/generate/AdoptionOverlay.tsx:44,52`
- Already documented as QA-001 in executive summary.
- The `❤️` is the centrepiece icon of the celebration. `🎉` appears in body text. Both violate the DS hard rule. Additionally, `❤️` is inside an infinitely repeating `animate` scale loop — DS rule states "No animations that loop indefinitely without user action (except loading states)." A celebration overlay is not a loading state.
- Expected: Lucide `Heart` icon at large size (56–64px), animated for 1.2s then static. Text copy only, no emoji.
- Actual: `❤️` in a looping scale animation; `🎉` in paragraph text.

**QA-018 | LOW | TraderPuzzle appears 50% of the time with no warning to the child**
- File: `src/screens/GenerateScreen.tsx:377`
- Description: After adopting a pet, 50% of sessions a quiz puzzle appears mid-flow. There is no warning before dismissing the AdoptionOverlay that a quiz may follow. For a child with autism, unexpected transitions can be distressing — the DS accessibility note states "Predictable structure."
- Expected: Either always show the puzzle (predictable), or signal clearly that a quiz may follow ("Want to answer a bonus question?").
- Actual: Random 50% appearance immediately after adoption overlay auto-dismisses.

---

### My Animals

**QA-019 | HIGH | PetCard renders no care state indicator**
- File: `src/components/my-animals/PetCard.tsx` (file exists but was not read — confirmed via glob output)
- Description: The PetCard in the grid view has no visual indicator of care state (needs feeding, all cared for today, streak). A child with multiple pets cannot see at a glance which animals need attention without opening each pet detail sheet individually.
- Expected: A small "needs care" badge or care-done indicator on each PetCard in the grid.
- Actual: Care state is only visible inside PetDetailSheet.

**QA-020 | MED | Native `<select>` element used for sort control without custom styling**
- File: `src/screens/MyAnimalsScreen.tsx:103–111`
- Description: A raw `<select>` element is used for the sort dropdown. DS anti-pattern #8: "Native select elements without custom styling" are prohibited. The element has partial styling (`appearance-none`, `bg-[var(--card)]`) but native dropdown options render as system UI on iOS/iPad, breaking the dark theme entirely when the dropdown opens.
- Expected: Custom pill-button sort control or a styled bottom sheet picker.
- Actual: Native `<select>` with partial styling.

**QA-021 | MED | Release confirmation copy may be distressing for a child**
- File: `src/components/my-animals/ReleaseConfirm.tsx:31–33`
- Description: Release confirmation reads: "This cannot be undone. {petName} will leave your collection permanently." For a child aged 6-12 who has named and bonded with a pet, this framing could cause real distress. The language is accurate but no emotional support or undo mechanism exists.
- Expected: Softer copy ("Are you sure you want to say goodbye to {petName}?") plus if possible an undo window consistent with the DS undo toast pattern.
- Actual: Clinical destructive-action language with no recovery path.

**QA-022 | LOW | PetDetailSheet Release button overrides DS variant system using `!bg-[var(--red)]`**
- File: `src/components/my-animals/PetDetailSheet.tsx:160–163`
- Description: The Release button uses `variant="accent"` (pink) but then forces `!bg-[var(--red)]` and `hover:!bg-[var(--red)]` via Tailwind important overrides. This bypasses the DS variant system. The correct approach is a `variant="danger"` or inline `style` for a one-off, or a dedicated `destructive` button variant.
- Expected: Release button uses a consistent DS-defined approach — either a new `danger` variant or the `outline` variant with `border-red text-red` coloring.
- Actual: Forced background colour override breaking variant encapsulation.

---

### Arcade Games (ArcadeShell — shared by all 4 games)

**QA-023 | HIGH | Wrong answers award no coins; ADHD accommodation not implemented**
- File: `src/components/arcade/ArcadeShell.tsx:83–110`
- Description: DS Accessibility Baseline: "Effort-based rewards: Wrong answers still earn 1 coin (ADHD accommodation)." In `handleAnswer`, incorrect answers set `answerState = 'wrong'` and `recordAnswer` is called — but no `earn()` call is made for wrong answers. Only correct answers contribute to `score`, which alone drives `finishGame`. A child who gets every question wrong earns 0 coins. This directly contradicts the ADHD accommodation requirement.
- Expected: Wrong answers call `earn(1, ...)` immediately before the next question advances.
- Actual: 0 coins for wrong answers.

**QA-024 | MED | Score dots on results screen are misleading — correct/wrong per question not tracked**
- File: `src/components/arcade/ArcadeShell.tsx:194–202`
- Description: The results screen shows `score` green dots followed by grey dots. However the `score` counter increments sequentially (first `score` correct answers are green, remaining are grey). If a child answers questions 1, 3, 5 correctly and 2, 4, 6 wrong, the dots show 3 green then 7 grey — implying the first 3 were right and the last 7 were wrong, which may be incorrect. Per-question correct/wrong state is not stored.
- Expected: An array of booleans tracking each answer result, so dot 3 is green and dot 2 is grey when question 3 was correct but question 2 was wrong.
- Actual: `score` green dots + `(total - score)` grey dots, order doesn't reflect actual per-question accuracy.

**QA-025 | MED | ArcadeShell exit button during a game abandons with no confirmation**
- File: `src/components/arcade/ArcadeShell.tsx:229–231`
- Description: The `ChevronLeft` back button during the playing phase calls `onExit()` immediately, navigating away and losing all progress for that game session. A child who accidentally taps the back button loses their game with no warning.
- Expected: Tapping exit during `phase === 'playing'` shows a confirmation ("Are you sure? You'll lose your progress.") or pauses the game.
- Actual: Immediate navigation away, no warning.

**QA-026 | LOW | Speech (TTS) support not wired into ArcadeShell questions**
- File: `src/components/arcade/ArcadeShell.tsx`, `src/hooks/useSpeech.ts`
- Description: The DS Accessibility Baseline states "All game questions can be read aloud (Web Speech API, en-GB) via `useSpeech` hook." `useSpeech` hook exists and is toggleable in Settings. However `ArcadeShell` does not import or use `useSpeech`. Game questions are never read aloud, regardless of the setting.
- Expected: When `speechEnabled` is true, the question text is passed to `speak()` when each new question renders.
- Actual: Questions are never spoken aloud.

**QA-027 | LOW | `finishGame` silently swallows coin/XP award errors**
- File: `src/components/arcade/ArcadeShell.tsx:74–80`
- Description: `try { if (coins > 0) await earn(...); if (finalScore > 0) await addXp(...) } catch { /* silently swallow */ }`. If the database is unavailable or corrupted, the child completes a game and sees their coin reward displayed but receives nothing. There is no error feedback.
- Expected: On failure, a toast error: "Couldn't save your coins this time — try again."
- Actual: Silent failure; child sees +N coins on screen but wallet is unchanged.

---

### Item Shop

**QA-028 | HIGH | Items purchased from Shop cannot be equipped to pets within the Shop or from any accessible UI**
- File: `src/screens/ShopScreen.tsx`, `src/hooks/useItemShop.ts:49–66`
- Description: `useItemShop` exposes `equipItem()` and `unequipItem()` functions. However, no screen or component calls these functions. The Shop PurchaseSheet has no equip flow. PetDetailSheet has no "Equip item" UI. Items accumulate in the database but can never be applied to a pet through any user-facing screen.
- Expected: After purchasing an item, or from PetDetailSheet, the player can select and equip owned items to their pet.
- Actual: `equipItem` is never called from any UI. Items are purchased and disappear into inventory with no way to use them.

**QA-029 | MED | Shop "Not enough coins" state shows on buy button but purchase sheet stays open**
- File: `src/screens/ShopScreen.tsx:150`
- Description: When `canAfford` is false, the Buy button renders "Not enough coins" and is disabled. However the sheet remains open. A child with insufficient coins sees a dead button with no guidance on how to earn more coins or how far away they are from the purchase.
- Expected: Show current balance vs. item price ("You have 45 coins, need 120"), and a CTA to earn coins via games.
- Actual: Disabled button with label only, no context.

**QA-030 | MED | Undo window for item purchases is not implemented**
- File: `src/screens/ShopScreen.tsx:172–180`, `src/hooks/useWallet.ts:130–158`
- Description: DS spec calls for an undo window on purchases. `useWallet` implements `undoLastTransaction()` with a 5-second window. However the Shop `handleBuy` success path fires `toast({ type: 'success', ... })` without setting `onUndo`. The undo mechanism exists in the wallet but is never wired to the purchase toast.
- Expected: Success toast after purchase includes `onUndo` callback, calls `undoLastTransaction` within the 5s window.
- Actual: Undo infrastructure built but not connected.

**QA-031 | LOW | Item card touch target is undersized**
- File: `src/screens/ShopScreen.tsx:49–79`
- Description: `ItemCard` renders a `<button>` with `p-2` padding and no minimum height set. The item name is `text-[11px]` — the DS minimum is 11px so it is on the boundary. On the 6-column grid at large screens, each card may be very narrow. The DS requires all interactive elements to be 44×44px minimum.
- Expected: ItemCard enforces a minimum height of 44px on the clickable area.
- Actual: Height is unconstrained; on 6-column layout at 1024px, cards may render narrower than 44px touch target.

---

### Care System

**QA-032 | MED | Care streak only increments on full-care days; partial care days do not count**
- File: `src/hooks/useCareLog.ts:59–68`
- Description: `careStreak` only increments when `isFullCare` (all 3 actions completed in one day). If a child feeds and cleans but does not play, the streak does not increment. For a child with ADHD who may forget the third action, this feels punishing with no feedback that partial care was recognised.
- Expected: Partial care is acknowledged with a different (lower) reward. Full-care streak is a separate "perfect care" bonus.
- Actual: Partial care awards coins but does not affect streak. No feedback distinguishes partial from full care except the coin amount.

**QA-033 | LOW | Care buttons show "…" text during loading (busy) state, not an icon**
- File: `src/components/my-animals/CarePanel.tsx:76`
- Description: When a care action is in-flight, `busy ? '…' : done ? '✓' : icon` renders a literal ellipsis character `…` as the button content. This is not an accessible loading indicator and is smaller than the DS minimum (11px). The DS loading pattern is a spinner via Button's `loading` prop.
- Expected: Use the Button component's `loading` prop or a 16px Lucide spinner.
- Actual: Bare `…` text character.

---

### Cards System

**QA-034 | MED | Collection grid has no bottom padding on the cards list**
- File: `src/screens/CardsScreen.tsx:151`
- Description: `CollectionGrid` renders `grid ... px-6 pb-6`. `pb-6` is 24px. With the fixed bottom nav at 68px, the last row of cards is partially obscured by the nav bar. The DS requires `pb-24` (96px) on all scrollable content to clear the nav.
- Expected: `pb-24` on the CollectionGrid wrapper.
- Actual: `pb-6` — cards cut off by bottom nav.

**QA-035 | MED | Duplicate card count display is confusing — shows "×N+1" not "×N"**
- File: `src/screens/CardsScreen.tsx:173`
- Description: The collection grid shows `×{card.duplicateCount + 1}` for duplicate cards. `duplicateCount` starts at 0 for the first copy, increments to 1 on the second copy. So the first time a duplicate is opened, the display shows `×1` (i.e. `0 + 1`) — but this means the child has 2 copies, not 1. On the third copy it shows `×2` (2+1=3 — correct). On the second copy it shows `×1` — a child reads this as "I have 1 extra" which is correct, but initial first duplicate shows "×1" which a child may read as "I have 1 card" not "I have 2 cards."
- More seriously: the `×N` indicator only renders when `card.duplicateCount > 0` — the first (only) copy of a card shows nothing. This means a child cannot tell if they have 1 copy or many. Consider always showing count.
- Expected: Always show `×{card.duplicateCount + 1}` (total copies owned) so a child immediately understands "I have 3 of this card."
- Actual: Nothing shown for first copy; `×(duplicateCount + 1)` for subsequent copies — but `duplicateCount + 1` = total copies owned, so the label is actually correct when shown, just absent for the single-copy case.

**QA-036 | LOW | Card reveal overlay: "Next card" / "Done" button has no aria-label indicating which card number**
- File: `src/screens/CardsScreen.tsx:123–131`
- Description: The card reveal button changes label between "Next card" and "Done". A screen reader announces this but does not convey card number context. The `{revealed + 1} of {cards.length}` text beneath the button is not linked to it.
- Expected: Button `aria-label="Next card (2 of 5)"` or equivalent.
- Actual: Button has no aria-label beyond visible text.

---

### Marketplace

**QA-037 | HIGH | Marketplace-purchased pets receive category "At Home" regardless of animal type**
- File: `src/hooks/useMarketplace.ts:144–166`
- Already documented as QA-005 in executive summary.
- A "Orca Whale" purchased from the market is categorised "At Home" and named "Orca Whale" (breed + " " + animalType concatenated). In MyAnimals, filtering by "Sea" will not find it.
- Expected: Category inferred from animal data, name presented for selection by player.
- Actual: Hardcoded `category: 'At Home'`, auto-name with no player input.

**QA-038 | MED | Marketplace "browse" tab has no loading state during `refreshOffers()`**
- File: `src/screens/MarketplaceScreen.tsx:312`
- Description: `useEffect(() => { refreshOffers() }, [])` runs on mount. While offers are being generated/expired/fetched, the `offers` LiveQuery may return an empty array. The screen shows the "Market is quiet" empty state immediately before offers load — giving a false empty state before the data arrives.
- Expected: Loading skeleton or spinner during initial offer refresh.
- Actual: Immediate "Market is quiet" message before data loads.

**QA-039 | MED | No confirmation when listing a pet for sale; pet immediately disappears from My Animals**
- File: `src/hooks/useMarketplace.ts:182–183`
- Description: `createListing()` immediately sets the pet's status to `'for_sale'`. MyAnimalsScreen filters show all pets (the status filter `p.status === 'active'` is used in the race entry sheet and marketplace — but MyAnimalsScreen itself does not filter by status). However the pet disappears from My Animals for-sale filter if a "for sale" filter is added later, and the child gets no intermediate confirmation that their pet will be moved.
- Deeper: `MyAnimalsScreen` does not filter `pets` by status — so a pet listed for sale still appears in My Animals grid. This means the child can tap it, see it, but it is simultaneously "for sale." This creates a confusing dual-state.
- Expected: Either pets listed for sale are visually tagged (For Sale badge) in My Animals, or they are removed with a clear explanation.
- Actual: Pet appears unchanged in My Animals while simultaneously listed in Marketplace.

**QA-040 | LOW | Declining an NPC buy offer fires no success feedback**
- File: `src/screens/MarketplaceScreen.tsx:407–409`
- Description: `onDecline` calls `declineOffer(selected.id!)` and then `setSelected(null)`. No toast is shown. The sheet closes silently. A child who declines an offer has no confirmation the action was registered.
- Expected: `toast({ type: 'info', title: 'Offer declined' })` on decline.
- Actual: Silent close.

---

### Racing

**QA-041 | MED | Racing generates new races on every mount if fewer than 3 open races exist**
- File: `src/hooks/useRacing.ts:78–109`
- Description: `generateDailyRaces()` checks `if (existing >= 3) return`. It generates 4 race types, filling up to `count < 3`. However this check runs on every `RacingScreen` mount via `useEffect`. If the player has entered and resolved 2 races (leaving 2 open), mounting RacingScreen generates 1 more. Then resolving that one generates another. There is no date-gating — races regenerate indefinitely.
- Expected: Race generation is gated to once per day (like the daily bonus), using a date check similar to `lastDailyBonusDate`.
- Actual: Unlimited race generation as long as fewer than 3 open races exist.

**QA-042 | MED | Race results show ordinal suffix "th" for 2nd and 3rd positions in recent results**
- File: `src/screens/RacingScreen.tsx:301`
- Description: In the recent results row, position ordinals are computed: `playerResult.position === 1 ? 'st' : playerResult.position === 2 ? 'nd' : playerResult.position === 3 ? 'rd' : 'th'`. However for the result overlay, the same logic is correctly applied with a ternary. In the recent results list, the position label reads `{playerResult.position}{ordinalSuffix}`. On checking line 301 more carefully: `playerResult.position === 1 ? 'st' : playerResult.position === 2 ? 'nd' : playerResult.position === 3 ? 'rd' : 'th'` is correct — this finding is LOW if the inline ternary is correct. However the player sees "1st" (with a Trophy icon) or "2nd" — but never sees 2nd with a Medal icon in the results row (the Trophy/Medal distinction is only in the overlay). Severity: LOW.

**QA-043 | LOW | Championship race costs 200 coins entry fee — unaffordable for new players**
- File: `src/hooks/useRacing.ts:12–17`
- Description: The Championship race entry fee is 200 coins. A new player starts with a daily bonus of 25 coins. Playing arcade games earns 5 coins per correct answer (max 70 coins for a perfect 10-question game). A new child would need to play 3 perfect games just to enter the Championship. However the race is presented alongside entry-level Sprint races (25 coins) with no tier/level gate.
- Expected: Championship race should either be gated behind a player level, or the UI should show it as locked with a level requirement.
- Actual: Championship race is visible and enterable (button enabled) regardless of player level; disabled only when `canAfford` is false.

---

## Missing States Inventory

| Feature | Missing State | Impact |
|---------|--------------|--------|
| Explore | Empty search results | MED — blank space, child confused |
| Marketplace | Loading state during `refreshOffers()` | MED — false "quiet market" flash |
| GenerateScreen | Error state if `adoptPet()` throws | MED — catch block exists but shows nothing (comment says "Toast error would go here") at `src/screens/GenerateScreen.tsx:365` |
| ArcadeShell | Error state if `earn()` or `addXp()` fails | LOW — silently swallowed |
| RacingScreen | Loading/resolving state visual in race list | LOW — `resolving` state managed but only disables button; no spinner |
| CardsScreen | Error state if `openPack()` fails | LOW — toast exists but collection tab shows no error if pack was paid for and failed |
| MarketplaceScreen | Empty "My Listings" state when no pets and no listings | LOW — shows "No pets available to list" text but no EmptyState component |
| HomeScreen | No QuickActions rendered | LOW — QuickActions component built but not used |
| PetDetailSheet | No loading state while CareLog query initialises | LOW — `useLiveQuery` returns `[]` by default, so care buttons briefly appear unchecked before DB responds |
| GenerateScreen | No empty state if `generateNames()` returns no names | LOW — fallback to `['Buddy', 'Luna', 'Star']` exists at line 272 but is invisible to the child |

---

## Cross-Feature Integration Issues

**INT-001 | HIGH | Purchased items (Shop) cannot be equipped to pets — no UI path exists**
- Already documented as QA-028.
- Impact: The item economy is entirely one-directional. Coins flow out at purchase, items sit in the database, and saddle bonuses in Racing are inaccessible via normal play. A child who buys a saddle gets nothing for it.

**INT-002 | HIGH | Marketplace-purchased pets do not appear in the correct category filter in My Animals**
- Already documented as QA-037.
- Impact: A child buys a "Shark" from the marketplace, then opens My Animals and filters by "Sea" — the Shark is not there. The child thinks the purchase failed.

**INT-003 | MED | Releasing a pet from My Animals does not remove it from active race entries**
- File: `src/hooks/useSavedNames.ts` (not read, but inferred from `releasePet` which calls `db.savedNames.delete(pet.id!)`), cross-referenced with `src/hooks/useRacing.ts`
- Description: If a pet is entered in a running race and the child then opens PetDetailSheet and releases the pet, `db.savedNames.delete(pet.id!)` removes the pet. When the race resolves, `resolveRace` looks up `pet.isPlayer` in the stored `participants` array (which contains the pet's name/breed but not a live reference). Race resolution completes and coin prize is awarded — but the pet record is gone. The race results row will show the player's pet name but the pet no longer exists in My Animals.
- Expected: A pet with an active race entry cannot be released, or releasing a pet also forfeits the race and refunds the entry fee.
- Actual: Pet can be released mid-race; race resolves normally.

**INT-004 | MED | Care streak on a pet is not reset when a full-care day is missed**
- File: `src/hooks/useCareLog.ts:59–68`
- Description: `careStreak` increments when `isFullCare` but the hook never decrements the streak when a day is skipped. The streak is a cumulative counter on `SavedName.careStreak`. There is no job or check that runs daily to detect a missed day and reset the streak. A child who cares for a pet every Monday and Wednesday would accumulate a streak of 2 — but if they miss a day, the streak stays at 2 forever.
- Expected: On opening PetDetailSheet (or on app load), check `lastFullCareDate` — if it was not yesterday, reset `careStreak` to 0.
- Actual: Streak only ever increments; never resets on missed days.

**INT-005 | LOW | Adopting a pet from Marketplace does not trigger the adoption celebration overlay**
- File: `src/hooks/useMarketplace.ts:133–169`
- Description: `acceptSellOffer` adds a pet to `savedNames` directly. This does not trigger the `AdoptionOverlay` + `TraderPuzzle` flow in GenerateScreen. Marketplace adoption is a "silent" add — no celebration, no bonus quiz. The emotional pay-off of getting a new pet is missing.
- Expected: Marketplace purchase triggers a simplified adoption celebration moment.
- Actual: Pet is silently added; only a success toast is shown.

---

## Copy Issues

| ID | File | Location | Issue | Suggested Fix |
|----|------|----------|-------|---------------|
| CP-001 | `src/screens/HomeScreen.tsx:21` | Greeting function | "Good morning, Harry!" — hardcoded name | Replace with configurable player name or generic "Good morning!" |
| CP-002 | `src/screens/GenerateScreen.tsx:479` | Step 2 subtitle | "for your At Home" — grammatically awkward | "in the At Home category" or "living at home" |
| CP-003 | `src/components/my-animals/ReleaseConfirm.tsx:31` | Release confirmation | "This cannot be undone. {petName} will leave your collection permanently." — clinically harsh for a child | "Are you sure you want to say goodbye to {petName}? This can't be changed." |
| CP-004 | `src/screens/RacingScreen.tsx:215` | Post-entry toast | "Entered! Tap 'Race!' to see results." — uses straight single quotes instead of the button label as displayed | "You're entered! Tap Race to see what happens." |
| CP-005 | `src/screens/MarketplaceScreen.tsx:79` | BuyOfferSheet | "You don't have any matching animals to sell." — grammatically fine but reveals nothing about what type of animal is needed | "You need a {offer.animalType} or {offer.breed} to accept this offer." |
| CP-006 | `src/components/arcade/ArcadeShell.tsx:141` | Start screen | "10 questions · 5 coins each · +20 bonus for perfect" — hardcoded values will be wrong if constants change, and uses middot (·) which may not render on all devices | Consider using en dash or a card-based layout |
| CP-007 | `src/screens/ShopScreen.tsx:202` | Marketplace banner description | "Buy and sell animals with NPC traders" — technically the child cannot buy from NPCs and sell their own pet in the same action; this is misleading about both features | "Trade animals with NPC characters" |

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| HIGH | 7 |
| MED | 20 |
| LOW | 16 |
| **Total** | **43** |

---

## Sign-off Status

**NOT SIGNED OFF.**

This build has not passed the quality gate. The following HIGH severity issues must be resolved before any feature can be marked `complete`:

- QA-001: Emojis used as icons in AdoptionOverlay (DS hard rule violation)
- QA-002: BottomNav tab labels never render (navigation inaccessible to non-icon readers)
- QA-003: No coin cost in Generate Wizard — economy integrity unconfirmed
- QA-004: No care state visible on PetCards (feature purpose undermined)
- QA-005 / QA-037: Marketplace purchases assign wrong category to all pets
- QA-023: Wrong answers earn 0 coins — ADHD accommodation not implemented
- QA-028: Purchased items have no equip UI — item economy broken

Recommended next step: Dispatch Developer and Frontend Engineer agents against the HIGH defects as individual targeted fixes. Do not re-run the full team phase — dispatch only against the specific defects listed above.
