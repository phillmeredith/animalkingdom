# Interaction Spec — Pack Opening Confirmation Sheet

Feature: `pack-confirmation`
Status: Phase B approved
Last updated: 2026-03-27

---

## Summary

Replace one-tap pack purchase with a two-step flow: tap "Open Pack" on a `PackCard` → confirmation `BottomSheet` slides up → tap "Open Pack" inside the sheet → coins spent → existing card reveal animation plays. Dismissing the sheet at any point before the second tap spends no coins.

---

## 1. The Problem with the Current Flow

In `CardsScreen.tsx`, tapping the `PackCard` button calls `handleOpenPack(packId)` directly. `openPack()` calls `spend()` immediately. There is no confirmation step. A mis-tap or accidental press spends coins with no recovery path.

---

## 2. New Flow — Step by Step

```
1. Player sees Packs tab (unchanged)
2. Player taps "Open Pack" on a PackCard
   → No coins spent
   → BottomSheet animates up from the bottom edge
3. Player reviews pack details in the sheet
4a. Player taps "Open Pack" (in sheet)
    → Sheet closes
    → coins spent (spend() called here)
    → CardReveal overlay plays (existing animation, no change)
4b. Player dismisses sheet (drag handle / tap backdrop / swipe down)
    → Sheet closes
    → No coins spent
    → Player is back on Packs tab unchanged
```

---

## 3. PackCard Changes

`PackCard` currently has a single `<Button>` that calls `onBuy` directly.

**New behaviour:** `onBuy` now means "open the confirmation sheet for this pack", not "spend coins". The button label and appearance do not change. `canAfford` prop continues to control disabled state on the card button — if the player cannot afford the pack, the card button is disabled before the sheet is even opened.

No visual change to the `PackCard` component itself.

---

## 4. BottomSheet — Structure

The sheet uses the existing glass BottomSheet pattern from the design system (see DS section on glass surfaces).

**Glass treatment:** `bg-[var(--card)]/80 backdrop-blur-xl border-t border-[var(--border-s)]`

**Drag handle:** 36px wide, 4px tall, `var(--border)` colour, `rounded-full`, centered at top of sheet, `mt-3 mb-4`.

**Sheet max-height:** `max-h-[85vh]`, `overflow-y-auto`

**Content column inside sheet:** `max-w-3xl mx-auto w-full px-6 pb-8`

---

## 5. BottomSheet Contents (top to bottom, in order)

### 5.1 Drag handle
36×4px pill, `var(--border)`, `rounded-full`, centered, `mt-3 mb-5`.

### 5.2 Pack icon
The pack's category icon from `PACK_ICON` (existing map in `CardsScreen`), rendered at **64px** container size (up from 28px on the card).

- Container: `w-16 h-16 rounded-2xl bg-[var(--elev)] flex items-center justify-center mx-auto`
- Icon size prop: `48` (the Lucide icon inside)
- `mb-4`

### 5.3 Pack name
`text-[22px] font-700 text-t1 text-center mb-1`

### 5.4 Description
`text-[14px] text-t2 text-center mb-5`

Use the existing `pack.description` string from `PACK_DEFS`.

### 5.5 Rarity odds row
A labelled row, not percentages. Pull from `pack.description` (which already uses plain language). Display the description as-is — it already reads "3 cards — mostly Common, chance of Rare" etc.

If the FE agent prefers a dedicated odds block, use:

```
┌──────────────────────────────────────┐
│  [PackageCheck icon, 16px, --t3]     │
│  3 cards — mostly Common,            │  text-[13px] text-t2
│  chance of Uncommon                  │
└──────────────────────────────────────┘
```

Icon: `PackageCheck` from lucide-react, size 16, `var(--t3)`, displayed inline-left of the text. Row `bg-[var(--elev)] rounded-xl p-3 flex items-start gap-2 mb-5`.

### 5.6 Cost + wallet row
Two-line block, centered:

