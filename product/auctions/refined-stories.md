# Refined Stories: Auctions

> Feature: Auctions
> Author: Product Owner
> Status: Ready for Owner approval before Phase C
> Last updated: 2026-03-28
> Supersedes: earlier 2026-03-27 draft (that draft used "saved coins" / "held" framing
> which is explicitly prohibited by UR findings and the updated interaction spec)
> Depends on: BACKLOG.md (status: in_progress), research/auctions/ur-findings.md,
> spec/features/auctions/interaction-spec.md

---

## IMPORTANT: What changed from the 2026-03-27 draft

The previous draft described a "saved coins" / "held amount" mental model. The UR review
(2026-03-28) determined this was dishonest and cognitively risky for Harry. The interaction
spec has been updated accordingly. These stories reflect the corrected mechanic:

- Coins are SPENT at bid time via `spend()`. They are not held.
- If Harry loses, coins are REFUNDED via `earn()`. The refund is animated and visible.
- The display reads "X in bids", never "X held" or "X reserved".
- The `coinsInBids` prop on CoinDisplay is the correct name (not `heldAmount`).

Any developer reading the 2026-03-27 draft must treat it as superseded. These stories
are the authoritative Phase B output.

---

## 1. Feature Summary

Auctions give Harry a daily rotating selection of NPC-listed animals to bid on. These
animals are different from what he can generate — uncommon rarity or above, and some
species are not obtainable through the Generate Wizard at all. That distinction is the
core motivation for using auctions.

When Harry places a bid, coins are spent immediately. NPC competitors may counter-bid
after a short delay. If Harry loses — either outbid and does not re-bid, or the auction
closes with another bidder winning — his coins come back via a visible animated refund.
If he holds the top offer when time runs out, the animal joins his collection.

Losing is framed as the animal going to another home. Harry's coins always come back.
No auction extends its timer under any circumstances.

The feature lives inside the existing Shop tab, not as a new bottom nav slot.

---

## 2. Scope

### In scope

| Area | What is included |
|------|----------------|
| Schema additions | `buyNow?: number` and `minimumIncrement: number` fields on `AuctionItem` (currently missing from schema — Phase C prerequisite) |
| Hook | `useAuctions` — NPC generation, bid placement (spend + write in transaction), NPC counter-bid mechanic, win resolution, loss resolution (refund), coinsInBids derived value |
| Auction Hub screen | Grid of auction cards, filter row, sort, empty state, loading skeletons |
| First-encounter onboarding strip | One-time inline strip above grid (not a modal) |
| Auction Detail sheet | BottomSheet with detail, bid confirm, and buy now confirm states |
| Bid flow | spend() at confirm, AuctionBid write, both in one db.transaction() |
| Re-bid flow | Internal refund of prior bid amount + new spend, both in same transaction |
| NPC counter-bid mechanic | 3–12s delay, max 3–4 NPC bids per auction, 60–65% player win rate target, whimsical rotating names |
| Win resolution | AuctionWonOverlay (portal), animal delivered to My Animals, earn() refund NOT called (player keeps animal, coins already spent) |
| Loss resolution | earn() refund + AuctionBid status update in one db.transaction(), animated coin return, loss toast |
| Won auction card state | Green tint banner "Yours now!", read-only detail sheet, persists until daily rotation |
| Wallet "in bids" display | CoinDisplay extended with optional `coinsInBids` prop, visible globally while Harry has active bids |
| Offline outcome delivery | Toast fires on next app open if Harry was not on-screen when auction closed |
| checkBadgeEligibility() call | Must be called after win resolution — but see known gap note below |

### Out of scope (this tier)

| Area | Reason |
|------|--------|
| Player-to-player bidding | Requires multiplayer infrastructure not in Tier 3 scope |
| Audio of any kind | Hard prohibition — Harry's autism profile makes unexpected sounds a distress risk |
| Push notifications | Outside PWA scope; outcome delivery is in-app toast only |
| Auction history browsing | No archive UI; won cards clear with daily rotation |
| Bid cancellation after confirmation | PO decision: confirmed bids are final (see scope decision below) |
| Anti-snipe timer extensions | Hard prohibition — unexpected reversals are distressing for autistic children |
| Player-listed auctions | Separate backlog item: Player Listings |
| Realistic human NPC names | Hard prohibition — risk of social antagonism for ages 6–9 |

### Scope decision: bid cancellation

Confirmed bids are final. Harry cannot cancel a bid after tapping "Confirm bid". Rationale:

1. The NPC auction relies on Harry's committed offer to function as competition; cancellation
   would break the mechanic.
2. The two-step confirm flow (tap "Place a bid" then tap "Confirm bid") is the correct
   prevention mechanism, not post-confirmation reversal.
3. The spec explicitly states: "Once confirmed, your bid cannot be cancelled" — this copy
   must appear on the confirm screen so Harry knows before he commits.

If evidence emerges that Harry is distressed by being locked in, revisit as a separate
story in Tier 4.

### Known gap: checkBadgeEligibility() is a stub

`checkBadgeEligibility()` in `src/hooks/useProgress.ts` (line 138–140) unconditionally
returns `[]`. Auctions are a badge-eligible event per CLAUDE.md. The Developer must call
`checkBadgeEligibility()` after win resolution in `useAuctions`, but the call will not
unlock any badges until the stub is replaced with real logic.

This is a pre-existing defect tracked separately — it is not caused by the auctions
feature and must not block Phase C. The call must still be made (and must not be silently
swallowed if it throws). Logging a comment in the hook code to document the known
limitation is required.

### Schema gap: AuctionItem missing fields

`AuctionItem` in `src/lib/db.ts` is missing two fields required by the interaction spec:

- `buyNow?: number` — optional buy-now price; when absent, buy-now row is not shown
- `minimumIncrement: number` — the minimum amount by which each bid must exceed the
  current bid; the hook uses this to set the stepper floor

The Developer must add these fields to the schema (and a Dexie migration version bump)
as part of Story AUC-01. Phase C cannot begin without them.

---

## 3. Story map

| Epic | Story ID | Story title | Priority | Depends on |
|------|----------|-------------|----------|------------|
| Foundation | AUC-01 | Schema additions and useAuctions hook foundation | Must | — |
| Foundation | AUC-02 | NPC auction generation | Must | AUC-01 |
| Hub | AUC-03 | Auction Hub screen and AuctionCard component | Must | AUC-01 |
| Hub | AUC-04 | First-encounter onboarding strip | Must | AUC-03 |
| Hub | AUC-05 | Wallet "coins in bids" display (CoinDisplay extension) | Must | AUC-01 |
| Bidding | AUC-06 | Auction Detail sheet | Must | AUC-01, AUC-03 |
| Bidding | AUC-07 | Bid flow (spend + record in transaction) | Must | AUC-06 |
| Bidding | AUC-08 | Re-bid flow (internal refund + new spend) | Must | AUC-07 |
| Competition | AUC-09 | NPC counter-bid mechanic | Must | AUC-07 |
| Resolution | AUC-10 | Win resolution (overlay + animal delivery) | Must | AUC-09 |
| Resolution | AUC-11 | Loss resolution (earn refund + animated return + toast) | Must | AUC-09 |
| Resolution | AUC-12 | Won auction card state | Must | AUC-10 |
| Resolution | AUC-13 | Offline outcome delivery | Should | AUC-10, AUC-11 |

---

## 4. Stories

---

### AUC-01 — Schema additions and useAuctions hook foundation

As Harry playing Animal Kingdom,
I need the auction system to track what is for sale, what I bid, and who won,
So that the feature can show me the right animals, record my bids safely, and give me
my coins back if I don't win.

**Acceptance criteria:**

- [ ] `AuctionItem` in `src/lib/db.ts` has a `buyNow?: number` field (optional).
- [ ] `AuctionItem` in `src/lib/db.ts` has a `minimumIncrement: number` field (required).
- [ ] Both fields are added via a Dexie version migration (version bump with schema string).
      Existing records without these fields must not cause a runtime error — Dexie applies
      default `undefined` to optional fields gracefully.
- [ ] A `useAuctions` hook exists at `src/hooks/useAuctions.ts`.
- [ ] The hook exposes: `auctions: AuctionItem[]`, `playerBids: Record<number, number>`,
      `coinsInBids: number`, `placeBid(auctionId: number, amount: number): Promise<void>`,
      `buyNow(auctionId: number): Promise<void>`, `refreshAuctions(): Promise<void>`.
- [ ] `coinsInBids` is computed by summing `AuctionBid.amount` for all bids where
      `bidder === 'player'` and the corresponding `AuctionItem.status === 'active'`. This
      query runs via `useLiveQuery` so it updates reactively. It is NOT a wallet state
      field — it is derived from the bid and auction tables.
- [ ] The hook does not expose a `heldAmount` prop or any equivalent. The prop name
      `coinsInBids` is the only permitted name for this derived figure.
- [ ] All async operations in the hook are wrapped in `try/catch` blocks that call
      `toast({ type: 'error', ... })` with a user-facing message. Silent swallows
      (`.catch(() => {})` or similar) are a build defect and must not appear.
- [ ] The hook file contains a code comment documenting the `checkBadgeEligibility()`
      stub limitation (pre-existing defect, returns `[]` unconditionally).

**Definition of done:**

- Schema compiles with no TypeScript errors.
- Dexie migration does not throw on first open against an existing database.
- Hook exports match the specified signature exactly.
- Hook file reviewed by Developer against CLAUDE.md error-handling rules before PR.

**Out of scope:**

- NPC auction generation logic (AUC-02).
- Any UI component.

---

### AUC-02 — NPC auction generation

As Harry playing Animal Kingdom,
I need the auction hub to show me a fresh selection of animals each day,
So that there is always something new to discover and bid on.

**Acceptance criteria:**

- [ ] `refreshAuctions()` in `useAuctions` generates a set of 3–5 `AuctionItem` records
      when none exist for the current day (checked by comparing `AuctionItem.endsAt` to
      the current date).
- [ ] Every generated auction animal is at `uncommon` rarity or above. Common-rarity
      animals must never appear in the auction pool.
- [ ] At least one auction in each daily batch must be `rare` rarity or above. The
      motivation hook (UR finding: "these animals are different from generate") requires
      a visible high-rarity option to be present.
- [ ] At least one auction animal per batch must be flagged as exclusive (a breed not
      in the Generate Wizard pool). The hook must distinguish `exclusive` vs `rare find`
      animals (the card component uses this to display the correct label).
- [ ] Each auction has a duration of 4–24 hours (`endsAt` set at generation time).
      Duration varies to create a mix of short-lived and overnight auctions.
- [ ] `startingBid` values per rarity tier are within the following ranges (calibrated
      against the coin economy — these are PO decisions, not developer choices):
      - Uncommon: 80–150 coins
      - Rare: 200–400 coins
      - Epic: 500–900 coins
      - Legendary: 1,000–2,000 coins
- [ ] `minimumIncrement` per rarity tier:
      - Uncommon: 20 coins
      - Rare: 50 coins
      - Epic: 100 coins
      - Legendary: 200 coins
- [ ] `buyNow` price (when present — not required on every auction): set at 2.5× the
      `startingBid` for that rarity tier. Present on approximately 50% of generated
      auctions (randomised at generation time).
