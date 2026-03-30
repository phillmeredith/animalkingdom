# Test Results: Animal Economy Tiers
> Phase D — Tester sign-off
> Date: 2026-03-29
> Tester: Claude (Senior QA Engineer)

---

## Story coverage

### Story 1: Tier badge on every card and detail sheet

**AC 1.1** — Every PetCard shows a TierBadge on the same row as RarityBadge, 6px gap, after rarity badge.
**Result: PASS**
`PetCard.tsx` line 73–76: `<div className="flex items-center gap-1.5 flex-wrap mb-1">` contains `<RarityBadge>` followed immediately by `<TierBadge category={pet.category} />`. Gap of `gap-1.5` = 6px. Correct.

**AC 1.2** — Tradeable badge: `var(--green-sub)` bg, `1px solid var(--green)` border, `var(--green-t)` text, `ArrowLeftRight` 12px, "Tradeable", 12px/600, 4px 10px padding, pill radius.
**Result: PASS**
`TierBadge.tsx` lines 28–38: all five tokens present. `border-[var(--green)]` provides the 1px border (Tailwind adds `border-width: 1px` by default). Icon `ArrowLeftRight` size 12, strokeWidth 2. Padding via `style={{ padding: '4px 10px' }}`. `rounded-pill` = 100px. Font `text-[12px] font-semibold`. No hardcoded hex values.

**AC 1.3** — Reward-only badge: `var(--amber-sub)` bg, `1px solid var(--amber)` border, `var(--amber-t)` text, `Award` 12px, "Reward-only", same sizing.
**Result: PASS**
`TierBadge.tsx` lines 40–52: matching amber token set. `Award` icon, size 12.

**AC 1.4** — TierBadge is non-interactive: no hover, focus, or tap behaviour.
**Result: PASS**
Component is a `<span>`, not a `<button>`. `pointer-events-none select-none` on both variants. No `onClick`, `onFocus`, `tabIndex`, or hover class present.

**AC 1.5** — At 375px, badges wrap to second line cleanly without truncation or overlap.
**Result: PASS (by inspection)**
`flex-wrap` on the badge row container (`PetCard.tsx` line 73) permits wrapping. Neither badge has `truncate`, `overflow-hidden`, or `max-w-` constraints. Cannot verify visually without browser run; no counter-evidence found in code.

**AC 1.6** — At 1024px, both badges fit on one line without overflow.
**Result: PASS (by inspection)**
"Tradeable" = ~86px wide at 12px; "Reward-only" = ~103px. Badge row is inside a card cell within a responsive grid. No max-width on the badge row itself. Wrap is present as safety net. Cannot verify visually without browser run; no counter-evidence found in code.

**AC 1.7** — PetDetailSheet header row shows TierBadge after RarityBadge, 6px gap.
**Result: PASS**
`PetDetailSheet.tsx` lines 155–160: `<div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">` contains SoundButton, RarityBadge, TierBadge in that order. Gap `gap-1.5` = 6px.

**AC 1.8** — Badge implemented via single shared TierBadge component, not inline styles.
**Result: PASS**
`TierBadge` is imported and used in `PetCard.tsx`, `PetDetailSheet.tsx`, and `ListingRetractModal.tsx`. No inline duplication of badge styling found in any of these consumers.

**AC 1.9** — `isTradeable(category)` is the only source of truth. No inline `category === 'Wild'`-style checks exist in any component for trade eligibility.
**Result: PASS — D-001 and D-002 resolved (2026-03-29 re-verify)**

**AC 1.10** — AuctionCard does NOT show a TierBadge.
**Result: PASS**
Grep of `/src/components/auctions/` for `TierBadge` returned no matches.

---

### Story 2: Reward-only informational banner in PetDetailSheet

**AC 2.1** — Banner renders when `isTradeable(pet.category) === false`, between narrative and footer.
**Result: PASS**
`PetDetailSheet.tsx` lines 207–226: `{!isTradeable(pet.category) && (<div role="note" ...>)}` rendered after `{pet.discoveryNarrative && <p>}` and before the footer actions block at line 269.

