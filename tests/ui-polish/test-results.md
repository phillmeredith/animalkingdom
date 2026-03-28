# Test Results — UI Polish Pass
**Date:** 2026-03-27
**Tester:** Senior QA (Tester agent)
**Scope:** Four files changed in this session — Modal.tsx, BottomNav.tsx, ShopScreen.tsx, Toast.tsx
**Method:** Static code review against acceptance criteria and the 6-point DS checklist

---

## Files Reviewed

- `src/components/ui/Modal.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/screens/ShopScreen.tsx`
- `src/components/ui/Toast.tsx`

---

## Acceptance Criteria Checks

### Modal / BottomSheet

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | No `bg-[var(--card)]` or `bg-[var(--elev)]` on Modal or BottomSheet containers — glass only | PASS | Both `motion.div` containers use inline `background: 'rgba(13,13,17,.88)'` — no bg class present |
| 2 | No `border border-[var(--border-s)]` class — replaced with inline style | PASS | Both components use `border` via inline `style` object; no Tailwind border class on the container `motion.div` |
| 3 | BottomSheet rounded-t-2xl (not rounded-t-xl) | PASS | Line 116: `'rounded-t-2xl shadow-elevated max-h-[85vh] overflow-hidden'` |
| 4 | Backdrop is `bg-black/30` (light, not `bg-black/75`) | PASS | `Backdrop` component line 15: `light ? 'fixed inset-0 bg-black/30' : ...`; both Modal and BottomSheet pass `light` prop |
| 5 | No hardcoded hex values in Modal.tsx | PASS | No hex literals present. Glass values (`rgba(13,13,17,.88)`, `rgba(255,255,255,.06)`, `rgba(255,255,255,.04)`) are intentional alpha composites that do not correspond to any DS token — see defect MODAL-01 below |

