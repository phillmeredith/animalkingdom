# Interaction Spec: Auctions

> Feature: Auctions
> Author: UX Designer
> Status: Phase A complete — UR-reviewed and updated — ready for Phase B (PO)
> Last updated: 2026-03-28
> Supersedes: earlier 2026-03-28 draft (updated after UR findings review: coin mechanic
> corrected, anti-snipe removed, NPC parameters added, outbid copy split, missing flows added)

---

## Overview

Auctions let the player bid on a rotating daily selection of NPC-listed animals. These
animals are differentiated from the Generate Wizard pool — they appear at uncommon rarity
or above, and may include species not obtainable through generation. The rarity advantage
is the core motivation for using auctions rather than generating.

**Coin mechanic — critical:** There is no coin-hold primitive in `useWallet.ts`. Coins are
SPENT at the moment a bid is placed. If the player loses the auction (outbid and does not
re-bid, or the auction closes with another bidder winning), coins are REFUNDED via
`earn()`. The UI must represent this honestly. Never show "coins held". Show "coins
in bids" — the coins have left the wallet and will come back only if Harry loses.

NPC counter-bidders create competition. The outcome (win or lose) arrives at auction close.
Auctions end at their stated time. There are no time extensions under any circumstances.

This feature is child-facing (ages 6–12). All copy must be plain, warm, and low-stakes.
Losing an auction must not feel punishing. Winning should feel like a genuine moment.
There is no player-vs-player bidding in Tier 3. All competition is NPC-generated.

**NPC bid design constraints (build these in, not after):**
- Target player win rate: 60–65% across all auctions Harry actively bids on.
- NPC bid delay after player bid: 3–12 seconds (creates tension without panic; below 3s
  feels instant and threatening).
- Maximum NPC bids per auction: 3–4 total. Unlimited NPC rebidding is exhausting and
  unfair-feeling for a child. The NPC has a capped budget.
- NPC names must be whimsical and non-human (e.g. "The Collector", "Wild Wanderer",
  "Safari Seeker"). Realistic human names risk reading as real peers.
- NPC names must rotate — the same name must not appear as a competing bidder in
  consecutive auctions in the same session.

---

## Mandatory spec requirements checklist

The following mandatory items from CLAUDE.md are explicitly addressed in this spec. FE
must verify all of them before marking Phase C complete.

1. Interaction states section — covered in section 9
2. Card anatomy section — covered in section 3 (AuctionCard), including rarity
   differentiation signal and won-card state
3. Overlay surface treatment — glass rule explicitly stated in section 6; AuctionWonOverlay
   backdrop-tap-disabled behaviour specified
4. Consistency check — MarketplaceScreen BottomSheet + OfferCard patterns reviewed; auctions
   align to the same patterns
5. PageHeader slot assignments — covered in section 10
6. Navigation ownership — covered in section 10; tab control has exactly one home
7. Filter pill style — covered in section 5 (references CategoryPills pattern)
8. Filter and sort row layout — covered in section 5
9. Content top padding — explicit class string in section 4

**UR-driven additions (added 2026-03-28, must be verified at Phase D):**
- Coin mechanic honesty: no "held" language anywhere; "in bids" used throughout; refund
  animation specified; `coinsInBids` prop name enforced (not `heldAmount`)
- Anti-snipe mechanic: explicitly prohibited. Auctions end at stated time, no exceptions.
- NPC bid parameters: 3–12s delay, 3–4 bid cap, 60–65% win rate target — in overview and
  annotator notes