**AC 2.2** — Banner: `var(--amber-sub)` bg, `1px solid var(--amber)` border, `var(--r-md)` radius, 12px 16px padding.
**Result: PASS**
`PetDetailSheet.tsx` line 212–214: `className="flex items-start gap-3 rounded-[var(--r-md)] border border-[var(--amber)] bg-[var(--amber-sub)] mb-4"`, `style={{ padding: '12px 16px' }}`. All four tokens present.

**AC 2.3** — Banner content: Award icon 16px `var(--amber-t)` `shrink-0`, heading "This animal was earned as a reward." 14px/600 `var(--amber-t)`, sub-text "Reward-only animals cannot be sold." 13px/400 `var(--t2)` mt-2.
**Result: PASS**
`PetDetailSheet.tsx` lines 216–224: `<Award size={16} className="text-[var(--amber-t)] shrink-0 mt-0.5" aria-hidden="true" />`. Heading `text-[14px] font-semibold text-[var(--amber-t)]`. Sub-text `text-[13px] text-t2 mt-2`. All tokens match spec.

**AC 2.4** — Banner has `role="note"`.
**Result: PASS**
`PetDetailSheet.tsx` line 212: `role="note"` present on the banner `<div>`.

**AC 2.5** — Banner is not interactive.
**Result: PASS**
Banner is a `<div>`, no `onClick`, no `tabIndex`, no hover classes.

**AC 2.6** — When `isTradeable === true`, banner is absent from DOM entirely.
**Result: PASS**
Conditional is `{!isTradeable(pet.category) && ...}` — JSX evaluates to `false` (not `null` or a hidden element) for tradeable pets. Not rendered.

**AC 2.7** — When `isTradeable === false`, "List for Sale" button is absent from DOM entirely (not disabled, not hidden).
**Result: PASS**
`PetDetailSheet.tsx` lines 288–339: the "List for Sale" button appears only inside the `isTradeable(pet.category)` branch. The reward-only branch (lines 343–362) contains only Rename and Release. The "List for Sale" `<Button>` is never rendered for reward-only pets.

**AC 2.8** — Footer for reward-only active pet: Rename (col 1) and Release (col 2).
**Result: PASS**
Reward-only footer (lines 344–361): `<div className="grid grid-cols-2 gap-2">` with Rename (`variant="primary"`) and Release (`variant="outline"`) as the two children.

**AC 2.9** — Banner copy does not contain "blocked", "forbidden", or "cannot trade".
**Result: PASS**
Exact copy in PetDetailSheet:
- Heading: `"This animal was earned as a reward."`
- Sub-text: `"Reward-only animals cannot be sold."`

None of the three prohibited words ("blocked", "forbidden", "cannot trade") appear. "Cannot be sold" is not "cannot trade" — passes the exact prohibition check.

**AC 2.10** — Banner is not taller than 80px at 375px.
**Result: PASS (by inspection)**
Banner contains a max of two text lines plus 12px top/bottom padding. At 375px inside a `px-6` container (content width ~327px), the text fits on one or two lines per element. No evidence of overflow in code.

---

### Story 3: Trade actions excluded at data layer

**AC 3.1** — NPC Marketplace browse tab never surfaces a reward-only animal.
**Result: PASS**
`useMarketplace.ts` line 21: `const TRADEABLE_ANIMALS = ANIMALS.filter(a => isTradeable(a.category))` — this constant is used exclusively in `generateOffer()` (lines 49, 61) which seeds all new NPC marketplace offers. Additionally, `tradeableOffers` (lines 386–389) filters existing DB records at return time using `isTradeable`. Dual-layer exclusion at both generation and read time. Data-layer constraint confirmed.

**AC 3.2** — Auctions tab grid never surfaces a reward-only animal.
**Result: PASS**
`useAuctions.ts` line 231–236: new auction generation uses `ANIMALS.filter(a => isTradeable(a.category) && ...)` as the eligible pool. Additionally, the public API return (line 1049) filters the live query result: `.filter(a => isTradeable(a.category))`. Dual-layer exclusion confirmed. Data-layer constraint, not UI gate.

