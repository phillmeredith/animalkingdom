// itemDefs.ts — Static item catalogue for the Item Shop
// Categories: saddle, brush, feed, toy, blanket
// All prices in coins; rarity determines stat boost + visual treatment

import type { Rarity } from '@/lib/db'

export interface ItemDef {
  id: string
  category: 'saddle' | 'brush' | 'feed' | 'toy' | 'blanket'
  name: string
  description: string
  rarity: Rarity
  statBoost: { stat: string; value: number }
  price: number
  uses: number | null // null = infinite
}

export const ITEM_DEFS: ItemDef[] = [
  // ── Saddles ───────────────────────────────────────────────────────────────
  {
    id: 'saddle-basic',
    category: 'saddle',
    name: 'Leather Saddle',
    description: 'A sturdy saddle for everyday riding. Gives a small speed boost in races.',
    rarity: 'common',
    statBoost: { stat: 'speed', value: 2 },
    price: 50,
    uses: null,
  },
  {
    id: 'saddle-racing',
    category: 'saddle',
    name: 'Racing Saddle',
    description: 'Lightweight racing saddle built for speed. Noticeably faster in competitions.',
    rarity: 'uncommon',
    statBoost: { stat: 'speed', value: 5 },
    price: 150,
    uses: null,
  },
  {
    id: 'saddle-champion',
    category: 'saddle',
    name: 'Champion Saddle',
    description: 'Hand-stitched by master craftspeople. A serious edge on the track.',
    rarity: 'rare',
    statBoost: { stat: 'speed', value: 10 },
    price: 400,
    uses: null,
  },
  {
    id: 'saddle-golden',
    category: 'saddle',
    name: 'Golden Saddle',
    description: 'Pure gold accents and the finest leather. Maximum racing advantage.',
    rarity: 'legendary',
    statBoost: { stat: 'speed', value: 18 },
    price: 1200,
    uses: null,
  },

  // ── Brushes ───────────────────────────────────────────────────────────────
  {
    id: 'brush-basic',
    category: 'brush',
    name: 'Soft Brush',
    description: 'Keeps your animal clean and happy. Essential daily care.',
    rarity: 'common',
    statBoost: { stat: 'hygiene', value: 3 },
    price: 30,
    uses: 10,
  },
  {
    id: 'brush-grooming',
    category: 'brush',
    name: 'Grooming Kit',
    description: 'Full kit with brush, comb, and coat spray. Longer-lasting care boost.',
    rarity: 'uncommon',
    statBoost: { stat: 'hygiene', value: 6 },
    price: 100,
    uses: 20,
  },
  {
    id: 'brush-luxury',
    category: 'brush',
    name: 'Luxury Brush',
    description: 'Boar-bristle brush imported from the finest stables. Makes coats gleam.',
    rarity: 'rare',
    statBoost: { stat: 'hygiene', value: 10 },
    price: 280,
    uses: 30,
  },

  // ── Feed ──────────────────────────────────────────────────────────────────
  {
    id: 'feed-basic',
    category: 'feed',
    name: 'Hay Bale',
    description: 'Good quality hay. Keeps herbivores well fed for a few days.',
    rarity: 'common',
    statBoost: { stat: 'energy', value: 3 },
    price: 25,
    uses: 5,
  },
  {
    id: 'feed-premium',
    category: 'feed',
    name: 'Premium Feed Mix',
    description: 'Nutritionally balanced blend tailored to your animal\'s needs.',
    rarity: 'uncommon',
    statBoost: { stat: 'energy', value: 7 },
    price: 80,
    uses: 10,
  },
  {
    id: 'feed-super',
    category: 'feed',
    name: 'Super Boost Pellets',
    description: 'High-performance feed used by championship animals. Maximum energy.',
    rarity: 'epic',
    statBoost: { stat: 'energy', value: 15 },
    price: 350,
    uses: 15,
  },

  // ── Toys ──────────────────────────────────────────────────────────────────
  {
    id: 'toy-ball',
    category: 'toy',
    name: 'Rubber Ball',
    description: 'Classic play toy. Keeps your animal entertained and happy.',
    rarity: 'common',
    statBoost: { stat: 'happiness', value: 3 },
    price: 20,
    uses: 8,
  },
  {
    id: 'toy-rope',
    category: 'toy',
    name: 'Tug Rope',
    description: 'Thick knotted rope for interactive play. Builds bond and happiness.',
    rarity: 'uncommon',
    statBoost: { stat: 'happiness', value: 6 },
    price: 75,
    uses: 15,
  },
  {
    id: 'toy-puzzle',
    category: 'toy',
    name: 'Enrichment Puzzle',
    description: 'Brain-stimulating puzzle toy. Keeps smart animals mentally sharp.',
    rarity: 'rare',
    statBoost: { stat: 'happiness', value: 10 },
    price: 220,
    uses: 20,
  },

  // ── Blankets ──────────────────────────────────────────────────────────────
  {
    id: 'blanket-fleece',
    category: 'blanket',
    name: 'Fleece Blanket',
    description: 'Soft fleece keeps your animal warm on cold nights.',
    rarity: 'common',
    statBoost: { stat: 'comfort', value: 3 },
    price: 35,
    uses: null,
  },
  {
    id: 'blanket-winter',
    category: 'blanket',
    name: 'Winter Rug',
    description: 'Heavy-duty insulated rug for outdoor animals in cold weather.',
    rarity: 'uncommon',
    statBoost: { stat: 'comfort', value: 7 },
    price: 120,
    uses: null,
  },
  {
    id: 'blanket-cashmere',
    category: 'blanket',
    name: 'Cashmere Blanket',
    description: 'Ultra-soft cashmere. The ultimate in animal luxury and comfort.',
    rarity: 'epic',
    statBoost: { stat: 'comfort', value: 13 },
    price: 500,
    uses: null,
  },
]

export type ItemCategory = ItemDef['category']

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  saddle: 'Saddles',
  brush: 'Grooming',
  feed: 'Feed',
  toy: 'Toys',
  blanket: 'Bedding',
}

// Icon names correspond to Lucide components (rendered in ShopScreen)
export const CATEGORY_ICON_NAME: Record<ItemCategory, string> = {
  saddle: 'Disc',
  brush: 'Paintbrush',
  feed: 'Wheat',
  toy: 'Star',
  blanket: 'BedDouble',
}

export function getItemDef(id: string): ItemDef | undefined {
  return ITEM_DEFS.find(d => d.id === id)
}
