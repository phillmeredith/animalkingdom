# Test Results: Auctions

> Feature: Auctions (NPC-driven daily animal auctions)
> Phase D author: Tester
> Date: 2026-03-28
> Build: Phase C complete
> Stories tested: AUC-01 through AUC-13
> Sign-off status: BLOCKED — 3 defects require fixes before sign-off

---

## Files reviewed

- `src/hooks/useAuctions.ts`
- `src/components/auctions/AuctionCard.tsx`
- `src/components/auctions/AuctionDetailSheet.tsx`
- `src/components/auctions/AuctionWonOverlay.tsx`
- `src/screens/AuctionHubScreen.tsx`
- `src/screens/StoreHubScreen.tsx` (auctions tab wiring, coinsInBids, filter row)
- `src/components/ui/CoinDisplay.tsx`
- `src/components/ui/Modal.tsx` (BottomSheet portal and scroll lock)
- `src/hooks/useScrollLock.ts`
- `src/components/layout/AppRouter.tsx`
- `spec/features/auctions/interaction-spec.md`
- `product/auctions/refined-stories.md`

---

## 10-Point DS Checklist

### 1. No emojis used as icons — Lucide only

PASS.

All icons in the auctions feature use Lucide. `AuctionCard.tsx`, `AuctionDetailSheet.tsx`, and `AuctionWonOverlay.tsx` exclusively use Lucide icons (`Coins`, `Clock`, `ChevronLeft`, `AlertCircle`, `Loader2`, `Gavel`, `ChevronDown`). No emoji characters appear in any JSX, data file, toast message, or button label in the auctions codebase.

Full-codebase search for emoji characters in auctions files returned no matches.

### 2. No `ghost` variant on visible actions

PASS.

Full-codebase grep for `variant="ghost"` returned zero matches. No ghost variant exists anywhere in the codebase, including pre-existing screens. Checklist satisfied at full-codebase scope.

### 3. All colours trace to `var(--...)` tokens

PASS with one note.

All colour assignments in `AuctionCard.tsx`, `AuctionDetailSheet.tsx`, and `AuctionWonOverlay.tsx` trace to DS tokens. Inline `rgba()` composites are documented exceptions permitted by CLAUDE.md glass rule.

One note: `AuctionCard.tsx` uses inline `rgba(69,178,107,.06)`, `rgba(55,114,255,.06)`, `rgba(151,87,215,.06)`, `rgba(245,166,35,.06)` for the rarity body tints. These are alpha composites of DS tokens (`--green-sub`, `--blue-sub`, `--purple-sub`, `--amber-sub`) applied at a custom opacity. The spec says "at 50% opacity" but a CSS `rgba()` with exact token values is the technically correct way to implement this since `var()` cannot take an alpha argument in Tailwind inline styles. These values are permissible provided the hex bases match the token values. They are close approximations; a future iteration should use CSS `color-mix()` or Tailwind opacity modifiers once token values are confirmed exact. This is noted as an observation, not raised as a defect.

`SortControl` dropdown in `AuctionHubScreen.tsx` uses `rgba(13,13,17,.95)` — a glass composite beyond the standard `.88`/`.80` values. This is used on a hover dropdown panel. It is not a glass overlay with a backdrop and does not break any named rule, but is inconsistent with the glass rule table. Flagged as a low-severity observation only; not raised as a defect.

Particle colours in `AuctionWonOverlay.tsx` all use `var(--...)` tokens. Pass.

### 4. Surface stack correct — glass rule on overlays

PASS.

- `AuctionDetailSheet` uses the existing `BottomSheet` component which applies `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)` + `1px solid rgba(255,255,255,.06)`. This is the correct glass value for an overlay that renders over a `bg-black/10` backdrop. The interaction spec AUC-06 AC comment says `.88` but CLAUDE.md explicitly specifies `.80` for modal/bottomsheet surfaces with a backdrop. The component implementation is correct per CLAUDE.md; the spec comment is the error.
- `AuctionWonOverlay` correctly uses `var(--grad-hero)` celebration surface, not glass. Spec section 6 explicitly states the glass rule does not apply here.
- `BottomSheet` renders via `createPortal(content, document.body)` — verified in `Modal.tsx` line 201. Portal compliance confirmed.
- `AuctionWonOverlay` renders via `createPortal(content, document.body)` — verified in `AuctionWonOverlay.tsx` line 276. Portal compliance confirmed.
- `AuctionCard` is not a fixed overlay — no glass rule applies. Surface is `var(--card)`. Pass.

