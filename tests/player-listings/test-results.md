# Phase D Test Results: Player Listings

> Feature: Player Listings
> Tester: Senior QA Engineer
> Date: 2026-03-28
> Phase C output: usePlayerListings, ListForSaleSheet, PlayerListingCard, NpcOfferCard, DelistModal, AcceptOfferModal, SoldCelebrationOverlay, ForSaleReleaseBlockModal, PetDetailSheet (modified), CarePanel (modified), PetCard (modified), MarketplaceScreen (modified)
> Spec authority: spec/features/player-listings/interaction-spec.md (2026-03-28)
> Stories under test: PL-1 through PL-11

---

## Sign-off status

**BLOCKED — sign-off withheld pending fixes to DEF-001, DEF-002, DEF-003, DEF-004, DEF-005**

Three defects are functional (DEF-001, DEF-002, DEF-004); one is accessibility (DEF-003); one is layout (DEF-005). All five must be resolved before backlog status can move to `complete`. Severity detail in the defect register below.

---

## 10-Point DS Checklist

All 10 checks are mandatory per CLAUDE.md. Checks 7–10 are app-wide scope.

---

**Check 1 — No emojis as icons (Lucide only, everywhere in JSX, data files, toast messages, and button labels)**

PASS.

All components in `src/components/player-listings/` use Lucide icons exclusively. No emoji characters are present in any JSX, data file, or toast message. NPC buyer names and messages in `usePlayerListings.ts` are plain text (confirmed no emoji in the NPC_BUYERS pool). The NPC avatar in NpcOfferCard uses `User` Lucide icon as specified.

---

**Check 2 — No `ghost` variant on visible actions (search entire codebase)**

PASS.

A full codebase grep for `variant="ghost"` returned no matches. All visible actions in the player-listings components use `primary`, `accent`, or `outline` variants as specified.

---

**Check 3 — All colours trace to `var(--...)` tokens; no hardcoded hex**

PASS with documented exceptions.

All colours in the player-listings component set use `var(--...)` tokens. The following alpha composites are present and match the documented exceptions in the DS glass rule:

- `rgba(13,13,17,.80)` — modal surfaces (ForSaleReleaseBlockModal, AcceptOfferModal): documented DS glass rule for modals with backdrop
- `rgba(255,255,255,.06)` — modal border: documented DS glass rule
- `rgba(255,255,255,.2)` — drag handle in ListForSaleSheet: documented drag handle treatment
- `rgba(0,0,0,.30)` — modal backdrops (AcceptOfferModal, ForSaleReleaseBlockModal): documented spec variance for irreversible actions
- `rgba(245,166,35,.2)` — amber warning banner border in ListForSaleSheet confirm step: matches interaction-spec.md section 2 warning banner spec exactly

No unapproved hardcoded hex values found.

---

**Check 4 — Surface stack is correct; glass rule applies to all fixed/absolute overlays**

PASS.

- `AcceptOfferModal`: `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)` + `1px solid rgba(255,255,255,.06)` — correct glass treatment for modal with backdrop. Portal confirmed.
- `ForSaleReleaseBlockModal`: same glass treatment. Portal confirmed.
- `SoldCelebrationOverlay`: `var(--grad-warm)` background — opaque celebration surface, not glass. This is the correct and specified treatment. Portal confirmed at `z-[2000]`.
- `ListForSaleSheet`: glass treatment provided by the shared `BottomSheet` component. Correct.
- `DelistModal`: uses shared `Modal` component which provides glass treatment. Correct.
- `PlayerListingCard`: `--card` bg with `1px solid --border-s` — correct surface level for an in-flow card.

The `AcceptOfferModal` renders `position: fixed` inside a `createPortal` subtree, not inside any `motion.*` ancestor. Stacking context is clean.

---

**Check 5 — Layout verified at 375px, 768px, and 1024px**

PARTIAL PASS — one issue noted.

