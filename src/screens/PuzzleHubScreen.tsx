// PuzzleHubScreen — Arcade hub with 4 game cards
// Routes to individual game screens

import { useNavigate } from 'react-router-dom'
import { Coins, Leaf, Microscope, Globe, Flag } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProgress } from '@/hooks/useProgress'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { useWallet } from '@/hooks/useWallet'
import { cn } from '@/lib/utils'
import type { SkillArea } from '@/lib/db'

// ─── Game definitions ─────────────────────────────────────────────────────────

interface GameDef {
  area: SkillArea
  route: string
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: string
  accentSub: string
  accentText: string
}

const GAMES: GameDef[] = [
  {
    area: 'maths',
    route: '/play/coin-rush',
    icon: <Coins size={28} />,
    title: 'Coin Rush',
    subtitle: 'Animal maths challenges',
    accent: 'var(--amber)',
    accentSub: 'var(--amber-sub)',
    accentText: 'var(--amber-t)',
  },
  {
    area: 'spelling',
    route: '/play/word-safari',
    icon: <Leaf size={28} />,
    title: 'Word Safari',
    subtitle: 'Animal spelling adventure',
    accent: 'var(--green)',
    accentSub: 'var(--green-sub)',
    accentText: 'var(--green-t)',
  },
  {
    area: 'science',
    route: '/play/habitat-builder',
    icon: <Microscope size={28} />,
    title: 'Habitat Builder',
    subtitle: 'Animal science quiz',
    accent: 'var(--blue)',
    accentSub: 'var(--blue-sub)',
    accentText: 'var(--blue-t)',
  },
  {
    area: 'geography',
    route: '/play/world-quest',
    icon: <Globe size={28} />,
    title: 'World Quest',
    subtitle: 'Animal geography challenge',
    accent: 'var(--purple)',
    accentSub: 'var(--purple-sub)',
    accentText: 'var(--purple-t)',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function PuzzleHubScreen() {
  const navigate = useNavigate()
  const { coins } = useWallet()
  const { getSkill } = useProgress()

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader
        title="Play"
        trailing={<CoinDisplay amount={coins} />}
      />

      <div className="px-6 pb-24 max-w-3xl mx-auto w-full">
        {/* Subtitle */}
        <p className="text-[14px] text-t3 mt-2 mb-4">
          Earn coins and XP by answering questions correctly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {GAMES.map(game => {
          const skill = getSkill(game.area)
          const pct = skill.totalAttempted > 0
            ? Math.round((skill.totalCorrect / skill.totalAttempted) * 100)
            : null

          return (
            <button
              key={game.area}
              onClick={() => navigate(game.route)}
              className="w-full text-left rounded-2xl border border-[var(--border-s)] bg-[var(--card)] p-5 hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] transition-all duration-300 motion-safe:active:scale-[.97]"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: game.accentSub }}
                >
                  <span style={{ color: game.accentText }}>{game.icon}</span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[17px] font-700 text-t1">{game.title}</span>
                    <span
                      className="text-[11px] font-700 px-2.5 py-1 rounded-pill shrink-0"
                      style={{ background: game.accentSub, color: game.accentText }}
                    >
                      Tier {skill.tier}
                    </span>
                  </div>
                  <p className="text-[13px] text-t2 mb-3">{game.subtitle}</p>

                  {/* XP progress bar */}
                  <div className="h-1.5 rounded-full bg-[var(--border-s)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        background: game.accent,
                        width: `${Math.min((skill.xp % 40) / 40 * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-t3">{skill.xp} XP total</span>
                    {pct !== null && (
                      <span className="text-[11px] text-t3">{pct}% correct</span>
                    )}
                    {pct === null && (
                      <span className="text-[11px] text-t3">Not played yet</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
        </div>

        {/* Racing banner */}
        <button
          onClick={() => navigate('/racing')}
          className="w-full text-left rounded-2xl border border-[var(--amber)] bg-[var(--amber-sub)] p-5 hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] transition-all duration-300 motion-safe:active:scale-[.97] mt-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center shrink-0 text-[var(--amber-t)]">
              <Flag size={28} />
            </div>
            <div>
              <div className="text-[17px] font-700 text-t1">Racing</div>
              <div className="text-[13px] text-[var(--amber-t)]">Enter your animals in races to win coins</div>
            </div>
          </div>
        </button>

        {/* Total stats pill */}
        <div className="flex items-center justify-center gap-6 mt-2 py-4 rounded-2xl bg-[var(--card)] border border-[var(--border-s)]">
          {[
            { label: 'Games played', value: GAMES.reduce((s, g) => s + getSkill(g.area).gamesPlayed, 0) },
            { label: 'Total correct', value: GAMES.reduce((s, g) => s + getSkill(g.area).totalCorrect, 0) },
            { label: 'Best streak', value: Math.max(...GAMES.map(g => getSkill(g.area).bestStreak)) },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-[22px] font-700 text-t1">{stat.value}</div>
              <div className="text-[11px] text-t3 uppercase tracking-wide font-700 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
