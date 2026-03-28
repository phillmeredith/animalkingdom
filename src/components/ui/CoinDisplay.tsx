// CoinDisplay — amber pill showing coin balance
// Used in page headers and stat areas
//
// Extended with optional `coinsInBids` prop (AUC-05).
// When coinsInBids > 0, shows "X in bids" below the main pill.
// The prop is ONLY named coinsInBids — heldAmount is explicitly prohibited
// (AUC-01 AC, refined-stories.md §IMPORTANT).
//
// Two-line layout used for "in bids" to avoid truncation at 375px (spec §8).

import { Coins } from 'lucide-react'

interface CoinDisplayProps {
  amount: number
  /**
   * Total coins currently in active bids (derived from bid table, not wallet).
   * When > 0, displays "X in bids" below the pill in a second line.
   * Named coinsInBids only — heldAmount is explicitly prohibited per AUC-01 AC.
   */
  coinsInBids?: number
  className?: string
}

export function CoinDisplay({ amount, coinsInBids = 0, className = '' }: CoinDisplayProps) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <div
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--amber-sub)] text-[var(--amber-t)] rounded-pill text-sm font-bold select-none"
      >
        <Coins size={14} className="text-[var(--amber)] flex-shrink-0" aria-hidden="true" />
        {amount.toLocaleString()}
      </div>
      {coinsInBids > 0 && (
        <span
          className="text-[11px] font-medium text-[var(--t3)] whitespace-nowrap"
          aria-label={`${coinsInBids.toLocaleString()} coins in bids`}
        >
          {coinsInBids.toLocaleString()} in bids
        </span>
      )}
    </div>
  )
}
