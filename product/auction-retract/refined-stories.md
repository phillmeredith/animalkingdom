# Refined Stories: Auction Retract

> Output from the Product Owner agent.
> Produced during Phase B after UR findings and interaction spec are complete.
> Phase B decisions confirmed by [OWNER] 2026-03-29.
> This is the acceptance criteria the Tester validates against.

---

## Feature goal

Give Harry a safe, single-step way to cancel a pet listing or withdraw an auction bid
so that an accidental or regretted trade action is always reversible — without adding
friction that would make the escape harder than the original action.

---

## Owner's Phase B decisions (binding)

- No retraction fee
- No cooldown between retraction and re-listing
- Clean implementation: no complexity beyond what the spec defines

---

## Scope (confirmed)

**In scope:**
- "Cancel listing" button in `PetDetailSheet` footer when `pet.status === 'for_sale'`
- "Cancel" icon button on each card in the My Listings tab (StoreHubScreen)
- `ListingRetractModal`: centred confirmation modal, portal to body
- "Withdraw my bid" text link in `AuctionDetailSheet` when Harry has an active bid
- `BidRetractModal`: centred confirmation modal, portal to body
- Pet status revert to `'active'` on listing retract
- Coin refund (`earn(bidAmount)`) inside same DB transaction as bid record deletion

**Out of scope (this iteration):**
- Retraction of NPC-placed offers (Harry rejects those; he does not retract them)
- Batch retraction of multiple listings at once
- Retraction history or log
- Any fee, cooldown, or penalty mechanism (Owner decision)
- Retraction of buy-now purchases (irreversible by design)

---

## Dependencies

Before Phase C starts, the following must be in place:
- `Auctions` and `Player Listings` features complete and their specs reviewed (both complete)
- `PetDetailSheet` has existing footer grid structure
- `AuctionDetailSheet` exists with bid state view
- `useListings` and `useAuctions` hooks expose the data needed to identify retractable
  records
- A `Modal` component exists or the team confirms one needs to be created; if creating,
  it must use `ReactDOM.createPortal(content, document.body)` per CLAUDE.md portal rule

---

## Refined user stories

### Story 1: Cancel a pet listing from PetDetailSheet

As Harry,
I want to cancel an active listing from inside my pet's detail view and get my pet back
in my collection immediately,
So that if I listed the wrong pet or changed my mind, I can undo it without losing the
animal.

**Acceptance criteria:**
- [ ] When `pet.status === 'for_sale'`, the `PetDetailSheet` footer renders a "Cancel listing"
  button (`variant="outline"`). On iPad (768px+) it occupies the right column of the 2-column
  footer grid. On 375px it renders below "Rename" as a full-width stack.
- [ ] When `pet.status === 'for_sale'`, the "Release" button is absent from the footer DOM
  (a for_sale pet cannot be released).
- [ ] When `pet.status === 'for_sale'`, the "List for Sale" button is absent from the footer
  DOM (already handled by player-listings spec; confirmed still absent after this feature ships).
- [ ] Tapping "Cancel listing" opens the `ListingRetractModal`. The modal is portalled to
  `document.body` via `ReactDOM.createPortal`.
- [ ] The `ListingRetractModal` renders: title "Cancel your listing?" (22px/600, `var(--t1)`),
  a pet mini-summary row (64x64 image `r-md object-cover`, pet name 15px/600, `RarityBadge`,
  `TierBadge`, summary row background `var(--elev)` r-md p-16), body copy "[Pet name] will
  return to your collection. Any pending offers will be cancelled." (body/400, `var(--t2)`),
  "Keep listing" button (full width, `variant="outline"`, h-44), and "Cancel listing"
  destructive button (full width, h-44, mt-8, transparent bg, `1.5px solid var(--red)`,
  `var(--red-t)` text, hover bg `var(--red-sub)`).
- [ ] The modal has a close (×) button in the top-right corner (32px circle, `var(--elev)` bg).
- [ ] "Keep listing" closes the modal without making any state changes.
- [ ] Tapping "Cancel listing" in the modal triggers the retract operation: the button enters
  loading state (20px `Loader2` spinner, `pointer-events: none`), both buttons are disabled
  while in-flight.