- Outbid copy split: during-auction ("bid again to stay in") vs final-loss ("Your coins are
  back") are separate, distinct copy items. They must not be conflated.
- First-encounter onboarding: Flow 0 specifies inline strip (not modal). One-time only.
- Won card state: Flow 5 and state inventory specify green tint banner and read-only sheet.
- Sheet-close mid-bid: Flow 6 specifies clean no-cost close, stepper reset, no notification.
- Sound design: explicitly prohibited (new section in accessibility notes).

---

## 1. Screen inventory

| Screen / State | Route / Trigger | Type |
|---|---|---|
| Auction Hub | `/auctions` | Full page |
| First-encounter onboarding strip | First visit to Auction Hub only | Inline strip above grid |
| Auction Detail | Tap any active auction card | BottomSheet |
| Won Auction Detail (read-only) | Tap a won/delivered auction card | BottomSheet (read-only mode) |
| Bid Confirm | Tap "Place a bid" in detail sheet | Inline state within BottomSheet |
| Buy Now Confirm | Tap "Buy now" in detail sheet | Inline state within BottomSheet |
| Outbid notification — active auction | System event: NPC counter-bids, auction still running | Toast (warning type) |
| Auction Won overlay | System event: auction closes, player wins | Full-screen celebration overlay |
| Auction Lost toast | System event: auction closes, player loses | Toast (warning type) |
| Empty state | No active auctions | Inline within Auction Hub |

---

## 2. Navigation placement

The Auction Hub lives inside the existing **Shop tab** (bottom nav `Store` icon). The Shop
screen receives a second tab: "Auctions". This keeps the bottom nav unchanged (5 tabs) and
groups commerce features together.

**Tab control ownership:** The `Shop / Auctions` segmented control lives in the **`centre`
slot** of the PageHeader on the Shop/Marketplace screen only. It does not appear inside any
content component. The Auction Hub receives `activeTab` as a prop — it does not render its
own tab control.

**Route:** `/auctions` is the canonical URL for the Auction Hub. The Shop screen at `/shop`
routes to `/auctions` when the Auctions tab is active.

---

## 3. User flows

### Flow 0 — First encounter with auctions (one-time onboarding)

This flow applies only on Harry's very first visit to the Auction Hub. It must not repeat
after the first visit. The explanation is integrated into the page — not a modal, not a
blocking tutorial.

1. Harry navigates to the Auction Hub for the first time.
2. Above the "LIVE NOW" section label, a single inline explainer strip is shown:
   - Plain text, two sentences maximum.
   - Copy: "Find an animal you love and offer the most coins before the timer ends — and
     it's yours! These are rare animals you can't get any other way."
   - Styling: `--elev` bg, `var(--r-md)`, `p-12px`, `14px/--t2`. No icon. No heading.
     No dismiss button — it disappears automatically after the first session.
3. On subsequent visits, the strip is not shown. The page opens directly to the grid.

This strip is the only onboarding. There is no modal tutorial. If Harry needs to understand
the mechanic again, the auction card detail sheet shows the rules-in-context.

### Flow 1 — Browse, bid, and win

1. Player taps the Shop tab in the bottom nav. The Marketplace/Shop screen loads with the
   segmented control showing "Shop | Auctions" in the `centre` slot.
2. Player taps "Auctions". The Auction Hub replaces the content area.
3. Auction Hub loads. Player sees a grid of auction cards. (On first visit, the onboarding
   strip appears above the grid — see Flow 0.)
4. Player taps an auction card. The Auction Detail BottomSheet slides up.
5. Player reviews: hero image, animal details, current bid, countdown, and bid history.
6. Player taps "Place a bid". The sheet enters Bid Confirm state:
   - Proposed bid amount is displayed (current bid + minimum increment).
   - Player adjusts using [−] / [+] stepper buttons.
   - Player taps "Confirm bid". Coins are SPENT immediately. Wallet balance drops.
     Wallet shows "X coins in bids" below the main balance (see section 8).
   - Sheet returns to Detail view, now showing player's bid as "Your bid".
7. NPC counter-bids after a short delay (3–12 seconds). Outbid toast fires. Copy: "You've
   been outbid — bid again to stay in." (Coins are NOT back — do not say "Your coins are
   back" here.)
8. Player taps toast, opens auction again, places a higher bid.
9. Auction timer reaches zero at its stated time. No extensions under any circumstances.
   Player wins.
10. Auction Won overlay appears: full-screen, hero gradient, animal image, "You won!" heading,
    coin note, and a "Go to My Animals" button.
11. Player taps "Go to My Animals" — overlay dismisses, navigation goes to `/animals`.

### Flow 2 — Buy now

1. Player opens Auction Detail on an auction with a buy-now price set.
2. Sheet shows "Buy now for [X] coins" button below the bid row.
3. Player taps "Buy now". Sheet enters Buy Now Confirm state: large coin amount display,
   "You'll have [Y] coins left" note, "Confirm" (accent) and "Cancel" (outline) buttons.
4. Player confirms. Coins are spent immediately. Auction closes for this player.
5. Auction Won overlay fires (same as bid win).

### Flow 3 — Already outbid, re-bid

1. Player opens Auction Detail. Sheet shows amber "You've been outbid" banner with copy:
   "You've been outbid — bid again to stay in." Coins from the previous bid have NOT been
   refunded — they are still spent, and will only come back if Harry loses the auction.
2. Player taps "Bid again". Bid Confirm state opens with the new minimum.
3. Player confirms. The previous bid coins are effectively replaced (the hook handles the
   refund of the prior bid internally before spending the new amount). The wallet "in bids"
   figure updates. Sheet returns to detail showing new "Your bid".

**"Cannot bid higher" state (outbid but insufficient coins):**
If the player's remaining wallet balance is too low to meet the new minimum bid, the "Bid
again" button is DISABLED with an explanatory label: "Not enough coins to bid higher."
The amber outbid banner remains visible. The player can still dismiss the sheet. This state
must be explicitly handled — the button must never be active while failing on tap.

### Flow 4 — Auction ends while player is elsewhere

1. Auction closes. Player wins — Auction Won overlay appears on top of whatever screen is
   visible. Player can dismiss without being forced to navigate. The overlay requires an
   explicit tap on "Go to My Animals" to dismiss — tapping the backdrop alone does NOT
   dismiss it. This prevents an accidental dismiss before the celebration moment completes,
   which is distressing for autistic children. (Backdrop tap is disabled on the won overlay
   only; all other BottomSheets retain normal dismiss behaviour.)
2. Auction closes. Player has lost — Warning toast only: "[Name] went to another home. Your
   coins are back." No overlay. This moment must feel low-key. "Your coins are back" is
   ONLY used here — at final loss, when coins are actually refunded. It must not appear
   during an active-auction outbid notification.
3. If player is offline, the outcome toast fires on next app open. The toast copy begins
   with a context reminder: "Remember [Name]? They went to another home. Your coins are
   back." (Win version: "Remember [Name]? You won! Find them in My Animals.")

### Flow 5 — Won auction card state after animal is delivered

1. After the player wins and the animal is added to My Animals, the auction card in the
   hub grid transitions to a "You won this!" state rather than disappearing immediately.
2. Won card state: the card remains visible with a green tint pair banner across the top of
   the body section. Banner text: "Yours now!" (12px/600/--green-t, --green-sub bg, 1px
   solid --green). The card's CTA is suppressed — tapping it opens the detail sheet in a
   read-only "completed" view with a "Find them in My Animals" link.
3. Won cards persist in the grid for the remainder of that auction day's cycle, then are
   removed when the next rotation arrives. They are not archived in a separate section —
   they simply clear with the daily refresh.
4. The card does not disappear silently. ADHD profiles are sensitive to things vanishing
   without acknowledgement. The brief won state before removal is the acknowledgement.

### Flow 6 — Player closes the BottomSheet mid-bid (before confirming)

1. Player taps "Place a bid" — sheet enters BidConfirmState.
2. Player adjusts the stepper amount but has not yet tapped "Confirm bid".
3. Player dismisses the sheet (swipe down, backdrop tap, or system back gesture).
4. No bid has been placed. No coins have been spent. The player's wallet is unchanged.
5. On next open of the same auction card, the sheet opens in the default Detail view (not
   BidConfirmState). The stepper amount does not persist — it resets to the current minimum.
6. No notification or confirmation of "nothing happened" is shown — the absence of any
   wallet change is the signal. The sheet simply closes cleanly.

This is the correct and intentional behaviour. It must be explicitly documented so that
Harry (and the developer) understands that closing mid-confirm is always safe and reversible.
Nothing bad happens.

---

## 4. Layout and content container

### Content container class string (mandatory)

```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

`pt-4` (16px) is mandatory — prevents content sitting flush against the PageHeader's glass
border. Do not reduce this value. Do not let FE choose a different value independently.

The scrollable content div wrapping the auction grid uses `flex-1 overflow-y-auto`. The
inner content container uses the class string above.

### Page structure diagram

```
┌─────────────────────────────────────────────┐
│ PageHeader (sticky glass, z-100)            │
│  title: "Marketplace" | centre: [Shop|Auct] │
│  trailing: CoinDisplay (with "in bids" ext) │
│  below: filter row (rarity pills + sort)    │
├─────────────────────────────────────────────┤
│ Scrollable content area (flex-1 overflow-y) │
│  └─ px-6 pt-4 pb-24 max-w-3xl mx-auto       │
│      └─ Section label "LIVE NOW"            │
│      └─ AuctionGrid (2-col at 768px+)       │
│      └─ AuctionEmptyState (if no auctions)  │
├─────────────────────────────────────────────┤
│ Gradient fade (48px, fixed above nav)       │
│ BottomNav (fixed, 68px)                     │
└─────────────────────────────────────────────┘
```

---

## 5. Filter and sort row

### Placement

Both the rarity filter pills and the sort control occupy a **single shared row** in the
**`below` slot** of the PageHeader. This is consistent with the Explore screen pattern.

Layout within the row:
- Rarity filter pills — left-aligned, `flex-1`, wraps if needed
- Sort control — right-aligned, `ml-auto shrink-0`

### Filter pills

Use the existing `CategoryPills` component from `src/components/explore/CategoryPills.tsx`
or the same tint-pair pattern. Do not re-implement inline.

Filter options: All | Common | Uncommon | Rare | Epic | Legendary

Active pill style (mandatory — do not deviate):
```
background: var(--blue-sub);
border: 1px solid var(--blue);
color: var(--blue-t);
```

Inactive pill style:
```
background: var(--card);
border: 1px solid var(--border-s);
color: var(--t2);
```

Solid `var(--blue)` background with white text is for primary action buttons only. Never
use it on filter pills.

### Sort control

A compact pill-shaped button (outline variant, sm size) showing the current sort label and
a `ChevronDown` icon (16px). Tapping opens a small dropdown or BottomSheet with sort
options.

Sort options:
- "Ending soon" (default) — soonest `endsAt` first
- "Lowest bid" — ascending `currentBid`
- "Highest bid" — descending `currentBid`
- "Rarest first" — legendary > epic > rare > uncommon > common

The sort control is right-aligned in the filter row. It is `ml-auto shrink-0`.

---

## 6. Component inventory

### AuctionHubScreen (new screen)

- Route: `/auctions`
- Fetches via `useAuctions` hook.
- Props: none (connected screen).
- Uses PageHeader with the `centre` slot for the Shop/Auctions tab toggle and the `below`
  slot for the filter row.
- Content container class: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`

### AuctionCard (new component)

**Card anatomy (mandatory per CLAUDE.md):**

```
Surface:      var(--card), 1px solid var(--border-s), border-radius: var(--r-lg) (16px)
Padding:      0 (image bleeds to edges at top), 16px inside body section
Image:        16:9 aspect ratio, w-full, object-cover, border-radius top corners only
              (border-top-left-radius: 16px; border-top-right-radius: 16px)
Shadow:       none at rest
```

**Information hierarchy (body section, top to bottom):**

Row 1: Animal name (`15px / 600 / --t1`, left) + RarityBadge (right-aligned, existing
component, tint-pair colour per rarity — no solid fills)

Row 2: Current bid (Lucide `Coins` 13px + amount `14px / 700 / --amber-t`, left) + time
remaining (right-aligned)

Time remaining colour:
- More than 1 hour: `--t3` text, `13px / 400`
- 10 minutes to 1 hour: amber tint pair badge (`--amber-sub` bg, `--amber-t` text,
  `12px / 600`, pill shape) — do not use solid amber
- Under 10 minutes: red tint pair badge (`--red-sub` bg, `--red-t` text) — do not use
  solid red

Row 3: Rarity left border treatment. A `4px` left border on the card (inside the padding
box, not on the outer card) in the rarity solid colour. This is visual only — do not
duplicate the RarityBadge here.

**Colour pair assignments by rarity (DS rarity system):**

| Rarity | Left border colour | Background tint |
|---|---|---|
| Common | `#777E91` | none |
| Uncommon | `var(--green)` | `var(--green-sub)` at 50% on body only |
| Rare | `var(--blue)` | `var(--blue-sub)` at 50% on body only |
| Epic | `var(--purple)` | `var(--purple-sub)` at 50% on body only |
| Legendary | `var(--amber)` | `var(--amber-sub)` at 50% on body only — shimmer animation |

**Empty state for card:** Not applicable — cards only render for existing auction items.

**Owned/active state:** Not applicable to auction cards. Auction cards do not display an
owned or equipped marker.

**Rarity differentiation signal (required — "why bid?" hook):**

Every auction card must make clear that this animal is not available through the Generate
Wizard. A small label appears in the card body, below the rarity badge row:

- Label: "Exclusive" for animals not in the generate pool, or "Rare find" for animals
  available at a rarity tier above what generation normally produces.
- Style: the existing tint-pair colour for that animal's rarity (e.g. amber tint pair for
  Legendary, purple tint pair for Epic). Use `11px/600`, pill shape, inline with the name row.
