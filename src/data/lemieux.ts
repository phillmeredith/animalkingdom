// lemieux.ts — Static LeMieux product catalogue
//
// Data sources:
//   /lemieux/horsewear/products.json  — 411 items across multiple categories
//   /lemieux/hobby-horses/products.json — 63 items (hobby horses + accessories)
//
// ID derivation: image filename without path prefix and without extension.
//   "images/it09098_product_hobbyhorsemini_toby_.jpg" → "it09098_product_hobbyhorsemini_toby_"
//   Falls back to a slugified name when image is null.
//
// Filtering rules:
//   - EXCLUDE items where name contains "Not suitable for persons under 14 years"
//   - EXCLUDE hobby-horse items where image is null (nav link placeholders)
//
// Pricing: deterministic assignment by index within category using linear
//   interpolation between min/max, rounded to nearest 10.

import horsewearRaw from '../../lemieux/horsewear/products.json'
import hobbyHorsesRaw from '../../lemieux/hobby-horses/products.json'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Equipment slot on the horse model.
 *  Defined here (not in db.ts) to avoid a circular import — db.ts imports from
 *  this file, so this file must not import from db.ts.
 *  Re-exported from this module so consumers only need one import. */
export type LeMieuxSlot = 'head' | 'body' | 'legs' | 'saddle' | 'bridle'

export interface LeMieuxItem {
  /** Stable unique id derived from image filename without extension. */
  id: string
  name: string
  description: string
  /** Shopify/LeMieux CDN URL — may be null when the source record had no image. */
  imageUrl: string | null
  /** URL slug extracted from the product URL. */
  urlSlug: string
  /** Human-readable category label for display in the UI. */
  displayCategory: string
  /** Equipment slot — null for non-equippable items (grooming, stable, etc.). */
  slot: LeMieuxSlot | null
  /** Price in coins, deterministically assigned within category price range. */
  price: number
  /** Data source — distinguishes horsewear catalogue from hobby horse catalogue. */
  source: 'horsewear' | 'hobby-horse'
}

// ─── Raw record shape ─────────────────────────────────────────────────────────

interface RawLeMieuxRecord {
  name: string
  description: string
  image: string | null
  image_url: string
  url: string
}

// ─── Category configuration ───────────────────────────────────────────────────

interface CategoryConfig {
  slug: string
  label: string
  slot: LeMieuxSlot | null
  priceMin: number
  priceMax: number
}

/** Category display order matches the interaction-spec filter pill order. */
const CATEGORY_CONFIGS: CategoryConfig[] = [
  { slug: 'fly-hoods',            label: 'Fly Hoods',       slot: 'head',   priceMin: 100, priceMax: 180 },
  { slug: 'headcollars-leadropes',label: 'Headcollars',     slot: 'head',   priceMin: 80,  priceMax: 150 },
  { slug: 'horse-rugs',           label: 'Rugs',            slot: 'body',   priceMin: 120, priceMax: 220 },
  { slug: 'boots-bandages',       label: 'Boots',           slot: 'legs',   priceMin: 80,  priceMax: 160 },
  { slug: 'saddlery-tack',        label: 'Saddlery',        slot: 'saddle', priceMin: 150, priceMax: 300 },
  { slug: 'fly-protection',       label: 'Fly Protection',  slot: null,     priceMin: 50,  priceMax: 120 },
  { slug: 'grooming-care',        label: 'Grooming',        slot: null,     priceMin: 30,  priceMax: 80  },
  { slug: 'stable-yard',          label: 'Stable',          slot: null,     priceMin: 20,  priceMax: 60  },
  { slug: 'supplements',          label: 'Supplements',     slot: null,     priceMin: 40,  priceMax: 100 },
  { slug: 'hobby-horse',          label: 'Hobby Horses',    slot: null,     priceMin: 200, priceMax: 400 },
]

