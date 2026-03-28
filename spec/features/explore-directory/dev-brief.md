# Dev Brief: Explore / Directory

---

## File map

```
src/
  data/
    animals.ts              NEW — static animal catalogue (AnimalEntry[])
  screens/
    ExploreScreen.tsx       NEW
  components/
    ui/
      SearchBar.tsx         NEW — shared, add to ui/index.ts
    explore/
      CategoryPills.tsx     NEW
      VirtualAnimalGrid.tsx NEW — uses @tanstack/react-virtual
      AnimalCard.tsx        NEW
      AZRail.tsx            NEW
      AnimalProfileSheet.tsx NEW — wraps BottomSheet
      StealthQuiz.tsx       NEW
```

---

## Data layer

`src/data/animals.ts` is pure static data — no DB, no hooks. Import it once at module level.

```typescript
export const ANIMALS: AnimalEntry[] = [ ... ]

// Derived lookups, computed once at import time
export const ANIMALS_BY_CATEGORY = groupBy(ANIMALS, a => a.category)
export const ALL_CATEGORIES: AnimalCategory[] = ['At Home','Stables','Farm','Lost World','Wild','Sea']

// For A-Z rail: map of letter → index in sorted array
export function buildAZIndex(entries: AnimalEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  entries.forEach((e, i) => {
    const letter = e.name[0].toUpperCase()
    if (!map.has(letter)) map.set(letter, i)
  })
  return map
}
```

Data must be sorted A-Z by `name` at the top level. Category filter re-sorts within the filtered set.

---

## Virtualisation

Use `useVirtualizer` from `@tanstack/react-virtual`.

```typescript
// 2-column grid virtualisation pattern
const ROW_HEIGHT = 200  // card height + gap — measure empirically
const columnCount = 2

const rowVirtualizer = useVirtualizer({
  count: Math.ceil(filteredAnimals.length / columnCount),
  getScrollElement: () => parentRef.current,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
})
```

Each virtual row renders 2 AnimalCard components side-by-side.
`scrollToIndex(rowIndex)` is called from AZRail to jump to a letter.

The scroll container is the `<main>` element (the already-scrollable area from AppRouter).
Use a ref forwarded from ExploreScreen to the scrollable area.

Actually — AppRouter's `<main>` is the scroll container. Get its ref via a `useRef` passed down or use `document.querySelector('main')`. Simpler: make ExploreScreen's root `div` `overflow-y-auto h-full` and pass that ref to `useVirtualizer`.

---

## Search + filter logic

```typescript
// Pure derived computation — no state beyond query + activeCategory
const filteredAnimals = useMemo(() => {
  let list = activeCategory === 'All'
    ? ANIMALS
    : ANIMALS.filter(a => a.category === activeCategory)

  if (query.trim()) {
    const q = query.toLowerCase()
    list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.breed.toLowerCase().includes(q) ||
      a.animalType.toLowerCase().includes(q)
    )
  }
  return list
}, [activeCategory, query])

const azIndex = useMemo(
  () => buildAZIndex(filteredAnimals),
  [filteredAnimals]
)
```

Debounce: use a `useEffect` + `setTimeout(150)` or a simple `useDeferredValue` from React 18.

---

## Stealth quiz

Timer management inside `AnimalProfileSheet`:

```typescript
// On mount: roll dice and set timer
useEffect(() => {
  const shouldShowQuiz = Math.random() < 0.5
  if (!shouldShowQuiz) return

  const timer = setTimeout(() => {
    setQuizVisible(true)
  }, 8000)

  return () => clearTimeout(timer)  // cleared on unmount / early dismiss
}, [])
```

Session deduplication (don't show same question twice per session):

```typescript
// Module-level set, persists for app session
const shownQuizIds = new Set<string>()

// In AnimalProfileSheet, before showing:
if (shownQuizIds.has(animal.quiz.questionId)) return  // skip
shownQuizIds.add(animal.quiz.questionId)
```

Quiz reward flow:
- Correct: `recordAnswer(area, questionId, 1, true)` → `addXp(area, 5)` → `earn(5, 'Explore quiz', 'arcade')`
- Wrong: `recordAnswer(area, questionId, 1, false)` → `earn(1, 'Explore quiz effort', 'arcade')`
- Both: trigger brief coin animation in UI

---

## Navigation to Generate

```typescript
// In AnimalProfileSheet
const navigate = useNavigate()

function handleGenerate() {
  onClose()  // close the sheet first
  navigate(`/generate?type=${encodeURIComponent(animal.animalType)}&breed=${encodeURIComponent(animal.breed)}`)
}
```

The Generate Wizard will read these params on mount. That is Generate's responsibility.

---

## Error handling

| Scenario | Handling |
|----------|----------|
| Image 404 | AnimalImage shows paw fallback — no action needed |
| Empty filter result | EmptyState component with "No animals found" |
| ANIMALS array empty | Should not happen — it's static. Log warning if length === 0 |
| Quiz XP write fails | Silently swallow — quiz is educational bonus, not critical |
| Virtualiser scroll error | Catch and reset scroll to top |
