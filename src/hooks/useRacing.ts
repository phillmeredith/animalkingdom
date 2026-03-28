// useRacing — race generation, entry, simulation, and results
// Depends on: useWallet, useSavedNames

import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayString } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useToast } from '@/components/ui/Toast'
import { ANIMALS } from '@/data/animals'
import type { Race, RaceParticipant, RaceType, SavedName } from '@/lib/db'

// ─── Config ───────────────────────────────────────────────────────────────────

const RACE_CONFIGS: Record<RaceType, { name: string; runners: number; duration: number; entryFee: number; prizePool: number }> = {
  sprint:       { name: 'Sprint',       runners: 4,  duration: 1,  entryFee: 25,  prizePool: 80   },
  standard:     { name: 'Standard',     runners: 6,  duration: 3,  entryFee: 50,  prizePool: 200  },
  endurance:    { name: 'Endurance',    runners: 8,  duration: 5,  entryFee: 100, prizePool: 450  },
  championship: { name: 'Championship', runners: 8,  duration: 8,  entryFee: 200, prizePool: 1000 },
}

const PRIZE_DISTRIBUTION = [0.5, 0.25, 0.15, 0.10] // 1st to 4th — sums to 1.0 (R-02)

const NPC_RACERS = [
  'Thunder', 'Blaze', 'Storm', 'Arrow', 'Comet', 'Rocket', 'Flash', 'Bolt',
]

const NPC_BREEDS = [
  'Thoroughbred', 'Arabian', 'Quarter Horse', 'Appaloosa', 'Mustang', 'Friesian',
]

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateNpcParticipant(): RaceParticipant {
  return {
    name: NPC_RACERS[Math.floor(Math.random() * NPC_RACERS.length)],
    breed: NPC_BREEDS[Math.floor(Math.random() * NPC_BREEDS.length)],
    isPlayer: false,
    petId: null,
    baseSpeed: randomBetween(40, 85),
    saddleBonus: randomBetween(0, 15),
    randomFactor: 0,
    totalScore: null,
    position: null,
    prize: null,
  }
}

