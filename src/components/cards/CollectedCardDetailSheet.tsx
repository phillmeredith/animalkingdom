// CollectedCardDetailSheet — view-only bottom sheet for a single collected card
// Implements: spec/features/card-collection-detail/interaction-spec.md
// Phase C — Frontend Engineer
//
// Sheet anatomy:
//   BottomSheet (glass surface, portal, spring animation)
//   └── Inner container: max-w-xl mx-auto w-full px-6 pt-2 pb-10
//       ├── Section 1 — Hero (image, name row, subtitle)
//       ├── Section 2 — Stats block (5 labelled progress bars)
//       ├── Section 2b — Card progression (Story 10: level + XP bar)
//       ├── Section 2c — Game history (Story 10: 4 game rows)
//       ├── Section 3 — Duplicates pill (conditional — only when duplicateCount > 0)
//       ├── Section 4 — Description (flavour text)
//       └── Section 5 — Ability (conditional — only when ability is non-empty)
//
// No action buttons. No footer. View-only per spec.

import type { ReactNode } from 'react'
import { Zap, Coins, Leaf, Microscope, Globe } from 'lucide-react'
import { BottomSheet } from '@/components/ui/Modal'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import type { CollectedCard, CardStats, Rarity } from '@/lib/db'

// ─── XP threshold (Owner decision: XP per level = 50 × level number) ──────────

function xpThreshold(level: number): number {
  return 50 * level
}

// ─── Level pill (tint-pair by level range) ────────────────────────────────────
//
// Lv 1–3: neutral (var(--card) bg, var(--border-s) border, var(--t3) text)
// Lv 4–6: green tint-pair
// Lv 7–10: amber tint-pair
// Never solid fill + white text — tint-pair only.

function LevelPillSmall({ level }: { level: number }) {
  const bg     = level <= 3 ? 'var(--card)'      : level <= 6 ? 'var(--green-sub)' : 'var(--amber-sub)'
  const border = level <= 3 ? 'var(--border-s)'  : level <= 6 ? 'var(--green)'    : 'var(--amber)'
  const color  = level <= 3 ? 'var(--t3)'        : level <= 6 ? 'var(--green-t)'  : 'var(--amber-t)'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-700"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      Lv {level}
    </span>
  )
}

// ─── Game history row data ─────────────────────────────────────────────────────
//
// Game accent colours from the game DEFS in PlayHubScreen (canonical reference).
// Using DS tokens only — no hardcoded hex.

interface GameHistoryRowDef {
  key: keyof CollectedCard['gameHistory']
  label: string
  icon: ReactNode
  accentSub: string
  accent: string
  accentText: string
}

