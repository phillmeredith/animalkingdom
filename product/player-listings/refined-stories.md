# Refined Stories: Player Listings

> Feature: Player Listings
> Author: Product Owner
> Status: Ready for Owner approval before Phase C
> Last updated: 2026-03-28
> Supersedes: 2026-03-27 version (see revision note below)
> Depends on: spec/features/player-listings/interaction-spec.md (2026-03-28),
>   research/player-listings/ur-findings.md

---

## Revision note

This version replaces the 2026-03-27 draft. The prior version was written before the
interaction spec was finalised (2026-03-28). The following decisions have changed:

1. **Price input**: the prior version adopted a three-preset-tier picker as a PO scope
   decision. The interaction spec (Phase A, finalised 2026-03-28) specifies a free-form
   numeric input with a single suggested-price pill per rarity band. The UX spec is the
   design authority for interaction patterns. This document defers to it. The three-tier
   preset picker is out of scope.

2. **10-second undo window**: the prior version scoped a deferred-delete undo mechanism.
   The interaction spec does not include this mechanism. The sell action in the spec is
   a two-step confirm (AcceptOfferModal) which provides sufficient protective friction
   for this user. Undo is out of scope for this phase.

3. **Care action blocking pattern**: the prior version described hidden CarePanel buttons
   or a generic locked-state copy. The spec defines a specific pattern: care buttons remain
   rendered with `aria-disabled="true"` (not native `disabled`), and an inline amber
   message appears below them on tap. The prior AC was incorrect.

4. **Release blocking pattern**: the prior version described the Release button as hidden
   for `for_sale` pets. The spec defines Release as visible but triggering
   `ForSaleReleaseBlockModal`. The prior AC was incorrect.

5. **Status value**: any occurrence of `"listed"` in the prior document was wrong. The
   correct DB value is `"for_sale"` throughout. This document uses `"for_sale"` exclusively.

---

## 1. Feature Summary

Player Listings lets Harry put one of his own animals up for sale at a price he sets,
and earn coins when an NPC buyer makes an acceptable offer. This is emotionally significant:
Harry names and cares for these animals. Selling is closer to rehoming a pet than completing
a transaction.

The feature is designed to acknowledge that weight without dramatising it. Harry sees a
clear warning before confirming. His pet stays visible in My Animals — it has not gone
anywhere yet. The amber "For Sale" badge tells him at a glance what state it is in. When
a buyer arrives and Harry accepts, the sale is confirmed through a two-step flow. A
celebration overlay leads with the coins earned ("X coins added!") before noting the
animal is gone ("found a new home") — copy order is intentional per UR findings.

Harry can always cancel a listing. The delist flow is low-friction on purpose.