### 5. Layout verified at 375px, 768px, and 1024px

PASS (static code review) with two observations requiring visual confirmation.

Content container class in `AuctionHubScreen.tsx` line 316: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` — matches spec requirement exactly.

Grid: `grid-cols-1 md:grid-cols-2 gap-5` — correct. Single column at 375px, two columns from 768px upward.

Grid parent has `pt-1` on line 335 and 350 — correct per spec to prevent card lift clip.

The 4-tab segmented control in `StoreHubScreen.tsx` (centre slot) renders as an inline-flex row with four items: "Market", "Items", "Cards", "Auctions". At 375px this row may overflow the centre slot depending on the rendered width of each label. The labels are hardcoded as inline strings, not abbreviated. This cannot be fully assessed without a visual check at 375px. FE self-review flag item 4 explicitly calls this out. This is flagged as a visual verification requirement — see note in FE self-review flags section below.

`AuctionFilterRow` wraps filter pills in a scrollable row (`overflow-x-auto scrollbar-none`) — correct for 375px where pills would otherwise overflow.

### 6. All scrollable content has `pb-24` minimum

PASS.

`AuctionHubScreen.tsx` content container: `pb-24` present.
`StoreHubScreen.tsx` non-auction content div: `pb-24` present (line 1881).

### 7. Top-of-screen breathing room — `pt-4` below PageHeader

PASS.

`AuctionHubScreen.tsx` content container class includes `pt-4`. Spec section 4 specifies exactly `pt-4` (16px). Confirmed.

### 8. Navigation controls compact and consistent

PASS.

The Shop/Auctions segmented control lives in the `centre` slot of `StoreHubScreen`'s `PageHeader`. `AuctionHubScreen` does not render its own tab control. Dual navigation is absent. The centre slot uses `display: inline-flex` with `borderRadius: 100` and `padding: 4` — compact, not full-width.

Filter pills in the `below` slot use the tint-pair active style: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`. Confirmed in both `AuctionFilterRow` (within `AuctionHubScreen.tsx`) and in the `StoreHubScreen` `below` slot rendering for other tabs. Consistent.

Sort control is `ml-auto shrink-0` — right-aligned as specified.

### 9. Animation parameters match the spec

PASS.

`AuctionWonOverlay.tsx`:
- Overlay entrance: `opacity: 0 → 1`, `duration: 0.3`, `ease: 'easeOut'` — matches spec ("300ms, ease-out").
- Animal image: `scale: 0.8 → 1.0` + `opacity: 0 → 1`, spring `{ stiffness: 300, damping: 28 }` — matches spec exactly.
- Coin particles: `initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}` — correct per CLAUDE.md Framer Motion rule §3 (never `scale: 0` for burst particles).
- Reduced-motion: particles suppressed (`!reducedMotion && <CoinParticles />`); overlay fades only with no scale. Pass.

`AuctionCountdown` progress bar: `transition: 'width 1s linear'` inline style. The comment claims reduced-motion is "handled via CSS media query" but no `@media (prefers-reduced-motion: reduce)` rule exists in `src/index.css` or anywhere else in the codebase. The `AuctionDetailSheet.tsx` component does not call `useReducedMotion()`. The progress bar transition will animate on all users regardless of their motion preference. This is a defect — see DEF-02.

`AnimatePresence` usage in `AuctionWonOverlay.tsx`: correctly scoped to its own wrapper with no shared `mode="wait"` siblings.

### 10. Spec-to-build element audit

PASS with one gap noted.

Scrolling through spec section 6 component inventory against built components:

