// CardsScreen — card collection + pack opening
// Tab: Packs | Collection

import { useState, useRef } from 'react'
import { AnimatePresence, motion, type Transition, type TargetAndTransition } from 'framer-motion'
import { PageHeader } from '@/components/layout/PageHeader'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { Button } from '@/components/ui/Button'
import { PillToggle } from '@/components/ui/PillToggle'
import { BottomSheet } from '@/components/ui/Modal'
import { CollectedCardDetailSheet } from '@/components/cards/CollectedCardDetailSheet'
import { useWallet } from '@/hooks/useWallet'
import { useCardPacks, PACK_DEFS, type OpenedCard } from '@/hooks/useCardPacks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useToast } from '@/components/ui/Toast'
import type { CollectedCard } from '@/lib/db'
import { Coins, Package, Backpack, Crown, CreditCard, PackageCheck, ShoppingBag, Sparkles, Zap } from 'lucide-react'

const PACK_ICON: Record<string, React.ReactNode> = {
  starter:   <Package size={28} className="text-[var(--blue-t)]" />,
  adventure: <Backpack size={28} className="text-[var(--green-t)]" />,
  legendary: <Crown size={28} className="text-[var(--amber-t)]" />,
}

// Larger icon variant used inside the confirmation sheet (48px icons)
const PACK_ICON_LARGE: Record<string, React.ReactNode> = {
  starter:   <Package size={48} className="text-[var(--blue-t)]" />,
  adventure: <Backpack size={48} className="text-[var(--green-t)]" />,
  legendary: <Crown size={48} className="text-[var(--amber-t)]" />,
}

type Tab = 'packs' | 'collection'

// ─── Pack card ────────────────────────────────────────────────────────────────

function PackCard({ pack, canAfford, onBuy }: {
  pack: typeof PACK_DEFS[number]
  canAfford: boolean
  onBuy: () => void
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-s)] bg-[var(--card)] p-5 flex flex-col gap-3">
      <div className="w-12 h-12 rounded-xl bg-[var(--elev)] flex items-center justify-center">{PACK_ICON[pack.id]}</div>
      <div>
        <div className="text-[17px] font-700 text-t1 mb-0.5">{pack.name}</div>
        <div className="text-[13px] text-t2">{pack.description}</div>
      </div>
      <Button
        variant="accent"
        size="md"
        className="w-full"
        onClick={onBuy}
        disabled={!canAfford}
      >
        <span className="flex items-center gap-1.5"><Coins size={13} /> {pack.price} — Open</span>
      </Button>
    </div>
  )
}

// ─── Pack confirmation sheet ──────────────────────────────────────────────────

function PackConfirmSheet({ packId, coins, canAfford, onConfirm, onClose }: {
  packId: string | null
  coins: number
  canAfford: (amount: number) => boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const pack = PACK_DEFS.find(p => p.id === packId)
  if (!pack) return null

  const affordable = canAfford(pack.price)

  return (
    <div className="max-w-3xl mx-auto w-full px-6 pb-8 pt-2">

      {/* Pack icon */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--elev)] flex items-center justify-center mx-auto mb-4">
        {PACK_ICON_LARGE[pack.id] ?? <Package size={48} className="text-[var(--t3)]" />}
      </div>

      {/* Pack name */}
      <p className="text-[22px] font-700 text-[var(--t1)] text-center mb-1">{pack.name}</p>

      {/* Description */}
      <p className="text-[14px] text-[var(--t2)] text-center mb-5">{pack.description}</p>

      {/* Odds row */}
      <div className="bg-[var(--elev)] rounded-xl p-3 flex items-start gap-2 mb-5">
        <PackageCheck size={16} className="text-[var(--t3)] shrink-0 mt-0.5" />
        <span className="text-[13px] text-[var(--t2)]">{pack.description}</span>
      </div>

      {/* Cost + wallet row */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-1.5">
          <Coins size={16} className={affordable ? 'text-[var(--amber-t)]' : 'text-[var(--red-t)]'} />
          <span
            className="text-[20px] font-700"
            style={{ color: affordable ? 'var(--amber-t)' : 'var(--red-t)' }}
          >
            {pack.price}
          </span>
        </div>
        <p
          className="text-[13px] mt-0.5"
          style={{ color: affordable ? 'var(--t3)' : 'var(--red-t)' }}
        >
          {affordable
            ? `You have ${coins} coins`
            : `You have ${coins} coins but this costs ${pack.price}. You're short ${pack.price - coins}!`}
        </p>
      </div>

      {/* CTA */}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!affordable}
        icon={affordable ? <Coins size={16} /> : undefined}
        onClick={onConfirm}
      >
        {affordable ? 'Open Pack' : 'Not enough coins'}
      </Button>
    </div>
  )
}