- [ ] NPC names assigned to auctions come from a fixed pool of whimsical, non-human
      names: "The Collector", "Wild Wanderer", "Safari Seeker", "The Naturalist",
      "Field Notes", "The Expedition". No realistic human names are in this pool.
- [ ] Within a single generation batch, no NPC name repeats as the seller across two
      auctions. Rotation is enforced at generation time.
- [ ] `refreshAuctions()` is called once when the hook mounts and `auctions` is empty
      or all existing auctions have expired.
- [ ] Errors in `refreshAuctions()` surface via `toast({ type: 'error', ... })`. They
      must not silently fail.

**Definition of done:**

- A call to `refreshAuctions()` in isolation produces 3–5 `AuctionItem` records in the
  database with no TypeScript errors.
- All generated items have `rarity` of `uncommon` or above — verified by a manual spot
  check across 10 generation calls.
- At least one exclusive item present in every batch — verified by spot check.
- Bid ranges and increments match the PO-specified table above.

**Out of scope:**

- Admin tooling to manually set auction contents.
- Any animal images beyond what the existing image system provides.

---

### AUC-03 — Auction Hub screen and AuctionCard component

As Harry,
I need to see what animals are up for auction in a clear, easy-to-browse grid,
So that I can quickly spot animals I want and decide whether to bid.

**Acceptance criteria:**

- [ ] Route `/auctions` renders `AuctionHubScreen`.
- [ ] The screen is accessed via the "Auctions" tab in the `centre` slot of the
      PageHeader on the Shop screen. The Shop screen passes `activeTab` as a prop.
      `AuctionHubScreen` does not render its own tab control (dual navigation is a
      build defect).