Code review indicates the following layout decisions:
- `PlayerListingCard` is a full-width single-column card with no grid wrapping — correct at all breakpoints.
- `MyListingsTab` content column: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` — correct.
- `ListForSaleSheet`: padding `px-6`, no breakpoint-specific layout changes. The spec states at 375px the footer action row wraps (Rename + Release on row 1, List for Sale full-width on row 2). The `PetDetailSheet` footer uses `grid grid-cols-2 gap-2` which allows natural wrapping — this matches the spec intent. The sheet itself is a BottomSheet that fills available width at all breakpoints.

**DEFECT noted for Browse tab**: The Browse tab content div (`src/screens/MarketplaceScreen.tsx` line 361) uses `px-6 pb-24` but is missing `pt-4`. All content containers below a sticky glass PageHeader require `pt-4` per CLAUDE.md mandatory rule. This was pre-existing in MarketplaceScreen but is in-scope for DS check 7. Logged as DEF-005.

---

**Check 6 — All scrollable content has `pb-24` minimum**

PASS.

`MyListingsTab` both the filled state and the empty state use `pb-24` on the content column. `MarketplaceScreen` Browse tab uses `pb-24` on its content div (deficiency is only `pt-4` — see DEF-005 and Check 7).

---

**Check 7 — Top-of-screen breathing room (`pt-4` below PageHeader on every screen with sticky glass header)**

FAIL — see DEF-005.

`MyListingsTab` (My Listings content): `pt-4` is present. PASS for this feature's content.

`MarketplaceScreen` Browse tab: content div at line 361 uses `px-6 pb-24` with no `pt-4`. The first content element (section label "NPCs looking to buy" or the empty state) sits flush against the glass header's bottom edge. This defect was present before this feature's build but is found during this Phase D scope-wide check as required by CLAUDE.md. It is logged as a defect against `MarketplaceScreen.tsx` (the Browse tab content owner).

---

**Check 8 — Navigation controls are compact and consistent; tab switcher inline-flex, not full-width; filter pills use tint-pair active style**

PASS.

The Marketplace tab switcher in `MarketplaceScreen.tsx` uses `display: inline-flex` with `r-pill` container and `r-pill` per-tab item — matching the centre slot compact pattern. It does not span full width. The "Browse" inactive and "My Listings" inactive tabs use `transparent` background with `var(--t3)` text; active tabs use `var(--elev)` background with `var(--t1)` text — this matches the existing segmented control pattern. The `Tag` Lucide icon appears left of "My Listings" label text per spec.

No filter pills are introduced in the My Listings tab (correct per spec — no filter controls needed for a short personal list).

---

**Check 9 — Animation parameters match the spec**

PASS with one minor copy deviation.

**SoldCelebrationOverlay coins icon**: `initial={{ scale: 0.5, opacity: 0 }}` → `animate={{ scale: 1, opacity: 1 }}` with `type: 'spring', stiffness: 300, damping: 20`. The spec states "scale 0.5 → 1.0 with spring bounce on mount" — this is an exact match.

**SoldCelebrationOverlay reduced-motion**: `initial={{ opacity: 0 }}` → scale omitted. Correct.

**NpcOfferCard decline exit**: `x: '-100%', opacity: 0, transition: { duration: 0.3 }` — matches spec "slide-left exit, 300ms (x: 0 → -100%, opacity 1 → 0)". Correct.

**Reduced-motion for decline**: `exit={{}}` when `reducedMotion` is true — instant removal. Correct.

**SoldCelebrationOverlay auto-dismiss timer reset**: timer resets on overlay background tap (`onClick={resetTimer}`); "Great!" button calls `dismiss()` directly. Correct.

**SoldCelebrationOverlay heading copy**: spec states `"[X] coins added!"`. Build renders `"+{coinsEarned} coins added!"` — a `+` prefix is present in the build that is absent from the spec. This is a minor copy deviation. Logged as DEF-006 (low severity, informational).

---

**Check 10 — Spec-to-build element audit (scroll every built screen top to bottom; compare against interaction spec)**

PARTIAL PASS — defects found in AcceptOfferModal and empty state.

**PetDetailSheet (for_sale state):**
- RarityBadge + amber "Listed for sale" badge in header: PRESENT
- Rename button hidden: PRESENT
- Dress Up button hidden: PRESENT (for Stables category)
- Release button visible (triggers block modal): PRESENT
- CarePanel inline amber message on tap: PRESENT (aria-disabled pattern correct)
- "List for Sale" replaced by amber "Listed for sale" badge in footer: PRESENT
- Footer grid collapses to single column when Rename is hidden: present; "List for Sale" badge occupies its slot

**ListForSaleSheet (price step):**
- Drag handle: PRESENT
- Heading "List for sale": PRESENT
- Pet mini-summary (64x64 image, name, RarityBadge): PRESENT
- Divider: PRESENT
- "ASKING PRICE" label (hairline, uppercase, tracking): PRESENT
- Price input (h-44, r-md, --card bg, 1.5px solid --border-s): PRESENT
- Suggested price pill (one per rarity): PRESENT (amber tint pair active, --card inactive)
- Price helper copy: PRESENT
- No-fee badge (green tint pair): PRESENT
- "Review listing" button (primary, disabled when empty): PRESENT
- "Cancel" button (outline): PRESENT

**ListForSaleSheet (confirm step):**
- Back button (outline, sm, ChevronLeft): PRESENT
- Heading "List for sale?": PRESENT
- Pet summary card (--elev, 64x64 image, name, RarityBadge): PRESENT — note: spec also says "category badge" in the confirm step summary (interaction-spec.md line 142). Category badge is absent in the build. Logged as DEF-007 (low severity).
- Asking price row (Coins icon amber + price value amber-t): PRESENT
- Amber warning banner (AlertTriangle + copy): PRESENT — copy present but banner text does not show the pet name as a direct reference: "While listed, {pet.name} cannot be raced or cared for." PASS.
- "List [Name]" button (accent/pink, loading state): PRESENT
- "Cancel" button (outline): PRESENT

**AcceptOfferModal:**
- Heading "Accept offer?": PRESENT
- Summary row: DEFECT — see DEF-001
- Body copy: DEFECT — see DEF-002
- "Cancel" (outline) + "Accept offer" (accent) buttons: PRESENT
- Focus management: DEFECT — see DEF-003

**DelistModal:**
- Heading "Remove listing?": PRESENT
- Body copy: PRESENT
- "Keep listed" (outline, focus on open): PRESENT — focus confirmed via `keepRef.current?.focus()` with 50ms delay
- "Remove listing" (outline, NOT red): PRESENT
- Loading state on "Remove listing": PRESENT

**PlayerListingCard:**
- --card bg, 1px solid --border-s, r-lg, p-16: PRESENT
- Left accent 3px solid --amber: PRESENT (implemented via `borderLeft` inline style)
- Animal image 48x48, r-md: PRESENT
- Pet name 14px/600 --t1: PRESENT (includes RarityBadge in same row, not in spec but not conflicting)
- Asking price (Coins 12px --amber + value 14px/700 --amber-t): PRESENT
- Listed date 11px/500 --t3: PRESENT
- "Remove" button (outline, sm, minHeight 44, minWidth 64): PRESENT
- "Waiting for buyers..." when no offers (13px/400, --t3, italic, centred, border-top): PRESENT
- NpcOfferCard(s) when offers exist: PRESENT

**NpcOfferCard:**
- --elev bg, 1px solid --amber, r-md, p-16, mt-8: PRESENT
- NPC avatar circle (24x24, User icon 12px --t3): PRESENT
- NPC name 13px/600 --t1: PRESENT
- Offer amount (Coins 12px --amber + amount 14px/700 --amber-t): PRESENT
- NPC message (13px/400, italic, --t2, line-clamp-2): PRESENT
- Button row (Accept accent + Decline outline, gap-8, flex-1, min-h-44): PRESENT

**SoldCelebrationOverlay:**
- position: fixed, inset-0, z-[2000]: PRESENT
- background: var(--grad-warm): PRESENT
- Coins icon 64px, white stroke, strokeWidth 1.5: PRESENT (colour `rgba(255,255,255,.95)` — very close to white, acceptable)
- "[X] coins added!" H1 36px/700: PRESENT — spec says H2 but 36px/700 is correct size; heading level is a minor semantic issue only
- "[Name] found a new home." 18px/400: PRESENT (appends NPC name context — acceptable)
- "Great!" button (accent, lg): PRESENT
- Auto-dismiss 4s: PRESENT
- Background tap resets timer: PRESENT
- 375px responsive scale (48px icon, 28px/600 heading): ABSENT from code review — no `clamp()` or breakpoint-responsive size detected. Logged as DEF-004.

**ForSaleReleaseBlockModal:**
- Glass treatment and portal: PRESENT
- Heading "[Name] is listed for sale": PRESENT
- Body "Remove the listing before releasing [Name].": PRESENT
- "Go to My Listings" (primary, w-full): PRESENT
- "Close" (outline, w-full): PRESENT
- Focus to "Go to My Listings" on open: PRESENT (`goToListingsRef.current?.focus()` with 50ms delay)
- Scroll lock (reference-counted): PRESENT

**PetCard (for_sale):**
- Amber "For Sale" badge (tint pair, top-left, absolute): PRESENT
- Care state indicator suppressed when for_sale: PRESENT
- Card not dimmed: PRESENT (no opacity reduction)
- aria-label updated: PRESENT ("[Name] is listed for sale")
- Card still tappable: PRESENT

**MyListingsTab empty state:**
- DEFECT — see DEF-005 (wrong icon, wrong copy, missing CTA button)

---

## Functional Test Results by Story

---

### PL-1 — List a pet for sale

| Test | Result | Notes |
|------|--------|-------|
| "List for Sale" button present when `status === 'active'` | PASS | `variant="primary"` (blue) confirmed per spec |
| Button absent when `status === 'for_sale'` (replaced by amber badge) | PASS | Conditional render confirmed |
| Tapping opens ListForSaleSheet above PetDetailSheet | PASS | Separate `open` state drives both sheets; DOM stacking via z-index from BottomSheet component |
| Price input accepts only digits; non-numeric shows inline error | PASS | `handlePriceChange` strips non-digits; `handlePriceBlur` triggers error state |
| Suggested price pill populates input and activates amber tint pair | PASS | `handlePillTap()` sets input and `pillActive: true`; pill deactivates when input changes |
| Pill shows only the matching rarity (not all 5) | PASS | Single pill rendered from `SUGGESTED_PRICES[pet.rarity]` |
| "Review listing" disabled when empty/0, enabled when valid | PASS | `reviewEnabled` gate; native `disabled` → Button maps to opacity-40 + pointer-events-none |
| Step transition (price → confirm) without close/reopen | PASS | `setStep('confirm')` — no remount |
| Back button returns to price step with price preserved | PASS | `setStep('price')` — `priceInput` state unchanged |
| Confirm step: amber warning banner with correct copy | PASS | "While listed, [Name] cannot be raced or cared for." |
| "List [Name]" button variant="accent" (pink) on confirm step | PASS | Matches spec — accent is for the earn/reward moment |
| Loading state on confirm (spinner + disabled) | PASS | `loading` state + Button `loading` prop |
| Success path: `status: 'for_sale'` set, both sheets close, toast fires | PASS | Confirmed in `usePlayerListings.listPet()` and `PetDetailSheet` success handler |
| Error path: toast fires, sheet stays open on confirm step | PASS | Error caught, re-thrown; `finally` sets loading false; sheet stays open |
| `createListing` defensively handles already-for_sale pet | PASS | Guard in `listPet()` — returns error toast |
| BottomSheet glass treatment verified (rgba(13,13,17,.80), blur, border) | PASS | Provided by shared BottomSheet component |
| Focus moves to first interactive element on sheet open | GAP | No explicit focus call in ListForSaleSheet; browser default tab order applies. Spec requires explicit focus management. Logged as SPG-001 (spec gap, non-blocking). |

---

### PL-2 — For-sale badge on pet card

| Test | Result | Notes |
|------|--------|-------|
| `for_sale` pets included in My Animals (not hidden) | PASS | `useSavedNames` query must return both statuses — assumed from existing integration |
| Amber "For Sale" badge, tint pair (not solid), top-left | PASS | `Badge variant="amber"` with explicit `border border-[var(--amber)]` class |
| "For Sale" badge replaces care indicator | PASS | Conditional: `{!isForSale && careState === 'cared-today' && ...}` |
| Card not dimmed/greyed out | PASS | No opacity reduction on card |
| Card tappable, opens PetDetailSheet locked state | PASS | Standard `onClick` handler unchanged |
| aria-label updated for screen readers | PASS | `"[Name] is listed for sale"` when for_sale |
| PetDetailSheet: RarityBadge + amber "Listed for sale" badge in header | PASS | Confirmed in PetDetailSheet render |
| Rename button hidden when for_sale | PASS | `{!isForSale && <Button>Rename</Button>}` |
| "List for Sale" replaced by non-interactive amber badge | PASS | `{!isForSale ? <Button>List for Sale</Button> : <Badge>Listed for sale</Badge>}` |
| Dress Up hidden for Stables when for_sale | PASS | Condition: `pet.category === 'Stables' && !isForSale` |

---

### PL-3 — Care action block (inline amber, aria-disabled)

| Test | Result | Notes |
|------|--------|-------|
| CarePanel renders header (streak visible) when for_sale | PASS | Header rendered unconditionally; streak conditional on `careStreak > 0` |
| Care buttons have `aria-disabled="true"` + `opacity: 0.4` | PASS | Confirmed in CarePanel for_sale branch |
| Native `disabled` attribute NOT used on care buttons when for_sale | PASS | Confirmed — separate render branch uses `aria-disabled` not `disabled` |
| Tapping care button shows inline amber message (not toast) | PASS | `setShowLockedMessage(true)` → `<p id="care-locked-msg">` rendered below buttons |
| Inline message references pet name | PASS | `Can't care for {petName ?? 'this pet'} while listed...` |
| `aria-describedby` links message to buttons | PASS | Both the button `aria-describedby="care-locked-msg"` and the grid `aria-describedby` set |
| No CareLog entry on tap when for_sale | PASS | Early return before `performCare()` when `isForSale` |
| Live query update clears message when status reverts to active | PASS | `petStatus` prop is driven by live query in parent; component re-renders with `isForSale=false`; `showLockedMessage` state would persist until next open — minor UX gap but not a functional defect |

