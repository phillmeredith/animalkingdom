// usePersonalisation.ts
// Manages background image upload, font family, heading case, player name, and icon
// pack / style / colour preferences.
//
// Storage layout:
//   localStorage 'ak_personalisation' — { font, headingCase, playerName,
//                                          iconPack, iconStyle, iconColour } (small JSON)
//   localStorage 'ak_personalisation_bg' — data URL string (potentially large, separate key)
//
// Applied to DOM via:
//   --font-body CSS variable on <html>
//   data-font="fredoka" attribute on <html> (triggers 14px floor rule in index.css)
//   --heading-transform / --heading-spacing CSS variables on <html>
//   --icon-color CSS custom property on :root (icon colour override; absent = use var(--t2))
//
// Self-review:
// [x] useLayoutEffect fires before paint — no flash of unstyled content
// [x] All localStorage access wrapped in try/catch — falls back to defaults
// [x] Background stored in separate key to avoid main prefs JSON growing large
// [x] No `any` types, no component imports
// [x] setIconPack resets iconStyle + iconColour atomically in one state update
// [x] reset() covers all three icon fields

import { useState, useLayoutEffect } from 'react'
import type { IconPack, IconStyle } from '@/data/iconPacks'
import { PACK_STYLES } from '@/data/iconPacks'

// ─── Font options ──────────────────────────────────────────────────────────────

export const FONT_OPTIONS = [
  { label: 'DM Sans',      family: 'DM Sans'       },
  { label: 'Nunito',       family: 'Nunito'        },
  { label: 'Fredoka',      family: 'Fredoka'       },
  { label: 'Lexend',       family: 'Lexend'        },
  { label: 'Poppins',      family: 'Poppins'       },
  { label: 'Quicksand',    family: 'Quicksand'     },
  { label: 'Baloo 2',      family: 'Baloo 2'       },
  { label: 'Pacifico',     family: 'Pacifico'      },
  { label: 'Bubblegum',    family: 'Bubblegum Sans'},
  { label: 'Comic Neue',   family: 'Comic Neue'    },
  { label: 'Chewy',        family: 'Chewy'         },
  { label: 'Patrick Hand', family: 'Patrick Hand'  },
  { label: 'Rajdhani',     family: 'Rajdhani'      },
] as const

export type FontFamily = typeof FONT_OPTIONS[number]['family']

// ─── Types ─────────────────────────────────────────────────────────────────────

/** 'uppercase' = ALL CAPS section labels (default). 'normal' = Title Case. */
export type HeadingCase = 'uppercase' | 'normal'

interface PersonalisationPrefs {
  font: string
  headingCase: HeadingCase
  titleCase: HeadingCase
  bodyCase: HeadingCase
  buttonCase: HeadingCase
  navCase: HeadingCase
  /** Bold overrides per text category. true = heavier weight applied. */
  labelBold: boolean
  headingBold: boolean
  bodyBold: boolean
  buttonBold: boolean
  navBold: boolean
  playerName: string
  /** Percentage (0–100) controlling how visible the background image is.
   *  0 = no image visible, 100 = very vivid. Default 30. */
  bgOpacity: number
  /** Percentage (0–100) opacity of card/surface elements. 100 = fully opaque (default). */
  cardOpacity: number
  /** Optional hex colour tint blended into card surfaces. '' = no tint. */
  cardTint: string
  /** Active icon pack. Default: 'lucide'. */
  iconPack: IconPack
  /** Active icon style within the selected pack. Default: 'default'. */
  iconStyle: IconStyle
  /** Hex colour override for icons, or '' for System (var(--t2) fallback). */
  iconColour: string
}