- If the auction item is neither exclusive nor elevated rarity, this label is omitted. In
  practice, PO decision: auctions should have a rarity floor (see UR findings PO-Q7) that
  means this label appears on most or all auction cards.

**Props:** `auction: AuctionItem, playerBidAmount: number | null, onTap: () => void`

If `playerBidAmount` is not null, show a small "Your bid" pill (amber tint pair,
`--amber-sub` bg, `--amber-t` text, `12px/600`, pill radius) beneath the bid row. This
signals to the player they are currently bidding on this auction without opening the sheet.

### AuctionDetailSheet (new component)

Uses the existing `BottomSheet` component. The glass rule applies:

```
Background:   rgba(13,13,17,.88) + backdrop-filter: blur(24px)
Border:       1px solid rgba(255,255,255,.06) (top + sides; no bottom)
Border-radius: 16px 16px 0 0 (top corners only — var(--r-xl))
Max height:   85vh
```

This matches the existing BottomSheet treatment. FE must compare this overlay visually
against the BottomNav — they must read as the same material.

**Internal state:** `view: 'detail' | 'bid-confirm' | 'buynow-confirm'`

**Detail view layout (top to bottom):**

```
[Hero image — 16:9, var(--r-md), w-full, object-cover]
[Name: H4 (22px/600/--t1) + RarityBadge row, mt-16px]
[Category badge row — existing Badge component]
[Divider — 1px solid var(--border-s)]
[CURRENT BID — hairline label + H3 value (28px/700/--amber-t) + Coins icon 20px]
[BUY NOW — hairline label + price (16px/600/--amber-t) + Coins icon 16px]
  Visible only when auction has a buyNow price set.
[YOUR BID — hairline label + amount (16px/600/--amber-t)]
  Visible only when playerBidAmount is not null.
  Background: --amber-sub tint on the row, 8px vertical padding, r-sm.
[OUTBID BANNER — amber tint pair: --amber-sub bg, 1px solid --amber border, r-md, p-12px]
  AlertCircle icon (16px, --amber) + "You've been outbid — bid again to stay in." (14px/--t2)
  Visible only when player is outbid and auction is still active.
  Note: coins from the previous bid are NOT refunded yet. Do not add coin-return language
  here. Coins come back only if Harry loses the auction entirely.
[RECENT BIDS — hairline label]
[BidHistoryList — last 3 bids]
[AuctionCountdown — progress bar + text]
[Divider]
["Place a bid" button — accent (pink), lg, w-full]
  OR ["Bid again" button — accent, lg, w-full] when outbid
  OR ["Auction ended" button — disabled outline] when closed
["Buy now for [X] coins" button — primary (blue), lg, w-full]
  Visible only when buyNow price is set and auction is still active.
```

