// Hooks
// Each hook is the single source of truth for its domain.
// Hooks do not import from components.
// Components import from hooks.
// Hook interfaces are defined in spec/features/{feature}/dev-brief.md before implementation.

export { useWallet } from './useWallet'
export { useReducedMotion } from './useReducedMotion'
export { useSpeech } from './useSpeech'
export { useSavedNames } from './useSavedNames'
export { useProgress } from './useProgress'
export { useNameHistory } from './useNameHistory'
export { useExploreFilter } from './useExploreFilter'
export type { RarityFilter, CategoryFilter, UseExploreFilterReturn } from './useExploreFilter'
export { RARITY_FILTER_VALUES, RARITY_FILTER_LABELS } from './useExploreFilter'
export { useCardDetail } from './useCardDetail'
export type { UseCardDetailReturn } from './useCardDetail'
export { useSchleichCollection } from './useSchleichCollection'
export type { UseSchleichCollectionReturn } from './useSchleichCollection'
export { usePersonalisation, FONT_OPTIONS } from './usePersonalisation'
export type { UsePersonalisationReturn, FontFamily, HeadingCase } from './usePersonalisation'
