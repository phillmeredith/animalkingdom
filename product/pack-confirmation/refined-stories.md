# Refined Stories — Pack Opening Confirmation Sheet

Feature: `pack-confirmation`
Phase B: APPROVED
Last updated: 2026-03-27

---

## Context

The current `CardsScreen` spends coins the moment a player taps "Open Pack" on a `PackCard`. A mis-tap has no recovery. This feature inserts a confirmation `BottomSheet` between the first tap and the coin spend. The coin spend and card reveal only happen when the player explicitly taps "Open Pack" inside the sheet.

Key files:
- `src/screens/CardsScreen.tsx` — contains `PackCard`, `handleOpenPack`, `PACK_DEFS` (imported from hook)
- `src/hooks/useCardPacks.ts` — `openPack()`, `PACK_DEFS`, `PackDef`
- `src/hooks/useWallet.ts` — `coins`, `spend()`

---

## Story 1 — Tapping "Open Pack" on a PackCard opens the confirmation sheet, no coins spent

**As a player,** when I tap "Open Pack" on a pack, a sheet slides up showing pack details before any coins are spent, so I can review my purchase before committing.

**Acceptance criteria:**

- AC1.1: Tapping the "Open Pack" button on any `PackCard` opens a `BottomSheet` scoped to that pack. No coins are deducted at this point.
- AC1.2: The `CardsScreen` introduces a `confirmPack: string | null` state. When a card's button is tapped, `confirmPack` is set to the pack's `id`. The existing `openPack()` hook is not called until the sheet's CTA is tapped.
- AC1.3: `useWallet().coins` is unchanged after the first tap (before sheet confirmation).
- AC1.4: The sheet slides up from the bottom edge with a spring animation (`stiffness: 300, damping: 30`). A semi-transparent backdrop (`bg-black/50`) appears behind it.
- AC1.5: While the sheet is open, the PackCard buttons behind the backdrop are not interactive.
- AC1.6: The sheet displays a drag handle, the pack icon at 64px, the pack name at `text-[22px] font-700`, the description, rarity odds, coin cost, and wallet balance — in that order as specified in the interaction spec.

---

## Story 2 — Tapping "Open Pack" in the sheet spends coins and triggers card reveal

**As a player,** when I confirm by tapping "Open Pack" inside the sheet, my coins are spent and I see the card reveal, so the purchase completes as expected.

**Acceptance criteria:**

- AC2.1: The sheet contains a full-width `variant="accent"` (pink) button labelled "Open Pack" with a `Coins` icon (lucide-react, size 16) to the left of the label.
- AC2.2: Tapping the sheet's "Open Pack" button: (a) closes the sheet (`confirmPack = null`), (b) calls `openPack(packId)`, which calls `spend()` and resolves the opened cards, (c) sets `revealCards` to trigger the `CardReveal` overlay.
- AC2.3: The `CardReveal` overlay and its animation are unchanged from the current implementation.
- AC2.4: If `openPack()` returns `{ success: false }`, the sheet is closed, `revealCards` is not set, and `toast({ type: 'error', ... })` is shown — same error handling as today.
- AC2.5: After a successful open, `useWallet().coins` is reduced by `pack.price`. Verified by checking wallet balance before and after confirming.

---

## Story 3 — Dismissing the sheet spends no coins

**As a player,** I can dismiss the confirmation sheet without losing coins, so an accidental tap on "Open Pack" has no consequence.

**Acceptance criteria:**

- AC3.1: Tapping the backdrop (outside the sheet) closes the sheet. `useWallet().coins` is unchanged.
- AC3.2: Swiping or dragging the drag handle downward closes the sheet. `useWallet().coins` is unchanged.
- AC3.3: After dismissal, the player is returned to the Packs tab in the same state as before the sheet opened.
- AC3.4: `openPack()` is not called at any point during a dismiss interaction. Verified by confirming no `PackHistory` record is created in `db.packHistory` and no `Transaction` record is created in `db.transactions`.
- AC3.5: The sheet exit animation plays (`y: '100%'`, 200ms ease-in). Backdrop fades out simultaneously.

---

## Story 4 — Sheet shows rarity odds in plain language

**As a player,** I can read what the pack contains in simple words, so I understand what I might get without needing to read percentages.

**Acceptance criteria:**

- AC4.1: The sheet displays the rarity description for the pack as plain language text (e.g. "3 cards — mostly Common, chance of Uncommon"). This is sourced from `pack.description` in `PACK_DEFS`.
- AC4.2: No percentage values are shown anywhere in the sheet.
- AC4.3: The odds row uses a `PackageCheck` Lucide icon (size 16, `var(--t3)`) and renders in a `var(--elev)` background pill/row, as specified in the interaction spec.
- AC4.4: The text is legible at 375px width — no truncation or overflow.

---

## Story 5 — Sheet shows current wallet balance alongside the price

**As a player,** I can see how much a pack costs and how many coins I currently have, side by side, so I can make an informed decision without leaving the sheet.

**Acceptance criteria:**

- AC5.1: The sheet displays the pack's coin cost as `text-[20px] font-700 text-t1` with a `Coins` Lucide icon (size 16, `var(--amber-t)`) inline-left.
- AC5.2: Directly below the cost, the text "You have {N}" shows the live `useWallet().coins` value in `text-[13px] text-t3`.
- AC5.3: The wallet balance shown in the sheet is the real-time value — if coins changed since the screen mounted (e.g. daily bonus fired), the sheet reflects the current amount.
- AC5.4: When the player cannot afford the pack, both the coin cost and "You have {N}" are rendered in `var(--red-t)` to signal the shortfall.

---

## Story 6 — If the player cannot afford the pack, the CTA is disabled

**As a player,** if I cannot afford a pack, the "Open Pack" button in the sheet is disabled and replaced with "Not enough coins", so I cannot trigger a failed purchase.

**Acceptance criteria:**

- AC6.1: When `useWallet().canAfford(pack.price)` returns `false`, the sheet's CTA button renders with `disabled` prop set, label text "Not enough coins", and no icon.
- AC6.2: The disabled button retains `variant="accent"` — the Button component's existing disabled styles (opacity) apply.
- AC6.3: Tapping the disabled button produces no action — no `openPack()` call, no toast, no navigation.
- AC6.4: The `PackCard` button (outside the sheet) is also disabled when the player cannot afford, preventing the sheet from being opened in that state. (This is existing behaviour via `canAfford` prop — confirm it is not regressed.)
- AC6.5: If a player somehow opens the sheet for a pack they can afford and then their balance drops below the price (e.g. another tab spends coins — unlikely but possible with Dexie live queries), the CTA transitions to the disabled "Not enough coins" state reactively without requiring a sheet close/reopen.

---

## Out of scope for this feature

- Changing the `CardReveal` animation or overlay
- Changing the `PackCard` visual design (icon, name, description layout)
- Adding pack purchase history UI
- Refund or undo after confirmation
