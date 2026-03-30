// AnimalDetailContent — Animal Detail Modal v3
// The scrollable interior of AnimalDetailModal. Composes all content sections
// in the canonical order defined by the v3 interaction spec.
//
// Section order (fixed — sections with no data collapse entirely, no gap):
//   1.  Hero Image                    [always]
//   2.  Identity Row                  [always]
//   3.  Superpower Callout            [conditional]
//   4.  Infobox                       [always]
//   5.  Photo Gallery                 [conditional — if gallery has entries]
//   6.  Amazing Adaptations           [conditional — if adaptations]
//   7.  Habitat                       [conditional — if habitatDetail]
//   8.  Daily Life                    [always]
//   9.  Reproduction                  [conditional — if reproduction]
//   10. Predators                     [conditional — if predators != null]
//   11. Where It Lives                [conditional — if geographicRange]
//   12. Social Life                   [conditional]
//   13. Conservation Status           [always]
//   14. Care Needs OR Habitat Threats [conditional]
//   15. Cultural Significance         [conditional — if culturalSignificance]
//   16. Fun Facts                     [always]
//   17. CTA Block                     [always]
//
// Content column: px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
// pt-4 is mandatory to clear the sticky glass header's bottom border.

import {
  MapPin,
  TreePine,
  Utensils,
  Clock,
  Ruler,
  Scale,
  Zap,
  Globe,
  Sparkles,
  Shield,
  Baby,
  Calendar,
  Heart,
  Star,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { SuperpowerCallout } from './SuperpowerCallout'
import { AnimalDailyLife } from './AnimalDailyLife'
import { AnimalConservationStatus } from './AnimalConservationStatus'
import { AnimalSocialLife } from './AnimalSocialLife'
import { AnimalCareOrThreats } from './AnimalCareOrThreats'
import { AnimalFunFacts } from './AnimalFunFacts'
import { AnimalDetailCTA } from './AnimalDetailCTA'
import type { AnimalEntry } from '@/data/animals'

// Maps habitat label → /Animals/Habitats/ image filename.
// Falls back to null when no image matches (section is omitted).
const HABITAT_IMAGE: Record<string, string> = {
  'Arctic Ice':             'arctic.jpg',
  'Arctic Tundra':          'tundra.jpg',
  'Bamboo Forest':          'tropical_rainforest.jpg',
  'Coastal / Sky':          'coastal.jpg',
  'Coral Reef':             'reef.jpg',
  'Desert':                 'sahara.jpg',
  'Eucalyptus Forest':      'temperate_forest.jpg',
  'Farmland':               'farm.jpg',
  'Forest':                 'temperate_forest.jpg',
  'Forest & Plains':        'grassland.jpg',
  'Forest & Tundra':        'tundra.jpg',
  'Grassland':              'grassland.jpg',
  'Home':                   'domestic.jpg',
  'Home & Farm':            'farm.jpg',
  'Mountain':               'snow_mountains.jpg',
  'Ocean':                  'ocean.jpg',
  'Rainforest':             'tropical_rainforest.jpg',
  'Savanna':                'savanna.jpg',
  'Seagrass & Coral Reef':  'reef.jpg',
  'Temperate Forest':       'temperate_forest.jpg',
  'Tropical Ocean':         'ocean.jpg',
  'Wetland / Farm':         'wetland.jpg',
}

function getHabitatImageUrl(habitat: string): string | null {
  const filename = HABITAT_IMAGE[habitat]
  return filename ? `/Animals/Habitats/${filename}` : null
}

// Rarity colour pairs. Common uses raw alpha composites (no DS token for grey tint).
function getRarityStyle(rarity: string): { bg: string; color: string; border: string } {
  switch (rarity) {
    case 'uncommon':
    case 'Uncommon':
      return { bg: 'var(--green-sub)', color: 'var(--green-t)', border: '1px solid rgba(69,178,107,.3)' }
    case 'rare':
    case 'Rare':
      return { bg: 'var(--blue-sub)', color: 'var(--blue-t)', border: '1px solid rgba(55,114,255,.3)' }
    case 'epic':
    case 'Epic':
      return { bg: 'var(--purple-sub)', color: 'var(--purple-t)', border: '1px solid rgba(151,87,215,.3)' }
    case 'legendary':
    case 'Legendary':
      return { bg: 'var(--amber-sub)', color: 'var(--amber-t)', border: '1px solid rgba(245,166,35,.3)' }
    default:
      return { bg: 'rgba(119,126,145,.12)', color: '#B1B5C4', border: '1px solid rgba(119,126,145,.3)' }
  }
}

// Shared hairline section label style object (used via inline style on <p>).
const hairlineLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--t3)',
  marginBottom: '12px',
}

