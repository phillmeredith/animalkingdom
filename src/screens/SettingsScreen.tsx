// SettingsScreen — accessibility toggles, data management
// Accessed via gear icon in HomeScreen header; full-screen route at /settings

import { useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Volume2, Zap, Trash2, Download, Upload, AlertTriangle } from 'lucide-react'
import { useReducedMotion, setReducedMotionOverride } from '@/hooks/useReducedMotion'
import { useSpeech } from '@/hooks/useSpeech'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useSavedNames } from '@/hooks/useSavedNames'
import { usePersonalisation } from '@/hooks/usePersonalisation'
import { useToast } from '@/components/ui/Toast'
import { db } from '@/lib/db'
import { PersonalisationSection } from '@/components/settings/PersonalisationSection'

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      className="flex items-center gap-4 w-full py-4 text-left"
      onClick={() => onChange(!checked)}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--elev)] shrink-0">
        <Icon size={18} className="text-t2" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-600 text-t1">{label}</div>
        <div className="text-[13px] text-t3">{description}</div>
      </div>
      {/* Toggle pill */}
      <div
        className="w-12 h-7 rounded-pill relative shrink-0 transition-colors duration-200"
        style={{ background: checked ? 'var(--blue)' : 'var(--border)' }}
      >
        <div
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? '24px' : '4px' }}
        />
      </div>
    </button>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-2 px-6">
        {title}
      </div>
      <div className="mx-6 rounded-2xl bg-[var(--card)] border border-[var(--border-s)] px-4 divide-y divide-[var(--border-s)]">
        {children}
      </div>
    </div>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  confirmWord: string
  title: string
  warning: string
  confirmLabel: string
  busy: boolean
  error?: string | null
  onConfirm: (input: string) => void
  onCancel: () => void
  destructive?: boolean
}

