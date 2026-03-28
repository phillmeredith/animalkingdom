// StatCard — dashboard stat card (label + value + optional delta)

import { DeltaBadge } from './Badge'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  delta?: number
  className?: string
}

export function StatCard({ label, value, delta, className }: StatCardProps) {
  return (
    <div className={cn('bg-[var(--card)] border border-[var(--border-s)] rounded-lg p-5', className)}>
      <p className="text-[13px] text-t3 mb-2">{label}</p>
      <p className="text-[28px] font-bold tracking-tight text-t1">{value}</p>
      {delta !== undefined && (
        <DeltaBadge value={delta} className="mt-2" />
      )}
    </div>
  )
}