// ─── Card reveal overlay ──────────────────────────────────────────────────────

// Border colour by rarity
function rarityBorderColor(rarity: OpenedCard['rarity']): string {
  switch (rarity) {
    case 'legendary': return 'var(--amber)'
    case 'epic':      return 'var(--purple)'
    case 'rare':      return 'var(--blue)'
    case 'uncommon':  return 'var(--green)'
    default:          return 'var(--border)'
  }
}

// ─── Rarity glow layer ───────────────────────────────────────────────────────

function RarityGlow({ rarity, reducedMotion }: { rarity: OpenedCard['rarity']; reducedMotion: boolean }) {
  if (rarity === 'common') return null

  const configs = {
    uncommon: {
      size: 280,
      gradient: 'radial-gradient(circle, rgba(69,178,107,0.18) 0%, transparent 70%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 200, damping: 28, delay: 0.05 },
    },
    rare: {
      size: 320,
      gradient: 'radial-gradient(circle, rgba(55,114,255,0.22) 0%, transparent 65%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 200, damping: 26, delay: 0.14 },
    },
    epic: {
      size: 340,
      gradient: 'radial-gradient(circle, rgba(151,87,215,0.25) 0%, transparent 60%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 180, damping: 24, delay: 0.22 },
    },
    legendary: {
      size: 380,
      gradient: 'radial-gradient(circle, rgba(245,166,35,0.35) 0%, transparent 60%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 160, damping: 22, delay: 0.3 },
    },
  }

  const cfg = configs[rarity as keyof typeof configs]
  if (!cfg) return null

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: cfg.size,
        height: cfg.size,
        background: cfg.gradient,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
      }}
      initial={cfg.initial}
      animate={cfg.animate}
      transition={cfg.transition}
    />
  )
}

// ─── Rare flash overlay ───────────────────────────────────────────────────────

function RareFlash({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) return null
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1101, background: 'rgba(55,114,255,0.12)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.12, 0] }}
      transition={{ duration: 0.35, ease: 'easeOut', times: [0, 0.3, 1] }}
    />
  )
}

// ─── Legendary sweep + ray burst ─────────────────────────────────────────────

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function LegendarySpectacle({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) return null
  return (
    <>
      {/* Full-screen amber sweep — z-[1099] sits above backdrop, below card */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1099,
          background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.22) 0%, transparent 65%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6] }}
        transition={{ duration: 0.8, ease: 'easeOut', times: [0, 0.4, 1] }}
      />
      {/* Ray burst container — centred on the card's expected position */}
      <motion.div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          width: 0,
          height: 0,
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 0.8, 0], scaleY: [0, 1, 0.4] }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        {RAY_ANGLES.map((angle) => (
          <div
            key={angle}
            style={{
              position: 'absolute',
              width: 2,
              height: 80,
              background: 'linear-gradient(to bottom, rgba(245,166,35,0.7), transparent)',
              borderRadius: 1,
              transformOrigin: 'bottom center',
              transform: `rotate(${angle}deg) translateY(-100%)`,
              bottom: 0,
              left: -1,
            }}
          />
        ))}
      </motion.div>
    </>
  )
}

// ─── Epic pulse rings ─────────────────────────────────────────────────────────

function EpicPulseRings({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) return null
  return (
    <>
      {[0, 0.15].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 200,
            height: 200,
            background: 'rgba(151,87,215,0.15)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }}
          initial={{ opacity: 0.6, scale: 0.3 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay }}
        />
      ))}
    </>
  )
}

// ─── RevealSummary ────────────────────────────────────────────────────────────

type RarityTier = OpenedCard['rarity']
const RARITY_ORDER: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

function highestRarity(cards: OpenedCard[]): RarityTier {
  return cards.reduce<RarityTier>((best, card) => {
    return RARITY_ORDER.indexOf(card.rarity) > RARITY_ORDER.indexOf(best) ? card.rarity : best
  }, 'common')
}