function simulateRace(participants: RaceParticipant[]): RaceParticipant[] {
  const scored = participants.map(p => ({
    ...p,
    randomFactor: randomBetween(-10, 10),
    totalScore: p.baseSpeed + p.saddleBonus + randomBetween(-10, 10),
  }))

  scored.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))

  return scored.map((p, i) => ({
    ...p,
    position: i + 1,
    prize: null, // calculated separately based on prize pool
  }))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRacing() {
  const { earn, spend } = useWallet()
  const { checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  const races = useLiveQuery(
    () => db.races.orderBy('id').reverse().limit(20).toArray(),
    [],
    [] as Race[],
  )

  // TD-004 fix: renamed from openRaces — this collection includes both 'open' and 'running' races
  const activeRaces = races.filter(r => r.status === 'open' || r.status === 'running')
  const finishedRaces = races.filter(r => r.status === 'finished').slice(0, 5)

  async function generateDailyRaces(): Promise<void> {
    // Daily gate: skip if any open race was already generated today (QA-041)
    const today = todayString()
    const openRacesList = await db.races.where('status').equals('open').toArray()
    const alreadyGeneratedToday = openRacesList.some(
      r => r.createdAt.toISOString().slice(0, 10) === today,
    )
    if (alreadyGeneratedToday) return

    // Also skip if there are already enough open races (legacy guard)
    if (openRacesList.length >= 3) return

    const types: RaceType[] = ['sprint', 'standard', 'endurance', 'championship']
    const now = new Date()

    for (const type of types) {
      const config = RACE_CONFIGS[type]
      const npcCount = config.runners - 1 // leave 1 slot for player

      const participants: RaceParticipant[] = Array.from({ length: npcCount }, generateNpcParticipant)

      await db.races.add({
        name: `${config.name} Race`,
        type,
        entryFee: config.entryFee,
        prizePool: config.prizePool,
        maxRunners: config.runners,
        duration: config.duration,
        participants,
        playerEntryPetId: null,
        status: 'open',
        scheduledAt: now,
        startsAt: new Date(now.getTime() + 60 * 1000),
        finishesAt: new Date(now.getTime() + (config.duration + 1) * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  async function enterRace(raceId: number, pet: SavedName): Promise<{ success: boolean; reason?: string }> {
    // Pre-condition guards — read-only, outside the write transaction boundary
    const race = await db.races.get(raceId)
    if (!race || race.status !== 'open') return { success: false, reason: 'Race not available' }
    if (race.playerEntryPetId !== null) return { success: false, reason: 'Already entered' }

    // Saddle bonus lookup — read-only, outside the write transaction boundary
    const saddleBonus = pet.equippedSaddleId
      ? (await db.ownedItems.get(pet.equippedSaddleId))?.statBoost?.value ?? 0
      : 0

    const playerParticipant: RaceParticipant = {
      name: pet.name,
      breed: pet.breed,
      isPlayer: true,
      petId: pet.id!,
      baseSpeed: randomBetween(50, 80),
      saddleBonus,
      randomFactor: 0,
      totalScore: null,
      position: null,
      prize: null,
    }

    // TD-001 fix: spend() and db.races.update() must succeed or fail together.
    // spend() internally uses db.playerWallet + db.transactions — both listed here
    // so Dexie nests the inner transaction correctly within this outer boundary.
    let entrySucceeded = false
    await db.transaction('rw', db.races, db.playerWallet, db.transactions, async () => {
      const paid = await spend(race.entryFee, `Race entry: ${race.name}`, 'racing', race.id)
      if (!paid.ok) return // transaction aborts — no db.races.update() executed

      const now = new Date()
      await db.races.update(raceId, {
        participants: [...race.participants, playerParticipant],
        playerEntryPetId: pet.id!,
        status: 'running',
        updatedAt: now,
      })

      entrySucceeded = true
    })

    if (!entrySucceeded) return { success: false, reason: 'Not enough coins' }
    return { success: true }
  }

  async function resolveRace(raceId: number): Promise<{ position: number; prize: number; participants: RaceParticipant[] } | null> {
    // Pre-condition guard — read-only, outside the write transaction boundary
    const race = await db.races.get(raceId)
    if (!race || race.status !== 'running') return null

    // Pure computation — no side effects, executes before the transaction opens
    const results = simulateRace(race.participants)
    const withPrizes = results.map((p, i) => ({
      ...p,
      prize: i < PRIZE_DISTRIBUTION.length ? Math.floor(race.prizePool * PRIZE_DISTRIBUTION[i]) : 0,
    }))
    const playerResult = withPrizes.find(p => p.isPlayer)

    // TD-002 fix: db.races.update() and earn() must succeed or fail together.
    // earn() internally uses db.playerWallet + db.transactions — both listed here
    // so Dexie nests the inner transaction correctly within this outer boundary.
    await db.transaction('rw', db.races, db.playerWallet, db.transactions, async () => {
      await db.races.update(raceId, {
        participants: withPrizes,
        status: 'finished',
        updatedAt: new Date(),
      })

      if (playerResult?.prize && playerResult.prize > 0) {
        await earn(
          playerResult.prize,
          `Race prize: ${race.name} (${playerResult.position}${ordinal(playerResult.position)} place)`,
          'racing',
          raceId,
        )
      }
    })

    // TD-003 fix: badge eligibility check after successful race resolution.
    // Called unconditionally — participation-based badges apply regardless of prize.
    // Non-blocking: errors must not propagate to the caller or suppress the result.
    checkBadgeEligibility()
      .then(newBadges => {
        newBadges.forEach((badge, i) => {
          setTimeout(() => {
            toast({
              type:        'success',
              title:       badge.name,
              description: 'You earned a badge!',
              duration:    6000,
            })
          }, i * 400)
        })
      })
      .catch(err =>
        toast({ type: 'error', title: 'Badge check failed', description: (err as Error).message ?? 'Something went wrong' })
      )

    return playerResult
      ? { position: playerResult.position!, prize: playerResult.prize ?? 0, participants: withPrizes }
      : null
  }

  return {
    races,
    activeRaces,
    finishedRaces,
    generateDailyRaces,
    enterRace,
    resolveRace,
  }
}

function ordinal(n: number): string {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}