const CONFIG_BY_SLUG = new Map(CATEGORY_CONFIGS.map(c => [c.slug, c]))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a stable string id from a record's image field.
 *  Strips path prefix and file extension.
 *  Falls back to a slugified name when image is null or empty. */
function deriveId(image: string | null, name: string): string {
  if (image) {
    const filename = image.replace(/^.*\//, '')
    const withoutExt = filename.replace(/\.[^.]+$/, '')
    if (withoutExt.length > 0) return withoutExt
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Extract URL slug from a LeMieux product URL.
 *  Horsewear: https://www.lemieux.com/horsewear/{slug}/... → slug
 *  Hobby horses: all map to 'hobby-horse' */
function extractUrlSlug(url: string, source: 'horsewear' | 'hobby-horse'): string {
  if (source === 'hobby-horse') return 'hobby-horse'

  // /horsewear/{slug}/... — grab the segment after /horsewear/
  const match = url.match(/\/horsewear\/([^/]+)/)
  if (match) return match[1]

  return 'stable-yard' // safe fallback — slot: null
}

/** Assign price deterministically using linear interpolation within category range.
 *  i = 0-based item index, count = total items in category.
 *  Result rounded to nearest 10. */
function assignPrice(i: number, count: number, min: number, max: number): number {
  const raw = min + (count <= 1 ? 0 : (i / (count - 1)) * (max - min))
  return Math.round(raw / 10) * 10
}

// ─── Data assembly ────────────────────────────────────────────────────────────

/** Age-restriction text that identifies the excluded hobby horse jump product. */
const AGE_RESTRICTION_MARKER = 'Not suitable for persons under 14 years'

/** Groups for counting items per category before price assignment. */
const categoryBuckets = new Map<string, RawLeMieuxRecord[]>()

function bucketRecord(record: RawLeMieuxRecord, source: 'horsewear' | 'hobby-horse'): void {
  // Apply exclusion rules
  if (record.name.includes(AGE_RESTRICTION_MARKER)) return
  if (source === 'hobby-horse' && record.image === null) return

  const slug = extractUrlSlug(record.url, source)
  const key = slug
  const bucket = categoryBuckets.get(key) ?? []
  bucket.push(record)
  categoryBuckets.set(key, bucket)
}

// Bucket all records first so we know category counts for price assignment
;(horsewearRaw as RawLeMieuxRecord[]).forEach(r => bucketRecord(r, 'horsewear'))
;(hobbyHorsesRaw as RawLeMieuxRecord[]).forEach(r => bucketRecord(r, 'hobby-horse'))

/** Full static catalogue of all LeMieux items.
 *  Ordered by category (interaction-spec pill order) then by original source order. */
export const LEMIEUX_ITEMS: LeMieuxItem[] = CATEGORY_CONFIGS.flatMap(config => {
  const records = categoryBuckets.get(config.slug) ?? []
  const count = records.length
  const source: 'horsewear' | 'hobby-horse' =
    config.slug === 'hobby-horse' ? 'hobby-horse' : 'horsewear'

  return records.map((record, i) => ({
    id:              deriveId(record.image, record.name),
    name:            record.name,
    description:     record.description,
    imageUrl:        record.image_url || null,
    urlSlug:         config.slug,
    displayCategory: config.label,
    slot:            config.slot,
    price:           assignPrice(i, count, config.priceMin, config.priceMax),
    source,
  }))
})

// ─── Category exports ─────────────────────────────────────────────────────────

/** Unique slugs in interaction-spec display order. */
export const LEMIEUX_CATEGORY_SLUGS: string[] = CATEGORY_CONFIGS
  .filter(c => (categoryBuckets.get(c.slug)?.length ?? 0) > 0)
  .map(c => c.slug)

/** Full category metadata in display order — only slugs that have items. */
export const LEMIEUX_DISPLAY_CATEGORIES: { slug: string; label: string }[] =
  LEMIEUX_CATEGORY_SLUGS.map(slug => ({
    slug,
    label: CONFIG_BY_SLUG.get(slug)!.label,
  }))
