// useCardProgression — card-level XP progression, stat deltas, and session tracking
// for the educational-games feature (Stories 7).
//
// Depends on: db (collectedCards), checkBadgeEligibility (arcade track)
//
// All DB writes are inside db.transaction('rw', ...) per CLAUDE.md transaction rules.
// Every async operation is wrapped in try/catch with a user-facing toast on error.

import { useCallback } from 'react'
import { db } from '@/lib/db'
import type { CardStats, Rarity } from '@/lib/db'
import { useProgress } from '@/hooks/useProgress'
import { useToast } from '@/components/ui/Toast'

// ─── XP thresholds ────────────────────────────────────────────────────────────

/**
 * XP required to complete level N (owner decision: N × 50).
 * Level 10 is the maximum — awarding XP at level 10 does nothing to level.
 */
function xpForLevel(level: number): number {
  return level * 50
}

const MAX_LEVEL = 10

// ─── Rarity progression ───────────────────────────────────────────────────────

/**
 * Determine whether a rarity upgrade applies at a given new level.
 * Level 4: common→uncommon, uncommon→rare
 * Level 7: uncommon→rare, rare→epic, epic→legendary
 */
function rarityUpgradeAt(level: number, currentRarity: Rarity): Rarity {
  if (level === 4) {
    if (currentRarity === 'common') return 'uncommon'
    if (currentRarity === 'uncommon') return 'rare'
  }
  if (level === 7) {
    if (currentRarity === 'uncommon') return 'rare'
    if (currentRarity === 'rare') return 'epic'
    if (currentRarity === 'epic') return 'legendary'
  }
  return currentRarity
}

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseCardProgressionReturn {
  /**
   * Award XP to a card after a correct answer. Handles level-up and rarity
   * promotion automatically. Returns the outcome so callers can show feedback.
   */
  awardXp(
    cardId: number,
    amount: number,
  ): Promise<{ leveledUp: boolean; newLevel: number; rarityIncreased: boolean }>

  /**
   * Apply a stat delta to a card (e.g. speed += 1). Result is clamped to 0–100.
   * Stat key must be one of the five CardStats fields.
   */
  applyStatDelta(
    cardId: number,
    stat: keyof CardStats,
    delta: number,
  ): Promise<void>

  /**
   * Increment the session count for a game area on a card, then check badge
   * eligibility for the arcade track. Must be called after every completed game
   * session per CLAUDE.md badge-eligibility rule.
   */
  recordSession(
    cardId: number,
    area: 'wordSafari' | 'coinRush' | 'habitatBuilder' | 'worldQuest',
  ): Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCardProgression(): UseCardProgressionReturn {
  const { checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  const awardXp = useCallback(async (
    cardId: number,
    amount: number,
  ): Promise<{ leveledUp: boolean; newLevel: number; rarityIncreased: boolean }> => {
    try {
      return await db.transaction('rw', db.collectedCards, async () => {
        const card = await db.collectedCards.get(cardId)
        if (!card) {
          throw new Error(`Card ${cardId} not found`)
        }

        // At max level: XP no longer accumulates — return no-change result.
        if (card.level >= MAX_LEVEL) {
          return { leveledUp: false, newLevel: MAX_LEVEL, rarityIncreased: false }
        }

        let currentLevel = card.level
        let currentXp = card.xp + amount
        let currentRarity = card.rarity
        let leveledUp = false
        let rarityIncreased = false

        // Drain XP across level boundaries until XP is within the current level
        // threshold, or max level is reached.
        while (currentLevel < MAX_LEVEL && currentXp >= xpForLevel(currentLevel)) {
          currentXp -= xpForLevel(currentLevel)
          currentLevel += 1
          leveledUp = true

          // Check whether this new level triggers a rarity upgrade.
          const upgradedRarity = rarityUpgradeAt(currentLevel, currentRarity)
          if (upgradedRarity !== currentRarity) {
            currentRarity = upgradedRarity
            rarityIncreased = true
          }
        }

        // At max level, cap XP at 0 (no overflow accumulation).
        if (currentLevel >= MAX_LEVEL) {
          currentXp = 0
        }

        await db.collectedCards.update(cardId, {
          level: currentLevel,
          xp: currentXp,
          rarity: currentRarity,
          updatedAt: new Date(),
        })

        return { leveledUp, newLevel: currentLevel, rarityIncreased }
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not save your progress',
        description: 'XP was not recorded. Please try again.',
      })
      // Return safe no-change result so callers do not crash.
      return { leveledUp: false, newLevel: 1, rarityIncreased: false }
    }
  }, [])

  const applyStatDelta = useCallback(async (
    cardId: number,
    stat: keyof CardStats,
    delta: number,
  ): Promise<void> => {
    try {
      await db.transaction('rw', db.collectedCards, async () => {
        const card = await db.collectedCards.get(cardId)
        if (!card) {
          throw new Error(`Card ${cardId} not found`)
        }

        const currentValue = card.stats[stat]
        const newValue = Math.max(0, Math.min(100, currentValue + delta))

        await db.collectedCards.update(cardId, {
          stats: { ...card.stats, [stat]: newValue },
          updatedAt: new Date(),
        })
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not update card stats',
        description: 'Your card stat change was not saved. Please try again.',
      })
    }
  }, [])

  const recordSession = useCallback(async (
    cardId: number,
    area: 'wordSafari' | 'coinRush' | 'habitatBuilder' | 'worldQuest',
  ): Promise<void> => {
    try {
      await db.transaction('rw', db.collectedCards, async () => {
        const card = await db.collectedCards.get(cardId)
        if (!card) {
          throw new Error(`Card ${cardId} not found`)
        }

        const currentHistory = card.gameHistory ?? {
          wordSafari: 0,
          coinRush: 0,
          habitatBuilder: 0,
          worldQuest: 0,
        }

        await db.collectedCards.update(cardId, {
          gameHistory: {
            ...currentHistory,
            [area]: (currentHistory[area] ?? 0) + 1,
          },
          updatedAt: new Date(),
        })
      })

      // Badge eligibility check after session is recorded.
      // Arcade track is badge-eligible per CLAUDE.md badge-eligibility rule.
      // checkBadgeEligibility is called outside the transaction — it opens its own
      // reads and does not modify collectedCards.
      await checkBadgeEligibility()
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not save your session',
        description: 'Game session was not recorded. Please try again.',
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkBadgeEligibility])

  return { awardXp, applyStatDelta, recordSession }
}