| Spec element | Built | Notes |
|---|---|---|
| AuctionHubScreen | Present | Route `/auctions` redirects to `/shop?tab=auctions` — correct |
| AuctionCard (grid card) | Present | Full anatomy built |
| Hero image 16:9 | Present | `aspect-video` |
| Animal name 15px/600/--t1 | Present | |
| RarityBadge (tint-pair) | Present | |
| Current bid (Coins 13px + 14px/700/--amber-t) | Present | |
| TimerDisplay with urgency states | Present | |
| Rarity left border 4px | Present | Applied via `borderLeft` inline style |
| Rarity body tint | Present | |
| Differentiation label pill ("Exclusive" / "Rare find") | Present | |
| "Your bid" pill (amber tint-pair) | Present | |
| Won card "Yours now!" green tint banner | Present | |
| Section label "LIVE NOW" | Present | |
| AuctionEmptyState (Gavel icon + copy) | Present | |
| Loading skeletons (4 cards, pulse) | Present | |
| AuctionFilterRow (pills + sort) | Present | |
| AuctionDetailSheet | Present | |
| AuctionCountdown | Present | |
| BidHistoryList | Present | |
| BidConfirmState | Present | |
| BuyNowConfirmState | Present | |
| AuctionWonOverlay | Present | |
| CoinDisplay coinsInBids extension | Present | |
| First-encounter onboarding strip | Present | |

One gap: The spec copy table (section 11) defines a distinct toast for the "Outbid — cannot rebid" state: "You've been outbid on [Name] and you're out of coins to bid higher." The hook fires the generic outbid toast (`"You've been outbid — bid again to stay in."`) regardless of whether Harry can afford to rebid. There is no branch in `executeNpcCounterBid()` to check the player's wallet balance and fire the alternative copy. This is a copy defect — see DEF-01.

---

## Functional Test Results

### Scenario: Browse auctions and view grid

**Given**: Player navigates to /shop?tab=auctions
**When**: Page loads
**Then**: Grid of auction cards renders at 2 columns on 768px+, 1 column on 375px. "LIVE NOW" section label present above grid. If auctions exist, cards show name, rarity badge, current bid, and time remaining. If no auctions, empty state with Gavel icon renders.

**Pass criteria**:
- Content container class matches `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` — PASS (confirmed in code)
- Grid is `grid-cols-1 md:grid-cols-2` — PASS
- Section label text is "LIVE NOW" (uppercase) — PASS

**Result**: PASS (code review)

---

### Scenario: First-encounter onboarding strip (AUC-04)

**Given**: No `auctions_onboarding_seen` key in localStorage
**When**: Player opens Auction Hub for the first time
**Then**: Inline strip appears above "LIVE NOW" label with specified copy. No modal. No dismiss button. Strip disappears on next session.

**Edge cases**:
- Strip on second visit: localStorage key set on first render; subsequent visits will not show strip — PASS (logic confirmed in code: state initialised from `localStorage.getItem(ONBOARDING_SEEN_KEY)`)
- Strip is not a modal or BottomSheet — PASS
- Copy matches spec exactly: "Find an animal you love and offer the most coins before the timer ends — and it's yours! These are rare animals you can't get any other way." — PASS

**Pass criteria**: Strip appears only on first visit; copy is exact.

**Result**: PASS (code review)

---

### Scenario: Bid flow — spend at confirm, wallet updates (AUC-07)

**Given**: Player opens an active auction detail sheet with sufficient coins
**When**: Player taps "Place a bid", adjusts stepper, taps "Confirm bid"
**Then**: Coins are SPENT at confirm (not held). Wallet balance drops. `coinsInBids` updates. Sheet returns to detail view showing "YOUR BID" row.

**Edge cases**:
- Cancel before confirm: no bid placed, no coins spent — PASS (verified: `setView('detail')` on Cancel/Back; `placeBid` only called in `onConfirm`)
- Sheet dismissed mid-confirm: view resets to 'detail' on next open — PASS (useEffect on `isOpen` resets `view` to 'detail')
- Stepper at minimum: `[−]` disabled at `opacity: 0.4` — PASS
- `[+]` has no upper cap — PASS
- Both `[−]` and `[+]` have `minWidth: 44, minHeight: 44` touch target — PASS

**Transaction integrity**: `spend()` and `auctionBids.add()` and `auctionItems.update()` are all inside one `db.transaction('rw', db.auctionItems, db.auctionBids, db.playerWallet, db.transactions, ...)` — PASS. No `spend()` call exists outside a transaction.

**Pass criteria**: Coins spent atomically with bid record write.

**Result**: PASS (code review)

---

### Scenario: Re-bid flow (AUC-08)

