# Data Model Additions — Animal Detail Modal v3
**Role:** Product Owner
**Input:** ur-findings.md (2026-03-28)
**Output:** New TypeScript interface fields for AnimalEntry

---

## Scope decision

All new fields are optional (`field?: type | null`). This is non-negotiable. The existing 4500+ animal catalog must not break. Fields with `null` explicitly communicate "we know this field exists but have no data for this animal." Fields with `undefined` (omitted) communicate "this field has not been authored yet." Both cases render as graceful absence in the UI — never as broken layout.

A field marked `| null` in the type will render its section as absent. A field that is present (non-null, non-undefined) renders the full section.

---

## New fields — TypeScript interface additions

These fields are to be appended to the `AnimalEntry` interface in `src/data/animals.ts`, below the existing `lifespanDetail` field.

```typescript
// ── Wikipedia-level enrichment fields (animal-detail-modal-v3) ──────────────

// ── Scientific classification ────────────────────────────────────────────────

/** Binomial scientific name. Rendered in italics. e.g. "Panthera leo"
 *  IMPORTANT: must be cross-checked against ITIS / IUCN before authoring.
 *  Do not use AI-generated names without verification. */
scientificName?: string | null

/** Full taxonomic classification from kingdom to species.
 *  All fields optional — render only the ones present.
 *  Minimum viable: kingdom + class + order + family + genus. */
taxonomy?: {
  kingdom?: string   // e.g. "Animalia"
  phylum?: string    // e.g. "Chordata"
  class?: string     // e.g. "Mammalia"
  order?: string     // e.g. "Carnivora"
  family?: string    // e.g. "Felidae"
  genus?: string     // e.g. "Panthera"
  species?: string   // e.g. "leo" (species epithet only, not the full binomial)
} | null

// ── Physical measurements ────────────────────────────────────────────────────

/** Body length or height at shoulder (whichever is more meaningful for the species).
 *  Label must be specified — "Length", "Height at shoulder", "Wingspan", "Shell length", etc.
 *  Value as a human-readable range string, e.g. "1.2–2.0 m". */
physicalSize?: {
  label: string       // e.g. "Body length", "Height at shoulder", "Wingspan"
  value: string       // e.g. "1.2–2.0 m", "up to 3.3 m"
  comparison?: string // e.g. "About as long as a family car" — optional scale anchor
} | null

/** Body weight as a human-readable range string.
 *  comparison is a scale anchor for children, e.g. "About the same as 3 Labrador dogs". */
physicalWeight?: {
  value: string         // e.g. "150–250 kg"
  comparison?: string   // e.g. "About the same as 2–3 adult humans"
} | null

/** Top speed. Value as a human-readable string.
 *  comparison anchors speed to something familiar, e.g. "Faster than a car on a motorway". */
topSpeed?: {
  value: string         // e.g. "112 km/h"
  comparison?: string   // e.g. "As fast as a car on a motorway"
} | null

/** 2–4 interesting physical or biological adaptations beyond the superpower.
 *  Each entry is one short sentence (max 20 words).
 *  These are structural/biological facts, not behavioural ones. */
adaptations?: string[] | null

// ── Reproduction ─────────────────────────────────────────────────────────────

/** All reproduction fields are optional and rendered together in a single section.
 *  Section absent if entire object is null. Individual fields can be omitted. */
reproduction?: {
  /** Duration of pregnancy/incubation as a human-readable string.
   *  e.g. "63–65 days", "11–12 months", "28 days" */
  gestationPeriod?: string
  /** Number of offspring per birth as a human-readable string.
   *  e.g. "1–6 kittens", "1 foal", "Up to 12 eggs" */
  litterSize?: string
  /** What the young of this species are called.
   *  e.g. "kitten", "foal", "cub", "kit", "calf", "chick", "pup" */
  offspringName?: string
  /** Age at which offspring reach independence / are weaned.
   *  e.g. "8–12 weeks", "12–18 months" */
  ageAtIndependence?: string
  /** Whether this species has parental care and from which parent(s).
   *  Max 30 words. e.g. "Both parents raise young together for 2 years." */
  parentalCare?: string
} | null

// ── Ecology ──────────────────────────────────────────────────────────────────

/** What preys on this animal in the wild. Array of predator names (strings).
 *  For top predators: pass an empty array [], not null.
 *  null → section absent. [] → "No natural predators" state renders. */
predators?: string[] | null

/** Geographic range as a narrative sentence or two (max 50 words).
 *  More descriptive than the existing `region` field.
 *  e.g. "Found across sub-Saharan Africa in open grasslands and lightly wooded savanna.
 *       Small isolated populations survive in India's Gir Forest." */
geographicRange?: string | null

// ── Cultural / historical significance ──────────────────────────────────────

/** 1–3 sentences on the animal's role in human history, mythology, culture, or famous individuals.
 *  Max 80 words total. Designed for ages 10–12 primarily.
 *  null → section absent. */
culturalSignificance?: string | null

// ── Gallery ──────────────────────────────────────────────────────────────────

/** Array of additional image URLs/paths beyond the primary hero image.
 *  2–4 images recommended. Each entry specifies the URL and an alt text.
 *  null or empty array → gallery section absent. */
gallery?: Array<{
  url: string    // Absolute path, e.g. "/Animals/Wild/Lion_pride.jpg"
  alt: string    // Descriptive alt text for accessibility
}> | null
```