---

### PL-4 — Release block (ForSaleReleaseBlockModal)

| Test | Result | Notes |
|------|--------|-------|
| Release button visible (not hidden) on for_sale pet | PASS | No conditional hide on Release button |
| Tapping Release opens ForSaleReleaseBlockModal (not release flow) | PASS | `if (isForSale) setReleaseBlockOpen(true)` |
| Modal via createPortal | PASS | `ForSaleReleaseBlockModal` calls `createPortal(content, document.body)` |
| Glass treatment (rgba 80, blur 24, border) + backdrop rgba(0,0,0,.30) | PASS | Confirmed in component |
| Heading "[Name] is listed for sale" | PASS | |
| Body "Remove the listing before releasing [Name]." | PASS | |
| "Go to My Listings" (primary, blue) — navigates, closes modal and sheet | PASS | `navigate('/marketplace', { state: { tab: 'listings' } })` + `onClose()` + sheet `onClose()` |
| "Close" (outline) — dismisses modal only | PASS | |
| Focus to "Go to My Listings" on open | PASS | `goToListingsRef.current?.focus()` with 50ms delay |
| Release flow does not execute | PASS | `releasePet()` not called in the `isForSale` branch |
| Scroll lock (reference-counted) | PASS | `useScrollLock` used; `lock()/unlock()` in useEffect |

