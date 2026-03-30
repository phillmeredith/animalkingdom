# Interaction Spec: Auction Retract

> Feature: auction-retract
> Author: UX Designer
> Status: Phase A complete — ready for Phase B (PO)
> Last updated: 2026-03-29

---

## Overview

A player who has listed a pet for sale (via Player Listings) or put a pet up for auction
should be able to cancel that listing and reclaim their animal. This spec covers retraction
for both listing types: player-created listings on the Marketplace (player-listings feature)
and player-placed bids in the Auctions system.

The key design tension: retraction must be easy enough that Harry doesn't feel trapped by
an accidental listing, but guarded enough that he doesn't accidentally cancel a listing he
wanted to keep active. A single confirmation step resolves this — no cooldown or fee is
applied for a child-facing product at this stage.

**Scope clarification (two distinct retract scenarios):**

1. **Listing retract** — Harry created a player listing ("List for Sale"). The pet has
   `status === 'for_sale'`. He wants to cancel it and get his pet back as `status ===
   'active'`.

2. **Bid retract** — Harry placed a bid on an NPC auction. His coins were spent at bid
   time (per the auctions spec). He wants to withdraw his bid and receive a coin refund.

These are separate flows with separate entry points and copy, but they share the same
confirmation pattern. This spec defines both.

---

## Mandatory spec requirements checklist

1. Interaction states — covered in section 6
2. Card anatomy — no new card components introduced; see section 3 for badge anatomy
3. Overlay surface treatment — glass rule stated in section 5
4. Consistency check — reviewed player-listings and auctions interaction specs; patterns
   match; see section 4
5. PageHeader slot assignment — no new header controls; section 7
6. Navigation ownership — no new navigation; section 7
7. Filter pill style — no new filter pills introduced
8. Filter and sort row layout — no change to existing rows
9. Content top padding — explicit class strings in section 4

---

## 1. Entry points

### 1a. Listing retract — PetDetailSheet

Location: the footer action row of `PetDetailSheet`, which is already the canonical
detail view for any pet in My Animals.

Per the player-listings spec, when `pet.status === 'for_sale'`, the footer shows an amber
"Listed for sale" badge (non-interactive) and the "List for Sale" button is absent.

This spec adds a "Cancel listing" button to the footer when `pet.status === 'for_sale'`.

Button placement:
- On iPad (768px+): 2-column grid footer. "Cancel listing" occupies the second column
  (right). "Rename" remains in the first column (left). "Release" is hidden while the
  pet is listed — you cannot release a pet that is currently for sale.
- At 375px: single-column stack. "Rename" first, "Cancel listing" second (full width).

Button variant: `variant="outline"` — this is a corrective action (cancel something),
not a reward action (pink) and not a primary utility action (blue). Outline communicates
"I want to undo" without visual alarm.

Do not use `variant="ghost"` — prohibited for visible actions per CLAUDE.md.

### 1b. Listing retract — My Listings card

Location: the My Listings tab in StoreHubScreen (Marketplace section), introduced by
the player-listings spec.

Each listing card in My Listings already shows the pet image, name, asking price, and
offer status. This spec adds a "Cancel" icon button to the top-right corner of the card.

Icon button anatomy:
```
Icon:        X (Lucide), 14px, strokeWidth 2
Size:        32px circle
Background:  var(--card)
Border:      1px solid var(--border-s)
Color:       var(--t3)
Hover:       background var(--elev), color var(--t1), border var(--border)
Radius:      100% (circle)
```

This button appears only on listings the player owns (My Listings tab). It does not
appear on Browse tab cards (those are NPC listings the player buys, not owns).

Tapping the icon button opens the listing retract confirmation (see section 2).

### 1c. Bid retract — Auction Detail BottomSheet

Location: inside the AuctionDetailSheet (introduced by the auctions spec), which opens
when Harry taps an auction card he has bid on.

The auctions spec defines the sheet's bid state view. This spec adds a "Withdraw bid"
text link at the bottom of the bid state section, below the "Place a bid" / re-bid CTA.

