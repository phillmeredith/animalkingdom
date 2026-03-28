// PersonalisationSection — background upload, font picker, heading case toggle, icon pack
// Rendered inside <Section title="Personalisation"> in SettingsScreen.
// Padding owned here (py-4); Section card provides px-4.

import { useRef } from 'react'
import { Upload, X, Check, Palette } from 'lucide-react'
import { FONT_OPTIONS } from '@/hooks/usePersonalisation'
import type { HeadingCase } from '@/hooks/usePersonalisation'
import type { IconPack, IconStyle } from '@/data/iconPacks'
import {
  PACK_STYLES,
  ICON_COLOUR_PRESETS,
  PREVIEW_CONCEPTS,
  resolveIcon,
} from '@/data/iconPacks'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalisationSectionProps {
  backgroundUrl: string | null
  bgOpacity: number
  cardOpacity: number
  cardTint: string
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
  iconPack: IconPack
  iconStyle: IconStyle
  iconColour: string
  onSetBackgroundUrl: (url: string | null) => void
  onSetBgOpacity: (value: number) => void
  onSetCardOpacity: (value: number) => void
  onSetCardTint: (hex: string) => void
  onSelectFont: (family: string) => void
  onSetHeadingCase: (value: HeadingCase) => void
  onSetTitleCase: (v: HeadingCase) => void
  onSetBodyCase: (v: HeadingCase) => void
  onSetButtonCase: (v: HeadingCase) => void
  onSetNavCase: (v: HeadingCase) => void
  onSetLabelBold: (v: boolean) => void
  onSetHeadingBold: (v: boolean) => void
  onSetBodyBold: (v: boolean) => void
  onSetButtonBold: (v: boolean) => void
  onSetNavBold: (v: boolean) => void
  onSetIconPack: (pack: IconPack) => void
  onSetIconStyle: (style: IconStyle) => void
  onSetIconColour: (hex: string) => void
  onReset: () => void
}

// ─── Hairline section label ───────────────────────────────────────────────────

function HairlineLabel({ children }: { children: string }) {
  return (
    <p
      className="mb-2 text-[11px] font-700 tracking-widest select-none"
      style={{
        color: 'var(--t3)',
        textTransform: 'var(--heading-transform, uppercase)' as React.CSSProperties['textTransform'],
        letterSpacing: 'var(--heading-spacing, 0.1em)',
      }}
    >
      {children}
    </p>
  )
}

// ─── Background upload ────────────────────────────────────────────────────────

interface BackgroundUploadProps {
  backgroundUrl: string | null
  onSetBackgroundUrl: (url: string | null) => void
}

