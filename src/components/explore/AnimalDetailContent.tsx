// AnimalDetailContent — EAD-4 through EAD-10
// The scrollable interior of AnimalDetailModal. Composes all content sections
// in the canonical order defined by the interaction spec Section 2 layout diagram.
//
// Section order (fixed, never reorders based on data availability):
//   Hero image
//   Category badge + region row
//   Superpower callout  (conditional — absent when superpower is null)
//   Quick stats row     (Habitat | Diet | Lifespan)
//   Habitat section     (conditional — image + description when habitatDetail present)
//   1. Daily Life       (always — placeholder if null)
//   2. Conservation Status (always — "Not Assessed" placeholder if null)
//   3. Social Life      (conditional)
//   4. Care Needs OR Habitat Threats (conditional)
//   5. Fun Facts        (always)
//   CTA block
//
// Content column: px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
// pt-4 is mandatory to clear the sticky glass header's bottom border.

import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { SuperpowerCallout } from './SuperpowerCallout'
import { AnimalQuickStats } from './AnimalQuickStats'
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

interface AnimalDetailContentProps {
  animal: AnimalEntry
  onClose: () => void
}

export function AnimalDetailContent({ animal, onClose }: AnimalDetailContentProps) {
  const navigate = useNavigate()

  function handleGenerate() {
    onClose()
    navigate(
      `/generate?type=${encodeURIComponent(animal.animalType)}&breed=${encodeURIComponent(animal.breed)}`,
    )
  }

  function handleMarketplace() {
    onClose()
    // Deep-link to the marketplace sell offers pre-filtered by this animal's name.
    // The StoreHubScreen reads ?tab=marketplace&search= and passes it to MarketplaceContent.
    navigate(`/shop?tab=marketplace&search=${encodeURIComponent(animal.name)}`)
  }

  return (
    // Content column: max-w-3xl centres content on iPad; pb-24 clears fixed nav.
    // pt-4 provides 16px breathing room below the sticky glass header border.
    <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">

      {/* ── Hero image ─────────────────────────────────────────────────────── */}
      {/* aspect-ratio 16/9, rounded-lg, full column width */}
      <div
        className="w-full overflow-hidden"
        style={{ aspectRatio: '16/9', borderRadius: 'var(--r-lg)' }}
      >
        <AnimalImage
          src={animal.imageUrl}
          alt={`${animal.name} photograph`}
          className="w-full h-full rounded-lg"
          fallbackClassName="w-full h-full rounded-lg"
        />
      </div>

      {/* ── Category badge + region row ────────────────────────────────────── */}
      {/* mt-4, flex gap-2, flex-wrap, align-items center */}
      <div
        className="flex gap-2 flex-wrap items-center mt-4"
      >
        {/* Category badge: neutral tint-pair pill. Hairline 11px/700. Not interactive. */}
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

        {/* Region indicator: MapPin 12px + Body Sm text. Not interactive. */}
        <span
          className="inline-flex items-center"
          style={{ gap: '4px', color: 'var(--t3)' }}
        >
          <MapPin size={12} strokeWidth={2} style={{ color: 'var(--t3)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--t3)', lineHeight: '1.4' }}>
            {animal.region}
          </span>
        </span>
      </div>

      {/* ── Superpower callout (conditional) ──────────────────────────────── */}
      {animal.superpower != null && (
        <SuperpowerCallout superpower={animal.superpower} className="mt-4" />
      )}

      {/* ── Quick stats row ────────────────────────────────────────────────── */}
      <AnimalQuickStats animal={animal} className="mt-4" />

      {/* ── Habitat section (conditional) ──────────────────────────────────── */}
      {/* Renders when habitatDetail is present. Shows image banner + description. */}
      {animal.habitatDetail != null && (() => {
        const imgUrl = getHabitatImageUrl(animal.habitat)
        return (
          <div className="mt-6">
            {/* Section heading */}
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--t3)', marginBottom: '12px' }}>
              Habitat
            </p>
            {/* Habitat image banner — 3:1 aspect ratio, rounded-lg */}
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
            {/* Habitat name + description */}
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

      {/* ── Content sections ───────────────────────────────────────────────── */}
      {/* Section order is fixed. Sections that are null collapse without a gap. */}

      {/* 1. Daily Life — always renders */}
      <AnimalDailyLife animal={animal} className="mt-6" />

      {/* 2. Conservation Status — always renders */}
      <AnimalConservationStatus animal={animal} className="mt-6" />

      {/* 3. Social Life — conditional (null → absent) */}
      <AnimalSocialLife animal={animal} className="mt-6" />

      {/* 4. Care Needs OR Habitat Threats — conditional, mutually exclusive */}
      <AnimalCareOrThreats animal={animal} className="mt-6" />

      {/* 5. Fun Facts — always renders */}
      <AnimalFunFacts animal={animal} className="mt-6" />

      {/* ── CTA block ──────────────────────────────────────────────────────── */}
      {/* mt-8, in document flow (not fixed). pb-24 on the column clears the nav. */}
      <AnimalDetailCTA
        animal={animal}
        onGenerate={handleGenerate}
        onMarketplace={handleMarketplace}
        className="mt-8"
      />
    </div>
  )
}
