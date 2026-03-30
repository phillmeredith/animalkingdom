// cardCatalogue.ts — catalogue lookup for educational-games card data
// Source: src/data/card_catalogue_200.json (200-entry static dataset)
// This module is the single access point for catalogue lookups.
// No runtime fetch — imported directly as a static JSON module.

import rawCatalogue from '@/data/card_catalogue_200.json'
import type { CollectedCard } from '@/lib/db'

// ─── Catalogue entry type ─────────────────────────────────────────────────────

export interface CardCatalogueEntry {
  id: string
  name: string
  animalType: string
  breed: string
  category: string
  conservationStatus: string | null
  region: string | null
  countries: string[]
  coordinates: { lat: number; lng: number } | null
  biome: string | null
  altitudeRange: string | null
  stats: {
    speed: number
    strength: number
    stamina: number
    agility: number
    intelligence: number
  }
  wordSafariVocab: string[]
  coinRushFacts: Record<string, number | string>
  habitatBuilderRole: 'carnivore' | 'herbivore' | 'omnivore' | null
  habitatBuilderPrey: string[]
  habitatBuilderPredators: string[]
  worldQuestRegion: string | null
  worldQuestMigrates: boolean
  worldQuestMigrationRoute: string | null
}

export const CARD_CATALOGUE: CardCatalogueEntry[] =
  rawCatalogue as CardCatalogueEntry[]

// ─── Lookups ──────────────────────────────────────────────────────────────────

/**
 * Find the catalogue entry for a given [animalType, breed] pair.
 * Returns undefined when no match exists (e.g. animals not in the 200-card set).
 */
export function getCatalogueEntry(
  animalType: string,
  breed: string,
): CardCatalogueEntry | undefined {
  return CARD_CATALOGUE.find(
    c => c.animalType === animalType && c.breed === breed,
  )
}

/**
 * Accept a CollectedCard, look up the matching catalogue entry by [animalType, breed],
 * and return the card with catalogue fields merged in.
 * If no match is found, the card is returned unchanged.
 *
 * Used by useCardPacks when a new card is added to the DB. The returned object
 * should be used as the payload for db.collectedCards.add() or .update().
 */
export function enrichCardFromCatalogue(card: CollectedCard): CollectedCard {
  const entry = getCatalogueEntry(card.animalType, card.breed)
  if (!entry) return card

  return {
    ...card,
    coordinates: entry.coordinates ?? null,
    biome: entry.biome ?? null,
    region: entry.region ?? null,
    conservationStatus: entry.conservationStatus ?? null,
    countries: entry.countries,
    worldQuestMigrates: entry.worldQuestMigrates,
    wordSafariVocab: entry.wordSafariVocab,
    coinRushFacts: entry.coinRushFacts,
    habitatBuilderRole: entry.habitatBuilderRole ?? null,
    habitatBuilderPrey: entry.habitatBuilderPrey,
    habitatBuilderPredators: entry.habitatBuilderPredators,
    worldQuestRegion: entry.worldQuestRegion ?? null,
    worldQuestMigrationRoute: entry.worldQuestMigrationRoute ?? null,
  }
}