const GAME_HISTORY_ROWS: GameHistoryRowDef[] = [
  {
    key:       'coinRush',
    label:     'Coin Rush',
    icon:      <Coins size={16} />,
    accentSub: 'var(--amber-sub)',
    accent:    'var(--amber)',
    accentText:'var(--amber-t)',
  },
  {
    key:       'wordSafari',
    label:     'Word Safari',
    icon:      <Leaf size={16} />,
    accentSub: 'var(--green-sub)',
    accent:    'var(--green)',
    accentText:'var(--green-t)',
  },
  {
    key:       'habitatBuilder',
    label:     'Habitat Builder',
    icon:      <Microscope size={16} />,
    accentSub: 'var(--blue-sub)',
    accent:    'var(--blue)',
    accentText:'var(--blue-t)',
  },
  {
    key:       'worldQuest',
    label:     'World Quest',
    icon:      <Globe size={16} />,
    accentSub: 'var(--purple-sub)',
    accent:    'var(--purple)',
    accentText:'var(--purple-t)',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface CollectedCardDetailSheetProps {
  card: CollectedCard | null
  open: boolean
  onClose: () => void
}

// ─── Rarity → stat bar fill token ─────────────────────────────────────────────
//
// Solid fill only — bars are narrow data visualisation elements, not badges.
// Tint-pair pattern (sub + text) is reserved for badges and pills per DS rules.
//
// Rarity  │ Token         │ Hex
// ─────────┼───────────────┼──────────
// common   │ var(--t4)     │ #52566A
// uncommon │ var(--green)  │ #45B26B
// rare     │ var(--blue)   │ #3772FF
// epic     │ var(--purple) │ #9757D7
// legendary│ var(--amber)  │ #F5A623

function rarityFillToken(rarity: Rarity): string {
  switch (rarity) {
    case 'legendary': return 'var(--amber)'
    case 'epic':      return 'var(--purple)'
    case 'rare':      return 'var(--blue)'
    case 'uncommon':  return 'var(--green)'
    default:          return 'var(--t4)'
  }
}

// ─── Stat rows definition ─────────────────────────────────────────────────────
//
// Order is fixed per spec: SPEED, STRENGTH, STAMINA, AGILITY, INTELLIGENCE

const STAT_ROWS: Array<{ label: string; key: keyof CardStats }> = [
  { label: 'SPEED',        key: 'speed'        },
  { label: 'STRENGTH',     key: 'strength'     },
  { label: 'STAMINA',      key: 'stamina'      },
  { label: 'AGILITY',      key: 'agility'      },
  { label: 'INTELLIGENCE', key: 'intelligence' },
]

// ─── Stats block ──────────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  fillColor,
  isLast,
}: {
  label: string
  value: number
  fillColor: string
  isLast: boolean
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ marginBottom: isLast ? 0 : 10 }}
    >
      {/* Label — fixed 100px so all bars left-align regardless of label length */}
      <span
        className="shrink-0 uppercase text-[var(--t3)]"
        style={{
          width: 100,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.5px',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>

      {/* Track */}
      <div
        className="flex-1 rounded-[100px]"
        style={{
          height: 6,
          background: 'var(--border-s)',
        }}
      >
        {/* Fill — no animation per spec: bars render at full state immediately */}
        <div
          className="rounded-[100px]"
          style={{
            height: 6,
            width: `${value}%`,
            background: fillColor,
          }}
        />
      </div>

      {/* Numeric value — fixed 28px, right-aligned */}
      <span
        className="shrink-0 text-right text-[var(--t1)]"
        style={{
          width: 28,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Sheet body ───────────────────────────────────────────────────────────────
//
// Separated from the BottomSheet wrapper so the null guard runs before any hooks
// in child components can fire on an absent card.

function SheetBody({ card }: { card: CollectedCard }) {
  const fillColor = rarityFillToken(card.rarity)
  const hasAbility = typeof card.ability === 'string' && card.ability.length > 0

  return (
    // Inner container — spec: px-6 pt-2 pb-10 max-w-xl mx-auto w-full
    <div className="px-6 pt-2 pb-10 max-w-xl mx-auto w-full">

      {/* ── Section 1 — Hero ─────────────────────────────────────────────── */}

      {/* Hero image: full-width within max-w-xl, 4:3 aspect, r-lg (16px)
          The aspect-ratio wrapper ensures the fallback div and the img both
          respect the 4/3 constraint without a style prop on AnimalImage.     */}
      <div style={{ aspectRatio: '4/3', width: '100%' }}>
        <AnimalImage
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full rounded-[var(--r-lg)] object-cover"
          fallbackClassName="w-full h-full rounded-[var(--r-lg)]"
        />
      </div>

      {/* Name row — card name + rarity badge */}
      <div
        className="flex items-center justify-between"
        style={{ gap: 8, marginTop: 16 }}
      >
        <h2
          className="truncate text-[var(--t1)]"
          style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.35 }}
        >
          {card.name}
        </h2>
        <RarityBadge rarity={card.rarity} className="shrink-0" />
      </div>

      {/* Subtitle — breed · animalType */}
      <p
        className="text-[var(--t3)]"
        style={{ fontSize: 13, fontWeight: 400, marginTop: 4 }}
      >
        {card.breed} · {card.animalType}
      </p>

      {/* ── Section 2 — Stats block ──────────────────────────────────────── */}

      <div style={{ marginTop: 20 }}>
        {STAT_ROWS.map((row, index) => (
          <StatBar
            key={row.key}
            label={row.label}
            value={card.stats[row.key]}
            fillColor={fillColor}
            isLast={index === STAT_ROWS.length - 1}
          />
        ))}
      </div>

      {/* ── Section 2b — Card progression ───────────────────────────────── */}
      {/*
        Inserted between Stats and Duplicates per Story 10 spec.
        Level bar: "Level N" left, "xp / threshold XP" right.
        Progress bar: var(--blue) fill, 8px height, rounded-full.
        Level badge: tint-pair by level range — never solid fill + white.
      */}
      <div style={{ marginTop: 20 }}>
        {/* Section heading */}
        <p
          className="uppercase tracking-widest text-[var(--t3)]"
          style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}
        >
          Progress
        </p>

        {/* Level row */}
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-2">
            <LevelPillSmall level={card.level ?? 1} />
            <span
              className="text-[var(--t1)]"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              Level {card.level ?? 1}
            </span>
          </div>
          <span
            className="text-[var(--t3)]"
            style={{ fontSize: 13, fontWeight: 400 }}
          >
            {card.xp ?? 0} / {xpThreshold(card.level ?? 1)} XP
          </span>
        </div>

        {/* XP progress bar */}
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 8, background: 'var(--border-s)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(((card.xp ?? 0) / xpThreshold(card.level ?? 1)) * 100, 100)}%`,
              background: 'var(--blue)',
            }}
          />
        </div>
      </div>

      {/* ── Section 2c — Game history ─────────────────────────────────────── */}
      {/*
        4 rows, one per game. Uses tint-pair badge for session count.
        If 0 sessions: shows "Not played yet" in 12px/400 var(--t3).
        Section heading: 11px/700 uppercase var(--t3).
      */}
      <div style={{ marginTop: 20 }}>
        {/* Section heading */}
        <p
          className="uppercase tracking-widest text-[var(--t3)]"
          style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}
        >
          Games played
        </p>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {GAME_HISTORY_ROWS.map(row => {
            const sessions = card.gameHistory?.[row.key] ?? 0
            return (
              <div
                key={row.key}
                className="flex items-center gap-3"
                style={{ minHeight: 32 }}
              >
                {/* Game icon in accent tint circle */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: row.accentSub }}
                >
                  <span style={{ color: row.accentText }}>{row.icon}</span>
                </div>

                {/* Game name */}
                <span
                  className="flex-1 text-[var(--t1)]"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {row.label}
                </span>

                {/* Session count badge or "Not played yet" */}
                {sessions > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-700"
                      style={{
                        background: row.accentSub,
                        border: `1px solid ${row.accent}`,
                        color: row.accentText,
                      }}
                    >
                      {sessions}
                    </span>
                    <span
                      className="text-[var(--t2)]"
                      style={{ fontSize: 12, fontWeight: 400 }}
                    >
                      sessions
                    </span>
                  </div>
                ) : (
                  <span
                    className="text-[var(--t3)]"
                    style={{ fontSize: 12, fontWeight: 400 }}
                  >
                    Not played yet
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 3 — Duplicates pill (conditional) ────────────────────── */}
      {/*
        Rendered only when duplicateCount > 0.
        Display value is duplicateCount + 1 because duplicateCount counts extra
        copies beyond the first (duplicateCount: 2 = 3 total copies owned).
      */}
      {card.duplicateCount > 0 && (
        <div className="flex items-center" style={{ marginTop: 16 }}>
          <div
            className="inline-flex items-center"
            style={{
              gap: 6,
              padding: '4px 10px',
              borderRadius: 100,
              background: 'var(--elev)',
              border: '1px solid var(--border-s)',
            }}
          >
            <span
              className="text-[var(--t3)]"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              ×{card.duplicateCount + 1} copies
            </span>
          </div>
        </div>
      )}

      {/* ── Section 4 — Description (flavour text) ───────────────────────── */}
      {/*
        Always renders — even when description is an empty string.
        An empty <p> is acceptable; it signals a data gap, not a UI error (per spec).
      */}
      <p
        className="text-[var(--t2)]"
        style={{
          fontSize: 13,
          fontWeight: 400,
          fontStyle: 'italic',
          lineHeight: 1.5,
          marginTop: 16,
        }}
      >
        {card.description}
      </p>

      {/* ── Section 5 — Ability section (conditional) ────────────────────── */}
      {/*
        Rendered only when ability is a non-empty string.
        In the initial build, ability is always undefined — this section never renders.
        The conditional is correct so future data populates it without a code change.
      */}
      {hasAbility && (
        <div style={{ marginTop: 20 }}>
          {/* Separator */}
          <div
            style={{
              height: 1,
              background: 'var(--border-s)',
              marginBottom: 16,
            }}
          />

          {/* Header row — Zap icon (rarity-coded) + ability name */}
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Lucide Zap only — no emoji. Colour is the same rarity token as stat bars. */}
            <Zap size={16} strokeWidth={2} style={{ color: fillColor, flexShrink: 0 }} />
            <span
              className="text-[var(--t1)]"
              style={{ fontSize: 15, fontWeight: 600 }}
            >
              {card.ability}
            </span>
          </div>

          {/* Ability description */}
          {card.abilityDescription && (
            <p
              className="text-[var(--t2)]"
              style={{ fontSize: 13, fontWeight: 400, marginTop: 4 }}
            >
              {card.abilityDescription}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CollectedCardDetailSheet ─────────────────────────────────────────────────
//
// Wraps SheetBody in the BottomSheet glass surface.
// Delegates portal rendering, scroll lock, and spring animation to BottomSheet.
//
// The sheet carries aria-modal="true" via the BottomSheet's role="dialog" wrapper.
// Focus trap and focus restoration on close are handled by BottomSheet internally.

export function CollectedCardDetailSheet({
  card,
  open,
  onClose,
}: CollectedCardDetailSheetProps) {
  // Spec: if card is null or undefined, sheet does not render its body.
  // BottomSheet itself still renders (AnimatePresence needs the open prop to
  // animate out), but we short-circuit the content so nothing is displayed.

  return (
    <BottomSheet
      isOpen={open}
      onClose={onClose}
      // No title — spec uses a name row with RarityBadge inside the content,
      // not a separate header. Passing no title suppresses the header chrome.
    >
      {card ? (
        <SheetBody card={card} />
      ) : null}
    </BottomSheet>
  )
}
