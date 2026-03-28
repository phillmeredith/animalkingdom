# Design System

> Foundation: NFT Dark Design System (Crypter / CryptoKet / THStore)
> Adapted for Animal Kingdom — an iPad PWA for a child with ADHD and autism.
> Every visual decision in the project must come from here.
> Agents re-read this file at the start of every build phase.
> If a value isn't defined here, ask [OWNER] — do not guess.

---

## CSS Variable Block

Every page and component pulls from these variables. This is the single source of truth.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

:root {
  /* ── Surfaces (5-level stack) ── */
  --bg: #0D0D11;
  --card: #18181D;
  --elev: #23262F;
  --border: #353945;
  --border-s: #2C2F3A;

  /* ── Blue (primary / utility) ── */
  --blue: #3772FF;
  --blue-h: #2B5FD9;
  --blue-sub: rgba(55,114,255,.12);
  --blue-t: #6E9BFF;

  /* ── Pink (accent / CTA / reward) ── */
  --pink: #E8247C;
  --pink-h: #C91E6A;
  --pink-sub: rgba(232,36,124,.12);
  --pink-t: #F06EAB;

  /* ── Green (success) ── */
  --green: #45B26B;
  --green-sub: rgba(69,178,107,.12);
  --green-t: #7DD69B;

  /* ── Amber (warning) ── */
  --amber: #F5A623;
  --amber-sub: rgba(245,166,35,.12);
  --amber-t: #FCC76E;

  /* ── Red (danger / error) ── */
  --red: #EF466F;
  --red-sub: rgba(239,70,111,.12);
  --red-t: #F5899E;

  /* ── Purple (feature / special) ── */
  --purple: #9757D7;
  --purple-sub: rgba(151,87,215,.12);
  --purple-t: #BA8DE9;

  /* ── Text ── */
  --t1: #FCFCFD;
  --t2: #B1B5C4;
  --t3: #777E91;
  --t4: #52566A;

  /* ── Gradients ── */
  --grad-hero: linear-gradient(135deg, #E8247C, #3772FF);
  --grad-warm: linear-gradient(135deg, #F5A623, #E8247C);
  --grad-cool: linear-gradient(135deg, #3772FF, #9757D7);
  --grad-mint: linear-gradient(135deg, #45B26B, #3772FF);
  --grad-aurora: linear-gradient(135deg, #9757D7, #3772FF 50%, #45B26B);

  /* ── Radius ── */
  --r-xs: 6px;
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 20px;
  --r-pill: 100px;

  /* ── Shadows ── */
  --sh-card: 0 4px 24px rgba(0,0,0,.25);
  --sh-elevated: 0 8px 40px rgba(0,0,0,.35);
  --glow-blue: 0 0 24px rgba(55,114,255,.25);
  --glow-pink: 0 0 24px rgba(232,36,124,.25);

  /* ── Font ── */
  --font: 'DM Sans', 'Inter', system-ui, sans-serif;
}
```

---

## Colours

### Surfaces (5-level stack)

Depth is created by stacking these levels. A card (`--card`) sits on the page (`--bg`). An element inside a card uses `--elev`. Borders use `--border-s` at rest and `--border` on hover. No drop shadows on static elements.

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#0D0D11` | Page background, true near-black |
| `--card` | `#18181D` | Cards, elevated surfaces, input backgrounds |
| `--elev` | `#23262F` | Secondary surfaces, active tab backgrounds, icon circles |
| `--border` | `#353945` | Visible borders, dividers, hover border state |
| `--border-s` | `#2C2F3A` | Subtle borders (default card border, input border at rest) |

### Brand — Dual Accent System

Animal Kingdom uses TWO brand accent colours. Both are first-class citizens. The tension between blue and pink is a core design feature.

**Blue (#3772FF)** — Primary / Utility
- Explore, search, navigate, connect, utility actions
- Focus rings, active states, links

**Pink (#E8247C)** — Accent / CTA / Reward
- Adopt, buy, bid, play, earn coins, celebrate
- All reward moments and purchase CTAs

| Token | Value | Usage |
|-------|-------|-------|
| `--blue` | `#3772FF` | Primary buttons, focus rings, active states |
| `--blue-h` | `#2B5FD9` | Blue hover state |
| `--blue-sub` | `rgba(55,114,255,.12)` | Blue tinted backgrounds (badges, banners) |
| `--blue-t` | `#6E9BFF` | Blue text on dark backgrounds |
| `--pink` | `#E8247C` | Accent buttons (adopt, buy, bid), reward CTAs |
| `--pink-h` | `#C91E6A` | Pink hover state |
| `--pink-sub` | `rgba(232,36,124,.12)` | Pink tinted backgrounds |
| `--pink-t` | `#F06EAB` | Pink text on dark backgrounds |

### Tint Pair System

Every semantic colour exists as THREE values: solid, translucent background (12% opacity), and light text variant. Badges, banners, and flat buttons ALWAYS use the tint pair (translucent bg + light text), NEVER solid colour with white text.

| Colour | Solid | Sub (12%) | Text |
|--------|-------|-----------|------|
| Blue | `#3772FF` | `rgba(55,114,255,.12)` | `#6E9BFF` |
| Pink | `#E8247C` | `rgba(232,36,124,.12)` | `#F06EAB` |
| Green | `#45B26B` | `rgba(69,178,107,.12)` | `#7DD69B` |
| Amber | `#F5A623` | `rgba(245,166,35,.12)` | `#FCC76E` |
| Red | `#EF466F` | `rgba(239,70,111,.12)` | `#F5899E` |
| Purple | `#9757D7` | `rgba(151,87,215,.12)` | `#BA8DE9` |

### Text

| Token | Hex | Use |
|-------|-----|-----|
| `--t1` | `#FCFCFD` | Primary — headings, active nav, important values, button text |
| `--t2` | `#B1B5C4` | Secondary — body copy, descriptions, nav links |
| `--t3` | `#777E91` | Tertiary — placeholders, captions, labels, timestamps |
| `--t4` | `#52566A` | Disabled — disabled inputs, inactive elements |

### State Colours

| Token | Solid | Sub | Text | Use |
|-------|-------|-----|------|-----|
| Success | `--green` | `--green-sub` | `--green-t` | Completed, care done, correct answer |
| Warning | `--amber` | `--amber-sub` | `--amber-t` | Auction ending, low coins, pending |
| Error | `--red` | `--red-sub` | `--red-t` | Wrong answer, delete, failed |
| Info | `--blue` | `--blue-sub` | `--blue-t` | Neutral updates |

### Rarity Colours

| Tier | Solid | Sub bg | Text | Visual treatment |
|------|-------|--------|------|------------------|
| Common | `#777E91` | `rgba(119,126,145,.12)` | `#B1B5C4` | 1px left border, no tint |
| Uncommon | `--green` | `--green-sub` | `--green-t` | Green left border + subtle green tint |
| Rare | `--blue` | `--blue-sub` | `--blue-t` | Blue border + blue background tint |
| Epic | `--purple` | `--purple-sub` | `--purple-t` | Purple ring + purple tint |
| Legendary | `--amber` | `--amber-sub` | `--amber-t` | Amber ring + amber tint + shimmer animation |

### Gradients

| Name | Value | Use in Animal Kingdom |
|------|-------|----------------------|
| Hero | `135deg, #E8247C → #3772FF` | Celebration overlays, adoption moments, hero banners |
| Warm | `135deg, #F5A623 → #E8247C` | Racing themes, warm accents, streak badges |
| Cool | `135deg, #3772FF → #9757D7` | Explore/directory themes, card pack reveal |
| Mint | `135deg, #45B26B → #3772FF` | Care/nature themes, habitat builder |
| Aurora | `135deg, #9757D7 → #3772FF 50% → #45B26B` | Legendary items, premium features, special badges |

Avatars rotate through these in sequence (hero → cool → mint → warm → aurora).

---

## Typography

Font family: `'DM Sans', 'Inter', system-ui, sans-serif`
Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

| Name | Size | Weight | Line-height | Letter-spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Hero | 64px | 700 | 1.1 | -1.5px | Landing/splash screen text |
| H1 | 48px | 700 | 1.15 | -1px | Page titles |
| H2 | 36px | 700 | 1.2 | -0.5px | Section headings |
| H3 | 28px | 600 | 1.3 | -0.3px | Subsection headings, stat values |
| H4 | 22px | 600 | 1.35 | 0 | Card titles, modal titles |
| Body Lg | 18px | 400 | 1.6 | 0 | Lead paragraphs, feature descriptions |
| Body | 15px | 400 | 1.6 | 0 | Default body copy, descriptions |
| Body Sm | 13px | 400 | 1.5 | 0 | Compact text, stat labels, filter options |
| Caption | 11px | 500 | 1.4 | 0.5px | Metadata, small helper text |
| Hairline | 11px | 700 | 1.3 | 1.5px | Section labels, input labels, table headers (ALWAYS uppercase) |
| Button | 14px | 600 | 1 | 0.3px | Default button text |
| Button Sm | 12px | 600 | 1 | 0.3px | Small button text |
| Minimum | 11px | — | — | — | Nothing in the app is smaller than 11px |

---

## Spacing

Only use these values — never invent spacing:

```
4px  6px  8px  10px  12px  14px  16px  20px  24px  28px  32px  40px  48px  56px  64px  80px
```

| Pattern | Value |
|---------|-------|
| Gap between icon and label in button | `8px` |
| Card padding | `20px` |
| Card body padding (inside cards) | `16px` |
| Section margin-bottom | `56px` |
| Grid gap (default) | `12px` |
| Grid gap (stats) | `16px` |
| Grid gap (card groups) | `20px` |
| Input label to input | `6px` |
| Badge padding | `4px 10px` |
| Nav item padding | `10px 12px` |
| Modal padding | `28px` |
| Table cell padding | `14px 20px` |
| Page horizontal margin (iPad) | `24px` |
| Page top padding | `24px` |
| Page bottom padding (above nav) | `24px` (96px — clears 68px nav + gradient fade) |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--r-xs` | `6px` | Delta badges (up/down indicators) |
| `--r-sm` | `8px` | Icon buttons, small chips, logo squares |
| `--r-md` | `12px` | Inputs, nav items, inner containers |
| `--r-lg` | `16px` | Cards, hero banners, stat cards, table wraps |
| `--r-xl` | `20px` | Modal containers, bottom sheets (top corners) |
| `--r-pill` | `100px` | Buttons, badges, tabs, segmented controls, pills |

**Key rules:**
- Buttons are ALWAYS pill (100px). No exceptions.
- Cards are ALWAYS 16px.
- Inputs are ALWAYS 12px.

---

## Borders

| Token | Value | Use |
|-------|-------|-----|
| Default | `1px solid var(--border-s)` (`#2C2F3A`) | Standard card border, input at rest, table dividers |
| Hover | `1px solid var(--border)` (`#353945`) | Card hover, input hover |
| Brand | `1px solid var(--blue)` | Active/selected/focus state |
| Error | `1px solid var(--red)` | Validation error state |

---

## Shadows / Elevation

| Level | Value | Use |
|-------|-------|-----|
| Level 0 | none | All static elements — depth comes from surface stack + borders |
| Level 1 (Card hover) | `0 4px 24px rgba(0,0,0,.25)` | Cards on hover (with `translateY(-2px)`) |
| Level 2 (Elevated) | `0 8px 40px rgba(0,0,0,.35)` | Modals, overlays |
| Glow Blue | `0 0 24px rgba(55,114,255,.25)` | Primary button hover |
| Glow Pink | `0 0 24px rgba(232,36,124,.25)` | Accent button hover |

**Rule:** NO shadows on static elements. Cards at rest have only a 1px border. Shadows appear ONLY on hover-lifted cards and modals/overlays. Glow appears ONLY on primary/accent button hover.

---

## Component Patterns

### Buttons

All buttons are pill-shaped (`border-radius: 100px`). This is the system's most distinctive feature.

**Sizes:**
| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 36px | `0 16px` | 13px/600 |
| md | 44px | `0 20px` | 14px/600 |
| lg | 48px | `0 28px` | 15px/600 |

Note: `md` is 44px (bumped from 42px to meet minimum touch target).

**Variants (7):**
| Variant | Background | Text | Hover |
|---------|-----------|------|-------|
| Primary | `--blue` | `#fff` | `--blue-h` + glow-blue |
| Accent | `--pink` | `#fff` | `--pink-h` + glow-pink |
| Outline | transparent + `1.5px solid --border` | `--t1` | border → `--t3`, bg → `rgba(255,255,255,.03)` |
| Ghost | `rgba(255,255,255,.06)` | `--t1` | bg → `rgba(255,255,255,.1)` |
| Flat Blue | `--blue-sub` | `--blue-t` | — |
| Flat Pink | `--pink-sub` | `--pink-t` | — |
| Flat Green | `--green-sub` | `--green-t` | — |

**States:**
- Active: `transform: scale(.97)`
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px`
- Disabled: `opacity: .4; pointer-events: none; cursor: not-allowed`

**Icon buttons:** Same height as size, square (equal width and height), pill radius.

### Cards

```
Surface:    var(--card) (#18181D)
Border:     1px solid var(--border-s) (#2C2F3A)
Radius:     16px (--r-lg)
Padding:    20px (outer) / 16px (body section)
Shadow:     none at rest
```

**Hover state:**
```
Border:     var(--border) (#353945)
Transform:  translateY(-2px)
Shadow:     var(--sh-card)
Transition: all .3s
```

**Card footer:** `border-top: 1px solid var(--border-s); padding: 12px 16px`

### Modals / Bottom Sheets

**Glass tokens — surface opacity varies by backdrop:**
```
/* BottomNav, Toast (no backdrop) */
--glass-bg:        rgba(13,13,17,.88)

/* Modal, BottomSheet (above bg-black/10 backdrop) */
--glass-bg-modal:  rgba(13,13,17,.80)
backdrop div:      bg-black/10  ← never higher

/* Shared */
--glass-border:    rgba(255,255,255,.06)
backdrop-filter:   blur(24px)
```
Why the split: a backdrop darkens the content the blur samples — `.88` over a dark backdrop reads as more opaque than `.88` with no backdrop. `.80` over `bg-black/10` visually matches `.88` over no backdrop; they read as the same material. Hard opaque surfaces (`var(--card)`, `var(--elev)`) are never used on floating elements. FE must compare any new overlay against the BottomNav during self-review — same material, same feel.

**Backdrop (light scrim — lets content show through glass):**
```
Position:     fixed inset 0
Background:   rgba(0,0,0,.30)
Z-index:      1000
```

**Modal card (centred):**
```
Background:   rgba(13,13,17,.88) + backdrop-filter: blur(24px)
Border:       1px solid rgba(255,255,255,.06)
Radius:       16px (--r-lg)
Padding:      28px
Max-width:    420px
Shadow:       var(--sh-elevated)
```

**Bottom sheet (slides up from bottom):**
```
Background:   rgba(13,13,17,.88) + backdrop-filter: blur(24px)
Border:       1px solid rgba(255,255,255,.06) (top + sides; no bottom border)
Radius:       16px 16px 0 0 (top corners only)
Max height:   85vh
```

**Drag handle:** `width: 40px; height: 4px; background: rgba(255,255,255,.2); border-radius: 9999px; margin: 8px auto 0`

**Bottom Nav:**
```
Background:   rgba(13,13,17,.88) + backdrop-filter: blur(24px)
Border:       1px solid rgba(255,255,255,.04) (top only)
Height:       68px (safe-area aware)
Gradient fade above: linear-gradient(to top, rgba(13,13,17,.85), transparent), height 48px
```

**Close button:** 32px circle, `bg: var(--elev)`, `color: var(--t3)`, top-right corner. Hover: `bg: var(--border), color: var(--t1)`.

**Animation:** Framer Motion spring `{ type: "spring", stiffness: 300, damping: 30 }`. Bottom sheets slide up from `y: "100%"`. Centred modals scale from `scale: 0.95, opacity: 0`.

---

### Portal Pattern for Fixed Overlays

Any component that uses `position: fixed` to cover the viewport must be rendered via `createPortal(…, document.body)`.

**Why this is required:**

CSS `position: fixed` positions an element relative to the viewport only when no ancestor creates a new stacking context or containing block. The following ancestor properties break fixed positioning by creating a containing block:

- `transform` (any value, including CSS animations and Framer Motion animated transforms)
- `opacity` less than 1 (including Framer Motion `initial={{ opacity: 0 }}` and in-progress fade animations)
- `filter` (any value)
- `will-change: transform` or `will-change: opacity`
- `perspective` (any value)

Because Framer Motion applies `transform` and `opacity` to animate components, any `position: fixed` child of a `motion.*` element is at risk of containment inside that subtree rather than the viewport. This affects confetti overlays, celebration layers, modals, toasts, and any full-viewport fixed layer rendered inside an animated parent.

**The fix — always use createPortal for fixed overlays:**

```tsx
import { createPortal } from 'react-dom'

function FullViewportOverlay() {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {/* overlay content */}
    </div>,
    document.body,
  )
}
```

By portalling to `document.body`, the fixed element's containing block is always the viewport, regardless of the animation state of its React parent tree.

**Applies to:**
- All particle burst and celebration overlays (confetti, etc.)
- `Modal` and `BottomSheet` components
- `Toast` notifications
- Any overlay with `position: fixed` rendered inside a `motion.*` subtree

**The glass rule and z-index still apply.** Using `createPortal` does not exempt an overlay from the glass treatment or z-index hierarchy. Glass rule, backdrop, and surface level must still be correct.

**Do not use portals to work around layout problems.** `createPortal` solves the stacking context / containing block problem only. It does not solve incorrect z-index, incorrect positioning, or missing glass treatment. Fix those in the component itself.

---

### Badges / Pills

**Tinted badges (default — ALWAYS prefer these):**
```
Display:      inline-flex
Align:        center
Gap:          5px
Padding:      4px 10px
Radius:       100px (pill)
Font:         12px / 600
```

| Variant | Background | Text |
|---------|-----------|------|
| Blue | `--blue-sub` | `--blue-t` |
| Pink | `--pink-sub` | `--pink-t` |
| Green | `--green-sub` | `--green-t` |
| Amber | `--amber-sub` | `--amber-t` |
| Red | `--red-sub` | `--red-t` |
| Purple | `--purple-sub` | `--purple-t` |

**Solid badges (price tags on cards ONLY):**
| Variant | Background | Text |
|---------|-----------|------|
| Blue | `--blue` | `#fff` |
| Pink | `--pink` | `#fff` |
| Green | `--green` | `#fff` |

**Delta badges (stat changes — NOT pill shape):**
```
Padding:      2px 8px
Radius:       6px (--r-xs) — intentionally NOT pill
Font:         12px / 600
```
- Up: `bg: --green-sub, color: --green-t`
- Down: `bg: --red-sub, color: --red-t`

### Tabs / Sub-tabs (Segmented Control)

**Container:**
```
Display:      inline-flex
Background:   var(--card) (#18181D)
Border:       1px solid var(--border-s)
Radius:       100px (pill)
Padding:      4px
Gap:          2px
```

**Tab item:**
```
Padding:      8px 16px
Radius:       100px
Font:         13px / 500
Colour:       var(--t3)
Transition:   all .2s
```

**States:**
- Hover: `color: var(--t2)`
- Active: `background: var(--elev); color: var(--t1)`

**Category filter pills (standalone):** Use `btn-sm btn-primary` for active, `btn-sm btn-outline` for inactive.

### Toast Notifications

**Position:** Top-centre, fixed
**Max visible:** 3
**Stacking:** Newest on top, older push down

**Anatomy (uses banner pattern):**
```
Display:      flex
Align:        flex-start
Gap:          12px
Padding:      14px 16px
Radius:       14px
Border:       1px solid [severity colour at 20%]
```

**Icon circle:** 32px, rounded-full, tinted bg, solid colour icon.

| Type | Background | Border | Icon bg | Title colour | Auto-dismiss |
|------|-----------|--------|---------|-------------|-------------|
| Success | `--green-sub` | `rgba(69,178,107,.2)` | `--green-sub` | `--green-t` | 3s |
| Warning | `--amber-sub` | `rgba(245,166,35,.2)` | `--amber-sub` | `--amber-t` | 5s |
| Error | `--red-sub` | `rgba(239,70,111,.2)` | `--red-sub` | `--red-t` | Persistent (manual dismiss) |
| Info | `--blue-sub` | `rgba(55,114,255,.2)` | `--blue-sub` | `--blue-t` | 3s |

**Undo toast:** Info variant with inline undo button (flat-blue), 5s auto-dismiss. Double-tap guard on undo button.

**Animation:** Slide down from top, 300ms. Slide up to dismiss.

### Form Inputs

**Text input:**
```
Height:       44px
Padding:      0 16px
Background:   var(--card) (#18181D)
Border:       1.5px solid var(--border-s)
Radius:       12px (--r-md)
Font:         14px / var(--font)
Colour:       var(--t1)
Placeholder:  var(--t3)
```

**States:**
- Focus: `border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-sub)`
- Error: `border-color: var(--red); box-shadow: 0 0 0 3px var(--red-sub)`
- Success: `border-color: var(--green); box-shadow: 0 0 0 3px var(--green-sub)`

**Labels:** Hairline style — `11px, weight 700, uppercase, letter-spacing 1px, color: var(--t3)`. Gap between label and input: `6px`.

**Textarea:** Same as input but `min-height: 100px; padding: 12px 16px; resize: vertical`.

**Select:** `appearance: none` with custom SVG chevron, dark background options.

### Navigation (Bottom Tab Bar)

```
Position:     fixed bottom 0
Width:        100%
Background:   rgba(13, 13, 17, .85)
Backdrop:     blur(20px)
Border-top:   1px solid var(--border-s)
Height:       80px
Padding:      8px 0 env(safe-area-inset-bottom, 0)
Z-index:      900
```

**5 tabs:** Home (House), Explore (Search), My Animals (Heart), Play (Gamepad), Shop (Store)

**Tab item:**
```
Display:      flex-col, items-center
Gap:          4px
Font:         11px / 500
Min-width:    64px
```

| State | Icon colour | Label colour |
|-------|-------------|-------------|
| Active | `--blue` (`#3772FF`) | `--t1` (`#FCFCFD`) |
| Inactive | `--t3` (`#777E91`) | `--t3` |

**Gradient fade above nav:** `linear-gradient(to top, #0D0D11, transparent)`, height `32px`, fixed above bottom nav on scrollable pages.

### Coin Display

Pill badge showing coin balance. Used in page headers.

```
Display:      inline-flex
Align:        center
Gap:          6px
Padding:      6px 14px
Background:   var(--amber-sub)
Colour:       var(--amber-t)
Radius:       100px (pill)
Font:         14px / 700
```

Icon: Lucide `Coins` at 16px, colour `--amber`.

### Stat Cards

```
Background:   var(--card)
Border:       1px solid var(--border-s)
Radius:       16px
Padding:      20px
```

- Label: `13px, color: var(--t3), margin-bottom: 8px`
- Value: `28px, weight 700, letter-spacing -0.5px`
- Delta: uses delta badge (see Badges section)

### Data Tables

```
Table:        width 100%, border-collapse
Header:       11px/700, uppercase, letter-spacing 1.2px, color: var(--t3), padding: 12px 20px
Cell:         14px, color: var(--t2), padding: 14px 20px
Row border:   1px solid var(--border-s)
Row hover:    rgba(255,255,255,.015)
```

Wrap in card container: `background: var(--card); border: 1px solid var(--border-s); border-radius: 16px; overflow: hidden`.

### Animal Image (with fallback)

```
Aspect ratio: 1:1
Object-fit:   cover
Background:   var(--elev) (placeholder colour)
Radius:       inherits from parent
```

**Fallback:** Paw-print SVG icon centred on `--elev` background, colour `--t4`, size 48px.

### Rarity Border

Left-border accent on card:
```
Common:       border-left: 3px solid #777E91
Uncommon:     border-left: 3px solid var(--green); background: var(--green-sub)
Rare:         border-left: 3px solid var(--blue); background: var(--blue-sub)
Epic:         ring: 2px solid var(--purple); background: var(--purple-sub)
Legendary:    ring: 2px solid var(--amber); background: var(--amber-sub); shimmer animation
```

### Empty State

```
Text-align:   center
Padding:      48px 24px
Icon:         48px, colour var(--t4), margin-bottom: 16px
Title:        H4 (22px/600), colour var(--t1), margin-bottom: 8px
Description:  Body (15px/400), colour var(--t3), max-width: 280px, margin: 0 auto
CTA:          btn-md btn-primary, margin-top: 20px
```

### Page Header

```
Display:       grid
Grid:          1fr auto 1fr
Align:         center
Padding:       24px 24px 0 24px  (px-6 pt-6)
Border-bottom: 1px solid rgba(255,255,255,.06)
Background:    rgba(13,13,17,.72) + backdrop-filter: blur(24px)
Position:      sticky top-0 z-[100]
```

- Left cell (`title`): Screen title, H2 or H3, left-aligned. Always present.
- Centre cell (`centre`): Section switcher (segmented control), if applicable. Compact inline-flex. Never full-width.
- Right cell (`trailing`): CoinDisplay or a single trailing action. Always present.

**Slot rules — non-negotiable:**

`centre` slot: for controls that select which major content section is visible (e.g. Market / Items / Cards; Games / Racing). Must be compact — sized to its content using `display: inline-flex`. Must NOT be full-width. If there is no section switcher, leave the centre cell empty.

`below` slot: for content filters and search bars that operate on content within the currently selected section (category pills, search input, sub-view pills such as Browse / My Listings). Renders as a `flex flex-col gap-3 pb-4` block inside the same glass surface, below the title row. Full-width is acceptable here. Never use the `below` slot for a section switcher — it will render full-width and break the layout intent.

**Navigation ownership rule:**

Every navigation control belongs to exactly one place. A control rendered in the `below` slot means the content component below it receives the active value as a prop. The content component must not render its own copy of that control. Duplicate navigation is a layout defect.

**Content area gap:**

The first scrollable content container below the PageHeader must have `pt-4` (16px) as its top padding. This creates visible separation between the sticky glass border and the first content element. If the screen has no `below` slot content, use `pt-6` (24px). FE must not omit this.

Full content container class string: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`

**Filter pills style (canonical):**

Filter pills in the `below` slot always use tint-pair active state. This is the pattern established by ExploreScreen's CategoryPills component. All future filter implementations must match it.

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Active | `var(--blue-sub)` | `1px solid var(--blue)` | `var(--blue-t)` |
| Inactive | `var(--card)` | `1px solid var(--border-s)` | `var(--t2)` |

Solid blue fill (`background: var(--blue); color: white`) is prohibited on filter pills — it is reserved for primary action buttons.

**Page Header layout diagram:**

```
┌──────────────────────────────────────────────────────┐  sticky glass
│  [Title]            [Section switcher]   [Coins]     │  grid: 1fr auto 1fr, pb-4
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  (below slot, if present)
│  [Search bar or category filter pills]               │  flex col, gap 3, pb-4
└──────────────────────────────────────────────────────┘  border-bottom
                                                           ↕ pt-4 gap (mandatory)
┌──────────────────────────────────────────────────────┐
│  Content area (px-6 pt-4 pb-24 max-w-3xl mx-auto)   │  scrollable
```

---

## Animation

### Durations

| Name | Value | Use |
|------|-------|-----|
| instant | `0ms` | Reduced-motion fallback for all animations |
| fast | `150ms` | Micro-interactions, button press, hover transitions |
| normal | `300ms` | State changes, card updates, toast enter/exit |
| slow | `500ms` | Page transitions, modal enter/exit |
| celebration | `800–1200ms` | Reward moments, coin bursts, adoption celebrations |

### Easing

| Name | Value | Use |
|------|-------|-----|
| ease-out | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering view |
| ease-in | `cubic-bezier(0.7, 0, 0.84, 0)` | Elements leaving view |
| spring | `{ type: "spring", stiffness: 300, damping: 30 }` | Modals, bottom sheets, bouncy interactions |
| linear | `linear` | Countdowns, progress bars, race timers |

### Rules

- ALL animations MUST respect `prefers-reduced-motion` — use `useReducedMotion` hook
- Reduced motion fallback: instant state change, no movement, no scale transforms
- No animations that loop indefinitely without user action (except loading states)
- Celebration animations must NOT block interaction — user can tap through
- Visual feedback for user actions must arrive within 200ms (ADHD accommodation)
- No timers in educational games (autism accommodation)

---

## Accessibility Baseline

- **Minimum touch target:** 44px × 44px for ALL interactive elements
- **Colour contrast:** WCAG AA minimum — `#FCFCFD` on `#0D0D11` = 18.3:1 (passes)
- **Colour is never the only indicator** — always pair with text, icon, or shape
- **Focus ring:** `outline: 2px solid var(--blue); outline-offset: 2px` — visible on all interactive elements
- **All images** have alt text
- **All interactive elements** have accessible labels
- **Text-to-speech:** All game questions can be read aloud (Web Speech API, en-GB) via `useSpeech` hook
- **No timers** in any educational game (autism accommodation)
- **Effort-based rewards:** Wrong answers still earn 1 coin (ADHD accommodation)
- **Predictable structure:** Every game is always X rounds then game over

---

## Page Layout Template

```
┌─────────────────────────────────────────┐
│ Page Header (grid: 1fr auto 1fr)        │
│ [Title]     [Sub-tabs]    [CoinDisplay] │
├─────────────────────────────────────────┤
│                                         │
│ Hero section (if applicable)            │
│ Full-width, content-driven height       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ Content area                            │
│ padding: 0 24px                         │
│ padding-bottom: 96px / pb-24 (above nav)│
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ ░░░ Gradient fade (32px) ░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ Bottom Tab Bar (80px, fixed)            │
│ [Home] [Explore] [Animals] [Play] [Shop]│
└─────────────────────────────────────────┘
```

- All pages scroll vertically
- Gradient fade is `linear-gradient(to top, #0D0D11, transparent)`, 32px height, positioned above bottom nav
- Bottom padding on scrollable content: `pb-24` (96px to clear 68px nav + 48px gradient fade)

---

## Iconography

- **Library:** Lucide (`lucide-react`)
- **Default size:** 24px
- **Stroke width:** 2
- **Colour:** Inherits from parent text colour unless overridden
- **Tab bar icons:** 24px, stroke 2
- **Button icons:** 16px–20px depending on button size
- **Badge icons:** 14px

### Icon Pack Colour Presets

These two hex values are additions to the colour preset palette for the icon pack
customisation feature. They do not map to an existing DS `*-t` token and are therefore
documented here as named constants. Component code must never hardcode these hex values
inline — they must be consumed from the `ICON_COLOUR_PRESETS` data constant in
`src/data/iconPacks.ts`.

| Token name | Hex | Usage |
|-----------|-----|-------|
| `--icon-teal` | `#5ECFD8` | Teal icon colour preset |
| `--icon-coral` | `#F4845F` | Coral icon colour preset |

**CSS custom property mechanism:** The active icon colour is applied to `:root` as
`--icon-color` by `usePersonalisation`. Icons consume it via:
`svg { color: var(--icon-color, var(--t2)); }`. When no colour override is active
(System mode), the property is removed so the fallback `var(--t2)` applies naturally.

---

## Scrollbar

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
```

---

## Anti-Patterns — Never Do These

1. **Wrong font:** Always DM Sans. Never Inter, Roboto, Arial, or system fonts as primary.
2. **Single accent:** Always use BOTH Blue and Pink. Blue = utility, Pink = CTA/reward.
3. **Solid-colour badges:** Always use tint pairs (translucent bg + light text). Solid ONLY on price tags.
4. **Wrong button radius:** Always pill (100px). Never 8px, 12px, or 16px on buttons.
5. **Wrong surface colours:** Never `#1c1c1c`, `#222`, `#2d2d2d`, or any made-up dark value. Always from the 5-level stack.
6. **Drop shadows on static elements:** Cards at rest have NO shadow — only border. Shadows on hover and modals only.
7. **Made-up spacing:** Only values from the scale: `4 6 8 10 12 14 16 20 24 28 32 40 48 56 64 80`.
8. **Hairline labels without proper styling:** Section labels are ALWAYS 11px, 700, uppercase, letter-spacing 1–1.5px, `--t3` colour.
9. **Missing hover states:** Every interactive element has a hover state. Cards lift + shadow. Buttons brighten or glow. Nothing is inert.
10. **Touch targets below 44px:** ALL interactive elements must be at least 44px × 44px.