Note: two primary-level CTAs should not compete. "Place a bid" (accent/pink) is the primary
action. "Buy now" (primary/blue) is an alternative. The separation of pink vs blue signals
the difference in consequence (bid = competitive, buy now = certain). Both use `w-full`
and `size="lg"` but different variants.

**Props:** `auction: AuctionItem | null, isOpen: boolean, onClose: () => void,
playerBid: number | null, isOutbid: boolean, onPlaceBid: (amount: number) => Promise<void>,
onBuyNow: () => Promise<void>`

### BidHistoryList (new sub-component)

Shows last 3 bids, newest first.

Each row: bidder name (`13px / 400 / --t2`, left) + amount (Coins icon 11px + `13px / 700
/ --amber-t`, right) + time-ago (`11px / 500 / --t3`, right below amount).

If player's bid appears: display "You" (not a name) styled `--blue-t`. This is the only
context where blue text appears in the bid history.

Row gap: `12px`. No dividers between rows. Section has a `--border-s` top divider.

**Props:** `bids: AuctionBid[]` — component slices to `[0..2]` internally.

### BidConfirmState (inline state within AuctionDetailSheet)

Rendered when `view === 'bid-confirm'`.

```
[Back button — ChevronLeft (20px) + "Back" label, outline sm, left-aligned]
[Heading "Confirm your bid" — H4 (22px/600/--t1), mt-16px]
[Coin amount display block — --elev bg, r-md, p-20px, centred]
  Coins icon 24px --amber + amount 40px/700/--amber-t, centred
[Stepper row — flex, gap-12px, mt-12px]
  [−] outline sm pill — min 44×44px touch target
  [amount display — read-only, centred, 20px/700/--t1] — this is not a freeform input
  [+] outline sm pill — min 44×44px touch target
[Note "The minimum bid is [X] coins" — 13px/--t3, centred]
[Note "You'll have [Y] coins left" — 13px/--t2, centred]
[Warning banner — amber tint pair, r-md, p-12px]
  Visible only when remaining balance after bid < 100 coins.
  Text: "You'll be almost out of coins!"
[Error message — red tint pair, r-sm, p-10px]
  Visible only on insufficient-coins error (do not toast this — inline only).
  Text: "You don't have enough coins"
["Confirm bid" button — accent (pink), lg, w-full, mt-8px]
["Cancel" button — outline, md, w-full]
```

**Stepper behaviour:** [+] increments by the minimum bid increment (defined by the hook).
[−] decrements to minimum but never below. The amount display is not a freeform text
input — use the stepper only. This prevents a child accidentally entering an arbitrarily
large number. The minimum valid bid is `currentBid + minimumIncrement`.

### BuyNowConfirmState (inline state within AuctionDetailSheet)

Rendered when `view === 'buynow-confirm'`.

```
[Back button — ChevronLeft + "Back", outline sm]
[Heading "Buy now?" — H4]
[Coin amount display block — same as BidConfirmState but at the buy-now price]
[Note "You'll have [Y] coins left" — 13px/--t2, centred]
[Error message — red tint pair] — if insufficient coins (inline only, not toast)
["Confirm" button — accent (pink), lg, w-full]
["Cancel" button — outline, md, w-full]
```

### AuctionCountdown (new component)

**Props:** `endsAt: Date, onExpired: () => void`

**Renders (always both visible):**

Primary display: digital format `"2h 14m"` or `"9m 32s"`. Text, `14px / 700`, colour
follows urgency (see colour table below). `aria-hidden="true"` — updates too frequently for
screen readers.

Secondary sentence: `"Ends in about 2 hours"` or `"Ending very soon!"` or `"Auction ended"`.
`13px / --t3` at rest. In an `aria-live="polite"` region. Updates every 30 seconds.

Progress bar: `height: 4px`, full width of the containing element, `border-radius: 100px`,
`background: var(--elev)` track, fill colour by urgency. Fills from left (full at start,
drains to zero as timer runs down). On `prefers-reduced-motion`: bar does not animate fill
transition; it updates in discrete steps.

