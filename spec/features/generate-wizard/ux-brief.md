# UX Brief: Generate Wizard

---

## Screen inventory

| Screen / Layer | Route | Type |
|----------------|-------|------|
| GenerateScreen | `/generate` | Full page — hosts wizard |
| ResultsScreen | (inline — wizard step 8) | Full page — replaces wizard |
| AdoptionOverlay | After "Adopt" tap | Framer Motion overlay |
| TraderPuzzle | After adoption (50%) | BottomSheet |

---

## Wizard layout (steps 1-7)

```
┌──────────────────────────────────────┐
│  ← Back     Step 3 of 7    [dots]   │  wizard header, px-6
├──────────────────────────────────────┤
│                                      │
│  Choose a gender                     │  H3, t1
│  for your [type]                     │  body, t2, mt-1
│                                      │
│  ┌──────────┐  ┌──────────┐         │  option cards grid
│  │  👦 Male │  │ 👧Female │         │
│  └──────────┘  └──────────┘         │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

- Back arrow: goes to previous step (on step 1: hidden / goes to Explore or Home)
- Step dots: N filled dots + remaining empty, pill-shaped, 8px each
- Question heading: varies per step
- Options: tap-to-select card grid (1-col for 2 options, 2-col for 4-12 options, scrollable for more)
- Selected state: blue-sub bg + blue border + checkmark icon top-right
- No "Next" button — tapping an option auto-advances to next step (except step 7 which triggers generation)

---

## Option card anatomy

```
┌────────────────────────┐
│                    ✓   │  checkmark — top right, shown when selected
│  [emoji/icon]          │  64px emoji or animal image, centered
│                        │
│  Label                 │  body-sm font-600, t1
│  description (opt)     │  caption, t3
└────────────────────────┘
```

Card: `bg-card, border border-border-s, r-lg, p-4`
Selected: `bg-blue-sub, border-blue`
Press: `scale(0.97)` active state

---

## Step definitions

| Step | Question | Layout | Notes |
|------|----------|--------|-------|
| 1 — Category | "Where does your animal live?" | 2-col grid, 6 cards | Each card has category emoji + name |
| 2 — Type | "What kind of animal?" | 2-col grid, varies | Types filtered by chosen category |
| 3 — Gender | "Choose a gender" | 2-col grid, 2 cards | ♂ Male / ♀ Female |
| 4 — Age | "How old is your [type]?" | 2-col + 1 centered, 5 cards | Newborn / Baby / Young / Adult / Old Timer |
| 5 — Personality | "What's their personality?" | 2-col grid, 12 cards | Trait + emoji |
| 6 — Breed | "Choose a breed" | 2-col grid, varies | Pre-filled from Explore if ?breed= param |
| 7 — Colour | "Choose a colour" | 2-col grid, varies | Colour chip + label |

---

## Generating state (between step 7 and results)

After step 7 selection, full-screen overlay:
```
[animated paw prints floating up]
Discovering your animal...
```
Duration: 1.5s fake delay (gives breathing room before results)
Reduced motion: instant transition, no animation

---

## ResultsScreen layout

```
┌──────────────────────────────────────┐
│  ← Start over                       │  top-left, ghost button
│                                      │
│  [animal image 4:3]                  │  full width, r-lg top corners
│  [rarity badge]  [category badge]   │
│                                      │
│  Choose a name                       │  H4, t1
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ● Bella    (tap to select)   │   │
│  ├──────────────────────────────┤   │
│  │ ● Amber                      │   │
│  ├──────────────────────────────┤   │
│  │ ● Clover                     │   │
│  └──────────────────────────────┘   │
│                                      │
│  Discovery narrative text...         │  body-sm, t2, italic, px-6
│                                      │
│  [pink btn: Adopt {name}]            │  full width, lg, disabled until name chosen
│  [ghost btn: Generate again]         │  full width, below adopt
└──────────────────────────────────────┘
```

---

## AdoptionOverlay

Full-screen overlay (z-top, above everything):
- Background: gradient hero (pink → blue), 65% opacity blur
- Centre: animated heart icon (scale pulse) + "You adopted [Name]! 🎉"
- Auto-dismiss after 2s OR tap anywhere to dismiss
- Triggers TraderPuzzle if probability check passes (50%)

---

## TraderPuzzle (BottomSheet)

```
┌──────────────────────────────────────┐
│  Trader Quiz! 🪙                    │  H4, t1
│  Answer correctly for 10-25 coins   │  body-sm, t2
│                                      │
│  [question text]                     │  body, t2
│                                      │
│  [Option A]  [Option B]             │  2×2 option grid
│  [Option C]  [Option D]             │
│                                      │
│  [Skip — not now]                   │  ghost btn, t3
└──────────────────────────────────────┘
```

Same answer flash mechanic as Explore StealthQuiz.
Reward is higher: 10-25 coins vs 5 from stealth quiz.
After answer/skip: navigate to Home.

---

## Query param pre-fill

On mount, GenerateScreen reads:
- `?type=Tiger` → pre-fills Step 2 selection, skips to Step 6 (or Step 3 if no breed)
- `?type=Tiger&breed=Bengal` → pre-fills Step 2 and Step 6, skips to Step 3

Pre-fill shows the selection as already chosen but still lets user change it.
Skip means: set the selections and advance currentStep past those steps.
