# Tier 1 Retrospective
**Date:** 2026-03-27
**Scope:** All Tier 1 features (Home, Explore, Generate Wizard, My Animals, Arcade ×4 + Hub, Settings)

---

## What was built

| Feature | Files created | Notes |
|---------|--------------|-------|
| Home screen | `HomeScreen.tsx`, `DailyBonusCard`, `HomeStatCards`, `FeaturedPetCard`, `QuickActions` | Daily bonus auto-claims on mount; coin streak tracking |
| Explore / Directory | `ExploreScreen.tsx`, `VirtualAnimalGrid`, `AnimalCard`, `AnimalProfileSheet`, `CategoryPills`, `AZRail` | Virtualised 4-col grid; A-Z scroll rail |
| Generate Wizard | `GenerateScreen.tsx`, `WizardHeader`, `OptionCard`, `OptionGrid`, `GeneratingOverlay`, `ResultsScreen`, `AdoptionOverlay`, `TraderPuzzle` | 7-step state machine; query param pre-fill; 50% post-adopt puzzle |
| My Animals | `MyAnimalsScreen.tsx`, `PetCard`, `PetDetailSheet`, `RenameInput`, `ReleaseConfirm`, `EmptyCollection` | Filter × 7 categories; sort by newest/name/rarity; rename + release flows |
| Arcade Hub | `PuzzleHubScreen.tsx` | 4 game cards with tier badge, XP bar, accuracy stat, summary stats row |
| Coin Rush | `CoinRushScreen.tsx` + `ArcadeShell` | Maths, amber theme |
| Word Safari | `WordSafariScreen.tsx` | Spelling, green theme |
| Habitat Builder | `HabitatBuilderScreen.tsx` | Science, blue theme |
| World Quest | `WorldQuestScreen.tsx` | Geography, purple theme |
| Settings | `SettingsScreen.tsx` | Reduce motion + TTS toggles; progress summary; destructive reset with confirm |
| Shared data | `arcadeQuestions.ts` (80 Qs), `useNameHistory.ts` | 20 Qs per skill area; rolling 100-entry history buffer |

---

## What went well

- **Shared arcade shell pattern** worked cleanly — all 4 games are ~20-line wrappers passing `area`, `theme`, and `questions` to `ArcadeShell`. Zero logic duplication.
- **Design system discipline held** — all colours, spacing, radii, and typography pulled from NFT DS tokens via CSS vars. No invented values.
- **Virtual grid refactor** — moving from hardcoded 2-col to `COLUMN_COUNT` constant driving both the virtualiser row count and CSS grid layout was the right abstraction. A-Z rail, row renderer, and scroll calculation all flow from one value.
- **Hook architecture** — leaf hooks (`useWallet`, `useProgress`, `useReducedMotion`, `useSpeech`) stayed clean and composable. No circular dependencies.

---

## Bugs caught and fixed

| Bug | Root cause | Fix |
|-----|-----------|-----|
| Explore grid rendering 2 columns instead of 4 | `COLUMN_COUNT = 2` hardcoded; row renderer used `leftIndex/rightIndex` pattern | Changed to 4; refactored to `Array.from({ length: COLUMN_COUNT }, ...)` |
| A-Z rail scrolling to wrong row | `Math.floor(index / 2)` hardcoded, stale after column count change | Changed to `Math.floor(index / COLUMN_COUNT)` |
| Explore left margin narrower than other pages | Grid used `px-4` (16px) vs page-standard `px-6` (24px) | Changed grid row wrapper to `px-6` |
| `CoinDisplay` crash on `useWallet()` | `PuzzleHubScreen` destructured `balance` but hook returns `coins` | Fixed to `const { coins } = useWallet()` |
| `useToast` API mismatch | Called `addToast({ message })` but API is `toast({ title })` | Fixed import and call signature |
| `CoinDisplay` `amount` prop name | Called with `coins={}` instead of `amount={}` | Fixed prop name |

---

## Patterns to carry forward

1. **Thin screen wrappers over shared shells** — proven with ArcadeShell. Apply same pattern to Racing and Cards if they share a game loop.
2. **`COLUMN_COUNT` constant** — any virtualised grid should drive both the virtualiser and CSS layout from one constant.
3. **`px-6` as page horizontal margin** — enforced. No inner components should introduce their own horizontal margin without explicitly matching this.
4. **Dexie transaction pattern** — `db.transaction('rw', tables..., async () => {...})` for any multi-table write. No optimistic ops outside transactions.
5. **Silent error swallowing** — non-critical async ops (recordAnswer, addToHistory) use `.catch(() => {})`. Never let game loop crash on analytics failure.
6. **`coins` not `balance`** — `useWallet()` returns `coins`. Double-check hook return shapes before using in new screens.

---

## Tier 2 readiness

All Tier 1 dependencies are met. Tier 2 can begin.

| Feature | Dependencies met? |
|---------|------------------|
| Item Shop (Supplies) | Wallet ✓ |
| Care System | My Animals ✓ |
| Cards System | My Animals ✓ |
| Marketplace (NPC Offers) | Wallet ✓, My Animals ✓ |
| Racing | Wallet ✓, My Animals ✓, Item Shop (build first) |
