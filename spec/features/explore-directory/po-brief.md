# PO Brief: Explore / Directory

---

## User stories

### Story 1 — Browse the directory
**As Harry, I want to browse all animals by category so I can discover animals I haven't seen before.**

Acceptance criteria:
- [ ] ExploreScreen shows all animals in a 2-column grid by default
- [ ] Category pills (All + 6 categories) filter the grid instantly
- [ ] Tapping the active category pill resets to "All"
- [ ] The animal count shown is correct for the active filter
- [ ] Scrolling is smooth at 60fps with 4,600+ entries (virtualisation required)

### Story 2 — Find a specific animal
**As Harry, I want to search for an animal by name so I can go straight to the one I'm thinking of.**

Acceptance criteria:
- [ ] SearchBar filters name, breed, and animalType fields
- [ ] Results update within 150ms of typing (debounced)
- [ ] Search works in combination with category filter
- [ ] Empty state shows "No animals found" with a clear search button
- [ ] Clearing search restores full list

### Story 3 — View animal facts
**As Harry, I want to tap an animal and see its facts, habitat, and diet so I can learn about it.**

Acceptance criteria:
- [ ] Tapping any card opens AnimalProfileSheet
- [ ] Sheet shows: large image, rarity badge, category badge, name, habitat, diet, lifespan, region, 3 facts
- [ ] Sheet is dismissible by drag down or backdrop tap
- [ ] AnimalImage paw-print fallback shows if image 404s

### Story 4 — Navigate to generate
**As Harry, I want to tap "Generate this animal" from the profile so I can start generating that animal directly.**

Acceptance criteria:
- [ ] Pink "Generate this animal" button is visible at the bottom of every profile sheet
- [ ] Tapping it closes the sheet and navigates to `/generate?type={animalType}&breed={breed}`
- [ ] Note: the Generate Wizard reading those query params is the Generate Wizard's responsibility, not Explore's

### Story 5 — Stealth quiz
**As Harry (and for educational value), a fun quiz question appears sometimes when I'm reading about an animal.**

Acceptance criteria:
- [ ] Quiz appears ~50% of the time, after 8 seconds on a profile
- [ ] Quiz does not appear if profile is dismissed before 8s
- [ ] Quiz question relates to the animal being viewed (from its quiz field)
- [ ] 4 answer options shown in a 2×2 grid
- [ ] Correct: green flash + coin animation + +5 coins awarded
- [ ] Wrong: red flash on selected, green on correct, 1 coin effort reward, no penalty
- [ ] Dismiss (X): instant close, no penalty, no coins
- [ ] Quiz never appears twice for the same question in the same session

---

## Out of scope for this build

- Favourite / bookmark animals (Tier 3+)
- Animal comparison from Explore (Compare Screen is Tier 3)
- Sharing an animal profile (no social features in scope)
- Offline image caching (images served from CDN, fallback handles missing)
- Full 4,600+ dataset (build with representative sample, dataset expanded separately)
