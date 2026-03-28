// RacingScreen — race entry and results
// Shows open races + recent results; animated race simulation

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, Clock, Flag, Mountain, Crown, Coins, Medal, Disc } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useWallet } from '@/hooks/useWallet'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useRacing } from '@/hooks/useRacing'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { Race, RaceParticipant, SavedName } from '@/lib/db'

const RACE_TYPE_ICON: Record<string, React.ReactNode> = {
  sprint: <Zap size={28} className="text-[var(--amber-t)]" />,
  standard: <Flag size={28} className="text-[var(--blue-t)]" />,
  endurance: <Mountain size={28} className="text-[var(--green-t)]" />,
  championship: <Crown size={28} className="text-[var(--purple-t)]" />,
}

const POSITION_COLOURS = [
  'text-[var(--amber-t)]',  // 1st — gold
  'text-t2',                // 2nd — silver
  'text-[var(--green-t)]',  // 3rd — bronze (green tint, distinct from gold)
  'text-t3',                // 4th+
]

// ─── Countdown ────────────────────────────────────────────────────────────────

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Finished'
  const totalSeconds = Math.ceil(msRemaining / 1000)
  if (totalSeconds < 60) return `Ends in ${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `Ends in ${minutes}m ${seconds}s`
}

function useCountdown(endsAt: Date): string {
  const [label, setLabel] = useState(() => formatCountdown(endsAt.getTime() - Date.now()))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setLabel(formatCountdown(endsAt.getTime() - Date.now()))

    intervalRef.current = setInterval(() => {
      const remaining = endsAt.getTime() - Date.now()
      setLabel(formatCountdown(remaining))
      if (remaining <= 0 && intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 1000)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [endsAt])

  return label
}

// ─── Running race card ────────────────────────────────────────────────────────

function RunningRaceCard({ race, resolving, onResolve }: {
  race: Race
  resolving: number | null
  onResolve: (race: Race) => void
}) {
  const countdown = useCountdown(race.finishesAt)

  const isWaiting = race.status === 'open'

  return (
    <div className="rounded-2xl border border-[var(--blue)] bg-[var(--blue-sub)] p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 flex items-center justify-center">{RACE_TYPE_ICON[race.type] ?? <Flag size={28} />}</span>
        <div>
          <div className="text-[15px] font-700 text-t1">{race.name}</div>
          {isWaiting ? (
            <div className="text-[13px] font-600 text-[var(--blue-t)]">Entered — tap Race! to run</div>
          ) : (
            <>
              <div className="text-[13px] font-600 text-[var(--blue-t)]">In progress</div>
              <div className="text-[13px] font-600 text-[var(--blue-t)]">{countdown}</div>
            </>
          )}
        </div>
      </div>
      <Button
        variant="primary"
        size="md"
        className="w-full"
        disabled={resolving === race.id}
        onClick={() => onResolve(race)}
      >
        {resolving === race.id ? 'Racing…' : isWaiting ? <span className="flex items-center gap-1.5">Run Race! <Flag size={14} /></span> : <span className="flex items-center gap-1.5">Reveal Result <Trophy size={14} /></span>}
      </Button>
    </div>
  )
}

// ─── Race card ────────────────────────────────────────────────────────────────

function RaceCard({ race, onEnter }: { race: Race; onEnter: () => void }) {
  const hasPlayer = race.playerEntryPetId !== null
  const runnerCount = race.participants.length

  return (
    <div className="rounded-2xl border border-[var(--border-s)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 flex items-center justify-center">{RACE_TYPE_ICON[race.type] ?? <Flag size={28} />}</span>
          <div>
            <div className="text-[16px] font-700 text-t1">{race.name}</div>
            <div className="text-[12px] text-t3 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> {race.duration} min · {runnerCount + (hasPlayer ? 0 : 1)} / {race.maxRunners} runners
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-700 uppercase tracking-widest text-t3">Prize pool</div>
          <div className="flex items-center gap-1 text-[15px] font-700 text-[var(--amber-t)]"><Coins size={13} /> {race.prizePool}</div>
        </div>
      </div>

      {hasPlayer ? (
        <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--blue-sub)] border border-[var(--blue)]">
          <Zap size={14} className="text-[var(--blue-t)]" />
          <span className="text-[13px] font-600 text-[var(--blue-t)]">Entered — race in progress</span>
        </div>
      ) : (
        <Button variant="accent" size="md" className="w-full" onClick={onEnter}>
          <span className="flex items-center gap-1.5">Enter · <Coins size={13} /> {race.entryFee}</span>
        </Button>
      )}
    </div>
  )
}

// ─── Race entry sheet ─────────────────────────────────────────────────────────

function EntrySheet({ race, pets, canAfford, onEnter, onClose }: {
  race: Race
  pets: SavedName[]
  canAfford: boolean
  onEnter: (pet: SavedName) => Promise<void>
  onClose: () => void
}) {
  const [selectedPet, setSelectedPet] = useState<SavedName | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[16px] font-700 text-t1">{race.name}</div>
          <div className="flex items-center gap-1 text-[13px] text-t2">Entry fee: <Coins size={12} /> {race.entryFee} · Prize pool: <Coins size={12} /> {race.prizePool}</div>
        </div>
        <span className="w-10 h-10 flex items-center justify-center">{RACE_TYPE_ICON[race.type] ?? <Flag size={28} />}</span>
      </div>

      <p className="text-[13px] text-t2">Choose your racer:</p>

      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
        {pets.length === 0 ? (
          <p className="text-[13px] text-t3">You need at least one animal to race.</p>
        ) : pets.map(pet => (
          <button
            key={pet.id}
            onClick={() => setSelectedPet(pet)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-colors text-left',
              selectedPet?.id === pet.id
                ? 'border-[var(--blue)] bg-[var(--blue-sub)]'
                : 'border-[var(--border-s)] bg-[var(--elev)]',
            )}
          >
            <AnimalImage src={pet.imageUrl} alt={pet.name} className="w-10 h-10 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-600 text-t1">{pet.name}</div>
              <RarityBadge rarity={pet.rarity} />
            </div>
            {pet.equippedSaddleId && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--amber-t)] font-600"><Disc size={11} /> Saddled</span>
            )}
          </button>
        ))}
      </div>

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!selectedPet || !canAfford || busy}
        onClick={async () => {
          if (!selectedPet) return
          setBusy(true)
          await onEnter(selectedPet)
          setBusy(false)
        }}
      >
        {busy ? 'Entering…' : canAfford ? <span className="flex items-center gap-1.5">Race! <Coins size={13} /> {race.entryFee}</span> : 'Not enough coins'}
      </Button>
    </div>
  )
}

// ─── Race result overlay ──────────────────────────────────────────────────────

function RaceResultOverlay({ position, prize, raceName, participants, onDone, reducedMotion }: {
  position: number
  prize: number
  raceName: string
  participants: RaceParticipant[]
  onDone: () => void
  reducedMotion: boolean
}) {
  const sorted = [...participants].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const maxScore = Math.max(...sorted.map(p => p.totalScore ?? 0), 1)

  const posLabel = position === 1 ? 'You won!' : `${position}${position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} place`

  return (
    <motion.div
      className="fixed inset-0 z-[1100] flex flex-col items-center justify-center px-6 gap-5 overflow-y-auto py-8"
      style={{ background: 'rgba(13,13,17,0.96)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="text-center">
        <div className="text-[13px] font-700 uppercase tracking-widest text-t3 mb-1">{raceName}</div>
        <div className="text-[32px] font-700 text-t1">{posLabel}</div>
        {prize > 0 ? (
          <div className="flex items-center justify-center gap-1 text-[18px] font-700 text-[var(--amber-t)] mt-1">
            +<Coins size={16} /> {prize} coins
          </div>
        ) : (
          <div className="text-[14px] text-t3 mt-1">No prize this time</div>
        )}
      </div>

      {/* Participant bars */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        {sorted.map((p, i) => {
          const barPct = Math.round(((p.totalScore ?? 0) / maxScore) * 100)
          const isMe = p.isPlayer
          const pos = p.position ?? i + 1
          const posColour = POSITION_COLOURS[Math.min(pos - 1, POSITION_COLOURS.length - 1)]
          return (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-5 text-[12px] font-700 text-right shrink-0 ${posColour}`}>{p.position}</span>
              <div className="flex-1 h-8 rounded-pill bg-[var(--elev)] overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-pill ${isMe ? 'bg-[var(--blue)]' : 'bg-[var(--border)]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : i * 0.08, ease: 'easeOut' }}
                />
                <span className={`absolute left-3 top-0 bottom-0 flex items-center text-[12px] font-600 ${isMe ? 'text-white' : 'text-t2'}`}>
                  {isMe ? 'You' : p.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Button variant="primary" size="lg" className="w-full max-w-sm" onClick={onDone}>
        Done
      </Button>
    </motion.div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RacingScreen() {
  const { coins, canAfford } = useWallet()
  const { pets } = useSavedNames()
  const { activeRaces, finishedRaces, generateDailyRaces, enterRace, resolveRace } = useRacing()
  const reducedMotion = useReducedMotion()
  const { toast } = useToast()

  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [result, setResult] = useState<{ position: number; prize: number; raceName: string; participants: RaceParticipant[] } | null>(null)
  const [resolving, setResolving] = useState<number | null>(null)

  useEffect(() => { generateDailyRaces() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEnter(pet: SavedName) {
    if (!selectedRace) return
    const res = await enterRace(selectedRace.id!, pet)
    if (!res.success) {
      toast({ type: 'error', title: res.reason ?? 'Could not enter race' })
      return
    }
    setSelectedRace(null)
    toast({ type: 'info', title: "You're in! Tap the Race! button above to run." })
  }

  async function handleResolve(race: Race) {
    setResolving(race.id!)
    // Brief delay for drama
    await new Promise(r => setTimeout(r, reducedMotion ? 0 : 1500))
    const res = await resolveRace(race.id!)
    setResolving(null)
    if (res) {
      setResult({ position: res.position, prize: res.prize, raceName: race.name, participants: res.participants })
    }
  }

  const yourRaces = activeRaces.filter(r => r.playerEntryPetId !== null)
  const availableRaces = activeRaces.filter(r => r.status === 'open' && r.playerEntryPetId === null)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader title="Racing" trailing={<CoinDisplay amount={coins} />} />

      <div className="px-6 pb-24 flex flex-col gap-6 max-w-3xl mx-auto w-full mt-2">
        {/* Your races — entered (waiting or running) */}
        {yourRaces.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-0.5 h-4 rounded-full bg-[var(--blue)]" aria-hidden="true" />
              <p className="text-[11px] font-700 uppercase tracking-widest text-[var(--blue-t)]">Your races</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {yourRaces.map(race => (
                <RunningRaceCard key={race.id} race={race} resolving={resolving} onResolve={handleResolve} />
              ))}
            </div>
          </div>
        )}

        {/* Open races */}
        {availableRaces.length > 0 && (
          <div>
            <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">Available races</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRaces.map(race => (
                <RaceCard key={race.id} race={race} onEnter={() => setSelectedRace(race)} />
              ))}
            </div>
          </div>
        )}

        {yourRaces.length === 0 && availableRaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Flag size={48} className="text-t3" />
            <p className="text-[17px] font-600 text-t1">No races today</p>
            <p className="text-[14px] text-t2">Check back tomorrow for new races</p>
          </div>
        )}

        {/* Recent results */}
        {finishedRaces.length > 0 && (
          <div>
            <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">Recent results</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {finishedRaces.map(race => {
                const playerResult = race.participants.find(p => p.isPlayer)
                return (
                  <div key={race.id} className="rounded-xl border border-[var(--border-s)] bg-[var(--card)] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center">{RACE_TYPE_ICON[race.type] ?? <Flag size={20} />}</span>
                      <div>
                        <div className="text-[14px] font-600 text-t1">{race.name}</div>
                        {playerResult && (
                          <div className={cn('text-[12px] font-600', POSITION_COLOURS[playerResult.position! - 1] ?? 'text-t3')}>
                            {playerResult.position === 1 && <Trophy size={12} className="inline mr-0.5" />}{playerResult.position}{playerResult.position === 1 ? 'st' : playerResult.position === 2 ? 'nd' : playerResult.position === 3 ? 'rd' : 'th'} place
                          </div>
                        )}
                      </div>
                    </div>
                    {playerResult?.prize != null && playerResult.prize > 0 && (
                      <span className="flex items-center gap-1 text-[14px] font-700 text-[var(--amber-t)]">+<Coins size={13} /> {playerResult.prize}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Entry sheet */}
      <BottomSheet
        isOpen={!!selectedRace}
        onClose={() => setSelectedRace(null)}
        title={selectedRace?.name}
      >
        {selectedRace && (
          <EntrySheet
            race={selectedRace}
            pets={pets.filter(p => p.status === 'active')}
            canAfford={canAfford(selectedRace.entryFee)}
            onEnter={handleEnter}
            onClose={() => setSelectedRace(null)}
          />
        )}
      </BottomSheet>

      {/* Result overlay */}
      <AnimatePresence>
        {result && (
          <RaceResultOverlay
            position={result.position}
            prize={result.prize}
            raceName={result.raceName}
            participants={result.participants}
            reducedMotion={reducedMotion}
            onDone={() => setResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