function RevealSummary({
  cards,
  canAffordAnother,
  reducedMotion,
  onOpenAnother,
  onDone,
}: {
  cards: OpenedCard[]
  canAffordAnother: boolean
  reducedMotion: boolean
  onOpenAnother: () => void
  onDone: () => void
}) {
  const best = highestRarity(cards)
  const showPill = best === 'legendary' || best === 'epic'

  return (
    <motion.div
      className="w-full h-full overflow-y-auto"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="max-w-3xl mx-auto w-full px-6 pt-12 flex flex-col items-center">

        {/* Headline */}
        <motion.h3
          className="text-[28px] font-semibold text-[var(--t1)] text-center mb-6"
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          Your cards!
        </motion.h3>

        {/* Rarity highlight pill */}
        {showPill && (
          <motion.div
            className="flex items-center gap-[5px] px-3 py-1 rounded-[100px] mb-8"
            style={{
              background: best === 'legendary' ? 'var(--amber-sub)' : 'var(--purple-sub)',
              color: best === 'legendary' ? 'var(--amber-t)' : 'var(--purple-t)',
              fontSize: 13,
              fontWeight: 600,
            }}
            initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 24, delay: 0.15 }}
          >
            {best === 'legendary' ? (
              <Sparkles size={14} aria-hidden="true" />
            ) : (
              <Zap size={14} aria-hidden="true" />
            )}
            {best === 'legendary' ? 'Legendary find!' : 'Epic pull!'}
          </motion.div>
        )}

        {/* Mini card grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className="rounded-xl border-2 overflow-hidden bg-[var(--card)]"
              style={{ borderColor: rarityBorderColor(card.rarity) }}
              initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 300, damping: 26, delay: 0.1 + index * 0.08 }
              }
            >
              {/* Image with New! dot */}
              <div className="relative">
                <AnimalImage
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full aspect-square object-cover"
                />
                {card.isNew && (
                  <div
                    className="absolute top-2 right-2 w-[6px] h-[6px] rounded-full"
                    style={{ background: 'var(--pink)' }}
                  />
                )}
              </div>
              {/* Footer */}
              <div className="p-2">
                <div className="text-[11px] font-semibold text-[var(--t1)] truncate mb-1">{card.name}</div>
                <RarityBadge rarity={card.rarity} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full max-w-[300px] mx-auto pb-8">
          {canAffordAnother ? (
            <>
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                icon={<ShoppingBag size={16} />}
                onClick={onOpenAnother}
              >
                Open Another Pack
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={onDone}
              >
                Done
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onDone}
            >
              Done
            </Button>
          )}
        </div>

      </div>
    </motion.div>
  )
}

// ─── Card reveal step (single card view) ─────────────────────────────────────

