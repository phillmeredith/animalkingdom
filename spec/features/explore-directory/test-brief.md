# Test Brief: Explore / Directory

---

## Test scenarios

### T1 — Category filter

**Given** ExploreScreen is mounted
**When** user taps "Wild" category pill
**Then**
- Grid shows only animals with category === "Wild"
- Active pill shows blue-sub background, blue border, blue-t text
- Animal count matches filtered list length

**When** user taps "Wild" again (active pill)
**Then** filter resets to "All" — all animals visible

---

### T2 — Search

**Given** ExploreScreen with full list visible
**When** user types "tiger"
**Then**
- Within 200ms, grid shows only animals matching "tiger" in name/breed/animalType
- Results work in combination with active category filter

**When** search string is cleared
**Then** full list (or category-filtered list) is restored

**When** search returns 0 results
**Then** EmptyState renders with "No animals found" message

---

### T3 — Virtualisation

**Given** full ANIMALS dataset (4,600+ entries)
**When** ExploreScreen renders
**Then**
- DOM contains fewer than 30 card elements (virtualiser working)
- Scrolling to bottom renders new rows
- Scrolling back to top re-renders original rows

---

### T4 — A-Z rail

**Given** ExploreScreen with animals sorted A-Z
**When** user taps "T" on the AZ rail
**Then** virtual list scrolls to first animal whose name starts with "T"

**When** user scrubs from "A" to "Z" on the rail
**Then** list scrolls continuously through the alphabet

---

### T5 — Animal profile sheet

**Given** ExploreScreen showing animal grid
**When** user taps an AnimalCard
**Then**
- AnimalProfileSheet animates up from bottom
- Sheet contains: image, rarity badge, category badge, name, habitat, diet, lifespan, 3 facts, "Generate" button
- AnimalImage fallback shows if imageUrl is invalid

**When** user drags sheet down
**Then** sheet dismisses and grid is visible again

---

### T6 — Stealth quiz appears

**Given** AnimalProfileSheet is open
**When** 8 seconds pass AND the 50% probability check passes
**Then** StealthQuiz appears below facts section

**When** StealthQuiz appears AND user dismisses with X
**Then** quiz closes instantly, no coins awarded, no XP change

---

### T7 — Stealth quiz correct answer

**Given** StealthQuiz is visible
**When** user taps the correct option
**Then**
- Selected option: green background/border
- Other options: no change (except correct if different — shows green)
- Coin animation: "+5 🪙" visible
- Quiz auto-dismisses after 1.5s
- useWallet.earn called with (5, 'Explore quiz', 'arcade')
- useProgress.recordAnswer called with (area, questionId, 1, true)
- useProgress.addXp called with (area, 5)

---

### T8 — Stealth quiz wrong answer

**Given** StealthQuiz is visible
**When** user taps an incorrect option
**Then**
- Selected option: red background/border
- Correct option: green background/border
- No coin animation
- useWallet.earn called with (1, 'Explore quiz effort', 'arcade')
- useProgress.recordAnswer called with (area, questionId, 1, false)
- Quiz auto-dismisses after 2s

---

### T9 — Quiz session deduplication

**Given** user has already seen quiz for animal X in this session
**When** user opens animal X's profile again
**Then** the 8s timer fires but quiz does NOT appear (questionId already in shownQuizIds)

---

### T10 — Navigate to Generate

**Given** AnimalProfileSheet is open for a Bengal Tiger
**When** user taps "Generate this animal"
**Then**
- Sheet closes
- App navigates to `/generate?type=Tiger&breed=Bengal`

---

### T11 — Reduced motion

**Given** prefers-reduced-motion is active
**When** ExploreScreen loads, user opens a profile, stealth quiz appears
**Then**
- No list item animations
- Sheet appears/dismisses instantly
- Quiz appears instantly
- Option flash still shows (color change, no animation needed)

---

## Visual audit checklist

- [ ] Category pills: inactive = card bg / border-s / t2; active = blue-sub / blue / blue-t
- [ ] Animal card: card bg, border-s, r-lg, no shadow at rest
- [ ] Rarity dots: correct colours per tier
- [ ] Profile sheet: r-xl top corners, max-h 85vh, scrollable
- [ ] Stat grid cells: elev bg, r-md
- [ ] Facts: hairline label + body-sm t2 text
- [ ] Generate button: pink (accent), pill, full width, lg size
- [ ] StealthQuiz: elev bg, correct/wrong flash colours match tint system
- [ ] SearchBar: elev bg, r-md, focus ring blue-sub
- [ ] A-Z rail: t3 hairline labels, right edge, no background