- [ ] Content container class string is exactly: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`.
      `pt-4` is mandatory — do not reduce.
- [ ] Grid layout: `grid-cols-1` at 375px, `grid-cols-2 gap-5` at 768px and above.
      Stays at 2 columns at 1024px (within the `max-w-3xl` column).
- [ ] Grid parent has `pt-1` to prevent card lift animation clipping (spec section 13).
- [ ] A section label "LIVE NOW" (hairline, uppercase) appears above the grid.
- [ ] Loading state: 4 skeleton cards (`--elev` bg, pulse animation). Reduced-motion:
      static (no pulse).
- [ ] Empty state: `AuctionEmptyState` component with Lucide `Gavel` 48px `--t4`,
      "No auctions right now" heading, "New animals arrive every day. Check back soon!"
      description. No CTA.
- [ ] Each `AuctionCard` displays: hero image (16:9, top-radius only), animal name
      (15px/600/--t1), RarityBadge (tint-pair — no solid fill), current bid (Coins icon
      13px + amount 14px/700/--amber-t), and time-remaining in the correct urgency state.
- [ ] Time remaining urgency on cards:
      - More than 1 hour: `--t3` text, 13px/400.
      - 10 min to 1 hour: amber tint pair badge (`--amber-sub` bg, `--amber-t` text, 12px/600).
      - Under 10 min: red tint pair badge (`--red-sub` bg, `--red-t` text).
      Urgency badges use tint-pair, never solid amber or solid red.
- [ ] Rarity left border treatment: 4px left border on the card body in the rarity solid
      colour (per the colour pair table in interaction-spec section 3).
- [ ] Rarity body background tint applied at 50% opacity on the body section for uncommon
      and above (per colour pair table).
- [ ] Exclusive / rarity differentiation label shown on cards where applicable:
      "Exclusive" or "Rare find" as an 11px/600 pill using the rarity tint-pair colour.
      The label is not shown if neither condition applies (in practice, all auction animals
      at uncommon+ should qualify).
- [ ] If Harry has an active bid on an auction, the card shows a "Your bid" pill (amber
      tint pair, 12px/600, pill radius) beneath the bid row. This is driven by
      `playerBids` from `useAuctions` — no separate state required.
- [ ] Won card state (after animal delivered): the card shows a green tint banner across
      the top of the body section. Banner text: "Yours now!" (12px/600/--green-t,
      `--green-sub` bg, `1px solid var(--green)`). Card CTA is suppressed — tap opens
      read-only detail sheet.
- [ ] Filter pills in the `below` slot use the `CategoryPills` tint-pair pattern:
      active = `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`.
      Filter options: All | Uncommon | Rare | Epic | Legendary. (Common omitted — auction
      rarity floor means common animals never appear.)
- [ ] Sort control (outline sm, `ChevronDown` 16px, right-aligned `ml-auto shrink-0`)
      offers: "Ending soon" (default), "Lowest bid", "Highest bid", "Rarest first".
- [ ] Filter pills and sort control share one row. No wrapping at 768px or above.
- [ ] Hover state on `AuctionCard` matches the DS pattern exactly:
      `motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300`.
- [ ] Focus state on `AuctionCard`: `outline: 2px solid var(--blue); outline-offset: 2px`.
- [ ] No `ghost` variant used anywhere in this screen or its sub-components.
- [ ] No hardcoded hex values. All colours trace to `var(--...)` DS tokens.
- [ ] No emojis in JSX or data files. Icons are Lucide only.
- [ ] Layout verified at 375px, 768px, and 1024px before Phase C is marked complete.

**Definition of done:**

- Screen renders at all three breakpoints without layout failures.
- FE self-review checklist completed (10-point DS checklist including card hover clip check).
- Card hover verified at 820px (Harry's actual device width).

**Out of scope:**

- Auction Detail sheet (AUC-06).
- Onboarding strip (AUC-04).
- Wallet display extension (AUC-05).

---

### AUC-04 — First-encounter onboarding strip

As Harry visiting auctions for the first time,
I need a brief plain-language explanation of how bidding works,
So that I understand what to do without a tutorial or a blocking modal.

**Acceptance criteria:**

- [ ] On the very first visit to `/auctions`, an inline explainer strip is shown above
      the "LIVE NOW" section label.
- [ ] The strip copy is exactly: "Find an animal you love and offer the most coins before
      the timer ends — and it's yours! These are rare animals you can't get any other way."
      No deviation from this copy.
- [ ] Strip styling: `--elev` bg, `var(--r-md)` border radius, `p-3` (12px padding),
      14px text, `--t2` colour. No icon. No heading. No dismiss button.
- [ ] The strip disappears automatically after the first session (does not re-appear on
      subsequent visits). First-visit state is stored in `localStorage` (key:
      `auctions_onboarding_seen`). Once set, the strip is never shown again.
- [ ] On second and subsequent visits, the page opens directly to the grid with no strip.
- [ ] The strip is not a modal, not a BottomSheet, and not a toast. It is purely inline.
- [ ] The strip does not block interaction with the grid below it.

**Definition of done:**

- Strip appears on first visit, absent on second visit, in a fresh browser session.
- Copy matches the specified string exactly.
- No dismiss button required or present.

**Out of scope:**

- Re-triggerable help text or "How auctions work" link (future feature if needed).

---

### AUC-05 — Wallet "coins in bids" display

As Harry,
I need to see how many coins I currently have in active bids,
So that I always know where my coins are and don't think I've lost them permanently.

**Acceptance criteria:**

- [ ] The existing `CoinDisplay` component accepts a new optional prop: `coinsInBids: number`.
      The prop name must be `coinsInBids`. The name `heldAmount` is explicitly prohibited
      and is a build defect if it appears anywhere in the codebase.
- [ ] When `coinsInBids > 0`, the CoinDisplay renders an additional line below the main
      balance pill: "[X] in bids" at 11px/500/--t3, centred. Example: "120 in bids".
      The word "held" does not appear. The word "reserved" does not appear.
- [ ] When `coinsInBids === 0`, the additional line is not rendered. The CoinDisplay
      reverts to its existing appearance.
- [ ] The "in bids" figure is visible on ALL screens while Harry has active bids — not
      only on the auction screens. The `coinsInBids` value is passed from `useAuctions`
      to the top-level layout that renders the PageHeader CoinDisplay.
- [ ] At 375px, if the combined display would truncate, the two-line layout is used (main
      balance on one line, "X in bids" on a second line below). FE must verify at 375px.
- [ ] When Harry loses an auction and coins are refunded, the CoinDisplay plays the
      existing earn animation (coin-in visual, balance increment). The "in bids" figure
      decreases simultaneously with the refund. The refund is never silent.
- [ ] The `coinsInBids` value is derived from `useAuctions` (summing active bid amounts)
      — it is not read from the `PlayerWallet` table, which has no `heldCoins` field.

**Definition of done:**

- CoinDisplay renders correctly with and without `coinsInBids` at all breakpoints.
- Verified that "held" and "reserved" do not appear anywhere in the new code.
- Earn animation fires on refund — verified by triggering a test loss.

**Out of scope:**

- Breakdown of which auctions hold which coin amounts (future "bid details" view).

---

### AUC-06 — Auction Detail sheet

As Harry,
I need to open an auction and see all the information about it — the animal, the current
bid, how long is left, and what other bidders have done,
So that I can decide whether to place a bid.

**Acceptance criteria:**

- [ ] Tapping an `AuctionCard` opens `AuctionDetailSheet` (uses the existing `BottomSheet`
      component; glass surface rule applies: `rgba(13,13,17,.88)` + `backdrop-filter:
      blur(24px)` + `1px solid rgba(255,255,255,.06)`).
- [ ] BottomSheet is rendered via `ReactDOM.createPortal(content, document.body)`. FE
      must verify the existing BottomSheet component already does this — do not assume.
- [ ] Detail view layout (top to bottom): hero image (16:9), animal name H4 + RarityBadge
      row, category badge, divider, CURRENT BID label + H3 amount (28px/700/--amber-t) +
      Coins icon 20px, BUY NOW row (visible only when `buyNow` is set), YOUR BID row
      (visible only when player has an active bid), OUTBID BANNER (amber tint, visible
      when player is outbid and auction still active), RECENT BIDS section +
      `BidHistoryList` (last 3 bids), `AuctionCountdown`, divider, CTA buttons.
- [ ] `AuctionCountdown` component:
      - Digital format: "2h 14m" or "9m 32s", 14px/700, colour per urgency table.
      - Sentence: "Ends in about [Xh]" / "Ending very soon!" / "Auction ended" in
        `aria-live="polite"` region, updates every 30 seconds.
      - Progress bar: 4px height, full width, fills from left (full = most time left,
        drains to zero). Colours: green (> 1hr), amber (10min–1hr), red (< 10min).
      - No shake animation, no pulse, no flash at any threshold (CLAUDE.md prohibition
        on urgency animations for Harry).
      - Reduced-motion: bar updates in discrete steps, no transition animation.
- [ ] `BidHistoryList` shows last 3 bids, newest first. Each row: bidder name
      (13px/400/--t2) + amount (Coins icon 11px + 13px/700/--amber-t) + time-ago
      (11px/500/--t3). Player's own bid rows show "You" in `--blue-t`. No dividers
      between rows. Top border: `1px solid var(--border-s)`.
- [ ] OUTBID BANNER copy when auction still active: "You've been outbid — bid again to
      stay in." This banner must NOT say "Your coins are back" — coins have not been
      refunded while the auction is still running.
- [ ] YOUR BID row has `--amber-sub` background tint, 8px vertical padding, `var(--r-sm)`.
- [ ] "Place a bid" button: `variant="accent"` (pink), `size="lg"`, `w-full`. Shown when
      player has no active bid.
- [ ] "Bid again" button: `variant="accent"`, `size="lg"`, `w-full`. Shown when player
      is outbid. Disabled with label "Not enough coins to bid higher" when player cannot
      afford the new minimum.
- [ ] "Auction ended" button: disabled outline, shown when auction `status !== 'active'`.
- [ ] "Buy now for [X] coins" button: `variant="primary"` (blue), `size="lg"`, `w-full`.
      Visible only when `buyNow` is set and auction is active.
- [ ] Closing the sheet mid-bid (before confirming): no bid is placed, no coins are spent,
      sheet closes cleanly. On next open, detail view is shown (not BidConfirmState).
      Stepper amount resets to current minimum. No notification of "nothing happened" is
      shown.
- [ ] Close-mid-bid behaviour must be covered by a specific acceptance test in
      `tests/auctions/test-results.md`.
- [ ] Won auction detail (read-only mode): when `auction.status === 'won'`, the sheet
      opens in a read-only state. CTA buttons are suppressed. A "Find them in My Animals"
      link is shown.
- [ ] Focus management: on sheet open, focus moves to "Place a bid" (or the auction-ended
      heading sibling if auction closed). On sheet close, focus returns to the tapped card.
      Focus must be trapped inside the sheet while open.
- [ ] All copy matches the copy direction table in interaction-spec section 11 exactly.
- [ ] No `ghost` variant, no hardcoded hex, no emojis.

**Definition of done:**

- Sheet opens and closes without layout errors at 375px and 820px.
- All five sheet states (detail, bid confirm, buy now confirm, outbid, won/read-only)
  manually tested and documented in test-results.md.
- Close-mid-bid scenario tested explicitly.

**Out of scope:**

- `BidConfirmState` and `BuyNowConfirmState` layouts (part of AUC-07).
- The bid placement transaction (AUC-07).

---

### AUC-07 — Bid flow (spend + record in transaction)

As Harry,
I need placing a bid to deduct my coins immediately and record my offer,
So that my bid is real and visible to other bidders, and I understand coins have left
my wallet.

**Acceptance criteria:**

- [ ] Tapping "Place a bid" or "Bid again" opens `BidConfirmState` within the sheet.
- [ ] `BidConfirmState` layout: Back button (ChevronLeft 20px + "Back", outline sm),
      "Confirm your bid" heading (H4, 22px/600/--t1), coin amount display block
      (`--elev` bg, `var(--r-md)`, p-20px, Coins icon 24px --amber + amount
      40px/700/--amber-t centred), stepper row (`[−]` / amount display / `[+]`,
      gap-12px), minimum bid note ("The minimum bid is [X] coins", 13px/--t3), remaining
      balance note ("You'll have [Y] coins left", 13px/--t2), low-balance warning
      (amber tint pair, visible when remaining balance after bid < 100 coins, copy:
      "You'll be almost out of coins!"), insufficient-coins error (red tint pair, inline
      in sheet, copy: "You don't have enough coins" — not a toast), "Confirm bid"
      button (accent pink lg w-full), "Cancel" button (outline md w-full).
- [ ] Stepper: `[+]` increments by `minimumIncrement`. `[−]` decrements to minimum
      (`currentBid + minimumIncrement`), never below. No upper cap other than wallet
      balance. Amount display is read-only — not a freeform input.
- [ ] `[−]` is disabled (opacity 0.4) when stepper is at the minimum bid. `[+]` has
      no disabled state.
- [ ] Minimum touch target on stepper buttons: `min-h-[44px] min-w-[44px]`.
- [ ] Tapping "Confirm bid" calls `placeBid(auctionId, amount)`.
- [ ] Inside `placeBid`: `spend()` and the `auctionBids.add()` write are executed inside
      a single `db.transaction('rw', db.playerWallet, db.transactions, db.auctionBids,
      db.auctionItems, ...)`. The `spend()` call and the bid record write must be atomic.
      If `spend()` fails (insufficient coins), no bid record is written. If the bid record
      write throws, the wallet deduction must be rolled back. This is a transaction
      integrity requirement — a violation is a build defect per CLAUDE.md.
- [ ] While submitting ("Confirm bid" tapped, awaiting resolution): "Confirm bid" button
      shows `Loader2` spinner and is disabled. Stepper is hidden.
- [ ] On bid success: sheet returns to detail view. "YOUR BID" row is now visible.
      Wallet balance is reduced. `coinsInBids` updates reactively.
- [ ] On bid failure (insufficient coins): inline red error "You don't have enough coins"
      appears below the confirm button. No toast. Sheet stays in BidConfirmState.
- [ ] On bid failure (race condition — NPC bid arrived during confirm): toast fires:
      "Someone just outbid you. Try a higher amount." Sheet stays open in BidConfirmState
      with the new minimum reflected.
- [ ] "Cancel" taps back to detail view with no changes. "Back" does the same.
- [ ] No coins are spent if the player taps "Cancel" or "Back" before confirming.
- [ ] Buy-now flow: tapping "Buy now for [X] coins" opens `BuyNowConfirmState`. Layout
      matches `BidConfirmState` but without stepper (amount is fixed). Confirming calls
      `buyNow(auctionId)`. Transaction pattern is the same: `spend()` and writes in a
      single `db.transaction()`. On success, `AuctionWonOverlay` fires immediately.
- [ ] `placeBid` is wrapped in `try/catch` that calls `toast({ type: 'error', ... })`.
      Silent swallows are a build defect.

**Definition of done:**

- Transaction boundary verified by Developer code review: `spend()` and `auctionBids.add()`
  are inside the same `db.transaction()` call — not sequentially awaited outside one.
- Bid success, cancel, and both error paths (insufficient coins, race condition) manually
  tested and documented in test-results.md.
- Race condition path triggered by test tooling or manual timing.

**Out of scope:**

- Re-bid flow when Harry is outbid (AUC-08).
- NPC counter-bid scheduling (AUC-09).

---

### AUC-08 — Re-bid flow (internal refund + new spend in transaction)

As Harry,
I need to be able to place a higher bid after I've been outbid,
So that I can stay in the running for an animal I want.

**Acceptance criteria:**

- [ ] When Harry has an active bid and the NPC outbids him, the OUTBID BANNER is shown
      in the detail sheet ("You've been outbid — bid again to stay in.").
- [ ] Tapping "Bid again" opens `BidConfirmState` with the new minimum
      (`currentBid + minimumIncrement`).
- [ ] The `placeBid` function, when called with a player who already has an active bid
      on the same auction, executes the following atomically inside one `db.transaction()`:
      1. Refund (`earn()`) the amount of the previous active bid.
      2. Spend (`spend()`) the new bid amount.
      3. Update the prior `AuctionBid` record's `amount` (or write a new record and mark
         the old one superseded — Developer's choice, but the old bid must not remain as
         an active bid at the old amount).
      4. Update `AuctionItem.currentBid` and `AuctionItem.currentBidder`.
      All four operations must be within a single `db.transaction()`. If any step fails,
      all must roll back. This is a transaction integrity requirement — a violation is a
      build defect.
- [ ] After re-bid success: "YOUR BID" row updates to the new amount. `coinsInBids`
      updates reactively (reflects only the new bid amount, not old + new).
- [ ] The refund of the prior bid amount triggers the earn animation in `CoinDisplay`
      briefly before the new spend animation plays (the net effect on the balance may
      be a small increase if the re-bid increment is small — this is correct behaviour,
      not a bug).
- [ ] If the player cannot afford the new minimum: "Bid again" button is disabled with
      label "Not enough coins to bid higher". The player cannot reach `BidConfirmState`
      from this disabled state.
- [ ] All error paths (insufficient coins after prior bid, race condition) handled with
      toast as per AUC-07 patterns.

**Definition of done:**

- Re-bid transaction boundary verified by Developer: all four atomic operations inside
  one `db.transaction()` call.
- Re-bid success, disabled state (can't afford), and race condition paths documented in
  test-results.md.

**Out of scope:**

- NPC counter-bid scheduling (AUC-09).

---

### AUC-09 — NPC counter-bid mechanic

As Harry,
I need NPCs to bid after me after a short delay,
So that the auction feels like a real competition and winning feels earned.

**Acceptance criteria:**

- [ ] After Harry places a bid, the hook schedules an NPC counter-bid with a delay of
      3–12 seconds (randomised per bid event, not per auction).
- [ ] Delay must not be below 3 seconds. Below 3 seconds feels instant and threatening
      for the target age group (UR finding — confidence: high). This lower bound is a
      hard constraint.
- [ ] The NPC has a per-rarity bid budget ceiling. Once the ceiling is reached, the NPC
      does not bid again on that auction. Ceilings (PO decision):
      - Uncommon: 200 coins maximum total NPC spend
      - Rare: 600 coins
      - Epic: 1,400 coins
      - Legendary: 3,000 coins
- [ ] Maximum NPC bids per auction: 3–4 total (across all NPC bid events, not per player
      bid). Once the cap is reached, the NPC is silent for the remainder of the auction.
- [ ] NPC bids are recorded as `AuctionBid` records with `bidder` set to the NPC name
      and `amount` set to `currentBid + minimumIncrement`.
- [ ] `AuctionItem.currentBid` and `AuctionItem.currentBidder` are updated atomically
      with the NPC bid record inside a `db.transaction()`.
- [ ] When the NPC outbids Harry: an outbid toast fires immediately (before the delay
      expires is not possible — the toast fires on the NPC bid event, which occurs after
      the delay). Toast copy: "You've been outbid — bid again to stay in." This toast
      must NOT say "Your coins are back" — Harry's coins are still spent and will only
      return if he loses the auction entirely.
- [ ] The NPC bidder name on this auction rotates within the session. The same NPC name
      must not appear as the competing bidder in two consecutive auctions within the same
      session.
- [ ] The NPC bid mechanic is simulated client-side by the hook (no server required).
- [ ] When Harry is on a different screen when the outbid toast fires, the toast still
      appears (global toast system — existing pattern).
- [ ] Target player win rate of 60–65%: the NPC budget ceiling calibrated per-rarity
      above is the mechanism. The Developer must not add additional win-rate tuning
      logic that is not visible in the budget ceiling. If the ceiling values need
      adjustment after testing, the PO will update this story.

**Definition of done:**

- NPC bid fires after correct delay range (verified by timing logs during testing).
- NPC cap enforced: after 3–4 NPC bids, NPC is silent even if Harry keeps bidding.
- Outbid toast copy does not include "Your coins are back" — verified by Tester.
- Budget ceilings match the PO table above.

**Out of scope:**

- Win and loss resolution (AUC-10, AUC-11).

---

### AUC-10 — Win resolution (overlay, animal delivery, badge check)

As Harry,
I need to know immediately when I win an auction, and find the animal in My Animals,
So that winning feels like a genuine, memorable moment.

**Acceptance criteria:**

- [ ] When `AuctionItem.endsAt` is reached and Harry is the `currentBidder`, the hook
      triggers win resolution.
- [ ] Win resolution actions (all inside a single `db.transaction()`):
      1. Set `AuctionItem.status` to `'won'`.
      2. Write the new animal to the `animals` table (the auction animal is now Harry's).
      3. No `earn()` call — Harry's bid coins were spent at bid time and are not refunded
         on a win.
- [ ] `AuctionWonOverlay` fires immediately after win resolution. The overlay is rendered
      via `ReactDOM.createPortal(content, document.body)`. It must fire regardless of
      which screen Harry is currently on.
- [ ] Overlay layout: `var(--grad-hero)` background (135deg, #E8247C → #3772FF), fixed
      inset 0, z-9999. Animal image 160×160px (120×120px at 375px), "You won!" H1
      (48px/700/--t1), "[Animal name] is yours!" H3 (28px/600/--t1), "[X] coins spent"
      (Coins icon 14px + 14px/--t2), "Go to My Animals" accent button (pink, lg).
- [ ] Overlay entrance animation: opacity 0→1 (300ms ease-out), animal image scale 0.8→1
      + opacity 0→1 (spring: stiffness 300, damping 28). Reduced-motion: fade only,
      no scale animation.
- [ ] Optional coin particles: CSS `@keyframes float-up` burst. On `prefers-reduced-motion`,
      particles are not rendered. Particles must not block interaction.
- [ ] Backdrop tap does NOT dismiss the overlay. The only exit is tapping "Go to My
      Animals". This is intentional — an accidental dismiss of a celebration moment is
      distressing for autistic children (UR finding — hard constraint).
- [ ] Tapping "Go to My Animals" dismisses the overlay and navigates to `/animals`.
- [ ] `checkBadgeEligibility()` is called after win resolution completes (non-blocking,
      fire-and-forget). The call must use `.catch(err => toast({ type: 'error', ... }))`
      to handle errors — silent swallows are a build defect. The call will return `[]`
      unconditionally until the stub is replaced (see known gap note in AUC-01).
- [ ] The AuctionWonOverlay must be a sibling of — not a descendant of — any
      `<AnimatePresence mode="wait">` block. It must have its own `<AnimatePresence>`
      wrapper (Framer Motion CLAUDE.md rule for independent overlays).
- [ ] The overlay `position: fixed` is inside a `createPortal` call — verified by FE
      self-review (CLAUDE.md portal rule).

**Definition of done:**

- Win overlay fires on the correct screen (tested while Harry is on /animals, /explore,
  and /auctions — overlay must appear on all three).
- Backdrop-tap tested: overlay must not dismiss.
- "Go to My Animals" navigates correctly.
- Animal appears in My Animals after win.
- `checkBadgeEligibility()` call present in hook code (confirmed by code review).
- Transaction boundary verified: `AuctionItem.status` update and animal write are in
  one `db.transaction()`.

**Out of scope:**

- Loss resolution (AUC-11).

---

### AUC-11 — Loss resolution (earn refund + animated return + toast)

As Harry,
I need to know when I didn't win an auction, and see my coins come back,
So that losing feels gentle, not punishing, and I'm not left confused about where
my coins went.

**Acceptance criteria:**

- [ ] When `AuctionItem.endsAt` is reached and Harry is NOT the `currentBidder` (and
      Harry had at least one bid on the auction), the hook triggers loss resolution.
- [ ] Loss resolution actions (all inside a single `db.transaction()`):
      1. Set `AuctionItem.status` to `'lost'`.
      2. Call `earn()` to refund Harry's last active bid amount.
      3. The `earn()` call and the `AuctionItem.status` update must be in one
         `db.transaction()`. This is a transaction integrity requirement — a violation
         is a build defect.
- [ ] The `earn()` refund triggers the existing earn animation in `CoinDisplay` (coin-in
      visual, balance increment). The refund must not arrive as a silent balance change.
- [ ] The `coinsInBids` figure updates (decreases by the refunded amount) simultaneously
      with the earn animation.
- [ ] A warning toast fires after loss resolution: "[Name] went to another home. Your
      coins are back." — amber styling (warning type). No overlay.
- [ ] If Harry was offline when the auction closed, the toast fires on next app open.
      Offline loss toast copy: "Remember [Name]? They went to another home. Your coins
      are back."
- [ ] The word "lost" does not appear in any copy. "Lost" is a build defect in this
      feature's copy.
- [ ] The loss toast uses amber styling (warning type), never red. Red is not used for
      loss events.
- [ ] "Your coins are back" appears ONLY in the final loss toast. It must not appear in
      the during-auction outbid banner (where coins have not yet been refunded).
- [ ] If Harry had no bid on the auction (auction closed with zero player bids), no toast
      is fired and no refund is processed.
- [ ] `checkBadgeEligibility()` is NOT called after a loss — badge eligibility in this
      feature is win-only.

**Definition of done:**

- Refund earn animation verified by Tester (balance visibly increments, not silent).
- Loss toast copy verified: "went to another home", "Your coins are back", no "lost".
- Transaction boundary verified: `earn()` and `AuctionItem.status` update in one
  `db.transaction()`.
- Offline path tested by closing the app before auction ends, reopening after.

**Out of scope:**

- Won card state rendering (AUC-12).

---

### AUC-12 — Won auction card state

As Harry,
I need to see that an auction I won is now mine in the grid,
So that winning doesn't just silently disappear — I can see the confirmation until
the next batch of auctions arrives.

**Acceptance criteria:**

- [ ] When `AuctionItem.status === 'won'` and the animal has been delivered to My Animals,
      the `AuctionCard` renders a "Yours now!" banner.
- [ ] Banner: across the top of the body section (not the image). Text: "Yours now!"
      12px/600/`--green-t`. Background: `var(--green-sub)`. Border: `1px solid var(--green)`.
      This is a tint-pair — no solid `var(--green)` background with white text (that would
      be a DS badge violation).
- [ ] The card's "Place a bid" / "Bid again" CTA is suppressed — no bid buttons on won cards.
- [ ] Tapping a won card opens the detail sheet in read-only mode. The sheet shows:
      animal image, name, rarity, final bid amount (YOUR BID row, non-interactive), and a
      "Find them in My Animals" link (outline sm, not a full-width button).
- [ ] The won card persists in the grid for the remainder of that day's auction cycle.
      It is removed when `refreshAuctions()` generates the next day's batch.
- [ ] Won cards do not move to a separate "past auctions" section. They remain in the
      main grid. The green banner distinguishes them from active auctions.
- [ ] If Harry taps "Find them in My Animals" from the read-only sheet, navigation goes
      to `/animals`.

**Definition of done:**

- Won card banner is green tint-pair (verified against DS — no solid green fill).
- CTA suppression verified: no bid button appears on won card.
- Read-only sheet opens and shows correct content.
- Card cleared on next daily refresh (verified by manually triggering a refresh).

**Out of scope:**

- An archive or history of past won auctions.

---

### AUC-13 — Offline outcome delivery

As Harry,
I need to find out what happened to an auction I bid on if I wasn't using the app
when it ended,
So that I don't open the app to a confusing surprise, and I always know my coins
came back.

**Acceptance criteria:**

- [ ] On each app open, `useAuctions` checks for auctions with `status === 'active'` and
      `endsAt` in the past that have not yet been resolved.
- [ ] For each such auction, the hook runs win or loss resolution (per AUC-10 and AUC-11
      logic respectively) before rendering the hub screen.
- [ ] Win toast (offline path) copy: "Remember [Name]? You won! Find them in My Animals."
- [ ] Loss toast (offline path) copy: "Remember [Name]? They went to another home. Your
      coins are back."
- [ ] Offline win: `AuctionWonOverlay` fires as the app opens (same portal mechanism as
      online win). The overlay must not appear while the app is in a loading/splash state
      — it fires after the main screen is mounted.
- [ ] Offline loss: warning toast only (no overlay). Same amber styling as the online
      path.
- [ ] If Harry had no active bid on the closed auction, no toast fires.
- [ ] Multiple offline outcomes (e.g. two auctions closed while Harry was away) must
      fire sequentially, not simultaneously. Each toast waits for the previous to dismiss.

**Definition of done:**

- Offline win path tested: close app, wait for auction to expire, reopen — overlay and
  animal delivery verified.
- Offline loss path tested: close app, wait, reopen — toast and refund verified.
- Multiple-outcome ordering tested with two simultaneous expired auctions.

**Out of scope:**

- Push notifications (outside PWA scope).
- Auction history browsing.

---

## 5. Non-functional constraints applying to all stories

These apply to Phase C (Developer + FE) across every story above.

### Transaction integrity (hard)

Any function that calls `spend()` must wrap `spend()` AND all DB writes that represent
what was purchased in a single `db.transaction('rw', ...)`. Sequential `await spend(...)` +
`await db.table.add(...)` outside a transaction is a build defect per CLAUDE.md.

Any function that calls `earn()` as a refund must wrap `earn()` AND the status update
that triggered the refund in a single `db.transaction()`.

### Error handling (hard)

Every async operation must be wrapped in `try/catch` that calls `toast({ type: 'error',
... })` with a user-facing message. The following patterns are build defects:
- `.catch(() => {})` or any silent swallow
- `catch (e) { console.log(e) }` without a toast
- Any async operation that affects player coins with no error handler

### Portal requirement (hard)

`AuctionWonOverlay` and `AuctionDetailSheet` (BottomSheet) are `position: fixed` — both
must render via `ReactDOM.createPortal(content, document.body)`.

### Sound prohibition (hard)

No auditory cues of any kind. No countdown ticks, no outbid chimes, no win sounds.
This is a hard constraint based on Harry's autism profile.

### Anti-snipe prohibition (hard)

Auctions end at their stated `endsAt` time. No extensions under any circumstances.

### Copy integrity (hard)

- "lost" must not appear in any user-facing copy.
- "held" or "reserved" must not appear in any coin-related copy.
- "Your coins are back" appears ONLY in the final loss toast.
- "You've been outbid — bid again to stay in." appears ONLY in the during-auction outbid
  toast and banner (coins are still spent here, not yet refunded).

### No ghost variant (hard)

`variant="ghost"` must not appear anywhere in this feature's components or screens.

### Rarity floor (hard)

Auction animals are uncommon rarity or above. Common-rarity animals never appear.

---

## 6. Open questions for Owner to resolve before Phase C begins

These questions require an Owner decision and must not be resolved unilaterally by
the development team.

| ID | Question | Impact if unresolved |
|----|----------|----------------------|
| PO-Q3 | Confirm 3–5 auctions per daily batch is correct. | Developer will use midpoint (4) as default. |
| PO-Q4 | Confirm per-rarity minimumIncrement values in AUC-02 are correct. | Developer will use the PO values in this document as the default. |
| PO-Q4b | Confirm per-rarity startingBid ranges in AUC-02 are correct. | Developer will use the ranges in this document as the default. |
| PO-Q4c | Confirm NPC budget ceilings in AUC-09 are correct relative to the coin economy. | Developer will use the ceilings in this document. Adjust before Phase C if coin economy has changed. |

---

*Status: Ready for Owner approval before Phase C begins.*