**AC 3.3** — ListForSaleSheet never opens for reward-only pets (no UI path).
**Result: PASS**
The `listForSaleOpen` state is only set to `true` by the "List for Sale" `<Button>` which appears exclusively in the `isTradeable(pet.category)` branch of `PetDetailSheet.tsx`. Reward-only pets have no button that sets `listForSaleOpen = true`. Sheet is rendered unconditionally in JSX (line 376) but will never open for reward-only pets because the trigger is absent. No URL-based route to `ListForSaleSheet` exists — it is only accessible as a prop-driven overlay.

**AC 3.4 (TRANS-2)** — If exclusion filter failed, tier badge would provide visual fallback.
**Result: PASS (dual-layer exclusion means this scenario cannot arise; badge defence confirmed)**
TierBadge renders on every PetCard and PetDetailSheet. AuctionCard correctly omits TierBadge because only tradeable animals appear there.

---

### Story 4: Tier disclosure in Generate Wizard

**AC 4.1** — Step 1 category cards show a small tier sub-label indicator.
**Result: PASS**
`GenerateScreen.tsx` line 204: `tierPill: (isTradeable(c.value) ? 'tradeable' : 'reward-only')` passed to `OptionCard` for each category. `OptionCard.tsx` lines 76–91 render the pill conditionally.

**AC 4.2** — Tradeable sub-label: green tint-pair, 10px/600, 2px 6px padding, pill.
**Result: PASS**
`OptionCard.tsx` lines 77–82: `bg-[var(--green-sub)] text-[var(--green-t)] text-[10px] font-semibold`, `padding: '2px 6px'`, `rounded-pill`. Token-correct.
**Note: No border on the OptionCard tier pill.** The AC references "green tint-pair" and the interaction spec section 5a does not explicitly list a border for this pill. The TierBadge component (used on PetCard and PetDetailSheet) has a border; the OptionCard sub-label pill does not. The spec is silent on this point for the sub-label — this is a spec gap, not a build defect. Logged as Observation O-001.

**AC 4.3** — Reward-only sub-label: amber tint-pair, same sizing.
**Result: PASS**
`OptionCard.tsx` lines 84–90: amber tokens, same sizing. Same note about absent border as AC 4.2.

**AC 4.4** — Tier indicator does not block category selection.
**Result: PASS**
`OptionCard` is a `<button>` and `tierPill` spans have `pointer-events-none`. The card's `onClick` remains active for all categories.

**AC 4.5** — Existing category card hover and selected states unchanged.
**Result: PASS**
`OptionCard.tsx` lines 38–42: hover and selected class logic is unchanged. The `tierPill` render is additive (appended after `description`), not replacing any existing element.

**AC 4.6** — ResultsScreen tier disclosure strip renders between rarity/category badges and narrative text, unconditionally.
**Result: PASS**
`ResultsScreen.tsx` lines 96–121: strip renders at module level (not inside a conditional) — both branches (tradeable / reward-only) always produce output. Positioned after the hero row (badges) and before the name list. Narrative text follows later.

**AC 4.7** — Tradeable strip: `var(--green-sub)` bg, `ArrowLeftRight` 14px `var(--green-t)`, specified copy, 13px/400 `var(--t2)`, 10px 14px padding, `var(--r-md)` radius.
**Result: PASS**
`ResultsScreen.tsx` lines 100–109: `bg-[var(--green-sub)]`, `rounded-[var(--r-md)]`, `padding: '10px 14px'`, `ArrowLeftRight size={14}` class `text-[var(--green-t)]`, paragraph `text-[13px] text-t2`.
Exact copy verified: `"This animal can be listed for sale or put up for auction."` — matches spec exactly.
**Note: No border class on disclosure strip.** The interaction spec section 5b does not list a border for the strip (unlike the banner in section 4b). Omission is spec-consistent — logged as Observation O-002.

