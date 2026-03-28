# Refined User Stories — Animal Detail Modal v3
**Role:** Product Owner
**Feature:** animal-detail-modal-v3
**Date:** 2026-03-28
**Input:** ur-findings.md, interaction-spec.md, data-model-additions.md
**Owner approval required before Phase C begins**

---

## Feature brief

Redesign the scrollable content inside the existing AnimalDetailModal to deliver a Wikipedia-level encyclopaedia entry experience for children aged 7–12. The modal shell is not changing. The content inside is being rebuilt.

Primary driver: children spend under 30 seconds on the current modal. The redesign targets 90+ seconds through richer content, visual variety, and a structured emotional arc (impress → fascinate → care → connect → act).

---

## Prioritisation rationale

Priority order per CLAUDE.md process rules:
1. User need (from ur-findings.md)
2. Compliance / risk (educational accuracy, accessibility)
3. Business value (re-engagement, adoption conversion)
4. Technical hygiene (backward compatibility of data model)

---

## Stories

---

### Story 1 — Infobox: physical stats at a glance

```
As a child aged 7–12 exploring an animal's detail page,
I need to immediately see how big, fast, and heavy the animal is
with comparisons to things I already know (a car, a human, a family dog),
So that I can instantly understand the animal's scale and feel impressed.

Acceptance criteria:
- [ ] An infobox card renders immediately below the identity row on all animal detail pages
- [ ] The infobox contains stat cells for: habitat, diet, lifespan, and any non-null fields
      from: physicalSize, physicalWeight, topSpeed, region
- [ ] Each stat cell shows: an icon (Lucide, 14px), a hairline label, a value (22px/600), and
      an optional comparison/detail row (11px/400) — all per interaction-spec §3.4.1
- [ ] Scale comparison text renders in var(--t3) below the primary value when present
- [ ] Stat cells are in a grid-cols-2 inner grid; last cell spans 2 cols if total is odd
- [ ] On screens ≥768px: infobox uses a two-column outer grid (stats left, taxonomy right)
- [ ] On screens <768px: infobox is single column (stats above, taxonomy below)
- [ ] Taxonomy column/section is absent if both taxonomy and scientificName are null
- [ ] All 4500+ animals that lack new fields render without error — infobox shows existing
      habitat/diet/lifespan stat cells only
- [ ] No stat cell renders with empty value — if field is null, the cell is absent

Out of scope:
- Tap-to-expand on stat cells
- Animated value counters
- Unit conversion (metric/imperial toggle)
```

---

### Story 2 — Scientific taxonomy display

```
As a child aged 10–12 who wants to feel like a real scientist,
I need to see the animal's scientific classification (kingdom → species) and its
binomial name displayed in the encyclopaedia style I've seen in books,
So that I can learn and share the "grown-up" name for the animal.

Acceptance criteria:
- [ ] Taxonomy table renders in the infobox right column (iPad) or below stats (phone)
      when taxonomy and/or scientificName is non-null
- [ ] Table is a <dl> with <dt>/<dd> pairs styled per interaction-spec §3.4.2
- [ ] Only rows with data are rendered (no blank rows for absent fields)
- [ ] Maximum 6 taxonomy rows rendered in order: Kingdom, Class, Order, Family, Genus, Species
- [ ] Species epithet is displayed in italic (not the full binomial — that is in scientificName)
- [ ] scientificName renders below the table as "SCIENTIFIC NAME" label + italic value (15px/500)
      when non-null
- [ ] If both taxonomy and scientificName are null, the taxonomy column/section is entirely absent
- [ ] The <dl> uses correct semantic markup: <dt> for label, <dd> for value
- [ ] Row labels are var(--t3), values are var(--t1), font sizes per spec

Out of scope:
- Links to Wikipedia or external taxonomy databases
- Taxonomic tree visualisation
- Subspecies listing
```

---

### Story 3 — Photo gallery

```
As a child using the detail page,
I need to see 2–4 additional photos of the animal beyond the hero image,
So that I can explore the animal visually and stay engaged longer.

Acceptance criteria:
- [ ] Gallery section renders when gallery field has at least one entry
- [ ] Gallery section is absent entirely (no heading, no blank space) when gallery is null or empty
- [ ] On phone (<768px): gallery renders as a horizontal scroll row with scroll-snap
      — item width calc(80vw), partial next item visible as affordance, gap 8px
- [ ] On iPad (≥768px): gallery renders as grid-cols-3 with gap 8px
- [ ] Each image: aspect-ratio 4/3, border-radius var(--r-md), object-fit cover
- [ ] Each image has a non-empty alt attribute (from gallery[n].alt)
- [ ] Loading state: var(--elev) background visible while image loads
- [ ] Error state: paw-print fallback (matches AnimalImage component pattern)
- [ ] Horizontal scroll container has scrollbar hidden (scrollbar-width: none)
- [ ] Gallery container has role="list"; each image wrapper has role="listitem"
- [ ] No tap-to-fullscreen interaction in this version

Out of scope:
- Fullscreen lightbox
- Image captions visible on screen (alt text is for screen readers only)
- Video content
```

