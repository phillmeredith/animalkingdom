# UX Brief: Explore / Directory

---

## Screen inventory

| Screen / Layer | Route / Trigger | Type |
|----------------|-----------------|------|
| ExploreScreen | `/explore` | Full page |
| AnimalProfileSheet | Tap any animal card | BottomSheet overlay |
| StealthQuiz | 8s after profile opens (50% chance) | Inline overlay within sheet |

---

## ExploreScreen layout

```
┌─────────────────────────────────────┐
│  PageHeader: "Explore"              │  px-6, pt-6
├─────────────────────────────────────┤
│  SearchBar                          │  px-6, mb-4, 44px height
├─────────────────────────────────────┤
│  CategoryPills (horizontal scroll)  │  px-6, mb-4, no scrollbar
│  [All] [At Home] [Stables] [Farm]   │
│  [Lost World] [Wild] [Sea]          │
├─────────────────────────────────────┤
│                         │           │
│   2-column animal grid  │  A-Z rail │  flex row
│   (virtualized)         │  (right)  │
│                         │           │
│                         │           │
│                         │           │
└─────────────────────────────────────┘
│  BottomNav (fixed, 80px)            │
```

**Grid**: 2 columns, 12px gap, px-4 (to leave 8px for AZ rail)
**A-Z rail**: fixed right 28px wide, full height of grid area, letters A→Z in hairline type
**AZ rail scroll**: tapping a letter scrolls the virtual list to first animal starting with that letter

---

## Animal card

```
┌──────────────┐
│  [image]     │  aspect-square (1:1), r-lg top corners
│              │  AnimalImage with paw fallback
├──────────────┤
│ [rarity dot] │  4px dot, rarity colour
│ Bengal Tiger │  body-sm font-weight 600, t1, 2-line clamp
│ Tiger · Wild │  caption, t3
└──────────────┘
```

Card: `bg-card, border-border-s, r-lg, p-3`
Tap → opens AnimalProfileSheet
No hover state on iPad (touch device) — but active state: slight scale(0.97) press

---

## AnimalProfileSheet layout

```
┌─────────────────────────────────────┐
│  drag handle                        │  top of sheet
│                                     │
│  [large image]                      │  w-full aspect-[4/3], object-cover
│                                     │
│  [rarity badge]  [category badge]   │  tinted badges, mt-4
│  Bengal Tiger                       │  H4 font, t1
│                                     │
│  ┌────────┬────────┬────────┐       │  3-col stat grid
│  │Habitat │ Diet   │ Life   │       │
│  │Forest  │Carniv. │10-15yr │       │
│  └────────┴────────┴────────┘       │
│                                     │
│  FACTS                              │  hairline label
│  • Fact 1                           │  body-sm t2, bullet list
│  • Fact 2                           │
│  • Fact 3                           │
│                                     │
│  [pink btn: Generate this animal]   │  full-width, lg, mb-safe
└─────────────────────────────────────┘
```

BottomSheet: `bg-card, r-xl (top corners only), max-h: 85vh, overflow-y-auto`
Drag-to-dismiss enabled (Framer Motion drag on y axis)

---

## StealthQuiz overlay

Appears inside the AnimalProfileSheet, not replacing it. Slides up from bottom of sheet.

```
┌─────────────────────────────────────┐
│  [X dismiss]            🪙 +5 coins │  right-aligned dismiss
│                                     │
│  Quick quiz!                        │  H4, t1
│  [question text]                    │  body, t2
│                                     │
│  [Option A]  [Option B]             │  2×2 grid of pill buttons
│  [Option C]  [Option D]             │  outline variant → green/red flash
└─────────────────────────────────────┘
```

- Appears after 8s (setTimeout, cleared on unmount / dismiss)
- 50% probability check on mount of AnimalProfileSheet
- Correct: options flash green → "+5 🪙" animation → auto-dismiss after 1.5s
- Wrong: options flash red on wrong, green on correct → shows correct answer → auto-dismiss 2s
- Dismiss (X): immediate close, no penalty

---

## States

| State | Trigger | UI |
|-------|---------|---|
| Loading | First mount before data ready | Skeleton: 6 card placeholders (2 cols × 3 rows) |
| Empty search | Search returns 0 results | EmptyState: "No animals found" + clear search button |
| Empty category | Category has 0 animals | Should not happen with full dataset; show EmptyState as fallback |
| Profile open | Tap card | AnimalProfileSheet slides up |
| Quiz pending | Timer fires, 50% hit | StealthQuiz slides up inside sheet |
| Quiz answered | Any option tapped | Flash + auto-dismiss |

---

## Interaction spec

- **Search**: debounced 150ms, filters across name + breed + animalType
- **Category pill**: tap to filter; tap active pill again → back to "All"; only one category active at once
- **A-Z rail**: tap letter → `scrollToIndex()` on the virtual list instance; haptic feedback if available
- **Profile dismiss**: drag down OR tap backdrop
- **Generate CTA**: `navigate('/generate?type={animalType}&breed={breed}')` — pre-fills wizard step 2 (the Generate Wizard reads query params on mount)
- **Reduced motion**: remove all list item enter animations; quiz appears instantly; sheet appears instantly

---

## Component breakdown

| Component | Type | Reuse |
|-----------|------|-------|
| ExploreScreen | Screen | New |
| SearchBar | UI | New (shared — add to ui/index) |
| CategoryPills | Explore-local | New |
| VirtualAnimalGrid | Explore-local | New (uses @tanstack/react-virtual) |
| AnimalCard | Explore-local | New |
| AZRail | Explore-local | New |
| AnimalProfileSheet | Explore-local | New (wraps BottomSheet) |
| StealthQuiz | Explore-local | New |
