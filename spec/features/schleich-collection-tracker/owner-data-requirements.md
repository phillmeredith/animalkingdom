# Owner Data Requirements — Schleich Collection Tracker

**Added:** 2026-03-28
**Status:** MUST be incorporated into interaction-spec.md before Phase B. FE must not make these decisions independently.

---

## Enriched Data Fields (Owner-confirmed)

Each Schleich item will carry the following additional fields beyond the existing scrape data:

| Field | Type | Notes |
|-------|------|-------|
| `releaseYear` | `number` | Year the figurine was released |
| `discontinued` | `boolean` | Whether the item is no longer in production |
| `discontinuedYear` | `number \| null` | Year discontinued, if known; `null` if still in production or year unknown |
| `animalFacts` | `string` | Real-world facts about the animal breed or species |
| `breed` | `string \| null` | Specific breed name if applicable (e.g. "Hanoverian", "Arabian"); `null` if not breed-specific |

---

## UX Requirements — Spec Must Address All of These

### 1. Discontinued items in the grid

The spec must define exactly one of the following treatments and justify the choice:

- **Preferred:** Show discontinued items in the grid with a visible "Discontinued" badge (e.g. a small pill in the top-right corner of the card, using `--red-sub` background + `--red` border + `--red-t` text per the DS tint-pair system) AND a subtle greyed/desaturated image treatment (e.g. `filter: grayscale(40%)`). Do not use both full grayscale and the badge — one visual cue is enough; badge alone is acceptable.
- The spec must state the exact badge label, position on the card, and DS tint pair used.

### 2. Discontinued items visibility default

The spec must explicitly state:

- **Default:** Discontinued items ARE shown in the grid (not hidden), so the collection feels complete.
- A filter option exists to hide them (see §4).
- Do not default to hiding discontinued items — collectors want to see what they don't have.

### 3. Detail sheet — required fields

The detail sheet (BottomSheet or full-screen modal — spec must decide) must include all of the following. The spec must define the layout position of each:

- **Release year** — displayed as e.g. "Released 2019". Position: below the item name or in a metadata row.
- **Discontinued status** — if `discontinued: true`, display a "Discontinued" badge near the top of the sheet (same tint-pair as grid badge). If `discontinuedYear` is known, display "Discontinued 2023". If `discontinued: false`, no badge shown.
- **Animal / breed facts section** — a dedicated section headed "About this animal" (or equivalent). Renders `animalFacts` as body text. If `breed` is present, the section heading should be "About the [breed name]" instead.
- **Breed subtitle** — if `breed` is not null, display it as a subtitle directly below the item name (e.g. smaller, `--t2` colour). Do not omit this — the breed name is a key piece of information for collectors.

### 4. Filter options

The filter pill row must include a "Discontinued" filter option. Spec must define:

- **Option:** A filter pill labelled "Discontinued" that, when active, shows ONLY discontinued items.
- **Alternatively acceptable:** A toggle labelled "Hide discontinued" that removes discontinued items from the grid when on. The spec must choose one pattern and define it explicitly — FE must not decide.
- The filter must use the standard CategoryPills tint-pair active style: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]` (or the red tint pair if the spec judges it more appropriate for a "discontinued" context — spec must state which).
- The existing CategoryPills component must be used or extended. Do not re-implement inline.

### 5. Breed display

- If `breed` is not null: display as a subtitle line directly below the item name on both the card (if space allows — spec must decide) and the detail sheet.
- On the card: if the card is too compact for a subtitle, the breed may be omitted from the card but must appear on the detail sheet. The spec must make this decision explicitly.
- On the detail sheet: breed is always shown when present. Position: immediately below the item name, smaller text, `var(--t2)` colour.

---

## Decisions the must NOT be left to FE

- Whether the discontinued badge is shown on the card, the detail sheet, or both
- The exact label of the badge ("Discontinued" is specified above)
- Whether discontinued items are greyed in the grid
- Whether the filter is a pill or a toggle
- Whether `breed` appears on the card or only the detail sheet
- The label of the animal facts section heading

All of the above must be resolved in `interaction-spec.md` before Phase C begins.
