# Refined Stories: Compare Screen

> Feature: Compare Screen
> Author: Product Owner
> Status: Phase B Approved — 2026-03-27
> Last updated: 2026-03-27
> Depends on: BACKLOG.md (status: queued), interaction-spec.md, ur-findings.md

---

## 1. Feature Summary

Compare gives Harry a side-by-side view of two of his animals so he can see how they
measure up. Because Harry is 7 and makes emotional rather than analytical decisions,
the screen goes beyond raw numbers: a recommendation strip below the stat table tells
him in one sentence which animal has the edge for racing and which might earn more coins
if sold. The stat table uses green tinting for the higher value and neutral grey for the
lower — never red, never the word "loser". The feature is accessed from the PetDetailSheet
in My Animals, with the first pet pre-selected. A simple picker sheet lets Harry choose
the second animal. He can swap sides, tap either pet portrait to go to their detail, and
leave whenever he wants. No coins change hands and no game state is affected.

Copy throughout this feature uses child-friendly vocabulary (e.g. "has the edge", "might
get more coins", "evenly matched") in preference to analytical or financial jargon. This
applies across Compare, Auctions, and Player Listings.

---

## 2. In Scope / Out of Scope

| Area | In Scope | Out of Scope |
|------|----------|--------------|
| CompareScreen at `/compare` | Yes | — |
| PetSelectorSheet for second pet selection | Yes | — |
| CompareHeader with swap button and pet portraits | Yes | — |
| StatTable as proper `<table>` element | Yes | — |
| StatRows: Speed, Strength, Agility, Care Score, Rarity, Age, Personality, Category | Yes | — |
| Winner indicator: green tinting on higher numeric value | Yes | — |
| Tied state: "TIED" badge in label column | Yes | — |
| Missing stat display: "–" (en-dash) | Yes | — |
| Recommendation strip ("best for racing" / "worth more") | Yes — in scope for this phase (see Scope Decision below) | — |
| CompareEmptyState when fewer than 2 active pets | Yes | — |
| "Compare" button in PetDetailSheet footer | Yes | — |
| Tap pet portrait in CompareHeader → navigate to pet detail | Yes | — |
| Swap animation (200ms horizontal translate, respects reduced-motion) | Yes | — |
| "Done" button navigating back to My Animals | Yes | — |
| Share / screenshot feature | Out of scope | No sharing mechanic in this phase |
| Multi-pet comparison (more than 2 pets) | Out of scope | Two-pet only |
| Saved comparisons | Out of scope | No persistence for this phase |
| Win count summary in CompareHeader | Out of scope | Noted in UX spec as a future addition |
| Icon prefixes on stat labels (Zap, Dumbbell, etc.) | Out of scope — but label column must reserve space for future icon prefix | UX spec defers to future iteration; layout must not preclude it |
| Equipped items display | Out of scope — `SavedName` does not carry stat boost values directly; resolving equipped item effects requires joining `ownedItems` data, which adds complexity disproportionate to the phase | Future iteration |
| "What should I do with these?" prompt | Covered by recommendation strip — not a separate interactive prompt |
| Compare entry from any screen other than PetDetailSheet | Out of scope in this phase | Direct URL entry is supported defensively (see A-C-6) |

### Scope Decision: Recommendation strip is in scope for this phase

The UR key insight for Compare is explicit: "The recommendation layer is not a
nice-to-have; it is the feature." Without it, the stat table shows data Harry cannot act
on at his developmental stage. The UX interaction spec includes a "best for racing"
recommendation label (section 8, child comprehension note C1). This is confirmed as
in scope for Phase C.

The recommendation strip is a read-only display below the StatTable. It contains up to
two sentences generated from the comparison data at render time (no API call):
- Racing: "For racing — [Name] has the edge." (higher Speed + Agility wins; tiebreak by
  Strength; if all equal: "They're evenly matched for racing.")
- Selling: "For selling — [Name] might get more coins." (higher rarity wins; if same
  rarity, higher care score wins; if equal: "Both are worth a similar amount.")
- No negative framing. The "lower" pet is never named as worse in the recommendation text.

The recommendation logic is a pure utility function (no hook required) that takes two
`SavedName` objects and returns `{ racing: string | null, selling: string }`. It is
testable in isolation and must be covered by unit tests in Phase D.

---

## 3. User Stories

### Story C-1 — Enter Compare from PetDetailSheet with first pet pre-selected

As Harry,
I want to tap "Compare" on one of my pets and immediately pick a second one to compare it with,
so that I can get to the comparison quickly without having to select both animals from scratch.

### Story C-2 — Pick the second pet

As Harry,
I want to choose which of my other animals to compare against,
so that I can compare the specific pair I'm interested in.

### Story C-3 — See stats side by side

As Harry,
I want to see my two animals' strengths next to each other,
so that I can understand what each one is good at.

### Story C-4 — Know which animal has the edge (recommendation strip)

As Harry,
I want to see a plain-English sentence telling me which pet is better for racing and which
might sell for more,
so that I don't have to figure it out from the numbers myself.

### Story C-5 — Swap sides

As Harry,
I want to switch which animal is on the left and which is on the right,
so that I can look at it from a different angle.

### Story C-6 — Navigate to a pet's detail from Compare

As Harry,
I want to tap on one of the animals in the comparison to go to their full profile,
so that I can see all their details without leaving the comparison permanently.

### Story C-7 — Leave the comparison

As Harry,
I want a clear way to go back to My Animals when I'm done,
so that I don't feel stuck on the Compare screen.

### Story C-8 — Empty state: fewer than 2 pets

As Harry,
I want to see a helpful message if I don't have enough animals to compare,
so that I know what to do next.

### Story C-9 — Compare button hidden when only one pet owned

As Harry,
I want the Compare button to disappear when I only have one pet,
so that I'm not shown an option I can't use.

### Story C-10 — Missing stat values handled gracefully

As Harry,
I want to see a clear marker when a stat isn't available yet,
so that I'm not confused by blank cells.

---

## 4. Acceptance Criteria

### Story C-1 — Enter Compare from PetDetailSheet

1. The PetDetailSheet footer displays a 2×2 grid of four buttons: top row — "Rename" | "Release"; bottom row — "List for Sale" | "Compare". The "Compare" button appears in the bottom-right slot. Minimum height 44px per button at all breakpoints.
2. The "Compare" button is hidden (not disabled) when the player has only one eligible pet. It uses conditional rendering, not a `disabled` prop.
3. Tapping "Compare" navigates to `/compare` with the current pet's ID passed via React Router state: `navigate('/compare', { state: { leftPetId: pet.id } })`. URL does not expose internal IDs.
4. On arrival at `/compare` with `leftPetId` in state: PetSelectorSheet opens immediately, prompting Harry to pick the second animal. The pre-selected pet is excluded from the picker list.
5. The 2×2 footer grid layout is confirmed across all breakpoints. On 375px the grid wraps naturally. On 768px+ the grid is maintained (not collapsed to a single row). The FE self-review must confirm minimum 44px button height at 375px.

### Story C-2 — Pick the second pet

1. PetSelectorSheet (BottomSheet) opens with heading "Pick a second animal to compare" (H4).
2. The sheet shows a scrollable single-column list of PetSelectorRow items for all pets where `status === "active" OR status === "for_sale"` (listed pets may still be compared), excluding the pre-selected `leftPetId` pet.
3. PetSelectorRow shows: animal image (48×48px, `r-md`), pet name (`14px/600, --t1`), animal type + breed (`12px/400, --t3`), RarityBadge (right-aligned). Min height: 72px.
4. Tapping a PetSelectorRow immediately closes the sheet and renders the full comparison view. No "confirm" step.
5. While `useSavedNames` is loading: 3 skeleton rows are shown in the sheet.
6. Defensive: if all available pets are excluded (impossible if the < 2 guard is working), the sheet shows "No animals available" text row rather than an empty sheet.
7. If Harry arrives at `/compare` directly (no `leftPetId` in state): PetSelectorSheet opens with heading "Pick an animal to compare" and no exclusion. First selection becomes the left pet; sheet reopens for second selection.
8. Focus moves to the first PetSelectorRow on sheet open.

### Story C-3 — See stats side by side

1. CompareScreen renders a CompareHeader (sticky, `position: sticky; top: 0; z-index: 10`) and a StatTable below.
2. CompareHeader shows: left pet portrait (56×56px at 768px+, 44×44px at 375px, `r-md`, tappable), left pet name (`15px/600, --t1`, max 12 chars with ellipsis), RarityBadge, swap button (centred, `ArrowLeftRight` icon, 20px, outline sm, 44×44px explicit min size), right pet name, right pet RarityBadge, right pet portrait. Left column is `flex-start`; right column is `flex-end`. At 375px: RarityBadges are hidden in the header (space constraint — already specified in UX spec).
3. StatTable is a `<table>` element (not div-based) with `<thead>` containing two `<th>` columns (left pet name, right pet name) and `<tbody>` with stat rows. The `<th>` for each column uses `aria-label="[Pet Name]"`. This is not optional — accessibility requirement.
4. Each `<tbody>` row has a row-header `<th scope="row">` for the stat label.
5. Stat rows in order: Speed, Strength, Agility, Care Score, Rarity, Age, Personality, Category.
6. Layout within each StatRow: `[Left value] [Label] [Right value]`. Three columns: left (flex-end), centre (label, fixed ~100px), right (flex-start).
7. For comparable stats (Speed, Strength, Agility, Care Score): the higher numeric value cell receives `--green-t` text and `--green-sub` background tint. The lower value cell uses `--t3` text. No red styling anywhere. No "winner" or "loser" language in copy or aria labels.
8. Winner cell `aria-label`: "[Pet A name] wins this stat: [value]". Tied cells: `aria-label="Tied: both [value]"`.
9. For equal values (tied): both cells use `--t2` text. A "TIED" badge (`--green-sub` bg, `--green-t` text, `11px/600`) replaces the label text in the centre column. The label text returns when not tied.
10. For display-only rows (Rarity, Age, Personality, Category): both cells use `--t2`. No winner treatment.
11. Row height: minimum 52px. Cell padding: 14px 16px.
12. Alternating rows: even rows have `rgba(255,255,255,.015)` background tint (DS row-hover pattern — acceptable as static background).
13. StatTable has no outer card wrapper. Rows sit on `--bg` with `1px solid --border-s` dividers between rows. First row has no top border; last row has no bottom border.
14. Content column: `max-w-3xl mx-auto w-full`, `px-0` for the table (edge-to-edge within the content column), `pb-24`.

### Story C-4 — Recommendation strip

1. Below the StatTable, a recommendation strip renders with up to two sentences.
2. Strip layout: `--elev` bg, `r-lg`, padding `16px`, `mt-16`. No card border — subtle background only.
3. Racing recommendation: generated by a pure utility function. Logic: compare Speed + Agility sum; if tied, use Strength as tiebreak; if all equal, use "They're evenly matched for racing." Output: "For racing — [Name] has the edge." or "They're evenly matched for racing." The losing pet's name does not appear in this sentence.
4. Selling recommendation: compare rarity ranking (Legendary > Epic > Rare > Uncommon > Common); if tied, use care score (calculated as `Math.min(100, (careActionsLast7Days * 10) + (currentStreak * 5))`). Output: "For selling — [Name] might get more coins." or "Both are worth a similar amount." The lower-value pet's name does not appear in this sentence.
5. Copy uses plain English. No jargon. No "winner" or "loser".
6. The recommendation utility function is a pure function (`(petA: SavedName, petB: SavedName) => { racing: string | null, selling: string }`). It must be unit-tested in Phase D.
7. When Speed, Strength, and Agility are all missing for both pets (neither has ever raced): the racing recommendation is omitted. Only the selling recommendation is shown.
8. Strip heading: "Which one should I choose?" (`13px/700, uppercase, letter-spacing 1.5px, --t3` — hairline style). This heading is always shown when the strip is visible.

### Story C-5 — Swap sides

1. Tapping the swap button (`ArrowLeftRight`, outline sm, 44×44px) exchanges left and right pets.
2. Left and right values in all StatRows update immediately.
3. Winner indicators (green tinting, "TIED" badges) update immediately to reflect the new arrangement.
4. CompareHeader pet portraits and names swap.
5. If motion is not reduced: a 200ms horizontal translate animation plays on the header columns during swap. Under `prefers-reduced-motion`: swap is instant.
6. Swap button has `aria-label="Swap animals"`.
7. After swap, focus returns to the swap button.

### Story C-6 — Navigate to a pet's detail

1. Tapping a pet portrait or name in CompareHeader navigates to `/animals` with that pet's detail sheet open.
2. Navigation is immediate — no confirmation.
3. No "back to Compare" navigation is provided from the pet detail. Harry uses the bottom nav to return.
4. Pet portrait tap target: `min-h-[44px] min-w-[44px]`. The 56×56px portrait at 768px+ naturally meets this; at 375px where portrait reduces to 44×44px, the button wrapper must confirm the touch target is not smaller.
5. Accessibility: each portrait button has `aria-label="View [Pet Name]'s profile"`.

### Story C-7 — Leave the comparison

1. A "Done" button (`variant="outline"`, `size="sm"`, `ChevronLeft` icon or plain text) is present in the page header area.
2. Tapping "Done" navigates back (`useNavigate(-1)`) to the screen Harry came from (typically My Animals with PetDetailSheet open).
3. The bottom nav remains accessible throughout the Compare screen. Harry can also leave by tapping any bottom nav item.

### Story C-8 — Empty state

1. On mount, CompareScreen checks: if fewer than 2 pets with `status === "active" OR status === "for_sale"` exist, CompareEmptyState renders fullscreen.
2. CompareEmptyState: `GitCompare` icon (48px, `--t4`), title "You need two animals to compare" (H4, `22px/600, --t1`), description "Adopt more animals from the Marketplace to start comparing!" (Body, `15px/400, --t3`), CTA "Go to Marketplace" (`variant="primary"`, blue, `size="md"`) navigating to `/marketplace`.
3. PetSelectorSheet does not open if CompareEmptyState is shown.

### Story C-9 — Compare button hidden when only one pet

1. The "Compare" button in PetDetailSheet is rendered conditionally: `{eligiblePets.length > 1 && <Button ...>}`. It is not rendered with `disabled` prop.
2. "eligiblePets" in this condition means the count of pets with `status === "active" OR status === "for_sale"` — i.e. the same set eligible for comparison.
3. If Harry's only other active pet is listed for sale, the Compare button still shows (listed pets are valid comparison targets per story C-2 criterion 2).

### Story C-10 — Missing stat values

1. If a pet has no racing stats assigned (`speed`, `strength`, `agility` fields are null or absent on `SavedName`): the stat cell displays "–" (en-dash, U+2013, not a hyphen).
2. Missing value cells use `aria-label="No data"`.
3. No winner treatment is applied to a row where either value is missing.
4. If a pet has no care log entries: the Care Score row displays "–". No winner treatment.
5. The recommendation strip omits the racing recommendation if Speed, Strength, and Agility are missing for both pets (see C-4 criterion 7). If only one pet has missing racing stats, the strip uses the available data and notes: "For racing — [Name with stats] has the edge (the other hasn't raced yet)." This edge-case copy must be tested.

---

## 5. Technical Notes

### SavedName schema — new racing stat fields (confirmed)

Three new fields are added to the `SavedName` entity as part of this feature:

```
speed: number
strength: number
agility: number
```

These fields are assigned at adoption time via a generation function. The generation
formula is AI-derived based on animal type and rarity. The Developer is responsible for:
1. Adding `speed`, `strength`, and `agility` to the `SavedName` schema in Dexie.
2. Writing the generation function that assigns values at adoption time.
3. Ensuring the generation function runs for all adoption paths (`source: "marketplace"`,
   `source: "auction"`, and any other existing sources).

The Compare screen reads `speed`, `strength`, and `agility` directly from the `SavedName`
record. No join to a race results entity is required for these fields. If a pet was adopted
before this feature ships (legacy records), the fields will be absent — the FE must treat
absent values as `null` and display "–" per story C-10.

### Care Score — definition and formula (confirmed)

The "CARE" stat row in the StatTable displays a calculated care score, not the raw
`careStreak` field. The formula is:

```
careScore = Math.min(100, (careActionsLast7Days * 10) + (currentStreak * 5))
```

This yields a value of 0–100. It is displayed as a plain number out of 100 (e.g. "72").

- `careActionsLast7Days`: count of care log entries for this pet in the last 7 days.
- `currentStreak`: the existing `careStreak` field on `SavedName`.

The Developer must expose `careActionsLast7Days` via a utility or hook. If it is not
already derived from `careLog`, a new query is required: count of `careLog` entries for
`petId` where `createdAt >= now - 7 days`.

The care score is used in two places:
1. The Care Score row in the StatTable (displayed value).
2. The selling recommendation tiebreak in the `compareRecommend` utility function.

The `compareRecommend` function receives the two `SavedName` objects. The care score
must either be pre-computed and attached to the `SavedName` before being passed to the
function, or the function must accept a supplementary `careScores` argument. The Developer
must choose the cleanest pattern and document it.

### PetDetailSheet footer layout — 2×2 grid (confirmed)

The PetDetailSheet footer uses a 2×2 grid for all four actions: Rename | Release (top row),
List for Sale | Compare (bottom row). This decision is shared with the Player Listings
feature (OQ-PL-1 and OQ-C-1 resolved by the same Owner answer). The FE must implement
a single consistent footer grid component used by both features.

### StatTable must be a `<table>` element

This is an accessibility hard requirement from the interaction spec. It is not
optional and must not be implemented as a CSS grid or flexbox layout. The `<table>`
must include `<thead>`, `<tbody>`, `<th scope="row">` row headers, and `aria-label`
attributes on winner/tied cells as specified in C-3 criteria 7 and 8.

### PetSelectorSheet is a shared component

The PetSelectorSheet must be built as a reusable component at
`src/components/ui/PetSelectorSheet.tsx`, not as a feature-specific component under
`src/components/compare/`. Future features (trading, gifting) will require a pet picker.
Props: `isOpen`, `onClose`, `onSelect`, `excludeId`, `heading` (all specified in the
interaction spec). This component can be built in Phase C by either the Developer or
the FE — it has no complex logic and no hook dependency beyond `useSavedNames`.

### Sticky CompareHeader

CompareScreen does not use the global PageHeader pattern. The "Done" button should be
placed in the global PageHeader left slot if the global PageHeader is retained on this
screen. The CompareHeader (sticky, two-column with swap) is a separate sticky element
below the global PageHeader. The Developer must confirm whether `top: 0` on CompareHeader
is relative to the scroll container or the viewport, accounting for any fixed elements
above it.

### Recommendation utility function

The recommendation function is a pure TypeScript function with no side effects:

```
compareRecommend(petA: SavedName, petB: SavedName): {
  racing: string | null,   // null if stats unavailable for both
  selling: string
}
```

It belongs in `src/lib/` (not in a component), is imported by `CompareScreen`, and is
unit-tested by the Tester in Phase D. The exact file path (`src/lib/compareRecommend.ts`
or similar) is the Developer's decision.

### Route entry

React Router state pattern (not query string):
`navigate('/compare', { state: { leftPetId: pet.id } })`

On direct URL entry with no state: `leftPetId` is undefined. CompareScreen must handle
this gracefully by opening PetSelectorSheet with no pre-selection.

---

## 6. Open Questions

The following open question is non-blocking for Phase C.

**OQ-C-4 (Recommendation strip — copy tone sign-off):**
The recommendation strip copy format ("For racing — [Name] has the edge.") is confirmed
as the working direction. The Owner has approved Phase B. If post-Phase C review suggests
a different tone is needed, copy changes can be applied without touching the data contract
of the `compareRecommend` function (string output is already abstracted). This is not
a blocking question for Phase C.

**OQ-C-5 (Listed pets eligible for comparison — confirmed in scope):**
Pets with `status === "for_sale"` are confirmed as eligible comparison targets. This is
reflected in stories C-2, C-8, and C-9. No further Owner input required.
