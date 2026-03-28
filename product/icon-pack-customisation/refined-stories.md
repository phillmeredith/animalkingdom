# Refined Stories — Icon Pack and Colour Customisation

**Feature:** icon-pack-customisation
**Author:** Product Owner
**Date:** 2026-03-28
**Status:** Ready for Phase C — pending [OWNER] Phase B approval

---

## Owner decisions recorded

- Teal (`#5ECFD8`) and Coral (`#F4845F`) accepted as colour presets. Both must be added
  to `design-system/DESIGN_SYSTEM.md` under a new "Icon Pack Colour Presets" sub-section
  before Phase C begins. This is a hard gate — FE must not introduce hardcoded hex values
  in component code without the DS entry being present first.
- Bundle size is acceptable provided tree-shaking is used throughout. Individual named
  imports only — no barrel imports from any of the three new icon libraries. This is a
  build constraint the Developer must enforce and the Tester must verify.
- Style reset on pack change: simpler reset-on-change behaviour ships first. Per-pack
  style memory is explicitly out of scope for this iteration.
- Colour tinting mechanism: CSS `color` property via `currentColor` is the preferred
  path. Developer must confirm all three libraries honour `currentColor` reliably before
  Phase C begins; if any does not, raise before build starts — not after.

---

## Open questions resolved

| # | Question | Resolution |
|---|----------|-----------|
| 1 | Bundle size | Acceptable. Individual imports only. Confirmed above. |
| 2 | Teal and Coral | Accepted. Add to DS before Phase C. |
| 3 | Icon coverage audit | Developer must run before Phase C. Phosphor fallback note ships conditionally — remove if no gaps found. |
| 4 | Colour tinting mechanism | `currentColor` via CSS preferred. Dev to confirm. |
| 5 | Style reset on pack change | Reset on change. Per-pack memory out of scope. |

---

## User stories

---

### Story 1 — Switch icon pack

```
As Harry,
I want to choose between four different icon packs in Settings,
So that the icons throughout the app match the visual style I prefer.

Acceptance criteria:
- [ ] The Personalisation section in Settings contains a new "Icons" sub-section,
      preceded by a 1px hairline divider above the "Icons" HairlineLabel.
- [ ] The "Icons" sub-section renders a "Pack" pill row with four pills:
      "Lucide", "Phosphor", "Tabler", "Remix".
- [ ] Exactly one pill is active at a time. Active state:
      bg-[var(--blue-sub)] border-[var(--blue)] text-[var(--blue-t)] with blue
      check badge (18px circle, right-aligned). No solid fill.
- [ ] Inactive pills: bg-[var(--card)] border-[var(--border-s)] text-[var(--t2)].
- [ ] On hover (inactive): border widens to var(--border), bg rgba(255,255,255,.03).
- [ ] On press: scale(.97). On keyboard focus: 2px var(--blue) outline, offset 2px.
- [ ] Selecting a pack updates icons throughout the app immediately without reload.
- [ ] Each pill has aria-pressed and aria-label="{PackName} icon pack".
- [ ] Default selection is "Lucide" (current production pack — no visual change on
      first load).
- [ ] At 820px (iPad), all four pills sit on one row. At 375px (phone), wrapping to
      two rows of two is acceptable.

Out of scope:
- Previewing packs before selecting (the live preview strip in Story 4 covers this
  once a selection is made, but there is no hover-preview mechanism).
- More than four packs in this iteration.
```

---

### Story 2 — Choose a style within the selected pack

```
As Harry,
I want to pick a visual style for my chosen icon pack (e.g. Bold, Thin, Duotone),
So that I can fine-tune how the icons look, not just which library they come from.

Acceptance criteria:
- [ ] When the active pack is Lucide, the style picker row is not rendered (no
      placeholder, no disabled row — absent entirely).
- [ ] When the active pack is Phosphor, six style pills are shown:
      Thin / Light / Regular / Bold / Fill / Duotone (in this order, Duotone last).
- [ ] When the active pack is Tabler, two style pills are shown: Outline / Filled.
- [ ] When the active pack is Remix, two style pills are shown: Line / Fill.
- [ ] Style pill anatomy, interaction states, and accessibility are identical to the
      pack picker pills (Story 1), with aria-label="{StyleName} style for {PackName}".
- [ ] Default style on pack selection: Phosphor -> Regular; Tabler -> Outline;
      Remix -> Line.
- [ ] Switching pack resets the style to that pack's default. The previous pack's
      style is not remembered.
- [ ] Selecting a style updates icons throughout the app immediately without reload.
- [ ] At 375px (phone), Phosphor's six pills may wrap; wrapping is acceptable —
      truncation is not.

Out of scope:
- Per-pack style memory (remembering "Bold" for Phosphor when switching away and back).
- Custom or user-defined styles.
```

