// RescueTab — rescue mission card grid in the Store > Rescue tab
// Per interaction-spec §1.6 and §1.7

import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RescueMissionCard } from './RescueMissionCard'
import type { RescueMission } from '@/lib/db'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RescueTabProps {
  missions: RescueMission[]
  onStartMission: (id: number) => void
  onGoToWorldMap: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RescueTab({ missions, onStartMission, onGoToWorldMap }: RescueTabProps) {
  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] gap-3 text-center">
        {/* Icon circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-0.5"
          style={{ background: 'var(--green-sub)' }}
        >
          <MapPin size={20} strokeWidth={2} className="text-[var(--green-t)]" aria-hidden="true" />
        </div>

        <h3 className="text-[16px] font-semibold text-[var(--t1)]">
          Rescue your first wild animal
        </h3>

        <p className="text-[13px] text-[var(--t2)] text-center max-w-[260px]">
          Complete missions on the World Map to earn wild animals for your collection.
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={onGoToWorldMap}
        >
          Go to World Map
        </Button>
      </div>
    )
  }

  return (
    // pt-1 for hover lift clearance at scroll container edge
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
      {missions.map(mission => (
        <RescueMissionCard
          key={mission.id}
          mission={mission}
          onStart={() => onStartMission(mission.id!)}
        />
      ))}
    </div>
  )
}
