// useProgress — manages skill XP, puzzle history, badges, and year-level progression
// Leaf hook — no dependencies on other hooks

import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSkillProgress } from '@/lib/db'
import type { SkillProgress, Badge, SkillArea } from '@/lib/db'
import { BADGE_CATALOGUE } from '@/data/badges'
import { useToast } from '@/components/ui/Toast'

// XP thresholds per tier boundary (cumulative)
// Tier 1→2: 40 XP, Tier 2→3: 105 XP (40+65), Tier 3→4: 190 XP (40+65+85)
const TIER_THRESHOLDS = [0, 40, 105, 190]

function xpToTier(xp: number): number {
  for (let t = TIER_THRESHOLDS.length - 1; t >= 0; t--) {
    if (xp >= TIER_THRESHOLDS[t]) return t + 1
  }
  return 1
}

// ─── Year level constants ─────────────────────────────────────────────────────

/** Number of consecutive sessions that must exceed the accuracy threshold. */
const YEAR_PROGRESSION_WINDOW = 3
/** Minimum accuracy (0–100) required in each of the last N sessions to advance. */
const YEAR_PROGRESSION_THRESHOLD = 80
/** Maximum size of the recentAccuracy rolling window. */
const RECENT_ACCURACY_MAX = 15

export function useProgress() {
  const { toast } = useToast()

  // Initialise skill rows once on mount (separate from the live query)
  useEffect(() => {
    ensureSkillProgress()
  }, [])

  const skills = useLiveQuery(
    () => db.skillProgress.toArray(),
    [],
    [] as SkillProgress[],
  )

  const badges = useLiveQuery(
    () => db.badges.toArray(),
    [],
    [] as Badge[],
  )

  const gamerLevel = Math.floor(
    skills.reduce((sum, s) => sum + s.xp, 0) / 100,
  )

  function getSkill(area: SkillArea): SkillProgress {
    return (
      skills.find(s => s.area === area) ?? {
        area,
        xp: 0,
        tier: 1,
        totalCorrect: 0,
        totalAttempted: 0,
        currentStreak: 0,
        bestStreak: 0,
        gamesPlayed: 0,
        lastPlayedAt: null,
      }
    )
  }

  async function addXp(
    area: SkillArea,
    amount: number,
  ): Promise<{ newXp: number; tierChanged: boolean; newTier: number }> {
    const record = await db.skillProgress.where('area').equals(area).first()
    if (!record) throw new Error(`Skill area ${area} not found`)

    const newXp = record.xp + amount
    const oldTier = record.tier
    const newTier = xpToTier(newXp)
    const tierChanged = newTier !== oldTier

    await db.skillProgress.update(record.id!, {
      xp: newXp,
      tier: newTier,
    })

    return { newXp, tierChanged, newTier }
  }

  async function recordAnswer(
    area: SkillArea,
    questionId: string,
    tier: number,
    correct: boolean,
  ): Promise<void> {
    const now = new Date()
    await db.puzzleHistory.add({ area, questionId, tier, correct, answeredAt: now })

    const record = await db.skillProgress.where('area').equals(area).first()
    if (!record) return

    const newAttempted = record.totalAttempted + 1
    const newCorrect = correct ? record.totalCorrect + 1 : record.totalCorrect
    const newStreak = correct ? record.currentStreak + 1 : 0
    const newBest = Math.max(record.bestStreak, newStreak)

    await db.skillProgress.update(record.id!, {
      totalAttempted: newAttempted,
      totalCorrect: newCorrect,
      currentStreak: newStreak,
      bestStreak: newBest,
      lastPlayedAt: now,
    })
  }

  async function getRecentQuestions(area: SkillArea, limit = 20): Promise<string[]> {
    const recent = await db.puzzleHistory
      .where('area')
      .equals(area)
      .reverse()
      .limit(limit)
      .toArray()
    return recent.map(r => r.questionId)
  }

  async function getBadges(): Promise<Badge[]> {
    return db.badges.toArray()
  }

  async function awardBadge(
    badgeId: string,
    track: Badge['track'],
    rank: Badge['rank'],
    name: string,
    description: string,
  ): Promise<void> {
    const existing = await db.badges.where('badgeId').equals(badgeId).first()
    if (existing) return // already awarded
    await db.badges.add({
      badgeId,
      track,
      rank,
      name,
      description,
      iconUrl: null,
      earnedAt: new Date(),
    })
  }

  async function checkBadgeEligibility(): Promise<Badge[]> {
    try {
      // Deduplication: load all already-awarded badge IDs up front
      const awarded = new Set((await db.badges.toArray()).map(b => b.badgeId))

      // Reusable data loads (avoid redundant DB reads across criteria)
      const playerRaces       = await db.races.filter(r => r.status === 'finished' && r.playerEntryPetId != null).toArray()
      const skills            = await db.skillProgress.toArray()
      const careLogs          = await db.careLog.toArray()

      const newlyAwarded: Badge[] = []

      for (const def of BADGE_CATALOGUE) {
        // Skip if already awarded — awardBadge() also checks this, but skipping early
        // avoids running unnecessary criterion queries.
        if (awarded.has(def.badgeId)) continue

        let earned = false

        // ── Racing ──────────────────────────────────────────────────────────

        if (def.badgeId === 'racing-first-entry') {
          const entered = await db.races.filter(r => r.playerEntryPetId != null).first()
          earned = entered != null
        }

        else if (def.badgeId === 'racing-first-finish') {
          earned = playerRaces.length > 0
        }

        else if (def.badgeId === 'racing-podium') {
          earned = playerRaces.some(r => {
            const player = r.participants.find(p => p.isPlayer)
            return player != null && player.position != null && player.position <= 3
          })
        }

        else if (def.badgeId === 'racing-champion') {
          earned = playerRaces.some(r => {
            const player = r.participants.find(p => p.isPlayer)
            return r.type === 'championship' && player != null && player.position === 1
          })
        }

        // ── Arcade ──────────────────────────────────────────────────────────

        else if (def.badgeId === 'arcade-first-game') {
          earned = skills.some(s => s.gamesPlayed >= 1)
        }

        else if (def.badgeId === 'arcade-ten-games') {
          const totalGames = skills.reduce((sum, s) => sum + s.gamesPlayed, 0)
          earned = totalGames >= 10
        }

        else if (def.badgeId === 'arcade-streak-five') {
          earned = skills.some(s => s.bestStreak >= 5)
        }

        else if (def.badgeId === 'arcade-all-subjects') {
          const areas: SkillArea[] = ['maths', 'spelling', 'science', 'geography']
          earned = areas.every(a => skills.find(s => s.area === a && s.gamesPlayed >= 1))
        }

        // ── Care ────────────────────────────────────────────────────────────

        else if (def.badgeId === 'care-first-action') {
          const count = await db.careLog.count()
          earned = count >= 1
        }

        else if (def.badgeId === 'care-full-day') {
          // Group careLog entries by petId+date and check for feed+clean+play in same group
          const groups = new Map<string, Set<string>>()
          for (const entry of careLogs) {
            const key = `${entry.petId}:${entry.date}`
            if (!groups.has(key)) groups.set(key, new Set())
            groups.get(key)!.add(entry.action)
          }
          earned = Array.from(groups.values()).some(
            actions => actions.has('feed') && actions.has('clean') && actions.has('play'),
          )
        }

        else if (def.badgeId === 'care-streak-three') {
          try {
            const pet = await db.savedNames.where('careStreak').aboveOrEqual(3).first()
            earned = pet != null
          } catch {
            // Index not yet available — fall back to in-memory filter
            const pets = await db.savedNames.toArray()
            earned = pets.some(p => (p.careStreak ?? 0) >= 3)
          }
        }

        else if (def.badgeId === 'care-streak-seven') {
          try {
            const pet = await db.savedNames.where('careStreak').aboveOrEqual(7).first()
            earned = pet != null
          } catch {
            // Index not yet available — fall back to in-memory filter
            const pets = await db.savedNames.toArray()
            earned = pets.some(p => (p.careStreak ?? 0) >= 7)
          }
        }

        // ── Marketplace ─────────────────────────────────────────────────────

        else if (def.badgeId === 'market-first-buy') {
          const record = await db.savedNames.where('source').equals('marketplace').first()
          earned = record != null
        }

        else if (def.badgeId === 'market-first-sell') {
          const record = await db.transactions
            .filter(t => t.category === 'marketplace' && t.type === 'earn')
            .first()
          earned = record != null
        }

        else if (def.badgeId === 'market-five-trades') {
          const count = await db.transactions.where('category').equals('marketplace').count()
          earned = count >= 5
        }

        else if (def.badgeId === 'market-rare-buy') {
          const marketPets = await db.savedNames.where('source').equals('marketplace').toArray()
          earned = marketPets.some(p => ['rare', 'epic', 'legendary'].includes(p.rarity))
        }

        // ── Rescue ──────────────────────────────────────────────────────────

        else if (def.badgeId === 'rescue-first-animal') {
          const record = await db.savedNames.where('source').anyOf(['rescue', 'generate']).first()
          earned = record != null
        }

        else if (def.badgeId === 'rescue-five-animals') {
          const count = await db.savedNames.where('source').anyOf(['rescue', 'generate']).count()
          earned = count >= 5
        }

        else if (def.badgeId === 'rescue-rare-find') {
          const rescuePets = await db.savedNames.where('source').anyOf(['rescue', 'generate']).toArray()
          earned = rescuePets.some(p => ['rare', 'epic', 'legendary'].includes(p.rarity))
        }

        else if (def.badgeId === 'rescue-ten-animals') {
          const count = await db.savedNames.where('source').anyOf(['rescue', 'generate']).count()
          earned = count >= 10
        }

        if (earned) {
          // awardBadge() handles its own deduplication guard internally
          await awardBadge(def.badgeId, def.track, def.rank, def.name, def.description)
          // Read back the persisted record to return the exact DB-written Badge
          const badge = await db.badges.where('badgeId').equals(def.badgeId).first()
          if (badge) {
            newlyAwarded.push(badge)
            // Add to awarded set so subsequent iterations in the same call skip this badge
            awarded.add(def.badgeId)
          }
        }
      }

      return newlyAwarded
    } catch (err) {
      // Badge checks are non-critical — never surface to the user as a toast.
      // Log to console so errors remain diagnosable without interrupting gameplay.
      console.error('[checkBadgeEligibility]', err)
      return []
    }
  }

  /**
   * Record `sessionAccuracy` (0–100) for a skill area after a game session.
   * If the last YEAR_PROGRESSION_WINDOW entries in recentAccuracy are all ≥
   * YEAR_PROGRESSION_THRESHOLD AND the current yearLevel is below 3, yearLevel
   * advances by 1 and recentAccuracy is cleared.
   *
   * yearLevel never decreases.
   * Story 8: year-level auto-progression.
   */
  async function checkYearProgression(
    area: SkillArea,
    sessionAccuracy: number,
  ): Promise<{ advanced: boolean; newLevel: 1 | 2 | 3 }> {
    try {
      return await db.transaction('rw', db.skillProgress, async () => {
        const record = await db.skillProgress.where('area').equals(area).first()
        if (!record) throw new Error(`Skill area ${area} not found`)

        // Append new accuracy, then trim the rolling window.
        const updated = [...(record.recentAccuracy ?? []), sessionAccuracy]
        const trimmed = updated.slice(-RECENT_ACCURACY_MAX)

        const currentYearLevel = record.yearLevel ?? 1

        // Check whether the last N entries all meet the threshold.
        const canAdvance = currentYearLevel < 3
        const lastN = trimmed.slice(-YEAR_PROGRESSION_WINDOW)
        const thresholdMet =
          lastN.length >= YEAR_PROGRESSION_WINDOW &&
          lastN.every(a => a >= YEAR_PROGRESSION_THRESHOLD)

        if (canAdvance && thresholdMet) {
          const newLevel = (currentYearLevel + 1) as 1 | 2 | 3
          await db.skillProgress.update(record.id!, {
            yearLevel: newLevel,
            recentAccuracy: [],  // reset window after advancing
          })
          return { advanced: true, newLevel }
        }

        // No advancement — persist the updated accuracy window only.
        await db.skillProgress.update(record.id!, {
          recentAccuracy: trimmed,
        })

        return { advanced: false, newLevel: currentYearLevel as 1 | 2 | 3 }
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not update your challenge level',
        description: 'Progress was not saved. Please try again.',
      })
      return { advanced: false, newLevel: 1 }
    }
  }

  /**
   * Record a newly discovered country on the geography skill's discoveredCountries
   * list. No-op if the country is already present.
   * Story 9 (World Quest integration).
   */
  async function discoverCountry(country: string): Promise<void> {
    try {
      await db.transaction('rw', db.skillProgress, async () => {
        const record = await db.skillProgress
          .where('area')
          .equals('geography')
          .first()
        if (!record) throw new Error('Geography skill area not found')

        const existing = record.discoveredCountries ?? []
        if (existing.includes(country)) return // already discovered — no-op

        await db.skillProgress.update(record.id!, {
          discoveredCountries: [...existing, country],
        })
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not save country discovery',
        description: 'Please try again.',
      })
    }
  }

  return {
    skills,
    badges,
    gamerLevel,
    getSkill,
    addXp,
    recordAnswer,
    getRecentQuestions,
    getBadges,
    awardBadge,
    checkBadgeEligibility,
    checkYearProgression,
    discoverCountry,
  }
}