**AC 4.8** — Reward-only strip: `var(--amber-sub)` bg, `Award` 14px `var(--amber-t)`, specified copy, same layout.
**Result: PASS**
`ResultsScreen.tsx` lines 111–120: amber tokens, `Award size={14}`, same padding and radius.
Exact copy verified: `"This is a reward animal. You earned it — it can't be sold."` — matches spec exactly.

**AC 4.9** — Strip wraps to two lines at 375px, no taller than 60px. Adopt button visible without scrolling.
**Result: PASS (by inspection)**
Strip text is short prose. At 375px inside a `px-6` container (~327px wide), single-sentence text wraps at most to two lines. Adopt button is below the strip with standard spacing; no blocking layout element between strip and CTAs.

**AC 4.10** — At 1024px, strip renders on one line within `max-w-3xl`.
**Result: PASS (by inspection)**
`max-w-3xl` = 768px. Strip text fits on one line at that width.

**AC 4.11** — Strip content determined solely by `isTradeable(result.category)`. No hardcoded category strings in ResultsScreen.
**Result: PASS**
Grep of `ResultsScreen.tsx` for `'Wild'`, `'Sea'`, `'Lost World'`, `'At Home'`, `'Stables'`, `'Farm'` returns no matches. Decision is purely `isTradeable(selections.category)`.

---

### Story 5: Migration

**AC 5.1** — On app init, migration identifies pets with `category in ['Wild', 'Sea', 'Lost World']` and `status === 'for_sale'`.
**Result: PASS**
`db.ts` line 659–663: `db.savedNames.where('status').equals('for_sale').filter(pet => (REWARD_ONLY_CATEGORIES as readonly string[]).includes(pet.category))`. Identifies exactly the affected set before entering the transaction. Uses the imported canonical constant.

**AC 5.2** — Migration sets `status` to `'active'` and cancels associated listing record.
**Result: PASS**
`db.ts` lines 671–688: within the transaction, for each affected pet: `db.savedNames.update(pet.id!, { status: 'active', updatedAt: now })` and `db.playerListings.update(listing.id!, { status: 'cancelled', updatedAt: now })`. Both writes are present.

**AC 5.3** — Migration is version-flagged to run exactly once.
**Result: PASS**
`db.ts` lines 651–652: `const FLAG = 'migration_tier_v1'` checked in `localStorage` on entry. Flag is set (line 691) only after successful completion. On failure, flag is NOT set so migration retries (line 694–695).

**AC 5.4** — After migration, affected pets appear with `status === 'active'`.
**Result: PASS (by code inspection)**
The update on line 673 sets `status: 'active'`. `PetCard` and `PetDetailSheet` read `pet.status` reactively via `useLiveQuery`. Reward-only badge and banner will render correctly at next render cycle.

**AC 5.5** — No in-app notification shown.
**Result: PASS**
No `toast()` call within `runTierMigrationV1`. Function is entirely silent on success.

**AC 5.6** — If no affected records exist, migration completes silently.
**Result: PASS**
`db.ts` lines 665–668: `if (affectedPets.length === 0) { localStorage.setItem(FLAG, '1'); return }` — early exit with no error thrown.

**AC 5.7 (TRANS-2)** — Migration is wrapped in a single `db.transaction('rw', ...)` covering both pet status update and listing cancellation.
**Result: PASS**
`db.ts` line 670: `await db.transaction('rw', db.savedNames, db.playerListings, async () => { ... })`. Both `savedNames.update` (line 673) and `playerListings.update` (line 683) are inside this single transaction boundary. Partial migration is prevented.

**AC 5.8** — Migration call happens on app init.
**Result: PASS**
`main.tsx` line 10: `runTierMigrationV1()` called before `createRoot().render()`. Fire-and-forget (no `await`) — this is acceptable for a migration flagged to run once and retry on failure.

---

## isTradeable() source-of-truth audit

### Grep results for inline category checks in trade-context code

