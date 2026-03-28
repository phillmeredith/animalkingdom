# Interaction Spec: Player Listings

> Feature: Player Listings
> Author: UX Designer
> Status: Phase A complete — ready for Phase B (PO)
> Last updated: 2026-03-28
> Supersedes: 2026-03-27 draft (corrects status field values, adds mandatory sections,
> incorporates UR findings from research/player-listings/ur-findings.md)

---

## Overview

Player Listings is a Tier 3 marketplace feature that lets Harry put one of his own animals
up for sale at a price he sets. NPC buyers respond over time. If Harry accepts an offer,
the pet leaves his collection and he earns coins. While a listing is active, the pet is
locked — it cannot be raced, cared for, or released.

This feature extends two existing screens:

- My Animals screen (`/animals`) — adds a "List for Sale" action inside PetDetailSheet
- Marketplace screen (`/marketplace`) — adds a "My Listings" tab (partially scaffolded
  already; this spec makes it complete and formally specified)

Tier 3 scope: NPC buyers only. No player-to-player sales in this tier.

### Status field note (critical for Developer)

The `SavedName` entity in `lib/db.ts` uses `status: 'active' | 'for_sale'`. The correct
value for a listed pet is `for_sale`, not `listed`. All references in this spec use the
correct DB value. Any previous draft using `listed` as a status value is incorrect.

---

## 1. Entry points

### 1a. "List for Sale" in PetDetailSheet

Location: The footer action row in the existing `PetDetailSheet` component, which appears
when the player taps any pet card in My Animals.

The current PetDetailSheet already has a disabled "List for Sale" stub button. This spec
activates that button and defines the complete flow it initiates.

Conditions:
- Show "List for Sale" (active, primary variant) when `pet.status === 'active'`
- Show amber "Listed for sale" badge (non-interactive) when `pet.status === 'for_sale'`
- Never show "List for Sale" when `pet.status === 'for_sale'`

Button variant: `variant="primary"` (blue). This is a utility action that initiates a flow.
Pink (accent) is reserved for the final confirm step where coins are at stake.

Button placement: third button in the footer row, after Rename and before Release.
At 375px, the row wraps: Row 1 — Rename + Release; Row 2 — List for Sale (full-width).
At 768px+, all four buttons (Rename, Release, List for Sale, plus Dress Up for Stables)
fit in a 2-column grid (`grid grid-cols-2 gap-2`). This matches the existing footer grid.

### 1b. My Listings tab in Marketplace

Location: Marketplace screen (`/marketplace`), second tab in the section switcher.
Label: "My Listings"
Icon in segmented control: `Tag` (Lucide), 16px, displayed left of label text.

PageHeader slot assignment: `centre` slot — segmented control with "Browse" and "My
Listings". This is an existing control being extended, not a new one.

---

## 2. Listing creation flow

### Step 1 — Price input (ListForSaleSheet, price step)

Trigger: Harry taps "List for Sale" in PetDetailSheet.

What appears: A new BottomSheet (`ListForSaleSheet`) slides up above the existing
PetDetailSheet. The PetDetailSheet remains visible behind the backdrop (same stacking
pattern as the existing `ReleaseConfirm` modal).

Sheet contents, top to bottom:

```
[Drag handle — 40px wide, 4px tall, rgba(255,255,255,.2), pill radius, centred, mt-8]
[Section heading "List for sale" — H4 (22px/600, --t1), mt-4]

[Pet mini-summary row — --elev bg, r-md, p-16, flex row, gap-12, mb-20]
  [Animal image — 64×64px, r-md, object-cover]
  [Name — 16px/600, --t1, truncate]
  [RarityBadge — existing component, shrink-0]

[Divider — 1px solid --border-s, my-20]

[Label "ASKING PRICE" — hairline (11px/700, uppercase, tracking-wide, --t3), mb-6]
[Price input — h-[44px], numeric keyboard, r-md (12px), --card bg, 1.5px solid --border-s]
  Placeholder: "e.g. 200"
  Focus state: 1.5px solid --blue, box-shadow 0 0 0 3px --blue-sub
  Error state: 1.5px solid --red, box-shadow 0 0 0 3px --red-sub

[Suggested prices row — mt-8, flex gap-2, overflow-x-auto, -mx-6, px-6]
  Four preset pill buttons, one per rarity band below:
  | Rarity | Suggested price | Pill label |
  |--------|----------------|------------|
  | Common | 50 | "50" |
  | Uncommon | 150 | "150" |
  | Rare | 350 | "350" |
  | Epic | 800 | "800" |
  | Legendary | 1500 | "1500" |
  Only the pill matching pet.rarity is shown. Tapping it populates the input.
  Pill style (inactive, i.e. not yet tapped): bg --card, border --border-s, text --t2
  Pill style (active, i.e. matches input value): bg --amber-sub, border --amber, text --amber-t
  Pill radius: 100px (pill). Size: h-9, px-4, text-[13px]/600.

[Price helper — mt-6, 13px/400, --t3]
  "Set a fair price — buyers will make offers near your asking price"

[No-fee note — mt-8, green tint pair badge inline]
  bg --green-sub, 1px solid --green (use border, not ring), text --green-t
  Contents: CheckCircle icon (14px, --green, stroke-width 2) + "No fees — you keep all coins"
  Padding: 8px 12px. Radius: r-md (12px). Width: fit-content.

[mt-20, flex flex-col gap-2]
  ["Review listing" — variant="primary", size="lg", w-full]
    Disabled when price input is empty or 0 (opacity .4, pointer-events none)
  ["Cancel" — variant="outline", size="md", w-full]
```