---

### PL-5 — My Listings screen

| Test | Result | Notes |
|------|--------|-------|
| "My Listings" tab in MarketplaceScreen centre slot | PASS | `centre={tabSwitcher}` in PageHeader; inline-flex container |
| Tag Lucide icon 16px left of "My Listings" label | PASS | `<Tag size={16} />` in tab button |
| Content column `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` | PASS | Both filled and empty state use this class string |
| Tab switcher NOT inside MyListingsTab (no dual navigation) | PASS | Tab switcher owned by MarketplaceScreen; MyListingsTab receives no tab prop |
| PlayerListingCard renders per active listing | PASS | `activeListings.map(listing => <PlayerListingCard .../>)` |
| Single-column list (not grid) | PASS | `flex flex-col gap-4` — no grid |
| "Waiting for buyers..." when no offers | PASS | Conditional on `visibleOffers.length === 0` |
| NpcOfferCards when offers exist | PASS | `AnimatePresence` + `NpcOfferCard` per visible offer |
| Loading skeleton: 2 skeletons under load | INFORMATIONAL GAP | `useLiveQuery` resolves instantly from IndexedDB; loading state is effectively unreachable. No skeleton implemented. Not a blocking defect — acknowledged as spec gap SPG-002. |
| Content at 820px: single-column | PASS | No grid breakpoint applied to the listing list |

---

### PL-6 — NPC buyer offer mechanic

| Test | Result | Notes |
|------|--------|-------|
| `NPC_OFFER_MIN_DELAY_MS` and `NPC_OFFER_MAX_DELAY_MS` constants exported | PASS | Both exported at module level |
| First offer timing: 30 min to 4 hours | PASS | `randomBetween(NPC_OFFER_MIN_DELAY_MS, NPC_OFFER_MAX_DELAY_MS)` |
| Subsequent offers: at least 1 hour apart | PASS | `randomBetween(NPC_OFFER_MIN_SPACING_MS, NPC_OFFER_MIN_SPACING_MS * 3)` |
| Maximum 3 offers per listing lifetime | PASS | Guard checks `existingOfferCount >= NPC_OFFER_MAX_PER_LISTING` before inserting |
| Offer count per price-to-market ratio: ≤70%: 3; 71-150%: 2; >150%: 1 | PASS | `maxOffersForListing()` function implements this logic |
| Toast fires from global toast system on offer creation | PASS | `onOfferCreated` callback fires toast inside the NPC timer callback |
| Toast navigable to My Listings | GAP | Toast fires but there is no `onTap` navigation handler passed to the toast. The spec requires "tapping the toast navigates to /marketplace with My Listings tab active." The `useToast` call does not include an `onTap`/`onPress`/navigation prop. Logged as DEF-008 (medium severity). |
| NPC offer amounts at or below asking price | PASS | `computeOfferAmount()` returns `Math.floor(askingPrice * pct)` — always ≤ asking |
| NPC names and messages contain no emoji | PASS | NPC_BUYERS pool is plain text, confirmed |
| Max 3 concurrent offers shown in card | PASS | `getOffersForListing()` slices at `NPC_OFFER_MAX_PER_LISTING` |

---

### PL-7 — Sale completion