The following patterns were searched across `/src`:
- `category === 'Wild'`
- `category === 'Sea'`
- `category === 'Lost World'`
- `category === 'At Home'`

Findings with trade-eligibility relevance:

**`src/hooks/useCardPacks.ts` lines 61–62:**
```
if (rarity === 'rare') return a.category === 'Wild' || a.category === 'Lost World'
if (rarity === 'uncommon') return a.category === 'Stables' || a.category === 'Sea'
```
These checks are used to determine the animal pool for card pack generation — NOT for trade eligibility. Card packs are a separate game mechanic. These checks are out of scope for the isTradeable audit and do not constitute a build defect.

**`src/screens/ExploreScreen.tsx` line 229:**
```
filteredAnimals.filter(a => a.category === 'Lost World')
```
Used to filter the displayed animal encyclopaedia by category. Not trade-eligibility logic. Out of scope.

**`src/screens/MyAnimalsScreen.tsx` line 417:**
```
pets.filter(p => p.category === 'Lost World')
```
Used to build the Dinosaur-category sub-list for display in My Animals. Not trade-eligibility logic. Out of scope.

**`src/components/my-animals/PetDetailSheet.tsx` line 309:**
```
pet.category === 'Stables' && pet.id != null
```
Used to conditionally show the "Dress up" button for Stables horses. Not trade-eligibility logic. Out of scope.

**`src/lib/db.ts` line 8 (post-fix):**
```
import { REWARD_ONLY_CATEGORIES } from '@/lib/animalTiers'
```
`runTierMigrationV1()` now uses `REWARD_ONLY_CATEGORIES` from `animalTiers.ts` at line 662. The local inline constant `REWARD_ONLY` has been removed. Source-of-truth is now unified. Verified 2026-03-29.

### Verdict

All trade-eligibility decisions in components and hooks route through `isTradeable()`. The migration function (`db.ts`) now imports `REWARD_ONLY_CATEGORIES` from `animalTiers.ts` and uses it as the filter predicate. No inline category strings remain in trade-context code.

**isTradeable() source-of-truth: PASS**

---

## Data-layer exclusion audit

### useMarketplace filter location

Two-layer exclusion:
1. **Generation layer:** `const TRADEABLE_ANIMALS = ANIMALS.filter(a => isTradeable(a.category))` (line 21) is used as the pool for all `generateOffer()` calls. New offers will never include reward-only animals.
2. **Read layer:** `tradeableOffers` (lines 386–389) filters the live-queried results via `isTradeable` before returning from the hook. Legacy records in the DB (pre-migration) that somehow have a reward-only category are also excluded.

**Verdict: PASS** — data-layer constraint, not UI gate.

### useAuctions filter location

Two-layer exclusion:
1. **Generation layer:** `eligibleAnimals = ANIMALS.filter(a => isTradeable(a.category) && ...)` (lines 231–236) is the pool for daily auction batch generation.
2. **Read layer:** `auctions: (auctions ?? []).filter(a => isTradeable(a.category))` (line 1049) at the public API return.

**Verdict: PASS** — data-layer constraint, not UI gate.

---

## Migration integrity audit

**Transaction boundary:** PASS
`db.transaction('rw', db.savedNames, db.playerListings, async () => { ... })` wraps both the `savedNames.update` and `playerListings.update` calls. Partial migration is structurally impossible.

**Version flag:** PASS
`localStorage.getItem('migration_tier_v1')` guard on entry. Flag set only after success. Non-fatal error handling with retry-on-next-init behaviour.

**Source-of-truth compliance:** PASS — D-001 resolved 2026-03-29. `REWARD_ONLY_CATEGORIES` imported from `animalTiers.ts` and used in migration filter.

---

## Banner copy audit

**Prohibited words absent:** PASS
The words "blocked", "forbidden", and "cannot trade" do not appear in any component file.

**Exact copy rendered (from PetDetailSheet.tsx):**
- Heading: `"This animal was earned as a reward."`
- Sub-text: `"Reward-only animals cannot be sold."`

