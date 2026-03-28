// badges.ts — static badge catalogue for Animal Kingdom
// 20 badges across 5 tracks: racing, arcade, care, marketplace, rescue
// Rank → DS colour mapping: bronze=amber tint, silver=blue tint, gold=purple tint
// icon field: Lucide icon name string — resolved to component at render time
// criteria field: human-readable documentation only — logic lives in checkBadgeEligibility()

import type { Badge } from '@/lib/db'

export interface BadgeDefinition {
  badgeId: string
  track:   Badge['track']
  rank:    Badge['rank']
  name:    string
  description: string
  icon:    string  // Lucide icon name — resolved to component at render time
  criteria: string // Human-readable documentation only
}

export const BADGE_CATALOGUE: BadgeDefinition[] = [
  // ─── Racing (4) ───────────────────────────────────────────────────────────

  {
    badgeId:     'racing-first-entry',
    track:       'racing',
    rank:        'bronze',
    name:        'First Start',
    description: 'You entered your first race.',
    icon:        'Flag',
    criteria:    'races table has at least 1 record where playerEntryPetId IS NOT NULL',
  },
  {
    badgeId:     'racing-first-finish',
    track:       'racing',
    rank:        'bronze',
    name:        'Race Day',
    description: 'You finished your first race.',
    icon:        'Trophy',
    criteria:    'races table has at least 1 finished record where playerEntryPetId IS NOT NULL',
  },
  {
    badgeId:     'racing-podium',
    track:       'racing',
    rank:        'silver',
    name:        'Podium Finish',
    description: 'You came in the top three.',
    icon:        'Medal',
    criteria:    'races table has at least 1 finished record where the player participant has position <= 3',
  },
  {
    badgeId:     'racing-champion',
    track:       'racing',
    rank:        'gold',
    name:        'Champion',
    description: 'You won a Championship race.',
    icon:        'Crown',
    criteria:    'races table has at least 1 finished record where type = championship and the player participant has position = 1',
  },

  // ─── Arcade (4) ───────────────────────────────────────────────────────────

  {
    badgeId:     'arcade-first-game',
    track:       'arcade',
    rank:        'bronze',
    name:        'Game On',
    description: 'You played your first arcade game.',
    icon:        'Gamepad2',
    criteria:    'skillProgress has at least 1 record where gamesPlayed >= 1',
  },
  {
    badgeId:     'arcade-ten-games',
    track:       'arcade',
    rank:        'bronze',
    name:        'Getting Good',
    description: 'You played 10 arcade games.',
    icon:        'Gamepad2',
    criteria:    'Sum of gamesPlayed across all skillProgress rows is >= 10',
  },
  {
    badgeId:     'arcade-streak-five',
    track:       'arcade',
    rank:        'silver',
    name:        'On a Roll',
    description: 'You got 5 right answers in a row.',
    icon:        'Zap',
    criteria:    'skillProgress has at least 1 record where bestStreak >= 5',
  },
  {
    badgeId:     'arcade-all-subjects',
    track:       'arcade',
    rank:        'gold',
    name:        'All-Rounder',
    description: 'You played every subject.',
    icon:        'Star',
    criteria:    'skillProgress has a record with gamesPlayed >= 1 for each of: maths, spelling, science, geography',
  },

  // ─── Care (4) ─────────────────────────────────────────────────────────────

  {
    badgeId:     'care-first-action',
    track:       'care',
    rank:        'bronze',
    name:        'Kind Heart',
    description: 'You looked after an animal for the first time.',
    icon:        'Heart',
    criteria:    'careLog has at least 1 record',
  },
  {
    badgeId:     'care-full-day',
    track:       'care',
    rank:        'bronze',
    name:        'Full Care',
    description: 'You fed, cleaned, and played with an animal in one day.',
    icon:        'CheckCircle',
    criteria:    'careLog has at least 3 records sharing the same petId + date, one each for feed, clean, play',
  },
  {
    badgeId:     'care-streak-three',
    track:       'care',
    rank:        'silver',
    name:        'Devoted',
    description: 'You cared for an animal three days in a row.',
    icon:        'CalendarCheck',
    criteria:    'savedNames has at least 1 record where careStreak >= 3',
  },
  {
    badgeId:     'care-streak-seven',
    track:       'care',
    rank:        'gold',
    name:        'Best Friend',
    description: 'You cared for an animal seven days in a row.',
    icon:        'Award',
    criteria:    'savedNames has at least 1 record where careStreak >= 7',
  },

  // ─── Marketplace (4) ──────────────────────────────────────────────────────

  {
    badgeId:     'market-first-buy',
    track:       'marketplace',
    rank:        'bronze',
    name:        'First Purchase',
    description: 'You bought your first animal at the market.',
    icon:        'ShoppingBag',
    criteria:    'savedNames has at least 1 record where source = marketplace',
  },
  {
    badgeId:     'market-first-sell',
    track:       'marketplace',
    rank:        'bronze',
    name:        'First Sale',
    description: 'You sold your first animal at the market.',
    icon:        'Tag',
    criteria:    'transactions has at least 1 record where category = marketplace AND type = earn',
  },
  {
    badgeId:     'market-five-trades',
    track:       'marketplace',
    rank:        'silver',
    name:        'Trader',
    description: 'You made 5 trades at the market.',
    icon:        'ArrowLeftRight',
    criteria:    'Count of transactions where category = marketplace is >= 5',
  },
  {
    badgeId:     'market-rare-buy',
    track:       'marketplace',
    rank:        'gold',
    name:        'Rare Find',
    description: 'You bought a rare or better animal.',
    icon:        'Gem',
    criteria:    'savedNames has at least 1 record where source = marketplace AND rarity IN (rare, epic, legendary)',
  },

  // ─── Rescue (4) ───────────────────────────────────────────────────────────

  {
    badgeId:     'rescue-first-animal',
    track:       'rescue',
    rank:        'bronze',
    name:        'Rescuer',
    description: 'You rescued your first animal.',
    icon:        'PawPrint',
    criteria:    'savedNames has at least 1 record where source IN (rescue, generate)',
  },
  {
    badgeId:     'rescue-five-animals',
    track:       'rescue',
    rank:        'bronze',
    name:        'Animal Fan',
    description: 'You rescued 5 animals.',
    icon:        'PawPrint',
    criteria:    'Count of savedNames where source IN (rescue, generate) is >= 5',
  },
  {
    badgeId:     'rescue-rare-find',
    track:       'rescue',
    rank:        'silver',
    name:        'Rare Rescue',
    description: 'You found a rare animal.',
    icon:        'Sparkles',
    criteria:    'savedNames has at least 1 record where source IN (rescue, generate) AND rarity IN (rare, epic, legendary)',
  },
  {
    badgeId:     'rescue-ten-animals',
    track:       'rescue',
    rank:        'gold',
    name:        'Sanctuary',
    description: 'You have rescued 10 animals.',
    icon:        'Home',
    criteria:    'Count of savedNames where source IN (rescue, generate) is >= 10',
  },
]
