# FE Brief: Explore / Directory

---

## Component specs

### SearchBar (shared UI component)

```
Props: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }

Anatomy:
  wrapper: relative flex items-center
  input: w-full h-11 pl-10 pr-10 bg-[--elev] border border-[--border-s]
         rounded-[--r-md] text-body text-[--t1] placeholder:text-[--t3]
         focus:border-[--blue] focus:outline-none focus:ring-2 focus:ring-[--blue-sub]
  search icon: absolute left-3, Search from lucide, 16px, color t3
  clear button: absolute right-3, X from lucide, 16px, color t3 — only shown when value !== ''

Behaviour: controlled input, clear button calls onChange('')
```

### CategoryPills

```
Props: { active: string; onSelect: (cat: string) => void }

Categories: ['All', 'At Home', 'Stables', 'Farm', 'Lost World', 'Wild', 'Sea']

Anatomy:
  container: flex gap-2 overflow-x-auto pb-1 scrollbar-hide
  pill: px-4 h-9 rounded-[--r-pill] text-body-sm font-600
    inactive: bg-[--card] border border-[--border-s] text-[--t2]
    active: bg-[--blue-sub] border border-[--blue] text-[--blue-t]

Behaviour: horizontal scroll, no visible scrollbar
Transition: fast (150ms) color/border change
```

### AnimalCard

```
Props: { animal: AnimalEntry; onTap: () => void }

Anatomy:
  card: bg-[--card] border border-[--border-s] rounded-[--r-lg] overflow-hidden
        active:scale-[0.97] transition-transform duration-150
  image region: w-full aspect-square bg-[--elev]
    AnimalImage: src={animal.imageUrl} alt={animal.name} fallback=paw
  body: p-3
    rarity dot: w-2 h-2 rounded-full inline-block mr-1, colour from rarity
    name: text-[13px] font-600 text-[--t1] line-clamp-2
    sub: text-[11px] text-[--t3] "{animal.animalType} · {animal.category}"

No shadow at rest. No hover lift (touch device).
```

Rarity dot colours (solid):
- common: `#777E91`
- uncommon: `#45B26B`
- rare: `#3772FF`
- epic: `#9757D7`
- legendary: `#F5A623`

### VirtualAnimalGrid

```
Props: {
  animals: AnimalEntry[]
  onSelectAnimal: (animal: AnimalEntry) => void
  virtualizerRef?: React.Ref<VirtualizerInstance>
}

Anatomy:
  scroll-root: ref={parentRef} overflow-y-auto flex-1
  virtual-container: height = totalSize + 'px', relative
  virtual-row: absolute top, width 100%, flex gap-3 px-4
    each row renders animals[rowIndex * 2] and animals[rowIndex * 2 + 1]
    if second animal undefined: render empty div (preserve grid)

Empty state: if animals.length === 0, render EmptyState centered
```

### AZRail

```
Props: { letters: string[]; onLetterPress: (letter: string) => void }

Anatomy:
  container: fixed right 0, top of grid area, bottom of nav
             w-7 flex flex-col items-center justify-evenly py-4
             bg-transparent touch-action-none
  letter: text-[--t3] text-[10px] font-700 uppercase leading-none
          py-0.5 px-1 active:text-[--blue]

Behaviour:
  - Touch: continuous scrubbing — use onPointerMove + onPointerDown, not onClick
  - Calculate letter from Y position on pointer move
  - Call onLetterPress(letter) when letter changes during scrub
  - No visual selected state needed (the list scrolls as feedback)
```

### AnimalProfileSheet

```
Props: { animal: AnimalEntry; onClose: () => void }

Wraps: BottomSheet (existing shared component)

Content layout:
  image: w-full aspect-[4/3] object-cover
  badges row: mt-4 flex gap-2
    RarityBadge: uses tint pair
    Badge (outline): category name, t3 colour
  name: mt-2 text-[22px] font-600 text-[--t1]
  stat grid: mt-4 grid grid-cols-3 gap-3
    each cell: bg-[--elev] rounded-[--r-md] p-3 text-center
      label: hairline, t3
      value: body-sm font-600, t1
    cells: Habitat | Diet | Lifespan (+ Region as 4th below if space)
  facts section: mt-6
    label: FACTS (hairline)
    list: mt-2 flex flex-col gap-2
      each fact: flex gap-2, bullet dot (blue 6px circle), body-sm t2
  generate button: mt-8 mb-safe w-full Button variant=accent size=lg
    text: "Generate this animal"

StealthQuiz:
  Rendered below facts, above button, AnimatePresence wrapped
```

### StealthQuiz

```
Props: {
  quiz: AnimalQuiz
  onComplete: (correct: boolean) => void
  onDismiss: () => void
}

Anatomy:
  container: bg-[--elev] border border-[--border-s] rounded-[--r-lg] p-4 mt-4
  header: flex justify-between items-center
    title: "Quick quiz! 🪙" body-sm font-600 t1
    dismiss: X button 32px circle bg-[--card]
  question: mt-3 body t2
  options grid: mt-3 grid grid-cols-2 gap-2
    option btn: bg-[--card] border border-[--border-s] rounded-[--r-md]
                p-3 text-[13px] font-500 t2 text-left
    after tap:
      correct selected: bg-[--green-sub] border-[--green] text-[--green-t]
      wrong selected: bg-[--red-sub] border-[--red] text-[--red-t]
      correct (not selected): bg-[--green-sub] border-[--green] text-[--green-t]

Framer Motion: slide up from bottom (y: 20 → 0, opacity 0 → 1, duration 300ms)
Reduced motion: instant appear
```

---

## Animation spec

| Animation | Normal | Reduced motion |
|-----------|--------|----------------|
| Category pill active change | 150ms color transition | instant |
| AnimalCard press | scale(0.97) 150ms | no scale |
| Profile sheet open | spring stiffness 300 damping 30 | instant |
| Profile sheet close | 200ms ease-out | instant |
| StealthQuiz appear | y:20→0 opacity 300ms | instant |
| Quiz option flash | 200ms color transition | instant |
| Correct answer coin burst | `+5 🪙` float up, 800ms | skip animation |

---

## Performance targets

| Metric | Target |
|--------|--------|
| Initial render (data loaded) | < 16ms (single frame) |
| Search filter (4,600 items) | < 50ms (useDeferredValue) |
| Scroll FPS | 60fps — virtualiser never renders > 20 DOM nodes |
| Profile sheet open | < 100ms to first paint |
| Bundle impact | < 5KB gzipped (components only; animal data is separate chunk) |

Animal data file: use dynamic import or keep as static module (Vite will bundle it). With ~4,600 entries at ~200 bytes each ≈ 920KB raw ≈ ~150KB gzipped. Import statically — it's always needed.

---

## Design tokens quick reference

All values from `DESIGN_SYSTEM.md`. Do not invent.

```
Page bg: var(--bg) = #0D0D11
Card: var(--card) = #18181D
Elevated: var(--elev) = #23262F
Border subtle: var(--border-s) = #2C2F3A
Border: var(--border) = #353945
Blue: var(--blue) = #3772FF
Blue sub: var(--blue-sub) = rgba(55,114,255,.12)
Blue text: var(--blue-t) = #6E9BFF
Pink: var(--pink) = #E8247C
t1: #FCFCFD  t2: #B1B5C4  t3: #777E91
r-md: 12px  r-lg: 16px  r-pill: 100px
```