**Given**: Player has an active bid; NPC has counter-bid, outbidding the player
**When**: Player taps "Bid again" and confirms
**Then**: Prior bid is refunded internally, new higher amount spent, both in one transaction. "YOUR BID" row updates to new amount.

**Transaction integrity**: Re-bid path calls `earn()` then `spend()` then `db.auctionBids.update()` then `db.auctionBids.add()` then `db.auctionItems.update()` — all inside the same `db.transaction()`. PASS.

**Pass criteria**: No coins lost or duplicated on re-bid.

**Result**: PASS (code review)

---

### Scenario: NPC counter-bid mechanic (AUC-09)

**Given**: Player places a bid
**When**: NPC counter-bid fires after delay
**Then**: Delay is 3–12 seconds. NPC name rotates. NPC bid count is capped at 3 or 4 per auction. NPC budget ceiling respected. If player was leading bidder, outbid toast fires.

**Verified values**:
- `NPC_BID_DELAY_MIN_MS = 3_000` — PASS (3 second minimum hard constraint from UR findings)
- `NPC_BID_DELAY_MAX_MS = 12_000` — PASS
- `NPC_MAX_BIDS_MIN = 3`, `NPC_MAX_BIDS_MAX = 4` — PASS
- Budget ceilings per rarity: uncommon 200, rare 600, epic 1400, legendary 3000 — PASS
- NPC names: 6 whimsical names, no realistic human names — PASS
- Name rotation: `availableNames = NPC_NAMES.filter(n => n !== lastNpcBidderRef.current)` — PASS (session-level rotation; not per-auction batch rotation, which is handled at generation time via shuffle)

**Anti-snipe verification**: No time extension logic found anywhere in the auctions codebase. Auctions end at `endsAt`. No `setTimeout` or timer logic modifies `endsAt`. PASS.

**Result**: PASS (code review)

---

### Scenario: Outbid toast copy correctness — cannot rebid variant

**Given**: Player is outbid and their wallet balance is below the new minimum bid
**When**: NPC counter-bid fires
**Then**: Toast should read "You've been outbid on [Name] and you're out of coins to bid higher." (spec section 11 copy table)

**Actual behaviour**: `executeNpcCounterBid()` fires `'You've been outbid — bid again to stay in.'` regardless of wallet balance. There is no branch to check `coins < nextBidAmount`.

**Result**: FAIL — see DEF-01

---

### Scenario: Buy-now flow (AUC-07 / Flow 2)

**Given**: Auction has a `buyNow` price set; player opens detail sheet
**When**: Player taps "Buy now for [X] coins", confirms
**Then**: Coins spent, auction status set to 'won' inside transaction, animal delivered, AuctionWonOverlay fires.

**Buy-now transaction**: `spend()` + `auctionBids.add()` + `db.auctionItems.update(status: 'won')` all inside `db.transaction()` — PASS. `deliverWonAnimal()` called after transaction — PASS.

**Win overlay trigger via buy-now path**: `AuctionHubScreen` handles this in `onBuyNow` handler: re-fetches updated auction after `buyNow()` resolves and calls `handleWin(updated)` if `status === 'won'` — PASS.

**Result**: PASS (code review)

---

### Scenario: Win resolution overlay (AUC-10)

**Given**: Auction closes with player as highest bidder
**When**: `resolveAuctionWin()` is called
**Then**: `AuctionItem.status` set to 'won', animal added to `savedNames`, `checkBadgeEligibility()` called non-blocking.

**Overlay behaviour**:
- `AuctionWonOverlay` renders via `createPortal(content, document.body)` — PASS
- Backdrop tap does NOT dismiss: `onClick={e => e.stopPropagation()}` on the fixed overlay div — PASS
- Only "Go to My Animals" button dismisses — PASS
- Overlay fires in timer-based resolution path: `useEffect` watching `auctions` array detects `status === 'won'` transition and calls `handleWin()` — PASS
- Overlay fires in buy-now path: `onBuyNow` handler re-fetches and calls `handleWin()` — PASS
- `checkBadgeEligibility()` called with `.catch(err => toast(...))` — no silent swallow — PASS
- Known gap comment present in hook — PASS

**Result**: PASS (code review)

---

### Scenario: Loss resolution — earn refund + copy (AUC-11)