The element is a text link, not a button, to keep visual weight low — this is a
secondary escape action, not the primary CTA.

```
Text:        "Withdraw my bid"
Font:        13px/400, var(--t3)
Hover:       color var(--t1)
Focus:       2px solid var(--blue), outline-offset 2px
Underline:   text-underline-offset 2px, underline on hover only
Touch target: minimum 44px height — pad vertically to achieve this
```

This link is only shown when Harry has an active bid on this auction (i.e. he is the
current high bidder or he placed a bid that was outbid). It is NOT shown if the auction
has already closed (won or lost states).

---

## 2. Confirmation pattern

Both listing retract and bid retract use the same Modal confirmation pattern (centred
modal, not bottom sheet). A centred modal is used here rather than a bottom sheet because
this is a short, binary decision — not an information-dense flow.

### 2a. Listing retract confirmation

```
┌─────────────────────────────────────────────┐
│  [close ×]                                  │
│                                             │
│  Cancel your listing?          22px/600 t1  │
│                                             │
│  [Pet mini-summary row]                     │
│    [64×64 image, r-md, object-cover]        │
│    [Name 15px/600 t1]                       │
│    [RarityBadge + TierBadge]               │
│  Background: var(--elev), r-md, p-16        │
│                                             │
│  "[Pet name] will return to your           │
│   collection. Any pending offers            │
│   will be cancelled."          body/400 t2  │
│                                             │
│  [outline btn: "Keep listing"]              │  full width, h-44
│  [red btn: "Cancel listing"]               │  full width, h-44, mt-8
│                                             │
└─────────────────────────────────────────────┘
```

"Cancel listing" button variant: `variant="outline"` with red override —
`border-color: var(--red); color: var(--red-t)` on default, hover background
`var(--red-sub)`. This is a standard destructive-outline pattern from the DS. Do not
use a solid red primary button — this is not a high-stakes irreversible action (the pet
comes back). Red outline signals "this removes something" without being alarming.

"Keep listing" button variant: `variant="outline"` — neutral, primary escape.

Primary action on this modal is "Keep listing" because doing nothing (keeping the
listing active) is the safer default. Destructive action ("Cancel listing") is
secondary, visually subordinate.

### 2b. Bid retract confirmation

```
┌─────────────────────────────────────────────┐
│  [close ×]                                  │
│                                             │
│  Withdraw your bid?            22px/600 t1  │
│                                             │
│  [Auction mini-summary row]                 │
│    [64×64 animal image, r-md, object-cover] │
│    [Animal name 15px/600 t1]               │
│    [RarityBadge]                            │
│    [Bid amount: "Your bid: [X] coins"      │
│       13px/400, var(--t3)]                  │
│  Background: var(--elev), r-md, p-16        │
│                                             │
│  "Your [X] coins will be                   │
│   returned to your wallet."   body/400 t2   │
│                                             │
│  [outline btn: "Keep my bid"]               │  full width, h-44
│  [red-outline btn: "Withdraw bid"]          │  full width, h-44, mt-8
│                                             │
└─────────────────────────────────────────────┘
```

The refund message ("Your X coins will be returned") uses the exact coin amount Harry
bid. Do not use vague copy like "your coins will come back" — specificity builds trust.
Coin amount is displayed as a number, e.g. "Your 250 coins will be returned to your
wallet."

---

## 3. Post-retract states

### 3a. After listing retract

1. Modal closes with scale-out animation (0.95 opacity 0, duration 0.15s).
2. PetDetailSheet refreshes live (useLiveQuery) — footer returns to "active pet" state:
   "List for Sale" button reappears.
3. Toast notification fires:
   ```
   Type:    success
   Title:   "[Pet name] is back in your collection"
   Duration: 4000ms
   ```
4. In My Listings tab, the card for the retracted pet disappears from the list. If the
   list becomes empty, the empty state for My Listings appears.
5. Pet `status` reverts to `'active'` in the DB.

### 3b. After bid retract