```
50 coins          text-[20px] font-700 text-t1
You have 385      text-[13px] text-t3 mt-0.5
```

- Coin amount: `<Coins size={16} />` icon (lucide-react) inline-left of the number, `var(--amber-t)` colour
- "You have N" text: live from `useWallet().coins`
- If the player **cannot afford**: coin amount rendered in `var(--red-t)` and "You have N" renders in `var(--red-t)` as well
- `mb-6`

### 5.7 Primary CTA — "Open Pack"
Full-width `variant="accent"` button (pink).

**Affordable state:**
- Label: `"Open Pack"`
- Left icon: `Coins` size 16
- `onClick`: spend coins → close sheet → trigger card reveal

**Cannot afford state:**
- Button is `disabled`
- Label changes to `"Not enough coins"` (no icon)
- `variant="accent"` is still used — disabled styling handled by the Button component's existing disabled styles (opacity reduction)
- No separate error state component needed

---

## 6. Interaction States

### PackCard button
| State | Appearance | Tap |
|---|---|---|
| Can afford, no sheet open | Accent button, enabled | Opens sheet |
| Cannot afford | Accent button, disabled | No action |
| Sheet already open | — | Sheet is modal; background not interactive |

### Sheet CTA
| State | Appearance | Tap |
|---|---|---|
| Can afford | Pink accent, "Open Pack" | Spend → reveal |
| Cannot afford | Disabled, "Not enough coins" | No action |

### Sheet dismissal
| Method | Result |
|---|---|
| Drag handle swiped down | Sheet closes, no spend |
| Tap backdrop (outside sheet) | Sheet closes, no spend |
| "Open Pack" tapped | Sheet closes, spend fires, reveal starts |

---

## 7. Animation

**Sheet entrance:** `y: '100%'` → `y: 0`, spring animation, `stiffness: 300, damping: 30`. Uses `framer-motion` consistent with existing overlays.

**Sheet exit:** `y: '100%'`, duration 200ms ease-in.

**Backdrop:** `bg-black/50`, fades in with sheet. Tap to dismiss.

**Reduced motion:** If `useReducedMotion()` returns true, skip translate animation; sheet appears/disappears instantly (opacity fade only, 150ms).

---

## 8. CardsScreen State Changes

The `buying` state in `CardsScreen` currently tracks the in-flight `openPack()` call. With this feature:

- Add `confirmPack: string | null` state — the `packId` of the pack whose sheet is open. `null` means no sheet.
- `handleOpenPack(packId)` → sets `confirmPack = packId` (no spend, no async call yet).
- New `handleConfirmOpen()` → called by the sheet's CTA. Closes sheet (`confirmPack = null`), then calls existing `openPack(packId)` flow (spend + reveal).
- `handleDismissSheet()` → sets `confirmPack = null`. No other side effects.

The `buying` / loading guard remains: if `buying` is set (reveal in progress), the pack cards are disabled.

---

## 9. Responsive Layout

The BottomSheet is full-width on all screen sizes (edge to edge). Content inside uses `max-w-3xl mx-auto w-full px-6` to prevent stretching on iPad.

On 1024px landscape, the sheet content column is centre-aligned at `max-w-3xl` — the sheet does not become a modal/dialog; it remains a bottom sheet.

---

## 10. Design System Compliance Checklist

To be verified by FE agent after build:

1. No emojis — Lucide `Coins`, `PackageCheck`, `Package`, `Backpack`, `Crown` icons only
2. No `ghost` variant — CTA uses `accent`; disabled state handled by Button component props
3. All colours use `var(--...)` tokens — no hardcoded hex
4. Surface: sheet uses `var(--card)` (one level up from `var(--bg)`); icon containers use `var(--elev)` (one level up from sheet)
5. Layout verified at 375px, 768px, 1024px — sheet content column centred with `max-w-3xl` at wide breakpoints
6. Sheet scrollable content has `pb-8` minimum; underlying screen content is not interactive while sheet is open