The feature extends two existing screens: My Animals (PetDetailSheet gains a "List for
Sale" action) and Marketplace (My Listings tab is activated from stub).

NPC buyers only in Tier 3. No player-to-player sales.

---

## 2. Story Map

| Story | Title | Priority | Dependencies |
|-------|-------|----------|--------------|
| PL-1 | List a pet for sale (price input + confirm) | Must | schema: `for_sale` status |
| PL-2 | For-sale badge on pet card in My Animals | Must | PL-1 |
| PL-3 | Care action block — inline amber, aria-disabled | Must | PL-1 |
| PL-4 | Release block — ForSaleReleaseBlockModal | Must | PL-1 |
| PL-5 | My Listings screen — active listings view | Must | PL-1 |
| PL-6 | NPC buyer offer mechanic — offer arrives | Must | PL-5 |
| PL-7 | Sale completion — earn + status update in transaction + celebration | Must | PL-6 |
| PL-8 | Decline an offer | Should | PL-6 |
| PL-9 | Cancel a listing (delist) | Must | PL-5 |
| PL-10 | 7-day listing expiry | Should | PL-5 |
| PL-11 | Empty state — no active listings | Should | PL-5 |

---

## 3. In Scope / Out of Scope

| Area | In Scope | Out of Scope |
|------|----------|--------------|
| "List for Sale" button in PetDetailSheet footer | Yes | — |
| ListForSaleSheet: free-form price input + suggested pill per rarity | Yes | — |
| Confirm step with warning banner before listing is created | Yes | — |
| `savedNames.status` set to `"for_sale"` on listing creation | Yes | — |
| Amber "For Sale" badge on pet card in My Animals grid | Yes | — |
| `for_sale` pets visible (not hidden) in My Animals with badge | Yes | — |
| CarePanel inline amber message + `aria-disabled` when pet is `for_sale` | Yes | — |
| ForSaleReleaseBlockModal when Release tapped on `for_sale` pet | Yes | — |
| My Listings tab in MarketplaceScreen (replaces stub) | Yes | — |
| PlayerListingCard with asking price, listed date, Remove button | Yes | — |
| NpcOfferCard with Accept / Decline actions inline in listing card | Yes | — |
| AcceptOfferModal — confirmation before sale completes | Yes | — |
| SoldCelebrationOverlay via `createPortal(content, document.body)` | Yes | — |
| `earn()` + `savedNames.status` update inside one `db.transaction()` | Yes | — |
| NPC first offer: 30-minute to 4-hour window (configurable constant) | Yes | — |
| 7-day listing expiry — auto-revert pet to `"active"`, expired toast | Yes | — |
| DelistModal — remove listing, pet reverts to `"active"` | Yes | — |
| Empty state in My Listings tab | Yes | — |
| "Offer received" toast from anywhere in the app (tap navigates to My Listings) | Yes | — |
| Listing expiry: expired summary shown on next visit to My Listings | Yes | — |
| Player-to-player direct sales | Out of scope | NPC buyers only this phase |
| Price negotiation / counter-offer mechanic | Out of scope | Binary accept/decline only |
| Listing history / past sales screen | Out of scope | Tier 4 feature |
| Push notifications (OS-level) | Out of scope | In-app toast only |
| Listing items (equipment, saddles) | Out of scope | Pets only |
| Relist flow from expiry summary | Out of scope | Expiry summary shown; relist CTA deferred to Tier 4 |
| Views counter surfaced to Harry | Out of scope | Internal seeding only; not shown |
| Three-preset-tier price picker | Out of scope | Replaced by free-form input per interaction spec |
| 10-second undo window after accepting offer | Out of scope | Two-step AcceptOfferModal provides sufficient friction |

---

## 4. User Stories and Acceptance Criteria

---

### Story PL-1 — List a pet for sale (price input + confirm)

As Harry,
I need to put one of my animals up for sale directly from their profile, set a price I
choose, see a warning about what will be locked, and confirm before it goes live,
so that I can earn coins from animals I'm ready to part with and feel in control of the
decision.

**Acceptance criteria:**

- [ ] The PetDetailSheet footer shows a "List for Sale" button (`variant="primary"`, blue,
      `size="md"`, minimum 44px height) when `pet.status === "active"`.
- [ ] "List for Sale" is the third button in the footer row. At 375px the row wraps to two
      rows (Rename + Release on row one; List for Sale full-width on row two). At 768px+ the
      footer uses a 2-column grid (`grid grid-cols-2 gap-2`).
- [ ] "List for Sale" does not appear when `pet.status === "for_sale"`. It is replaced by
      a non-interactive amber badge "Listed for sale" (amber tint pair:
      `bg-[var(--amber-sub)]`, `border border-[var(--amber)]`, `text-[var(--amber-t)]`).
- [ ] Tapping "List for Sale" opens `ListForSaleSheet` as a BottomSheet sliding up above
      the existing PetDetailSheet. Focus moves to the first interactive element in the sheet
      on open.
- [ ] The price step shows: pet mini-summary row (64×64px image, name 16px/600, RarityBadge),
      a numeric price input (`h-[44px]`, `r-md`, `--card` bg, `1.5px solid --border-s`),
      and a single suggested-price pill for the pet's rarity band.
- [ ] Suggested prices by rarity: Common 50, Uncommon 150, Rare 350, Epic 800, Legendary 1500.
      Only the pill matching `pet.rarity` is shown. One pill is shown, not all five.
- [ ] Tapping the suggested-price pill populates the price input with that value. The pill
      activates (amber tint pair style: `bg-[var(--amber-sub)]`, `border-[var(--amber)]`,
      `text-[var(--amber-t)]`). Clearing the input deactivates the pill.
- [ ] Price input focus state: `1.5px solid --blue`, `box-shadow 0 0 0 3px var(--blue-sub)`.
- [ ] Price input error state (non-numeric input): `1.5px solid --red`,
      `box-shadow 0 0 0 3px var(--red-sub)`, inline error below input
      "Please enter a whole number" (`12px/400`, `--red-t`), announced via `aria-describedby`.
- [ ] "Review listing" button (`variant="primary"`, blue, `size="lg"`, `w-full`) is disabled
      (`opacity: 0.4`, `pointer-events: none`) when price input is empty or 0. It is enabled
      when a valid positive integer is present.
- [ ] Tapping "Review listing" with a valid price transitions the sheet to the confirm step
      without closing and reopening the sheet. The price value is preserved.
- [ ] The confirm step shows: Back button (`variant="outline"`, `size="sm"`, ChevronLeft icon,
      returns to price step with price preserved); pet summary card (`--elev` bg, `r-md`,
      `p-16`); asking price row (Coins icon 14px `--amber` + price value `16px/700 --amber-t`);
      amber warning banner (`AlertTriangle` icon 16px `--amber` + "While listed, [Name] cannot
      be raced or cared for." 14px/400 `--t1`).
- [ ] "List [Name]" button on confirm step (`variant="accent"`, pink, `size="lg"`, `w-full`)
      calls `useMarketplace.createListing(petId, price)` on tap. Button enters loading state
      (Loader2 spinner, disabled) during the call.
- [ ] On success: `savedNames.status` is set to `"for_sale"`. ListForSaleSheet closes
      (spring animation out). PetDetailSheet closes. Success toast fires: "[Name] is now listed
      for sale." (info variant, 3s auto-dismiss). Harry remains in My Animals — no navigation
      change.
- [ ] On error: error toast "Something went wrong — please try again." (persistent).
      ListForSaleSheet stays open on the confirm step. Pet `status` is unchanged.
- [ ] A "Cancel" button (`variant="outline"`, `size="md"`, `w-full`) is present on both steps.
      Tapping it closes the sheet without creating a listing. No state changes.
- [ ] `createListing` called defensively for an already-`for_sale` pet returns an error.
      Toast: "Something went wrong — please try again." This path is not normally reachable
      (button is hidden) but must be handled.

**Definition of done:**
- [ ] ListForSaleSheet renders at 375px, 768px, and 820px with no layout defects.
- [ ] Price input accepts only positive integers; non-numeric input shows inline error.
- [ ] Both steps of the sheet are navigable forward and back with price preserved.
- [ ] Success path sets `status: "for_sale"` in Dexie and shows correct toast.
- [ ] Error path leaves pet status unchanged.
- [ ] BottomSheet glass treatment confirmed: `rgba(13,13,17,.80)`, `backdrop-filter: blur(24px)`,
      `1px solid rgba(255,255,255,.06)`.

**Out of scope for this story:**
- Three-preset-tier price picker (prior design — replaced by free-form input + suggested pill)
- Price negotiation or counter-offer mechanics

---

### Story PL-2 — For-sale badge on pet card in My Animals

As Harry,
I need my listed animal to stay visible in My Animals with a badge showing they are
waiting for a buyer,
so that I always know where they are and can see they have not gone anywhere yet.

**Acceptance criteria:**

- [ ] Pets with `status === "for_sale"` are included in the My Animals collection view. The
      existing query must be updated to return both `"active"` and `"for_sale"` pets. `for_sale`
      pets are not hidden, filtered out, or moved to the end of the list.
- [ ] PetCard with `status === "for_sale"` renders an amber "For Sale" badge positioned
      absolute, top-left over the image (2px inset). Badge style: amber tint pair
      (`bg-[var(--amber-sub)]`, `border border-[var(--amber)]`, `text-[var(--amber-t)]`,
      `12px/600`, `4px 10px padding`, `100px border-radius`).
- [ ] The "For Sale" badge replaces the care state indicator (CheckCircle / AlertCircle) for
      the duration of the listing. Both must not be shown simultaneously.
- [ ] The pet card is NOT visually greyed out, dimmed, or given reduced opacity. The card
      reads as present and accessible.
- [ ] The card remains tappable. Tapping it opens PetDetailSheet in the locked state
      (see PL-3 and PL-4 for locked state details).
- [ ] The card hover lift pattern is identical to active pet cards (same DS hover treatment).
- [ ] The pet card's `aria-label` is updated to "[Name] is listed for sale" when
      `status === "for_sale"`.
- [ ] PetDetailSheet for a `for_sale` pet: the header row shows RarityBadge + amber
      "Listed for sale" badge side by side. The footer "List for Sale" button is replaced
      by the non-interactive amber "Listed for sale" badge. The "Rename" button is hidden.
      The "Dress Up" button (Stables category) is hidden while listed.

**Definition of done:**
- [ ] `for_sale` pets appear in My Animals grid alongside `active` pets.
- [ ] "For Sale" badge is amber tint pair (not solid amber fill — verify DS compliance).
- [ ] Care state indicator and "For Sale" badge are never shown simultaneously.
- [ ] PetDetailSheet locked state renders correctly: "List for Sale" replaced by badge,
      Rename hidden.
- [ ] Verified at 375px, 768px, and 820px: badge is readable on cards in 2-column and
      3-column grid layouts.

**Out of scope for this story:**
- Tab-level banner counting listed pets ("1 pet looking for a new home") — badge on card is sufficient

---

### Story PL-3 — Care action block (inline amber, aria-disabled)

As Harry,
I need to see a clear, in-context message when I try to care for an animal that is listed
for sale,
so that I understand why care is unavailable and know exactly how to unlock it, without
the app feeling broken.

**Acceptance criteria:**

- [ ] When `pet.status === "for_sale"`, the CarePanel renders its header (care streak counter
      remains visible as it is informational, not an action).
- [ ] The care action buttons (Feed, Clean, Play) are rendered with `aria-disabled="true"` and
      `opacity: 0.4`. Native `disabled` attribute must NOT be used — it removes elements from
      tab order and prevents screen readers from explaining the blocked state.
- [ ] The care buttons are still focusable and still receive tap/click events when
      `aria-disabled="true"`.
- [ ] When a care button with `aria-disabled="true"` is tapped, an inline amber message
      appears within the CarePanel, below the action buttons:
      "Can't care for [Name] while listed — remove the listing first."
      (14px/400, `--amber-t`). This message is NOT a toast. It appears and remains visible
      in the CarePanel context until the user leaves the sheet.
- [ ] The inline message is associated with the care buttons via `aria-describedby` so
      screen readers announce it when focus moves to a disabled button.
- [ ] No care action (feed, clean, play) is applied to the pet when a button in the
      `aria-disabled` state is tapped. No CareLog entry is created.
- [ ] If `pet.status` changes back to `"active"` (listing cancelled or expired) while the
      CarePanel is open, the inline amber message clears and care buttons return to their
      normal state via live query update.

**Definition of done:**
- [ ] CarePanel checks `pet.status` before rendering action state. `for_sale` renders
      `aria-disabled` buttons + inline message path confirmed.
- [ ] Tapping a disabled care button shows inline message, not a toast.
- [ ] No CareLog entry is written when `aria-disabled` buttons are tapped.
- [ ] Native `disabled` attribute is absent from care buttons when `status === "for_sale"`.

**Out of scope for this story:**
- Greying out the entire pet card in the My Animals grid (UR finding: greyed-out cards
  read as broken or gone, which causes anxiety — badge is the correct signal)

---

### Story PL-4 — Release block (ForSaleReleaseBlockModal)

As Harry,
I need to be told clearly why I cannot release an animal that is listed for sale, and
be given a direct route to remove the listing,
so that I am never confused about why the Release action is not working.

**Acceptance criteria:**

- [ ] When `pet.status === "for_sale"`, the "Release" button is visible in PetDetailSheet
      (it is NOT hidden). It is rendered in its standard style — not dimmed or `aria-disabled`.
- [ ] Tapping "Release" on a `for_sale` pet does NOT begin the release flow. Instead,
      `ForSaleReleaseBlockModal` opens immediately.
- [ ] `ForSaleReleaseBlockModal` is a centred modal rendered via
      `ReactDOM.createPortal(content, document.body)`. Glass treatment: `rgba(13,13,17,.80)`,
      `backdrop-filter: blur(24px)`, `1px solid rgba(255,255,255,.06)`. Backdrop:
      `rgba(0,0,0,.30)`.
- [ ] Modal content:
      - Heading: "[Name] is listed for sale" (H4, `--t1`)
      - Body: "Remove the listing before releasing [Name]." (14px/400, `--t2`)
      - "Go to My Listings" button (`variant="primary"`, `size="md"`) — navigates to
        `/marketplace` with My Listings tab active, then closes PetDetailSheet and the modal.
      - "Close" button (`variant="outline"`, `size="md"`) — dismisses the modal only.
- [ ] Focus moves to "Go to My Listings" on modal open.
- [ ] The release flow (pet deleted from collection) does not execute when this modal is shown.
- [ ] `ForSaleReleaseBlockModal` is NOT a toast. Harry must actively dismiss it. A toast
      would be missed by a user focused on the PetDetailSheet (UR finding for ADHD/autistic
      users).
- [ ] Body scroll is locked while the modal is open. Scroll lock uses a reference-counted
      mechanism (not direct `document.body.style.overflow` assignment) to handle simultaneous
      overlays correctly.

**Definition of done:**
- [ ] Release button is visible (not hidden) on `for_sale` pet in PetDetailSheet.
- [ ] Tapping Release opens `ForSaleReleaseBlockModal`, not the release confirmation.
- [ ] Modal is rendered via `createPortal` — confirmed by grepping component for
      `position: fixed` inside a non-portal path.
- [ ] "Go to My Listings" navigates correctly and closes both the modal and the sheet.
- [ ] No pet is released while `status === "for_sale"` on any code path.

**Out of scope for this story:**
- Cancelling the listing directly from this modal — Harry must go to My Listings to cancel

---

### Story PL-5 — My Listings screen (active listings view)

As Harry,
I need one place where I can see all the animals I have listed for sale and check whether
any buyers have shown interest,
so that I do not have to search through My Animals to find out what is happening with
my listings.

**Acceptance criteria:**

- [ ] MarketplaceScreen "My Listings" tab is the second tab in the segment switcher
      (`centre` slot of PageHeader, existing segmented control). Tab label: "My Listings",
      with `Tag` Lucide icon (16px) left of label text.
- [ ] The My Listings content column uses: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`.
      The `pt-4` is mandatory — no content may sit flush against the glass header border.
- [ ] PlayerListingCard renders for each `playerListings` record with `status === "active"`.
      Cards are stacked in a single-column list (not a grid).
- [ ] PlayerListingCard anatomy:
      - Surface: `--card` bg, `1px solid --border-s`, `r-lg` (16px), `p-[16px]`
      - Left accent: `3px solid var(--amber)` (border-left)
      - Row 1: animal image (48×48px, `r-md`, `object-cover`, `shrink-0`), pet name
        (`14px/600, --t1`, truncate), asking price (Coins icon 12px `--amber` + price value
        `14px/700 --amber-t`), "Listed [X] days ago" (`11px/500, --t3`), "Remove" button
        (`variant="outline"`, `size="sm"`, `shrink-0`, minimum 44×44px touch target).
      - Below row 1, if no offers: "Waiting for buyers..." (`13px/400, --t3`, italic,
        centred, separated by `1px solid --border-s` top border, `mt-12 pt-12`).
      - Below row 1, if NpcBuyerOffer records exist: NpcOfferCard(s) stacked vertically,
        `gap-8`, most recent first, maximum 3 shown.
- [ ] NpcOfferCard anatomy:
      - Surface: `--elev` bg, `1px solid var(--amber)` border, `r-md` (12px), `p-16`, `mt-8`
      - Row 1: NPC avatar (24×24px circle, `--elev` bg, User Lucide icon 12px `--t3`), NPC
        name (`13px/600, --t1`, truncate), offer amount (Coins icon 12px `--amber` + amount
        `14px/700 --amber-t`)
      - NPC message: `13px/400`, italic, `--t2`, `line-clamp-2`, `mt-8`
      - Button row: "Accept" (`variant="accent"`, `size="sm"`, `flex-1`, min 44px height) +
        "Decline" (`variant="outline"`, `size="sm"`, `flex-1`, min 44px height), `mt-12 gap-8`
- [ ] While listings are loading: 2 skeleton rows (card-height, `--elev` bg, pulse animation).
      Under `prefers-reduced-motion`: static placeholders, no pulse.
- [ ] Content column verified at 375px, 768px, and 820px. No wasted space, no cut-off content.
- [ ] The My Listings content component does not render its own tab switcher. The active tab
      is passed as a prop from MarketplaceScreen. Dual navigation is a build defect.

**Definition of done:**
- [ ] PlayerListingCard and NpcOfferCard render with correct anatomy at all breakpoints.
- [ ] Single-column list at 820px (not a grid).
- [ ] "Waiting for buyers..." shown when no offers. NpcOfferCards shown when offers exist.
- [ ] Content column has `pt-4` and `pb-24` confirmed.
- [ ] Tab switcher lives only in PageHeader centre slot — not re-rendered inside My Listings
      content.

**Out of scope for this story:**
- Filter or sort controls on My Listings (no useful sort order for a small personal list)
- Offer count badges on the tab label

---

### Story PL-6 — NPC buyer offer mechanic

As Harry,
I need to receive offers from NPC buyers after I list an animal, and be alerted wherever
I am in the app when one arrives,
so that I have a reason to check back and do not miss the moment to act.

**Acceptance criteria:**

- [ ] The first NPC offer on a listing arrives no sooner than 30 minutes and no later than
      4 hours after listing creation. These bounds are stored as configurable constants
      (e.g. `NPC_OFFER_MIN_DELAY_MS` and `NPC_OFFER_MAX_DELAY_MS`) — not hardcoded inline.
- [ ] Subsequent offers (if any) are spaced at least 1 hour apart. Maximum 3 NPC offers per
      listing lifetime (not per session — across the full 7 days).
- [ ] Offer arrival timing is governed by a price-to-market ratio:
      - Price at 70% of market value or below: up to 3 offers expected
      - Price at 71%–150% of market value: up to 2 offers expected
      - Price above 150% of market value: 1 offer expected, may be below asking price
      These rules are used to seed the client-side NPC simulation. The Developer must
      confirm the simulation mechanism is consistent with the existing NPC generation pattern.
- [ ] When an NpcBuyerOffer record is created in Dexie, an info toast fires from anywhere
      in the app: "Someone's interested in [Name]! Check My Listings." (3s, tappable).
      Tapping the toast navigates to `/marketplace` with My Listings tab active.
- [ ] The toast fires via the global toast system — not from within MarketplaceScreen. It
      must be visible on any screen Harry is currently viewing.
- [ ] NPC offer amounts are at or below the listing's asking price unless Harry has set a
      price below market value, in which case NPC may offer the asking price. Offers above
      asking price do not occur in this phase.
- [ ] NPC buyer names and messages are drawn from a seeded pool. Names and messages must
      not contain emoji characters — Lucide avatar placeholder only (User icon).

**Definition of done:**
- [ ] First offer timing constants are extractable and configurable without code changes.
- [ ] Toast fires on offer creation and is visible from any screen.
- [ ] Maximum 3 offers per listing enforced.
- [ ] NPC names/messages contain no emoji.

**Out of scope for this story:**
- NPC profile pages, avatar images, or buyer history
- Offer amounts above the asking price

---

### Story PL-7 — Sale completion (earn + status update in transaction + celebration)

As Harry,
I need to confirm I want to accept an offer, then see a celebration when the sale goes
through and the coins appear in my wallet,
so that the sale feels like a rewarding moment rather than a sudden loss.

**Acceptance criteria:**

- [ ] Tapping "Accept" on an NpcOfferCard opens `AcceptOfferModal`. Modal is rendered via
      `ReactDOM.createPortal(content, document.body)`.
- [ ] `AcceptOfferModal` anatomy:
      - Backdrop: `rgba(0,0,0,.30)` fixed inset (intentionally darker than standard DS
        `bg-black/10` — this is a significant irreversible action; documented variance)
      - Modal surface: `rgba(13,13,17,.80)`, `backdrop-filter: blur(24px)`,
        `1px solid rgba(255,255,255,.06)`, `r-lg` (16px), `p-[28px]`, `max-w-[420px]`
      - Heading: "Accept offer?" (H4, `22px/600`, `--t1`)
      - Summary row: `--elev` bg, `r-md`, `p-12 16`, pet name (`14px/600, --t1`), offer
        amount (Coins icon 14px `--amber` + amount `16px/700 --amber-t`)
      - Body: "[Name] will leave your collection." (`14px/400, --t2`)
      - "Cancel" button (`variant="outline"`, `size="md"`, `flex-1`)
      - "Accept offer" button (`variant="accent"`, pink, `size="md"`, `flex-1`)
      - Focus moves to "Accept offer" on modal open.
- [ ] Tapping "Accept offer" calls `useMarketplace.acceptNpcBuyerOffer(offerId)`. Button
      enters loading state (Loader2 spinner, disabled). Modal stays open during loading.
- [ ] On success, inside a single `db.transaction('rw', ...)`:
      - `useWallet.earn(offerAmount, source, 'marketplace', petId)` is called
      - `savedNames` record for the pet is deleted (pet removed from collection)
      - `playerListings.status` is set to `"sold"`
      These three operations MUST be in the same transaction. Earn and pet deletion
      outside the same transaction is a build defect — if earn succeeds and deletion fails,
      Harry loses coins and the pet remains. The Developer must verify this before Phase C
      is marked complete.
- [ ] On success: AcceptOfferModal closes. `SoldCelebrationOverlay` fires.
- [ ] `SoldCelebrationOverlay` is rendered via `ReactDOM.createPortal(content, document.body)`.
      A `fixed` element inside a `motion.*` subtree without a portal is a build defect.
- [ ] `SoldCelebrationOverlay` anatomy:
      - Surface: `position: fixed`, `inset-0`, `z-[2000]`, background `var(--grad-warm)`
        (opaque celebration surface, not glass)
      - Contents centred: Coins Lucide icon (64px, white stroke, `stroke-width: 1.5`),
        "[X] coins added!" (H2, `36px/700`), "[Name] found a new home." (Body Lg, `18px/400`),
        "Great!" button (`variant="accent"`, pink, `size="lg"`, `mt-8`)
      - Copy order is intentional: coins value FIRST, pet departure SECOND (per UR finding 4)
      - Copy MUST use "found a new home" — not "sold" or "traded"
      - Coins icon animation: `scale: 0.5, opacity: 0` → `scale: 1, opacity: 1` with spring
        bounce on mount. Under `prefers-reduced-motion`: skip scale, fade-in only.
      - At 375px: Coins icon reduced to 48px, heading reduced to H3 (28px/600).
- [ ] Overlay auto-dismisses after 4 seconds if Harry does not tap. "Great!" button also
      dismisses immediately on tap. Focus returns to My Listings tab on dismiss.
- [ ] Other pending NpcBuyerOffers on the same listing are auto-declined by the system
      after the sale completes.
- [ ] On error: error toast "Something went wrong — please try again." AcceptOfferModal
      stays open. No coins are credited. Pet status is unchanged.

**Definition of done:**
- [ ] `earn()` and pet deletion confirmed inside a single `db.transaction()` in hook code.
- [ ] `SoldCelebrationOverlay` uses `createPortal` — no `position: fixed` inside motion tree.
- [ ] Overlay copy reads "[X] coins added!" then "[Name] found a new home." in that order.
- [ ] `prefers-reduced-motion` respected: no scale animation, fade-in only.
- [ ] CoinDisplay updates after sale confirming wallet balance changed.
- [ ] Error path leaves pet and wallet unchanged.

**Out of scope for this story:**
- 10-second undo window (prior design — removed; AcceptOfferModal provides sufficient friction)
- Confetti particle animation (not in interaction spec for this overlay)

---

### Story PL-8 — Decline an offer

As Harry,
I need to say no to an NPC buyer's offer without losing my listing,
so that I can wait for a better offer or change my mind.

**Acceptance criteria:**

- [ ] Tapping "Decline" on an NpcOfferCard calls `useMarketplace.declineNpcBuyerOffer(offerId)`
      immediately with no confirmation modal or dialog.
- [ ] The NpcOfferCard animates out: slide-left exit, 300ms (`x: 0 → -100%`, `opacity: 1 → 0`).
      Under `prefers-reduced-motion`: instant removal with no animation.
- [ ] The listing remains active with `status === "active"`. No toast is shown — the visual
      removal of the offer card is sufficient feedback.
- [ ] No coins change hands on decline.
- [ ] If the declined offer was the only offer on the listing, "Waiting for buyers..." text
      re-appears below the listing card after the card exits.
- [ ] On error calling `declineNpcBuyerOffer`: error toast "Something went wrong — please try
      again." The offer card remains visible.

**Definition of done:**
- [ ] Decline requires no confirmation — one tap removes the offer.
- [ ] Slide-left exit animation plays unless `prefers-reduced-motion` is set.
- [ ] Listing status remains `"active"` after decline.
- [ ] No coin changes in wallet after decline.

**Out of scope for this story:**
- Feedback to NPC (no narrative response to decline)
- Re-invitation mechanic (a declined NPC may make no further offers — this is acceptable)

---

### Story PL-9 — Cancel a listing (delist)

As Harry,
I need to take my animal off the market and bring them back into my collection at any time,
so that I can race them or care for them again if I change my mind about selling.

**Acceptance criteria:**

- [ ] Tapping "Remove" on a PlayerListingCard opens `DelistModal`. Modal rendered via
      `ReactDOM.createPortal(content, document.body)`.
- [ ] `DelistModal` anatomy:
      - Backdrop and surface: same glass treatment as AcceptOfferModal
      - Heading: "Remove listing?" (H4, `22px/600`, `--t1`)
      - Body: "[Name] will return to your collection and be available again." (`14px/400, --t2`)
      - "Keep listed" button (`variant="outline"`, `size="md"`, `flex-1`) — focus moves
        here on open (safer default, prevents accidental confirm on Enter)
      - "Remove listing" button (`variant="outline"`, `size="md"`, `flex-1`) — NOT red,
        NOT accent. Delisting is a reversible, non-destructive action. The pet is safe.
        Loading state: Loader2 spinner while call is in flight.
- [ ] Focus moves to "Keep listed" on modal open.
- [ ] Tapping "Remove listing" calls `useMarketplace.cancelListing(listingId)`.
- [ ] On success: inside a single `db.transaction()`, `playerListings.status` → `"cancelled"`,
      `savedNames.status` → `"active"`. These two updates must be atomic — a partial update
      where listing is cancelled but pet remains `"for_sale"` leaves the collection in an
      inconsistent state.
- [ ] On success: modal closes. The PlayerListingCard animates out (fade-out, 200ms).
      Under `prefers-reduced-motion`: instant removal.
- [ ] Info toast fires: "[Name] is back in your collection." (info variant, 3s auto-dismiss).
- [ ] `savedNames` live query updates immediately — pet card in My Animals loses the
      "For Sale" badge and becomes fully available for care, racing, etc.
- [ ] All active NpcBuyerOffers on the listing are auto-declined by the system on cancellation.
- [ ] On error: error toast "Something went wrong — please try again." Modal stays open.

**Definition of done:**
- [ ] `cancelListing` and `savedNames.status → "active"` confirmed in same `db.transaction()`.
- [ ] "Remove listing" button is `variant="outline"` (not red, not accent) — visually confirmed.
- [ ] Focus defaults to "Keep listed" on open.
- [ ] Pet is immediately available in My Animals after delist (care, race flows confirmed).

**Out of scope for this story:**
- Relisting from the delist modal — Harry relists via the normal PetDetailSheet flow

---

### Story PL-10 — 7-day listing expiry

As Harry,
I need to know what happened to my listing if no one buys my animal within a week,
so that I am not confused about where my animal went or whether something broke.

**Acceptance criteria:**

- [ ] Each `playerListings` record has an `expiresAt` timestamp set at creation time:
      `createdAt + 7 days`. This duration is a configurable constant
      (`LISTING_EXPIRY_DAYS = 7`) — not hardcoded inline.
- [ ] When `expiresAt` passes and `playerListings.status === "active"`:
      - `playerListings.status` → `"expired"` (atomic with the pet status update below)
      - `savedNames.status` → `"active"` (pet returns to collection)
      These two updates must be in the same `db.transaction()`.
- [ ] An info toast fires at expiry time (or on next app open if Harry was offline):
      "[Name]'s listing has expired. They're back in your collection." (3s, info variant).
- [ ] On the next visit to the My Listings tab after expiry, an expired summary card renders
      at the top of the list. Summary card shows: pet name, listing duration, number of
      offers received, highest offer received (if any), and the message "Nobody brought
      [Name] home this time." One button: "OK, got it" (`variant="outline"`, `size="sm"`)
      which removes the card from the list.
- [ ] If Harry was offline when the listing expired: the summary card appears on the next
      app open regardless of time elapsed, as long as the listing has not been relisted.
- [ ] After expiry, the pet appears in My Animals without the "For Sale" badge and is
      fully available for care, racing, and re-listing.
- [ ] If multiple listings expire simultaneously, each produces its own toast (sequential,
      not merged) and its own summary card.

**Definition of done:**
- [ ] Expiry constant `LISTING_EXPIRY_DAYS` is extractable without code changes.
- [ ] Pet status reverts to `"active"` on expiry, confirmed in live query.
- [ ] Expiry toast fires. Summary card renders on next My Listings visit.
- [ ] Summary card "OK, got it" button removes it from the list.

**Out of scope for this story:**
- Relist CTA on the expiry summary card (deferred to Tier 4)
- Expiry history / past listings screen (Tier 4)

---

### Story PL-11 — Empty state: no active listings

As Harry,
I need to see something helpful when I have not listed any animals yet,
so that I know what the My Listings tab is for and how to get started.

**Acceptance criteria:**

- [ ] When the player has no `playerListings` records with `status === "active"`, the
      My Listings tab renders the empty state (not a blank screen, not a loader).
- [ ] Empty state contents:
      - `Tag` Lucide icon, 48px, `--t4` colour
      - Title: "Nothing listed yet" (`18px/600`, `--t1`)
      - Description: "List a pet from My Animals to start earning coins." (`14px/400`, `--t2`)
      - CTA button: "Go to My Animals" (`variant="primary"`, blue, `size="md"`) navigating
        to `/animals`
- [ ] The empty state is centred vertically within the available content area (below the
      PageHeader, above the BottomNav).
- [ ] If expired summary cards exist but no active listings exist, the expired summary
      card(s) render above the empty state copy (they are not active listings but they are
      relevant context).

**Definition of done:**
- [ ] Empty state renders when no active listings exist.
- [ ] "Go to My Animals" navigates to `/animals`.
- [ ] No emoji used in empty state copy or icon.

**Out of scope for this story:**
- A tutorial or onboarding walkthrough for the listing flow

---

## 5. Technical Notes for Developer

### Critical: earn() + pet deletion must be in one db.transaction()

`useWallet.earn()` signature: `earn(amount, source, category, relatedEntityId?)`.
The existing implementation wraps `playerWallet` update and `transactions.add()` inside
`db.transaction('rw', db.playerWallet, db.transactions, ...)`.

For sale completion (PL-7), the outer hook must wrap ALL of the following in a single
`db.transaction('rw', db.playerWallet, db.transactions, db.savedNames, db.playerListings, ...)`:
1. `earn()` call (which internally operates on `playerWallet` and `transactions`)
2. `savedNames` record deletion
3. `playerListings.status` update to `"sold"`

If earn() succeeds and pet deletion throws, Harry loses coins and the pet remains. This
is data corruption with no recovery path. Verify transaction boundary before Phase C
is marked complete.

### Critical: cancelListing() must update both records atomically

`cancelListing(listingId)` must wrap `playerListings.status → "cancelled"` and
`savedNames.status → "active"` in a single `db.transaction()`. Partial update (listing
cancelled, pet remains `"for_sale"`) leaves the system in an unrecoverable state where
Harry cannot care for, race, or relist the animal.

### SoldCelebrationOverlay must use createPortal

The overlay uses `position: fixed` and renders above all content (`z-[2000]`). Any
ancestor element with `transform`, `opacity < 1`, `filter`, or `will-change: transform`
creates a new stacking context and traps the fixed child inside it. Framer Motion
animated parents commonly have `opacity: 0` in their `initial` state. Verify the overlay
is mounted via `ReactDOM.createPortal(content, document.body)` — grep for `position: fixed`
in the component file to confirm it is not inside a non-portal path.

### NPC offer timing constants

Constants must be module-level exports, not inline values:
- `NPC_OFFER_MIN_DELAY_MS` — 30 minutes (1_800_000)
- `NPC_OFFER_MAX_DELAY_MS` — 4 hours (14_400_000)
- `NPC_OFFER_MIN_SPACING_MS` — 1 hour (3_600_000)
- `NPC_OFFER_MAX_PER_LISTING` — 3
- `LISTING_EXPIRY_DAYS` — 7

These constants must be importable for testing without mocking the entire hook.

### savedNames query update

The existing My Animals query almost certainly filters `status === "active"` only. This
filter must be updated to include `"for_sale"` pets. Identify all consumers of this query
before changing it — any consumer that assumes only `"active"` pets are returned will need
auditing (e.g. race entry pet selector, which must explicitly re-apply the `status === "active"`
filter independently).

### useMarketplace method signatures (to be confirmed by Developer in Phase C)

- `createListing(petId: number, price: number): Promise<void>`
- `acceptNpcBuyerOffer(offerId: number): Promise<void>`
- `declineNpcBuyerOffer(offerId: number): Promise<void>`
- `cancelListing(listingId: number): Promise<void>`

### checkBadgeEligibility()

Any hook that triggers a badge-eligible event (marketplace category) must call
`checkBadgeEligibility()` after the event fires. `acceptNpcBuyerOffer` is a marketplace
event. Do not stub this with an empty return.

### ForSaleReleaseBlockModal — body scroll lock

The modal uses `position: fixed` and requires body scroll lock. The scroll lock mechanism
must be reference-counted. If PetDetailSheet (a BottomSheet) is already open when this
modal fires, two overlays are simultaneously open. Direct `document.body.style.overflow = 'hidden'`
assignment is prohibited — the first overlay to close will set `overflow = ''` and
unblock scroll while the second is still open.

---

## 6. Open Questions

**OQ-PL-1 (NPC simulation mechanism):**
The spec references client-side NPC offer simulation. The Developer must confirm whether
the existing NPC offer generation pattern (from auctions or marketplace browse) can be
reused, or whether a new simulation timer mechanism is required. Non-blocking for Phase C
start — but must be resolved before `usePlayerListings` hook is marked complete.

**OQ-PL-2 (countered offer status):**
The `npcBuyerOffers` entity includes a `"countered"` status field. Counter-offers are out
of scope. If an offer in `"countered"` status arrives in the My Listings query results,
the UI must handle it gracefully without exposing the counter mechanic to Harry. The
Developer must confirm whether defensive filtering is needed in `usePlayerListings`.

**OQ-PL-3 (marketValue source):**
`marketValue` must be set at `createListing` time. It is a field on `playerListings`, not
on `savedNames`. The Developer must confirm whether `marketValue` is derived from rarity
alone (lookup table) or requires a more complex calculation. The suggested prices in the
interaction spec (50 / 150 / 350 / 800 / 1500 by rarity) are the reference values. The
`marketValue` should equal the "fair price" (100%) for each rarity band.

---

## 7. Explicit Out of Scope Summary

The following are explicitly out of scope for this phase. They must not be built under
"continue" pressure or treated as low-hanging fruit.

- Player-to-player sales
- Price negotiation / counter-offer mechanic
- Listing history / past sales screen
- Push notifications (OS-level)
- Listing items other than pets (equipment, saddles)
- Relist CTA on expiry summary card
- Views counter shown to Harry
- Three-preset-tier price picker (prior PO design decision, superseded by interaction spec)
- 10-second undo window (prior PO design decision, superseded by interaction spec)

---

> Status: Ready for Owner approval before Phase C
