# Tier 0–2 Audit and Fix Pass — Retrospective

**Date:** 2026-03-27
**Scope:** All Tier 0, 1, and 2 features — full technical and quality audit pass
**Documents feeding this retro:** `TIER012_TECH_AUDIT.md`, `TIER012_QUALITY_AUDIT.md`
**Prior context:** `TIER2_RETRO.md` (process failure acknowledged; hard gates added to CLAUDE.md)

---

## 1. Scope

**Date audited:** 2026-03-27

**Features covered:** HomeScreen, ExploreScreen, GenerateScreen/Wizard, MyAnimalsScreen, PetDetailSheet, ArcadeShell (CoinRush, WordSafari, HabitatBuilder, WorldQuest), ShopScreen, CardsScreen, MarketplaceScreen, RacingScreen, SettingsScreen, and all supporting hooks and components across all Tier 0, 1, and 2 builds.

**Audit method:** Static code analysis of all screens, hooks, components, schema, and integration map. Two separate auditors: Developer (technical/integration) and Tester/Senior QA (quality/accessibility/child UX).

**Total defects found:**

| Severity | Quality Audit | Tech Audit | Combined (de-duped) |
|----------|--------------|------------|---------------------|
| HIGH | 7 | 6 | ~10 distinct |
| MED | 20 | ~14 | ~24 distinct |
| LOW | 16 | ~10 | ~20 distinct |
| **Total findings** | **43** | **30** | **~54 distinct** |

The quality audit alone produced 7 HIGH, 20 MED, and 16 LOW findings. The tech audit added 30 further integration, persistence, and wallet-safety findings. This retro treats them as a combined body of work.

---

## 2. Defect Categories — What Went Wrong and Why

---

### 2.1 Responsive Layout