1. Modal closes with scale-out animation.
2. Coin refund fires immediately: `earn(bidAmount)`. The wallet balance updates reactively.
3. Toast notification fires:
   ```
   Type:    success
   Title:   "[X] coins returned to your wallet"
   Duration: 4000ms
   ```
4. The auction card in the Auction Hub returns to its "unbet" state (no bid indicator).
5. The AuctionDetailSheet, if still open, refreshes to show Harry is no longer the
   bidder. The "Withdraw my bid" link disappears.

---

## 4. Consistency check

**PetDetailSheet footer** — reviewed against player-listings spec. That spec defines
a 2-column grid for 768px+ with Rename + Release + (active) List for Sale occupying the
available slots. This spec replaces "List for Sale" with "Cancel listing" when the pet
is for_sale. The grid structure is the same.

**Confirmation modal** — reviewed against existing modal patterns in the DS. Centred
modal, max-width 420px, glass surface, padding 28px, r-lg, shadow `var(--sh-elevated)`.
Close button: 32px circle, `var(--elev)`, top-right corner.

**Toast** — uses existing `useToast` hook pattern. Success type, as defined in auctions
and player-listings specs.

**Coin refund display** — per auctions spec, coins are spent at bid time. The refund
mechanic (earn back on withdraw or on loss) is already established. This spec uses the
same `earn()` call pattern.