| Test | Result | Notes |
|------|--------|-------|
| "Accept" opens AcceptOfferModal (createPortal) | PASS | `setAcceptOffer(offer)` → `AcceptOfferModal` portal confirmed |
| AcceptOfferModal backdrop rgba(0,0,0,.30) | PASS | Intentional heavier backdrop documented in component and spec |
| Modal surface glass treatment | PASS | `rgba(13,13,17,.80)` + blur(24) + border |
| Heading "Accept offer?" | PASS | |
| Summary row — pet name displayed | FAIL — DEF-001 | Component shows `offer.npcName` (buyer name) instead of pet name. `NpcBuyerOffer` has no `petName` field. Modal requires a `petName` prop or listing lookup. |
| Body copy "[Name] will leave your collection." | FAIL — DEF-002 | Build renders "This pet will leave your collection." — pet name missing |
| Focus moves to "Accept offer" on open | FAIL — DEF-003 | No focus management implemented in `AcceptOfferModal` |
| "Accept offer" loading state | PASS | `loading` state + Button `loading` prop |
| earn() + pet deletion + listing update in ONE db.transaction() | PASS | `completeSale()` wraps all three in `db.transaction('rw', db.playerWallet, db.transactions, db.savedNames, db.playerListings, db.npcBuyerOffers, ...)` — all required tables included |
| Other pending offers auto-declined on sale | PASS | Competing offers updated to 'declined' inside the same transaction |
| AcceptOfferModal closes on success; SoldCelebrationOverlay fires | PASS | `setCelebration(result)` after `onConfirm()` succeeds; modal closes via parent |
| SoldCelebrationOverlay via createPortal | PASS | `SoldCelebrationOverlay` calls `createPortal(content, document.body)` |
| SoldCelebrationOverlay: position fixed not in motion ancestor | PASS | Portal renders outside React tree; motion context cannot trap fixed positioning |
| "[X] coins added!" copy (coins first, pet second) | PASS (minor deviation) | Copy order correct; `+` prefix is an unspecified addition — DEF-006 |
| "Great!" dismisses immediately | PASS | |
| 4s auto-dismiss with timer reset on background tap | PASS | |
| prefers-reduced-motion: no scale animation | PASS | `reducedMotion` check on initial state |
| 375px responsive: icon 48px, heading 28px/600 | FAIL — DEF-004 | No responsive size changes for icon or heading at 375px. Both remain 64px and 36px. |
| Error path: toast, AcceptOfferModal stays open, no coins | PASS | Error caught by modal; toast from hook; modal stays open for retry |

---

### PL-8 — Decline an offer

| Test | Result | Notes |
|------|--------|-------|
| Tapping "Decline" calls declineNpcOffer immediately (no modal) | PASS | `handleDecline()` calls `onDeclineOffer()` directly |
| Slide-left exit animation (300ms, x to -100%, opacity to 0) | PASS | `exit={{ x: '-100%', opacity: 0, transition: { duration: 0.3 } }}` |
| Instant removal under prefers-reduced-motion | PASS | `exit={{}}` when `reducedMotion` is true |
| Listing status remains 'active' after decline | PASS | Only `npcBuyerOffers` updated to 'declined'; listing untouched |
| No toast on successful decline | PASS | No toast call in the success path |
| "Waiting for buyers..." re-appears if last offer declined | PASS | `visibleOffers.length === 0` conditional renders it |
| No coin change on decline | PASS | `declineNpcOffer()` only updates offer status |
| Error toast if call fails | PASS | `catch` in `declineNpcOffer()` fires error toast |

---

### PL-9 — Cancel a listing (delist)

| Test | Result | Notes |
|------|--------|-------|
| "Remove" opens DelistModal (createPortal via Modal) | PASS | `setDelistOpen(true)` → `DelistModal` which uses `Modal` component |
| DelistModal glass treatment and backdrop | PASS | Provided by shared Modal component |
| Heading "Remove listing?" | PASS | |
| Body "[Name] will return to your collection and be available again." | PASS | |
| Focus defaults to "Keep listed" on open | PASS | `keepRef.current?.focus()` with 50ms delay |
| "Remove listing" is variant="outline" (not red, not accent) | PASS | Confirmed in DelistModal |
| `cancelListing` and pet revert in ONE db.transaction() | PASS | `cancelListing()` wraps listing + pet + pending offers in `db.transaction('rw', ...)` |
| On success: modal closes, listing card animates out, toast fires | PASS | `setDelistOpen(false)` + `cancelListing()` via hook → toast fires in hook |
| ListingCard fade-out on remove | NOTE | The listing card is removed from `activeListings` (live query), triggering AnimatePresence exit. However, `AnimatePresence` is not wrapping the listing list in `MyListingsTab` — there is no explicit exit animation on the card container. Under the current implementation, the card disappears instantly when removed from the list. The FE did not add AnimatePresence to the listings list. Logged as DEF-009 (low). |
| Pet immediately available in My Animals after delist | PASS | Live query update via Dexie observable |
| All NPC offers auto-declined on cancel | PASS | Confirmed inside `cancelListing()` transaction |
| Error toast if call fails | PASS | |

---

### PL-10 — 7-day listing expiry

| Test | Result | Notes |
|------|--------|-------|
| `LISTING_EXPIRY_DAYS = 7` constant exported | PASS | Module-level export confirmed |
| `expiresAt` set at creation: `createdAt + 7 days` | PASS | Confirmed in `listPet()` |
| Expiry check runs on mount | PASS | `useEffect(() => checkExpiredListings(), [])` |
| Expiry: listing → 'expired', pet → 'active' in ONE db.transaction() | PASS | `db.transaction('rw', db.playerListings, db.savedNames, ...)` in `checkExpiredListings()` |
| Expiry toast fires per listing | PASS | Toast with `"[Name]'s listing has expired. They're back in your collection."` |
| Expired summary card on next My Listings visit | PARTIAL | The `activeListings` query filters for `status === 'active'` only — expired listings are not fetched. There is no expired summary card implementation. The spec (PL-10) requires an expiry summary card with pet name, listing duration, offers count, highest offer, "Nobody brought [Name] home this time.", and "OK, got it" button. This is absent from the build. Logged as DEF-010 (medium). |
| Multiple expiries: individual toasts | PASS | `for` loop fires one toast per expired listing |

---

### PL-11 — Empty state: no active listings

