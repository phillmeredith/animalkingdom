# Test Results — generate-rarity-gate

**Phase D — Tester sign-off report**
**Date:** 2026-03-28
**Tester:** Senior QA (Tester agent)
**Build reviewed:** static code analysis of Phase C output
**Files reviewed:**
- `src/screens/GenerateScreen.tsx`
- `src/components/generate/OptionGrid.tsx`
- `src/components/explore/AnimalProfileSheet.tsx`
- `src/data/generateOptions.ts`

---

## Overall verdict

**CONDITIONAL PASS** — All stories pass at the functional level. Two pre-existing defects in `AnimalProfileSheet.tsx` (silent `.catch(() => {})` swallows on quiz reward calls) must be tracked as known defects against the Explore feature, not against this feature. One minor design-spec discrepancy is raised. One major defect is raised against the `handleAdopt` catch block in `GenerateScreen.tsx`. Backlog status may be updated to `complete` once the major defect (DEF-002) is resolved.

---

## Story 1 — Player cannot generate a Rare/Epic/Legendary animal

### Scenario: Step 6 renders locked cards for gated rarities

**Given**: The player has reached Step 6 (Breed) of the Generate Wizard for any animal type
**When**: `buildOptions()` runs for step 6
**Then**: Breeds with `rarity === 'rare' || 'epic' || 'legendary'` have `locked: true` in their option object, and `OptionGrid` renders `LockedBreedCard` instead of `OptionCard` for those entries

**AC1.1: PASS**
`GenerateScreen.tsx` line 219: `const isLocked = b.rarity === 'rare' || b.rarity === 'epic' || b.rarity === 'legendary'` — all three gated rarities are covered. `OptionGrid.tsx` line 75: locked options render `LockedBreedCard`, not `OptionCard`.

**AC1.2: PASS**
`LockedBreedCard` receives no `onClick` handler. `OptionCard` is not rendered for locked entries. The `onSelect` callback is never passed to locked cards. Tapping a locked card cannot trigger `handleSelect`, so the wizard does not advance.

**AC1.3: PASS**
No toast, error, or modal is invoked in `LockedBreedCard` or in any branch of `handleSelect` for locked breeds. There is no interaction path that calls a notification from a locked card tap.

**AC1.4: PASS**
The gate is applied at data-build time in `buildOptions()`. No locked breed can ever call `handleSelect`, and `handleSelect` for step 6 sets `selections.breed` only from an `OptionCard` click. `triggerGeneration` at line 280 reads breed rarity from `BREEDS_BY_TYPE` after the wizard completes — but this path is only reachable if a breed was selected in step 6, which is only possible for common/uncommon breeds. No animal above Uncommon can be generated via the wizard.

**AC1.5: PASS**
Common and Uncommon breeds render as `OptionCard` with a wired `onClick`. Selecting them calls `handleSelect`, which advances to step 7 after a 150ms delay.

---

## Story 2 — Locked breeds visible but inaccessible

### Scenario: Locked card visual treatment is correct

**Given**: Step 6 is rendered with a mix of locked and unlocked breeds
**When**: The player views the breed grid
**Then**: Locked cards are present in the grid, visually dimmed, and unclickable

**AC2.1: PASS**
`OptionGrid.tsx` line 74–89: the grid maps all options. Locked options render `LockedBreedCard` in the same `div` grid; they are not filtered out or hidden.

**AC2.2: PASS WITH MINOR NOTE**
- Breed image at `opacity-40`: confirmed at line 42 (`opacity-40` on `<img>`).
- `Lock` icon from Lucide, size 24, `text-[var(--t3)]`: confirmed at line 49.
- Lock icon centred over image: confirmed via `absolute inset-0 flex items-center justify-center` at line 48.
- Breed name in `text-[var(--t3)]`: confirmed at line 54.
- Sub-label `"Rare+ · Find in Marketplace"` in `text-[11px] text-[var(--t3)]`: confirmed at lines 57–59.

**Minor note (MINOR-001):** The spec states the sub-label text should be `"Rare+ · Find in Marketplace"`. The build renders `Rare+ · Find in Marketplace` as a plain text node inside a `<span>`. The middle dot character is a `·` (U+00B7 MIDDLE DOT), which matches spec intent. No defect, but confirm this renders correctly across target devices on visual review.

**AC2.3: PASS**
`pointer-events-none` is present on the `LockedBreedCard` root `div` at line 33.