function BackgroundUpload({ backgroundUrl, onSetBackgroundUrl }: BackgroundUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result
      if (typeof result === 'string') onSetBackgroundUrl(result)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be selected again if user clears + re-uploads
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-3">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Preview or placeholder */}
      {backgroundUrl ? (
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: 80, height: 45, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}
        >
          <img
            src={backgroundUrl}
            alt="Current background"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ) : (
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 80,
            height: 45,
            borderRadius: 'var(--r-md)',
            border: '1px dashed var(--border-s)',
            background: 'var(--elev)',
          }}
        >
          <Upload size={16} strokeWidth={2} style={{ color: 'var(--t3)' }} />
        </div>
      )}

      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Upload / Change button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-left text-[13px] font-600 transition-colors duration-150"
          style={{ color: 'var(--blue-t)' }}
        >
          {backgroundUrl ? 'Change image' : 'Upload image'}
        </button>

        {/* Remove button — only shown when image is set */}
        {backgroundUrl && (
          <button
            type="button"
            onClick={() => onSetBackgroundUrl(null)}
            className="flex items-center gap-1 text-left text-[12px] font-500 transition-colors duration-150"
            style={{ color: 'var(--t3)' }}
          >
            <X size={12} strokeWidth={2} />
            Remove
          </button>
        )}

        {!backgroundUrl && (
          <p className="text-[12px] font-400 leading-snug" style={{ color: 'var(--t3)' }}>
            JPG, PNG, or WebP
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Font pill ────────────────────────────────────────────────────────────────

interface FontPillProps {
  label: string
  family: string
  selected: boolean
  onSelect: () => void
}

function FontPill({ label, family, selected, onSelect }: FontPillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${label} font`}
      onClick={onSelect}
      className={[
        'shrink-0 relative transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
        'motion-safe:active:scale-[.97]',
        selected
          ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
          : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] hover:border-[var(--border)] hover:bg-white/[.03]',
      ].join(' ')}
      style={{
        height: 40,
        paddingLeft: 16,
        paddingRight: selected ? 36 : 16,
        borderRadius: 'var(--r-pill)',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: family,
      }}
    >
      {label}
      {selected && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
          style={{ width: 18, height: 18, background: 'var(--blue)' }}
        >
          <Check size={10} strokeWidth={3} color="#fff" />
        </span>
      )}
    </button>
  )
}

// ─── Typography row — label + case toggle + bold toggle ───────────────────────

interface TypographyRowProps {
  label: string
  caseValue: HeadingCase
  bold: boolean
  onCaseChange: (v: HeadingCase) => void
  onBoldChange: (v: boolean) => void
}

function TypographyRow({ label, caseValue, bold, onCaseChange, onBoldChange }: TypographyRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <p className="text-[13px] font-500" style={{ color: 'var(--t2)' }}>{label}</p>
      <div className="flex gap-1.5 shrink-0">
        {/* Case toggle — single pill that flips between ABC / Abc */}
        <button
          type="button"
          aria-label={`Toggle ${label} case: currently ${caseValue}`}
          aria-pressed={caseValue === 'uppercase'}
          onClick={() => onCaseChange(caseValue === 'uppercase' ? 'normal' : 'uppercase')}
          className={[
            'h-8 rounded-pill text-[12px] font-600 transition-all duration-200',
            'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
            'motion-safe:active:scale-[.97]',
            caseValue === 'uppercase'
              ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
              : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] hover:border-[var(--border)]',
          ].join(' ')}
          style={{ width: 52 }}
        >
          {caseValue === 'uppercase' ? 'ABC' : 'Abc'}
        </button>

        {/* Bold toggle — "B" pill, active = bold on */}
        <button
          type="button"
          aria-label={`Toggle ${label} bold: currently ${bold ? 'bold' : 'normal'}`}
          aria-pressed={bold}
          onClick={() => onBoldChange(!bold)}
          className={[
            'h-8 rounded-pill text-[12px] transition-all duration-200',
            'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
            'motion-safe:active:scale-[.97]',
            bold
              ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)] font-800'
              : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] font-700 hover:border-[var(--border)]',
          ].join(' ')}
          style={{ width: 36 }}
        >
          B
        </button>
      </div>
    </div>
  )
}

// ─── PersonalisationSection ───────────────────────────────────────────────────

// Tint colour presets — empty string = no tint
const TINT_OPTIONS = [
  { label: 'None',     hex: '' },
  { label: 'Blue',     hex: '#1A2A4A' },
  { label: 'Purple',   hex: '#2A1A3A' },
  { label: 'Green',    hex: '#0F2A1A' },
  { label: 'Amber',    hex: '#2A1E0A' },
  { label: 'Pink',     hex: '#2A0F1E' },
  { label: 'Teal',     hex: '#0A2228' },
]

export function PersonalisationSection({
  backgroundUrl,
  bgOpacity,
  cardOpacity,
  cardTint,
  font,
  headingCase,
  titleCase,
  bodyCase,
  buttonCase,
  navCase,
  labelBold,
  headingBold,
  bodyBold,
  buttonBold,
  navBold,
  iconPack,
  iconStyle,
  iconColour,
  onSetBackgroundUrl,
  onSetBgOpacity,
  onSetCardOpacity,
  onSetCardTint,
  onSelectFont,
  onSetHeadingCase,
  onSetTitleCase,
  onSetBodyCase,
  onSetButtonCase,
  onSetNavCase,
  onSetLabelBold,
  onSetHeadingBold,
  onSetBodyBold,
  onSetButtonBold,
  onSetNavBold,
  onSetIconPack,
  onSetIconStyle,
  onSetIconColour,
  onReset,
}: PersonalisationSectionProps) {
  // Derived state: is this a duotone selection? (hides colour picker, shows notice)
  const isDuotone = iconPack === 'phosphor' && iconStyle === 'duotone'
  // Show style picker only when the active pack has more than one style
  const showStylePicker = PACK_STYLES[iconPack].styles.length > 1
  // Active pack's available styles
  const activePackStyles = PACK_STYLES[iconPack].styles
  return (
    <div className="py-4 flex flex-col gap-5">
      {/* ── Background ──────────────────────────────────────────────────── */}
      <div>
        <HairlineLabel>Background</HairlineLabel>
        <BackgroundUpload backgroundUrl={backgroundUrl} onSetBackgroundUrl={onSetBackgroundUrl} />

        {/* Opacity slider — only shown when an image is uploaded */}
        {backgroundUrl && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-700 uppercase tracking-widest" style={{ color: 'var(--t3)' }}>
                Opacity
              </p>
              <p className="text-[12px] font-600" style={{ color: 'var(--t2)' }}>
                {bgOpacity}%
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={bgOpacity}
              onChange={e => onSetBgOpacity(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--blue) ${bgOpacity}%, var(--elev) ${bgOpacity}%)`,
                accentColor: 'var(--blue)',
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px]" style={{ color: 'var(--t4)' }}>Subtle</span>
              <span className="text-[11px]" style={{ color: 'var(--t4)' }}>Vivid</span>
            </div>
          </div>
        )}
      </div>

      {/* ── App Font ────────────────────────────────────────────────────── */}
      <div>
        <HairlineLabel>App Font</HairlineLabel>
        {/*
          flex-wrap: pills wrap across rows on phone.
          On iPad (≥768px) most fonts fit on two compact rows.
          gap-2 = 8px per DS spec.
          pt-1 prevents hover lift clipping at grid top.
        */}
        <div className="flex flex-wrap gap-2 pt-1">
          {FONT_OPTIONS.map(option => (
            <FontPill
              key={option.family}
              label={option.label}
              family={option.family}
              selected={font === option.family}
              onSelect={() => onSelectFont(option.family)}
            />
          ))}
        </div>
      </div>

      {/* ── Typography ──────────────────────────────────────────────────── */}
      <div>
        <HairlineLabel>Typography</HairlineLabel>
        <div className="flex flex-col divide-y divide-[var(--border-s)]">
          <TypographyRow label="Labels"     caseValue={headingCase} bold={labelBold}  onCaseChange={onSetHeadingCase} onBoldChange={onSetLabelBold} />
          <TypographyRow label="Headings"   caseValue={titleCase}   bold={headingBold} onCaseChange={onSetTitleCase}   onBoldChange={onSetHeadingBold} />
          <TypographyRow label="Body text"  caseValue={bodyCase}    bold={bodyBold}   onCaseChange={onSetBodyCase}    onBoldChange={onSetBodyBold} />
          <TypographyRow label="Buttons"    caseValue={buttonCase}  bold={buttonBold} onCaseChange={onSetButtonCase}  onBoldChange={onSetButtonBold} />
          <TypographyRow label="Navigation" caseValue={navCase}     bold={navBold}    onCaseChange={onSetNavCase}     onBoldChange={onSetNavBold} />
        </div>
      </div>

      {/* ── Surface Style ───────────────────────────────────────────────── */}
      <div>
        <HairlineLabel>Surface Style</HairlineLabel>

        {/* Card opacity slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-500" style={{ color: 'var(--t3)' }}>Transparency</p>
            <p className="text-[12px] font-600" style={{ color: 'var(--t2)' }}>{cardOpacity}%</p>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={cardOpacity}
            onChange={e => onSetCardOpacity(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              // Map value [10–100] → position [0–100%] so the fill tracks the thumb
              background: `linear-gradient(to right, var(--blue) ${Math.round((cardOpacity - 10) / 90 * 100)}%, var(--elev) ${Math.round((cardOpacity - 10) / 90 * 100)}%)`,
              accentColor: 'var(--blue)',
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[11px]" style={{ color: 'var(--t4)' }}>Glass</span>
            <span className="text-[11px]" style={{ color: 'var(--t4)' }}>Solid</span>
          </div>
        </div>

        {/* Tint colour swatches */}
        <div>
          <p className="text-[12px] font-500 mb-2" style={{ color: 'var(--t3)' }}>Colour tint</p>
          <div className="flex gap-2 flex-wrap">
            {TINT_OPTIONS.map(opt => {
              const active = cardTint === opt.hex
              return (
                <button
                  key={opt.hex}
                  type="button"
                  aria-pressed={active}
                  aria-label={opt.label}
                  onClick={() => onSetCardTint(opt.hex)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-pill text-[12px] font-600 transition-all duration-150"
                  style={{
                    background: active ? 'var(--blue-sub)' : 'var(--card)',
                    border: active ? '1px solid var(--blue)' : '1px solid var(--border-s)',
                    color: active ? 'var(--blue-t)' : 'var(--t2)',
                  }}
                >
                  {opt.hex && (
                    <span
                      className="inline-block shrink-0 rounded-full"
                      style={{ width: 10, height: 10, background: opt.hex, border: '1px solid rgba(255,255,255,.15)' }}
                    />
                  )}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Icons ───────────────────────────────────────────────────────── */}
      {/*
        Divider above the Icons section visually separates it from Surface Style above.
        The parent gap-5 provides 20px spacing above the divider automatically.
      */}
      <div style={{ borderTop: '1px solid var(--border-s)', paddingTop: 16 }}>
        <HairlineLabel>Icons</HairlineLabel>

        <div className="flex flex-col gap-4">

          {/* Pack picker */}
          <div>
            <HairlineLabel>Pack</HairlineLabel>
            <div className="flex flex-wrap gap-2 pt-1">
              {(['lucide', 'phosphor', 'tabler', 'remix'] as const).map((pack) => {
                const selected = iconPack === pack
                const label = pack.charAt(0).toUpperCase() + pack.slice(1)
                return (
                  <button
                    key={pack}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${label} icon pack`}
                    onClick={() => onSetIconPack(pack)}
                    className={[
                      'shrink-0 relative transition-all duration-200',
                      'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
                      'motion-safe:active:scale-[.97]',
                      selected
                        ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                        : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] hover:border-[var(--border)] hover:bg-white/[.03]',
                    ].join(' ')}
                    style={{
                      height: 40,
                      minHeight: 44, // touch target
                      paddingLeft: 16,
                      paddingRight: selected ? 36 : 16,
                      borderRadius: 'var(--r-pill)',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                        style={{ width: 18, height: 18, background: 'var(--blue)' }}
                      >
                        <Check size={10} strokeWidth={3} color="#fff" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Style picker — hidden when Lucide (only one style) */}
          {showStylePicker && (
            <div>
              <HairlineLabel>Style</HairlineLabel>
              <div className="flex flex-wrap gap-2 pt-1">
                {activePackStyles.map(({ value, label }) => {
                  const selected = iconStyle === value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${label} style for ${iconPack.charAt(0).toUpperCase() + iconPack.slice(1)}`}
                      onClick={() => onSetIconStyle(value)}
                      className={[
                        'shrink-0 relative transition-all duration-200',
                        'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
                        'motion-safe:active:scale-[.97]',
                        selected
                          ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                          : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] hover:border-[var(--border)] hover:bg-white/[.03]',
                      ].join(' ')}
                      style={{
                        height: 40,
                        minHeight: 44,
                        paddingLeft: 16,
                        paddingRight: selected ? 36 : 16,
                        borderRadius: 'var(--r-pill)',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {label}
                      {selected && (
                        <span
                          aria-hidden="true"
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                          style={{ width: 18, height: 18, background: 'var(--blue)' }}
                        >
                          <Check size={10} strokeWidth={3} color="#fff" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Colour section — hidden when Phosphor Duotone, replaced by Multicolour notice */}
          {isDuotone ? (
            <div className="flex items-center gap-2">
              <Palette
                size={16}
                strokeWidth={2}
                aria-hidden="true"
                style={{ color: 'var(--purple-t)', flexShrink: 0 }}
              />
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t3)', lineHeight: '1.4' }}>
                Multicolour — uses two tones automatically
              </p>
            </div>
          ) : (
            <div>
              <HairlineLabel>Icon Colour</HairlineLabel>
              <div className="flex flex-wrap gap-2 pt-1">
                {ICON_COLOUR_PRESETS.map(({ name, hex }) => {
                  const selected = iconColour === hex
                  // System is a pill; colour presets are circles
                  if (!hex) {
                    return (
                      <button
                        key="system"
                        type="button"
                        aria-pressed={selected}
                        aria-label="System icon colour"
                        onClick={() => onSetIconColour('')}
                        className={[
                          'shrink-0 transition-all duration-200',
                          'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-3',
                          'motion-safe:active:scale-[.97]',
                          selected
                            ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                            : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] hover:border-[var(--border)] hover:bg-white/[.03]',
                        ].join(' ')}
                        style={{
                          height: 36,
                          minHeight: 44,
                          paddingLeft: 14,
                          paddingRight: 14,
                          borderRadius: 'var(--r-pill)',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        System
                      </button>
                    )
                  }
                  return (
                    <button
                      key={hex}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${name} icon colour`}
                      title={name}
                      onClick={() => onSetIconColour(hex)}
                      // 4px transparent padding lifts the touch target to 44px
                      // (36px visible circle + 4px padding each side = 44px)
                      className="shrink-0 flex items-center justify-center transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--blue)]"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        padding: 4,
                        background: 'transparent',
                        // focus-visible outline-offset is 3px per spec
                        outlineOffset: selected ? 0 : 3,
                      }}
                    >
                      <span
                        className="block w-full h-full rounded-full transition-all duration-200"
                        style={{
                          background: hex,
                          border: selected
                            ? '2px solid var(--blue)'
                            : '1.5px solid rgba(255,255,255,.10)',
                          boxShadow: selected
                            ? '0 0 0 3px rgba(55,114,255,.20)'
                            : 'none',
                          transform: selected ? 'none' : 'scale(1)',
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Preview strip */}
          <div>
            <HairlineLabel>Preview</HairlineLabel>
            <div
              role="img"
              aria-label="Icon style preview"
              className="flex items-center gap-4"
              style={{
                borderTop: '1px solid var(--border-s)',
                paddingTop: 12,
                marginTop: 4,
              }}
            >
              {PREVIEW_CONCEPTS.map((concept) => {
                const IconComponent = resolveIcon(concept, iconPack, iconStyle)
                // Phosphor icons accept a `weight` prop to drive style
                const phosphorWeight = iconPack === 'phosphor'
                  ? (iconStyle as string)
                  : undefined
                return (
                  <IconComponent
                    key={concept}
                    aria-hidden="true"
                    size={24}
                    strokeWidth={2}
                    {...(phosphorWeight ? { weight: phosphorWeight } : {})}
                    style={{ color: iconColour || 'var(--t2)', flexShrink: 0 }}
                  />
                )
              })}
            </div>

            {/* Phosphor coverage note — shown only when Phosphor is selected */}
            {iconPack === 'phosphor' && (
              <p
                className="mt-1.5 leading-snug"
                style={{ fontSize: 11, fontWeight: 400, color: 'var(--t3)' }}
              >
                Some screens use icons not available in every pack — those stay as Lucide.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ── Reset ───────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onReset}
        className="mt-1 ml-auto block py-3 text-xs font-500 transition-colors duration-200 hover:text-[var(--t2)]"
        style={{ color: 'var(--t3)' }}
      >
        Reset to defaults
      </button>
    </div>
  )
}