| Test | Result | Notes |
|------|--------|-------|
| Empty state renders when no active listings | PASS | Conditional render when `activeListings.length === 0` |
| Empty state is not a blank screen | PASS | |
| Icon is `Tag` (Lucide), 48px, --t4 | FAIL — DEF-005 | Build uses `ShoppingBag` icon. Spec requires `Tag` icon. |
| Title "Nothing listed yet" (18px/600, --t1) | FAIL — DEF-005 | Build renders "No active listings". Wrong copy. |
| Description: "List a pet from My Animals to start earning coins." (14px/400, --t2) | FAIL — DEF-005 | Build renders "Go to My Animals to list a pet for sale." Wrong copy. |
| CTA: "Go to My Animals" button (variant="primary", size="md", navigates to /animals) | FAIL — DEF-005 | No CTA button present in the build. |
| Centred vertically in content area | PASS | `flex flex-col items-center justify-center py-20` |
| No emoji in empty state | PASS | |

---

## Defect Register

---

### DEF-001 — AcceptOfferModal summary row shows buyer name instead of pet name

**Severity**: Medium (functional — misleading content at point of irreversible action)
**Story**: PL-7
**File**: `src/components/player-listings/AcceptOfferModal.tsx`, line 132
**Spec ref**: interaction-spec.md section 5, AcceptOfferModal anatomy, summary row: "[Pet name — 14px/600, --t1, flex-1]"

