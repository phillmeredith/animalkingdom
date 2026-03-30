// RescueMissionCard — mission card in the Rescue tab grid
// Per interaction-spec §1.6

import { MapPin, CheckCircle, Circle } from 'lucide-react'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { RescueMission } from '@/lib/db'

// ─── Conservation status tint-pair ───────────────────────────────────────────

interface ConservationTint {
  bg: string
  border: string
  text: string
  label: string
}

function getConservationTint(status: string): ConservationTint {
  switch (status) {
    case 'CR': return { bg: 'var(--red-sub)',   border: 'var(--red)',   text: 'var(--red-t)',   label: 'Critically Endangered' }
    case 'EN': return { bg: 'var(--amber-sub)', border: 'var(--amber)', text: 'var(--amber-t)', label: 'Endangered' }
    case 'VU': return { bg: 'var(--amber-sub)', border: 'var(--amber)', text: 'var(--amber-t)', label: 'Vulnerable' }
    case 'NT': return { bg: 'var(--blue-sub)',  border: 'var(--blue)',  text: 'var(--blue-t)',  label: 'Near Threatened' }
    case 'LC': return { bg: 'var(--green-sub)', border: 'var(--green)', text: 'var(--green-t)', label: 'Least Concern' }
    default:   return { bg: 'var(--elev)',       border: 'var(--border-s)', text: 'var(--t3)',  label: status }
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RescueMissionCardProps {
  mission: RescueMission
  onStart: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RescueMissionCard({ mission, onStart }: RescueMissionCardProps) {
  const tint = getConservationTint(mission.conservationStatus)
  const totalTasks = mission.tasks.length
  const doneTasks = mission.tasks.filter(t => t.done).length
  const progressPct = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

  const ctaLabel =
    mission.status === 'complete' ? 'Claim Rescue' :
    mission.status === 'in_progress' ? 'Continue Mission' :
    'Start Mission'

  return (
    <div
      className={cn(
        'rounded-[var(--r-lg)] border border-[var(--border-s)] bg-[var(--card)] p-4',
        'transition-all duration-300',
        'motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
        'hover:border-[var(--border)]',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <AnimalImage
          src={mission.imageUrl}
          alt={mission.name}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[16px] font-semibold text-[var(--t1)] leading-snug">
              {mission.name}
            </h3>
            <RarityBadge rarity={mission.rarity} />
          </div>
          {/* Conservation status badge — tint-pair, never solid fill */}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[var(--r-pill)] text-[11px] font-semibold mb-1.5"
            style={{
              background: tint.bg,
              border: `1px solid ${tint.border}`,
              color: tint.text,
            }}
            aria-label={`Conservation status: ${tint.label}`}
          >
            {tint.label}
          </span>
          {/* Habitat + region */}
          <div className="flex items-center gap-1 text-[13px] text-[var(--t2)]">
            <MapPin size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{mission.habitat} · {mission.nativeRegion}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border-s)] my-3" />

      {/* Missions section */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--t3)] mb-2">
          Missions Required
        </p>

        {/* Progress bar */}
        <div
          className="h-1 rounded-full bg-[var(--elev)] mb-1"
          role="progressbar"
          aria-valuenow={doneTasks}
          aria-valuemin={0}
          aria-valuemax={totalTasks}
          aria-label={`${doneTasks} of ${totalTasks} missions complete`}
        >
          <div
            className="h-full rounded-full bg-[var(--blue)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-[12px] font-medium text-[var(--t3)] mb-2">
          {doneTasks} of {totalTasks} missions complete
        </p>

        {/* Mission rows */}
        {mission.tasks.map((task, i) => (
          <div
            key={task.taskId}
            className={cn(
              'flex items-center gap-2 py-1.5',
              i < mission.tasks.length - 1 ? 'border-b border-[var(--border-s)]' : '',
            )}
          >
            {task.done ? (
              <CheckCircle
                size={16}
                strokeWidth={2}
                className="shrink-0 text-[var(--green-t)]"
                aria-hidden="true"
              />
            ) : (
              <Circle
                size={16}
                strokeWidth={2}
                className="shrink-0 text-[var(--t4)]"
                aria-hidden="true"
              />
            )}
            <span className="text-[13px] text-[var(--t2)] flex-1">{task.description}</span>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-3">
        <Button
          variant="accent"
          size="md"
          className="w-full"
          onClick={onStart}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  )
}