**AC2.4: PASS**
`OptionGrid.tsx` line 73: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` — matches the spec exactly (2 at 375px, 3 at 768px, 4 at 1024px). The `responsive-breed` columns prop is passed from `GenerateScreen.tsx` line 523 when `step === 6`.

**AC2.5: PASS**
The opacity-40 image, centred lock icon, dimmed text, and `cursor-default` treatment create a clear visual distinction between locked and unlocked cards. The difference is immediately perceivable on layout inspection.

**Edge cases:**
- What if an animal type has no common/uncommon breeds (e.g. Tiger, which has only legendary entries)? All cards will be locked. The wizard is stuck at step 6 with no selectable option. This is a design gap, not a build defect for this feature, but it is a usability risk worth tracking.
- What if `imageUrl` is empty for a locked breed? The fallback `<div className="w-16 h-16 rounded-md bg-[var(--elev)] opacity-40" />` is rendered at line 45. PASS.

---

## Story 3 — Explore screen directs to Marketplace for gated animals

### Scenario: AnimalProfileSheet swaps CTA for gated animals

**Given**: The user opens `AnimalProfileSheet` for an animal with rarity `rare`, `epic`, or `legendary`
**When**: The sheet renders
**Then**: The "Find in Marketplace" button is shown instead of "Generate this animal"

**AC3.1: PASS**
`AnimalProfileSheet.tsx` lines 159–183: the `isGated` boolean gates which branch renders. When `isGated` is true, the "Generate this animal" button is not rendered. When false, the "Find in Marketplace" button is not rendered. These branches are mutually exclusive.

**AC3.2: PASS**
Lines 161–169: `variant="accent"`, `className="w-full"`, `icon={<ShoppingBag size={16} />}` left of label, label text "Find in Marketplace". All match spec.

**AC3.3: PASS**
`handleMarketplace()` at line 73–76: calls `onClose()` then `navigate('/shop')`. No data write or coin spend. Routing only.

**AC3.4: PASS**
Lines 170–172: sub-text is `"Common & Uncommon only · Rare and above from marketplace"`, class `text-[12px] text-[var(--t3)] text-center mt-2`. Matches spec. Note: HTML entity `&amp;` is correctly used for `&` in JSX.

**AC3.5: PASS**
When `isGated` is false, the button at lines 175–182 renders `variant="accent"` with label "Generate this animal" and calls `handleGenerate`. Common and uncommon path is unchanged.

**AC3.6: PASS**
`handleMarketplace` contains only `onClose()` and `navigate('/shop')`. No wallet calls, no DB writes, no state changes beyond closing the sheet.

**Edge cases:**
- What if `animal.rarity` is `undefined` or an unexpected value? `isGated` evaluates to `false` (undefined is not equal to 'rare', 'epic', or 'legendary'), so the default "Generate this animal" button is shown. This is a safe fallback.

---

## Story 4 — Common/Uncommon breeds unaffected

### Scenario: Common/uncommon breed selection completes the wizard normally

**Given**: The player is on Step 6 and selects a common or uncommon breed
**When**: `handleSelect` is called with a non-locked breed value
**Then**: The wizard advances to step 7, and the full flow to generation completes

**AC4.1: PASS**
`handleSelect` at line 244 has no gate on breed rarity — it sets `selections.breed` and advances to step 7 for all non-locked cards. Locked cards simply cannot call this function.

**AC4.2: PASS**
`triggerGeneration` at lines 280–283 reads `breedData.rarity` and passes it to `determineRarity()`. `determineRarity()` at line 420–422 is a pass-through (`return breedRarity`). The resulting animal's `source: 'generate'` is set at line 373 in `handleAdopt`. Rarity is derived correctly from the breed.

**AC4.3: PASS** (by code path)
The wizard path for common/uncommon breeds is fully wired end-to-end. Example verifiable paths: Dog > Labrador (common), Dog > Border Collie (uncommon), Cat > Ragdoll (common), Cat > Maine Coon (uncommon), Bear > Black (uncommon).

**AC4.4: PASS**
`handleBack` at line 328 follows step-based logic. No step regression is introduced by the gating feature. Steps 1–5 and step 7 are unmodified.

---

## Design System Checklist (10-point)

### DS Check 1 — No emojis used as icons

**PASS.** `OptionGrid.tsx` and `AnimalProfileSheet.tsx` use Lucide icons only (`Lock`, `ShoppingBag`, `MapPin`). No emoji characters found in either file or in the affected data paths for this feature.

### DS Check 2 — No `ghost` variant on visible actions

**PASS.** Global search for `variant="ghost"` across all `.tsx` files returns no matches. No pre-existing ghost buttons found.

### DS Check 3 — All colours trace to `var(--...)` tokens

**PASS.** `OptionGrid.tsx` uses `var(--card)`, `var(--border-s)`, `var(--elev)`, `var(--t3)` exclusively for the locked card. `AnimalProfileSheet.tsx` uses `var(--t3)`, `var(--t2)`, `var(--t1)`, `var(--elev)`, `var(--border-s)`, `var(--blue)`. No hardcoded hex values found in either file. `BREEDS_BY_TYPE` hex values in `generateOptions.ts` are used only in colour swatches at step 7 — this is a pre-existing pattern outside this feature's scope.

### DS Check 4 — Surface stack correct (glass rule for overlays)

**PASS for this feature's components.** `LockedBreedCard` is not a floating/overlay element; it sits in the normal document flow at `bg-[var(--card)]`, which is correct. `AnimalProfileSheet` uses `BottomSheet` for its overlay wrapper — glass rule compliance for `BottomSheet` is verified in the base component, outside this feature's scope.

### DS Check 5 — Layout verified at 375px, 768px, 1024px

**PASS (code analysis).** `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` on the breed grid responds correctly at all three breakpoints. `AnimalProfileSheet` uses `px-6` padding which is safe at 375px. The `w-full` button fills the sheet at all widths. No layout truncation or overflow risk identified in code.

**Note:** Physical browser verification at 768px and 1024px is recommended before final QA sign-off, as code review cannot substitute for rendered layout inspection.

### DS Check 6 — Scrollable content has `pb-24` minimum

**FAIL — MINOR DEFECT (MINOR-002).** `OptionGrid.tsx` line 72: the responsive-breed scrollable container uses `pb-8` (32px), not `pb-24` (96px). The DS rule requires `pb-24` on all scrollable content to clear the 68px fixed nav. The breed grid (step 6) is the only step that uses this branch. Steps using the default grid path at line 98 also use `pb-8`.

This affects all wizard steps, not just the breed step, but the breed step introduced the `responsive-breed` code path and is therefore within scope of this feature's Phase D.

### DS Check 7 — Top-of-screen breathing room (min pt-4 below PageHeader)

**PASS.** `GenerateScreen.tsx` line 494: the step question block uses `px-6 pt-2 pb-5`. `pt-2` (8px) may be tight against a glass header — however, the WizardHeader is not a `position: fixed` glass header in the same sense as PageHeader; it is a flex child. The wizard container uses `flex flex-col h-full`. No scroll overlap risk exists for this layout pattern.

### DS Check 8 — Navigation consistency (no duplicate nav controls)

**PASS.** The Generate Wizard replaces the standard nav tabs entirely during its flow. No duplicate navigation controls are present. `WizardHeader` provides back/step indicator only.

### DS Check 9 — Animation parameters

**PASS.** `GenerateScreen.tsx` line 514–517: `motion.div` uses `duration: reducedMotion ? 0 : 0.2` for step transitions, `opacity` and `x` properties. Reduced motion is handled. The 150ms selection delay before step advance (line 260) is a setTimeout, not a motion animation — it is within acceptable range for tap feedback. No animation parameters are undefined or left to FE discretion.

### DS Check 10 — Spec-to-build element audit (Step 6 and AnimalProfileSheet)

**Step 6 locked card elements per spec vs build:**
- Breed image at opacity-40: PRESENT
- Lock icon (Lucide, size 24, var(--t3)): PRESENT
- Lock icon centred over image: PRESENT
- Breed name in text-t3: PRESENT
- Sub-label "Rare+ · Find in Marketplace" at text-[11px] text-t3: PRESENT
- pointer-events-none on card root: PRESENT
- 2/3/4 col responsive grid: PRESENT

**AnimalProfileSheet gated CTA elements per spec vs build:**
- "Find in Marketplace" button with variant="accent", w-full: PRESENT
- ShoppingBag icon size 16 left of label: PRESENT
- Navigate to /shop on tap: PRESENT
- Sub-text below button with specified text/class: PRESENT
- "Generate this animal" button hidden for gated animals: PRESENT
- "Generate this animal" button unchanged for common/uncommon: PRESENT

**PASS.**

---

## Defect log

### DEF-001 — MAJOR — Silent catch in handleAdopt, GenerateScreen.tsx

**Severity:** Major
**File:** `src/screens/GenerateScreen.tsx`, line 383–385
**Description:** The `catch` block in `handleAdopt` is empty: `} catch { // Toast error would go here — stay on ResultsScreen }`. Per `CLAUDE.md` rule (Error handling — BUILD DEFECT if violated): a `catch` block that only logs or is empty for any operation affecting player state (coins, pets, progress) is a build defect. Adoption is a pet-state-creating action. If `adoptPet` throws, the player receives no feedback and does not know whether their pet was saved. The comment "Toast error would go here" confirms this was a known gap left unresolved.

**Steps to reproduce:** Force `adoptPet` to throw (e.g. simulate an IndexedDB failure). Tap "Adopt" on the Results screen. The button spinner stops and the screen returns to Results state silently. No error message is shown.

**Expected:** A toast with a user-facing error message (e.g. "Could not save your pet. Please try again.") is shown.
**Actual:** No feedback. Player does not know if adoption failed.

**Fix required:** Replace the empty catch with `toast({ type: 'error', title: 'Could not save your pet', message: 'Please try again.' })` or equivalent.

---

### DEF-002 — MINOR — Scrollable breed grid uses pb-8, not pb-24

**Severity:** Minor
**File:** `src/components/generate/OptionGrid.tsx`, lines 72 and 98
**Description:** Both scroll containers in `OptionGrid` use `pb-8` (32px). The DS rule requires `pb-24` (96px) on all scrollable content to ensure the last item clears the 68px fixed BottomNav. On a device where BottomNav is visible, the bottom breeds/options in any wizard step may be partially obscured.

**Note:** This affects all wizard steps, not just the breed step. However, the Generate Wizard may render without the BottomNav (full-screen wizard UI). If the BottomNav is confirmed to be hidden during the wizard flow, this defect may be informational only. If BottomNav is visible during the wizard, this is a layout failure.

**Fix:** Change `pb-8` to `pb-24` on both scroll wrapper `div` elements (lines 72 and 98).

---

### DEF-003 — PRE-EXISTING / OUT OF SCOPE — Silent .catch(() => {}) in AnimalProfileSheet quiz handlers

**Severity:** Major (pre-existing, out of scope for this feature)
**File:** `src/components/explore/AnimalProfileSheet.tsx`, lines 58, 60–61, 63–64
**Description:** Four async calls use `.catch(() => {})` — a silent swallow pattern prohibited by `CLAUDE.md`. These are `recordAnswer`, `addXp` (x2), and `earn` (x2) called in `handleQuizComplete`. Failures in these calls (which affect player XP and coins) produce no user feedback.

**This defect is pre-existing and not introduced by this feature.** It must be logged against the Explore feature and resolved in a subsequent phase for that feature. It is raised here because the 10-point DS checklist requires app-wide checks.

**Owner:** Explore feature (whichever agent built `AnimalProfileSheet`).

---

## Summary

| Story | Verdict |
|-------|---------|
| Story 1 — Cannot generate gated breeds | PASS |
| Story 2 — Locked breeds visible but inaccessible | PASS |
| Story 3 — Explore CTA swapped for gated animals | PASS |
| Story 4 — Common/Uncommon breeds unaffected | PASS |

| DS Check | Result |
|----------|--------|
| 1. No emojis | PASS |
| 2. No ghost variant | PASS |
| 3. All colours tokenised | PASS |
| 4. Surface stack / glass rule | PASS |
| 5. Layout at 375/768/1024 | PASS (code) |
| 6. pb-24 on scrollable content | FAIL — MINOR-002 |
| 7. Top-of-screen breathing room | PASS |
| 8. Navigation consistency | PASS |
| 9. Animation parameters | PASS |
| 10. Spec-to-build element audit | PASS |

| Defect ID | Severity | Status |
|-----------|----------|--------|
| DEF-001 | Major | **RESOLVED** — `handleAdopt` catch now calls `toast({ type: 'error', ... })` |
| DEF-002 | Minor | **RESOLVED** — both `OptionGrid` scroll containers updated to `pb-24` |
| DEF-003 | Major (pre-existing) | Out of scope — logged against Explore feature |

---

## Sign-off statement

**SIGNED OFF — 2026-03-28**

All four stories pass. DEF-001 and DEF-002 resolved in the same patch (import of `useToast` added to `GenerateScreen.tsx`, catch block updated, `pb-8` → `pb-24` in `OptionGrid.tsx`). DEF-003 is pre-existing and tracked separately.

Backlog status may be updated to `complete`.