function CardRevealStep({
  cards,
  revealed,
  reducedMotion,
  playedSweeps,
  onNext,
  onSeeAll,
}: {
  cards: OpenedCard[]
  revealed: number
  reducedMotion: boolean
  playedSweeps: React.MutableRefObject<Set<RarityTier>>
  onNext: () => void
  onSeeAll: () => void
}) {
  const card = cards[revealed]
  const isLast = revealed === cards.length - 1

  // Determine whether this card gets its full rarity sweep or a simple common entry.
  // Full sweep plays only once per rarity tier per pack opening session.
  const isFirstOfRarity = !playedSweeps.current.has(card.rarity)
  const effectiveRarity: RarityTier = isFirstOfRarity ? card.rarity : 'common'

  // Mark this rarity as played after determining whether to show sweep.
  // We do this inside render — the ref mutation is intentional (not reactive state).
  if (isFirstOfRarity && (card.rarity === 'rare' || card.rarity === 'legendary')) {
    playedSweeps.current.add(card.rarity)
  }

  // Spring configs by rarity
  const cardAnimConfig: Record<RarityTier, {
    initial: TargetAndTransition
    animate: TargetAndTransition
    exit: TargetAndTransition
    transition: Transition
  }> = {
    common: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.88, y: 16 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26 },
    },
    uncommon: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 24 },
    },
    rare: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.82, y: 24 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 22, delay: 0.12 },
    },
    epic: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0, rotateY: 0 } : { opacity: 0, scale: 0.78, y: 20, rotateY: 8 },
      animate: { opacity: 1, scale: 1, y: 0, rotateY: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 20, delay: 0.2 },
    },
    legendary: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0, rotateY: 0 } : { opacity: 0, scale: 0.70, y: 28, rotateY: 12 },
      animate: { opacity: 1, scale: 1, y: 0, rotateY: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 18, delay: 0.35 },
    },
  }

  const cfg = cardAnimConfig[effectiveRarity]

  // Whether this card needs 3D perspective (epic/legendary with rotateY)
  const needs3d = (effectiveRarity === 'epic' || effectiveRarity === 'legendary') && !reducedMotion

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center px-8 gap-6"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Progress dots — aria-hidden, counter below is the accessible equivalent */}
      <div className="flex gap-2" aria-hidden="true">
        {cards.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: i <= revealed ? 'var(--blue)' : 'var(--border)',
              transition: 'background-color 200ms ease-out',
            }}
          />
        ))}
      </div>

      {/* Card area — relative container for glow layers */}
      <div className="relative flex items-center justify-center w-full max-w-[320px]">

        {/* Full-screen sweeps — rendered relative to viewport via fixed positioning inside */}
        <AnimatePresence>
          {effectiveRarity === 'rare' && isFirstOfRarity && (
            <RareFlash key={`rare-flash-${revealed}`} reducedMotion={reducedMotion} />
          )}
          {effectiveRarity === 'legendary' && isFirstOfRarity && (
            <LegendarySpectacle key={`legendary-spectacle-${revealed}`} reducedMotion={reducedMotion} />
          )}
        </AnimatePresence>

        {/* Epic pulse rings */}
        <AnimatePresence>
          {effectiveRarity === 'epic' && isFirstOfRarity && (
            <EpicPulseRings key={`epic-pulse-${revealed}`} reducedMotion={reducedMotion} />
          )}
        </AnimatePresence>

        {/* Rarity glow bloom behind card */}
        <AnimatePresence mode="wait">
          <RarityGlow key={`glow-${revealed}`} rarity={effectiveRarity} reducedMotion={reducedMotion} />
        </AnimatePresence>

        {/* Card — with 3D perspective wrapper for epic/legendary rotateY */}
        <AnimatePresence mode="wait">
          <div
            key={`perspective-${revealed}`}
            className="relative z-10 w-full"
            style={needs3d ? { perspective: '800px' } : undefined}
          >
            {/* Legendary shimmer border wrapper */}
            {effectiveRarity === 'legendary' && !reducedMotion ? (
              <motion.div
                className="shimmer rounded-2xl p-[2px] w-full"
                {...cfg}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="rounded-2xl overflow-hidden bg-[var(--card)] w-full">
                  <AnimalImage
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[15px] font-semibold text-[var(--t1)]">{card.name}</div>
                      {card.isNew && (
                        <div
                          className="text-[11px] font-bold uppercase mt-0.5"
                          style={{ letterSpacing: '1px', color: 'var(--pink-t)' }}
                        >
                          New!
                        </div>
                      )}
                    </div>
                    <RarityBadge rarity={card.rarity} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="w-full rounded-2xl border-2 overflow-hidden bg-[var(--card)]"
                style={{
                  borderColor: rarityBorderColor(card.rarity),
                  ...(needs3d ? { transformStyle: 'preserve-3d' } : {}),
                }}
                {...cfg}
              >
                <AnimalImage
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-semibold text-[var(--t1)]">{card.name}</div>
                    {card.isNew && (
                      <div
                        className="text-[11px] font-bold uppercase mt-0.5"
                        style={{ letterSpacing: '1px', color: 'var(--pink-t)' }}
                      >
                        New!
                      </div>
                    )}
                  </div>
                  <RarityBadge rarity={card.rarity} />
                </div>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* CTA button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full max-w-[320px]"
        autoFocus
        onClick={isLast ? onSeeAll : onNext}
      >
        {isLast ? 'See All' : 'Next card'}
      </Button>

      {/* Counter — accessible equivalent of progress dots */}
      <span className="text-[13px]" style={{ color: 'var(--t3)' }}>
        {revealed + 1} of {cards.length}
      </span>
    </motion.div>
  )
}

// ─── CardReveal — top-level overlay managing reveal + summary phases ──────────

type RevealPhase = 'reveal' | 'summary'