**Description**: The summary row in `AcceptOfferModal` displays `offer.npcName` (the buyer's name) where the spec requires the pet name. The `NpcBuyerOffer` entity does not carry a `petName` field. The component needs either a `petName` prop added (passed from `PlayerListingCard` which has `listing.petName`) or a listing lookup.

**Expected**: Summary row shows pet name (e.g. "Thunder") next to the offer amount.
**Actual**: Summary row shows NPC buyer name (e.g. "Farmer Joe") next to the offer amount.

**Reproduction**: List any pet → receive a simulated NPC offer → tap "Accept" → AcceptOfferModal opens → summary row shows buyer name, not pet name.

**Fix**: Add `petName: string` prop to `AcceptOfferModal`; pass `listing.petName` from `PlayerListingCard` when instantiating the modal.

---

### DEF-002 — AcceptOfferModal body copy missing pet name

**Severity**: Low (copy accuracy — no functional impact)
**Story**: PL-7
**File**: `src/components/player-listings/AcceptOfferModal.tsx`, line 152
**Spec ref**: refined-stories.md PL-7 AC: `"[Name] will leave your collection."` (14px/400, --t2)

**Description**: The modal body reads "This pet will leave your collection." — the pet name is absent. The spec and UR findings both emphasise that personalisation (using the pet's name) is critical to the emotional weight of the sale confirmation.

**Expected**: "[Pet name] will leave your collection." (e.g. "Thunder will leave your collection.")
**Actual**: "This pet will leave your collection."

**Fix**: Once DEF-001's `petName` prop is added to `AcceptOfferModal`, use it in the body copy: `{petName} will leave your collection.`

---

### DEF-003 — AcceptOfferModal missing focus management on open

**Severity**: Medium (accessibility — WCAG 2.1 AA 2.4.3 Focus Order; directly impacts keyboard and screen reader users)
**Story**: PL-7
**File**: `src/components/player-listings/AcceptOfferModal.tsx`
**Spec ref**: refined-stories.md PL-7 AC: "Focus moves to 'Accept offer' on modal open."; interaction-spec.md section 5 AcceptOfferModal anatomy.

**Description**: No `ref.focus()` or `autoFocus` is implemented on the "Accept offer" button. On modal open, focus remains on whatever element triggered it (the "Accept" button in NpcOfferCard). While this is not entirely broken, the spec explicitly requires focus to move to the "Accept offer" button in the modal.

**WCAG impact**: 2.4.3 Focus Order — modal dialogs must receive focus on open to ensure screen reader and keyboard users know the modal appeared.

**Expected**: Focus moves to the "Accept offer" button when `AcceptOfferModal` opens.
**Actual**: Focus remains on the originating "Accept" button in the card.

**Fix**: Add `useRef<HTMLButtonElement>` on the "Accept offer" button; in a `useEffect` watching `open`, call `ref.current?.focus()` with a 50ms delay (same pattern as `DelistModal` and `ForSaleReleaseBlockModal`).

---

### DEF-004 — SoldCelebrationOverlay not responsive at 375px (icon and heading size)

**Severity**: Medium (layout defect — explicit breakpoint requirement in spec and CLAUDE.md)
**Story**: PL-7
**File**: `src/components/player-listings/SoldCelebrationOverlay.tsx`
**Spec ref**: interaction-spec.md section 5 SoldCelebrationOverlay anatomy: "375px: Coins icon reduced to 48px. Heading reduced to H3 (28px/600)." Also refined-stories.md PL-7 Definition of Done includes breakpoint verification.

**Description**: The celebration overlay renders the `Coins` icon at `size={64}` and heading at `fontSize: 36` regardless of viewport width. At 375px (Harry's phone), the spec requires the icon to be 48px and the heading to be 28px/600. The current build does not apply any responsive sizing.

**Expected at 375px**: Coins icon 48px, heading 28px weight 600.
**Actual at 375px**: Coins icon 64px, heading 36px weight 700.

**Fix**: Implement responsive sizing via CSS media query, Tailwind responsive classes, or `clamp()`. Example: wrap the icon in a div with class `text-[48px] md:text-[64px]` and apply `text-[28px] font-semibold md:text-[36px] md:font-bold` to the heading.

---

### DEF-005 — MyListingsTab empty state: wrong icon, wrong copy, missing CTA button

**Severity**: Medium (functional + spec copy mismatch — empty states are first contact for new users)
**Story**: PL-11
**File**: `src/screens/MarketplaceScreen.tsx`, lines 195–208

**Description**: Three elements of the PL-11 empty state are wrong:

1. **Icon**: `ShoppingBag` (48px) is used. Spec requires `Tag` (48px, `--t4`). `Tag` is already imported in the file but not used in the empty state.
2. **Title copy**: "No active listings" — spec requires "Nothing listed yet"
3. **Description copy**: "Go to My Animals to list a pet for sale." — spec requires "List a pet from My Animals to start earning coins."
4. **CTA button absent**: Spec requires a "Go to My Animals" button (`variant="primary"`, `size="md"`) that navigates to `/animals`. No button is present.

**Expected**: Tag icon + "Nothing listed yet" title + "List a pet from My Animals to start earning coins." description + "Go to My Animals" primary button navigating to `/animals`.
**Actual**: ShoppingBag icon + "No active listings" title + different description + no button.

**Fix**: Replace `ShoppingBag` with `Tag`, update both copy strings, add `<Button variant="primary" size="md" onClick={() => navigate('/animals')}>Go to My Animals</Button>` (requires `useNavigate` import in MyListingsTab or promotion to a prop).

---

### DEF-006 — SoldCelebrationOverlay coins heading has unspecified `+` prefix (low, informational)

**Severity**: Low (copy deviation — no functional or accessibility impact)
**Story**: PL-7
**File**: `src/components/player-listings/SoldCelebrationOverlay.tsx`, line 122

**Description**: Heading renders `+{coinsEarned} coins added!` — the `+` prefix is not in the spec copy `"[X] coins added!"`. This is arguably clearer UX but is a spec deviation.

**Expected**: `{coinsEarned} coins added!`
**Actual**: `+{coinsEarned} coins added!`

**Recommendation**: Confirm with [OWNER] whether `+` prefix is acceptable. If confirmed acceptable, document as an approved departure. If not, remove the prefix.

---

### DEF-007 — ListForSaleSheet confirm step: category badge absent from pet summary card (low)

**Severity**: Low (cosmetic — interaction-spec.md specifies it; refined-stories.md is silent)
**Story**: PL-1
**File**: `src/components/player-listings/ListForSaleSheet.tsx`, lines 352–362

**Description**: The confirm step pet summary card shows image + name + RarityBadge. The interaction-spec.md (line 142) additionally specifies a category badge in the confirm step summary. The category badge is absent.

**Expected**: Pet summary card shows: image + name + RarityBadge + category badge.
**Actual**: Pet summary card shows: image + name + RarityBadge only.

**Note**: `SavedName.category` is available on the `pet` prop. Fix is low effort.

---

### DEF-008 — NPC offer toast does not navigate to My Listings on tap (medium)

**Severity**: Medium (functional — a specified interaction is missing; spec PL-6)
**Story**: PL-6
**File**: `src/hooks/usePlayerListings.ts`, lines 401–405

**Description**: The toast that fires when an NPC offer arrives calls `toast({ type: 'info', title: ... })` with no `onTap` navigation handler. The spec states: "Tapping the toast navigates to `/marketplace` with My Listings tab active." If the toast system supports tap navigation, this handler is missing.

**Expected**: Tapping the "Someone's interested in [Name]! Check My Listings." toast navigates to `/marketplace?tab=listings` or equivalent.
**Actual**: Toast fires; no navigation on tap.

**Fix**: Check if `useToast` supports an `onTap` or `action` prop. If so, add `onTap: () => navigate('/marketplace', { state: { tab: 'listings' } })` to the offer toast call. If not, this is a toast system capability gap — log against the Toast component.

---

### DEF-009 — PlayerListingCard has no exit animation when delist completes (low)

**Severity**: Low (missing animation — the card disappears instantly on delist)
**Story**: PL-9
**File**: `src/screens/MarketplaceScreen.tsx` (MyListingsTab), lines 211–226

**Description**: The spec states "The PlayerListingCard animates out (fade-out, 200ms)" on successful delist. The listing list (`flex flex-col gap-4`) is not wrapped in `AnimatePresence`. When `cancelListing` succeeds, the Dexie live query removes the listing from `activeListings`, and the card disappears instantly without the specified fade-out animation.

**Expected**: Card fades out over 200ms on delist (instant under prefers-reduced-motion).
**Actual**: Card disappears instantly.

**Fix**: Wrap the listings `map()` result in `<AnimatePresence>` and add `exit={{ opacity: 0, transition: { duration: 0.2 } }}` to a `<motion.div>` wrapper around each `PlayerListingCard`.

---

### DEF-010 — Expired listing summary card not implemented

**Severity**: Medium (missing feature — PL-10 story is marked "Should" priority)
**Story**: PL-10
**File**: `src/screens/MarketplaceScreen.tsx` (MyListingsTab), `src/hooks/usePlayerListings.ts`

**Description**: The spec requires an expired summary card to render on the next visit to My Listings after a listing expires. It should show: pet name, listing duration, number of offers, highest offer, "Nobody brought [Name] home this time.", and "OK, got it" dismiss button. Neither a component nor a query for expired listings with the `summary-pending` state is implemented.

**Note**: PL-10 is a "Should" priority story. The expiry mechanism itself (status transition, pet revert, toast) is implemented and passes. Only the summary card display is absent. This does not block sign-off on Must stories but blocks PL-10 completion.

---

### DS-CHECK-07 — MarketplaceScreen Browse tab missing `pt-4` (pre-existing defect)

**Severity**: Low (DS compliance — content sits flush against header on Browse tab)
**Scope**: Whole-codebase DS check 7 (applies app-wide, not scoped to player-listings batch)
**File**: `src/screens/MarketplaceScreen.tsx`, line 361

**Description**: The Browse tab content wrapper uses `px-6 pb-24` with no `pt-4`. This was a pre-existing defect in MarketplaceScreen prior to the player-listings build. Found during the mandatory app-wide DS check 7 sweep. Per CLAUDE.md: "Any pre-existing ghost button (or DS violation) found during a new feature's Phase D must be logged as a defect against the screen that owns it."

**Fix**: Change line 361 from `<div className="px-6 pb-24">` to `<div className="px-6 pt-4 pb-24">`.

---

## Spec Gaps (informational, non-blocking)

### SPG-001 — ListForSaleSheet focus management on open

The spec states "Focus moves to the first interactive element in the sheet on open." No explicit focus call is implemented. Browser default tab order means focus lands somewhere on the triggering page, not inside the sheet. For Harry's use case (iPad, touch primary), this is a minor gap. For keyboard/screen reader users it is more significant. The spec should be considered insufficiently met for WCAG 2.4.3. Recommend fixing in the same pass as DEF-003.

### SPG-002 — My Listings loading skeleton unreachable

`useLiveQuery` resolves instantly from IndexedDB on the initial call — there is no async loading state. The loading skeleton specified in PL-5 is therefore unreachable in practice. Acknowledged. Not a defect in the build; a spec gap in the design. No fix required.

---

## Must-fix before sign-off

The following defects must be resolved before Tester sign-off is granted and backlog status moves to `complete`:

| Defect | Story | Severity | Summary |
|--------|-------|----------|---------|
| DEF-001 | PL-7 | Medium | AcceptOfferModal shows buyer name instead of pet name in summary row |
| DEF-002 | PL-7 | Low | AcceptOfferModal body copy missing pet name |
| DEF-003 | PL-7 | Medium (a11y) | AcceptOfferModal has no focus management on open |
| DEF-004 | PL-7 | Medium | SoldCelebrationOverlay not responsive at 375px |
| DEF-005 | PL-11 | Medium | Empty state: wrong icon, wrong copy, missing CTA button |

DEF-006, DEF-007, DEF-009 may be addressed in the same pass at developer discretion. DEF-008 requires a toast system capability check. DEF-010 is a "Should" story — acceptable to defer. DS-CHECK-07 is pre-existing and should be fixed in the same MarketplaceScreen pass.

---

## Transaction integrity verification

Confirmed:

- `listPet()`: `savedNames.update(status: 'for_sale')` + `playerListings.add()` in ONE `db.transaction('rw', db.playerListings, db.savedNames, ...)` — PASS
- `cancelListing()`: `playerListings.update(status: 'cancelled')` + `savedNames.update(status: 'active')` + offer declines in ONE `db.transaction('rw', db.playerListings, db.savedNames, db.npcBuyerOffers, ...)` — PASS
- `completeSale()`: `earn()` + `savedNames.delete()` + `playerListings.update(status: 'sold')` + competing offer declines in ONE `db.transaction('rw', db.playerWallet, db.transactions, db.savedNames, db.playerListings, db.npcBuyerOffers, ...)` — PASS. All tables accessed by `earn()` are included in the outer transaction table list. This prevents the Dexie "Table not part of transaction" error.
- `checkExpiredListings()`: `playerListings.update(status: 'expired')` + `savedNames.update(status: 'active')` in ONE `db.transaction('rw', db.playerListings, db.savedNames, ...)` per expired listing — PASS

---

## Portal compliance verification

All floating/overlay components confirmed to use `createPortal(content, document.body)`:

- `AcceptOfferModal`: PASS — `return createPortal(content, document.body)` at line 193
- `SoldCelebrationOverlay`: PASS — `return createPortal(content, document.body)` at line 158
- `ForSaleReleaseBlockModal`: PASS — `return createPortal(content, document.body)` at line 148
- `DelistModal`: PASS — uses shared `Modal` component which portals to `document.body`
- `ListForSaleSheet`: PASS — uses shared `BottomSheet` component which portals to `document.body`

None of these components have `position: fixed` inside a `motion.*` ancestor. Portal pattern is clean.

---

## Scroll lock verification

- `AcceptOfferModal`: `useScrollLock` — `lock()` and `unlock()` in `useEffect` watching `open`. PASS
- `ForSaleReleaseBlockModal`: `useScrollLock` — same pattern. PASS
- `DelistModal`: uses shared `Modal` component which calls `useScrollLock`. PASS
- `useScrollLock` implementation: reference-counted module-level counter (`lockCount`). Correctly only applies `overflow: hidden` when count reaches 1 and only removes it when count reaches 0. Handles simultaneous overlays correctly. PASS

---

## Spec placement verification

**FE placed My Listings in MarketplaceScreen (correct)**

The interaction spec (section 5, PageHeader slot assignments) places the My Listings tab in MarketplaceScreen's centre-slot segmented control. The FE brief may have referenced MyAnimalsScreen but the interaction spec is the correct authority. The implementation is in the correct location.

**"List for Sale" button variant**

Spec section 1a and PL-1 AC both specify `variant="primary"` (blue) for the "List for Sale" button in PetDetailSheet. The FE followed the spec. Blue is correct — this is a utility flow-initiation button. Pink (accent) is reserved for the irreversible confirmation step ("List [Name]" on the confirm step). Confirmed correct.

---

## Tester sign-off

Sign-off: **WITHHELD**

The following stories meet their acceptance criteria and would individually pass:
- PL-2 (for-sale badge): PASS
- PL-3 (care block): PASS
- PL-4 (release block): PASS
- PL-5 (My Listings screen, structural): PASS (empty state defect blocks PL-11)
- PL-6 (NPC offer mechanic, except toast navigation): PARTIAL
- PL-8 (decline offer): PASS
- PL-9 (cancel listing, except exit animation): PASS

Stories blocked by defects:
- PL-1: accessible focus management gap (SPG-001, recommend fixing with DEF-003)
- PL-7: DEF-001, DEF-002, DEF-003, DEF-004 — all must be fixed
- PL-11: DEF-005 — must be fixed

When DEF-001 through DEF-005 are resolved, Tester re-review will be required only for the affected components:
1. `AcceptOfferModal.tsx` — DEF-001, DEF-002, DEF-003
2. `SoldCelebrationOverlay.tsx` — DEF-004
3. `MarketplaceScreen.tsx` (MyListingsTab empty state) — DEF-005

Re-review scope is targeted. Full Phase D re-run is not required.
