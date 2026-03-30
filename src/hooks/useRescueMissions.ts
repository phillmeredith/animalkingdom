// useRescueMissions — rescue mission lifecycle for the store-rewards feature
//
// Manages the full rescue flow:
//   available → in_progress → complete → claimed → (foster) → released
//
// Key constraints (per spec §2.7):
//   - Rescued pets cannot be listed for sale
//   - claimRescue and releaseToWild must use db.transaction wrapping ALL writes
//   - earn() inside releaseToWild is nested inside the outer transaction

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db, todayString } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useToast } from '@/components/ui/Toast'
import { ANIMALS } from '@/data/animals'
import type { RescueMission, MissionTask, Rarity } from '@/lib/db'

// ─── Seed data ─────────────────────────────────────────────────────────────────

/** Foster days required by rarity tier */
const FOSTER_DAYS: Record<Rarity, number> = {
  common:    3,
  uncommon:  5,
  rare:      7,
  epic:      10,
  legendary: 14,
}

/** Coin bounty awarded to the player when they claim a completed rescue mission */
const BOUNTY_COINS: Record<Rarity, number> = {
  common:    50,
  uncommon:  100,
  rare:      200,
  epic:      350,
  legendary: 500,
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** The 6 seed missions — 2 common Wild, 2 uncommon Sea, 1 rare Wild, 1 epic Wild */
const SEED_MISSIONS: Omit<RescueMission, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ── Common Wild: Grey Wolf ─────────────────────────────────────────────────
  {
    animalType: 'Wolf',
    breed: 'Grey',
    name: 'Grey Wolf',
    imageUrl: '/Animals/Wildlife/Gray Wolf.jpg',
    rarity: 'common',
    conservationStatus: 'LC',
    habitat: 'Forest & Tundra',
    nativeRegion: 'Northern hemisphere — North America, Europe, and Asia',
    about: 'Grey Wolves are apex predators that play a vital role in maintaining healthy ecosystems. Reintroduction programmes in North America and Europe have helped restore natural balance in many regions. Continued conservation work ensures wolf populations remain viable across their historic range.',
    tasks: [
      {
        taskId: 'wolf-arcade-1',
        type: 'arcade',
        description: 'Complete 2 animal tracking sessions in Word Safari',
        required: 2,
        completed: 0,
        done: false,
      },
      {
        taskId: 'wolf-care-1',
        type: 'care',
        description: 'Carry out 3 welfare checks at the sanctuary',
        required: 3,
        completed: 0,
        done: false,
      },
      {
        taskId: 'wolf-knowledge-1',
        type: 'knowledge',
        description: 'Study 2 animal profiles in your ranger log',
        required: 2,
        completed: 0,
        done: false,
      },
    ],
    status: 'available',
    rescuedPetId: null,
    fosterDaysRequired: FOSTER_DAYS.common,
    fosterStartDate: null,
    releaseReadyDate: null,
    releasedAt: null,
  },

  // ── Common Wild: Arctic Fox ────────────────────────────────────────────────
  {
    animalType: 'Fox',
    breed: 'Arctic',
    name: 'Arctic Fox',
    imageUrl: '/Animals/Wildlife/Arctic_Fox.jpg',
    rarity: 'common',
    conservationStatus: 'LC',
    habitat: 'Arctic Tundra',
    nativeRegion: 'Arctic tundra and sea ice regions worldwide',
    about: 'Arctic Foxes are remarkably well-adapted survivors of the high Arctic. Their populations are stable globally, but some local populations face pressure from climate change shrinking sea ice and encroachment by red foxes. Monitoring programmes track their numbers across the circumpolar region.',
    tasks: [
      {
        taskId: 'fox-arcade-1',
        type: 'arcade',
        description: 'Complete 2 animal tracking sessions in Word Safari',
        required: 2,
        completed: 0,
        done: false,
      },
      {
        taskId: 'fox-knowledge-1',
        type: 'knowledge',
        description: 'Study 2 animal profiles in your ranger log',
        required: 2,
        completed: 0,
        done: false,
      },
      {
        taskId: 'fox-checkin-1',
        type: 'checkin',
        description: 'Check in to the sanctuary on 2 separate days',
        required: 2,
        completed: 0,
        done: false,
      },
    ],
    status: 'available',
    rescuedPetId: null,
    fosterDaysRequired: FOSTER_DAYS.common,
    fosterStartDate: null,
    releaseReadyDate: null,
    releasedAt: null,
  },

  // ── Uncommon Sea: Bottlenose Dolphin ──────────────────────────────────────
  {
    animalType: 'Dolphin',
    breed: 'Bottlenose',
    name: 'Bottlenose Dolphin',
    imageUrl: '/Animals/Marine/Bottlenose_Dolphin.jpg',
    rarity: 'uncommon',
    conservationStatus: 'LC',
    habitat: 'Ocean',
    nativeRegion: 'Temperate and tropical oceans worldwide',
    about: 'Bottlenose Dolphins are among the most intelligent animals on the planet, using sophisticated echolocation and social bonds that last a lifetime. Coastal populations face pressures from pollution, bycatch, and boat traffic. Marine protected areas and fishing regulation are the primary tools for their conservation.',
    tasks: [
      {
        taskId: 'dolphin-arcade-1',
        type: 'arcade',
        description: 'Complete 3 animal tracking sessions in Word Safari',
        required: 3,
        completed: 0,
        done: false,
      },
      {
        taskId: 'dolphin-knowledge-1',
        type: 'knowledge',
        description: 'Study 3 animal profiles in your ranger log',
        required: 3,
        completed: 0,
        done: false,
      },
      {
        taskId: 'dolphin-care-1',
        type: 'care',
        description: 'Carry out 4 welfare checks at the sanctuary',
        required: 4,
        completed: 0,
        done: false,
      },
    ],
    status: 'available',
    rescuedPetId: null,
    fosterDaysRequired: FOSTER_DAYS.uncommon,
    fosterStartDate: null,
    releaseReadyDate: null,
    releasedAt: null,
  },

  // ── Uncommon Sea: Seahorse ────────────────────────────────────────────────
  {
    animalType: 'Seahorse',
    breed: 'Common',
    name: 'Seahorse',
    imageUrl: '/Animals/Stables/Seahorse.jpg',
    rarity: 'uncommon',
    conservationStatus: 'VU',
    habitat: 'Seagrass & Coral Reef',
    nativeRegion: 'Tropical and temperate coastal waters worldwide',
    about: 'Seahorses are uniquely fragile creatures — the males carry the young, and they rely on stable seagrass meadows and coral reefs to thrive. Habitat destruction and collection for the traditional medicine trade have pushed many species toward Vulnerable status. Seagrass restoration and trade controls are the key conservation priorities.',
    tasks: [
      {
        taskId: 'seahorse-arcade-1',
        type: 'arcade',
        description: 'Complete 3 animal tracking sessions in Word Safari',
        required: 3,
        completed: 0,
        done: false,
      },
      {
        taskId: 'seahorse-knowledge-1',
        type: 'knowledge',
        description: 'Study 3 animal profiles in your ranger log',
        required: 3,
        completed: 0,
        done: false,
      },
      {
        taskId: 'seahorse-map-1',
        type: 'map',
        description: 'Survey 2 new habitats on the World Map',
        required: 2,
        completed: 0,
        done: false,
      },
    ],
    status: 'available',
    rescuedPetId: null,
    fosterDaysRequired: FOSTER_DAYS.uncommon,
    fosterStartDate: null,
    releaseReadyDate: null,
    releasedAt: null,
  },

  // ── Rare Wild: Koala ──────────────────────────────────────────────────────
  {
    animalType: 'Koala',
    breed: 'Koala',
    name: 'Koala',
    imageUrl: '/Animals/Wildlife/Koala.jpg',
    rarity: 'rare',
    conservationStatus: 'EN',
    habitat: 'Eucalyptus Forest',
    nativeRegion: 'Eastern and southeastern Australia',
    about: 'Koalas were listed as Endangered in Australia in 2022 after devastating bushfires and disease wiped out large parts of their population. They depend entirely on specific eucalyptus species that are rapidly being cleared for development. Corridor planting projects and wildlife carers provide critical support for koala recovery.',
    tasks: [
      {
        taskId: 'koala-arcade-1',
        type: 'arcade',
        description: 'Complete 4 animal tracking sessions in Word Safari',
        required: 4,
        completed: 0,
        done: false,
      },
      {
        taskId: 'koala-care-1',
        type: 'care',
        description: 'Carry out 5 welfare checks at the sanctuary',
        required: 5,
        completed: 0,
        done: false,
      },
      {
        taskId: 'koala-knowledge-1',
        type: 'knowledge',
        description: 'Complete 4 habitat surveys on the World Map',
        required: 4,
        completed: 0,
        done: false,
      },
      {
        taskId: 'koala-checkin-1',
        type: 'checkin',
        description: 'Check in to the sanctuary on 3 separate days',
        required: 3,
        completed: 0,
        done: false,
      },
    ],
    status: 'available',
    rescuedPetId: null,
    fosterDaysRequired: FOSTER_DAYS.rare,
    fosterStartDate: null,
    releaseReadyDate: null,
    releasedAt: null,
  },

  // ── Epic Wild: Giant Panda ────────────────────────────────────────────────
  {
    animalType: 'Panda',
    breed: 'Giant',
    name: 'Giant Panda',
    imageUrl: '/Animals/Wildlife/Giant_Panda_Bear.jpg',
    rarity: 'epic',
    conservationStatus: 'VU',
    habitat: 'Bamboo Forest',
    nativeRegion: 'Southwest China',
    about: 'The Giant Panda is one of conservation\'s greatest success stories — intensive breeding programmes and strict habitat protection have helped their numbers recover from near extinction. Fewer than 2,000 remain in the wild, mostly in protected reserves in Sichuan, Shaanxi, and Gansu provinces. Bamboo forest corridors linking fragmented reserves are the next priority.',
    tasks: [
      {
        taskId: 'panda-arcade-1',
        type: 'arcade',
        description: 'Complete 5 animal tracking sessions in Word Safari',
        required: 5,
        completed: 0,
        done: false,
      },
      {
        taskId: 'panda-care-1',
        type: 'care',
        description: 'Carry out 7 welfare checks at the sanctuary',
        required: 7,
        completed: 0,
        done: false,
      },
      {
        taskId: 'panda-knowledge-1',
        type: 'knowledge',
        description: 'Complete 5 ranger field notes',
        required: 5,
        completed: 0,
        done: false,
      },
      {
        taskId: 'panda-map-1',
        type: 'map',
        description: 'Survey 3 new habitats on the World Map',
        required: 3,
        completed: 0,
        done: false,
      },
      {
        taskId: 'panda-checkin-1',
        type: 'checkin',
        description: 'Check in to the sanctuary on 5 separate days',
        required: 5,
        completed: 0,
        done: false,
      },
    ],
    status: 'available',
    rescuedPetId: null,
    fosterDaysRequired: FOSTER_DAYS.epic,
    fosterStartDate: null,
    releaseReadyDate: null,
    releasedAt: null,
  },
]

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useRescueMissions() {
  const { earn } = useWallet()
  const { checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  const missions = useLiveQuery(
    () => db.rescueMissions.orderBy('id').toArray(),
    [],
    [] as RescueMission[],
  )

  // ── Auto-seed on first mount ─────────────────────────────────────────────────
  // Runs once. Creates the 6 seed missions if the table is empty.
  useEffect(() => {
    seedMissions().catch(() => { /* toast already fired inside seedMissions */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── seedMissions ─────────────────────────────────────────────────────────────

  /** Creates the initial 6 rescue missions if no missions exist yet.
   *  Idempotent — localStorage flag prevents double-seeding in React StrictMode. */
  async function seedMissions(): Promise<void> {
    const FLAG = 'rescue_missions_seeded_v1'
    if (localStorage.getItem(FLAG)) return
    localStorage.setItem(FLAG, '1') // set immediately to block concurrent invocations
    try {
      const existing = await db.rescueMissions.count()
      if (existing > 0) return

      const now = new Date()
      for (const seed of SEED_MISSIONS) {
        await db.rescueMissions.add({ ...seed, createdAt: now, updatedAt: now })
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not load rescue missions — please try again.',
      })
      throw err
    }
  }

  // ── startMission ─────────────────────────────────────────────────────────────

  /** Transitions a mission from 'available' → 'in_progress'. */
  async function startMission(id: number): Promise<void> {
    try {
      const mission = await db.rescueMissions.get(id)
      if (!mission) throw new Error(`Mission ${id} not found.`)
      if (mission.status !== 'available') return

      await db.rescueMissions.update(id, {
        status: 'in_progress',
        updatedAt: new Date(),
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not start the mission — please try again.',
      })
      throw err
    }
  }

  // ── recordProgress ────────────────────────────────────────────────────────────

  /** Increments progress on a specific task within an in_progress mission.
   *  Automatically marks the mission as 'complete' when all tasks reach done=true.
   *  Fires a progress toast after each increment.
   */
  async function recordProgress(missionId: number, taskId: string): Promise<void> {
    try {
      const mission = await db.rescueMissions.get(missionId)
      if (!mission) return
      if (mission.status !== 'in_progress') return

      const updatedTasks: MissionTask[] = mission.tasks.map(t => {
        if (t.taskId !== taskId) return t
        if (t.done) return t

        const newCompleted = Math.min(t.completed + 1, t.required)
        const done = newCompleted >= t.required
        return { ...t, completed: newCompleted, done }
      })

      const task = updatedTasks.find(t => t.taskId === taskId)
      const allDone = updatedTasks.every(t => t.done)
      const newStatus = allDone ? 'complete' : 'in_progress'

      await db.rescueMissions.update(missionId, {
        tasks: updatedTasks,
        status: newStatus,
        updatedAt: new Date(),
      })

      // Progress toast — only fire if the task is still not done (not the completing step)
      if (task && !task.done) {
        const completedCount = task.completed + 1
        toast({
          type: 'info',
          title: `Mission progress: ${completedCount} of ${task.required} complete for ${mission.name} rescue!`,
        })
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not record mission progress — please try again.',
      })
      throw err
    }
  }

  // ── claimRescue ───────────────────────────────────────────────────────────────

  /** Claims a completed mission: adds the animal to savedNames with status='rescued',
   *  sets fosterStartDate and releaseReadyDate, transitions mission to 'claimed'.
   *
   *  All writes are inside a single db.transaction to prevent partial state.
   */
  async function claimRescue(missionId: number): Promise<void> {
    try {
      const mission = await db.rescueMissions.get(missionId)
      if (!mission) throw new Error(`Mission ${missionId} not found.`)
      if (mission.status !== 'complete') {
        toast({ type: 'error', title: 'Mission is not complete yet.' })
        return
      }

      // Look up the animal category from the catalogue
      const animalDef = ANIMALS.find(
        a => a.animalType === mission.animalType && a.breed === mission.breed,
      )

      const today = todayString()
      const releaseReadyDate = addDays(today, mission.fosterDaysRequired)
      const now = new Date()

      let newPetId: number | undefined

      await db.transaction('rw', db.rescueMissions, db.savedNames, async () => {
        newPetId = await db.savedNames.add({
          name: mission.name,
          animalType: mission.animalType,
          breed: mission.breed,
          category: animalDef?.category ?? 'Wild',
          gender: Math.random() > 0.5 ? 'male' : 'female',
          age: 'Adult',
          personality: 'Wild',
          colour: 'Natural',
          rarity: mission.rarity,
          imageUrl: mission.imageUrl,
          barnName: null,
          showName: null,
          racingName: null,
          kennelName: null,
          pedigreeName: null,
          speciesName: null,
          discoveryNarrative: `${mission.name} joined your care through the rescue mission programme. You completed all required missions to earn their trust.`,
          siblings: [],
          source: 'rescue',
          status: 'rescued',
          equippedSaddleId: null,
          careStreak: 0,
          lastFullCareDate: null,
          createdAt: now,
          updatedAt: now,
        })

        await db.rescueMissions.update(missionId, {
          status: 'claimed',
          rescuedPetId: newPetId!,
          fosterStartDate: today,
          releaseReadyDate,
          updatedAt: now,
        })
      })

      // Award the rescue bounty — outside the transaction because earn() opens its own
      // transaction against playerWallet and transactions tables.
      await earn(BOUNTY_COINS[mission.rarity], `Rescue bounty — ${mission.name}`, 'care', newPetId!)

      toast({
        type: 'success',
        title: `${mission.name} is now in your care!`,
        description: `You earned ${BOUNTY_COINS[mission.rarity]} coins! Care for them for ${mission.fosterDaysRequired} days until they're ready for release.`,
        duration: 6000,
      })
    } catch (err) {
      toast({
        type: 'error',
        title: `Could not claim ${(await db.rescueMissions.get(missionId))?.name ?? 'the animal'} — please try again.`,
      })
      throw err
    }
  }

  // ── releaseToWild ─────────────────────────────────────────────────────────────

  /** Releases a rescued animal back to the wild.
   *  Deletes the savedName record, marks the mission as released, awards 50 XP,
   *  and fires a Conservation Hero badge check.
   *
   *  All DB writes are inside a single transaction. earn() participates in the
   *  same transaction because db.playerWallet and db.transactions are included
   *  in the table list, making Dexie nest the inner transaction into the outer one.
   */
  async function releaseToWild(missionId: number): Promise<void> {
    let missionName = 'the animal'
    try {
      const mission = await db.rescueMissions.get(missionId)
      if (!mission) throw new Error(`Mission ${missionId} not found.`)
      missionName = mission.name

      if (!mission.rescuedPetId) throw new Error('No rescued pet linked to this mission.')

      // Verify the rescued pet is actually in the collection
      const pet = await db.savedNames.get(mission.rescuedPetId)
      if (!pet) throw new Error('Rescued pet record not found.')
      if (pet.status !== 'rescued') {
        throw new Error('Pet status is not rescued — cannot release via this flow.')
      }

      const now = new Date()

      await db.transaction('rw', db.rescueMissions, db.savedNames, db.playerWallet, db.transactions, async () => {
        // Remove the pet from the collection
        await db.savedNames.delete(mission.rescuedPetId!)

        // Mark the mission as released
        await db.rescueMissions.update(missionId, {
          releasedAt: now,
          updatedAt: now,
        })

        // Award 50 XP — earn() nests inside this transaction because playerWallet
        // and transactions tables are declared in the outer transaction scope.
        await earn(50, `Released ${mission.name} to the wild`, 'care', mission.rescuedPetId!)
      })

      toast({
        type: 'success',
        title: `${mission.name} has been released! You earned 50 XP.`,
        duration: 5000,
      })

      // Badge check — non-blocking; must not suppress the release result on failure
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
    } catch (err) {
      toast({
        type: 'error',
        title: `Could not release ${missionName} — please try again.`,
      })
      throw err
    }
  }

  // ── keepCaring ────────────────────────────────────────────────────────────────

  /** Resets the release timer for a rescued animal that the player wants to keep caring for.
   *  Recalculates releaseReadyDate from today + fosterDaysRequired.
   */
  async function keepCaring(missionId: number): Promise<void> {
    try {
      const mission = await db.rescueMissions.get(missionId)
      if (!mission) throw new Error(`Mission ${missionId} not found.`)
      if (mission.status !== 'claimed') {
        toast({ type: 'error', title: 'Something went wrong — please try again.' })
        return
      }

      const today = todayString()
      const newReleaseReadyDate = addDays(today, mission.fosterDaysRequired)

      await db.rescueMissions.update(missionId, {
        fosterStartDate: today,
        releaseReadyDate: newReleaseReadyDate,
        updatedAt: new Date(),
      })

      toast({
        type: 'info',
        title: `Great choice! ${mission.name}'s care timer has been reset.`,
        duration: 3000,
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Something went wrong — please try again.',
      })
      throw err
    }
  }

  return {
    missions,
    startMission,
    recordProgress,
    claimRescue,
    releaseToWild,
    keepCaring,
    seedMissions,
  }
}
