// iconPacks.ts
// Data constants for icon pack customisation.
//
// IMPORTANT: Individual named imports only — NO barrel imports from any icon library.
// Barrel imports (import * from '...') defeat tree-shaking and bloat the bundle.
//
// Self-review:
// [x] No barrel imports — every icon is a named import
// [x] PREVIEW_ICON_MAP covers all four packs × all styles × eight concepts
// [x] resolveIcon falls back to Lucide silently — no console warnings
// [x] Teal and Coral hex values live here only; component code reads from ICON_COLOUR_PRESETS
// [x] No emojis anywhere in this file

import type { ComponentType, SVGAttributes } from 'react'

// Lucide — individual named imports
import { PawPrint, Star, Heart, Home, Search, Trophy, CircleDollarSign, Settings } from 'lucide-react'

// Phosphor — individual named imports only
import {
  PawPrint as PhPawPrint,
  Star as PhStar,
  Heart as PhHeart,
  House as PhHouse,
  MagnifyingGlass as PhMagnifyingGlass,
  Trophy as PhTrophy,
  CurrencyCircleDollar as PhCurrencyCircleDollar,
  Sliders as PhSliders,
} from '@phosphor-icons/react'

// Tabler — individual named imports only
import {
  IconPaw as TbIconPaw,
  IconStar as TbIconStar,
  IconHeart as TbIconHeart,
  IconHome as TbIconHome,
  IconSearch as TbIconSearch,
  IconTrophy as TbIconTrophy,
  IconCoin as TbIconCoin,
  IconAdjustments as TbIconAdjustments,
} from '@tabler/icons-react'

// Remix — individual named imports only
// Line variants (used for line / outline / thin / light / regular styles)
import {
  RiFootprintLine as RiPawPrintLine,
  RiStarLine,
  RiHeartLine,
  RiHomeLine,
  RiSearchLine,
  RiTrophyLine,
  RiMoneyDollarCircleLine,
  RiSettings3Line,
} from '@remixicon/react'

// Fill variants (used for fill / filled / bold / duotone styles)
import {
  RiFootprintFill as RiPawPrintFill,
  RiStarFill,
  RiHeartFill,
  RiHomeFill,
  RiSearchFill,
  RiTrophyFill,
  RiMoneyDollarCircleFill,
  RiSettings3Fill,
} from '@remixicon/react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type IconPack = 'lucide' | 'phosphor' | 'tabler' | 'remix'

/**
 * All valid style values across all packs.
 * - 'default'  → Lucide (only one style)
 * - 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' → Phosphor
 * - 'outline' | 'filled' → Tabler
 * - 'line' | 'fill' → Remix
 */
export type IconStyle =
  | 'default'
  | 'thin'
  | 'light'
  | 'regular'
  | 'bold'
  | 'fill'
  | 'duotone'
  | 'outline'
  | 'filled'
  | 'line'

/** Ordered list of the eight preview concepts */
export const PREVIEW_CONCEPTS = [
  'paw',
  'star',
  'heart',
  'home',
  'search',
  'trophy',
  'coins',
  'settings',
] as const

export type PreviewConcept = typeof PREVIEW_CONCEPTS[number]

// ─── Pack styles ───────────────────────────────────────────────────────────────

export const PACK_STYLES: Record<IconPack, { styles: { value: IconStyle; label: string }[]; default: IconStyle }> = {
  lucide: {
    styles: [{ value: 'default', label: 'Default' }],
    default: 'default',
  },
  phosphor: {
    styles: [
      { value: 'thin',    label: 'Thin'    },
      { value: 'light',   label: 'Light'   },
      { value: 'regular', label: 'Regular' },
      { value: 'bold',    label: 'Bold'    },
      { value: 'fill',    label: 'Fill'    },
      { value: 'duotone', label: 'Duotone' },
    ],
    default: 'regular',
  },
  tabler: {
    styles: [
      { value: 'outline', label: 'Outline' },
      { value: 'filled',  label: 'Filled'  },
    ],
    default: 'outline',
  },
  remix: {
    styles: [
      { value: 'line', label: 'Line' },
      { value: 'fill', label: 'Fill' },
    ],
    default: 'line',
  },
}

// ─── Colour presets ────────────────────────────────────────────────────────────

/**
 * Ordered colour presets for the icon colour picker.
 * Slot 0 (System) has hex: '' — means use var(--t2) via CSS fallback.
 * Teal (#5ECFD8) and Coral (#F4845F) are DS-documented additions; their hex values
 * must not appear anywhere else in component code.
 */
export const ICON_COLOUR_PRESETS: { name: string; hex: string }[] = [
  { name: 'System', hex: ''        },
  { name: 'White',  hex: '#FCFCFD' },
  { name: 'Blue',   hex: '#6E9BFF' },
  { name: 'Pink',   hex: '#F06EAB' },
  { name: 'Green',  hex: '#7DD69B' },
  { name: 'Amber',  hex: '#FCC76E' },
  { name: 'Purple', hex: '#BA8DE9' },
  { name: 'Red',    hex: '#F5899E' },
  { name: 'Teal',   hex: '#5ECFD8' },
  { name: 'Coral',  hex: '#F4845F' },
]

// ─── Icon type alias ───────────────────────────────────────────────────────────

// Generic icon component type compatible with Lucide, Phosphor, Tabler, and Remix
type IconComponent = ComponentType<SVGAttributes<SVGElement> & { size?: number; weight?: string; strokeWidth?: number }>

// ─── Preview icon map ──────────────────────────────────────────────────────────

