# Generate Journey — Width and Layout Review

**Reviewer:** UX Designer
**Date:** 2026-03-28
**Scope:** All screens and components in the Generate wizard flow
**Primary target device:** iPad (1024px portrait, 1366px landscape)

---

## Files reviewed

| File | Role in journey |
|------|----------------|
| `src/screens/GenerateScreen.tsx` | Wizard shell, steps 1–7 |
| `src/components/generate/WizardHeader.tsx` | Step counter / back button |
| `src/components/generate/OptionGrid.tsx` | Option card grid (all choice steps) |
| `src/components/generate/OptionCard.tsx` | Individual selectable option |
| `src/components/generate/ResultsScreen.tsx` | Name selection + adopt CTA |
| `src/components/generate/GeneratingOverlay.tsx` | Loading state between step 7 and results |
| `src/components/generate/AdoptionOverlay.tsx` | Celebration after adoption |
| `src/components/generate/TraderPuzzle.tsx` | Post-adoption quiz bottom sheet |

---

## Check definitions

1. **Content column** — uses `max-w-3xl mx-auto w-full`
2. **Input width** — text inputs do not span full iPad width
3. **iPad (1024px) layout** — content is not sparse or uncomfortably wide
4. **Tablet (768px) layout** — same check
5. **Option grid columns** — uses `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` where applicable
6. **CTA button width** — appropriately constrained
7. **pb-24** — bottom padding on all scrollable content
8. **pt-4** — breathing room below the step question heading

---

## Summary table — pass / fail per screen

| Screen / Step | (1) Content col | (2) Input width | (3) iPad 1024px | (4) Tablet 768px | (5) Grid cols | (6) CTA width | (7) pb-24 | (8) pt-4 |
|---|---|---|---|---|---|---|---|---|
| Steps 1–5 (icon grid) | FAIL | n/a | FAIL | FAIL | FAIL | n/a | PASS | FAIL |
| Step 6 (breed grid) | PASS | n/a | PASS | PASS | PASS | n/a | PASS | FAIL |
| Step 7 (colour grid) | FAIL | n/a | FAIL | FAIL | FAIL | n/a | PASS | FAIL |
| ResultsScreen | FAIL | FAIL | FAIL | FAIL | n/a | FAIL | FAIL | n/a |
| GeneratingOverlay | n/a — full-bleed intentional | n/a | PASS | PASS | n/a | n/a | n/a | n/a |
| AdoptionOverlay | n/a — full-bleed intentional | n/a | PASS | PASS | n/a | n/a | n/a | n/a |
| TraderPuzzle (bottom sheet) | FAIL | n/a | FAIL | FAIL | n/a | FAIL | n/a | n/a |

Severity key: MAJOR = iPad layout failure. MINOR = phone-only issue or isolated cosmetic.

---

## Detailed findings and required fixes

### MAJOR — Steps 1–5 and step 7: content column is unbounded

**Location:** `src/components/generate/OptionGrid.tsx`, lines 96–120 (default grid path)
**Location:** `src/screens/GenerateScreen.tsx`, lines 496–509 (step question block)

**Problem — step question block (GenerateScreen.tsx lines 496–509):**
The `<div>` containing the step title (`h2`) and subtitle (`p`) uses `px-6 pt-2 pb-5 shrink-0` with no max-width or centring. On an iPad at 1024px this block spans the full screen width, leaving the heading floating in a sea of empty horizontal space. The heading line length can exceed 700px — well beyond comfortable reading width.

**Problem — OptionGrid default path (OptionGrid.tsx lines 96–120):**
The outer `<div>` on the default (non-responsive-breed) path uses `px-6 pb-24` with a fixed `gridTemplateColumns: repeat(${defaultCols}, 1fr)`. There is no `max-w-3xl mx-auto` wrapper. On iPad the grid fills the full 1024px viewport minus `px-6` on each side (12px), producing ~1000px-wide content. A 2-column icon grid at ~500px per card looks sparse and wrong.

**Problem — column count (steps 1–5, 7):**
The default column count is determined by `options.length === 2 ? 1 : 2`. This hardcodes 2 columns for all option counts except 2. At 768px and 1024px, 2 columns is the correct phone layout, not the tablet layout. There is no responsive escalation for these steps.