**Given**: Auction closes; NPC is highest bidder; player had an active bid
**When**: `resolveAuctionLoss()` is called
**Then**: `earn()` called to refund bid, `AuctionItem.status` set to 'lost', toast fires with correct copy.

**Copy verification**:
- Toast title: `"${auction.name} went to another home."` — matches spec "went to another home" — PASS
- Toast description: `"Your coins are back."` — matches spec; appears ONLY at final loss, not in outbid toast — PASS
- The word "lost" does not appear in any user-facing toast or overlay copy — PASS (internal status field uses `'lost'` string for DB, but that never surfaces to the user)

**Transaction integrity**: `earn()` and `db.auctionItems.update(status: 'lost')` are inside `db.transaction('rw', db.auctionItems, db.playerWallet, db.transactions, ...)` — PASS.

**Result**: PASS (code review)

---

### Scenario: Won auction card state (AUC-12)

**Given**: Auction has been won and animal delivered
**When**: Player views the auction grid
**Then**: Card shows green tint banner "Yours now!" using green tint-pair (not solid green). CTA suppressed. Tap opens read-only detail sheet.

**Tint-pair gate**: `bg-[var(--green-sub)] text-[var(--green-t)]` with `border: '1px solid var(--green)'` — PASS. Not solid green. PASS.

Won cards included in `displayAuctions = [...activeAuctions, ...wonAuctions]` — PASS. Won cards persist in grid until next daily rotation.

Read-only sheet: `isReadOnly = auction?.status === 'won'` — CTAs suppressed in read-only state — PASS. "Find them in My Animals" button shown in read-only won state — PASS.

**Result**: PASS (code review)

---

### Scenario: Offline outcome delivery (AUC-13)

**Given**: Auction closed while player was not on-screen
**When**: Player opens the app
**Then**: `resolveExpiredAuctions()` runs on mount, processes any expired auctions, fires win overlay or loss toast.

**Online vs offline win toast**: The spec copy table (section 11) specifies an offline-specific win toast: "Remember [Name]? You won! Find them in My Animals." The hook comment acknowledges this gap (lines 922–927): "For Phase C the standard copy is used; the offline-variant copy is a Tester-flagged gap to address in Phase D if needed."

This is a pre-acknowledged spec gap, documented by the Developer. The offline win case fires the AuctionWonOverlay rather than a toast, which is technically the correct behaviour on app-open when the screen is visible. The offline-specific "Remember" toast copy is only required when the user may have forgotten the auction. This gap is logged as DEF-03 — a should-fix, not a must-fix.

**Pass criteria for AUC-13 core requirement**: Win and loss are resolved on next app open — PASS. `resolveExpiredAuctions()` called in `useEffect(() => { ... }, [])` on mount — PASS.

**Result**: PASS with gap (DEF-03 logged)

---

### Scenario: Sheet close mid-bid (Flow 6)

**Given**: Player taps "Place a bid", enters BidConfirmState, adjusts stepper
**When**: Player swipes down or taps backdrop to dismiss before tapping "Confirm bid"
**Then**: No bid placed, no coins spent, sheet closes cleanly. Next open of same card shows detail view, stepper reset to current minimum.

**Verified in code**:
- `view` state resets to `'detail'` on every sheet open: `useEffect(() => { if (isOpen) setView('detail') }, [isOpen])` — PASS
- `BidConfirmState.bidAmount` initialised from `minimumBid` on each mount — PASS (state is local to the component, re-initialises each time `view === 'bid-confirm'` is entered)
- `placeBid()` is only called from the `onConfirm` callback, which is only triggered by the "Confirm bid" button — PASS
- No toast or notification fires on sheet close mid-bid — PASS

**Result**: PASS (code review)

---

### Scenario: `coinsInBids` naming and display (AUC-01, AUC-05)

**Given**: Player has an active bid
**When**: Any screen with a CoinDisplay in the PageHeader is visible
**Then**: CoinDisplay shows "[X] in bids" below the main balance pill. The words "held" and "reserved" do not appear.