---

## Field groupings for UI rendering

These groups map directly to UI sections:

| Group | Fields | UI section name |
|---|---|---|
| Classification | `scientificName`, `taxonomy` | "Classification" |
| Physical stats | `physicalSize`, `physicalWeight`, `topSpeed` | Part of infobox |
| Adaptations | `adaptations` | "Amazing Adaptations" |
| Reproduction | `reproduction.*` | "Babies and Reproduction" |
| Ecology extras | `predators`, `geographicRange` | "Predators" and "Where It Lives" |
| Cultural | `culturalSignificance` | "Did You Know?" (cultural slot) |
| Gallery | `gallery` | "Photo Gallery" |

---

## Fields retained from existing model (no change)

The following existing fields map into the new enriched layout without modification:

- `superpower` → infobox callout / stats row
- `habitat`, `habitatDetail`, `habitatThreats` → "Habitat" section
- `diet`, `dietDetail` → infobox stat
- `lifespan`, `lifespanDetail` → infobox stat
- `region` → infobox stat (still used as short label)
- `conservationStatus`, `conservationStatusDetail` → "Conservation" section
- `socialBehaviour` → "Social Life" section
- `careNeeds`, `careDifficulty` → "Care Needs" section (domestic only)
- `dailyLife` → "Daily Life" section
- `facts` → "Fun Facts" section (renamed or merged with adaptations)

---

## Data authoring notes (mandatory for anyone populating these fields)

1. **`scientificName` and `taxonomy`:** Cross-check every entry against https://www.itis.gov or the IUCN Red List. AI-generated scientific names must never be committed without verification.
2. **`physicalSize.comparison` and `physicalWeight.comparison`:** Use a consistent set of reference objects across all animals. Recommended scale anchors: household cat (4 kg), Labrador (30 kg), adult human (70–80 kg), family car (1,500 kg), school bus (10,000 kg), for weight. For length: school ruler (30 cm), adult human (1.7–1.8 m), family car (4.5 m), double-decker bus (11 m).
3. **`predators`:** Pass `[]` (empty array) for apex predators — this renders a "No natural predators" state, which is itself a compelling fact. Do not pass `null` for apex predators.
4. **`gallery`:** Images must be in the `/public/Animals/` directory tree. Alt text must be descriptive ("A lion pride resting in savanna grass at sunset") not generic ("Lion image 2").
5. **`reproduction.offspringName`:** Use the lowercase singular form ("kitten" not "kittens", "foal" not "foals"). The UI handles pluralisation.
6. **`culturalSignificance`:** Keep to 2–3 sentences max. This is not a history essay. Flag famous individuals (e.g. "Shamu the orca") or cultural references (e.g. "Ancient Egyptians worshipped cats as sacred animals") that children will find memorable.