// Stat cell for the Infobox stats grid.
interface StatCellProps {
  icon: React.ReactNode
  label: string
  value: string
  detail?: string | null
  spanFull?: boolean
}

function StatCell({ icon, label, value, detail, spanFull }: StatCellProps) {
  return (
    <div
      role="listitem"
      aria-label={`${label}: ${value}${detail ? `, ${detail}` : ''}`}
      style={{
        background: 'var(--elev)',
        border: '1px solid var(--border-s)',
        borderRadius: 'var(--r-md)',
        padding: '12px',
        gridColumn: spanFull ? 'span 2' : undefined,
      }}
    >
      {/* Row 1: icon + label */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <span style={{ color: 'var(--t3)', display: 'flex', flexShrink: 0 }}>{icon}</span>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: 'var(--t3)',
          lineHeight: '1.3',
        }}>
          {label}
        </p>
      </div>
      {/* Row 2: value */}
      <p style={{ fontSize: '22px', fontWeight: 600, color: 'var(--t1)', marginTop: '6px', lineHeight: '1.3' }}>
        {value}
      </p>
      {/* Row 3: detail (1-line clamp) */}
      {detail != null && (
        <p
          style={{
            fontSize: '11px',
            fontWeight: 400,
            color: 'var(--t3)',
            marginTop: '2px',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {detail}
        </p>
      )}
    </div>
  )
}

interface AnimalDetailContentProps {
  animal: AnimalEntry
  onClose: () => void
}

// Catalog animalType values that don't exist in the generate wizard's type list.
// These broad types come from the bulk catalog import (Wild Animal, Pet, etc.).
// Map them to the closest wizard category so the wizard starts at step 2 (type
// selection within the right habitat) rather than falling back to step 1.
const CATALOG_TYPE_TO_WIZARD_CATEGORY: Record<string, string> = {
  'Wild Animal':    'Wild',
  'Pet':            'At Home',
  'Marine Animal':  'Sea',
  'Marine Reptile': 'Sea',
  'Farm Animal':    'Farm',
  'Bird':           'Wild',
}

export function AnimalDetailContent({ animal, onClose }: AnimalDetailContentProps) {
  const navigate = useNavigate()

  function handleGenerate() {
    onClose()
    const wizardCategory = CATALOG_TYPE_TO_WIZARD_CATEGORY[animal.animalType] ?? animal.category
    const params = new URLSearchParams({
      name: animal.name,
      animalType: animal.animalType,
      category: wizardCategory,
      breed: animal.breed,
      ...(animal.imageUrl ? { imageUrl: animal.imageUrl } : {}),
    })
    navigate(`/adopt?${params.toString()}`)
  }

  function handleMarketplace() {
    onClose()
    // Deep-link to the marketplace sell offers pre-filtered by this animal's name.
    navigate(`/shop?tab=marketplace&search=${encodeURIComponent(animal.name)}`)
  }

  // ── Infobox stat cells — build array first so odd-count spanning works ──────
  interface StatCellDef {
    icon: React.ReactNode
    label: string
    value: string
    detail?: string | null
  }

  const iconSize = 14
  const iconStroke = 2

  const statCells: StatCellDef[] = [
    { icon: <TreePine size={iconSize} strokeWidth={iconStroke} />, label: 'HABITAT',    value: animal.habitat,    detail: animal.habitatDetail },
    { icon: <Utensils  size={iconSize} strokeWidth={iconStroke} />, label: 'DIET',       value: animal.diet,       detail: animal.dietDetail },
    { icon: <Clock     size={iconSize} strokeWidth={iconStroke} />, label: 'LIFESPAN',   value: animal.lifespan,   detail: animal.lifespanDetail },
  ]
  if (animal.physicalSize != null) {
    statCells.push({ icon: <Ruler size={iconSize} strokeWidth={iconStroke} />, label: 'SIZE',      value: animal.physicalSize.value,   detail: animal.physicalSize.comparison })
  }
  if (animal.physicalWeight != null) {
    statCells.push({ icon: <Scale size={iconSize} strokeWidth={iconStroke} />, label: 'WEIGHT',    value: animal.physicalWeight.value, detail: animal.physicalWeight.comparison })
  }
  if (animal.topSpeed != null) {
    statCells.push({ icon: <Zap   size={iconSize} strokeWidth={iconStroke} />, label: 'TOP SPEED', value: animal.topSpeed.value,       detail: animal.topSpeed.comparison })
  }
  statCells.push({ icon: <MapPin size={iconSize} strokeWidth={iconStroke} />, label: 'ORIGIN', value: animal.region })

  const hasTaxonomy = animal.taxonomy != null || animal.scientificName != null
  const rarityStyle = getRarityStyle(animal.rarity)

  // Reproduction tile definitions
  interface ReproTileDef {
    icon: React.ReactNode
    label: string
    value: string
  }
  const reproTiles: ReproTileDef[] = []
  if (animal.reproduction != null) {
    const r = animal.reproduction
    if (r.gestationPeriod) reproTiles.push({ icon: <Calendar size={14} strokeWidth={2} />, label: 'GESTATION',    value: r.gestationPeriod })
    if (r.litterSize)      reproTiles.push({ icon: <Baby     size={14} strokeWidth={2} />, label: 'LITTER SIZE',  value: r.litterSize })
    if (r.offspringName)   reproTiles.push({ icon: <Heart    size={14} strokeWidth={2} />, label: 'BABIES CALLED', value: r.offspringName })
    if (r.ageAtIndependence) reproTiles.push({ icon: <Star   size={14} strokeWidth={2} />, label: 'INDEPENDENCE', value: r.ageAtIndependence })
  }

  const galleryItems = animal.gallery && animal.gallery.length > 0 ? animal.gallery : null

  return (
    // Content column: max-w-3xl centres content on iPad; pb-24 clears fixed nav.
    // pt-4 provides 16px breathing room below the sticky glass header border.
    <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">

      {/* ── Section 1: Hero Image ──────────────────────────────────────────────── */}
      <div
        className="w-full overflow-hidden"
        style={{ aspectRatio: '16/9', borderRadius: 'var(--r-lg)', position: 'relative' }}
      >
        <AnimalImage
          src={animal.imageUrl}
          alt={`${animal.name} photograph`}
          className="w-full h-full rounded-lg"
          fallbackClassName="w-full h-full rounded-lg"
        />
        {/* "X more photos" pill — shown when gallery has entries */}
        {galleryItems != null && (
          <span
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'rgba(0,0,0,.55)',
              color: 'var(--t1)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '100px',
              pointerEvents: 'none',
            }}
          >
            {galleryItems.length} more photos
          </span>
        )}
      </div>

      {/* ── Section 2: Identity Row ────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap items-center mt-4">
        {/* Category badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            background: 'var(--elev)',
            border: '1px solid var(--border-s)',
            color: 'var(--t3)',
          }}
        >
          {animal.category}
        </span>

        {/* Rarity badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            background: rarityStyle.bg,
            border: rarityStyle.border,
            color: rarityStyle.color,
          }}
        >
          {animal.rarity.charAt(0).toUpperCase() + animal.rarity.slice(1)}
        </span>

        {/* Region indicator */}
        <span className="inline-flex items-center" style={{ gap: '4px', color: 'var(--t3)' }}>
          <MapPin size={12} strokeWidth={2} style={{ color: 'var(--t3)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--t3)', lineHeight: '1.4' }}>
            {animal.region}
          </span>
        </span>

        {/* Scientific name (conditional) */}
        {animal.scientificName != null && (
          <>
            <span style={{ color: 'var(--t4)', fontSize: '13px' }}>•</span>
            <span style={{ fontSize: '13px', fontWeight: 400, fontStyle: 'italic', color: 'var(--t3)' }}>
              {animal.scientificName}
            </span>
          </>
        )}
      </div>

      {/* ── Section 2b: Wikipedia description (conditional — enriched on modal open) ── */}
      {animal.wikiDescription != null && animal.wikiDescription.length > 0 && (
        <p
          className="mt-4"
          style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: '1.65' }}
        >
          {animal.wikiDescription}
        </p>
      )}

      {/* ── Section 3: Superpower Callout (conditional) ───────────────────────── */}
      {animal.superpower != null && (
        <SuperpowerCallout superpower={animal.superpower} className="mt-4" />
      )}

      {/* ── Section 4: Infobox ────────────────────────────────────────────────── */}
      <div
        className="mt-4"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border-s)',
          borderRadius: 'var(--r-lg)',
          padding: '20px',
        }}
      >
        {/* iPad: two-column grid (stats left, taxonomy right). Phone: single column. */}
        <div className={hasTaxonomy ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : undefined}>
          {/* Stats grid */}
          <div
            role="list"
            aria-label="Physical stats"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
          >
            {statCells.map((cell, i) => {
              const isLast = i === statCells.length - 1
              const isOddCount = statCells.length % 2 !== 0
              return (
                <StatCell
                  key={cell.label}
                  icon={cell.icon}
                  label={cell.label}
                  value={cell.value}
                  detail={cell.detail}
                  spanFull={isLast && isOddCount}
                />
              )
            })}
          </div>

          {/* Taxonomy (conditional) */}
          {hasTaxonomy && (
            <div>
              <p style={hairlineLabelStyle}>CLASSIFICATION</p>
              <dl>
                {(() => {
                  const tx = animal.taxonomy
                  const rows: Array<{ term: string; def: string; italic?: boolean }> = []
                  if (tx?.kingdom) rows.push({ term: 'Kingdom', def: tx.kingdom })
                  if (tx?.class)   rows.push({ term: 'Class',   def: tx.class })
                  if (tx?.order)   rows.push({ term: 'Order',   def: tx.order })
                  if (tx?.family)  rows.push({ term: 'Family',  def: tx.family })
                  if (tx?.genus)   rows.push({ term: 'Genus',   def: tx.genus })
                  if (tx?.species) rows.push({ term: 'Species', def: tx.species, italic: true })
                  return rows.slice(0, 6).map((row, i) => (
                    <div
                      key={row.term}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: i < rows.slice(0, 6).length - 1 ? '1px solid var(--border-s)' : undefined,
                      }}
                    >
                      <dt style={{ fontSize: '11px', fontWeight: 500, color: 'var(--t3)' }}>{row.term}</dt>
                      <dd style={{ fontSize: '13px', fontWeight: 500, color: 'var(--t1)', textAlign: 'right', fontStyle: row.italic ? 'italic' : undefined }}>
                        {row.def}
                      </dd>
                    </div>
                  ))
                })()}
              </dl>
              {animal.scientificName != null && (
                <div style={{ marginTop: '12px' }}>
                  <p style={hairlineLabelStyle}>SCIENTIFIC NAME</p>
                  <p style={{ fontSize: '15px', fontWeight: 500, fontStyle: 'italic', color: 'var(--t1)', marginTop: '4px' }}>
                    {animal.scientificName}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Photo Gallery (conditional) ───────────────────────────── */}
      {galleryItems != null && (
        <div className="mt-6">
          <p style={hairlineLabelStyle}>PHOTO GALLERY</p>
          {/* Phone: horizontal scroll row. iPad (md+): 3-column grid.
              Tailwind w-[80vw] is overridden by md:w-auto at the grid breakpoint. */}
          <ul
            role="list"
            className="flex flex-row overflow-x-auto scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible gap-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {galleryItems.map((item, i) => (
              <li
                key={i}
                role="listitem"
                className="shrink-0 w-[80vw] md:w-auto"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div
                  style={{
                    aspectRatio: '4/3',
                    borderRadius: 'var(--r-md)',
                    overflow: 'hidden',
                    background: 'var(--elev)',
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Section 6: Amazing Adaptations (conditional) ─────────────────────── */}
      {animal.adaptations != null && animal.adaptations.length > 0 && (
        <div className="mt-6">
          <p style={hairlineLabelStyle}>AMAZING ADAPTATIONS</p>
          <ul>
            {animal.adaptations.slice(0, 4).map((adaptation, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: i < Math.min(animal.adaptations!.length, 4) - 1
                    ? '1px solid var(--border-s)'
                    : undefined,
                }}
              >
                {/* Icon circle */}
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    background: 'var(--purple-sub)',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={12} strokeWidth={2} style={{ color: 'var(--purple-t)' }} />
                </span>
                <p style={{ fontSize: '14px', fontWeight: 400, color: 'var(--t2)', lineHeight: 1.6 }}>
                  {adaptation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Section 7: Habitat (conditional — unchanged from v2) ──────────────── */}
      {animal.habitatDetail != null && (() => {
        const imgUrl = getHabitatImageUrl(animal.habitat)
        return (
          <div className="mt-6">
            <p style={hairlineLabelStyle}>HABITAT</p>
            {imgUrl && (
              <div
                className="w-full overflow-hidden mb-3"
                style={{ aspectRatio: '3/1', borderRadius: 'var(--r-lg)', background: 'var(--elev)' }}
              >
                <img
                  src={imgUrl}
                  alt={`${animal.habitat} habitat`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div
              style={{
                background: 'var(--elev)',
                border: '1px solid var(--border-s)',
                borderRadius: 'var(--r-lg)',
                padding: '16px',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t1)', marginBottom: '6px' }}>
                {animal.habitat}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 400, color: 'var(--t2)', lineHeight: '1.6' }}>
                {animal.habitatDetail}
              </p>
            </div>
          </div>
        )
      })()}

      {/* ── Section 8: Daily Life (always) ────────────────────────────────────── */}
      <AnimalDailyLife animal={animal} className="mt-6" />

      {/* ── Section 9: Reproduction (conditional) ────────────────────────────── */}
      {animal.reproduction != null && reproTiles.length > 0 && (
        <div className="mt-6">
          <p style={hairlineLabelStyle}>BABIES AND REPRODUCTION</p>
          <div
            style={{
              background: 'var(--elev)',
              border: '1px solid var(--border-s)',
              borderRadius: 'var(--r-lg)',
              padding: '16px',
            }}
          >
            {/* Tile grid: phone 2-col, iPad 4-col */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {reproTiles.map((tile, i) => {
                const isLast = i === reproTiles.length - 1
                const isOdd = reproTiles.length % 2 !== 0
                return (
                  <div
                    key={tile.label}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border-s)',
                      borderRadius: 'var(--r-md)',
                      padding: '12px',
                      gridColumn: isLast && isOdd ? 'span 2' : undefined,
                    }}
                  >
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: 'var(--t3)',
                    }}>
                      {tile.label}
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--t1)', marginTop: '4px' }}>
                      {tile.value}
                    </p>
                  </div>
                )
              })}
            </div>
            {/* Parental care full-width block */}
            {animal.reproduction.parentalCare != null && (
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border-s)',
                  borderRadius: 'var(--r-md)',
                  padding: '12px',
                  marginTop: '8px',
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: 400, color: 'var(--t2)', lineHeight: 1.6 }}>
                  {animal.reproduction.parentalCare}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 10: Predators (conditional — present if predators != null) ── */}
      {animal.predators != null && (
        <div className="mt-6">
          <p style={hairlineLabelStyle}>PREDATORS</p>
          {animal.predators.length === 0 ? (
            // Apex predator tile
            <div
              style={{
                background: 'var(--amber-sub)',
                border: '1px solid rgba(245,166,35,.3)',
                borderRadius: 'var(--r-lg)',
                padding: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <Shield size={20} strokeWidth={2} style={{ color: 'var(--amber-t)', flexShrink: 0 }} />
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--amber-t)' }}>
                Apex predator — nothing hunts this animal in the wild.
              </p>
            </div>
          ) : (
            // Predator pills
            <ul
              role="list"
              aria-label="Predators"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
            >
              {animal.predators.map((predator, i) => (
                <li
                  key={i}
                  role="listitem"
                  style={{
                    background: 'var(--red-sub)',
                    border: '1px solid rgba(239,70,111,.3)',
                    color: 'var(--red-t)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '4px 12px',
                    borderRadius: '100px',
                  }}
                >
                  {predator}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Section 11: Where It Lives (conditional) ──────────────────────────── */}
      {animal.geographicRange != null && (
        <div className="mt-6">
          <p style={hairlineLabelStyle}>WHERE IT LIVES</p>
          <div
            style={{
              background: 'var(--elev)',
              border: '1px solid var(--border-s)',
              borderRadius: 'var(--r-lg)',
              padding: '16px',
            }}
          >
            {/* Icon row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Globe size={16} strokeWidth={2} style={{ color: 'var(--blue-t)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t3)' }}>Region:</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--t1)' }}>{animal.region}</span>
            </div>
            {/* Separator */}
            <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-s)' }} />
            {/* Range text */}
            <p style={{ marginTop: '10px', fontSize: '14px', fontWeight: 400, color: 'var(--t2)', lineHeight: 1.6 }}>
              {animal.geographicRange}
            </p>
          </div>
        </div>
      )}

      {/* ── Section 12: Social Life (conditional) ─────────────────────────────── */}
      <AnimalSocialLife animal={animal} className="mt-6" />

      {/* ── Section 13: Conservation Status (always) ──────────────────────────── */}
      <AnimalConservationStatus animal={animal} className="mt-6" />

      {/* ── Section 14: Care Needs OR Habitat Threats (conditional) ──────────── */}
      <AnimalCareOrThreats animal={animal} className="mt-6" />

      {/* ── Section 15: Cultural Significance (conditional) ───────────────────── */}
      {animal.culturalSignificance != null && (
        <div className="mt-6">
          <p style={hairlineLabelStyle}>DID YOU KNOW?</p>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border-s)',
              borderLeft: '3px solid var(--purple)',
              borderRadius: 'var(--r-lg)',
              padding: '16px 16px 16px 20px',
            }}
          >
            <p style={{ fontSize: '15px', fontWeight: 400, color: 'var(--t2)', lineHeight: 1.7 }}>
              {animal.culturalSignificance}
            </p>
          </div>
        </div>
      )}

      {/* ── Section 16: Fun Facts (always) ────────────────────────────────────── */}
      <AnimalFunFacts animal={animal} className="mt-6" />

      {/* ── Section 17: CTA Block (always) ────────────────────────────────────── */}
      <AnimalDetailCTA
        animal={animal}
        onGenerate={handleGenerate}
        onMarketplace={handleMarketplace}
        className="mt-8"
      />
    </div>
  )
}