**DEFECT MODAL-01 — SEVERITY: LOW**
The glass background value `rgba(13,13,17,.88)` is a derivation of `--bg` (#0D0D11) at 88% opacity. It does not exist as a DS token and is not listed in the design system. It is used consistently across Modal, BottomSheet, and BottomNav, which is a positive sign of intentional system-level thinking, but it is undocumented. If this is an approved glass treatment the DS should define a token (e.g. `--glass-bg`). As-is this is a design system governance gap rather than a functional defect. No immediate code change required but the DS should be updated before this pattern spreads further.
- Steps to reproduce: Read `Modal.tsx` line 58, `BottomNav.tsx` line 37.
- Expected: Token defined in `DESIGN_SYSTEM.md` CSS variable block.
- Actual: Magic value with no token backing.

**DEFECT MODAL-02 — SEVERITY: MED**
The design system (`DESIGN_SYSTEM.md`, Modal/Bottom Sheet section) specifies:
- Backdrop background: `rgba(0,0,0,.65)`
- Modal background: `var(--card)` (#18181D)

The implementation uses `bg-black/30` (30% opacity) for the backdrop and `rgba(13,13,17,.88)` glass for the container. This is a deliberate deviation from the documented spec. The change may be intentional (a polish decision made during this session), but the DS has not been updated to reflect it. Until the DS is updated, the implementation is technically non-compliant. Recommend updating `DESIGN_SYSTEM.md` to formalise the glass treatment as the canonical pattern, or reverting to DS values.
- Severity: MED — no functional breakage, but DS and implementation are now out of sync.

---

### BottomNav

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | No `border-t border-[var(--border-s)]` class on the `<nav>` element | PASS | `<nav>` at line 17 has only `className="fixed bottom-0 left-0 right-0 z-[900]"` — no border class |
| 2 | Gradient div exists with `position: absolute, top: -48` above the nav bar | PASS | Lines 22–33: gradient `<div>` with `position: 'absolute', top: -48` present |
| 3 | Glass div wrapper exists with inline style containing `backdropFilter` | PASS | Lines 35–42: inner `<div>` with `backdropFilter: 'blur(24px)'` and `WebkitBackdropFilter` present |
| 4 | `<nav>` has no background class (bg moved to inner div) | PASS | `<nav>` has no `bg-` class; background is on the inner glass `<div>` |
| 5 | Structure is valid JSX — all divs properly closed | PASS | `<nav>` > gradient `<div>` (self-pattern) + glass `<div>` > flex `<div>` > NavLinks — all properly closed at lines 33, 73, 72, 74 |

**DEFECT BOTTOMNAV-01 — SEVERITY: LOW**
The design system specifies the gradient fade above the nav as `linear-gradient(to top, #0D0D11, transparent)` at `32px` height (DESIGN_SYSTEM.md, Navigation section and Page Layout Template). The implementation uses `rgba(13,13,17,.85)` (slightly transparent) rather than the solid `#0D0D11` hex, and the height is `48px` rather than the specified `32px`. These are minor divergences — the result is visually acceptable and arguably an improvement — but they are undocumented deviations from the DS spec.
- Expected: `background: linear-gradient(to top, #0D0D11, transparent)`, height `32px`
- Actual: `background: linear-gradient(to top, rgba(13,13,17,.85) 0%, transparent 100%)`, height `48px`

**DEFECT BOTTOMNAV-02 — SEVERITY: LOW**
The design system specifies the nav bar height as `80px` and background as `rgba(13, 13, 17, .85)`. The implementation renders the tab row inside a `h-[68px]` div. The outer nav element has no fixed height, so total height depends on the inner div plus safe-area padding. On devices without a home bar this will render at 68px, not the DS-specified 80px. This could cause `pb-24` scroll clearance to be insufficient on some screens (the DS also specifies `pb-32` in the page layout template — see DS checklist item 6 below).
- Severity: LOW — visually acceptable but spec non-compliant.

---

### ShopScreen ItemCard

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | `CATEGORY_ICON` (old map) no longer referenced anywhere in the file | PASS | Grep found no match for `CATEGORY_ICON` without `_EL` suffix anywhere in ShopScreen.tsx |
| 2 | `CATEGORY_ICON_EL` entries all use `size={40}` not `size={20}` | PASS | Lines 20–25: all five entries use `size={40}` |
| 3 | `CATEGORY_WELL_BG` and `CATEGORY_ICON_COLOR` both exist as `Record<ItemCategory, string>` | PASS | Lines 27–41: both records defined with all five categories |
| 4 | Each category maps to correct colour pair (saddle→amber, brush→green, feed→pink, toy→blue, blanket→purple) | PASS | Matches exactly: saddle→`--amber-sub`/`--amber-t`, brush→`--green-sub`/`--green-t`, feed→`--pink-sub`/`--pink-t`, toy→`--blue-sub`/`--blue-t`, blanket→`--purple-sub`/`--purple-t` |
| 5 | `ItemCard` has `aria-label` prop with correct format | PASS | Line 67: `aria-label={`${item.name}, ${item.price} coins${ownedCount > 0 ? ', owned' : ''}`}` — correct format |
| 6 | Owned badge uses text "OWNED" / "N×", not a coloured dot | PASS | Lines 89–91: renders `'OWNED'` for count 1, `${ownedCount}×` for count >1 |
| 7 | Price icon is `size={14}` Coins with inline `style` for colour (not className) | PASS | Lines 110–115: `<Coins size={14} ... style={{ color: canAfford ? 'var(--amber)' : 'var(--t4)' }} />` |
| 8 | `PurchaseSheet` header no longer uses `CATEGORY_ICON` — uses `CATEGORY_ICON_EL` | PASS | Lines 148–150: `CATEGORY_ICON_EL[item.category]` used in PurchaseSheet header |
| 9 | No hardcoded hex values in ShopScreen.tsx | PASS | All colour values use `var(--...)` tokens; no hex literals found |

**DEFECT SHOP-01 — SEVERITY: LOW**
The `PurchaseSheet` price row (line 187) renders `<Coins size={18} />` without an `aria-hidden="true"` attribute. The icon sits adjacent to the price number in a decorative capacity; a screen reader will announce the Coins icon as an unlabelled interactive element or skip it inconsistently depending on the reader. The `ItemCard` version (line 113) correctly uses `aria-hidden="true"`. Inconsistency between the two usages.
- Steps to reproduce: Navigate to Shop, tap any item, observe PurchaseSheet. Run a screen reader (VoiceOver/TalkBack) on the price row.
- Expected: `<Coins aria-hidden="true" />` — decorative icon suppressed from accessibility tree.
- Actual: Icon has no `aria-hidden` attribute.

**DEFECT SHOP-02 — SEVERITY: LOW**
The `ItemCard` renders the stat effect line (line 101) as `+{item.statBoost.value} {item.statBoost.stat}` with no accessible context. The card's `aria-label` (line 67) includes name, price, and owned status, but omits the stat boost. A screen reader user reviewing the shop will not hear the stat information when navigating by button. The stat is visible only to sighted users.
- Expected: `aria-label` includes stat boost, e.g. `"Premium Saddle, 120 coins, +5 agility, owned"`.
- Actual: Stat boost absent from `aria-label`.
- Severity: LOW — shop is still usable; stat is available in the PurchaseSheet which does expose it.

---

### Toast

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | `backdrop-blur-xl` present on ToastCard `motion.div` className | PASS | Line 195: `shadow-elevated w-full backdrop-blur-xl` — present in the template literal className |

---

## 6-Point DS Checklist

All four changed files assessed together.

### 1. No emojis used as icons — Lucide only
**PASS** — All four files use only Lucide icons (`X`, `CheckCircle`, `AlertTriangle`, `XCircle`, `Info`, `Home`, `Search`, `Heart`, `Gamepad2`, `Store`, `Disc`, `Paintbrush`, `Wheat`, `Star`, `BedDouble`, `Coins`, `CreditCard`). No emoji characters found in any file.

### 2. No `ghost` variant on visible actions
**PASS** — No `ghost` variant found in any of the four files. Visible actions use `accent`, `outline`, or flat tint patterns.

### 3. All colours trace to `var(--...)` tokens — no hardcoded hex
**WARNING** — Glass values (`rgba(13,13,17,.88)`, `rgba(255,255,255,.06)`, `rgba(255,255,255,.04)`) appear in Modal.tsx and BottomNav.tsx. These are intentional alpha composites of `--bg` used for the glass effect. They are not DS tokens. The Toast.tsx CONFIG object uses `border-[rgba(69,178,107,.2)]`, `border-[rgba(245,166,35,.2)]`, `border-[rgba(239,70,111,.2)]`, and `border-[rgba(55,114,255,.2)]` — these match the DS-specified toast border values exactly (DESIGN_SYSTEM.md, Toast Notifications table) but are raw rgba values rather than tokens. This is a pre-existing pattern not changed in this session; raised for visibility. No new violations introduced in this session's changes beyond the glass values noted under MODAL-01.

### 4. Surface stack correct — glass overlay steps above content correctly
**PASS** — Modal and BottomSheet use `z-[1000]`, BottomNav uses `z-[900]`, Toasts use `z-[9999]`. Stack order is: content < nav (900) < modal (1000) < toast (9999). This is correct. The glass treatment on modal/sheet/nav sits above the page surface, which is appropriate.

### 5. Layout verified at 375px, 768px, 1024px
**PASS** — ShopScreen grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4` (line 299) provides responsive layout at all three breakpoints. Grid content area has `px-6 pb-24` (line 298). Modal is `max-w-[420px]` with `p-4` outer wrapper ensuring it fits at 375px. BottomNav is `fixed bottom-0 left-0 right-0` — full width at all breakpoints. Toast container is `max-w-sm` centred — fits at 375px.

**WARNING — LAYOUT-01 — SEVERITY: MED**
ShopScreen scrollable grid uses `pb-24` (96px). The design system page layout template specifies `pb-32` (128px) for scrollable content above the nav. The nav renders at 68px actual height (not the DS-specified 80px). On a device with a home bar, safe-area-inset-bottom adds further height. At 68px nav + 0px safe area, `pb-24` (96px) provides 28px of visible clearance — marginal but potentially sufficient. However, the DS states `pb-32` as the standard. This inconsistency between the DS specification (`pb-32`) and the implementation (`pb-24`) should be resolved. The CLAUDE.md hard rules explicitly require `pb-24` minimum so this implementation technically meets the CLAUDE.md requirement, but diverges from the DS page layout template.

### 6. All scrollable content has `pb-24` minimum
**PASS** — ShopScreen scrollable grid div: `pb-24` (line 298). BottomSheet inner scroll div uses `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` via inline style (line 155) — this clears the safe area but does not add fixed bottom padding. For sheets where content extends to the bottom this may clip the last element marginally, but since the sheet has its own `max-h-[85vh]` container this is acceptable. Modal content does not scroll independently. Toast and BottomNav are not scrollable.

---

## Defect Summary

| ID | File | Severity | Description |
|----|------|----------|-------------|
| MODAL-01 | Modal.tsx / BottomNav.tsx | LOW | Glass background `rgba(13,13,17,.88)` used across three components without a DS token definition |
| MODAL-02 | Modal.tsx | MED | Backdrop opacity (30%) and container background (glass) deviate from DS spec (65% backdrop, `var(--card)` container) without a DS update |
| BOTTOMNAV-01 | BottomNav.tsx | LOW | Gradient fade uses `rgba(13,13,17,.85)` and 48px height vs DS spec of `#0D0D11` and 32px |
| BOTTOMNAV-02 | BottomNav.tsx | LOW | Tab bar renders at 68px, not DS-specified 80px |
| SHOP-01 | ShopScreen.tsx | LOW | `<Coins>` in PurchaseSheet price row missing `aria-hidden="true"` |
| SHOP-02 | ShopScreen.tsx | LOW | `ItemCard` `aria-label` omits stat boost information |
| LAYOUT-01 | ShopScreen.tsx | MED | Scrollable grid uses `pb-24` where DS page layout template specifies `pb-32` |

**Total defects: 7**
- HIGH: 0
- MED: 2 (MODAL-02, LAYOUT-01)
- LOW: 5

---

## Notes on Pre-Existing Issues (not introduced this session)

- Toast CONFIG object uses raw rgba border values that match DS spec values but are not tokenised. Pre-existing; not introduced in this session.
- The undo button double-tap guard in Toast.tsx requires two taps within 400ms to trigger undo. This is an unusual interaction pattern that may be confusing for the target user (child with ADHD/autism). This is a pre-existing design decision, not a regression from this session, but flagged for awareness.

---

## Tester Sign-off

**Tester sign-off: BLOCKED — 2 MED defects require resolution before this build is marked complete.**

Required fixes before proceeding:
1. **MODAL-02** — Either update `DESIGN_SYSTEM.md` to document the glass treatment as the canonical modal/sheet background pattern (replacing `var(--card)` and `rgba(0,0,0,.65)` backdrop), or revert Modal.tsx to DS spec values. The implementation and the DS must agree.
2. **LAYOUT-01** — Align `ShopScreen.tsx` scrollable grid padding with the DS page layout template (`pb-32`), or update the DS template to confirm `pb-24` as the new standard.

The five LOW defects do not block shipping but should be scheduled for the next polish pass. SHOP-01 and SHOP-02 are accessibility issues that affect screen reader users and should be prioritised within the LOW tier.