---

### Story 3 — Apply a colour preset to icons

```
As Harry,
I want to tint the icons with a colour from a curated palette,
So that the icons fit my preferred colour scheme without needing to enter a hex code.

Acceptance criteria:
- [ ] When the active pack/style combination is single-colour (anything except
      Phosphor Duotone), an "Icon colour" sub-label and swatch row are shown.
- [ ] The swatch row contains a "System" pill followed by nine circular colour swatches,
      rendered in this order: System, White (#FCFCFD), Blue (#6E9BFF), Pink (#F06EAB),
      Green (#7DD69B), Amber (#FCC76E), Purple (#BA8DE9), Red (#F5899E),
      Teal (#5ECFD8), Coral (#F4845F).
- [ ] The "System" pill uses the inactive/active pill pattern (identical to pack pills).
      It is not a swatch circle.
- [ ] Each colour swatch is a 36px circle with 44px touch target (4px transparent
      padding). Rest border: 1.5px solid rgba(255,255,255,.10).
- [ ] Selected swatch: border 2px solid var(--blue), box-shadow
      0 0 0 3px rgba(55,114,255,.20). No other swatch is selected simultaneously.
- [ ] Hover: border 1.5px solid rgba(255,255,255,.25), scale(1.08).
      Press: scale(.94). Focus: outline 2px var(--blue), offset 3px.
- [ ] Each swatch carries aria-pressed, aria-label="{colour name} icon colour",
      and title="{colour name}".
- [ ] Default selection is "System" (icons render at var(--t2), current behaviour).
- [ ] Selecting a colour preset applies it to all icons immediately via
      --icon-color CSS custom property set on :root. The CSS rule
      svg { color: var(--icon-color, var(--t2)); } is the implementation mechanism.
- [ ] Teal (#5ECFD8) and Coral (#F4845F) are defined in DESIGN_SYSTEM.md under
      "Icon Pack Colour Presets" before Phase C begins. FE must not hardcode hex values
      in component code — all presets must be rendered from the ICON_COLOUR_PRESETS
      data constant.
- [ ] When Phosphor Duotone is active, the swatch row is hidden (not disabled —
      absent entirely) and replaced by the Multicolour notice (see Story 5).
- [ ] At 375px, the swatch row wraps; wrapping is acceptable.

Out of scope:
- Free-form colour input (hex field, hue wheel, colour picker).
- Per-pack colour memory.
- More than ten presets (System + nine) in this iteration.
```

---

### Story 4 — See a live preview before leaving Settings

```
As Harry,
I want to see how the selected pack, style, and colour look on real icons,
So that I can confirm my choice looks right before I go back to the rest of the app.

Acceptance criteria:
- [ ] A "Preview" HairlineLabel and icon strip are rendered below the colour section
      (or below the Multicolour notice when duotone is active), within the Icons
      sub-section, above "Reset to defaults".
- [ ] The strip displays exactly eight icons representing these concepts in order:
      Paw, Star, Heart, Home, Search, Trophy, Coins, Settings — each resolved from
      the PREVIEW_ICONS data constant for the active pack and style.
- [ ] Icon size is 24px, strokeWidth 2. Strip layout: flex row, gap 16px,
      border-top 1px solid var(--border-s), padding-top 12px.
- [ ] Icons in the strip render at the currently selected colour (System = var(--t2);
      preset = selected hex; duotone = Phosphor library defaults).
- [ ] The strip updates immediately when pack, style, or colour changes — no reload,
      no debounce delay.
- [ ] The strip is not interactive. The container carries
      aria-label="Icon style preview" and role="img". Individual icons have
      aria-hidden="true".
- [ ] When Phosphor is the active pack, a note appears below the icon row:
      "Some screens use icons not available in every pack — those stay as Lucide."
      (11px / 400 / var(--t3)). This note is omitted if the coverage audit (open
      question 3) confirms no gaps.
- [ ] The note does not appear for Tabler or Remix.
- [ ] The PREVIEW_ICONS data constant (icon name per concept per pack/style) lives
      in a data file — not inline in the component JSX.
- [ ] The resolveIcon(concept, pack, style) function handles fallback to Lucide
      silently for any concept not found in the selected pack. No console warnings
      in production builds.

Out of scope:
- Interactive icons in the preview strip.
- Animated pack transitions in the preview.
- Showing more than eight icons in the strip.
```