---

### Story 4 — Amazing Adaptations section

```
As a child reading about an animal,
I need to discover 2–4 surprising facts about the animal's unique body features
or biological capabilities (beyond the single-sentence superpower),
So that I get the "wow" moments that make me want to tell someone else.

Acceptance criteria:
- [ ] "Amazing Adaptations" section renders when adaptations is a non-empty array
- [ ] Section is absent entirely when adaptations is null or empty
- [ ] Each adaptation renders as a row: purple-tinted icon circle (Sparkles, 12px) + text
- [ ] Icon circle: 24px, background var(--purple-sub), border-radius 50%, icon var(--purple-t)
- [ ] Text: 14px / 400 / var(--t2), line-height 1.6
- [ ] Rows separated by border-bottom: 1px solid var(--border-s), except last row
- [ ] Maximum 4 adaptation items rendered
- [ ] Section label: "AMAZING ADAPTATIONS" in hairline style (11px/700/uppercase/1.5px/var(--t3))
- [ ] No toggle or "show more" — all items visible

Out of scope:
- Linking adaptations to external educational sources
- Animation on the icon circles
```

---

### Story 5 — Reproduction section

```
As a child aged 7–10 who is curious about baby animals,
I need to quickly find out how many babies the animal has, what they're called,
and how long it takes for them to be born,
So that I get the "aww" and curiosity moments that make the animal feel real to me.

Acceptance criteria:
- [ ] "Babies and Reproduction" section renders when reproduction is non-null
- [ ] Section is absent entirely when reproduction is null
- [ ] Section renders a card (var(--elev), border, var(--r-lg), 16px padding)
      containing a tile grid of up to 4 stat tiles
- [ ] Tiles rendered for present fields only (gestationPeriod, litterSize, offspringName, ageAtIndependence)
      with icons: Calendar, Baby, Heart, Star respectively
- [ ] On iPad (≥768px): grid-cols-4 (all tiles in one row)
- [ ] On phone (<768px): grid-cols-2
- [ ] If total tiles is odd, the last tile spans 2 columns
- [ ] offspringName value is capitalised (e.g. "Kitten" not "kitten")
- [ ] parentalCare renders as a full-width text block below the tile grid when present
      (var(--card), border, var(--r-md), 12px padding, 14px/400/var(--t2))
- [ ] Tile anatomy: label row (icon + 11px/700/uppercase/var(--t3)) + value row (15px/600/var(--t1))

Out of scope:
- Lifecycle diagram or animated progression
- Comparison to human gestation
```

---

### Story 6 — Predators section

```
As a child who wants to understand whether an animal is a hunter or hunted,
I need to see what animals prey on this species,
So that I understand where the animal fits in the food chain and feel the drama of survival.

Acceptance criteria:
- [ ] "Predators" section renders when predators field is non-null
- [ ] Section is absent when predators is null
- [ ] When predators is an empty array []: renders a full-width amber tile with Shield icon
      stating "Apex predator — nothing hunts this animal in the wild."
      (amber tint pair: var(--amber-sub) bg, var(--amber-t) text, shield icon 20px)
- [ ] When predators is a non-empty array: renders a flex-wrap row of red-tinted pills
      (var(--red-sub) bg, rgba(239,70,111,.3) border, var(--red-t) text, 13px/500, pill radius)
- [ ] Pills are not interactive
- [ ] Predator pill list has role="list" and aria-label="Predators"
- [ ] Section label: "PREDATORS" in hairline style

Out of scope:
- Linking predator names to other animal detail pages
- Predator images
```

---

### Story 7 — Geographic range section

```
As a child who wants to know if they could ever see this animal in real life,
I need a richer description of where in the world the animal is found
than just a country or region name,
So that I can picture where the animal lives and feel personally connected to it.

Acceptance criteria:
- [ ] "Where It Lives" section renders when geographicRange is non-null
- [ ] Section is absent when geographicRange is null
- [ ] Section renders a card (var(--elev), border, var(--r-lg), 16px padding)
- [ ] Top of card: Globe icon (16px, var(--blue-t)) + "Region:" label (13px/600/var(--t3))
      + region value inline (13px/500/var(--t1))
- [ ] Divider: border-top 1px solid var(--border-s), margin-top 10px
- [ ] geographicRange text: 14px/400/var(--t2), line-height 1.6, margin-top 10px
- [ ] No map image in this version

Out of scope:
- Interactive map
- "Animals in your country" filtering
```