export interface UsePersonalisationReturn {
  /** Data URL of uploaded background image, or null. */
  backgroundUrl: string | null
  font: string
  headingCase: HeadingCase
  titleCase: HeadingCase
  bodyCase: HeadingCase
  buttonCase: HeadingCase
  navCase: HeadingCase
  labelBold: boolean
  headingBold: boolean
  bodyBold: boolean
  buttonBold: boolean
  navBold: boolean
  /** Player's display name (shown in greeting). Empty string = use app default. */
  playerName: string
  /** 0–100: how visible the background image is. 0 = barely visible, 100 = vivid. */
  bgOpacity: number
  /** 0–100: card/surface opacity. 100 = solid, 0 = fully transparent. */
  cardOpacity: number
  /** Hex colour tint for card surfaces, or '' for none. */
  cardTint: string
  /** Active icon pack selection. */
  iconPack: IconPack
  /** Active icon style within the selected pack. */
  iconStyle: IconStyle
  /** Active icon colour hex override, or '' for System. */
  iconColour: string
  /** Set background from a data URL (from FileReader). Pass null to clear. */
  setBackgroundUrl: (url: string | null) => void
  setFont: (fontFamily: string) => void
  setHeadingCase: (value: HeadingCase) => void
  setTitleCase: (v: HeadingCase) => void
  setBodyCase: (v: HeadingCase) => void
  setButtonCase: (v: HeadingCase) => void
  setNavCase: (v: HeadingCase) => void
  setLabelBold: (v: boolean) => void
  setHeadingBold: (v: boolean) => void
  setBodyBold: (v: boolean) => void
  setButtonBold: (v: boolean) => void
  setNavBold: (v: boolean) => void
  setPlayerName: (name: string) => void
  setBgOpacity: (value: number) => void
  setCardOpacity: (value: number) => void
  setCardTint: (hex: string) => void
  /**
   * Switch icon pack. Also resets iconStyle to the new pack's default and
   * iconColour to '' (System). All three fields are written in one atomic update
   * to prevent an intermediate render with an invalid style/colour for the new pack.
   */
  setIconPack: (pack: IconPack) => void
  setIconStyle: (style: IconStyle) => void
  /** Apply a hex colour override for icons. Pass '' to restore System (var(--t2)). */
  setIconColour: (colour: string) => void
  reset: () => void
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const PREFS_KEY = 'ak_personalisation'
const BG_KEY = 'ak_personalisation_bg'

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: PersonalisationPrefs = {
  font: 'DM Sans',
  headingCase: 'uppercase',
  titleCase: 'normal',
  bodyCase: 'normal',
  buttonCase: 'normal',
  navCase: 'normal',
  labelBold: false,
  headingBold: false,
  bodyBold: false,
  buttonBold: false,
  navBold: false,
  playerName: '',
  bgOpacity: 30,
  cardOpacity: 100,
  cardTint: '',
  iconPack: 'lucide',
  iconStyle: 'default',
  iconColour: '',
}

const DEFAULT_FONT_CSS = "'DM Sans', 'Inter', system-ui, sans-serif"

// ─── Storage helpers ──────────────────────────────────────────────────────────

function readPrefs(): PersonalisationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const p = JSON.parse(raw) as Partial<PersonalisationPrefs>
    return {
      font: typeof p.font === 'string' ? p.font : DEFAULT_PREFS.font,
      headingCase: p.headingCase === 'uppercase' || p.headingCase === 'normal'
        ? p.headingCase
        : DEFAULT_PREFS.headingCase,
      titleCase: p.titleCase === 'uppercase' || p.titleCase === 'normal' ? p.titleCase : DEFAULT_PREFS.titleCase,
      bodyCase: p.bodyCase === 'uppercase' || p.bodyCase === 'normal' ? p.bodyCase : DEFAULT_PREFS.bodyCase,
      buttonCase: p.buttonCase === 'uppercase' || p.buttonCase === 'normal' ? p.buttonCase : DEFAULT_PREFS.buttonCase,
      navCase: p.navCase === 'uppercase' || p.navCase === 'normal' ? p.navCase : DEFAULT_PREFS.navCase,
      labelBold: typeof p.labelBold === 'boolean' ? p.labelBold : DEFAULT_PREFS.labelBold,
      headingBold: typeof p.headingBold === 'boolean' ? p.headingBold : DEFAULT_PREFS.headingBold,
      bodyBold: typeof p.bodyBold === 'boolean' ? p.bodyBold : DEFAULT_PREFS.bodyBold,
      buttonBold: typeof p.buttonBold === 'boolean' ? p.buttonBold : DEFAULT_PREFS.buttonBold,
      navBold: typeof p.navBold === 'boolean' ? p.navBold : DEFAULT_PREFS.navBold,
      playerName: typeof p.playerName === 'string' ? p.playerName : DEFAULT_PREFS.playerName,
      bgOpacity: typeof p.bgOpacity === 'number' && p.bgOpacity >= 0 && p.bgOpacity <= 100
        ? p.bgOpacity
        : DEFAULT_PREFS.bgOpacity,
      cardOpacity: typeof p.cardOpacity === 'number' && p.cardOpacity >= 0 && p.cardOpacity <= 100
        ? p.cardOpacity
        : DEFAULT_PREFS.cardOpacity,
      cardTint: typeof p.cardTint === 'string' ? p.cardTint : DEFAULT_PREFS.cardTint,
      // Icon prefs — may be absent from older saved objects; fall back to defaults
      iconPack: (p.iconPack === 'lucide' || p.iconPack === 'phosphor' || p.iconPack === 'tabler' || p.iconPack === 'remix')
        ? p.iconPack
        : DEFAULT_PREFS.iconPack,
      iconStyle: (
        p.iconStyle === 'default' || p.iconStyle === 'thin' || p.iconStyle === 'light' ||
        p.iconStyle === 'regular' || p.iconStyle === 'bold' || p.iconStyle === 'fill' ||
        p.iconStyle === 'duotone' || p.iconStyle === 'outline' || p.iconStyle === 'filled' ||
        p.iconStyle === 'line'
      )
        ? p.iconStyle
        : DEFAULT_PREFS.iconStyle,
      iconColour: typeof p.iconColour === 'string' ? p.iconColour : DEFAULT_PREFS.iconColour,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

function writePrefs(prefs: PersonalisationPrefs): void {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* quota */ }
}

function readBg(): string | null {
  try { return localStorage.getItem(BG_KEY) } catch { return null }
}

function writeBg(url: string | null): void {
  try {
    if (url === null) localStorage.removeItem(BG_KEY)
    else localStorage.setItem(BG_KEY, url)
  } catch { /* quota — large image may exceed limit; silent fail acceptable */ }
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

/** Convert 0–100 opacity value to the body overlay alpha (0.95 → 0.40). */
function overlayAlpha(opacity: number): number {
  return +(0.95 - (opacity / 100) * 0.55).toFixed(3)
}

function applyBackgroundToDom(url: string | null, opacity: number): void {
  if (url) {
    document.documentElement.style.backgroundImage = `url(${url})`
    document.documentElement.setAttribute('data-has-bg', 'true')
    document.body.style.background = `rgba(13,13,17,${overlayAlpha(opacity)})`
  } else {
    document.documentElement.style.backgroundImage = ''
    document.documentElement.removeAttribute('data-has-bg')
    document.body.style.background = ''
  }
}

/** Parse hex (#RRGGBB or #RGB) to r,g,b components. Returns null if invalid. */
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    || hex.replace('#', '').match(/^([a-f\d])([a-f\d])([a-f\d])$/i)?.map((v, i) => i === 0 ? v : v + v)
  if (!m) return null
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

/** Blend base colour with tint at given tint weight (0–1), return rgba string. */
function blendedSurface(base: [number, number, number], tint: [number, number, number] | null, tintWeight: number, alpha: number): string {
  const [br, bg, bb] = tint
    ? [
        Math.round(base[0] * (1 - tintWeight) + tint[0] * tintWeight),
        Math.round(base[1] * (1 - tintWeight) + tint[1] * tintWeight),
        Math.round(base[2] * (1 - tintWeight) + tint[2] * tintWeight),
      ]
    : base
  return `rgba(${br},${bg},${bb},${alpha.toFixed(3)})`
}

function applyCardStyleToDom(opacity: number, tint: string): void {
  const alpha = opacity / 100
  const tintRgb = tint ? hexToRgb(tint) : null
  // Base colours from DS surface stack
  const card  = blendedSurface([24, 24, 29],  tintRgb, 0.15, alpha)
  const elev  = blendedSurface([35, 38, 47],  tintRgb, 0.15, alpha)
  document.documentElement.style.setProperty('--card', card)
  document.documentElement.style.setProperty('--elev', elev)
}

function applyFontToDom(fontFamily: string): void {
  const css = fontFamily === 'DM Sans'
    ? DEFAULT_FONT_CSS
    : `'${fontFamily}', system-ui, sans-serif`
  document.documentElement.style.setProperty('--font-body', css)
  if (fontFamily === 'Fredoka') {
    document.documentElement.setAttribute('data-font', 'fredoka')
  } else {
    document.documentElement.removeAttribute('data-font')
  }
}

function applyHeadingCaseToDom(headingCase: HeadingCase): void {
  // CSS variable for components that already use var(--heading-transform)
  document.documentElement.style.setProperty(
    '--heading-transform',
    headingCase === 'uppercase' ? 'uppercase' : 'none'
  )
  document.documentElement.style.setProperty(
    '--heading-spacing',
    headingCase === 'uppercase' ? '0.1em' : '0'
  )
  // Data attribute used by index.css to override ALL hardcoded uppercase classes app-wide
  document.documentElement.setAttribute('data-heading-case', headingCase)
}

function applyTitleCaseToDom(titleCase: HeadingCase): void {
  document.documentElement.setAttribute('data-title-case', titleCase)
}

function applyBodyCaseToDom(bodyCase: HeadingCase): void {
  document.documentElement.setAttribute('data-body-case', bodyCase)
}

function applyButtonCaseToDom(buttonCase: HeadingCase): void {
  document.documentElement.setAttribute('data-button-case', buttonCase)
}

function applyNavCaseToDom(navCase: HeadingCase): void {
  document.documentElement.setAttribute('data-nav-case', navCase)
}

function applyLabelBoldToDom(bold: boolean): void {
  document.documentElement.setAttribute('data-label-bold', bold ? 'true' : 'false')
}

function applyHeadingBoldToDom(bold: boolean): void {
  document.documentElement.setAttribute('data-heading-bold', bold ? 'true' : 'false')
}

function applyBodyBoldToDom(bold: boolean): void {
  document.documentElement.setAttribute('data-body-bold', bold ? 'true' : 'false')
}

function applyButtonBoldToDom(bold: boolean): void {
  document.documentElement.setAttribute('data-button-bold', bold ? 'true' : 'false')
}

function applyNavBoldToDom(bold: boolean): void {
  document.documentElement.setAttribute('data-nav-bold', bold ? 'true' : 'false')
}

/**
 * Apply the icon colour override to :root as --icon-color.
 * When colour is '' (System), the property is removed so the CSS fallback
 * var(--icon-color, var(--t2)) resolves naturally to var(--t2).
 */
function applyIconColourToDom(colour: string): void {
  if (colour) {
    document.documentElement.style.setProperty('--icon-color', colour)
  } else {
    document.documentElement.style.removeProperty('--icon-color')
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePersonalisation(): UsePersonalisationReturn {
  const [prefs, setPrefs] = useState<PersonalisationPrefs>(() => readPrefs())
  const [backgroundUrl, setBackgroundUrlState] = useState<string | null>(() => readBg())

  // Apply stored preferences before first paint — no flash of unstyled content
  useLayoutEffect(() => {
    applyFontToDom(prefs.font)
    applyHeadingCaseToDom(prefs.headingCase)
    applyTitleCaseToDom(prefs.titleCase)
    applyBodyCaseToDom(prefs.bodyCase)
    applyButtonCaseToDom(prefs.buttonCase)
    applyNavCaseToDom(prefs.navCase)
    applyLabelBoldToDom(prefs.labelBold)
    applyHeadingBoldToDom(prefs.headingBold)
    applyBodyBoldToDom(prefs.bodyBold)
    applyButtonBoldToDom(prefs.buttonBold)
    applyNavBoldToDom(prefs.navBold)
    applyBackgroundToDom(backgroundUrl, prefs.bgOpacity)
    applyCardStyleToDom(prefs.cardOpacity, prefs.cardTint)
    applyIconColourToDom(prefs.iconColour)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Mount-only; subsequent changes handled by setters

  const setBackgroundUrl = (url: string | null): void => {
    setBackgroundUrlState(url)
    writeBg(url)
    applyBackgroundToDom(url, prefs.bgOpacity)
  }

  const setFont = (fontFamily: string): void => {
    const next = { ...prefs, font: fontFamily }
    setPrefs(next)
    writePrefs(next)
    applyFontToDom(fontFamily)
  }

  const setHeadingCase = (value: HeadingCase): void => {
    const next = { ...prefs, headingCase: value }
    setPrefs(next)
    writePrefs(next)
    applyHeadingCaseToDom(value)
  }

  const setTitleCase = (value: HeadingCase): void => {
    const next = { ...prefs, titleCase: value }
    setPrefs(next)
    writePrefs(next)
    applyTitleCaseToDom(value)
  }

  const setBodyCase = (value: HeadingCase): void => {
    const next = { ...prefs, bodyCase: value }
    setPrefs(next)
    writePrefs(next)
    applyBodyCaseToDom(value)
  }

  const setButtonCase = (value: HeadingCase): void => {
    const next = { ...prefs, buttonCase: value }
    setPrefs(next)
    writePrefs(next)
    applyButtonCaseToDom(value)
  }

  const setNavCase = (value: HeadingCase): void => {
    const next = { ...prefs, navCase: value }
    setPrefs(next)
    writePrefs(next)
    applyNavCaseToDom(value)
  }

  const setLabelBold = (v: boolean): void => {
    const next = { ...prefs, labelBold: v }
    setPrefs(next)
    writePrefs(next)
    applyLabelBoldToDom(v)
  }

  const setHeadingBold = (v: boolean): void => {
    const next = { ...prefs, headingBold: v }
    setPrefs(next)
    writePrefs(next)
    applyHeadingBoldToDom(v)
  }

  const setBodyBold = (v: boolean): void => {
    const next = { ...prefs, bodyBold: v }
    setPrefs(next)
    writePrefs(next)
    applyBodyBoldToDom(v)
  }

  const setButtonBold = (v: boolean): void => {
    const next = { ...prefs, buttonBold: v }
    setPrefs(next)
    writePrefs(next)
    applyButtonBoldToDom(v)
  }

  const setNavBold = (v: boolean): void => {
    const next = { ...prefs, navBold: v }
    setPrefs(next)
    writePrefs(next)
    applyNavBoldToDom(v)
  }

  const setPlayerName = (name: string): void => {
    const next = { ...prefs, playerName: name.trim() }
    setPrefs(next)
    writePrefs(next)
  }

  const setBgOpacity = (value: number): void => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)))
    const next = { ...prefs, bgOpacity: clamped }
    setPrefs(next)
    writePrefs(next)
    if (backgroundUrl) {
      document.body.style.background = `rgba(13,13,17,${overlayAlpha(clamped)})`
    }
  }

  const setCardOpacity = (value: number): void => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)))
    const next = { ...prefs, cardOpacity: clamped }
    setPrefs(next)
    writePrefs(next)
    applyCardStyleToDom(clamped, prefs.cardTint)
  }

  const setCardTint = (hex: string): void => {
    const next = { ...prefs, cardTint: hex }
    setPrefs(next)
    writePrefs(next)
    applyCardStyleToDom(prefs.cardOpacity, hex)
  }

  /**
   * Switch icon pack. Resets iconStyle to the new pack's default and iconColour
   * to '' (System). All three fields are updated atomically in one state write to
   * prevent an intermediate render with an invalid style or colour for the new pack.
   */
  const setIconPack = (pack: IconPack): void => {
    const next = {
      ...prefs,
      iconPack: pack,
      iconStyle: PACK_STYLES[pack].default,
      iconColour: '',
    }
    setPrefs(next)
    writePrefs(next)
    applyIconColourToDom('')
  }

  const setIconStyle = (style: IconStyle): void => {
    const next = { ...prefs, iconStyle: style }
    setPrefs(next)
    writePrefs(next)
  }

  const setIconColour = (colour: string): void => {
    const next = { ...prefs, iconColour: colour }
    setPrefs(next)
    writePrefs(next)
    applyIconColourToDom(colour)
  }

  const reset = (): void => {
    const next = { ...DEFAULT_PREFS }
    setPrefs(next)
    setBackgroundUrlState(null)
    writePrefs(next)
    writeBg(null)
    document.documentElement.style.setProperty('--font-body', DEFAULT_FONT_CSS)
    document.documentElement.removeAttribute('data-font')
    applyHeadingCaseToDom(DEFAULT_PREFS.headingCase)
    applyTitleCaseToDom(DEFAULT_PREFS.titleCase)
    applyBodyCaseToDom(DEFAULT_PREFS.bodyCase)
    applyButtonCaseToDom(DEFAULT_PREFS.buttonCase)
    applyNavCaseToDom(DEFAULT_PREFS.navCase)
    applyLabelBoldToDom(DEFAULT_PREFS.labelBold)
    applyHeadingBoldToDom(DEFAULT_PREFS.headingBold)
    applyBodyBoldToDom(DEFAULT_PREFS.bodyBold)
    applyButtonBoldToDom(DEFAULT_PREFS.buttonBold)
    applyNavBoldToDom(DEFAULT_PREFS.navBold)
    applyBackgroundToDom(null, DEFAULT_PREFS.bgOpacity)
    applyCardStyleToDom(DEFAULT_PREFS.cardOpacity, DEFAULT_PREFS.cardTint)
    applyIconColourToDom(DEFAULT_PREFS.iconColour)
  }

  return {
    backgroundUrl,
    font: prefs.font,
    headingCase: prefs.headingCase,
    titleCase: prefs.titleCase,
    bodyCase: prefs.bodyCase,
    buttonCase: prefs.buttonCase,
    navCase: prefs.navCase,
    labelBold: prefs.labelBold,
    headingBold: prefs.headingBold,
    bodyBold: prefs.bodyBold,
    buttonBold: prefs.buttonBold,
    navBold: prefs.navBold,
    playerName: prefs.playerName,
    bgOpacity: prefs.bgOpacity,
    cardOpacity: prefs.cardOpacity,
    cardTint: prefs.cardTint,
    iconPack: prefs.iconPack,
    iconStyle: prefs.iconStyle,
    iconColour: prefs.iconColour,
    setBackgroundUrl,
    setFont,
    setHeadingCase,
    setTitleCase,
    setBodyCase,
    setButtonCase,
    setNavCase,
    setLabelBold,
    setHeadingBold,
    setBodyBold,
    setButtonBold,
    setNavBold,
    setPlayerName,
    setBgOpacity,
    setCardOpacity,
    setCardTint,
    setIconPack,
    setIconStyle,
    setIconColour,
    reset,
  }
}