---

### Story 5 — Understand why the colour picker is hidden for Phosphor Duotone

```
As Harry,
I want a clear explanation when the colour picker disappears after I choose Duotone,
So that I am not confused about why I cannot pick a colour.

Acceptance criteria:
- [ ] When Phosphor Duotone is the active style, the colour swatch row is hidden
      entirely (removed from DOM — no aria-hidden, no disabled state).
- [ ] In place of the swatch row, a single inline notice row is rendered:
      Lucide Palette icon (16px, var(--purple-t), aria-hidden="true") followed by
      the text "Multicolour — uses two tones automatically" (13px / 500 / var(--t3)).
- [ ] The notice has no card background, no border, no interactive behaviour. It is
      a static paragraph.
- [ ] When the style changes away from Duotone (to any other Phosphor style, or to a
      different pack), the notice is removed and the swatch row is restored.
- [ ] The Palette icon in the notice is always the Lucide Palette component,
      regardless of the active icon pack — the notice is UI chrome, not app content.

Out of scope:
- Explaining duotone in more detail (the notice is intentionally brief for an 8-year-old).
- Offering duotone-specific colour customisation in this iteration.
```

---

### Story 6 — Persist and reset icon preferences

```
As Harry,
I want my icon choices to be remembered between sessions, and to be able to reset
them to default with the existing "Reset to defaults" button,
So that I do not have to reconfigure my preferences every time I open the app, and
can undo changes if I do not like them.

Acceptance criteria:
- [ ] Selecting any pack, style, or colour immediately persists to the
      ak_personalisation localStorage key as iconPack, iconStyle, and iconColour
      fields alongside existing personalisation fields.
- [ ] On reload, the app reads and applies the stored values without requiring
      any user action.
- [ ] If the stored object does not contain iconPack, iconStyle, or iconColour
      (pre-feature saves), the hook falls back to defaults: iconPack="lucide",
      iconStyle="default", iconColour="" — without overwriting the existing stored
      values (background, font, etc. are preserved).
- [ ] On first load with no stored key, the app looks identical to before this
      feature was built (Lucide / default / System — no visual change).
- [ ] The "Reset to defaults" button resets iconPack to "lucide", iconStyle to
      "default", and iconColour to "" alongside the existing reset behaviour.
      No additional reset control is introduced.
- [ ] setIconPack() resets iconStyle to the new pack's default style and iconColour
      to "" (System). This prevents invalid state (e.g. "Bold" persisted when pack
      is switched to Tabler which has no Bold).
- [ ] usePersonalisation exports: iconPack, iconStyle, iconColour (state),
      setIconPack, setIconStyle, setIconColour (setters), and ICON_COLOUR_PRESETS
      (data constant) or these are co-located in a sibling data file.
- [ ] The three new npm packages are installed with individual named imports only —
      no barrel imports. The Tester must verify no barrel import exists in any
      file touching these libraries.

Out of scope:
- Per-pack style/colour memory across pack switches.
- Cloud sync of personalisation preferences.
- Migration script for existing saves (graceful fallback in the hook is sufficient).
```

---

## Definition of Done

All items must be checked before the backlog status is changed to `complete`.

### Functional
- [ ] All six stories pass their acceptance criteria as verified in
      `tests/icon-pack-customisation/test-results.md` with Tester sign-off.
- [ ] `done-check.md` has been run and signed off (Phase E).

### Data and persistence
- [ ] `usePersonalisation` has `iconPack`, `iconStyle`, `iconColour` state and setters.
- [ ] `setIconPack` resets style and colour to pack defaults.
- [ ] Hook handles missing fields in legacy localStorage entries without data loss.
- [ ] `ICON_COLOUR_PRESETS` data constant is exported from hook or sibling data file.
- [ ] `PREVIEW_ICONS` data constant maps all eight concepts to all four packs.
- [ ] `resolveIcon(concept, pack, style)` centralised function exists with Lucide fallback.

### Design system
- [ ] Teal (`#5ECFD8`) and Coral (`#F4845F`) are documented in
      `design-system/DESIGN_SYSTEM.md` under "Icon Pack Colour Presets" before
      Phase C begins.
- [ ] No hardcoded hex values in component code — all preset colours rendered from data.
- [ ] All controls use CategoryPills tint-pair active pattern — no solid fill on pills.
- [ ] `--icon-color` CSS custom property approach confirmed for colour tinting.

