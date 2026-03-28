// HomeStatCards — 3-column stat grid for Home screen

import { Flame } from 'lucide-react'
import { AppIcon } from '@/components/ui/AppIcon'

interface HomeStatCardsProps {
  petCount: number
  gamerLevel: number
  streak: number
  loading?: boolean
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border-s)] rounded-2xl p-5 animate-pulse">
      <div className="w-6 h-6 rounded bg-[var(--elev)] mb-3" />
      <div className="h-7 w-12 rounded bg-[var(--elev)] mb-2" />
      <div className="h-3 w-16 rounded bg-[var(--elev)]" />
    </div>
  )
}

interface StatCardItemProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatCardItem({ icon, value, label }: StatCardItemProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border-s)] rounded-2xl p-5">
      <div className="mb-2">{icon}</div>
      <p className="text-[28px] font-bold text-t1 leading-none mb-1">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-t3">{label}</p>
    </div>
  )
}

export function HomeStatCards({ petCount, gamerLevel, streak, loading }: HomeStatCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCardItem
        icon={<AppIcon concept="heart" size={20} color="var(--icon-color, var(--pink))" />}
        value={String(petCount)}
        label="Collection"
      />
      <StatCardItem
        icon={<AppIcon concept="star" size={20} color="var(--icon-color, var(--blue))" />}
        value={`Lv ${gamerLevel}`}
        label="Level"
      />
      <StatCardItem
        icon={<Flame size={20} style={{ color: 'var(--icon-color, var(--amber))' }} aria-hidden="true" />}
        value={`Day ${streak}`}
        label="Streak"
      />
    </div>
  )
}