- [ ] TRANS-7: tapping "Cancel listing" while the operation is already in-flight produces no
  additional retract calls.
- [ ] On success: modal closes, `PetDetailSheet` footer returns to active-pet state ("List for
  Sale" button reappears), a success toast fires with type `success`, title "[Pet name] is
  back in your collection", duration 4000ms.
- [ ] On success: the pet's `status` in the DB is `'active'`. The DB write is verified by
  reopening the PetDetailSheet and confirming the footer shows the active-pet state.
- [ ] TRANS-3: if the retract operation fails, the modal remains open in an actionable state.
  The pet's status is unchanged. The "Cancel listing" button returns from loading to its
  default state.
- [ ] TRANS-4: on error, a toast fires with type `error`, title "Could not cancel — please
  try again."
- [ ] TRANS-2: if the operation throws, `pet.status` is identical to its pre-operation value.
- [ ] The modal uses the glass surface: `rgba(13,13,17,.88)` background, `backdrop-filter:
  blur(24px)`, `1px solid rgba(255,255,255,.06)` border, `var(--r-lg)` radius, 28px padding,
  max-width 420px, `var(--sh-elevated)` shadow.
- [ ] The modal backdrop is `rgba(0,0,0,.30)`, fixed inset-0, z-index 1000.
- [ ] `role="dialog"` and `aria-modal="true"` are set on the modal. Focus is trapped inside
  the modal while open. On close, focus returns to the "Cancel listing" button in the footer.
- [ ] "Keep listing" is the first focusable element in the modal (destructive action is not
  first in DOM order).

**Notes from UX / UR:**
- No UR findings file for auction-retract. Design decisions are grounded in player-listings and
  auctions UR, and validated against the principle that accidental actions must be reversible.
- "Keep listing" is the primary (safe) action; "Cancel listing" is secondary — this ordering
  is intentional and must not be reversed.

---

### Story 2: Cancel a listing from the My Listings card

As Harry,
I want to cancel a listing directly from the My Listings tab without having to navigate
into the pet's detail view,
So that I can manage all my listings efficiently from one place.

**Acceptance criteria:**
- [ ] Each card in the My Listings tab of StoreHubScreen shows a "Cancel" icon button in the
  top-right corner of the card.
- [ ] The icon button anatomy: `X` Lucide icon (14px, strokeWidth 2), 32px circle, background
  `var(--card)`, border `1px solid var(--border-s)`, icon colour `var(--t3)`. Hover state:
  background `var(--elev)`, icon `var(--t1)`, border `var(--border)`. Active: `scale(.97)`.
- [ ] The button has `aria-label="Cancel listing for [pet name]"` where [pet name] is the
  actual name of the listed pet.
- [ ] The minimum touch target is 44x44px. The visible circle is 32px; hit area is extended
  via padding.
- [ ] Tapping the icon button opens the same `ListingRetractModal` as Story 1, pre-populated
  with the correct pet summary data.
- [ ] The "Cancel" icon button only appears on My Listings tab cards (the player's own
  listings). It does not appear on Browse tab (NPC listings) cards.
- [ ] Post-retract: the listing card disappears from My Listings. If it was the last listing,
  the My Listings empty state appears.
- [ ] All AC from Story 1 covering the modal behaviour, error handling, and toast apply
  identically when the modal is triggered from this entry point.

---

### Story 3: Withdraw an auction bid from AuctionDetailSheet

As Harry,
I want to withdraw a bid I placed on an auction and get my coins back,
So that if I bid on the wrong auction or changed my mind, I can recover my coins without
waiting for the auction to end.

**Acceptance criteria:**
- [ ] In `AuctionDetailSheet`, when Harry has an active bid on the auction and the auction
  is not yet closed (won or lost), a "Withdraw my bid" text link appears below the bid
  area CTA.
- [ ] The link anatomy: text "Withdraw my bid", 13px/400, `var(--t3)`, no underline by
  default. Hover: `var(--t1)`, underline (`text-underline-offset 2px`). Active: opacity .7.
  Focus: `2px solid var(--blue)`, `outline-offset 2px`. Minimum touch target 44px height
  (padded vertically).
- [ ] When the auction is closed (won, lost, or expired), the "Withdraw my bid" link is
  absent from the DOM.
- [ ] When Harry has no bid on the auction, the "Withdraw my bid" link is absent from the DOM.
- [ ] Tapping "Withdraw my bid" opens the `BidRetractModal`. The modal is portalled to
  `document.body` via `ReactDOM.createPortal`.
- [ ] The `BidRetractModal` renders: title "Withdraw your bid?" (22px/600, `var(--t1)`),
  an auction mini-summary row (64x64 animal image `r-md object-cover`, animal name 15px/600,
  `RarityBadge`, bid amount row "Your bid: [X] coins" 13px/400 `var(--t3)`, summary row
  background `var(--elev)` r-md p-16), body copy "Your [X] coins will be returned to your
  wallet." where [X] is the exact bid amount as a numeral (body/400, `var(--t2)`),
  "Keep my bid" button (full width, `variant="outline"`, h-44), and "Withdraw bid"
  destructive button (full width, h-44, mt-8, red-outline treatment matching Story 1's
  destructive button).
- [ ] The body copy uses the exact coin amount (e.g. "Your 250 coins will be returned").
  Vague copy ("your coins") is not acceptable.
- [ ] "Keep my bid" closes the modal without making any state changes.
- [ ] Tapping "Withdraw bid" triggers the retract operation with loading state (same pattern
  as Story 1 — Loader2 spinner, both buttons disabled).
- [ ] TRANS-7: tapping "Withdraw bid" while in-flight produces no additional calls.
- [ ] On success: modal closes, a success toast fires with type `success`, title "[X] coins
  returned to your wallet" where [X] is the exact refund amount, duration 4000ms.
- [ ] TRANS-1: after a successful bid retract, Harry's coin balance equals the pre-retract
  balance plus the exact bid amount. Verified by recording balance before the retract and
  checking it after.
- [ ] The `earn(bidAmount)` call and the bid record deletion are inside a single
  `db.transaction('rw', ...)`. A separate `earn()` call outside the transaction boundary
  is a build defect — if the bid record deletion throws, the coins must not have been
  returned.
- [ ] The auction card in the Auction Hub returns to its "no bid" state (no bid indicator
  shown). `AuctionDetailSheet`, if still open, refreshes to show Harry is no longer the
  bidder and the "Withdraw my bid" link disappears.
- [ ] TRANS-3: if the retract operation fails, the modal stays open and actionable. Harry's
  bid record and coin balance are unchanged.
- [ ] TRANS-4: on error, a toast fires with type `error`, title "Could not cancel — please
  try again."
- [ ] TRANS-2: if the operation throws, `useWallet().coins` is identical to its pre-operation
  value. The bid record still exists.
- [ ] The modal uses the same glass surface, backdrop, role, focus-trap, and DOM ordering
  (safe action first) as Story 1's modal.

**Notes from UX / UR:**
- Transaction integrity is the highest-risk part of this story. A successful `earn()` with
  a failed bid record deletion would leave Harry with extra coins and a phantom bid.
  The transaction boundary is non-negotiable and must be explicitly tested in Phase D.
- Coin amount in toast and modal body copy must match the exact bid amount — not a rounded
  or formatted version.

---

## Definition of Done (confirmed)

This feature is complete when:
- [ ] All three stories above pass all acceptance criteria
- [ ] TRANS-1 verified for bid retract (exact coin delta confirmed)
- [ ] TRANS-2 verified for both retract flows (balance unchanged on error)
- [ ] TRANS-3 verified for both flows (modal stays open on error)
- [ ] TRANS-4 verified for both flows (error toast copy confirmed)
- [ ] TRANS-7 verified for both flows (no double submission)
- [ ] Both modals confirmed to use `ReactDOM.createPortal(content, document.body)`
- [ ] `BidRetractModal` transaction verified: `earn()` and bid record deletion in same
  `db.transaction('rw', ...)` block
- [ ] `aria-label` on My Listings "Cancel" icon button includes the pet name
- [ ] Focus trap working in both modals; focus returns to trigger element on close
- [ ] Tester has verified all ten DS checklist points in test-results.md
- [ ] Tester sign-off received
- [ ] No disconnected functionality

---

## Sign-off

Refined stories complete. Phase C may begin after [OWNER] approval.