| Time remaining | Digital colour | Bar fill colour | Sentence |
|---|---|---|---|
| More than 1 hour | `--t2` | `var(--green)` | "Ends in about [Xh]" |
| 10 minutes to 1 hour | `--amber-t` | `var(--amber)` | "Ends in about [Xm]" |
| Under 10 minutes | `--red-t` | `var(--red)` | "Ending very soon!" |
| Expired | `--t4` | none (empty bar) | "Auction ended" |

**Urgency design intent for Harry:** The colour shift at 10 minutes and the label change at
"Ending very soon!" signal urgency without an alarm or pulsing animation. There is no shake
animation, no flashing, no countdown sound. The shift from green to amber to red happens
gradually over time — not as a sudden pop. FE must not add a pulse or scale animation to the
timer at any threshold. The information is available; the presentation stays calm.

### AuctionWonOverlay (new component)

Must be rendered via `ReactDOM.createPortal(content, document.body)` — see CLAUDE.md portal
requirement and DS portal pattern. This overlay fires globally, potentially while any
animated screen is visible.

**Glass / surface rule does not apply here — this is a celebration surface, not a glass
overlay.** Use `var(--grad-hero)` (135deg, #E8247C → #3772FF) as the background.

```
Position: fixed inset 0
Z-index: 9999
Background: var(--grad-hero)
```

Layout (centred column, `max-w-xs mx-auto`, vertically centred):

```
[Animal image — 160×160px, r-xl, --sh-elevated, mt-auto on mobile]
["You won!" — H1 (48px/700/--t1), mt-24px]
["[Animal name] is yours!" — H3 (28px/600/--t1)]
["[X] coins spent" — Coins icon 14px + 14px/--t2]
["Go to My Animals" — accent (pink), lg button, mt-32px]
```

Animation:
- Overlay: `opacity: 0 → 1`, 300ms, ease-out.
- Animal image: `scale: 0.8 → 1.0` + `opacity: 0 → 1`, spring `{ stiffness: 300, damping: 28 }`.
- Coin particles: optional CSS `@keyframes float-up` burst. If `prefers-reduced-motion`
  is set, do not render particles at all. Particles must not block interaction.
- On `prefers-reduced-motion`: overlay fades in only (300ms); no scale animation; no particles.

Player dismisses by tapping "Go to My Animals" only. Tapping the background does NOT
dismiss the overlay. This is intentional: an autistic child dismissing the celebration
moment accidentally before it completes is distressing. The only exit is the explicit
button tap, which navigates to `/animals` and calls `onDismiss`. There is no other dismiss
path on this overlay.

### AuctionEmptyState (new component)

Icon: Lucide `Gavel`, 48px, `var(--t4)`.
Title: "No auctions right now" — `17px / 600 / --t1`.
Description: "New animals arrive every day. Check back soon!" — `14px / --t2`.
No CTA button.
Container: centred column, `py-20`, `gap-12px`.

---

## 7. State inventory

| State | Trigger | UI treatment |
|---|---|---|
| Loading | Hook fetching | 4 skeleton cards (--elev bg, pulse animation). Reduced-motion: static. |
| Empty | No active auctions | AuctionEmptyState |
| No active bid | Detail sheet opened, player has not bid | "Place a bid" button shown |
| Active bid | Player has bid | "Your bid" amber row visible in sheet + "Your bid" pill on card. Coins are spent — "X in bids" shows in CoinDisplay. |
| Outbid — can rebid | NPC exceeds player bid, player has sufficient coins | Amber outbid banner + "Bid again" button (active) + Warning toast ("You've been outbid — bid again to stay in.") |
| Outbid — cannot rebid | NPC exceeds player bid, player cannot afford new minimum | Amber outbid banner + "Bid again" button DISABLED + explanatory label "Not enough coins to bid higher" |
| Bid confirm | Player taps "Place a bid" / "Bid again" | BidConfirmState in sheet |
| Buy now confirm | Player taps "Buy now" | BuyNowConfirmState in sheet |
| Submitting | Player taps "Confirm bid" / "Confirm" (buy now) | CTA button shows Loader2 spinner, disabled. Stepper hidden. |
| Bid success | Hook confirms spend | Sheet returns to detail. "Your bid" row visible. Wallet balance reduced. "X in bids" updates. |
| Won card — delivered | Animal added to My Animals after win | Card shows "Yours now!" green tint banner. Detail sheet is read-only with "Find them in My Animals" link. |
| Bid error — insufficient coins | Balance < bid amount | Inline red error below confirm button. No toast. |
| Bid error — race condition | NPC bid arrived during confirm | Error toast: "Someone just outbid you. Try a higher amount." Sheet stays open. |
| Auction ended — won | Auction closes, player highest bidder | AuctionWonOverlay |
| Auction ended — lost | Auction closes, player not winner | Warning toast only |
| Auction ended — no bids | Auction closes with zero bids | No notification |
| Coins in bids | Player has an active bid | CoinDisplay in header shows "X in bids" (see section 8). Never labelled "held". |
| Sheet closed mid-bid | Player dismisses sheet during BidConfirmState before confirming | No bid placed. No coins spent. Sheet closes cleanly. Next open returns to detail view with stepper reset. No notification. |

---

## 8. Wallet — "coins in bids" display

**Honest mechanic framing.** There is no coin-hold primitive. Coins are SPENT at bid time
and REFUNDED if Harry loses. The wallet must represent this honestly. Never use the word
"held" or "reserved" — coins that have left the wallet are spent coins, not held coins.
The warmth comes from making the refund feel certain and safe, not from obscuring what
happened.

The existing CoinDisplay component in the PageHeader trailing slot must be extended to show
coins currently in active bids when `coinsInBids > 0`.

**Display copy:** "120 in bids" (not "120 held", not "120 reserved").

Layout addition:
```
[CoinDisplay main amount — existing amber pill]
["120 in bids" — below the pill, 11px/500/--t3, centred]
```

Alternatively, within the existing pill: `"1,200 (120 in bids)"` where the "in bids"
portion is styled `--t3`. The choice between these two layouts is deferred to FE, subject
to fitting within the PageHeader trailing slot at all breakpoints without truncation. FE
must verify at 375px — if the combined string truncates, use the two-line layout.

The "in bids" figure is visible on all screens while Harry has active bids — not only on
the auction screens. Coins that have left the wallet deserve a global signal.

**Refund animation.** When Harry loses an auction and coins are refunded via `earn()`, the
CoinDisplay must play the standard earn animation (coin-in visual, balance increment). The
refund must not arrive silently as a balance increment — Harry must see his coins come back.
The "in bids" figure drops to zero (or decreases by the refunded amount) simultaneously.

This is not a new component — it is a conditional extension of CoinDisplay with a renamed
prop. The `heldAmount` prop mentioned in annotator notes (section 15) must be named
`coinsInBids` to match the honest framing.

---

## 9. Interaction states

Every interactive element must have all four states defined. FE must not choose states
independently.

### AuctionCard (tappable button)

| State | Behaviour |
|---|---|
| Rest | `background: var(--card)`, `border: 1px solid var(--border-s)`, no shadow |
| Hover | `border: 1px solid var(--border)`, `transform: translateY(-2px)`, `box-shadow: var(--sh-card)`, `transition: all 300ms` |
| Active (tap) | `transform: scale(0.97)`, 150ms |
| Focus (keyboard) | `outline: 2px solid var(--blue)`, `outline-offset: 2px` |
| Disabled | Not applicable — auction cards are always tappable while active |

Class string (exact):
```
motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300
```

### "Place a bid" / "Bid again" / "Confirm bid" / "Confirm" (buy now) buttons

| State | Behaviour |
|---|---|
| Rest | `background: var(--pink)`, `color: #fff` |
| Hover | `background: var(--pink-h)`, `box-shadow: var(--glow-pink)` |
| Active | `transform: scale(0.97)` |
| Focus | `outline: 2px solid var(--blue)`, `outline-offset: 2px` |
| Disabled | `opacity: 0.4`, `pointer-events: none` |

Uses `variant="accent" size="lg"` from the existing Button component.

### "Buy now" (in detail sheet, secondary CTA)

| State | Behaviour |
|---|---|
| Rest | `background: var(--blue)`, `color: #fff` |
| Hover | `background: var(--blue-h)`, `box-shadow: var(--glow-blue)` |
| Active | `transform: scale(0.97)` |
| Focus | `outline: 2px solid var(--blue)`, `outline-offset: 2px` |
| Disabled | `opacity: 0.4`, `pointer-events: none` |

Uses `variant="primary" size="lg"` from the existing Button component.

### "Cancel" / "Back" / "Pass" / outline buttons

| State | Behaviour |
|---|---|
| Rest | `background: transparent`, `border: 1.5px solid var(--border)`, `color: var(--t1)` |
| Hover | `border-color: var(--t3)`, `background: rgba(255,255,255,.03)` |
| Active | `transform: scale(0.97)` |
| Focus | `outline: 2px solid var(--blue)`, `outline-offset: 2px` |
| Disabled | `opacity: 0.4`, `pointer-events: none` |

### Stepper [+] and [−] buttons

| State | Behaviour |
|---|---|
| Rest | Outline variant (as above) |
| Hover | Outline hover (as above) |
| Active | `transform: scale(0.97)` |
| Focus | `outline: 2px solid var(--blue)`, `outline-offset: 2px` |
| Disabled | `opacity: 0.4` — applied to [−] when at minimum bid; [+] has no upper cap |

Minimum touch target: `min-width: 44px; min-height: 44px`.

### Filter pills (rarity filter)

| State | Behaviour |
|---|---|
| Rest (inactive) | `background: var(--card)`, `border: 1px solid var(--border-s)`, `color: var(--t2)` |
| Active | `background: var(--blue-sub)`, `border: 1px solid var(--blue)`, `color: var(--blue-t)` |
| Hover (inactive) | `border-color: var(--border)` |
| Focus | `outline: 2px solid var(--blue)`, `outline-offset: 2px` |

### AuctionCountdown progress bar

Not interactive. No hover, active, or focus state. The bar is `aria-hidden` — it is purely
visual. The `aria-live` text sentence carries the accessible information.

### BottomSheet drag handle and close button

These are handled by the existing BottomSheet component. FE must verify the close button
meets the 44×44px touch target requirement (existing component should handle this — verify).

---

## 10. PageHeader slot assignments

Every control in the Auction Hub has a named slot. FE must not place a control in a slot
not listed here.

| Control | Slot | Reason |
|---|---|---|
| Page title "Marketplace" | Default title (left, not a slot) | Fixed heading |
| "Shop / Auctions" segmented control | `centre` | Section switcher — selects which major content area is visible |
| CoinDisplay (with "in bids" extension) | `trailing` (right) | Wallet indicator |
| Rarity filter pills + sort control | `below` | Content filters — operate on content within the current section |

**Slot rules applied:**
- The `centre` slot contains the section switcher only. It must be `display: inline-flex`,
  not full-width.
- The `below` slot contains the filter row only. The filter row is not a section switcher.
- The content component (AuctionHubScreen) receives `activeTab` as a prop. It does not
  render its own tab control. Dual navigation is a build defect.

---

## 11. Copy direction

All copy should feel like an encouraging friend, not a finance app. Short sentences. Active
voice.

| Element | Copy |
|---|---|
| Page title | "Marketplace" |
| Auctions tab label | "Auctions" |
| Section label (active auctions) | "LIVE NOW" (hairline, uppercase) |
| Current bid label | "CURRENT BID" (hairline) |
| Your bid label | "YOUR BID" (hairline) |
| Buy now label | "BUY NOW" (hairline) |
| Outbid banner (active auction) | "You've been outbid — bid again to stay in." |
| Bid history section label | "RECENT BIDS" (hairline) |
| Place bid button | "Place a bid" |
| Bid again button | "Bid again" |
| Buy now button | "Buy now for [X] coins" |
| Confirm bid heading | "Confirm your bid" |
| Buy now heading | "Buy now?" |
| Confirm bid note | "The minimum bid is [X] coins" |
| Remaining balance note | "You'll have [Y] coins left" |
| Low balance warning | "You'll be almost out of coins!" |
| Insufficient coins error | "You don't have enough coins" |
| Confirm bid button | "Confirm bid" |
| Cancel button | "Cancel" |
| Back button | "Back" |
| Auction won heading | "You won!" |
| Auction won sub-heading | "[Animal name] is yours!" |
| Auction won coins note | "[X] coins spent" |
| Go to collection button | "Go to My Animals" |
| Outbid toast — during active auction | "You've been outbid — bid again to stay in." — coins are NOT back; do not add coin-return language here. |
| Outbid toast — cannot rebid | "You've been outbid on [Name] and you're out of coins to bid higher." — informational only; no CTA. |
| Loss toast — auction ended, player lost | "[Name] went to another home. Your coins are back." — this is the ONLY context where "Your coins are back" appears. Coins are genuinely refunded at this point. |
| Race condition error toast | "Someone just outbid you. Try a higher amount." |
| Win toast (if overlay missed) | "Remember [Name]? You won! Find them in My Animals." |
| Loss toast (if offline at close) | "Remember [Name]? They went to another home. Your coins are back." |
| Won card banner label | "Yours now!" |
| Won card read-only sheet link | "Find them in My Animals" |
| First-encounter onboarding strip | "Find an animal you love and offer the most coins before the timer ends — and it's yours! These are rare animals you can't get any other way." |
| "Cannot bid higher" label | "Not enough coins to bid higher" |
| Empty state title | "No auctions right now" |
| Empty state description | "New animals arrive every day. Check back soon!" |
| Time remaining — normal | "Ends in about [Xh Ym]" |
| Time remaining — urgent | "Ending very soon!" |
| Time remaining — expired | "Auction ended" |

The word "lost" does not appear anywhere. Losing is framed as the animal going to someone
else, not as Harry's failure.

---

## 12. DS compliance notes

### Surfaces

| Element | Surface |
|---|---|
| Page background | `var(--bg)` (`#0D0D11`) |
| Auction cards | `var(--card)`, `1px solid var(--border-s)`, `var(--r-lg)` |
| AuctionDetailSheet | Glass rule — `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` + `1px solid rgba(255,255,255,.06)`. Existing BottomSheet component. |
| BidConfirmState coin block | `var(--elev)` bg, `var(--r-md)` |
| AuctionWonOverlay | `var(--grad-hero)` (celebration surface, not glass) |
| Outbid banner | `var(--amber-sub)` bg, `1px solid var(--amber)` |
| "Your bid" row in sheet | `var(--amber-sub)` bg, `var(--r-sm)` |

**BottomSheet is a fixed overlay and must use createPortal.** The existing BottomSheet
component handles this — FE must verify, not assume.

### Colour roles

- Bid amounts and coin icons: `--amber-t` text, `--amber-sub` tinted backgrounds
- Outbid warning: `--amber` border, `--amber-sub` bg, `--amber-t` text, AlertCircle icon
- Low balance warning: amber tint pair (same as outbid)
- Insufficient coins error: `--red-sub` bg, `1px solid var(--red)`, `--red-t` text
  (inline in sheet — not a toast)
- Time normal: `--t2`
- Time urgent (< 1 hour): `--amber-t`
- Time critical (< 10 min): `--red-t`
- Win overlay gradient: `--grad-hero` (135deg, #E8247C → #3772FF)
- Race condition error: red tint pair (toast)

No hardcoded hex values. Every colour traces to a DS token.

### Buttons

- "Place a bid" / "Bid again" / "Confirm bid" / "Confirm" (buy now): `variant="accent"` (pink), `size="lg"`, `className="w-full"`
- "Buy now for [X] coins" (in detail view): `variant="primary"` (blue), `size="lg"`, `className="w-full"`
- "Cancel" / "Back": `variant="outline"`, `size="md"`, `className="w-full"`
- Stepper [+] / [−]: `variant="outline"`, `size="sm"`, pill shape, `min-w-[44px] min-h-[44px]`
- "Go to My Animals" (won overlay): `variant="accent"`, `size="lg"`
- Filter pills: tint-pair pattern via CategoryPills component (not Button component)

No `ghost` variant anywhere in this feature. If a ghost variant appears in code review,
it is a build defect.

### Badges

- Rarity: existing `RarityBadge` component — always tint-pair, never solid fill
- "Your bid" pill on card: amber tint pair inline, `12px/600`, pill radius
- Time remaining urgency: amber or red tint-pair badge (not solid colour)
- Category: existing `Badge` component

### Icons (all Lucide, stroke-width 2)

- Auction Hub empty state: `Gavel`, 48px, `--t4`
- Bid amounts: `Coins`, 13px in lists / 18–24px in confirm view
- Outbid banner: `AlertCircle`, 16px, `--amber`
- Back button in confirm view: `ChevronLeft`, 20px
- Sort control: `ChevronDown`, 16px
- Won overlay: no icon — animal image is the hero

---

## 13. Responsive notes

### 375px (phone portrait)

- Auction grid: `grid-cols-1` (single column)
- AuctionDetailSheet: full-width, 85vh max-height
- BidConfirmState stepper: stepper row in a single horizontal row; if space is tight, the
  amount display narrows but stepper buttons keep their 44px minimum
- AuctionWonOverlay: animal image reduces to 120×120px; heading stays H1; content column
  `max-w-[90vw]`

### 768px (iPad portrait — primary target: Harry at 820px)

- Auction grid: `grid-cols-2`, `gap-5` (20px)
- AuctionDetailSheet: constrained to `max-w-lg` centred. Still bottom-anchored (consistent
  with existing BottomSheet pattern — do not change to a centred modal)
- BidConfirmState: stepper in a single row
- Filter row: pills and sort control on one row, no wrapping
- AuctionWonOverlay: animal image 160×160px; content column `max-w-sm`

### 1024px (iPad landscape)

- Auction grid: `grid-cols-2` still (within `max-w-3xl` column, two columns fill well —
  do not go to 3 columns; auctions are featured items, not a dense catalogue)
- Content column: `max-w-3xl mx-auto w-full`
- AuctionDetailSheet: same as 768px

### Grid hover — clip check (mandatory FE self-review)

Add `pt-1` to the parent grid container to prevent card lift animation clipping against
the scroll container. FE must hover every card at 820px before marking Phase C complete.

---

## 14. Accessibility notes

### Touch targets

All interactive elements: minimum 44×44px.
- Auction cards (full card tappable)
- Stepper buttons (`min-h-[44px] min-w-[44px]`)
- BottomSheet close button (verify existing component meets this — do not assume)
- All button sizes (lg = 48px height, md = 44px height — both meet requirement)
- Filter pills (`min-h-[36px]` — sm button height — acceptable for secondary controls)

### Focus management

- On BottomSheet open (detail view): focus moves to "Place a bid" button or, if auction
  ended, to the "Auction ended" disabled button's heading sibling.
- On BidConfirmState open: focus moves to the first stepper [+] button.
- On BottomSheet close: focus returns to the AuctionCard that was tapped.
- On AuctionWonOverlay open: focus moves to the "Go to My Animals" button.
- Focus trap: while a BottomSheet or overlay is open, Tab must not reach elements behind it.
  The existing BottomSheet component should handle this — FE must verify.

### Countdown timer

- Digital countdown (`"9m 32s"`) is `aria-hidden="true"`.
- Text sentence (`"Ending very soon!"`) is in an `aria-live="polite"` region.
- Live region updates every 30 seconds, not every second.
- Threshold announcements fire once: "Ending very soon!" fires once when time drops below
  10 minutes. "Auction ended" fires once on expiry.

### Reduced-motion

All Framer Motion usage must check `useReducedMotion()`.

| Element | Normal | Reduced-motion |
|---|---|---|
| BottomSheet slide-up | Spring animation | Instant (no animation) |
| Won overlay entrance | Fade (300ms) + image scale | Fade only (no scale) |
| Coin particles | Float-up keyframe | Not rendered |
| Progress bar fill | Smooth CSS transition | Static discrete steps |
| Card hover lift | `translateY(-2px)` via `motion-safe:` class | No lift |

### Colour independence

- Outbid state: conveyed by banner text + AlertCircle icon, not colour alone
- Time urgency: colour change AND text change ("Ending very soon!"), not colour alone
- Win / loss: overlay presence and heading text, not colour alone

### Sound design (explicit decision required)

The auctions feature must not introduce any new auditory cues. This is a hard constraint,
not a preference. Harry's autism profile means unexpected sounds are a potential distress
trigger. The following are explicitly prohibited:

- Countdown ticking sounds
- Outbid alert sounds
- Urgency beeps or chimes as the timer runs low
- Any sound that fires automatically without user action

If the app uses ambient sound elsewhere, the auction screens must not add to it. If a win
sound is desired for the AuctionWonOverlay, this must be a PO decision carried forward to
Phase B — it cannot be added at Phase C independently. No sound = safe default.

### Low-stakes for children

- Losing must not use red. Use amber tint pair for the loss-adjacent outbid state.
- "Lost" does not appear in any copy.
- "Your coins are back" appears ONLY in the final loss toast. Not in any during-auction copy.
- No alarm sounds. No pulsing urgency animations. No flashing.
- Auctions end at their stated time. No extensions under any circumstances. Unexpected
  time extensions are specifically distressing for autistic children (UR finding, confidence:
  medium-high). Anti-snipe mechanics are prohibited for this feature.

---

## 15. Annotator notes for Developer and Frontend Engineer

- The `useAuctions` hook does not yet exist. It must expose:
  `auctions[]`, `playerBids: Record<number, number>`, `coinsInBids: number`,
  `placeBid(auctionId, amount): Promise<void>`,
  `buyNow(auctionId): Promise<void>`,
  `refreshAuctions(): Promise<void>`.
  There is no coin-hold primitive in `useWallet`. Coins are SPENT at bid time via `spend()`
  and REFUNDED at loss via `earn()`. The `coinsInBids` figure is computed by summing active
  `AuctionBid` amounts for auctions still in progress — it is a derived display value, not
  a wallet state. The hook must query `AuctionBid` and `AuctionItem` to produce this figure.
  This query is the hook's responsibility, not the component's.

- NPC counter-bids are simulated in the hook. Delay: 3–12 seconds after a player bid
  (randomised within that range). Below 3 seconds feels instant and threatening for the
  age group. The hook, not the component, controls this timing.
- NPC bid cap: maximum 3–4 NPC bids per auction. The NPC has a budget ceiling. Once it
  is reached, the NPC does not bid again regardless of the player's amount. This ensures
  Harry can always win by spending enough. The cap is not visible to Harry — it simply
  means the auction eventually goes quiet.
- Target player win rate: 60–65% across auctions Harry actively bids on. The NPC budget
  ceiling per rarity tier must be calibrated to this target. Common → low cap; Legendary →
  higher cap (but always beatable). The PO must confirm per-tier caps before Phase C.
- NPC bidder names: whimsical, non-human (e.g. "The Collector", "Wild Wanderer", "Safari
  Seeker"). Rotate across sessions. The same name must not appear as the antagonist in two
  consecutive auctions within a single session. Do not use realistic human names.

- The `AuctionWonOverlay` must be registered as a global overlay (similar to how toasts are
  global in `useToast`) because it can fire while the player is on any screen. The overlay
  component renders via `createPortal` to `document.body`.

- `AuctionItem.currentBidder` is either `'player'` or an NPC name string. The UI uses this
  to determine whether the player is currently the highest bidder.

- The `buyNow` field is optional on `AuctionItem` — check for its presence before rendering
  the buy-now row and button in the detail sheet.

- Do not add a third bottom nav tab for auctions. The Shop tab hosts both Marketplace and
  Auctions via the centre-slot segmented control. Adding a sixth nav item would break the
  existing 5-tab navigation contract.

- Wallet "in bids" display: the `coinsInBids` value from the hook feeds directly into the
  CoinDisplay trailing slot. The CoinDisplay component needs a new optional `coinsInBids`
  prop (not `heldAmount` — the prop name must match the honest framing). This is a small
  component extension, not a new component. The prop name `heldAmount` is explicitly
  prohibited — it would carry the "held" framing into the component layer.
