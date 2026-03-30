// animalTiers.ts — Single source of truth for animal economy tier classification
//
// Tradeable animals: can be listed for sale, auctioned, or bought from the marketplace.
// Reward-only animals: earned through gameplay; no trade actions permitted.
//
// Tier is a DERIVED property — it is never stored. Call isTradeable(category) at
// render time. No component or hook may use inline category-string comparisons to
// determine trade eligibility — always import and call isTradeable().

export const TRADEABLE_CATEGORIES = ['At Home', 'Stables', 'Farm'] as const
export const REWARD_ONLY_CATEGORIES = ['Wild', 'Sea', 'Lost World'] as const

/**
 * Returns true when the given category is in the tradeable tier.
 * Any unknown/future category is treated as reward-only (returns false).
 */
export function isTradeable(category: string): boolean {
  return (TRADEABLE_CATEGORIES as readonly string[]).includes(category)
}
