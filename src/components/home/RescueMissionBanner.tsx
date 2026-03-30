// RescueMissionBanner — homepage indicator for active rescue missions
// Shows release-ready missions (green) then in-progress missions (blue)
// Max 3 visible; overflow count shown below.
// Per spec/features/store-rewards/interaction-spec-v2.md § homepage indicator

import { Leaf, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { todayString } from '@/lib/db'
import type { RescueMission } from '@/lib/db'

interface RescueMissionBannerProps {
  missions: RescueMission[]
  onNavigate: (missionId: number) => void
  onRelease: (mission: RescueMission) => void
}

function isReleaseReady(mission: RescueMission): boolean {
  if (mission.status !== 'claimed') return false
  if (!mission.releaseReadyDate) return false
  return mission.releaseReadyDate <= todayString()
}

export function RescueMissionBanner({ missions, onNavigate, onRelease }: RescueMissionBannerProps) {
  // Filter to missions that need a banner: in_progress or claimed
  const activeMissions = missions.filter(
    m => m.status === 'in_progress' || m.status === 'claimed',
  )

  if (activeMissions.length === 0) return null

  // Sort: release-ready (claimed + date passed) first, then in_progress
  const sorted = [...activeMissions].sort((a, b) => {
    const aReady = isReleaseReady(a) ? 0 : 1
    const bReady = isReleaseReady(b) ? 0 : 1
    return aReady - bReady
  })

  const visible = sorted.slice(0, 3)
  const overflow = sorted.length - visible.length

  return (
    <div className="mb-4 flex flex-col gap-2">
      {visible.map(mission => {
        const ready = isReleaseReady(mission)
        return (
          <div
            key={mission.id}
            className="rounded-[var(--r-lg)] border overflow-hidden"
            style={{
              background: 'var(--card)',
              borderColor: ready ? 'var(--green)' : 'var(--blue)',
            }}
          >
            {/* Top colour bar */}
            <div
              className="h-1"
              style={{
                background: ready
                  ? 'linear-gradient(90deg, #45B26B, #3772FF)'
                  : 'var(--blue)',
              }}
              aria-hidden="true"
            />

            <div className="flex items-center gap-3 px-3 py-3">
              {/* Animal thumbnail */}
              <AnimalImage
                src={mission.imageUrl}
                alt={mission.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--t1)] truncate">
                  {mission.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {ready ? (
                    <Leaf
                      size={11}
                      strokeWidth={2}
                      className="shrink-0"
                      style={{ color: 'var(--green-t)' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Clock
                      size={11}
                      strokeWidth={2}
                      className="shrink-0"
                      style={{ color: 'var(--blue-t)' }}
                      aria-hidden="true"
                    />
                  )}
                  <p
                    className="text-[11px] font-medium truncate"
                    style={{ color: ready ? 'var(--green-t)' : 'var(--blue-t)' }}
                  >
                    {ready ? 'Ready for release' : 'Mission in progress'}
                  </p>
                </div>
              </div>

              {/* CTA */}
              {ready ? (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => onRelease(mission)}
                >
                  Release
                </Button>
              ) : (
                <button
                  onClick={() => onNavigate(mission.id!)}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--t3)] hover:text-[var(--t1)] hover:bg-white/[.06] transition-all"
                  aria-label={`View ${mission.name} mission`}
                >
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {overflow > 0 && (
        <p className="text-[12px] font-medium text-[var(--t3)] text-center">
          +{overflow} more rescue mission{overflow > 1 ? 's' : ''} active
        </p>
      )}
    </div>
  )
}