Content top padding for PetDetailSheet scroll area (unchanged from player-listings spec):
```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

---

## 5. Overlay surface treatment

Both the listing retract confirmation and bid retract confirmation use the centred Modal
pattern. The glass rule applies:

```
Background:   rgba(13,13,17,.88) + backdrop-filter: blur(24px)
Border:       1px solid rgba(255,255,255,.06)
Radius:       16px (--r-lg)
Padding:      28px
Max-width:    420px
Shadow:       var(--sh-elevated)
```

Backdrop:
```
Position:     fixed inset-0
Background:   rgba(0,0,0,.30)
Z-index:      1000
```

Both modal components must use `ReactDOM.createPortal(content, document.body)` — they
may be triggered from inside animated Framer Motion parents (PetDetailSheet, AuctionDetail
BottomSheet). Failure to portal would trap the fixed overlay inside the animation stacking
context.

---

## 6. Interaction states

### Cancel listing icon button (My Listings card, section 1b)

| State | Treatment |
|-------|-----------|
| Default | 32px circle, var(--card) bg, var(--t3) icon, border var(--border-s) |
| Hover | bg var(--elev), icon var(--t1), border var(--border) |
| Active | scale(.97), duration 150ms |
| Focus | 2px solid var(--blue), outline-offset 2px |
| Touch target | min 44×44px — use padding to extend hit area beyond visible circle |

### "Withdraw my bid" text link (Auction Detail, section 1c)

| State | Treatment |
|-------|-----------|
| Default | color var(--t3), no underline |
| Hover | color var(--t1), underline |
| Active | opacity .7 |
| Focus | 2px solid var(--blue), outline-offset 2px |

### "Keep listing" / "Keep my bid" button (confirmation modal)

| State | Treatment |
|-------|-----------|
| Default | outline variant: transparent bg, 1.5px solid var(--border), var(--t1) text |
| Hover | border var(--t3), bg rgba(255,255,255,.03) |
| Active | scale(.97) |
| Focus | 2px solid var(--blue), outline-offset 2px |
| Disabled | Not applicable — always enabled |

### "Cancel listing" / "Withdraw bid" button (confirmation modal)

| State | Treatment |
|-------|-----------|
| Default | transparent bg, 1.5px solid var(--red), color var(--red-t) |
| Hover | bg var(--red-sub), border var(--red), color var(--red-t) |
| Active | scale(.97) |
| Focus | 2px solid var(--red), outline-offset 2px |
| Loading | Spinner replaces text label, pointer-events none |

The loading state is important: retract operations are async (DB write + potential refund).
Show a 20px Loader2 (Lucide, animated spin) inside the button while the operation is
in-flight. This prevents double-taps.

---

## 7. PageHeader slot assignment

This feature introduces no new header controls.

Navigation ownership: no new navigation controls. The My Listings tab in StoreHubScreen
is an existing tab introduced by player-listings spec. The "Cancel" icon button on listing
cards is a card-level action, not a navigation control.

---

## 8. Screen inventory

| Surface | States |
|---------|--------|
| PetDetailSheet footer (for_sale pet) | Default (shows Cancel listing btn), loading (spinner in btn), post-retract (reverts to active state) |
| My Listings card | Default (shows × icon btn), post-retract (card disappears) |
| Auction Detail BottomSheet | Has bid (shows Withdraw link), no bid / closed (Withdraw link absent) |
| Listing retract confirmation modal | Default, loading (Cancel listing btn), success (auto-close) |
| Bid retract confirmation modal | Default, loading (Withdraw bid btn), success (auto-close) |
| Toast — listing retracted | Success type, 4s |
| Toast — bid refunded | Success type, 4s |
| My Listings empty state | Shown when last listing is retracted |

---

## 9. Accessibility

- "Cancel listing" text button in PetDetailSheet footer is a visible button with a text
  label. No icon-only affordance. Screen reader accessible as-is.
- "Cancel" icon button on listing cards must have `aria-label="Cancel listing for [pet name]"`.
  Icon-only buttons without aria-label are a WCAG 2.1 AA failure.
- "Withdraw my bid" text link must have `role="button"` if implemented as a `<button>` element
  (preferred) or `aria-label` clarifying the action if implemented as `<a>`.
- Confirmation modals must use `role="dialog"` and `aria-modal="true"`. Focus must be trapped
  inside the modal while it is open. On close, focus returns to the triggering element.
- Destructive actions ("Cancel listing", "Withdraw bid") must not be the first focusable
  element in the modal — "Keep" buttons are declared first in DOM order.
- All interactive elements meet the 44px minimum touch target.
- Loading states: spinner button must have `aria-busy="true"` and `aria-label` describing the
  in-progress action (e.g. "Cancelling listing…").
- No animation is introduced by this feature beyond modal open/close transitions, which already
  respect `prefers-reduced-motion` in the existing Modal component.

---

## 10. Handoff notes for Frontend Engineer

1. "Cancel listing" button in PetDetailSheet: render when `pet.status === 'for_sale'`.
   Variant `outline`. On tap, open `ListingRetractModal` (new component). Hide "Release"
   button when pet is for_sale (cannot release a listed pet).

2. `ListingRetractModal` component: centred modal, portal to body. Pet mini-summary row
   pattern matches ListForSaleSheet's existing pet summary row (64×64 image + name +
   RarityBadge). "Cancel listing" button triggers `cancelListing(petId)` hook action.

3. "Cancel" icon button on My Listings card: `aria-label` must include pet name. Tapping
   opens the same `ListingRetractModal`. Use the same portal pattern.

4. "Withdraw my bid" in AuctionDetailSheet: render when the player has an active bid and
   the auction is not yet closed. Tapping opens `BidRetractModal` (new component).

5. `BidRetractModal` component: centred modal, portal to body. Auction mini-summary row.
   "Withdraw bid" triggers `retractBid(auctionId)` hook action, which must call `earn()`
   with the refund amount inside the same DB transaction as the bid record deletion.

6. Coin refund integrity: the bid retract must use `db.transaction('rw', ...)` to wrap
   both the bid record deletion and the `earn()` call. A separate `earn()` call outside
   a transaction is a build defect (per CLAUDE.md spend-before-write rule — same
   principle applies to refunds).

7. Toast messages: use `useToast` hook. `type: 'success'`. Duration 4000ms.

8. Loading state: set a local `retracting` boolean while the async operation is in-flight.
   Disable both buttons and show spinner in the destructive button. Re-enable on success
   or error.

9. Error handling: wrap all async retract calls in `try/catch`. On error, fire a toast
   `type: 'error'`, title: "Could not cancel — please try again." Do not silently swallow
   errors.

10. Both modal components use the existing `BottomSheet`-style glass surface (glass rule
    from DS), adapted to centred position. If a `Modal` component already exists in the
    codebase, use it. Do not re-implement the glass surface inline.
