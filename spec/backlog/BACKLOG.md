# Backlog

## Status Values
- `queued` — not yet specified
- `specified` — feature package complete, awaiting review
- `ready` — reviewed and approved by [OWNER]
- `in_progress` — agents dispatched, build underway
- `in_review` — built, tester validating
- `complete` — passed quality gate
- `blocked` — dependency not met

---

## Feature Backlog

| Feature | Tier | Status | Dependencies | Est. Complexity |
|---------|------|--------|--------------|-----------------|
| Database schema | 0 | complete | none | low |
| Core hooks (wallet, reducedMotion, speech) | 0 | complete | database | medium |
| Notification system (toasts) | 0 | complete | design system impl | low |
| Navigation shell (routing, tabs, overlays) | 0 | complete | design system impl | medium |
| Design system implementation (shared components) | 0 | complete | none | high |
| Home screen | 1 | complete | Tier 0 | medium |
| Explore / Directory | 1 | complete | Tier 0 | high |
| Generate Wizard | 1 | complete | Tier 0 | high |
| My Animals / Collection | 1 | complete | Tier 0 | medium |
| Arcade — Coin Rush (Maths) | 1 | complete | Tier 0 | high |
| Arcade — Word Safari (Spelling) | 1 | complete | Tier 0 | high |
| Arcade — Habitat Builder (Science) | 1 | complete | Tier 0 | high |
| Arcade — World Quest (Geography) | 1 | complete | Tier 0 | high |
| Arcade Hub (PuzzleHubScreen) | 1 | complete | Tier 0 | medium |
| Settings | 1 | complete | Tier 0 | low |
| Item Shop (Supplies) | 2 | complete | Wallet | medium |
| Care System | 2 | complete | My Animals | medium |
| Cards System | 2 | complete | My Animals | medium |
| Marketplace (NPC Offers) | 2 | complete | Wallet, My Animals | high |
| Racing | 2 | complete | Wallet, My Animals, Item Shop | high |
| Auctions | 3 | complete | Marketplace | high |
| Player Listings | 3 | complete | Marketplace | high |
| Compare Screen | 3 | queued | My Animals, Cards | medium |
| Explore rarity filter | 2 | complete | Explore / Directory | low |
| Generate rarity gate | 2 | complete | Generate Wizard, Explore | low |
| Pack opening confirmation sheet | 2 | complete | Cards System | low |
| Card collection detail sheet | 2 | complete | Cards System, stats schema | medium |
| Racing improvements (label, countdown, nav badge) | 2 | complete | Racing | low |
| Race progress modal | 2 | complete | Racing improvements | high |
| Racing hook integrity fixes (TD-001–004) | 2 | in_progress | Racing | medium |
| Explore animal detail — full-screen profile | 2 | complete | Explore / Directory | high |
| Settings — data import / export | 3 | queued | Database schema | medium |
| Settings — personalisation (background, font) | 3 | in_progress | Settings, Design System | medium |
| Schleich Collection Tracker | 2 | in_progress | none | high |
| LeMieux Equipment System | 2 | in_progress | Item Shop, My Animals, Racing | high |
| Activity Feed | 4 | queued | All Tier 1-3 | medium |
| Achievement Badges | 4 | queued | All systems | medium |
| Transaction History | 4 | queued | Wallet | low |
| Past Sales History | 4 | queued | Player Listings | low |

---

## Completed Features

| Feature | Completed | Notes |
|---------|-----------|-------|
| Auctions | 2026-03-28 | NPC-driven daily animal auctions with bid/buy-now/win/loss flows. DEF-03 (offline toast copy) deferred to before Tier 3 completion. |
| Player Listings | 2026-03-28 | Player-listed pet sales with NPC buyer offers. DEF-008 (toast tap navigation) and DEF-010 (expired listing summary card) deferred as separate backlog stories. |
