// schleich.ts — Static Schleich figurine catalogue
//
// Data source: /schleich/schleich_figures.json
//
// Derived id rule: article number string.
// "13746" → "13746"
// This is stable because every figure has a unique article number.

import rawData from '../../schleich/schleich_figures.json'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Raw category slug values as they appear in the JSON data file. */
export type SchleichCategorySlug =
  | 'horses'
  | 'wild-animals-adventure'
  | 'farm-animals-farm-toys'
  | 'monsters-and-dragons'
  | 'dinosaurs-and-volcano'

/** The full Schleich item type.
 *  Base fields come from schleich_animals.json.
 *  Enriched fields (articleNumber, releaseYear, discontinued,
 *  discontinuedYear, animalFacts, breed) are nullable — they are absent
 *  when using the base data file and populated when using the enriched file. */
export interface SchleichAnimal {
  // ── Base fields (always present) ──────────────────────────────────────────
  /** Display name e.g. "Haflinger Foal" */
  name: string
  /** Full marketing description text */
  description: string
  /** Relative image path e.g. "images/haflinger-foal-13951.jpg" */
  image: string
  /** Shopify CDN URL — use this as the primary img src */
  image_url: string
  /** Raw category slug */
  category: SchleichCategorySlug
  /** Schleich product URL */
  url: string

  // ── Enriched fields (nullable — absent on base data) ──────────────────────
  /** Article number e.g. 13951 — not displayed in UI */
  articleNumber: number | null
  /** Year the figurine was first released */
  releaseYear: number | null
  /** True when the figurine is discontinued / no longer produced */
  discontinued: boolean
  /** Year the figurine was discontinued; null when still in production */
  discontinuedYear: number | null
  /** Educational animal facts paragraph */
  animalFacts: string
  /** Breed name e.g. "Haflinger" — shown in detail sheet subtitle */
  breed: string | null
  /** True if this is a solo figurine (not a playset, set, or accessory pack) */
  isSolo: boolean

  // ── Derived (computed at import time) ──────────────────────────────────────
  /** Stable unique id derived from image filename without extension.
   *  e.g. "haflinger-foal-13951" */
  id: string
}

// ─── Raw shape from schleich_figures.json ────────────────────────────────────

interface RawSchleichRecord {
  articleNumber: string
  name: string
  releaseYear: number
  status: 'active' | 'retired'
  category: string
  animalType: string
  description: string           // educational facts paragraph
  marketingDescription: string  // marketing copy shown in detail sheet
  image: string                 // "images/{articleNumber}.jpg"
}

// ─── Category mapping ────────────────────────────────────────────────────────

/** Map new JSON category + animalType to the SchleichCategorySlug used by the UI. */
function mapCategory(category: string, animalType: string): SchleichCategorySlug | null {
  switch (category) {
    case 'Horse Club':
    case 'Horse Club Sofias Beauties': return 'horses'
    case 'Wild Life':                  return 'wild-animals-adventure'
    case 'Farm World':                 return 'farm-animals-farm-toys'
    case 'Eldrador':                   return 'monsters-and-dragons'
    case 'Dinosaurs':                  return 'dinosaurs-and-volcano'
    case 'Bayala':                     return 'monsters-and-dragons'
    case 'Playsets':                   return null  // excluded
    case 'Figurines': {
      // Map by animal type for the catch-all Figurines category
      if (animalType === 'Horse')                              return 'horses'
      if (animalType === 'Dinosaur')                          return 'dinosaurs-and-volcano'
      if (animalType === 'Magical/Fantasy' ||
          animalType === 'Fantasy Creature')                  return 'monsters-and-dragons'
      if (animalType === 'Farm Animal' ||
          animalType === 'Domestic Pet')                      return 'farm-animals-farm-toys'
      return 'wild-animals-adventure'  // Birds, Reptiles, Marine, Wild-*
    }
    default: return null
  }
}

// ─── Data assembly ────────────────────────────────────────────────────────────

const raw = rawData as RawSchleichRecord[]

/** Full static catalogue — all individual figurines from schleich_figures.json.
 *  Playsets are excluded by category mapping returning null.
 *  Imported once at module load — no runtime fetching. */
const NON_FIGURINE_PATTERNS: RegExp[] = [
  /\bshow\b/i,          // "Large Horse Show", "horse show"
  /\btournament\b/i,    // "Friendship Horse Tournament", "riding tournament"
  /\bcompetition\b/i,
  /\bcourse\b/i,        // "Horse Obstacle Course"
  /\baccessory\b/i,     // "Accessory Horse Show Jewelry"
  /\bjewelry\b/i,
  /\barena\b/i,
  /\bchampionship\b/i,
  /\bexpanded\b/i,      // "Big Horse Show Expanded"
  /\bplayset\b/i,
  /\bset\b/i,
  /\bfamily\b/i,
  /\bbundle\b/i,
]