function ConfirmModal({
  confirmWord, title, warning, confirmLabel, busy, error, onConfirm, onCancel, destructive = false,
}: ConfirmModalProps) {
  const [input, setInput] = useState('')
  const ready = input === confirmWord

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end"
      style={{ background: 'rgba(0,0,0,0.10)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full flex flex-col gap-5 p-6 pb-10"
        style={{
          background: 'rgba(13,13,17,.80)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,.08)',
          borderRadius: '20px 20px 0 0',
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto -mt-1 mb-1" style={{ background: 'rgba(255,255,255,.2)' }} />
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: destructive ? 'var(--red-sub)' : 'var(--blue-sub)' }}
          >
            <AlertTriangle size={18} style={{ color: destructive ? 'var(--red-t)' : 'var(--blue-t)' }} />
          </div>
          <div>
            <p className="text-[16px] font-700" style={{ color: 'var(--t1)' }}>{title}</p>
            <p className="text-[13px] mt-1 leading-snug" style={{ color: 'var(--t3)' }}>{warning}</p>
          </div>
        </div>

        {/* Confirmation input */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-700 uppercase tracking-widest" style={{ color: 'var(--t3)' }}>
            Type <span style={{ color: destructive ? 'var(--red-t)' : 'var(--blue-t)' }}>{confirmWord}</span> to confirm
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={confirmWord}
            autoFocus
            className="h-11 rounded-xl px-4 text-[15px] font-700 text-t1 bg-[var(--elev)] border outline-none transition-all w-full tracking-widest"
            style={{
              borderColor: ready
                ? (destructive ? 'var(--red)' : 'var(--blue)')
                : 'var(--border-s)',
              boxShadow: ready
                ? (destructive ? '0 0 0 3px rgba(239,70,111,.12)' : '0 0 0 3px rgba(55,114,255,.12)')
                : 'none',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && ready && !busy) onConfirm(input) }}
          />
          {error && <p className="text-[13px]" style={{ color: 'var(--red-t)' }}>{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-pill text-[14px] font-600 transition-all"
            style={{ background: 'var(--elev)', color: 'var(--t2)', border: '1px solid var(--border-s)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(input)}
            disabled={!ready || busy}
            className="flex-1 h-11 rounded-pill text-[14px] font-600 text-white transition-opacity disabled:opacity-40"
            style={{ background: destructive ? 'var(--red)' : 'var(--blue)' }}
          >
            {busy ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { enabled: speechEnabled, setEnabled: setSpeechEnabled, isSupported } = useSpeech()
  const { coins } = useWallet()
  const { skills } = useProgress()
  const { pets } = useSavedNames()
  const { toast } = useToast()

  const {
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
    playerName,
    iconPack,
    iconStyle,
    iconColour,
    setBackgroundUrl,
    setBgOpacity,
    setCardOpacity,
    setCardTint,
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
    setIconPack,
    setIconStyle,
    setIconColour,
    reset: resetPersonalisation,
  } = usePersonalisation()

  // Delete data — confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await db.transaction('rw',
        db.playerWallet, db.transactions, db.savedNames, db.history,
        db.skillProgress, db.puzzleHistory, db.badges, db.careLog,
        db.collectedCards, db.packHistory,
        async () => {
          await db.playerWallet.clear()
          await db.transactions.clear()
          await db.savedNames.clear()
          await db.history.clear()
          await db.skillProgress.clear()
          await db.puzzleHistory.clear()
          await db.badges.clear()
          await db.careLog.clear()
          await db.collectedCards.clear()
          await db.packHistory.clear()
        }
      )
      resetPersonalisation()
      navigate('/', { replace: true })
    } catch {
      setDeleting(false)
      setShowDeleteModal(false)
      toast({ type: 'error', title: 'Could not delete data. Please try again.' })
    }
  }

  // Export — download all DB tables as JSON
  async function handleExport() {
    try {
      const [wallet, txns, names, history, skills, puzzles, badges, care, cards, packs] =
        await Promise.all([
          db.playerWallet.toArray(),
          db.transactions.toArray(),
          db.savedNames.toArray(),
          db.history.toArray(),
          db.skillProgress.toArray(),
          db.puzzleHistory.toArray(),
          db.badges.toArray(),
          db.careLog.toArray(),
          db.collectedCards.toArray(),
          db.packHistory.toArray(),
        ])
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        prefs: { font, headingCase, playerName },
        db: {
          playerWallet: wallet,
          transactions: txns,
          savedNames: names,
          history,
          skillProgress: skills,
          puzzleHistory: puzzles,
          badges,
          careLog: care,
          collectedCards: cards,
          packHistory: packs,
        },
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `animal-kingdom-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ type: 'error', title: 'Export failed. Please try again.' })
    }
  }

  // Import — select file first, confirm in modal
  const importFileRef = useRef<HTMLInputElement>(null)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImportFile(file)
    setImportError(null)
    setShowImportModal(true)
    e.target.value = ''
  }

  async function handleImportConfirm() {
    if (!pendingImportFile) return
    setImporting(true)
    setImportError(null)
    try {
      const text = await pendingImportFile.text()
      const payload = JSON.parse(text)
      if (payload.version !== 1 || !payload.db) throw new Error('Invalid backup file')
      const { db: d } = payload
      await db.transaction('rw',
        db.playerWallet, db.transactions, db.savedNames, db.history,
        db.skillProgress, db.puzzleHistory, db.badges, db.careLog,
        db.collectedCards, db.packHistory,
        async () => {
          await db.playerWallet.clear()
          await db.transactions.clear()
          await db.savedNames.clear()
          await db.history.clear()
          await db.skillProgress.clear()
          await db.puzzleHistory.clear()
          await db.badges.clear()
          await db.careLog.clear()
          await db.collectedCards.clear()
          await db.packHistory.clear()
          if (d.playerWallet?.length) await db.playerWallet.bulkAdd(d.playerWallet)
          if (d.transactions?.length) await db.transactions.bulkAdd(d.transactions)
          if (d.savedNames?.length) await db.savedNames.bulkAdd(d.savedNames)
          if (d.history?.length) await db.history.bulkAdd(d.history)
          if (d.skillProgress?.length) await db.skillProgress.bulkAdd(d.skillProgress)
          if (d.puzzleHistory?.length) await db.puzzleHistory.bulkAdd(d.puzzleHistory)
          if (d.badges?.length) await db.badges.bulkAdd(d.badges)
          if (d.careLog?.length) await db.careLog.bulkAdd(d.careLog)
          if (d.collectedCards?.length) await db.collectedCards.bulkAdd(d.collectedCards)
          if (d.packHistory?.length) await db.packHistory.bulkAdd(d.packHistory)
        }
      )
      if (payload.prefs) {
        if (payload.prefs.font) setFont(payload.prefs.font)
        if (payload.prefs.headingCase) setHeadingCase(payload.prefs.headingCase)
        if (typeof payload.prefs.playerName === 'string') setPlayerName(payload.prefs.playerName)
      }
      navigate('/', { replace: true })
    } catch {
      setImportError('Could not read backup file. Make sure it is a valid Animal Kingdom export.')
      setImporting(false)
    }
  }

  const totalXp = skills.reduce((s, sk) => s + sk.xp, 0)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto pb-24">
      {/* Header */}
      <div className="flex items-center px-6 pt-5 pb-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-full text-t2 hover:text-t1 hover:bg-white/[.06] transition-all mr-2"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[22px] font-700 text-t1">Settings</h1>
      </div>

      {/* Accessibility */}
      <Section title="Accessibility">
        <ToggleRow
          icon={Zap}
          label="Reduce motion"
          description="Turns off animations and transitions"
          checked={reducedMotion}
          onChange={setReducedMotionOverride}
        />
        <ToggleRow
          icon={Volume2}
          label="Read questions aloud"
          description={isSupported ? 'Uses device text-to-speech (en-GB)' : 'Not supported on this device'}
          checked={speechEnabled}
          onChange={setSpeechEnabled}
        />
      </Section>

      {/* Profile */}
      <Section title="Profile">
        <div className="py-4 flex flex-col gap-2">
          <label className="text-[11px] font-700 uppercase tracking-widest text-t3">
            Your name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Explorer"
            maxLength={32}
            className="h-11 rounded-xl px-4 text-[15px] text-t1 bg-[var(--elev)] border border-[var(--border-s)] outline-none focus:border-[var(--blue)] focus:shadow-[0_0_0_3px_rgba(55,114,255,.12)] transition-all w-full"
          />
          <p className="text-[12px] text-t3">Shown in the greeting on Home</p>
        </div>
      </Section>

      {/* Personalisation */}
      <Section title="Personalisation">
        <PersonalisationSection
          backgroundUrl={backgroundUrl}
          bgOpacity={bgOpacity}
          cardOpacity={cardOpacity}
          cardTint={cardTint}
          font={font}
          headingCase={headingCase}
          titleCase={titleCase}
          bodyCase={bodyCase}
          buttonCase={buttonCase}
          navCase={navCase}
          labelBold={labelBold}
          headingBold={headingBold}
          bodyBold={bodyBold}
          buttonBold={buttonBold}
          navBold={navBold}
          onSetBackgroundUrl={setBackgroundUrl}
          onSetBgOpacity={setBgOpacity}
          onSetCardOpacity={setCardOpacity}
          onSetCardTint={setCardTint}
          onSelectFont={setFont}
          onSetHeadingCase={setHeadingCase}
          onSetTitleCase={setTitleCase}
          onSetBodyCase={setBodyCase}
          onSetButtonCase={setButtonCase}
          onSetNavCase={setNavCase}
          onSetLabelBold={setLabelBold}
          onSetHeadingBold={setHeadingBold}
          onSetBodyBold={setBodyBold}
          onSetButtonBold={setButtonBold}
          onSetNavBold={setNavBold}
          iconPack={iconPack}
          iconStyle={iconStyle}
          iconColour={iconColour}
          onSetIconPack={setIconPack}
          onSetIconStyle={setIconStyle}
          onSetIconColour={setIconColour}
          onReset={resetPersonalisation}
        />
      </Section>

      {/* Stats */}
      <Section title="Your progress">
        <div className="py-4 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Coins', value: coins.toLocaleString() },
            { label: 'Animals', value: pets.length },
            { label: 'Total XP', value: totalXp },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-[20px] font-700 text-t1">{stat.value}</div>
              <div className="text-[11px] font-700 uppercase tracking-widest text-t3 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="py-4 flex items-center justify-between">
          <span className="text-[15px] text-t2">Animal Kingdom</span>
          <span className="text-[13px] text-t3">v1.0</span>
        </div>
      </Section>

      {/* Data */}
      <Section title="Data">
        {/* Export */}
        <button
          className="flex items-center gap-4 w-full py-4 text-left"
          onClick={handleExport}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--green-sub)] shrink-0">
            <Download size={18} className="text-[var(--green-t)]" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-600 text-t1">Export data</div>
            <div className="text-[13px] text-t3">Download a backup of all your animals, coins, and progress</div>
          </div>
        </button>

        {/* Import */}
        <button
          className="flex items-center gap-4 w-full py-4 text-left border-t border-[var(--border-s)]"
          onClick={() => importFileRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--blue-sub)] shrink-0">
            <Upload size={18} className="text-[var(--blue-t)]" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-600 text-t1">Import data</div>
            <div className="text-[13px] text-t3">Restore from a backup — replaces all current data</div>
          </div>
        </button>
        <input
          ref={importFileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Delete */}
        <button
          className="flex items-center gap-4 w-full py-4 text-left border-t border-[var(--border-s)]"
          onClick={() => setShowDeleteModal(true)}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--red-sub)] shrink-0">
            <Trash2 size={18} className="text-[var(--red-t)]" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-600 text-[var(--red-t)]">Delete all data</div>
            <div className="text-[13px] text-t3">Permanently removes all pets, coins, and progress</div>
          </div>
        </button>

        {/* Confirmation modals */}
        {showImportModal && (
          <ConfirmModal
            confirmWord="IMPORT"
            title="Restore from backup"
            warning={`This will replace all your current animals, coins, and progress with the contents of "${pendingImportFile?.name}". This cannot be undone.`}
            confirmLabel="Import"
            busy={importing}
            error={importError}
            onConfirm={handleImportConfirm}
            onCancel={() => { setShowImportModal(false); setPendingImportFile(null); setImportError(null) }}
          />
        )}
        {showDeleteModal && (
          <ConfirmModal
            confirmWord="DELETE"
            title="Delete all data"
            warning="This will permanently remove all your animals, coins, progress, and settings. There is no way to recover this data."
            confirmLabel="Delete"
            busy={deleting}
            destructive
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </Section>
    </div>
  )
}