### Build constraints
- [ ] Three new libraries installed: `@phosphor-icons/react`, `@tabler/icons-react`,
      `@remixicon/react`.
- [ ] Zero barrel imports from any of the three libraries in any file.
- [ ] Developer has confirmed all three libraries use `currentColor` reliably (or
      raised a blocking issue before Phase C).
- [ ] Coverage audit completed. Phosphor fallback note retained or removed per findings.

### Accessibility
- [ ] All interactive controls (pack pills, style pills, colour swatches, System pill)
      have `aria-pressed`, descriptive `aria-label`, and visible focus indicator.
- [ ] Preview strip has `aria-label="Icon style preview"` and `role="img"`. Individual
      icons have `aria-hidden="true"`.
- [ ] Multicolour notice Palette icon has `aria-hidden="true"`.
- [ ] Conditional sections are removed from DOM (not hidden) — focus order is clean.

### Responsive
- [ ] Layout verified at 375px, 768px, and 1024px — no clipped content, no wasted space.
- [ ] Pack picker fits one row at 820px; wrapping at 375px is acceptable.
- [ ] Settings screen `pb-24` confirmed — content not hidden behind nav.

### 10-point DS checklist
- [ ] All ten DS checklist items explicitly listed and passed in test-results.md.

---

## Out of scope — this iteration

These items were considered and deliberately excluded. Revisit in a future sprint if
Harry requests them.

- Free-form colour input (hex field, hue wheel, colour picker)
- Per-pack style and colour memory across pack switches
- More than four icon packs
- More than ten colour presets (System + nine)
- Animated transitions between icon packs in the preview strip
- Cloud sync of personalisation preferences
- A dedicated settings route or modal for icon preferences (always inline in Settings)
- Custom icon upload

---

## Dependencies

### npm packages to install before Phase C

| Package | Purpose |
|---------|---------|
| `@phosphor-icons/react` | Phosphor pack (Thin/Light/Regular/Bold/Fill/Duotone) |
| `@tabler/icons-react` | Tabler pack (Outline/Filled) |
| `@remixicon/react` | Remix pack (Line/Fill) |

Individual named imports only. No barrel imports. This is a hard build constraint.

### Design system additions (before Phase C)

Add to `design-system/DESIGN_SYSTEM.md` under a new "Icon Pack Colour Presets"
sub-section:

| Token name | Hex | Usage |
|-----------|-----|-------|
| `--icon-teal` | `#5ECFD8` | Teal icon colour preset |
| `--icon-coral` | `#F4845F` | Coral icon colour preset |

The other seven presets (White, Blue, Pink, Green, Amber, Purple, Red) map to existing
DS `*-t` tokens and do not require new DS entries.

### Existing files modified

| File | Change |
|------|--------|
| `src/hooks/usePersonalisation.ts` | Add iconPack, iconStyle, iconColour state + setters + reset logic |
| `src/components/settings/PersonalisationSection.tsx` | Add Icons sub-section |
| `design-system/DESIGN_SYSTEM.md` | Add Icon Pack Colour Presets sub-section |

### New files created

| File | Purpose |
|------|---------|
| `src/components/settings/IconPackSection.tsx` | Icons sub-section component |
| `src/lib/iconPresets.ts` (or equivalent) | ICON_COLOUR_PRESETS + PREVIEW_ICONS data constants |
| `src/lib/resolveIcon.ts` (or equivalent) | resolveIcon(concept, pack, style) with Lucide fallback |

---

## Notes for Developer

- `setIconPack` must reset both `iconStyle` AND `iconColour` atomically — not two
  separate state updates that could cause a render between them.
- Hook must read existing localStorage, merge the three new fields, and write back.
  Do not replace the full stored object — preserve background, font, and all other
  existing keys.
- The CSS `--icon-color` custom property should be set on `:root` by the hook via
  `document.documentElement.style.setProperty`. When iconColour is "" (System), remove
  the property so the CSS fallback `var(--icon-color, var(--t2))` applies naturally.

## Notes for Frontend Engineer

- `IconPackSection` must import from a data constant for all preset colours and preview
  icons. No inline hex values or icon component names in JSX.
- The Duotone style pill has no special visual treatment — only its downstream effect
  (hiding the colour section) is different.
- The Multicolour notice always uses the Lucide `Palette` icon regardless of the active
  pack — it is UI chrome, not app content.
- Verify at three breakpoints (375px, 768px, 1024px) before marking Phase C complete.
  The Settings screen is already scrollable — confirm `pb-24` is maintained.
