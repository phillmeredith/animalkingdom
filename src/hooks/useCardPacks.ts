// useCardPacks — card collection and pack opening
// Depends on: useWallet

import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayString } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { ANIMALS } from '@/data/animals'
import type { CardStats, CollectedCard, Rarity } from '@/lib/db'
import { enrichCardFromCatalogue } from '@/lib/cardCatalogue'

export interface PackDef {
  id: string
  name: string
  description: string
  price: number
  cardCount: number
  rarityWeights: Record<Rarity, number>
}

export const PACK_DEFS: PackDef[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: '3 cards — mostly common, chance of uncommon',
    price: 50,
    cardCount: 3,
    rarityWeights: { common: 65, uncommon: 25, rare: 8, epic: 2, legendary: 0 },
  },
  {
    id: 'adventure',
    name: 'Adventure Pack',
    description: '5 cards — guaranteed uncommon, rare possible',
    price: 120,
    cardCount: 5,
    rarityWeights: { common: 45, uncommon: 35, rare: 15, epic: 4, legendary: 1 },
  },
  {
    id: 'legendary',
    name: 'Legendary Pack',
    description: '5 cards — guaranteed rare, legendary possible',
    price: 350,
    cardCount: 5,
    rarityWeights: { common: 10, uncommon: 30, rare: 40, epic: 15, legendary: 5 },
  },
]

function rollRarity(weights: Record<Rarity, number>): Rarity {
  const total = Object.values(weights).reduce((s, w) => s + w, 0)
  let roll = Math.random() * total
  for (const [rarity, weight] of Object.entries(weights) as [Rarity, number][]) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return 'common'
}

function pickAnimalForRarity(rarity: Rarity): { animalType: string; breed: string; name: string; imageUrl: string } {
  // Filter animals by implied rarity from their data, or pick randomly
  const pool = ANIMALS.filter(a => {
    if (rarity === 'legendary') return ['Lion', 'Tiger', 'Snow Leopard', 'Jaguar', 'Cheetah'].includes(a.animalType)
    if (rarity === 'epic') return ['Wolf', 'Bear', 'Eagle', 'Shark'].some(t => a.animalType.includes(t))
    if (rarity === 'rare') return a.category === 'Wild' || a.category === 'Lost World'
    if (rarity === 'uncommon') return a.category === 'Stables' || a.category === 'Sea'
    return true
  })
  const source = pool.length > 0 ? pool : ANIMALS
  const animal = source[Math.floor(Math.random() * source.length)]
  return {
    animalType: animal.animalType,
    breed: animal.breed,
    name: `${animal.breed} ${animal.animalType}`,
    imageUrl: animal.imageUrl,
  }
}

// ─── Stat generation ──────────────────────────────────────────────────────────

/** Rarity → [min, max] inclusive range for each stat roll. */
const RARITY_STAT_RANGES: Record<Rarity, [number, number]> = {
  common:    [20, 45],
  uncommon:  [35, 60],
  rare:      [50, 75],
  epic:      [65, 85],
  legendary: [80, 100],
}

/** Roll a single integer stat in the range [min, max] inclusive. */
function rollStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generate a full set of 5 independent stats seeded from rarity. */
function rollStats(rarity: Rarity): CardStats {
  const [min, max] = RARITY_STAT_RANGES[rarity]
  return {
    speed:        rollStat(min, max),
    strength:     rollStat(min, max),
    stamina:      rollStat(min, max),
    agility:      rollStat(min, max),
    intelligence: rollStat(min, max),
  }
}

/** Generate flavour text for a newly collected card. */
function generateDescription(rarity: Rarity, breed: string, animalType: string): string {
  return `A ${rarity} ${breed} ${animalType} with remarkable natural abilities.`
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OpenedCard {
  animalType: string
  breed: string
  name: string
  rarity: Rarity
  imageUrl: string
  isNew: boolean
}

export function useCardPacks() {
  const { spend } = useWallet()

  const cards = useLiveQuery(
    () => db.collectedCards.toArray(),
    [],
    [] as CollectedCard[],
  )

  const packHistory = useLiveQuery(
    () => db.packHistory.orderBy('id').reverse().limit(20).toArray(),
    [],
    [],
  )

  async function openPack(packId: string): Promise<{ success: boolean; cards: OpenedCard[]; reason?: string }> {
    const def = PACK_DEFS.find(p => p.id === packId)
    if (!def) return { success: false, cards: [], reason: 'Unknown pack' }

    const openedCards: OpenedCard[] = []

    try {
      // All writes — spend debit + card inserts/updates + pack history — in one transaction.
      // spend() uses db.playerWallet + db.transactions internally; Dexie reuses this outer
      // transaction for those tables since they are a subset of what we declare here.
      await db.transaction(
        'rw',
        db.playerWallet, db.transactions, db.collectedCards, db.packHistory,
        async () => {
          const paid = await spend(def.price, def.name, 'cards')
          if (!paid.ok) throw new Error(paid.reason ?? 'Not enough coins')

          const existingCards = await db.collectedCards.toArray()

          for (let i = 0; i < def.cardCount; i++) {
            const rarity = rollRarity(def.rarityWeights)
            const animal = pickAnimalForRarity(rarity)
            const existing = existingCards.find(
              c => c.animalType === animal.animalType && c.breed === animal.breed,
            )
            const isNew = !existing

            if (existing?.id) {
              await db.collectedCards.update(existing.id, {
                duplicateCount: existing.duplicateCount + 1,
                updatedAt: new Date(),
              })
            } else {
              // Build the base record with progression defaults, then enrich with
              // catalogue data (coordinates, biome, vocab, facts, etc.) from the
              // 200-card static dataset. If no catalogue match, card is stored
              // without catalogue fields — they remain undefined and are handled
              // gracefully by game hooks.
              const baseCard: CollectedCard = {
                animalType: animal.animalType,
                breed: animal.breed,
                name: animal.name,
                rarity,
                imageUrl: animal.imageUrl,
                duplicateCount: 0,
                firstCollectedAt: new Date(),
                updatedAt: new Date(),
                stats: rollStats(rarity),
                description: generateDescription(rarity, animal.breed, animal.animalType),
                // v17 progression defaults
                level: 1,
                xp: 0,
                yearLevel: 1,
                gameHistory: {
                  wordSafari: 0,
                  coinRush: 0,
                  habitatBuilder: 0,
                  worldQuest: 0,
                },
                habitatBuilderState: null,
              }
              await db.collectedCards.add(enrichCardFromCatalogue(baseCard))
            }

            openedCards.push({ ...animal, rarity, isNew })
          }

          await db.packHistory.add({
            date: todayString(),
            cardsReceived: openedCards.map(c => ({
              animalType: c.animalType,
              breed: c.breed,
              rarity: c.rarity,
              isNew: c.isNew,
            })),
            createdAt: new Date(),
          })
        },
      )
    } catch (err) {
      return {
        success: false,
        cards: [],
        reason: err instanceof Error ? err.message : 'Failed to open pack',
      }
    }

    return { success: true, cards: openedCards }
  }

  const totalCards = cards.length
  const newToday = packHistory
    .filter(h => h.date === todayString())
    .reduce((s, h) => s + h.cardsReceived.filter(c => c.isNew).length, 0)

  return {
    cards,
    packHistory,
    totalCards,
    newToday,
    openPack,
  }
}