**Verified**:
- `heldAmount` does not appear anywhere in the codebase — PASS
- `coinsInBids` is the only name used — PASS
- CoinDisplay extension shows "X in bids" at 11px/500/--t3 — PASS
- `coinsInBids` is wired globally in `StoreHubScreen` via `const { coinsInBids } = useAuctions()` and passed to `<CoinDisplay amount={coins} coinsInBids={coinsInBids} />` — PASS
- "in bids" is visible on all screens while Harry has active bids (via StoreHubScreen's PageHeader) — NOTE: This is only globally visible on screens that render through StoreHubScreen. If CoinDisplay appears on other screens' PageHeaders, they may not receive `coinsInBids`. This warrants a check of other screen headers, but it is the correct design for the Store/Marketplace screen where bids are placed.

**Result**: PASS (code review)

---

### Scenario: AuctionCountdown reduced-motion compliance (AUC-06)

**Given**: User has `prefers-reduced-motion: reduce` set
**When**: AuctionDetailSheet is open
**Then**: Progress bar updates in discrete steps (no smooth width transition)

**Actual behaviour**: `AuctionDetailSheet.tsx` sets `transition: 'width 1s linear'` as an inline style. The comment says reduced-motion is "handled via CSS media query" but no `@media (prefers-reduced-motion: reduce)` rule exists in `src/index.css` or anywhere in the codebase. `AuctionDetailSheet.tsx` does not import or call `useReducedMotion()`. The bar will animate for all users.

**Result**: FAIL — see DEF-02

---

### Scenario: NPC generation batch rules (AUC-02)

**Given**: `refreshAuctions()` is called when no active auctions exist
**When**: Batch is generated
**Then**: 3–5 items, all uncommon+, at least 1 rare+, at least 1 exclusive, bid ranges correct, NPC names non-repeating within batch.

**Verified in code**:
- Batch size: `randomBetween(3, 5)` — PASS
- Rarity floor: `eligibleAnimals` filtered to `uncommon | rare | epic | legendary` — PASS
- At least 1 rare+: `eligibleRare` slot guaranteed — PASS
- At least 1 exclusive: `shuffledExclusive[0]` slot guaranteed; toast + early return if pool empty — PASS
- Bid ranges per rarity tier: match PO-specified values in `STARTING_BID_RANGE` — PASS
- Minimum increments match `MINIMUM_INCREMENT` table — PASS
- `buyNow` at 50% probability, 2.5× `startingBid` — PASS (`BUY_NOW_PROBABILITY = 0.5`, `BUY_NOW_MULTIPLIER = 2.5`)
- NPC names: 6 whimsical names, no realistic human names — PASS
- No NPC seller name repeats within batch: `shuffledNpcNames[index % shuffledNpcNames.length]` using a shuffled copy — PASS

**Result**: PASS (code review)

---

## FE Self-Review Flags — Tester Verification

The FE flagged eight items for Tester verification. Results:

**Flag 1: Won overlay fires in both paths (buy-now and timer-based)**
Buy-now path: `onBuyNow` handler in `AuctionHubScreen.tsx` re-fetches auction post-`buyNow()` and calls `handleWin()` — PASS.
Timer-based path: `useEffect` watching `auctions` array detects `status === 'won'` transition — PASS.

**Flag 2: AuctionDetailSheet navigates correctly between detail/bid-confirm/buy-now-confirm**
`view` state machine: `'detail' | 'bid-confirm' | 'buynow-confirm'`. Transitions verified in code. PASS.

**Flag 3: `coinsInBids` in header while bid active, disappears after resolution**
`coinsInBids` is a live derived value from `useLiveQuery` in `useAuctions`. On loss resolution, `earn()` marks the `AuctionBid` as no longer active. The `playerBidsRaw` query filters on `bidStatus === 'active'`. After loss, the bid status is updated. The `playerBids` map only includes bids on active auctions. After loss, the `AuctionItem.status` changes from `'active'` to `'lost'`, removing the auction from `activeAuctionIds`. `coinsInBids` will reduce to zero reactively. PASS.

**Flag 4: 4-tab segmented control at 375px — check for overflow**
This is a visual verification requirement. Code review shows the control uses `display: inline-flex` with `padding: 4` and each tab item uses `padding: '6px 12px'`. The four labels are "Market", "Items", "Cards", "Auctions". Estimated total width: approximately 280–320px, which should fit in a 375px viewport with standard PageHeader horizontal padding. However, this requires visual confirmation at the actual device width. The Tester notes this as a visual verification outstanding item that cannot be signed off by code review alone. As there is no preview tool available for interactive testing in this session, the Tester accepts the FE's code-review confidence but requires the owner to verify visually before shipping.

**Flag 5: Countdown urgency states (normal / amber at <1h / red at <10min)**
`TimerDisplay` in `AuctionCard.tsx` uses `getUrgencyLevel()` with thresholds at `10 * 60 * 1000` ms and `60 * 60 * 1000` ms. Amber tint-pair badge at warning, red tint-pair badge at critical. PASS.
`AuctionCountdown` in `AuctionDetailSheet.tsx` uses identical thresholds. PASS.
Both use tint-pair badge styling (never solid amber or solid red). PASS.

**Flag 6: Hover cards at 820px — no lift clipping**
Grid parent has `pt-1` on both the loading skeleton grid and the main card grid. PASS (code review). Visual confirmation at 820px required by owner.

**Flag 7: Won-card "Yours now!" banner — green tint-pair, not solid green**
`AuctionCard.tsx` line 207: `bg-[var(--green-sub)] text-[var(--green-t)]` with `border: '1px solid var(--green)'`. Tint-pair per-element gate: PASS.

**Flag 8: AuctionWonOverlay — backdrop tap does NOT dismiss**
`onClick={e => e.stopPropagation()}` on the overlay `motion.div` — prevents backdrop tap propagation. PASS. The only dismiss path is the "Go to My Animals" button calling `onGoToAnimals`. PASS.

---

## Defect Register

### DEF-01 — Missing toast variant for "outbid but cannot rebid"

**Severity**: Medium
**Story**: AUC-09 / AUC-11
**Component**: `src/hooks/useAuctions.ts`, `executeNpcCounterBid()`

**Description**: The spec copy table (section 11) defines two distinct outbid toasts:
1. Standard outbid (player can still afford to rebid): "You've been outbid — bid again to stay in."
2. Outbid, cannot rebid: "You've been outbid on [Name] and you're out of coins to bid higher."

The built hook fires toast (1) unconditionally, regardless of whether the player's wallet balance can cover the new minimum bid. Toast (2) is never fired. The "Bid again" button in the sheet correctly shows as disabled with the label "Not enough coins to bid higher" — the visual treatment is correct. The missing piece is the toast copy that fires when Harry is off-screen or not looking at the sheet.

**Reproduction**: Place a bid with a wallet balance close to the minimum. NPC counter-bids, bringing the required rebid above Harry's remaining balance. Outbid toast fires with "bid again to stay in" even though he cannot bid again.

**Expected**: Toast reads "You've been outbid on [Name] and you're out of coins to bid higher."

**Actual**: Toast reads "You've been outbid — bid again to stay in."

**Fix required in**: `executeNpcCounterBid()` — after the NPC bid is written, read the player's current balance and the new minimum bid. If `playerBalance < nextBidAmount`, fire the "out of coins" variant. This requires reading the wallet balance inside `executeNpcCounterBid()` or passing it in.

---

### DEF-02 — AuctionCountdown progress bar does not respect prefers-reduced-motion

**Severity**: High (accessibility)
**Story**: AUC-06 AC (countdown), WCAG 2.1 AA criterion 2.3.3 (animation from interactions)
**Component**: `src/components/auctions/AuctionDetailSheet.tsx`, `AuctionCountdown` component

**Description**: The progress bar inside `AuctionCountdown` uses `transition: 'width 1s linear'` as an inline style. The comment in the code states "On prefers-reduced-motion: no transition (handled via CSS media query)" but no such media query exists in `src/index.css` or anywhere in the codebase. The component does not import or call `useReducedMotion()`. The bar will animate for all users, including those who have `prefers-reduced-motion: reduce` set.

The spec explicitly states: "On `prefers-reduced-motion`: bar updates in discrete steps, no transition animation."

This is a WCAG 2.1 AA violation for users with vestibular disorders who rely on `prefers-reduced-motion`.

**Reproduction**: Open browser devtools, emulate `prefers-reduced-motion: reduce`. Open any auction detail sheet. Observe the progress bar width transition animates smoothly rather than updating in discrete steps.

**Expected**: When `prefers-reduced-motion: reduce`, progress bar has no `transition` — it jumps to new values.

**Actual**: Progress bar always transitions with `1s linear`, regardless of motion preference.

**Fix required in**: `AuctionDetailSheet.tsx`, `AuctionCountdown` component. Import `useReducedMotion` from `@/hooks/useReducedMotion`. Conditionally apply the transition: `transition: reducedMotion ? undefined : 'width 1s linear'`.

---

### DEF-03 — Offline win does not fire "Remember" toast copy

**Severity**: Low (should-fix, not must-fix)
**Story**: AUC-13 (Should priority story)
**Component**: `src/hooks/useAuctions.ts`, `resolveAuctionLoss()` and `resolveAuctionWin()`

**Description**: The spec copy table (section 11) specifies offline-specific toast copy:
- Offline win: "Remember [Name]? You won! Find them in My Animals."
- Offline loss: "Remember [Name]? They went to another home. Your coins are back."

The Developer has documented this gap explicitly in comments at lines 922–927. The standard copy is used for all resolutions, whether online or offline.

For offline win, `resolveAuctionWin()` calls `deliverWonAnimal()` which does not fire a toast — the AuctionWonOverlay fires instead via the `useEffect` watching the `auctions` array. This means a returning player will see the full win overlay, not a toast, which is the better UX for a win. The offline win behaviour is actually acceptable for the win case since the overlay fires regardless.

For offline loss, the toast reads "[Name] went to another home. Your coins are back." without the "Remember" prefix. A returning player who has forgotten about the auction may be confused without the "Remember" context hook.

**Assessment**: AUC-13 is a "Should" priority story. The core delivery (outcome resolved on app open) works correctly. The copy refinement for offline context is a known gap the Developer acknowledged. Not blocking sign-off but must be addressed before Tier 3 completion.

---

## Summary

| Check | Result |
|---|---|
| DS checklist item 1: no emojis | PASS |
| DS checklist item 2: no ghost variant (full codebase) | PASS |
| DS checklist item 3: all colours from var(--...) tokens | PASS |
| DS checklist item 4: surface stack + glass rule | PASS |
| DS checklist item 5: layout at 375px, 768px, 1024px | PASS (code review; visual at 375px requires owner confirmation) |
| DS checklist item 6: pb-24 on scrollable content | PASS |
| DS checklist item 7: pt-4 below PageHeader | PASS |
| DS checklist item 8: navigation controls compact and consistent | PASS |
| DS checklist item 9: animation parameters match spec | FAIL (DEF-02: progress bar ignores reduced-motion) |
| DS checklist item 10: spec-to-build element audit | PASS with DEF-01 logged |

| Defect | Severity | Status |
|---|---|---|
| DEF-01: Missing "out of coins" outbid toast variant | Medium | Must fix before sign-off |
| DEF-02: Progress bar ignores prefers-reduced-motion | High (accessibility) | Must fix before sign-off |
| DEF-03: Offline copy uses standard text not "Remember" prefix | Low | Should fix before Tier 3 completion |

---

## Sign-off

**BLOCKED — Phase D cannot sign off.**

Two defects (DEF-01 and DEF-02) must be resolved before this feature can be marked complete.

DEF-02 is a WCAG 2.1 AA accessibility defect. The Tester cannot sign off on a build that knowingly breaks `prefers-reduced-motion` compliance for a child-facing product. This is a hard block.

DEF-01 is a copy defect that delivers incorrect information to the player during an active auction state. It is not blocking from a data-integrity standpoint but is a user-facing copy deviation from the interaction spec that was written to protect Harry from misleading messaging.

### Required fixes

1. `AuctionDetailSheet.tsx` — `AuctionCountdown` component: import `useReducedMotion`, conditionally suppress `transition` on `width`.
2. `useAuctions.ts` — `executeNpcCounterBid()`: branch on player wallet balance after NPC bid; fire "You've been outbid on [Name] and you're out of coins to bid higher." when `playerBalance < nextBidAmount`.

### On fix and re-test

Dispatch the Developer for both fixes. Tester will re-review the two changed files only (no full re-test required). On confirmation that DEF-01 and DEF-02 are resolved, this sign-off block will be lifted and the feature can proceed to Phase E (done-check).

DEF-03 to be addressed in a follow-up story before Tier 3 completion; it does not block Phase E.

---

> Tester — 2026-03-28
