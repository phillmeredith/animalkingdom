# UX Brief: My Animals / Collection

---

## Screen inventory

| Screen / Layer | Route | Type |
|----------------|-------|------|
| MyAnimalsScreen | `/animals` | Full page |
| PetDetailSheet | inline | Bottom sheet, slides up on card tap |
| ReleaseConfirm | inline | Secondary sheet stacked above detail |
| RenameInput | inline | Replaces name text within detail sheet |

---

## Page structure

```
┌──────────────────────────────────────────┐
│ My Animals                    [🪙 1,200] │  PageHeader
├──────────────────────────────────────────┤
│ [All] [At Home] [Stables] [Farm] ...    │  filter bar (scrollable pills)
├──────────────────────────────────────────┤
│ 12 animals                  [Newest ▾]  │  sort row
├──────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐             │
│  │ [image]  │  │ [image]  │             │  2-column grid
│  │ Storm    │  │ Bella    │             │
│  │ Uncommon │  │ Epic     │             │
│  │ Husky·   │  │ Arabian· │             │
│  │ At Home  │  │ Stables  │             │
│  └──────────┘  └──────────┘             │
└──────────────────────────────────────────┘
```

---

## Filter bar

Scrollable horizontal pill row. Tabs: **All · At Home · Stables · Farm · Lost World · Wild · Sea**

- Active: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]` (tint-pair, pill) — matches ExploreScreen CategoryPills
- Inactive: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]` (card bg, pill)
- Min touch height: 44px
- `overflow-x: auto; scrollbar: none; gap: 8px; padding: 0 24px`

---

## Sort row

`[N animals — t3, 13px]` left, `[Sort dropdown]` right. Padding: `0 24px`.

Sort options: **Newest** (default) / **Name A–Z** / **Rarity**

---

## Pet card

2-col grid, gap 12px, padding 0 24px.

```
┌──────────────────────┐
│   [1:1 image]        │  object-cover, r-lg top corners
├──────────────────────┤
│ Storm        Uncommon│  name (15px/600, t1) + RarityBadge (right)
│ Husky · At Home      │  breed · category (13px/400, t3)
└──────────────────────┘
```

- Background: `--card`, border `1px solid --border-s`, radius `16px`
- Card body padding: `12px`
- Hover: `translateY(-2px)` + card shadow + `border-color: --border`
- Active/tap: `scale(0.97)`
- For-sale: amber "For Sale" badge top-left of image (absolute positioned)

---

## Empty states

**No pets adopted (global empty):**
```
  🐾
  No animals yet
  Start by generating your first animal
  [Generate]  ← btn-md primary, → /generate
```

**Filter returns nothing:**
```
  🐾
  No animals in [Category]
  Try a different filter
  [Clear filter]  ← btn-md outline, resets to 'All'
```

Icon: Lucide `PawPrint`, 48px, `--t4`. Title: `22px/600, --t1`. Desc: `15px/400, --t3`.

---

## Pet detail bottom sheet

Max height 85vh. Opens on card tap.

```
┌──────────────────────────────────────────┐
│  ▬                                [✕]   │
│  [4:3 hero image, r-lg]                 │
│                                          │
│  Storm                    [Uncommon]    │  H4 + RarityBadge
│  [At Home]                              │  category badge (blue tinted)
│                                          │
│  ┌───────────┬───────────┐             │
│  │ BREED     │ GENDER    │             │  2×2 stat grid
│  │ Husky     │ Male      │             │  bg: --elev, r-md, padding 12px 16px
│  ├───────────┼───────────┤             │  label: 11px/700 uppercase t3
│  │ AGE       │ PERSONALITY│            │  value: 15px/600 t1
│  │ Young     │ Brave     │             │
│  └───────────┴───────────┘             │
│                                          │
│  ● Black                                │  colour chip (16px circle) + label
│                                          │
│  "Found wandering..."                   │  italic, 13px/400, t2
│                                          │
│  [Rename]          [Release]            │  ghost + flat-red, flex row
└──────────────────────────────────────────┘
```

Category badge colours:
| Category | Variant |
|----------|---------|
| At Home | blue |
| Stables | amber |
| Farm | green |
| Lost World | purple |
| Wild | green |
| Sea | blue |

---

## Rename flow (inline, no modal)

Tapping "Rename" transforms the H4 name into an input:

```
Before: Storm                    [Uncommon]
After:  ┌──────────────────────────────┐
        │ Storm (pre-filled, focused)  │
        └──────────────────────────────┘
        [Cancel]  [Save]
```

- Input: `height 44px; padding 0 16px; bg --card; border 1.5px solid --blue; r-md; font 22px/600`
- Focus ring: `box-shadow: 0 0 0 3px var(--blue-sub)`
- Empty name: red border + red shadow — no submit
- Save: calls `renamePet()`, loading spinner on Save button; on success stays open with new name
- Error: toast + field reverts to `currentName`

---

## Release confirmation sheet

Stacked above detail sheet.

```
┌──────────────────────────────────────────┐
│  ▬                                       │
│  Release Storm?               22px/600   │
│                                          │
│  This cannot be undone.                  │
│  Storm will leave your collection        │
│  permanently.                            │
│                                          │
│  [          Cancel          ]  ghost     │
│  [          Release         ]  --red solid
└──────────────────────────────────────────┘
```

- Cancel: dismisses confirm sheet, pet unaffected
- Release (solid `--red` bg, white text): calls `releasePet()`, loading state, then closes both sheets
- After release: stay on `/animals`, grid updates live via `useLiveQuery`
- Error: toast, keep confirm sheet open

---

## Animations

All respect `useReducedMotion`. Reduced motion → all transitions instant.

| Interaction | Animation |
|-------------|-----------|
| Sheet open | Framer Motion spring `{ stiffness: 300, damping: 30 }`, `y: "100%" → 0` |
| Sheet close | Reverse |
| Card hover | `translateY(-2px)`, 300ms |
| Card tap | `scale(0.97)`, 150ms |
| Rename reveal | 150ms fade |