function CardReveal({
  cards,
  canAfford,
  openedPackPrice,
  reducedMotion,
  onDone,
  onOpenAnother,
}: {
  cards: OpenedCard[]
  canAfford: (amount: number) => boolean
  openedPackPrice: number
  reducedMotion: boolean
  onDone: () => void
  onOpenAnother: () => void
}) {
  const [phase, setPhase] = useState<RevealPhase>('reveal')
  const [revealed, setRevealed] = useState(0)

  // Tracks which rarity tiers have already played their full-screen sweep this session.
  // Only 'rare' and 'legendary' have sweeps; we track them to prevent replay.
  const playedSweeps = useRef<Set<RarityTier>>(new Set())

  function handleNext() {
    setRevealed(r => r + 1)
  }

  function handleSeeAll() {
    setPhase('summary')
  }

  const canAffordAnother = canAfford(openedPackPrice)

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Card reveal"
      className="fixed inset-0 z-[1100] flex flex-col overflow-hidden"
      style={{ background: 'rgba(13,13,17,0.96)' }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <AnimatePresence mode="wait">
        {phase === 'reveal' ? (
          <CardRevealStep
            key="reveal"
            cards={cards}
            revealed={revealed}
            reducedMotion={reducedMotion}
            playedSweeps={playedSweeps}
            onNext={handleNext}
            onSeeAll={handleSeeAll}
          />
        ) : (
          <RevealSummary
            key="summary"
            cards={cards}
            canAffordAnother={canAffordAnother}
            reducedMotion={reducedMotion}
            onOpenAnother={onOpenAnother}
            onDone={onDone}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Collection grid ──────────────────────────────────────────────────────────

function CollectionGrid({
  cards,
  onCardTap,
}: {
  cards: ReturnType<typeof useCardPacks>['cards']
  onCardTap: (card: CollectedCard) => void
}) {
  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-20">
        <CreditCard size={48} className="text-t3" />
        <p className="text-[17px] font-600 text-t1">No cards yet</p>
        <p className="text-[14px] text-t2">Open a pack to start your collection</p>
      </div>
    )
  }

  return (
    // pt-1 ensures hover lift (translateY(-2px)) doesn't clip against the scroll edge
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-6 pb-24 pt-1">
      {cards.map(card => {
        const restBorderColor =
          card.rarity === 'legendary' ? 'var(--amber)'   :
          card.rarity === 'epic'      ? 'var(--purple)'  :
          card.rarity === 'rare'      ? 'var(--blue)'    :
          card.rarity === 'uncommon'  ? 'var(--green)'   : 'var(--border-s)'

        return (
          // Card tile — interactive: opens CollectedCardDetailSheet on tap/click/Enter/Space.
          // Implemented as a <div role="button"> because the outer grid element is a <div>.
          // tabIndex={0} + role="button" + aria-label satisfy WCAG 2.1 AA keyboard access.
          // DS card hover pattern: translateY(-2px), shadow, border steps to var(--border).
          // Focus ring: 2px solid var(--blue), offset 2px — spec requirement.
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${card.name}`}
            className={[
              'rounded-2xl border overflow-hidden bg-[var(--card)] cursor-pointer',
              'motion-safe:hover:-translate-y-0.5',
              'hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
              'hover:border-[var(--border)]',
              'motion-safe:active:scale-[.97]',
              'transition-all duration-300',
              'focus-visible:outline-[2px] focus-visible:outline focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
            ].join(' ')}
            style={{ borderColor: restBorderColor }}
            onClick={() => onCardTap(card)}
            onKeyDown={e => {
              // Activate on Enter or Space — matches native button behaviour
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCardTap(card)
              }
            }}
          >
            <AnimalImage
              src={card.imageUrl}
              alt={card.name}
              className="w-full aspect-square object-cover"
            />
            <div className="p-3">
              <div className="text-[13px] font-600 text-t1 mb-1 truncate">{card.name}</div>
              <div className="flex items-center justify-between">
                <RarityBadge rarity={card.rarity} />
                {card.duplicateCount > 0 && (
                  <span className="text-[11px] text-t3">×{card.duplicateCount + 1}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CardsScreen() {
  const { coins, canAfford } = useWallet()
  const { cards, totalCards, openPack } = useCardPacks()
  const reducedMotion = useReducedMotion()
  const { toast } = useToast()

  const [tab, setTab] = useState<Tab>('packs')
  const [revealCards, setRevealCards] = useState<OpenedCard[] | null>(null)
  const [buying, setBuying] = useState<string | null>(null)
  const [confirmPack, setConfirmPack] = useState<string | null>(null)

  // ── Card detail sheet state ──────────────────────────────────────────────────
  // selectedCard holds the full CollectedCard tapped in the grid.
  // detailOpen drives the BottomSheet open prop so AnimatePresence can animate out
  // before we clear selectedCard (avoids content disappearing mid-animation).
  const [selectedCard, setSelectedCard] = useState<CollectedCard | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function handleCardTap(card: CollectedCard) {
    setSelectedCard(card)
    setDetailOpen(true)
  }

  function handleDetailClose() {
    setDetailOpen(false)
    // Do not clear selectedCard here — we need it to remain while the sheet
    // animates out. AnimatePresence completes the exit before re-render, so
    // selectedCard can safely persist until the sheet is fully closed.
    // In practice the sheet unmounts quickly; no stale reference risk.
  }

  // Track the pack ID that was most recently opened — needed to re-open for "Open Another Pack".
  const lastOpenedPackId = useRef<string | null>(null)

  // Step 1: open confirmation sheet (no spend)
  function handleOpenPack(packId: string) {
    if (buying) return
    setConfirmPack(packId)
  }

  // Step 2: player confirmed — spend coins and trigger reveal
  async function handleConfirmOpen() {
    if (!confirmPack || buying) return
    const packId = confirmPack
    setConfirmPack(null)
    setBuying(packId)
    try {
      const result = await openPack(packId)
      if (!result.success) {
        toast({ type: 'error', title: result.reason ?? 'Failed to open pack' })
        return
      }
      lastOpenedPackId.current = packId
      setRevealCards(result.cards)
    } finally {
      setBuying(null)
    }
  }

  // Step 3 (optional): from the summary, player wants to open the same pack again.
  // Close the reveal overlay and immediately reopen the confirmation sheet.
  function handleOpenAnother() {
    const packId = lastOpenedPackId.current
    setRevealCards(null)
    if (packId) {
      setConfirmPack(packId)
    }
  }

  // Derive the price of the last opened pack for the "can afford another" check.
  const openedPackPrice = lastOpenedPackId.current
    ? (PACK_DEFS.find(p => p.id === lastOpenedPackId.current)?.price ?? 0)
    : 0

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <PageHeader
        title="Cards"
        trailing={<CoinDisplay amount={coins} />}
      />

      {/* Tab toggle */}
      <div className="px-6 mb-4 shrink-0 max-w-3xl mx-auto w-full">
        <PillToggle
          id="cards-tabs"
          className="w-full"
          tabs={[
            { id: 'packs', label: 'Packs' },
            { id: 'collection', label: `Collection (${totalCards})` },
          ]}
          activeId={tab}
          onChange={id => setTab(id as Tab)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'packs' ? (
          <div className="px-6 pb-24 max-w-3xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {PACK_DEFS.map(pack => (
              <PackCard
                key={pack.id}
                pack={pack}
                canAfford={canAfford(pack.price) && buying === null}
                onBuy={() => handleOpenPack(pack.id)}
              />
            ))}
          </div>
        ) : (
          <CollectionGrid cards={cards} onCardTap={handleCardTap} />
        )}
      </div>

      {/* Pack confirmation sheet */}
      <BottomSheet isOpen={!!confirmPack} onClose={() => setConfirmPack(null)}>
        {confirmPack && (
          <PackConfirmSheet
            packId={confirmPack}
            coins={coins}
            canAfford={canAfford}
            onConfirm={handleConfirmOpen}
            onClose={() => setConfirmPack(null)}
          />
        )}
      </BottomSheet>

      {/* Card detail sheet — view-only, opened by tapping a card in CollectionGrid */}
      <CollectedCardDetailSheet
        card={selectedCard}
        open={detailOpen}
        onClose={handleDetailClose}
      />

      {/* Card reveal overlay */}
      <AnimatePresence>
        {revealCards && (
          <CardReveal
            cards={revealCards}
            canAfford={canAfford}
            openedPackPrice={openedPackPrice}
            reducedMotion={reducedMotion}
            onDone={() => setRevealCards(null)}
            onOpenAnother={handleOpenAnother}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