### Step 2 — Confirm listing (ListForSaleSheet, confirm step)

Trigger: Harry taps "Review listing" with a valid price entered.

The sheet does not close and reopen — it transitions internally (the content swaps; the
sheet itself stays open). A back-navigation option is available.

Sheet contents, top to bottom:

```
[Drag handle]
[Back row — mt-8, flex items-center gap-6]
  [Back button — variant="outline", size="sm", icon-only or text "Back", ChevronLeft icon]
  [Heading "List for sale?" — H4 (22px/600, --t1)]

[Pet summary card — mt-16, --elev bg, r-md, p-16, flex row gap-12]
  [Animal image — 64×64px, r-md, object-cover]
  [Column: name (16px/600, --t1) + RarityBadge + category badge]

[Asking price row — mt-16, flex justify-between items-center]
  ["Asking price" — 14px/400, --t2]
  [Coins icon (14px, --amber, stroke-width 2) + price value (16px/700, --amber-t), flex gap-6]

[Warning banner — mt-16, amber tint pair]
  bg --amber-sub, 1px solid rgba(245,166,35,.2), r-md, p-12 p-16 (12px vertical, 16px horizontal)
  Contents: AlertTriangle icon (16px, --amber, stroke-width 2) + warning text (14px/400, --t1)
  Warning text: "While listed, [Name] cannot be raced or cared for."

[mt-20, flex flex-col gap-2]
  ["List [Name]" — variant="accent" (pink), size="lg", w-full]
    Loading state: spinner replaces text, disabled while request in flight
  ["Cancel" — variant="outline", size="md", w-full]
```

### Post-confirm: success path

On `createListing()` success:
1. ListForSaleSheet closes (spring animation out).
2. PetDetailSheet closes.
3. Pet card in My Animals grid immediately shows the amber "For Sale" badge (live query
   updates `pet.status` to `for_sale`).
4. Success toast fires: "[Name] is now listed for sale." (info variant, 3s auto-dismiss)
5. No navigation change — Harry remains in My Animals.

### Post-confirm: error path

On `createListing()` failure:
- Error toast fires: "Something went wrong — please try again." (error variant, persistent)
- ListForSaleSheet stays open on the confirm step. Harry can retry or cancel.

---

## 3. Preset price tiers: design rationale

The listing flow offers both free-form price input and a single suggested-price pill for
the pet's rarity band. This approach is chosen over a pure preset-only picker because:

- Harry gets a sensible starting point without having to know the market
- He retains full control (he can type any number he wants)
- A single pre-selected suggested value is less cognitively demanding than a dropdown or
  multiple tiers to choose between

The suggested prices above (50 / 150 / 350 / 800 / 1500) are starting defaults. The
Developer and PO should confirm these values with reference to the game's coin economy
before Phase C begins.

---

## 4. For-sale pet card treatment (My Animals grid)

### Visual treatment in the grid

When `pet.status === 'for_sale'`, PetCard renders with:

1. Amber "For Sale" badge — absolute position, top-left over the image
   - DS tint pair: `bg-[var(--amber-sub)]`, `border border-[var(--amber)]`,
     `text-[var(--amber-t)]`
   - Text: "For Sale" (12px/600)
   - Padding: 4px 10px. Radius: 100px (pill).
   - This replaces the care state indicator (CheckCircle / AlertCircle) for the duration
     of the listing. Do not show both simultaneously.

2. The card itself is NOT visually greyed out and NOT dimmed. The pet is not gone.
   Greying out listed pets would read as "unavailable" or "broken" to Harry (see UR
   findings). The amber badge is sufficient signalling.

3. The card remains tappable. Tapping it opens PetDetailSheet, which shows the locked
   state clearly.

Note: the existing PetCard already has the for-sale badge treatment coded (lines 36-39 in
PetCard.tsx). This spec formally confirms and owns that treatment. The amber tint pair must
be used — if the current implementation uses solid amber, it must be corrected.

### For-sale pet in PetDetailSheet

When `pet.status === 'for_sale'`:

- Header row: replace RarityBadge with RarityBadge + amber "Listed for sale" badge side by
  side. "Listed for sale" badge: amber tint pair (same pattern as "For Sale" on grid card).
- CarePanel: show the panel header but replace the action buttons with an amber inline
  message: "Can't care for [Name] while listed — remove the listing first." (14px/400,
  --amber-t). The Coins streak counter is still visible (it is informational, not an action).
  This message is not a toast — it is inline within the CarePanel area, so Harry sees it
  in context when he tries to interact.