**What was found:**
- `ExploreScreen` uses `flex flex-col h-full` with no `max-w-3xl mx-auto` content constraint. On iPad landscape (1366px), the animal grid spans the full screen width.
- `ExploreScreen` scrollable grid has no `pb-24` — bottom row of animals is cut off behind the fixed nav bar.
- `ShopScreen` item grid uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6` — at 1024px, 6 columns of tiny item cards fall below readable and tappable size.
- `MarketplaceScreen` and `MyListingsScreen` were identified in prior Tier 2 sessions as having single-column layouts with no responsive breakpoints, wasting more than half the iPad width.

**Root cause:**
The FE agent built at phone viewport width and never resized to 768px or 1024px during self-review. The interaction spec for each screen did not call out breakpoint requirements or the content-column constraint. Neither the FE self-review nor the Tester run (which was skipped for Tier 0–2) caught it.

**Which phase would have caught it:**
- Phase A (UX Designer): interaction specs must include responsive layout requirements
- Phase C (Frontend Engineer): self-review checklist at 375/768/1024px must be run after every screen component
- Phase D (Tester): visual audit must resize the preview to 768px and 1024px and verify no single-column layouts with wasted space

---

### 2.2 Design System Violations

**What was found:**
- `FeaturedPetCard` "View my animals" uses `variant="ghost"` — DS prohibits ghost for visible actions.
- `MarketplaceScreen` BuyOfferSheet "Decline offer" and SellOfferSheet "Pass" use `variant="ghost"`.
- `ArcadeShell` results "Back to games" uses `variant="ghost"`.
- `MarketplaceScreen` NPC offers "Decline" uses `variant="ghost"`.
- `Modal.tsx` container uses `bg-[var(--elev)]` instead of `bg-[var(--card)]` — modal sits on `--bg` and must step up to `--card` per DS surface stack, not `--elev` (one level too high).
- `ShopScreen` `ItemCard` uses `rounded-xl` (12px Tailwind) instead of `--r-lg` (16px DS token) — a border-radius violation.
- `AnimalCard` rarity indicator uses hardcoded hex values (`'#777E91'`, `'#45B26B'`, `'#3772FF'`, `'#9757D7'`, `'#F5A623'`) instead of `var(--...)` tokens.
- `MyAnimalsScreen` uses a raw `<select>` element for sort control — DS anti-pattern, prohibited without custom styling.
- `AdoptionOverlay` uses `❤️` and `🎉` as primary visual content — DS rule: no emojis in JSX.
- `AnimalProfileSheet` uses `📍` inline before region text. `CarePanel` uses `✓` Unicode character as done indicator.

**Root cause:**
The FE agent did not run the DS compliance checklist after building each component. Ghost variant was used as a shorthand for "secondary action" without reading the DS rule. The Modal surface level was changed during a bug fix without auditing child components. Rarity colours were invented rather than traced to tokens. The Tester (not run for Tier 0–2) is the final gate for DS compliance.

**Which phase would have caught it:**
- Phase C (Frontend Engineer): 6-point DS checklist must be run after every component — covers emojis, button variants, colour tokens, surface stack, layout, and bottom padding
- Phase D (Tester): DS visual audit is an explicit part of every test-results.md; ghost variant and hardcoded colours are on the checklist

---

### 2.3 Integration Gaps

**What was found:**
- `acceptBuyOffer()` and `acceptNpcBuyerOffer()` both call `earn()` after the Dexie transaction closes. If `earn()` fails, the pet is deleted and the listing is marked sold but no coins arrive — a split-brain, partial-data-loss scenario.
- `useItemShop` exposes `equipItem()` and `unequipItem()` but no screen calls either. Items purchased from the Shop can never be applied to a pet. The item economy is entirely one-directional.
- `adoptPet()` in `GenerateScreen` calls no `spend()`. There is no coin cost displayed or deducted at any wizard step. If adoption is not free, the economy is bypassed entirely.
- `MarketplaceScreen` sell-category filter is hardcoded. Marketplace-purchased pets always receive `category: 'At Home'` regardless of animal type.
- A pet with `status: 'for_sale'` can still receive care actions, be released (creating a dangling `playerListings` record with a dead `petId`), appear in BuyOfferSheet matching lists, and be entered into races via a path that does not check status.

**Root cause:**
The Developer did not verify every consequence of each event in `INTEGRATION_MAP.md` after writing each hook. Transaction boundaries were not reviewed. Cross-feature pet-status checks were not systematically audited. The Product Owner's acceptance criteria (Phase B) did not explicitly require the integration events to be end-to-end verified.

**Which phase would have caught it:**
- Phase B (Product Owner): acceptance criteria must include cross-system events from the integration map. "Sell offer accepted" must explicitly list: earn() inside transaction, pet status updated, listing archived, competing offers declined.
- Phase C (Developer): after every hook, verify every integration event the hook participates in, including transaction boundaries and downstream status effects
- Phase D (Tester): integration chain tests must be run as part of Phase D — test every AC, not just the happy path

---

### 2.4 Missing Accessibility Accommodations

**What was found:**
- Wrong answers in ArcadeShell award 0 coins. DS Accessibility Baseline explicitly requires `earn(1, "Effort reward", "arcade")` for wrong answers (ADHD accommodation). This is not implemented.
- `useSpeech` hook exists and is toggleable in Settings, but `ArcadeShell` never imports or uses it. Game questions are never read aloud regardless of the setting.
- `AdoptionOverlay` uses an infinitely looping scale animation on the `❤️` emoji. DS rule: no indefinitely looping animations except loading states. A celebration overlay is not a loading state.
- TraderPuzzle appears 50% of the time with no prior warning. DS accessibility note requires predictable structure. For children with autism, unexpected post-adoption transitions are explicitly flagged as a risk.

**Root cause:**
The User Researcher (Phase A) was not run. Accessibility assumptions — ADHD effort-coin, speech readout, predictable structure — were never validated or written into the interaction spec. The FE agent built ArcadeShell without reading the Accessibility Baseline section of the design system. The Tester (not run) is responsible for checking every accessibility AC against the spec.

**Which phase would have caught it:**
- Phase A (User Researcher): validate all accessibility assumptions for the target audience (ages 6–12, ADHD accommodations, autism-safe transitions, speech support)
- Phase A (UX Designer): interaction spec must include accessibility requirements section drawn from the DS Accessibility Baseline
- Phase C (Developer/FE): when building ArcadeShell, the effort-coin requirement and speech hook are in the DS — self-review against the spec would have caught both gaps
- Phase D (Tester): test every accessibility AC from the interaction spec

---

### 2.5 Missing Reward Systems

**What was found:**
- `useProgress.checkBadgeEligibility()` returns an empty array unconditionally (lines 138–141 — a permanent stub). `awardBadge()` exists and writes correctly to Dexie but is never called from any feature. No badges from care, rescue, racing, arcade, or marketplace events are ever checked or awarded.
- `useCareLog.ts` increments `careStreak` correctly but contains zero logic for the 3/7/14/30-day milestone bonuses specified in INTEGRATION_MAP event #13.
- `ArcadeShell.tsx` never calls `db.skillProgress.update(..., { gamesPlayed: gamesPlayed + 1 })`. The `gamesPlayed` field is never incremented at game end.
- `XP_PER_ACTION = 5` is declared in `useCareLog.ts` but never used. No XP is awarded for care actions.
- `finishGame()` calls `addXp()` but discards the return value containing `tierChanged` and `newTier`. No tier-up celebration is triggered.

**Root cause:**
The badge system and milestone bonus logic were stubbed during build and never revisited. The Developer did not verify all integration map consequences after completing each hook. There was no process check requiring badge-eligible events to call `checkBadgeEligibility()`. Dead constants and unchecked return values are symptoms of a build that was never reviewed.

**Which phase would have caught it:**
- Phase C (Developer): self-review must verify every integration event the hook participates in, including badge checks and milestone payouts
- Phase D (Tester): test every AC — "care streak of 7 days pays a milestone bonus" is a testable criterion; test it
- Phase E (Definition of Done): checklist must include "all reward events fire correctly per INTEGRATION_MAP"

---

### 2.6 Missing Error Handling

**What was found:**
- `ArcadeShell.tsx` `finishGame()` has an explicit `catch { /* silently swallow */ }` — if `earn()` or `addXp()` fail, the child sees coins on screen but the wallet is unchanged with no feedback.
- `HomeScreen` `claimDailyBonus()` failure leaves `bonusChecked` as false, causing `const loading = !bonusChecked` to remain true permanently — the UI is locked.
- `createListing()` and `cancelListing()` in `MarketplaceScreen` have no error handling — both fire and toast success unconditionally.
- `GenerateScreen` `adoptPet()` catch block exists but shows no toast (comment: "Toast error would go here").
- `equipItem()` and `unequipItem()` are async and silently fail.
- `resolveRace()` returning null is silently dropped with no toast.

**Root cause:**
The Developer wrote async operations without a standard error-handling pattern. Silent swallows and missing catch blocks were not caught by self-review (which was skipped) or by the Tester (who was not run). The codebase has no enforced convention for error feedback.

**Which phase would have caught it:**
- Phase C (Developer): every async operation must have a catch block that shows a user-facing toast; silent swallows are explicitly prohibited by process rule
- Phase D (Tester): test failure paths — provoke errors on all async operations and verify user-facing feedback appears

---

### 2.7 Child UX Failures

**What was found:**
- `BottomNav` renders NavLink children as a render-prop function returning only an `Icon` element — the tab label strings (Home, Explore, etc.) are declared in the data array but never placed in JSX. A child who cannot identify icons has no tab labels.
- `PetCard` in MyAnimals grid renders no care state indicator. A child with multiple pets cannot see which animals need attention without opening each detail sheet.
- `ReleaseConfirm.tsx` reads: "This cannot be undone. {petName} will leave your collection permanently." — clinically harsh for a child aged 6–12 who has bonded with a named pet.
- No naming modal after marketplace purchase. The pet is silently created as `"{breed} {animalType}"` (e.g. "Orca Whale") with no player input.
- `DailyBonusCard` auto-dismisses after 2500ms with no tap-to-dismiss. For a child with ADHD who may be distracted at app open, the bonus message is already gone before they see it.
- Marketplace-purchased pets receive `category: 'At Home'` regardless of actual animal type. A child who buys a Shark then searches My Animals by "Sea" cannot find it.

**Root cause:**
These are child-experience defects that require knowledge of the target user (ages 6–12, ADHD, mixed reading ability). The User Researcher was not run. The UX Designer was not run. No interaction spec documented emotional milestones (naming a pet, release copy), ADHD timing requirements, or care-state visibility requirements. Without specs, the FE agent built functional but not child-appropriate UI.

**Which phase would have caught it:**
- Phase A (User Researcher): document child UX requirements — naming moments, emotional language, timing for auto-dismiss elements, care visibility needs
- Phase A (UX Designer): interaction spec must include emotional design notes and empty/loading/care states for every screen
- Phase D (Tester): test with the target user in mind — does a 7-year-old understand what each tab is? Does the release copy feel safe? Test every user-facing string

---

### 2.8 Business Logic Errors

**What was found:**
- `PRIZE_DISTRIBUTION = [0.5, 0.3, 0.15, 0.05]` in `useRacing.ts` (line 19). INTEGRATION_MAP specifies `[50%, 25%, 15%, 10%]`. 2nd place is over-paid (30% vs 25%) and 4th place is under-paid (5% vs 10%). Total still sums to 100% but individual payouts are wrong on every race.
- `createListing()` sets `expiresAt` to `now + 7 days` (line 197: `7 * 24 * 60 * 60 * 1000`). ENTITY_MODEL.md and spec require 24 hours.
- `NpcBuyerOffer.expiresAt` is set to 48 hours. Spec requires 30 minutes.
- `generateDailyRaces()` is gated on `existing >= 3` but has no date gate. Races regenerate indefinitely as long as fewer than 3 open races exist. There is no daily generation limit.

**Root cause:**
Business logic constants were coded without tracing them to the spec. The Developer did not re-read `INTEGRATION_MAP.md` or `ENTITY_MODEL.md` when setting prize arrays and expiry values. No Tester validated the numbers. The product owner's acceptance criteria (Phase B) did not call out the precise values as testable assertions.

**Which phase would have caught it:**
- Phase B (Product Owner): refined stories must include exact numeric values for all business rules (prize distribution, listing expiry, offer timers, generation gates)
- Phase C (Developer): verify constants against integration map and entity model before committing
- Phase D (Tester): verify prize distribution with manual calculation, verify listing expiry by checking the value in the database, verify race generation is date-gated

---

## 3. What the Team Process Should Have Caught — By Phase

| Phase | Role | Check | Defect categories it would have caught |
|-------|------|--------|----------------------------------------|
| Phase A | User Researcher | Validate accessibility assumptions (ADHD accommodations, speech support, child UX patterns, emotional design moments) for the 6–12 age target | Missing effort coin for wrong answers, missing speech readout, distressing release copy, DailyBonusCard too fast, TraderPuzzle unpredictability |
| Phase A | UX Designer | Interaction spec must include responsive breakpoints, DS surface level requirements, empty states for every screen, care state visibility, naming moments, and accessibility requirements section | Responsive layout gaps, Modal surface level wrong, missing empty states (Explore search, Marketplace loading), BottomNav label absence, missing naming modal |
| Phase B | Product Owner | Acceptance criteria must include cross-system events from INTEGRATION_MAP.md, exact numeric values for all business rules, and explicit integration chain assertions | earn() outside transaction, pet status cross-feature enforcement, item equip path, race prize percentages, listing expiry, daily race gate |
| Phase C | Developer | Self-review: after every hook, verify every integration event in INTEGRATION_MAP.md that the hook participates in; check transaction boundaries; check every async operation has a catch with user toast | Badge stub, care milestone bonuses, gamesPlayed never incremented, ArcadeShell silent swallow, earn() outside transaction, pet status gaps |
| Phase C | Frontend Engineer | Self-review at 375/768/1024px after every screen; run 6-point DS checklist (no emojis, button variants, colour tokens, surface stack, responsive, bottom padding) after every component | Ghost buttons, native select, emoji icons, Modal surface, responsive layout, BottomNav label gap, hardcoded rarity colours |
| Phase D | Tester | Test every AC from refined-stories.md; run visual audit (6-point DS checklist); scroll every screen to bottom; test every failure path; test integration chains end-to-end; test with child-user perspective | All of the above — Tester is the final gate before any feature is marked complete |

---

## 4. Process Rule Additions Recommended for CLAUDE.md

The following rules must be added to `CLAUDE.md` to prevent recurrence. These are not suggestions — they are process requirements with the same force as the existing HARD GATES.

---

### Integration map compliance (add to Developer self-review)

> Before marking any hook complete, verify every event in `INTEGRATION_MAP.md` that the hook participates in. For each event, check every listed consequence is implemented, transaction boundaries are correct (earn/spend must be inside the same transaction as the record they relate to), and downstream status side-effects are applied. Do not ship a hook with unverified consequences.

---

### Badge and reward system (add to Developer self-review)

> Any hook that triggers a badge-eligible event (care, rescue, racing, arcade, marketplace) must call `checkBadgeEligibility()` after the event fires. Do not stub this. A stub that returns an empty array unconditionally is a build defect, not an acceptable initial state.

---

### Error handling (add to Developer self-review)

> Every async operation must have a catch block that calls `toast({ type: 'error', ... })` with a user-facing message. Silent swallows (`catch { }` or `catch { /* ignore */ }`) are prohibited. If a database operation fails, the user must be told. No exceptions for "low priority" operations.

---

### Pet status enforcement (add to Developer self-review)

> Any hook or screen that displays or acts on pets must check `pet.status`. A pet with `status: 'for_sale'` must not accept care actions, must not be releasable without first cancelling the active listing, must not appear in equip or action flows that assume ownership. Undocumented or unhandled status values are a build defect.

---

### Responsive layout (add to Frontend Engineer self-review)

> Every screen component must be checked at 375px, 768px, and 1024px before Phase C is marked complete. Any single-column card list rendering on a screen wider than 768px is a layout failure. Every screen must have `max-w-3xl mx-auto w-full` on its content column. Every scrollable screen must have `pb-24` minimum. These are not optional enhancements — they are baseline requirements.

---

### DS compliance (add to Frontend Engineer self-review and Tester Phase D)

> The 6-point DS checklist must be run after every component before moving on: (1) no emojis as icons — Lucide only; (2) no ghost variant for visible actions; (3) all colours trace to `var(--...)` tokens; (4) surface stack is correct (component steps up one level from container); (5) layout verified at 375/768/1024px; (6) scrollable content has `pb-24`. Ghost variant is never acceptable for a visible action. These six checks must appear in every `test-results.md` sign-off.

---

## 5. Post-Fix Owner Feedback — UX and Design System Oversights

After the fix pass, the Owner identified a further category of defects: things they had to suggest themselves that should have been caught or defined by the UX Designer or the Design System. Every item below represents the Owner doing UX thinking that the team should have done.

**This feedback is entered into the record so the team process prevents it going forward.**

---

### 5.1 Hover states not defined globally

**Owner suggestion:** "Can you make sure all items have that hover effect on home, explore, animals, play, market etc — it should be consistent, not just shop."

**What went wrong:** The hover lift pattern (`-translate-y-0.5`, shadow, border colour change, `active:scale-[.97]`) was implemented on the Shop ItemCard but never specified as a global interactive card pattern. Every screen was built independently, with inconsistent or missing hover states. The Design System documents card hover as an NFT DS pattern ("Cards lift and gain shadow on hover") but no UX Designer produced an interaction spec that explicitly required this on every card component across every screen.

**What the team should have done:**
- The Design System must define the hover pattern as a required behaviour for every interactive card, not just a component-level suggestion.
- The UX Designer's interaction spec for every screen must include a section on interaction states (hover, active, focus) for every interactive element.
- The FE self-review checklist must include: "every clickable card has the approved hover pattern."
- The Tester must verify hover states as part of Phase D on every screen.

---

### 5.2 Glass effect not defined for overlay elements

**Owner suggestion:** "Should the modals have the same glass panel style as the footer?" and "Any item on top of content should be glass."

**What went wrong:** The NFT Dark DS specifies backdrop-blur and semi-transparent glass surfaces as a component pattern. The BottomNav was built with the glass treatment. Modals and BottomSheets were not. No interaction spec or DS section explicitly stated the rule: *every surface that floats above page content uses the glass treatment*. This left the modals with a flat opaque card surface that was visually inconsistent with the nav, and the Owner had to identify the inconsistency themselves.

**What the team should have done:**
- The Design System must explicitly state the glass rule: any element with `position: fixed` or `position: absolute` that overlays page content (BottomSheet, Modal, Toast, BottomNav) uses `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)`.
- The UX Designer must specify overlay surface treatment in every interaction spec that introduces a sheet or modal.
- The Tester must check that overlays are glass when the DS rule is in effect.

---

### 5.3 Footer gradient not defined; edge softening not specified

**Owner suggestion:** "The footer currently looks quite sharp/harsh. Can you make the modals match the footer?"

**What went wrong:** The BottomNav was built with a hard `border-t border-[var(--border-s)]` — a visible cut across the screen. The NFT DS documents a gradient fade above the nav (`linear-gradient(to top, #0D0D11, transparent)`) but this was not implemented. Similarly, modal/sheet borders were full-opacity DS tokens, creating harsh edges on glass surfaces. No spec or DS rule said "hard borders are not appropriate on glass overlays — use near-invisible hairline borders."

**What the team should have done:**
- The Design System must specify: (1) the gradient fade above the BottomNav (`height: 48px, to top, transparent`); (2) glass surfaces use hairline borders (`rgba(255,255,255,.04–.06)`), not full `--border-s` borders.
- The FE must implement the gradient fade when building the BottomNav — it is in the DS spec.
- The Tester must verify the nav area at the bottom of every screen — is the transition from content to nav smooth or harsh?

---

### 5.4 Shop item cards underwhelming — icon size and category colour not applied

**Owner suggestion:** "Items in the shop look pretty underwhelming with little icons per item — doesn't really show the user what they're buying."

**What went wrong:** The ItemCard was built with `size={20}` Lucide icons in a flat `bg-[var(--elev)]` well, with a single `text-[var(--blue-t)]` colour applied to every category. The DS tint pair system was available and clearly documents per-category colour pairs. No UX interaction spec for the Shop described the card anatomy, icon prominence requirements, or per-category visual differentiation. The FE agent made implementation choices (20px, flat grey) that produced a card with no visual identity.

**What the team should have done:**
- The UX Designer's interaction spec must define card anatomy for every content type — icon size, colour pair, information hierarchy (name, effect line, price), and owned state treatment.
- The DS anti-patterns list must state: "never apply a single accent colour universally to category icons — use the tint pair for each category."
- The Tester must ask: "could a child identify what each item is and decide whether to buy it, from the card alone?" If no, the card fails the child UX test.

---

### 5.5 Hover clip bug — overflow container not accounting for translateY

**Owner report:** "When I hover over items they move slightly and the top border gets cut off."

**What went wrong:** The hover lift (`-translate-y-0.5` = 2px) was clipped by the `overflow-y-auto` scroll container. Cards need `pt-1` on the parent grid to give them room to lift. This is a known CSS interaction between `overflow: auto` and `transform: translateY`. It was not caught by the FE self-review (which was skipped) or by the Tester (not run).

**What the team should have done:**
- The FE self-review checklist must include: "check every hoverable card in every grid — does the hover lift clip?" This requires physically hovering over items in the preview during review.
- The Tester must hover over every interactive card in Phase D and verify no clipping occurs.

---

## 6. New Rules for CLAUDE.md — UX and Design System Additions

The following rules must be added to `CLAUDE.md` immediately. They codify the Owner's feedback so the team catches these categories before they reach the Owner.

### UX Designer — mandatory interaction spec requirements

> Every UX interaction spec must include:
> 1. **Interaction states section:** for every interactive element (card, button, input), specify hover, active, focus, and disabled states explicitly. "Hover: lift pattern per DS" is sufficient if the DS defines it — but the spec must reference it. The FE must not choose hover behaviour independently.
> 2. **Overlay surface treatment:** any spec that introduces a BottomSheet, Modal, Toast, or other overlay must explicitly state: surface uses glass treatment (`--glass-bg` + `backdrop-filter: blur(24px)`) per DS. This is not optional and not left to FE discretion.
> 3. **Card anatomy section:** any spec that introduces a card component must define icon size, colour pair, information hierarchy, empty state, and owned/active state treatment. A card without a defined anatomy in the spec is an incomplete spec — do not proceed to Phase C.

### Frontend Engineer — hover and clip self-review

> After building any card grid: (1) hover over every card in the preview and verify the lift does not clip — if it clips, add `pt-1` to the parent grid; (2) verify the hover pattern matches the DS approved pattern exactly (`motion-safe:hover:-translate-y-0.5`, `hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]`, `hover:border-[var(--border)]`, `motion-safe:active:scale-[.97]`, `transition-all duration-300`); (3) if a screen has multiple card types, all must use the same hover pattern.

### Design System — glass rule and gradient rule

> Two rules are now canonicalised in the DS and must be treated as non-negotiable:
> 1. **Glass rule:** any element with `position: fixed` or `position: absolute` that sits above page content (BottomNav, BottomSheet, Modal, Toast) uses `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` + hairline border `rgba(255,255,255,.04–.06)`. Hard opaque surfaces (`var(--card)`, `var(--elev)`) are not used on floating elements.
> 2. **Gradient fade rule:** the BottomNav always has a gradient fade above it (`height: 48px, linear-gradient to top, rgba(13,13,17,.85), transparent`). Any screen where content scrolls behind the nav must have this fade to prevent a hard edge. Screens that do not have the fade are incomplete builds.

---

## 7. Post-Launch Owner Feedback — Racing and Glass Issues (2026-03-27 continuation)

Three further issues surfaced during the first interactive session with built features. All three were caught by the Owner during normal use.

---

### 7.1 Hook state machine mismatch — racing "Your Races" never appeared

**Owner report:** "I just entered a race and the race disappeared from available races but didn't show the race I entered."

**What went wrong:** `useRacing` exposed `openRaces` filtered to `status === 'open'` only. `enterRace()` immediately sets the race to `status === 'running'`. This means the moment a player enters a race, it exits `openRaces` entirely — it becomes invisible. The screen-level "Your Races" section filtered `openRaces` for `status === 'running'` which was a logically impossible condition: the set it was filtering can never contain a `running` race. The section was always empty. This was never caught because no test was run that traced the full state transition: enter race → verify UI shows entered race.

**Root cause:** The Developer did not trace the hook's full status state machine (open → running → finished) against the derived collections it exposes. `openRaces` was named as if it meant "active" but implemented as if it meant "not yet entered". The discrepancy caused the entire entered-race flow to silently break.

**Fix applied:** `openRaces` redefined to `status === 'open' || status === 'running'`. Screen-level `yourRaces` filter now correctly captures all player-entered races regardless of sub-status.

**What the team should have done:**
- The Developer must enumerate every status value in a hook's state machine and verify each derived collection includes or excludes the correct statuses. A collection named `openRaces` that silently excludes an active game state is a build defect.
- The Tester must trace the full state machine for every flow: enter race → race appears in "Your Races"; resolve race → race appears in "Recent Results". This is an integration test, not a visual check.

---

### 7.2 Toast message referenced a UI element that did not exist

**Owner report:** "When I enter a race it says 'tap Race' — but tap where?"

**What went wrong:** After entering a race, a toast appeared saying "You're in! Tap Race to see what happens." The "Race!" button is only visible inside the RunningRaceCard component. But due to the bug in 7.1, that card was never shown. The toast pointed to a button that was invisible. Even if the bug had not existed, the toast said "Tap Race" without telling the user where Race is — it would still be confusing.

**Root cause:** The FE wrote a toast message that assumed a UI state (Race! button visible in "Your Races" section) without verifying that the state was actually reachable and visible after the action. Toast messages must describe where to find the next action.

**Fix applied:** Toast updated to "You're in! Tap the Race! button above to run." Also fixed the underlying visibility bug so the button actually appears.

**What the team should have done:**
- After writing any toast that references a UI element ("tap X", "find X"), the FE must verify: is X visible on screen immediately after this action fires? If not, the toast is misleading.
- The Tester must verify every toast message in Phase D against actual post-action screen state.

---

### 7.3 Modal glass appears more opaque than the footer

**Owner report:** "I don't think the modal glass effect is as transparent as the footer."

**What went wrong:** Both Modal and BottomSheet were set to `rgba(13,13,17,.88)` matching the BottomNav. However, the Modal also renders a `bg-black/30` backdrop behind it. The backdrop darkens the content the blur samples — the modal blur works with darker source material and therefore produces a less luminous, more opaque-looking result. The Footer has no backdrop and blurs directly over content. Same alpha, different visual result due to stacking context.

**Fix applied (per UX recommendation):** Backdrop changed to `bg-black/10`, modal surface lightened to `rgba(13,13,17,.80)`. Together these produce glass that reads as the same material as the Footer.

**What the team should have done:**
- The DS glass rule must specify: modal and BottomSheet surface opacity accounts for backdrop stacking. The canonical value for a surface that sits above a `bg-black/10` backdrop is `.80`, not `.88`.
- The FE must visually compare any new overlay against the BottomNav glass during self-review. They are made of the same material and must look like it.
- Update: the DS glass rule documentation is updated in section 8 below.

---

## 8. Updated DS Glass Rule

The glass rule in CLAUDE.md is amended:

> **Glass rule (non-negotiable):** Any element with `position: fixed` or `position: absolute` that sits above page content uses:
> - **BottomNav** (no backdrop): `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.04–.06)`
> - **Modal / BottomSheet** (with `bg-black/10` backdrop): surface `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.06)`
> - **Backdrop div**: `bg-black/10` — never `bg-black/30` or higher. Higher opacity darkens the blur source and makes the glass surface read as opaque.
> - Hard opaque surfaces (`var(--card)`, `var(--elev)`) are NEVER used on floating/overlay elements.
> - FE must visually compare new overlays against the BottomNav during self-review — they must read as the same material.

---

## 10. Post-Feature Build Failures — CardsScreen (2026-03-27 continuation)

Three further defects found during owner review of the newly built pack confirmation and tab features.

### 10.1 Double drag handle in BottomSheet content

**Owner report:** "Card modal has two pull bars at the top."

**What went wrong:** The FE agent added a custom drag handle inside `PackConfirmSheet` without reading `BottomSheet` in `Modal.tsx` first. `BottomSheet` already renders a drag handle unconditionally. Any content rendered inside `BottomSheet` must not add a second handle. This is a read-before-write failure.

**Fix:** Removed the drag handle from `PackConfirmSheet`. `BottomSheet` handles it.

**What the team should have done:** Before adding content inside any shared layout component (`BottomSheet`, `Modal`, `PageHeader`), read the component source first to understand what it already renders. Never add structural chrome (handles, headers, close buttons) without verifying the host component doesn't already provide it.

---

### 10.2 Pill tab gap — conflicting padding classes

**Owner report:** "There's a gap to the left and right of the pills."

**What went wrong:** The inline tab container had both `px-6` (24px horizontal padding) and `p-1` (4px all-round padding) applied to the same element. `px-6` is a content-area pattern (page horizontal margin) — it was copied into a tab control container where it does not belong. The tab buttons inside then had `flex-1` but couldn't fill the container because 48px of inner padding was already consumed. Additionally the shared `PillToggle` component used `inline-flex` (shrink-wraps to content) instead of `flex`, so passing `w-full` had no effect.

**Fix:** Removed `px-6` from the tab container, switched to shared `PillToggle`, changed `inline-flex` to `flex`, added `flex-1 justify-center` to tab buttons.

**What the team should have done:** Never apply `px-6` to a component container that also has `p-1`. Use `px-6` only on page-level content wrappers. Test tab controls at full width before shipping.

---

### 10.3 Single-column pack layout on iPad

**Owner report:** Cards page doesn't account for resolution.

**What went wrong:** The packs tab used `flex flex-col gap-4` — a single stacked column on all screen sizes. On iPad (1024px), three pack cards stack vertically in a single column wasting half the screen width. The responsive layout checklist (grid at md/lg breakpoints, `max-w-3xl mx-auto`) was not applied.

**Fix:** Changed to `grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full`.

**What the team should have done:** The responsive layout rule is explicit: any content list must use `grid grid-cols-1 md:grid-cols-2` minimum. The FE must resize the preview to 768px and 1024px before marking Phase C complete. Single-column layouts on iPad are a hard failure.

---

## 11. Acknowledgement

These defects reached the Owner because the team process was not run for any Tier 0, 1, or 2 feature. No User Researcher validated child UX and accessibility assumptions. No UX Designer produced interaction specs. No Product Owner wrote acceptance criteria against the integration map. No Tester signed off a test-results.md. No Definition of Done checklist was executed. The Owner became the de facto tester, which is explicitly prohibited by the process rules. The audit and fix pass documented here corrects the technical and quality record for Tier 0–2. Going forward, no feature is marked `complete` without a Tester sign-off against a `tests/{feature}/test-results.md` file that includes the 6-point DS checklist, integration chain tests, and explicit sign-off on every acceptance criterion from `product/{feature}/refined-stories.md`. That is the contract. It does not change under "continue" pressure or any other instruction.