Correct column behaviour per DS responsive rules:
- Steps 1, 5 (6 and 12 options respectively) — use `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Steps 2 (variable, typically 4–8 options) — use `grid-cols-2 md:grid-cols-3`
- Step 3 (2 options — Male/Female) — keep `grid-cols-2`, but constrain with `max-w-lg mx-auto`
- Step 4 (5 options) — use `grid-cols-2 md:grid-cols-3`
- Step 7 (colour swatches, typically 6–10 options) — use `grid-cols-3 md:grid-cols-4 lg:grid-cols-5`

**Problem — pt-4 missing:**
The step question block uses `pt-2` (8px), which is below the DS minimum of `pt-4` (16px) for content immediately below a header element.

**Required fix — GenerateScreen.tsx, step question block (lines 496–509):**

Replace:
```tsx
<div className="px-6 pt-2 pb-5 shrink-0">
```
With:
```tsx
<div className="px-6 pt-4 pb-5 shrink-0 max-w-3xl mx-auto w-full">
```

**Required fix — OptionGrid.tsx, default grid path (lines 96–120):**

The entire default-path return must gain a centring wrapper and responsive column classes. Replace the current return block with:

```tsx
return (
  <div className="flex-1 overflow-y-auto px-6 pb-24">
    <div
      className={cn(
        'max-w-3xl mx-auto w-full content-start',
        defaultCols === 1
          ? 'grid grid-cols-2 max-w-lg gap-3'
          : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3',
      )}
    >
      {options.map(opt => (
        <OptionCard
          key={opt.value}
          emoji={opt.emoji}
          icon={opt.icon}
          imageUrl={opt.imageUrl}
          label={opt.label}
          description={opt.description}
          colorHex={opt.hex}
          selected={selected === opt.value}
          onClick={() => onSelect(opt.value)}
        />
      ))}
    </div>
  </div>
)
```

Note: `defaultCols === 1` means 2 options (Male/Female step). Those 2 cards should be capped at `max-w-lg` so they read as a deliberate pair, not two cards adrift in a wide grid. All other steps use `md:grid-cols-3 lg:grid-cols-4`.

**Note to FE:** The colour step (step 7) passes a `hex` value on each option but no `icon`. The colour swatch renders at 48px (`w-12 h-12`). At 5 columns on large screens this is fine — the swatch is still clearly visible. Verify by resizing to 1024px.

---

### MAJOR — ResultsScreen: no content column constraint, full-width name list, wrong CTA width

**Location:** `src/components/generate/ResultsScreen.tsx`

**Problem — hero row (lines 52–69):**
`<div className="px-6 shrink-0">` — no `max-w-3xl mx-auto`. On iPad the animal thumbnail sits 24px from the left edge while the name/rarity group stretches to fill the remaining ~970px. The `flex-1 min-w-0` on the text group means the breed name can run to 900px+.

**Problem — name selection list (lines 72–106):**
`<div className="px-6 shrink-0">` — same issue. The name radio list stretches full width. A list of 3 name options each spanning 900px reads as broken. DS form pattern requires inputs and list controls to be constrained — `max-w-3xl mx-auto` applies here.

**Problem — narrative (line 109):**
`<p className="px-6 mt-4 ...">` — no `max-w-3xl mx-auto`. Long narrative text at 1000px+ line length is unreadable.

**Problem — CTA buttons (lines 114–133):**
Both buttons use `w-full` with no `max-w-3xl mx-auto` on the container. On iPad this produces 1000px-wide pill buttons. The DS specifies primary CTA buttons in focused flows are constrained — they should not span the full iPad viewport. The correct pattern is the wrapper to be `max-w-3xl mx-auto w-full` and the buttons to remain `w-full` within that constrained container. This matches the intent: full-width within the content column, not full-width of the screen.

**Problem — pb-24 missing (line 114):**
The CTA block uses `pb-8` (32px). The DS requires `pb-24` (96px) on all scrollable content to clear the fixed bottom nav and gradient fade. If ResultsScreen can be reached while the bottom nav is visible, content will be hidden behind it.

**Problem — top bar (lines 41–49):**
`<div className="flex items-center px-4 pt-4 pb-2 shrink-0">` — uses `px-4` while all other sections in this same screen use `px-6`. This inconsistency will be visible: the "Start over" back link will be misaligned by 8px relative to the content below it.

**Required fix — ResultsScreen.tsx:**

Add a single centring wrapper that all content sections sit inside. Replace the outer return with:

```tsx
return (
  <div className="flex flex-col h-full overflow-y-auto bg-[var(--bg)]">
    {/* Top bar */}
    <div className="flex items-center px-6 pt-4 pb-2 shrink-0 max-w-3xl mx-auto w-full">
      <button
        onClick={onStartOver}
        className="flex items-center gap-1.5 text-[13px] text-t3 hover:text-t1 transition-colors"
      >
        <ChevronLeft size={16} />
        Start over
      </button>
    </div>

    {/* All subsequent content sections: add max-w-3xl mx-auto w-full to each px-6 div */}
```

Specifically, every `<div className="px-6 ...">` block in ResultsScreen must become `<div className="px-6 ... max-w-3xl mx-auto w-full">`. The CTA block at line 114 must change `pb-8` to `pb-24`.

Exact line-by-line changes:

| Line | Current | Change to |
|------|---------|-----------|
| 42 | `className="flex items-center px-4 pt-4 pb-2 shrink-0"` | `className="flex items-center px-6 pt-4 pb-2 shrink-0 max-w-3xl mx-auto w-full"` |
| 52 | `className="px-6 shrink-0"` | `className="px-6 shrink-0 max-w-3xl mx-auto w-full"` |
| 72 | `className="px-6 shrink-0"` | `className="px-6 shrink-0 max-w-3xl mx-auto w-full"` |
| 109 | `className="px-6 mt-4 ..."` | `className="px-6 mt-4 ... max-w-3xl mx-auto w-full"` |
| 114 | `className="px-6 mt-6 pb-8 flex flex-col gap-3 shrink-0"` | `className="px-6 mt-6 pb-24 flex flex-col gap-3 shrink-0 max-w-3xl mx-auto w-full"` |

---

### MAJOR — TraderPuzzle: bottom sheet content is unbounded at wide widths

**Location:** `src/components/generate/TraderPuzzle.tsx`

**Problem:**
The bottom sheet inner `<motion.div>` (line 72) uses `className="w-full ... px-6 pt-5 pb-10"` with no `max-w` or centring. On iPad at 1024px, the sheet spans the full viewport width. This is a known bad pattern for bottom sheets on tablet: wide sheets read like mis-scaled modals, not sheets. The DS defines bottom sheets with `max height: 85vh` but does not explicitly cap width — however a bottom sheet spanning the full 1024px iPad width is a layout failure: the content within it (question text, 2×2 answer grid, buttons) all suffer the same line-length and element-width problems.

The correct fix: the sheet surface itself remains `w-full` (it should fill the screen edge-to-edge as a sheet), but the content inside it must be constrained. Wrap all inner content in a `max-w-xl mx-auto w-full` container. `max-w-xl` (576px) is appropriate for a quiz sheet — it keeps options readable without looking sparse.

**Required fix — TraderPuzzle.tsx:**

Inside the inner `<motion.div>` at line 72, after the drag handle `<div>`, add a content wrapper:

```tsx
<motion.div
  className="w-full bg-[var(--card)] border-t border-[var(--border-s)] rounded-t-xl px-6 pt-5 pb-10"
  initial={{ y: 300 }}
  animate={{ y: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {/* Drag handle */}
  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

  {/* Content constrained for tablet */}
  <div className="max-w-xl mx-auto w-full">
    {/* Header, question, options grid, skip button, result message — all moved inside here */}
  </div>
</motion.div>
```

All content from line 81 onwards (Header div, question p, options grid, Skip button, result messages) must be inside the `max-w-xl mx-auto w-full` wrapper.

---

### MINOR — Step question block pt-2 below DS minimum

**Location:** `src/screens/GenerateScreen.tsx`, line 496
**Already covered above** (the fix changes `pt-2` to `pt-4`). Flagged separately here as it also affects phone layout — content sits 8px too close to WizardHeader on all breakpoints.

---

### MINOR — OptionGrid responsive-breed path has no centring wrapper

**Location:** `src/components/generate/OptionGrid.tsx`, lines 71–93

**Problem:**
The `responsive-breed` path (step 6) uses `<div className="flex-1 overflow-y-auto px-6 pb-24 pt-1">` with the grid directly inside. There is no `max-w-3xl mx-auto w-full` wrapper. At 1024px, a `lg:grid-cols-4` breed grid expands to fill ~1000px. This is the one path that has correct responsive column counts, but the outer container still allows the grid to span the full screen.

This is rated MINOR rather than MAJOR because the breed grid at step 6 reads acceptably at 4 columns across ~1000px (each card ~232px), which is workable. However it is inconsistent with the DS content column rule.

**Required fix — OptionGrid.tsx, responsive-breed path (lines 71–93):**

Replace:
```tsx
<div className="flex-1 overflow-y-auto px-6 pb-24 pt-1">
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
```
With:
```tsx
<div className="flex-1 overflow-y-auto px-6 pb-24 pt-1">
  <div className="max-w-3xl mx-auto w-full">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
```
Close the extra `</div>` before the outer `</div>`.

---

### MINOR — Emoji used in TraderPuzzle result messages

**Location:** `src/components/generate/TraderPuzzle.tsx`, lines 112 and 83

Line 83: `"Trader Quiz! 🪙"` — emoji in heading text.
Line 112: `"✓ Correct! Coins on their way 🪙"` — emoji in result text.

Per DS and project rules: no emojis anywhere in JSX, toast messages, or button labels. Use Lucide icons only.

**Required fix:**
- Line 83 heading: remove `🪙`. The subheading on line 84 already says "10–25 coins" — the heading does not need a coin icon. If an icon is needed, use `<Coins size={16} className="inline text-[var(--amber)]" />` from `lucide-react`.
- Line 112: replace `🪙` with nothing, or with `<Coins size={14} className="inline text-[var(--amber)]" />` after the text. Replace `✓` with a Lucide `<Check size={14} />` inline.

---

## Priority order for implementation

### Do first — MAJOR, highest impact on iPad experience

1. **ResultsScreen — add `max-w-3xl mx-auto w-full` to all content sections and fix pb-24.** This is the screen the user lands on after completing the 7-step wizard. It is the most important screen in the flow to get right. (5 individual class changes, all in `ResultsScreen.tsx`)

2. **OptionGrid default path — add max-w-3xl wrapper and responsive column counts.** Affects steps 1, 2, 3, 4, 5, and 7 — the majority of the wizard. (Rewrite the default return block in `OptionGrid.tsx`)

3. **GenerateScreen — add `max-w-3xl mx-auto w-full` to step question block and fix pt-4.** The heading reads with correct line length once content column is constrained. (1 class change, `GenerateScreen.tsx` line 496)

4. **TraderPuzzle — add `max-w-xl mx-auto w-full` content wrapper inside bottom sheet.** Affects the post-adoption quiz. (Structural change in `TraderPuzzle.tsx`)

### Do second — MINOR

5. **OptionGrid responsive-breed path — add max-w-3xl wrapper.** Step 6 already works at the correct column count; this is a polish/consistency fix.

6. **TraderPuzzle — remove emojis, replace with Lucide icons.** DS compliance fix; does not affect layout.

---

## Additional observations (not layout failures but flag for FE awareness)

**GeneratingOverlay — `absolute` positioning inside `motion.div` with opacity animation:**
`GeneratingOverlay` uses `absolute inset-0` (line 34). It sits inside the wizard's `<div className="relative ...">` (GenerateScreen line 485). This is intentional and correct — it is position-relative to its own parent, not a fixed overlay. No portal required. However the parent `motion.div` wrapping `OptionGrid` (GenerateScreen lines 513–528) uses `initial={{ opacity: 0 }}` — this creates a stacking context. If the GeneratingOverlay is ever moved inside that motion.div it would be trapped. Current structure is safe; note this as a maintenance risk if the render tree is refactored.

**AdoptionOverlay — `fixed` inside React tree rendered at component root:**
`AdoptionOverlay` and `TraderPuzzle` are rendered at the root of `GenerateScreen`'s conditional return (lines 437–451), outside any `motion.*` wrapper. This is safe. No portal issue currently. This is the correct pattern — leave it as is.

**ResultsScreen — no `WizardHeader` or equivalent step progress indicator:**
The results screen shows a plain text "Start over" link but no step count or progress dots. This is a design gap outside the scope of this layout review — flag for the interaction spec if a future revision is planned.
