// MissionBriefSheet — rescue mission detail bottom sheet
// Per interaction-spec §2.2
// Rendered via BottomSheet (which already uses createPortal internally)

import { Globe, CheckCircle, Circle } from 'lucide-react'
import { BottomSheet } from '@/components/ui/Modal'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { RescueMission } from '@/lib/db'

// ─── Conservation status tint-pair (shared logic) ─────────────────────────────

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

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--t3)] mb-2">
      {children}
    </p>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function SheetDivider() {
  return <div className="border-t border-[var(--border-s)] my-4" />
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MissionBriefSheetProps {
  mission: RescueMission | null
  onClose: () => void
  onBegin: (id: number) => void
  onClaim: (id: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MissionBriefSheet({ mission, onClose, onBegin, onClaim }: MissionBriefSheetProps) {
  // Computed once mission is available
  const tint = mission ? getConservationTint(mission.conservationStatus) : null
  const totalTasks = mission?.tasks.length ?? 0
  const doneTasks = mission?.tasks.filter(t => t.done).length ?? 0
  const progressPct = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

  const ctaLabel =
    mission?.status === 'complete' ? 'Claim Rescue' :
    mission?.status === 'in_progress' ? 'Continue Mission' :
    'Begin Mission'

  function handleCta() {
    if (!mission?.id) return
    if (mission.status === 'complete') {
      onClaim(mission.id)
    } else {
      onBegin(mission.id)
    }
  }

  return (
    <BottomSheet isOpen={mission !== null} onClose={onClose} maxHeight="85vh">
      {/* Inner content only renders when mission is available (sheet animates out when null) */}
      {mission && tint && (
      <div className="px-6 pt-4 pb-8 flex flex-col gap-0">

        {/* Header row — 80×80 thumbnail + name/badges */}
        <div className="flex items-start gap-4 mb-4">
          <AnimalImage
            src={mission.imageUrl}
            alt={mission.name}
            className="w-20 h-20 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-[20px] font-bold text-[var(--t1)] leading-tight">
                {mission.name}
              </h2>
            </div>
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <RarityBadge rarity={mission.rarity} />
              {/* Conservation status badge — tint-pair */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-[var(--r-pill)] text-[11px] font-semibold"
                style={{
                  background: tint.bg,
                  border: `1px solid ${tint.border}`,
                  color: tint.text,
                }}
                aria-label={`Conservation status: ${tint.label}`}
              >
                {tint.label}
              </span>
            </div>
            <p className="text-[13px] text-[var(--t2)]">{mission.nativeRegion}</p>
          </div>
        </div>

        <SheetDivider />

        {/* Mini-map placeholder */}
        <SectionHeading>Native Region</SectionHeading>
        <div
          className="w-full rounded-xl overflow-hidden flex items-center justify-center mb-4"
          style={{
            height: 120,
            background: 'var(--elev)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {/* Static placeholder — no map asset in Phase C */}
          <Globe size={32} strokeWidth={2} className="text-[var(--t4)]" aria-hidden="true" />
        </div>

        <SheetDivider />

        {/* About section */}
        <SectionHeading>About This Animal</SectionHeading>
        <p className="text-[13px] text-[var(--t2)] leading-relaxed mb-0">
          {mission.about}
        </p>

        <SheetDivider />

        {/* Rescue missions section */}
        <SectionHeading>Rescue Missions</SectionHeading>

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
        <p className="text-[12px] font-medium text-[var(--t3)] mb-3">
          {doneTasks} of {totalTasks} missions complete
        </p>

        {/* Mission rows */}
        {mission.tasks.map((task, i) => (
          <div
            key={task.taskId}
            className={
              i < mission.tasks.length - 1
                ? 'flex items-start gap-2.5 py-2 border-b border-[var(--border-s)]'
                : 'flex items-start gap-2.5 py-2'
            }
          >
            {task.done ? (
              <CheckCircle
                size={18}
                strokeWidth={2}
                className="shrink-0 mt-0.5 text-[var(--green-t)]"
                aria-hidden="true"
              />
            ) : (
              <Circle
                size={18}
                strokeWidth={2}
                className="shrink-0 mt-0.5 text-[var(--t4)]"
                aria-hidden="true"
              />
            )}
            <span className="text-[14px] text-[var(--t2)] flex-1 leading-snug">
              {task.description}
            </span>
          </div>
        ))}

        {/* Footer CTA — full-width accent, lg (48px) */}
        <Button
          variant="accent"
          size="lg"
          className="w-full mt-5"
          onClick={handleCta}
          autoFocus
        >
          {ctaLabel}
        </Button>
      </div>
      )}
    </BottomSheet>
  )
}
