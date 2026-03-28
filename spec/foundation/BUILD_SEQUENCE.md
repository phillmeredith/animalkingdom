# Build Sequence

> Defines what must be built before what.
> All items within a tier can be built in parallel.
> No item in Tier N can be started until all Tier N-1 items are complete.

---

## Dependency Tiers

### Tier 0 — Core Infrastructure
> Must exist before anything else. Every feature depends on these.

- [ ] **Database schema** — All 17 tables defined in `src/lib/db.ts` with Dexie indexes matching ENTITY_MODEL.md
- [ ] **Core hooks** — useWallet, useReducedMotion, useSpeech (leaf hooks with no feature dependencies)
- [ ] **Notification system** — Toast provider, Toast component (4 types + undo variant), stacking logic
- [ ] **Navigation shell** — React Router setup, 5-tab BottomNav, overlay/modal system, PageHeader, GradientFade
- [ ] **Design system implementation** — Tailwind config with CSS variables, all shared components: Button (7×3), Card, BottomSheet, Modal, Badge, PillToggle, CoinDisplay, EmptyState, LoadingState, AnimalImage, RarityBorder, SearchBar, StatCard, Avatar, DataTable

### Tier 1 — Independent Features
> Depend only on Tier 0. No cross-feature dependencies.

- [ ] **Home screen** — Daily login bonus, pet dashboard (grouped cards with care circles, mood dots), daily quest, achievement badge scroll, activity feed placeholder, rescue alerts
- [ ] **Explore / Directory** — Searchable encyclopedia (4,600+ animals), category pills, A-Z rail with virtualised list, animal profile overlay with stats/habitat/facts, stealth quiz (50% after 8s)
- [ ] **Generate Wizard** — 7-step wizard (category → type → gender → age → personality → breed → colour), name generation with 3+ suggestions, discovery narrative, ResultsScreen, adoption flow, TraderPuzzle
- [ ] **My Animals / Collection** — Collection grid grouped by category, pet counts, tap → profile, delete with confirmation, history link, "Find an animal" pill
- [ ] **Arcade — Coin Rush** — Maths game, 10 rounds, 4 multiple-choice, tier 1-4, streak flame, adaptive difficulty, effort-based rewards, GameShell + GameOver
- [ ] **Arcade — Word Safari** — Spelling game, letter tiles, drag into gaps, undo, progress ring, tier 1-4
- [ ] **Arcade — Habitat Builder** — Science game, tap correct habitat, bonus questions T2+, tier 1-4
- [ ] **Arcade — World Quest** — Geography game, SVG world map, continent tapping, tier 1-4
- [ ] **Arcade Hub (PuzzleHubScreen)** — Hero image, gamer tag, skill rank bars, daily bonus card, 2×2 game grid — depends on: useProgress hook
- [ ] **Settings** — Accent colour picker, accessibility toggles (reduce motion, read aloud), data export/import (PIN: 2459), skill progress view

### Tier 2 — Features Depending on Tier 1
> Each depends on Tier 0 + specific Tier 1 features.

- [ ] **Item Shop (Supplies)** — depends on: useWallet — 2-column grid, 6 category pills, 26 items, buy with undo, sell at 50%, rarity visual hierarchy, useItemShop hook
- [ ] **Care System** — depends on: My Animals — CareScreen overlay, drag-and-drop interaction, daily care log, streak tracking, mood system, useCareLog hook
- [ ] **Cards System** — depends on: My Animals — Daily pack (5 cards), pack opening animation, collection grid by rarity, progress bars, duplicate tracking, useCardPacks hook
- [ ] **Marketplace (NPC Offers)** — depends on: useWallet, My Animals — Hero image, NPC buy/sell offers, accept/decline flow, naming after purchase, useMarketplace hook (core)
- [ ] **Racing** — depends on: useWallet, My Animals, Item Shop — Race cards with countdown, horse selection modal, entry fees, results calculation, prize distribution, useRacing hook

### Tier 3 — Complex Integrated Features
> Depend on multiple Tier 1 and Tier 2 features.

- [ ] **Auctions** — depends on: Marketplace — eBay-style bidding, NPC counter-bids, anti-snipe timer extension, won/lost/expired states, naming on win, past auctions view
- [ ] **Player Listings** — depends on: Marketplace — List for sale flow, views counter simulation, NPC watcher personas, enquiry messages, staggered offers, counter-offer mechanic, offer expiry, listing detail with live stats
- [ ] **Compare Screen** — depends on: My Animals, Cards — Side-by-side stat comparison, search-and-add slots, visual stat bars, winner summary

### Tier 4 — Polish and Cross-Cutting
> Aggregates data from across the system. Built last.

- [ ] **Activity Feed** — depends on: all Tier 1-3 — Aggregated feed on Home, social posts from feedRng, rescue alert generation, useFeed hook
- [ ] **Achievement Badges** — depends on: all systems — 5 badge tracks × 4 ranks, milestone detection, celebration overlays, badge scroll on Home
- [ ] **Transaction History** — depends on: useWallet — Tap coin display → history view, last 50 transactions, filter by type, running balance
- [ ] **Past Sales History** — depends on: Player Listings — Sales archive, buyer names, final prices, running total, highest sale badge

---

## Per-Tier Rules

1. All items in a tier can be built in parallel
2. No item in Tier N can start until all Tier N-1 items are `complete` in BACKLOG.md
3. Within a tier, build order is recommended but not mandatory
4. If a dependency is blocked, escalate to [OWNER] — do not proceed without it