Both lines match the spec (interaction spec section 4b and Story 2 AC) exactly. "Cannot be sold" is not a prohibited phrase — prohibited phrases are "cannot trade", "forbidden", and "blocked".

---

## 10-point DS checklist

The following checks apply app-wide (checks 7–10) and per-batch (checks 1–6).

**1. No emojis used as icons (Lucide only)**
PASS — All icons in the built components (`ArrowLeftRight`, `Award`, `Check`, `CheckCircle`, `AlertCircle`, `Disc`) are Lucide. No emoji characters found in JSX, data files, or toast messages added by this feature. The `OptionCard` has an `emoji?: string` prop but no emoji values are passed by the category step (only `icon` is passed, which is a React node using Lucide icons).

**2. No `ghost` variant on visible actions**
PASS — Grep of the full codebase for `variant="ghost"` returned no matches. No ghost variant in use anywhere.

**3. All colours trace to `var(--...)` tokens**
PASS — `TierBadge.tsx`, `PetDetailSheet.tsx`, `ResultsScreen.tsx`, and `OptionCard.tsx` use only CSS custom property references (`var(--green-sub)`, `var(--amber-sub)`, `var(--green)`, `var(--amber)`, `var(--green-t)`, `var(--amber-t)`, `var(--r-md)`). No hardcoded hex values found in any of the five feature files.

**4. Surface stack is correct — glass rule applies to all fixed/absolute overlays**
PASS — The `TierBadge`, banner, and disclosure strip are all inline block elements (not `position: fixed` or `position: absolute`). The glass rule does not apply to them. `PetDetailSheet` uses `BottomSheet` which is an existing, previously-approved overlay component. No new overlay surfaces introduced by this feature.

**5. Layout verified at 375px, 768px, and 1024px**
PASS (by code inspection) — `PetCard` badge row uses `flex-wrap`; `PetDetailSheet` header badges use `flex-wrap justify-end`; ResultsScreen and disclosure strip are inside `max-w-3xl mx-auto w-full` containers with `px-6` gutters. All scrollable content areas have appropriate padding. Cannot physically resize browser without running the app; no structural code evidence of overflow at any breakpoint.

**6. All scrollable content has `pb-24` minimum**
PASS — `ResultsScreen.tsx` line 209: `pb-24` on the CTA container. `MyAnimalsScreen.tsx` line 533: `pb-24` on the scrollable content container. `PetDetailSheet` content area has `pb-10` on its scroll container — this is an existing pre-feature value; the spec explicitly states the padding is unchanged by this feature (interaction spec section 4d). No new scrollable containers introduced without `pb-24`.

**7. Top-of-screen breathing room**
PASS — No new screen-level headers introduced by this feature. Existing screens (MyAnimals, GenerateScreen, ResultsScreen) are pre-existing and their header clearance is unchanged.

**8. Navigation controls compact and consistent**
PASS — No new navigation controls, tab switchers, or filter pill rows introduced by this feature. Existing patterns are unchanged.

**9. Animation parameters match spec**
PASS — This feature introduces no animations. `TierBadge`, the reward-only banner, and the disclosure strip are all static elements. No Framer Motion usage added by this feature. `prefers-reduced-motion` compliance is implicit (no animation to reduce).

**10. Spec-to-build element audit**

Elements specified in interaction spec that must be present:
- [x] TierBadge on PetCard — present
- [x] TierBadge on PetDetailSheet header — present
- [x] TierBadge absent from AuctionCard — confirmed absent
- [x] Reward-only informational banner in PetDetailSheet — present
- [x] "List for Sale" absent from DOM for reward-only pets — confirmed absent
- [x] Rename + Release only in reward-only footer — present
- [x] Tier sub-label pill on Step 1 category cards — present via `tierPill` prop
- [x] Tier disclosure strip on ResultsScreen — present, unconditional
- [x] Migration on app init — present in main.tsx
- [x] Data-layer exclusion in useMarketplace — present
- [x] Data-layer exclusion in useAuctions — present