/**
 * Nested map: pack → style → concept → icon component.
 *
 * Phosphor: fill/filled/bold/duotone styles use the *fill* variant component;
 *           thin/light/regular use the standard (line) variant.
 * Tabler:   outline = stroke icons; filled = filled variants.
 *           Tabler Filled icons share the same component names for most icons —
 *           Tabler does not ship separate *Filled* named exports for all icons;
 *           we use the standard stroke icons for both styles since Tabler's
 *           filled variants are only available for a subset of icons.
 * Remix:    line uses RiXxxLine; fill uses RiXxxFill.
 * Lucide:   single style — all style keys map to the same components.
 */

type ConceptMap = Record<PreviewConcept, IconComponent>
type StyleMap = Record<string, ConceptMap>

const lucideConcepts: ConceptMap = {
  paw:      PawPrint,
  star:     Star,
  heart:    Heart,
  home:     Home,
  search:   Search,
  trophy:   Trophy,
  coins:    CircleDollarSign,
  settings: Settings,
}

const phosphorLineConcepts: ConceptMap = {
  paw:      PhPawPrint as IconComponent,
  star:     PhStar as IconComponent,
  heart:    PhHeart as IconComponent,
  home:     PhHouse as IconComponent,
  search:   PhMagnifyingGlass as IconComponent,
  trophy:   PhTrophy as IconComponent,
  coins:    PhCurrencyCircleDollar as IconComponent,
  settings: PhSliders as IconComponent,
}

// Phosphor fill variant — Phosphor uses the same components but a weight prop;
// we reference the same components here and the rendering layer passes weight="fill"
// or weight="duotone" as appropriate. For the PREVIEW_ICON_MAP, the component
// reference is the same either way — the style drives the weight prop at render time.
const phosphorFillConcepts: ConceptMap = phosphorLineConcepts

const tablerConcepts: ConceptMap = {
  paw:      TbIconPaw as IconComponent,
  star:     TbIconStar as IconComponent,
  heart:    TbIconHeart as IconComponent,
  home:     TbIconHome as IconComponent,
  search:   TbIconSearch as IconComponent,
  trophy:   TbIconTrophy as IconComponent,
  coins:    TbIconCoin as IconComponent,
  settings: TbIconAdjustments as IconComponent,
}

const remixLineConcepts: ConceptMap = {
  paw:      RiPawPrintLine as IconComponent,
  star:     RiStarLine as IconComponent,
  heart:    RiHeartLine as IconComponent,
  home:     RiHomeLine as IconComponent,
  search:   RiSearchLine as IconComponent,
  trophy:   RiTrophyLine as IconComponent,
  coins:    RiMoneyDollarCircleLine as IconComponent,
  settings: RiSettings3Line as IconComponent,
}

const remixFillConcepts: ConceptMap = {
  paw:      RiPawPrintFill as IconComponent,
  star:     RiStarFill as IconComponent,
  heart:    RiHeartFill as IconComponent,
  home:     RiHomeFill as IconComponent,
  search:   RiSearchFill as IconComponent,
  trophy:   RiTrophyFill as IconComponent,
  coins:    RiMoneyDollarCircleFill as IconComponent,
  settings: RiSettings3Fill as IconComponent,
}

export const PREVIEW_ICON_MAP: Record<IconPack, StyleMap> = {
  lucide: {
    default:  lucideConcepts,
    // Lucide has only one style; all style keys fall back to the same map
    thin:     lucideConcepts,
    light:    lucideConcepts,
    regular:  lucideConcepts,
    bold:     lucideConcepts,
    fill:     lucideConcepts,
    duotone:  lucideConcepts,
    outline:  lucideConcepts,
    filled:   lucideConcepts,
    line:     lucideConcepts,
  },
  phosphor: {
    // Line-weight styles use the standard components (weight driven by prop at render time)
    thin:     phosphorLineConcepts,
    light:    phosphorLineConcepts,
    regular:  phosphorLineConcepts,
    bold:     phosphorFillConcepts,
    fill:     phosphorFillConcepts,
    duotone:  phosphorFillConcepts,
    // Fallback entries to satisfy the index type
    default:  phosphorLineConcepts,
    outline:  phosphorLineConcepts,
    filled:   phosphorFillConcepts,
    line:     phosphorLineConcepts,
  },
  tabler: {
    outline:  tablerConcepts,
    filled:   tablerConcepts,
    // Fallback entries
    default:  tablerConcepts,
    thin:     tablerConcepts,
    light:    tablerConcepts,
    regular:  tablerConcepts,
    bold:     tablerConcepts,
    fill:     tablerConcepts,
    duotone:  tablerConcepts,
    line:     tablerConcepts,
  },
  remix: {
    line:    remixLineConcepts,
    fill:    remixFillConcepts,
    filled:  remixFillConcepts,
    // Fallback entries
    default: remixLineConcepts,
    thin:    remixLineConcepts,
    light:   remixLineConcepts,
    regular: remixLineConcepts,
    bold:    remixFillConcepts,
    duotone: remixLineConcepts,
    outline: remixLineConcepts,
  },
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Resolve the correct icon component for a given concept + pack + style.
 * Falls back to the Lucide equivalent silently if the combination is not found.
 * This is the single point of icon resolution — screens must not implement their
 * own fallback logic.
 */
export function resolveIcon(
  concept: PreviewConcept,
  pack: IconPack,
  style: IconStyle
): IconComponent {
  const styleMap = PREVIEW_ICON_MAP[pack] ?? PREVIEW_ICON_MAP.lucide
  const conceptMap = styleMap[style] ?? styleMap[PACK_STYLES[pack].default] ?? PREVIEW_ICON_MAP.lucide.default
  return conceptMap[concept] ?? lucideConcepts[concept]
}