function isNonFigurine(name: string): boolean {
  return NON_FIGURINE_PATTERNS.some(re => re.test(name))
}

export const SCHLEICH_ITEMS: SchleichAnimal[] = raw
  .filter(record => !isNonFigurine(record.name))
  .map(record => {
    const slug = mapCategory(record.category, record.animalType)
    if (!slug) return null
    return {
      name:              record.name,
      description:       record.marketingDescription,
      image:             record.image,
      image_url:         `/schleich/${record.image}`,
      category:          slug,
      url:               '',
      articleNumber:     parseInt(record.articleNumber, 10),
      releaseYear:       record.releaseYear,
      discontinued:      record.status === 'retired',
      discontinuedYear:  null,
      animalFacts:       record.description,
      breed:             record.animalType,
      isSolo:            true,
      id:                record.articleNumber,
    } satisfies SchleichAnimal
  })
  .filter((x): x is SchleichAnimal => x !== null)

// ─── Category filter data ─────────────────────────────────────────────────────

/** All valid filter values: the five category slugs plus the sentinel 'all'
 *  and the special 'retired' discontinued filter. */
export const SCHLEICH_CATEGORIES = [
  'all',
  'horses',
  'wild-animals-adventure',
  'farm-animals-farm-toys',
  'monsters-and-dragons',
  'dinosaurs-and-volcano',
  'retired',
] as const

export type SchleichCategoryFilter = (typeof SCHLEICH_CATEGORIES)[number]

/** Maps filter values to user-facing pill labels.
 *  "Wild Animals" matches Story 3 AC requirement (not "Wild"). */
export const SCHLEICH_CATEGORY_LABELS: Record<SchleichCategoryFilter, string> = {
  'all':                       'All',
  'horses':                    'Horses',
  'wild-animals-adventure':    'Wild Animals',
  'farm-animals-farm-toys':    'Farm',
  'monsters-and-dragons':      'Dragons',
  'dinosaurs-and-volcano':     'Dinosaurs',
  'retired':                   'Retired',
}

/** The default category filter applied on mount. Horses are Harry's primary
 *  interest and represent ~35% of the catalogue. */
export const SCHLEICH_DEFAULT_CATEGORY: SchleichCategoryFilter = 'horses'

// ─── Category colour pairs ────────────────────────────────────────────────────
// Used by SchleichCard (card badge overlay) and SchleichDetailSheet (badge pill).
// All values reference CSS variable tokens — no hardcoded hex values.

export interface CategoryColourPair {
  /** CSS var string for tinted background */
  sub: string
  /** CSS var string for text colour */
  text: string
  /** CSS var string for border (detail sheet badge uses explicit border) */
  border: string
}

/** Per spec section 6 (interaction-spec.md) category colour map:
 *  horses → amber (warm/special),
 *  wild + farm → green (nature/outdoor),
 *  dragons → purple (thematic),
 *  dinosaurs → red (thematic) */
export const CATEGORY_COLOURS: Record<SchleichCategorySlug, CategoryColourPair> = {
  'horses':                 { sub: 'var(--amber-sub)',  text: 'var(--amber-t)',  border: 'var(--amber)'  },
  'wild-animals-adventure': { sub: 'var(--green-sub)',  text: 'var(--green-t)',  border: 'var(--green)'  },
  'farm-animals-farm-toys': { sub: 'var(--green-sub)',  text: 'var(--green-t)',  border: 'var(--green)'  },
  'monsters-and-dragons':   { sub: 'var(--purple-sub)', text: 'var(--purple-t)', border: 'var(--purple)' },
  'dinosaurs-and-volcano':  { sub: 'var(--red-sub)',    text: 'var(--red-t)',    border: 'var(--red)'    },
}

/** Short display label used on card badge overlays (bottom-left of image).
 *  "Wild" not "Wild Animals" — keeps badge compact inside the image area. */
export const CATEGORY_SHORT_LABEL: Record<SchleichCategorySlug, string> = {
  'horses':                 'Horses',
  'wild-animals-adventure': 'Wild',
  'farm-animals-farm-toys': 'Farm',
  'monsters-and-dragons':   'Dragons',
  'dinosaurs-and-volcano':  'Dinos',
}

/** Full display label used in the detail sheet category badge (more room available). */
export const CATEGORY_PILL_LABEL: Record<SchleichCategorySlug, string> = {
  'horses':                 'Horses',
  'wild-animals-adventure': 'Wild Animals',
  'farm-animals-farm-toys': 'Farm',
  'monsters-and-dragons':   'Dragons',
  'dinosaurs-and-volcano':  'Dinosaurs',
}
