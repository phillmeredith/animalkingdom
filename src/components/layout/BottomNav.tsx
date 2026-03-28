// BottomNav — 5-tab fixed bottom navigation
// NFT Dark DS tokens, iPad safe-area aware

import { NavLink } from 'react-router-dom'
import { Gamepad2, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { AppIcon } from '@/components/ui/AppIcon'
import type { PreviewConcept } from '@/data/iconPacks'

// The badge-clear key. PlayHubScreen writes Date.now() here on mount and when
// the racing tab is activated. BottomNav reads it in the useLiveQuery to
// decide whether any finished results are "unseen". localStorage (not
// sessionStorage) so it persists across browser sessions — a result from
// yesterday that was seen persists as seen after the browser is closed.
// Per dev-findings.md — Option 2 recommendation.
const LAST_VISIT_KEY = 'lastVisitedPlayTab'

// Tabs with AppIcon concepts where a mapping exists.
// Play and Collection use plain Lucide — no equivalent concept in the 8 preview concepts.
const TABS: { to: string; label: string; concept?: PreviewConcept; FallbackIcon?: React.ComponentType<{ size: number; strokeWidth: number; className?: string }> }[] = [
  { to: '/',          label: 'Home',       concept: 'home'   },
  { to: '/explore',   label: 'Explore',    concept: 'search' },
  { to: '/animals',   label: 'Animals',    concept: 'heart'  },
  { to: '/play',      label: 'Play',       FallbackIcon: Gamepad2 },
  { to: '/shop',      label: 'Store',      concept: 'coins'  },
  { to: '/schleich',  label: 'Collection', FallbackIcon: Package },
]

export function BottomNav() {
  const reducedMotion = useReducedMotion()

  // Play-tab badge: show when EITHER condition is true.
  //
  // Condition A — running race the player entered:
  //   status === 'running' && playerEntryPetId !== null
  //   enterRace() sets status to 'running' atomically with playerEntryPetId, so
  //   the old 'open' + entered window is sub-millisecond and unobservable (R-04).
  //
  // Condition B — finished race with unseen result:
  //   status === 'finished' && playerEntryPetId !== null &&
  //   updatedAt.getTime() > lastVisitedPlayTab (localStorage timestamp)
  //   PlayHubScreen writes 'lastVisitedPlayTab' on mount and on racing tab activation.
  //
  // No dep array item for the localStorage timestamp is needed — the badge re-evaluates
  // whenever any race record changes via useLiveQuery's Dexie subscription.
  const showPlayBadge = useLiveQuery(
    async () => {
      // Condition A: player has an entered race currently running
      const runningCount = await db.races
        .where('status').equals('running')
        .and(r => r.playerEntryPetId !== null)
        .count()
      if (runningCount > 0) return true

      // Condition B: player has a finished race whose result they haven't seen yet.
      // "Seen" = PlayHubScreen has written a timestamp >= updatedAt.
      const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) ?? '0')
      const unseenCount = await db.races
        .where('status').equals('finished')
        .and(r =>
          r.playerEntryPetId !== null &&
          !!r.updatedAt &&
          new Date(r.updatedAt).getTime() > lastVisit
        )
        .count()
      return unseenCount > 0
    },
    [],
    false,
  )

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[900]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        style={{
          background: 'rgba(13,13,17,.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,.06)',
        }}
      >
        <div className="flex items-stretch h-[68px]">
          {TABS.map(({ to, label, concept, FallbackIcon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 flex-1
                text-[11px] font-medium transition-colors duration-150
                min-h-[44px]
                ${isActive ? 'text-[var(--blue)]' : 'text-t3'}
              `}
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center gap-0.5">
                  {/* Icon wrapper — relative so the absolute badge dot is contained
                      within this element, matching spec section 5.3 */}
                  <div className="relative">
                    {concept ? (
                      <AppIcon
                        concept={concept}
                        size={22}
                        strokeWidth={isActive ? 2.5 : 2}
                        // Active: respect icon colour preset (falls back to --blue when System)
                        // Inactive: always dim tertiary
                        color={isActive ? 'var(--icon-color, var(--blue))' : 'var(--t3)'}
                      />
                    ) : FallbackIcon ? (
                      <FallbackIcon
                        size={22}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? 'text-[var(--blue)]' : 'text-t3'}
                      />
                    ) : null}
                    {/* Badge dot — Play tab only.
                        AnimatePresence wraps the dot only, not the tab item or
                        any sibling — per spec section 5.4 and CLAUDE.md AnimatePresence
                        mode="wait" sibling check. Tab items must not shift layout
                        when the badge appears/disappears. */}
                    {to === '/play' && (
                      <AnimatePresence>
                        {showPlayBadge && (
                          reducedMotion ? (
                            // Reduced-motion: static dot, no Framer Motion per spec 5.4
                            <span
                              key="badge-static"
                              className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--pink)]"
                              aria-hidden="true"
                            />
                          ) : (
                            // Animated dot: scale 0→1 enter (150ms ease-out), scale 1→0 exit (150ms ease-in)
                            // Enter easing: cubic-bezier(0.16, 1, 0.3, 1) per spec 5.4
                            // Exit easing:  cubic-bezier(0.7, 0, 0.84, 0) per spec 5.4
                            <motion.span
                              key="badge-animated"
                              className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--pink)]"
                              aria-hidden="true"
                              initial={{ scale: 0 }}
                              animate={{
                                scale: 1,
                                transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
                              }}
                              exit={{
                                scale: 0,
                                transition: { duration: 0.15, ease: [0.7, 0, 0.84, 0] },
                              }}
                            />
                          )
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                  <span
                    className={`nav-label text-[10px] font-600 tracking-wide ${isActive ? 'text-t1' : 'text-t3'}`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