- Footer action row:
  - Rename button: hidden (a for-sale pet's name is locked)
  - "List for Sale" button: replaced by amber "Listed for sale" badge (non-interactive,
    same amber tint pair style)
  - Release button: visible but when tapped shows the ForSaleReleaseBlock modal (see
    section 6, error states). Release does not proceed silently.
  - Dress Up button (Stables category): hidden while listed.

---

## 5. Active listing management (My Listings tab)

### PageHeader slot assignments for Marketplace screen

Existing section switcher ("Browse" / "My Listings"):
- Slot: `centre`
- Style: existing segmented control pattern (inline-flex, --elev bg, r-pill, p-4 container)
- Each tab item: 8px 16px padding, 13px/500, r-pill, --t3 inactive, --elev bg + --t1 active

"My Listings" sub-view controls (inside My Listings tab):
- No additional filter or sort controls are needed in Tier 3. The listings list is short
  (one player has few active listings) and there is no useful sort order.
- No `below` slot content for the My Listings tab. The `below` slot is null when "My
  Listings" is the active section.

Content container class string (mandatory):
`px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`

The `pt-4` (16px) is mandatory to prevent the first listing card sitting flush against the
sticky header glass border.

### PlayerListingCard anatomy

One card per active listing. Cards are stacked in a single-column list (not a grid).
Each card is a container element (`div`, not a button — it contains interactive children).

```
Surface: --card bg, 1px solid --border-s, r-lg (16px), p-[16px]
Left accent: 3px solid --amber (border-left replacement — inline style or utility class)

[Row 1 — flex items-start gap-12]
  [Animal image — 48×48px, r-md, object-cover, shrink-0]
  [Column — flex-1]
    [Pet name — 14px/600, --t1, truncate]
    [Asking price — flex items-center gap-4, mt-4]
      [Coins icon — 12px, --amber, stroke-width 2]
      [Price value — 14px/700, --amber-t]
    [Listed date — "Listed [X] days ago" — 11px/500, --t3, mt-2]
  [Remove button — variant="outline", size="sm", shrink-0]
    min-h-[44px], min-w-[64px]
    Label: "Remove"
    Tapping opens DelistModal

[Waiting state — shown when no offers exist on this listing]
  mt-12, pt-12, border-top: 1px solid --border-s
  "Waiting for buyers..." — 13px/400, --t3, italic, text-centre

[Offer cards — shown when NpcBuyerOffer records exist for this listingId]
  Rendered below the waiting state divider, stacked vertically, gap-8
  Most recent offer first. Maximum 3 offers shown simultaneously.
```

### NpcOfferCard anatomy

Nested inside PlayerListingCard, one per pending NpcBuyerOffer.

```
Surface: --elev bg, 1px solid --amber, r-md (12px), p-16, mt-8

[Row 1 — flex items-center gap-8]
  [NPC avatar circle — 24×24px, r-full, --elev bg, User icon (12px, --t3, stroke-width 2)]
  [NPC name — 13px/600, --t1, flex-1, truncate]
  [Offer amount — flex items-center gap-4]
    [Coins icon — 12px, --amber]
    [Amount — 14px/700, --amber-t]

[NPC message — mt-8, 13px/400 italic, --t2, line-clamp-2]

[Button row — mt-12, flex gap-8]
  ["Accept" — variant="accent", size="sm", flex-1, min-h-[44px]]
  ["Decline" — variant="outline", size="sm", flex-1, min-h-[44px]]
```

The amber border on NpcOfferCard is intentional. It is not a warning — it uses amber
because it matches the coins/money theme of this tab. This distinction must not be
changed to --border-s.

### Accept offer flow

1. Harry taps "Accept" on an NpcOfferCard.
2. AcceptOfferModal opens (centred modal, portal to document.body).
3. Harry taps "Accept offer". Loading state on button.
4. On success: modal closes. SoldCelebrationOverlay fires (portal to document.body).
5. Harry taps "Great!" or overlay auto-dismisses after 4 seconds.
6. Harry is returned to My Listings tab. The listing is gone. The pet is gone from My Animals.

### AcceptOfferModal anatomy

```
Backdrop: rgba(0,0,0,.30), fixed inset, z-[1000]
  Note: DS specifies bg-black/10 for modal backdrops. For this modal the backdrop is
  deliberately slightly darker (rgba(0,0,0,.30)) because the sale of a pet is a
  significant, irreversible action — the slightly heavier scrim reinforces that weight.
  This is a deliberate design decision, not a DS violation. It is documented here so
  FE does not "correct" it back to bg-black/10.

Modal surface: rgba(13,13,17,.80) bg, backdrop-filter blur(24px), 1px solid rgba(255,255,255,.06)
  r-lg (16px), p-[28px], max-w-[420px], shadow var(--sh-elevated)
  Portal: createPortal(content, document.body) — mandatory

[Heading "Accept offer?" — H4 (22px/600, --t1), mb-16]

[Summary row — --elev bg, r-md, p-12 16, flex items-center gap-12, mb-16]
  [Pet name — 14px/600, --t1, flex-1]
  [Coins icon (14px, --amber) + offer amount (16px/700, --amber-t), flex gap-4]

["[Name] will leave your collection." — 14px/400, --t2, mb-20]

[Button row — flex gap-8]
  ["Cancel" — variant="outline", size="md", flex-1]
  ["Accept offer" — variant="accent" (pink), size="md", flex-1]
    Loading state: Loader2 spinner, disabled while in flight
```

### Delist (remove listing) flow

1. Harry taps "Remove" on a PlayerListingCard.
2. DelistModal opens (centred modal, portal to document.body).
3. Harry taps "Remove listing". Loading state on button.
4. On success: modal closes. Listing card animates out (fade-out, 200ms; or instant if
   prefers-reduced-motion). Pet status reverts to `active`.
5. Info toast fires: "[Name] is back in your collection." (info variant, 3s auto-dismiss)
6. My Animals grid updates live (live query).

### DelistModal anatomy

```
Backdrop and modal surface: same as AcceptOfferModal, same portal requirement.

[Heading "Remove listing?" — H4 (22px/600, --t1), mb-8]
["[Name] will return to your collection and be available again." — 14px/400, --t2, mb-20]

[Button row — flex gap-8]
  ["Keep listed" — variant="outline", size="md", flex-1]
    Note: "Keep listed" is the safer default — focus moves here on open (see accessibility)
  ["Remove listing" — variant="outline", size="md", flex-1]
    Note: outline variant, not red. Delisting is not a destructive action. The pet is safe.
    Do not use a red-tinted border or danger styling here.
    Loading state: Loader2 spinner while in flight
```

### SoldCelebrationOverlay anatomy

```
Surface: position fixed inset-0, z-[2000]
  Portal: createPortal(content, document.body) — mandatory (see DS portal rule)
  Background: var(--grad-warm) (linear-gradient(135deg, #F5A623, #E8247C))
  No glass treatment — this is an opaque celebration surface, not a modal overlay.

[Contents — flex flex-col items-center justify-center gap-16, px-24, text-centre]
  [Coins icon — 64px, white stroke, stroke-width 1.5]
    Animation: scale 0.5 → 1.0 with spring bounce on mount. Initial: scale 0.5, opacity 0.
    Reduced-motion: skip scale, fade-in only.
  ["[X] coins added!" — H2 (36px/700, --t1)]
    Note: coins value first, pet departure second. This order is intentional (see UR findings).
  ["[Name] found a new home." — Body Lg (18px/400, --t1)]
  ["Great!" — variant="accent" (pink), size="lg", mt-8]

Auto-dismiss: 4 seconds after mount if Harry does not tap. Timer resets if Harry taps the
overlay background (treating it as "I'm reading this, don't dismiss yet").
On dismiss: overlay fades out (300ms). Focus returns to My Listings tab.

375px: Coins icon reduced to 48px. Heading reduced to H3 (28px/600).
```

---

## 6. Interaction states — all interactive elements

### "List for Sale" button (PetDetailSheet footer)

| State | Appearance |
|-------|-----------|
| Default | variant="primary" (blue), size="md", --blue bg, white text |
| Hover | --blue-h bg, glow-blue shadow |
| Active (press) | scale .97 |
| Focus | outline 2px solid --blue, offset 2px |
| Hidden | when pet.status === 'for_sale' — button removed, replaced by amber badge |

### Price input (ListForSaleSheet, price step)

| State | Appearance |
|-------|-----------|
| Empty/rest | 1.5px solid --border-s, --card bg, --t3 placeholder |
| Focused | 1.5px solid --blue, box-shadow 0 0 0 3px --blue-sub |
| Valid value entered | 1.5px solid --border (slightly visible), --t1 text |
| Non-numeric input | 1.5px solid --red, box-shadow 0 0 0 3px --red-sub. Inline error below input: "Please enter a whole number" (12px/400, --red-t). Error announced via aria-describedby. |
| Filled by preset pill | Input value updates, preset pill activates (amber tint pair style) |

### Suggested price pills (ListForSaleSheet, price step)

| State | Appearance |
|-------|-----------|
| Inactive | bg --card, 1px solid --border-s, text --t2 |
| Active (value matches input) | bg --amber-sub, 1px solid --amber, text --amber-t |
| Hover | border --border, background slight tint |
| Tap | scale .97 |

### "Review listing" button (ListForSaleSheet, price step)

| State | Appearance |
|-------|-----------|
| Disabled (price empty or 0) | opacity .4, pointer-events none, cursor not-allowed |
| Enabled | variant="primary", size="lg", w-full |
| Hover | --blue-h, glow-blue |
| Active | scale .97 |

### "List [Name]" button (ListForSaleSheet, confirm step)

| State | Appearance |
|-------|-----------|
| Default | variant="accent" (pink), size="lg", w-full |
| Hover | --pink-h, glow-pink |
| Active | scale .97 |
| Loading | Loader2 spinner (16px, white), "Listing..." text, disabled |

### Back button (ListForSaleSheet, confirm step)

| State | Appearance |
|-------|-----------|
| Default | variant="outline", size="sm", ChevronLeft icon + "Back" label |
| Hover | border --t3, bg rgba(255,255,255,.03) |
| Active | scale .97 |
| Tap | Returns to price step with price value preserved |

### "Remove" button (PlayerListingCard)

| State | Appearance |
|-------|-----------|
| Default | variant="outline", size="sm", min-h-[44px] |
| Hover | border --t3, bg rgba(255,255,255,.03) |
| Active | scale .97 |
| Tap | Opens DelistModal |

### "Accept" button (NpcOfferCard)

| State | Appearance |
|-------|-----------|
| Default | variant="accent", size="sm", flex-1, min-h-[44px] |
| Hover | --pink-h, glow-pink |
| Active | scale .97 |
| Tap | Opens AcceptOfferModal |

### "Decline" button (NpcOfferCard)

| State | Appearance |
|-------|-----------|
| Default | variant="outline", size="sm", flex-1, min-h-[44px] |
| Hover | border --t3, bg rgba(255,255,255,.03) |
| Active | scale .97 |
| Tap | Removes offer card. Slide-left exit (300ms, x: 0 → -100%, opacity 1 → 0). No confirmation. |
| Reduced-motion | Instant removal, no slide animation |

### "Accept offer" button (AcceptOfferModal)

| State | Appearance |
|-------|-----------|
| Default | variant="accent", size="md", flex-1 |
| Hover | --pink-h |
| Active | scale .97 |
| Loading | Loader2 spinner, disabled |

### "Remove listing" button (DelistModal)

| State | Appearance |
|-------|-----------|
| Default | variant="outline", size="md", flex-1 — NOT red-tinted |
| Hover | border --t3, bg rgba(255,255,255,.03) |
| Active | scale .97 |
| Loading | Loader2 spinner, disabled |

### "Great!" button (SoldCelebrationOverlay)

| State | Appearance |
|-------|-----------|
| Default | variant="accent", size="lg" |
| Hover | --pink-h, glow-pink |
| Active | scale .97 |
| Tap | Dismisses overlay |

### Pet card in My Animals grid (for_sale status)

| State | Appearance |
|-------|-----------|
| Default | Same as active pet card — no greying out |
| For-sale indicator | Amber "For Sale" badge, top-left over image (tint pair) |
| Hover | Same card lift pattern as active pets |
| Tap | Opens PetDetailSheet in locked state |

---

## 7. Error states and blocked actions

### Can't list a pet already for_sale

Trigger: "List for Sale" button is hidden when `pet.status === 'for_sale'`. This state is
therefore unreachable via the primary flow. As a defensive measure only: if the hook
receives a request to list a pet that is already for_sale, it returns an error and the
sheet shows an error toast: "This pet is already listed for sale."

### Blocked care action on a listed pet

Trigger: Harry taps a care button (Feed, Clean, Play) inside CarePanel when
`pet.status === 'for_sale'`.

Response: The care buttons are rendered as visually disabled (opacity .4) but with an
`aria-disabled="true"` attribute rather than a native `disabled` attribute, so they are
still tappable. When tapped, an inline amber message appears within the CarePanel:
"Can't care for [Name] while listed — remove the listing first." (14px/400, --amber-t)
This message is not a toast. It appears below the care buttons, in context.

Why aria-disabled over native disabled: native `disabled` removes the element from tab
order and prevents screen readers from explaining why the action is unavailable. For Harry,
being unable to tap the button with no explanation is worse than seeing a friendly message.

### Blocked release on a listed pet

Trigger: Harry taps "Release" in PetDetailSheet when `pet.status === 'for_sale'`.

Response: A small centred modal appears (ForSaleReleaseBlockModal). Contents:

```
[Heading "[Name] is listed for sale" — H4, --t1]
["Remove the listing before releasing [Name]." — 14px/400, --t2]
["Go to My Listings" — variant="primary", size="md"] — navigates to /marketplace,
  My Listings tab active, then closes both sheets
["Close" — variant="outline", size="md"]
```

This is NOT a toast. Harry must acknowledge the block before proceeding. A toast would be
easily missed (especially for ADHD/autistic users who may be focused on the sheet).

### Pet can't be listed (general validation error)

Example: pet.id is null, or the listing creation call fails at the API level.

Response: Error toast (persistent until dismissed): "Couldn't list [Name] — please try
again." Sheet stays open on the confirm step.

### Listing expired with no sale

When a `PlayerListing` status transitions to `expired`:
- The listing card in My Listings shows an amber banner at the top of the card:
  "Listing expired — no buyers this time."
- The pet status reverts to `active` automatically.
- An info toast fires: "[Name]'s listing has expired. They're back in your collection."
- The expired listing card shows one button: "OK, got it" (variant="outline", sm) which
  removes the card from the list.

---

## 8. PageHeader slot assignments (mandatory)

### My Animals screen (existing — no change)

| Control | Slot | Notes |
|---------|------|-------|
| "My Animals" title | title (left cell) | Unchanged |
| Animals / Items tab switcher | `centre` | Segmented control, inline-flex. Unchanged. |
| CoinDisplay | trailing (right cell) | Unchanged |
| Category filter pills + sort pills | `below` | One shared row, categories left, sort right (ml-auto shrink-0). Unchanged. |

### Marketplace screen (existing + extension)

| Control | Slot | Notes |
|---------|------|-------|
| "Marketplace" title | title (left cell) | Unchanged |
| Browse / My Listings tab switcher | `centre` | Segmented control, inline-flex. Browse already exists. My Listings tab is being activated. |
| CoinDisplay | trailing (right cell) | Unchanged |
| No additional controls | `below` is null for My Listings | My Listings tab has no filter or sort in Tier 3 |

Navigation ownership note: the Browse / My Listings segmented control lives in the
`centre` slot of the Marketplace PageHeader only. The content components for each tab
receive the active tab value as a prop. Neither the Browse content component nor the
My Listings content component renders its own tab control. Dual navigation is a build defect.

---

## 9. iPad layout — explicit (820px portrait, primary target)

Harry's device is iPad Pro 11-inch. Portrait CSS width is approximately 820px — this sits
between `md:` (768px) and `lg:` (1024px) breakpoints. The `md:` breakpoint IS active in
portrait. Layout decisions are specified for 820px first.

### My Listings tab at 820px portrait

- Content container: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`
  - `max-w-3xl` = 768px, so the content column is approximately 768px wide with 26px
    margin either side at 820px. This matches all other screen content columns.
- PlayerListingCards: single-column list. One card per row. This is correct — listings are
  individual items requiring attention, not a catalogue to browse. A two-column grid would
  split the offer cards in a confusing way.
- NpcOfferCards: full-width within their parent PlayerListingCard. No column grid.
- AcceptOfferModal and DelistModal: max-width 420px, centred. Significant whitespace on
  both sides at 820px — this is intentional. The modal reads as a focused decision.

### ListForSaleSheet at 820px portrait

- BottomSheet: anchored at the bottom, standard DS max-height 85vh. Width is full
  screen minus safe-area insets — same as on phone.
- Price input: full-width within the sheet's content area (px-6).
- Suggested price pills: single row, scrollable if overflow (scrollbar-hide). At 820px
  portrait, all five pills fit in one row without scrolling.
- Footer buttons: full-width stacked (flex flex-col gap-2). This is appropriate — the
  sheet is modal and the decisions are sequential.

### PetDetailSheet action row at 820px portrait

- Grid: `grid grid-cols-2 gap-2`
- Row 1: Rename | Release
- Row 2: List for Sale | Dress Up (Stables only)
- When listed (for_sale status): Row 1: amber "Listed for sale" badge (spans full width,
  non-interactive) | Release. Row 2: empty or Dress Up hidden.

### My Animals grid at 820px portrait

- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- At 820px (md: active): 3 columns
- The amber "For Sale" badge must be visible on cards in a 3-column grid. At 3 columns,
  card width is approximately 236px. The "For Sale" pill (text + 4px/10px padding) is
  approximately 64px wide — fits comfortably in the top-left corner at 2px inset.

---

## 10. Component inventory

| Component | Type | Status |
|-----------|------|--------|
| `ListForSaleSheet` | New BottomSheet | New — to be built in Phase C |
| `PlayerListingCard` | New card component | New — to be built in Phase C |
| `NpcOfferCard` | New card component | New (replaces inline ad-hoc UI in MarketplaceScreen) |
| `AcceptOfferModal` | New centred modal | New — to be built in Phase C |
| `DelistModal` | New centred modal | New — to be built in Phase C |
| `ForSaleReleaseBlockModal` | New centred modal | New — small, single purpose |
| `SoldCelebrationOverlay` | New fixed overlay | New — global, portal required |
| `PetDetailSheet` | Existing — additive changes | Activate "List for Sale" button; add locked-state treatment |
| `CarePanel` | Existing — additive change | Add inline amber message for blocked care on for_sale pets |
| `PetCard` | Existing — confirm treatment | "For Sale" badge already coded; verify tint pair compliance |

---

## 11. DS compliance notes

### Glass rule
- `ListForSaleSheet`: uses existing `BottomSheet` component — glass treatment applied by
  that component (`rgba(13,13,17,.80)`, `backdrop-filter: blur(24px)`,
  `1px solid rgba(255,255,255,.06)`, top corners r-xl). Confirm the BottomSheet component
  is already compliant before Phase C begins.
- `AcceptOfferModal` and `DelistModal` and `ForSaleReleaseBlockModal`: centred modal
  pattern. Glass treatment: `rgba(13,13,17,.80)`, `backdrop-filter: blur(24px)`,
  `1px solid rgba(255,255,255,.06)`. Backdrop: `rgba(0,0,0,.30)` for AcceptOfferModal
  (see rationale in section 5). `rgba(0,0,0,.30)` for DelistModal and ForSaleReleaseBlockModal.
- `SoldCelebrationOverlay`: opaque gradient surface (`--grad-warm`), not glass. Does not
  follow glass rule — this is intentional. It is a celebration moment, not a decision overlay.
- All portals: `createPortal(content, document.body)` — mandatory for all fixed overlays.

### Surface stack
- Page content: `--bg`
- PlayerListingCard: `--card`, `r-lg`, `1px solid --border-s`
- NpcOfferCard (inside PlayerListingCard): `--elev` (one level up from --card), `r-md`
- Pet summary rows inside sheets: `--elev` (one level up from the sheet surface)
- Sheet/modal surface: glass (not --card, not --elev)

### Tint pairs — all confirmed
- "For Sale" badge (pet card): `--amber-sub` bg, `1px solid --amber` border, `--amber-t` text
- "Listed for sale" badge (detail sheet): same amber tint pair
- No-fee note (sheet): `--green-sub` bg, `1px solid --green` border, `--green-t` text
- Listing warning banner (confirm step): `--amber-sub` bg, `rgba(245,166,35,.2)` border,
  `--amber-t` text
- Listing expiry banner: `--amber-sub` bg, `--amber-t` text
- Blocked care message: `--amber-t` text (inline, no container bg needed)
- Suggested price pill active: `--amber-sub` bg, `1px solid --amber` border, `--amber-t` text

No solid colour badges (no `--amber` background with white text) anywhere in this feature.

### Icons — all Lucide, stroke-width 2
- "List for Sale" button: no icon (text-only, per DS button spec)
- Price input: no leading icon (clean numeric entry)
- No-fee note: `CheckCircle` (14px, `--green`)
- Listing warning: `AlertTriangle` (16px, `--amber`)
- NPC avatar fallback: `User` (12px, `--t3`)
- Asking price display: `Coins` (12–14px, `--amber`)
- Sold overlay: `Coins` (64px, white)
- Empty state (no listings): `Tag` (48px, `--t4`)
- My Listings tab label icon: `Tag` (16px, current tab colour)
- Delist confirm spinner: `Loader2` (16px, animated)
- All loading states: `Loader2` (16px, white)

No emojis anywhere in this feature — not in JSX, toast messages, data files, or button labels.

---

## 12. Accessibility notes

### Touch targets
- Every action button: minimum 44px height
- "Remove" button in PlayerListingCard: min-h-[44px] min-w-[64px]
- Price input: 44px height (DS form spec)
- Modal action buttons: md size (44px) or lg (48px)
- "Accept" and "Decline" in NpcOfferCard: min-h-[44px], flex-1

### Focus management
- ListForSaleSheet opens: auto-focus moves to price input
- Price → confirm step transition: focus moves to "List [Name]" button
- AcceptOfferModal opens: focus moves to "Accept offer" button (the confirm action)
- DelistModal opens: focus moves to "Keep listed" button (the safer default — prevents
  accidental delisting on Enter key)
- ForSaleReleaseBlockModal opens: focus moves to "Go to My Listings" button
- On any modal/sheet close: focus returns to the element that triggered the open

### ARIA
- PetCard when for_sale: aria-label includes "listed for sale" — e.g.
  "Bella, listed for sale, rare Golden Retriever"
- PetDetailSheet when for_sale: aria-description on the sheet container:
  "[Name] is currently listed for sale and cannot be used until sold or delisted."
- Care buttons when blocked (aria-disabled): aria-describedby points to the inline
  amber message. Screen reader reads the message when the blocked button is focused.
- Price input error: aria-describedby points to inline error text. Do not use aria-invalid
  alone — the message text must be readable.
- Modals: role="dialog", aria-modal="true", aria-labelledby pointing to heading

### Reduced-motion
- SoldCelebrationOverlay: fade only (no scale on Coins icon) if prefers-reduced-motion
- NpcOfferCard decline exit: instant removal, no slide animation
- ListForSaleSheet: spring entrance disabled, instant open
- All Framer Motion animations in this feature must include a reduced-motion variant

---

## 13. Copy direction

| Element | Copy |
|---------|------|
| List for Sale button | "List for Sale" |
| Listed for sale badge (in detail sheet) | "Listed for sale" |
| Sheet heading | "List for sale" |
| Price input label | "ASKING PRICE" |
| Price input placeholder | "e.g. 200" |
| Price input helper | "Set a fair price — buyers will make offers near your asking price" |
| No-fee note | "No fees — you keep all coins" |
| Review listing button | "Review listing" |
| Confirm step heading | "List for sale?" |
| Listing warning | "While listed, [Name] cannot be raced or cared for." |
| Confirm list button | "List [Name]" |
| Cancel (all contexts) | "Cancel" |
| Back (confirm step) | "Back" |
| For Sale badge (pet card) | "For Sale" |
| Waiting for buyers | "Waiting for buyers..." |
| Accept button (offer card) | "Accept" |
| Decline button (offer card) | "Decline" |
| Accept offer modal heading | "Accept offer?" |
| Accept offer modal body | "[Name] will leave your collection." |
| Accept offer modal confirm | "Accept offer" |
| Sold celebration heading | "[X] coins added!" |
| Sold celebration body | "[Name] found a new home." |
| Sold celebration button | "Great!" |
| Remove button (listing card) | "Remove" |
| Delist modal heading | "Remove listing?" |
| Delist modal body | "[Name] will return to your collection and be available again." |
| Delist confirm | "Remove listing" |
| Delist cancel | "Keep listed" |
| Blocked care message | "Can't care for [Name] while listed — remove the listing first." |
| ForSaleReleaseBlock heading | "[Name] is listed for sale" |
| ForSaleReleaseBlock body | "Remove the listing before releasing [Name]." |
| ForSaleReleaseBlock CTA | "Go to My Listings" |
| Listing expired banner | "Listing expired — no buyers this time." |
| Listing expired toast | "[Name]'s listing has expired. They're back in your collection." |
| Expired listing dismiss | "OK, got it" |
| Empty state title | "Nothing listed yet" |
| Empty state description | "List a pet from My Animals to start earning coins." |
| Empty state CTA | "Go to My Animals" |
| Toast — pet listed | "[Name] is now listed for sale." |
| Toast — offer received | "Someone's interested in [Name]! Check My Listings." |
| Toast — delist success | "[Name] is back in your collection." |
| Toast — error (generic) | "Couldn't list [Name] — please try again." |

---

## 14. NPC pacing recommendation (for PO and Developer)

Based on UR findings: NPC buyers should arrive within a session-length window.

Recommended timing:
- First offer: 30 minutes to 4 hours after listing is created
- Subsequent offers (if first is declined): minimum 1 hour spacing
- Maximum active offers on a listing: 3 simultaneously
- Listing expiry with no accepted offer: 7 days

The Developer hook should expose configurable timing constants so the PO can tune pacing
without code changes. Instant NPC responses are explicitly NOT recommended — the delay
creates a meaningful engagement loop and makes Harry's price decision feel consequential.

---

## 15. Annotator notes for Developer and Frontend Engineer

- `pet.status` in `lib/db.ts`: confirm that `SavedName.status` type is `'active' | 'for_sale'`.
  The DB schema confirms this (version 9 and above). No migration needed for this field.
  Any previous spec reference to a `'listed'` status value is incorrect — the correct value
  is `'for_sale'`.
- `useMarketplace` hook: confirm it exposes `createListing(petId, price)`,
  `cancelListing(listingId)`, `acceptNpcBuyerOffer(offerId)`, `declineNpcBuyerOffer(offerId)`.
  The Developer should review hook signatures before building sheet components.
- `SoldCelebrationOverlay`: must be portalled to `document.body` (same reasoning as
  celebration overlays in the auctions feature). It can fire from the My Listings tab
  which may itself be inside an animated parent. Do not render it inside the listings tree.
- `PetCard` "For Sale" badge: already coded (lines 36-39 in PetCard.tsx). Verify it uses
  amber tint pair (`--amber-sub` bg, `--amber-t` text) and not solid amber. Correct if not.
- `CarePanel` locked state: the inline amber message for blocked care actions is a new
  addition. The panel currently shows care buttons regardless of status. The Developer must
  check `pet.status` and render the blocked message in place of the action buttons.
- The `MarketplaceScreen` My Listings tab has an ad-hoc implementation. Phase C must
  refactor it to use `PlayerListingCard` and `NpcOfferCard` rather than ad-hoc inline JSX.
- `ForSaleReleaseBlockModal`: small, focused modal. Consider whether this can reuse an
  existing generic modal component rather than a bespoke implementation.

---

## Pre-finalisation checklist

- All colours reference DS tokens only — no hardcoded hex values. Alpha composites of DS
  tokens are used only where documented (e.g. --blue-sub rgba(55,114,255,.12)). Confirmed.
- Glass rule applied to all overlays: ListForSaleSheet (via BottomSheet), AcceptOfferModal,
  DelistModal, ForSaleReleaseBlockModal. SoldCelebrationOverlay is opaque gradient — exempt
  by design decision, documented above. Confirmed.
- iPad 820px portrait layout explicit: section 9 covers all components at 820px. Confirmed.
- All interactive states defined: section 6 covers every interactive element. Confirmed.
- `pt-4` below sticky header: content container class string `px-6 pt-4 pb-24 max-w-3xl
  mx-auto w-full` specified in section 5 and section 9. Confirmed.
- No emojis anywhere in this spec, in copy direction, or in icon specifications. Confirmed.
- PageHeader slot assignments named: section 8. Confirmed.
- Navigation ownership: one place for each control, stated explicitly. Confirmed.
- Filter pill style: no filter pills in this feature. CategoryPills pattern not applicable
  to My Listings (no filter/sort in Tier 3). Confirmed (no violation).
- Card anatomy sections: ListForSaleSheet, PlayerListingCard, NpcOfferCard, all modals,
  SoldCelebrationOverlay — all have defined anatomy. Confirmed.
- Consistency check: new components checked against existing patterns (BottomSheet,
  ReleaseConfirm, AuctionWonOverlay for celebration). No unjustified deviations.
- Overlay surface treatment: glass rule explicitly stated for each overlay. Confirmed.
- Interaction states section covers every interactive element. Confirmed.