---

### Story 8 — Cultural significance section

```
As a child aged 10–12 who is interested in history and stories,
I need to know if this animal has a special place in human culture, history, or mythology,
So that I have an interesting story to tell about the animal beyond its biology.

Acceptance criteria:
- [ ] "Did You Know?" section renders when culturalSignificance is non-null
- [ ] Section is absent when culturalSignificance is null
- [ ] Section renders a card with: var(--card) bg, 1px solid var(--border-s) border,
      3px solid var(--purple) left border, var(--r-lg) radius,
      padding 16px 16px 16px 20px
- [ ] Text: 15px/400/var(--t2), line-height 1.7
- [ ] Section label: "DID YOU KNOW?" in hairline style

Out of scope:
- Multiple separate cultural facts items (this is a single prose block, max 80 words)
- Links to historical references
```

---

### Story 9 — Identity row: rarity badge and scientific name

```
As a child browsing animal detail pages,
I need to see the animal's rarity tier and scientific name in the identity row
immediately below the hero image,
So that I know at a glance how rare the animal is and feel the encyclopaedia quality of the page.

Acceptance criteria:
- [ ] Identity row renders below hero image with mt-4 gap
- [ ] Rarity badge renders using correct rarity tint-pair per interaction-spec §3.2
      (common: neutral, uncommon: green, rare: blue, epic: purple, legendary: amber)
- [ ] Rarity badge uses tint-pair (sub bg + text colour), never solid colour + white text
- [ ] Category badge renders as existing neutral tint pill (var(--elev) bg, var(--t3) text)
- [ ] Region indicator: MapPin 12px + 13px/400/var(--t3) text — unchanged from current
- [ ] Scientific name (if non-null): 13px/400/italic/var(--t3), preceded by "•" separator in var(--t4)
- [ ] All elements are non-interactive (no tap targets)
- [ ] Row uses flex flex-wrap with gap 8px

Out of scope:
- Tapping rarity badge to open a rarity explanation
- Animated shimmer on legendary badge (this is a v4 enhancement)
```

---

### Story 10 — Data model: TypeScript interface additions

```
As a developer implementing animal-detail-modal-v3,
I need the AnimalEntry interface to include all new fields before I begin building,
So that I can build to the spec without runtime type errors or interface changes mid-build.

Acceptance criteria:
- [ ] All new fields from data-model-additions.md are added to the AnimalEntry interface
      in src/data/animals.ts
- [ ] All new fields are optional (field?: type | null) — no existing animal breaks
- [ ] TypeScript strict mode passes with zero errors after the interface change
- [ ] No runtime behavior changes — the UI reads these as absent if undefined or null
- [ ] At least one hand-crafted animal entry (e.g. Beagle or Arabian Horse) is populated
      with sample values for all new fields as an authoring reference

Out of scope:
- Populating all 4500+ catalog animals with new fields
- Auto-generating taxonomy or scientific names via AI without verification
```

---

## Definition of Done checklist location

`spec/features/animal-detail-modal-v3/done-check.md` — to be created before Phase C begins.

---

## Scope boundaries — explicit out of scope for this feature

- Audio/sound playback (animal calls, sounds)
- Interactive map for geographic range
- Tap-to-fullscreen gallery lightbox
- Animated stat counters or number roll-up effects
- "Compare with" links to other animals
- Animated shimmer on legendary rarity badge
- Auto-generating enrichment data for the full 4500-animal catalog
- External database links (Wikipedia, IUCN)
- Print/share functionality

---

## Dependencies and risks

| Item | Risk | Mitigation |
|---|---|---|
| Scientific name accuracy | High — educational content error | Data authors must cross-check ITIS / IUCN. Do not use AI-generated names |
| Gallery image availability | Medium — /public/Animals/ may not have additional images per animal | PO to confirm with owner before Phase C |
| `Baby` Lucide icon | Low — confirm icon exists in project's lucide-react version | FE to verify on first use |
| Taxonomy `<dl>` accessibility | Low — non-standard styling | Tester to verify with screen reader in Phase D |
| iPad two-column infobox performance | Low | FE to confirm 60fps during scroll on mid-range iPad |