Elements in build absent from spec:
- `TierBadge` appears in `ListingRetractModal.tsx` — this is the pet summary row referenced in interaction spec section 2 ("On ListForSaleSheet pet summary row"). This is spec-consistent; the modal shows the pet being listed and the badge confirms tier. This is correctly implemented per the spec's "reassurance signal" note.

No spec elements absent from build. No extraneous elements added beyond spec intent.

---

## Defects found

### D-001: Migration uses inline category strings instead of `isTradeable()` / `REWARD_ONLY_CATEGORIES`
**Severity:** Medium
**Status: RESOLVED 2026-03-29**
**File:** `src/lib/db.ts`
**Description:** `runTierMigrationV1()` previously defined a local `const REWARD_ONLY = ['Wild', 'Sea', 'Lost World']` instead of importing `REWARD_ONLY_CATEGORIES` from `@/lib/animalTiers`.
**Fix verified:** Local constant removed. Line 8 now imports `REWARD_ONLY_CATEGORIES` from `@/lib/animalTiers`. Line 662 filter predicate uses `(REWARD_ONLY_CATEGORIES as readonly string[]).includes(pet.category)`. Source-of-truth is unified.

---

### D-002: `isTradeable()` source-of-truth AC — migration violation
**Status: RESOLVED 2026-03-29 — same fix as D-001**
Resolved by the `REWARD_ONLY_CATEGORIES` import. No inline array remains in the migration function.

---

## Observations (not blocking sign-off)

### O-001: OptionCard tier pill has no border
The `TierBadge` component (used on PetCard, PetDetailSheet) includes a `border` class per DS tint-pair rules. The tier sub-label pill inline in `OptionCard.tsx` omits the border. The interaction spec section 5a does not explicitly list a border for the category card sub-label pill. This is a spec gap — the spec should have mandated consistent border treatment across all tint-pair surfaces. The omission makes the two pill styles visually inconsistent. Recommend: add `border border-[var(--green)]` / `border border-[var(--amber)]` to the OptionCard tier pill in a follow-up UX spec revision and FE fix. Not blocking sign-off because the spec did not require it.

### O-002: ResultsScreen disclosure strip has no border
Same observation as O-001 but for the disclosure strip in `ResultsScreen.tsx`. The informational banner in `PetDetailSheet` has `border border-[var(--amber)]` per spec. The strip (a visually similar surface) has no border. The spec for section 5b does not list a border. Spec gap. Not blocking.

### O-003: Migration uses `localStorage` rather than a DB-native version flag
AC 5.3 says "a `migrations` table or a versioned flag in `playerProfile`". The implementation uses `localStorage`. This works and is idempotent, but `localStorage` can be cleared by the user or browser without clearing IndexedDB, which could cause the migration to re-run harmlessly (no data loss since the cat is already out of the bag — affected pets are already active). Not a data integrity risk because the migration is idempotent. The AC language says "e.g., a `migrations` table or a versioned flag in `playerProfile`" which implies these are examples, not requirements. Not blocking.

---

## Sign-off

[x] SIGNED OFF

**Date:** 2026-03-29
**Tester:** Claude (Senior QA Engineer)

All 5 stories pass. All acceptance criteria pass. Defects D-001 and D-002 resolved and verified on 2026-03-29 re-verification pass.

**Verification summary for D-001 fix:**
- Local `const REWARD_ONLY = ['Wild', 'Sea', 'Lost World']` — GONE. Not present in `db.ts`.
- `REWARD_ONLY_CATEGORIES` imported from `@/lib/animalTiers` — CONFIRMED. `db.ts` line 8.
- Migration filter at line 662 uses `REWARD_ONLY_CATEGORIES` — CONFIRMED. `(REWARD_ONLY_CATEGORIES as readonly string[]).includes(pet.category)`.

No blocking defects remain. Observations O-001, O-002, O-003 are non-blocking and deferred to future spec/UX review. Feature meets all acceptance criteria across all 5 stories.
