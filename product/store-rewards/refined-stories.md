# Refined Stories — Store: Market Filters + Rescue Mission Flow

**Feature:** `store-rewards`
**Product Owner:** Phase B
**Date:** 2026-03-30
**Status:** Awaiting [OWNER] Phase B approval before Phase C begins
**Inputs:** `research/store-rewards/ur-findings.md`, `spec/features/store-rewards/interaction-spec.md`

---

## Feature Overview

The Store Marketplace section gains a three-tab filter row (Market / For Sale / Rewards), giving Harry
a dedicated Rewards tab where he can browse and start rescue missions for wild animals. Each rescue
mission is a sequence of 3–5 short tasks completed across multiple sessions; on completion Harry
temporarily fosters the animal in his collection with an unambiguous "In your care" badge. Harry cares
for the animal until it is ready for release, at which point he receives a celebration, an XP reward,
and a permanent pin on the World Map. The World Map integration is the long-term emotional anchor: a
released animal is never gone, it lives on the map as Harry's conservation record.

---

## Scope statement

This sprint covers the filter row, the Rewards tab UI, the mission brief sheet, mission progress
toasting, the rescued card state in My Animals, and the release flow. It does not cover World Map
build, Home screen mission surfacing, or the educational games (WordSafari, CoinRush) being the
session completion triggers — those are dependencies noted in §6 below.

---

## User Stories

---

### Story 1 — Market filter tabs visible in Marketplace

```
As Harry,
I need to see three clearly labelled filter tabs (Market / For Sale / Rewards) at the top of
the Marketplace section in the Store,
So that I can switch between NPC buy offers, items listed for sale, and my rescue missions
without confusion.

Acceptance criteria:
- [ ] The three-tab row (Market / For Sale / Rewards) renders in the `below` slot of the
      PageHeader when the Marketplace main tab is active in StoreHubScreen.
- [ ] When any other main Store tab is active (Items / Cards / Auctions), the three-tab row
      is hidden entirely. The `below` slot renders nothing.
- [ ] The active pill uses the tint-pair pattern: `background: var(--blue-sub)`,
      `border: 1px solid var(--blue)`, `color: var(--blue-t)`. No solid `var(--blue)` fill.
- [ ] The inactive pill uses: `background: var(--card)`, `border: 1px solid var(--border-s)`,
      `color: var(--t2)`.
- [ ] Pill height is 36px visual height with a minimum 44px touch target on touch devices.
- [ ] The pill row uses the existing `CategoryPills` component from
      `src/components/explore/CategoryPills.tsx`. No inline reimplementation.
- [ ] The tab state (`marketTab`) is owned by `StoreHubScreen` and passed as a prop to
      `MarketplaceContent`. `MarketplaceContent` does NOT render its own tab row. A duplicate
      tab control inside the content component is a build defect.
- [ ] Tapping Market shows NPC buy offers (existing content, unchanged).
- [ ] Tapping For Sale shows player listings (existing content, unchanged).
- [ ] Tapping Rewards shows the rescue mission card grid.
- [ ] On first load, the default active tab is Market (matching current default behaviour).
- [ ] Pill transitions animate at 150ms (color, background, border-color).
- [ ] Each pill has `aria-pressed` set correctly. The row has `role="group"` and
      `aria-label="Market view"`.

Out of scope:
- Redesigning Market or For Sale tab content — those are unchanged.
- Adding a sort control — no sort row in this sprint.
- Changing the main Store section switcher (Marketplace / Items / Cards / Auctions).
```

---

### Story 2 — Viewing rescue mission cards in the Rewards tab

```
As Harry,
I need to see a grid of rescue mission cards when I tap the Rewards tab,
So that I can see which wild animals I can rescue and understand what each mission requires.

Acceptance criteria:
- [ ] The Rewards tab renders a grid of mission cards.
- [ ] Grid layout: 1 column on screens < 768px; 2 columns on screens >= 768px. Gap: 12px.
- [ ] Content container uses `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`. `pt-4` (16px) is
      mandatory — content must not sit flush against the glass header border.
- [ ] Each mission card shows: animal thumbnail (64×64, `--r-md`, object-cover), animal name
      (16px / 600, `var(--t1)`), rarity badge (existing `RarityBadge` component, tint-pair),
      habitat and region (13px / 400, `var(--t2)`, `MapPin` Lucide icon size 12 before text).
- [ ] Each card shows a missions block: section heading "MISSIONS REQUIRED" (11px / 700,
      uppercase, letter-spacing 1.5px, `var(--t3)`), a progress bar (4px, `var(--elev)` track,
      `var(--blue)` fill), a progress label ("X of Y missions complete", 12px / 500, `var(--t3)`),
      and a row per mission task with a completion indicator and description.
- [ ] Completed mission tasks show `CheckCircle` (Lucide, size 16, `var(--green-t)`).
      Incomplete tasks show `Circle` (Lucide, size 16, `var(--t4)`). No emojis.
- [ ] The card footer shows a button: "Start Mission" (variant: accent/pink, size: md, full-width)
      for missions not yet started; "Continue Mission" (same variant) for in-progress missions;
      "Claim Rescue" (same variant) for missions fully complete but not yet claimed.
- [ ] Card hover state: `translateY(-2px)`, `shadow: 0 4px 24px rgba(0,0,0,.25)`,
      `border-color: var(--border)`, 300ms. Active: `scale(.97)`, 100ms.
- [ ] Parent grid has `pt-1` to prevent hover-lift clipping at scroll container edges.
- [ ] Card surface: `var(--card)`, `border-radius: 16px (--r-lg)`, `border: 1px solid var(--border-s)`.
      No shadow at rest.
- [ ] Divider between header and missions block: `border-top: 1px solid var(--border-s)`, margin 12px.
- [ ] No emojis anywhere on the card. All icons are Lucide, stroke-width 2.
- [ ] Layout verified at 375px, 768px, and 1024px before Phase C is marked complete.

Out of scope:
- Missions sourced from the World Map (World Map is not yet built). Missions are surfaced
  in the Rewards tab only in this sprint.
- Filtering or sorting missions within the Rewards tab.
- Showing a locked/preview state for future missions not yet available.
```

---

### Story 3 — Rewards tab empty state

```
As Harry,
I need to see a helpful prompt when no rescue missions are available yet,
So that I am not confronted with a blank screen and I know where to go next.

Acceptance criteria:
- [ ] When the Rewards tab has no available, in-progress, or claimable missions, the empty
      state renders in place of the card grid.
- [ ] Empty state: centred column, minimum height 240px.
- [ ] Icon circle: 40px, `background: var(--green-sub)`, border-radius 50%, `MapPin` Lucide
      icon (size 20, `var(--green-t)`), margin-bottom 12px.
- [ ] Heading: "Rescue your first wild animal", 16px / 600, `var(--t1)`, centred.
- [ ] Body: "Complete missions on the World Map to earn wild animals for your collection.",
      13px / 400, `var(--t2)`, centred, max-width 260px.
- [ ] CTA button: "Go to World Map", variant primary (blue), size md. Tapping navigates
      to the Map tab. The button is always enabled.
- [ ] Button hover: `var(--blue-h)` bg, `box-shadow: var(--glow-blue)`, 300ms.
- [ ] No emojis in the empty state.

Out of scope:
- The World Map tab does not need to be built in this sprint. The button navigates to the
  Map route; if the Map screen does not exist, the navigation silently no-ops or shows the
  existing placeholder. This is acceptable for the MVP.
```

---

### Story 4 — Opening a mission brief sheet

```
As Harry,
I need to tap a mission card and see full details about the animal and its required missions
in a bottom sheet,
So that I understand what I am committing to before I start.

Acceptance criteria:
- [ ] Tapping "Start Mission" or "Continue Mission" on a mission card opens a BottomSheet.
- [ ] The BottomSheet is rendered via `ReactDOM.createPortal(content, document.body)`. A fixed
      component inside a Framer Motion animated ancestor without a portal is a build defect.
- [ ] Glass surface: `background: rgba(13,13,17,.88)`, `backdrop-filter: blur(24px)`,
      `border: 1px solid rgba(255,255,255,.06)`. Backdrop: `rgba(0,0,0,.30)`.
- [ ] Max height: 85vh. Inner content is scrollable (`overflow-y: auto`) if taller than the sheet.
- [ ] Sheet inner padding: `px-6 pt-4 pb-8`.
- [ ] Sheet contains (top to bottom): drag handle, animal thumbnail (80×80, `--r-md`), animal
      name (20px / 700, `var(--t1)`), rarity badge (`RarityBadge` component), conservation
      status badge (tint-pair per spec §2.2), native region text, mini-map thumbnail (100% width,
      120px height, `--r-md`, Globe fallback icon if no asset), "About This Animal" section
      (2–3 sentence conservation context, 14px / 400, `var(--t2)`), "Rescue Missions" section
      (progress bar + mission rows), and a primary CTA button.
- [ ] Conservation status badge colour pairs per spec: Critically Endangered uses red tint-pair;
      Endangered/Vulnerable use amber tint-pair; Near Threatened uses blue tint-pair; Least
      Concern uses green tint-pair. All badges are tint-pair — never solid fill.
- [ ] Mission rows: `CheckCircle` (size 18, `var(--green-t)`) for complete; `Circle` (size 18,
      `var(--t4)`) for incomplete. Both `shrink-0`. Mission label: 14px / 400, `var(--t2)`.
      Example: "Complete 3 Word Safari sessions with any card (2/3)".
- [ ] Progress bar: 4px, `var(--elev)` track, `var(--blue)` fill, width transitions 300ms.
      `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`.
- [ ] CTA button is full-width, 48px, variant accent (pink). Label changes: "Begin Mission"
      (not started), "Continue Mission" (in progress), "Claim Rescue" (all complete).
- [ ] Close button: 32px circle, `var(--elev)` bg, `var(--t3)` icon (X / Close Lucide icon),
      `aria-label="Close mission brief"`. Hover: `var(--border)` bg, `var(--t1)` icon, 150ms.
      Pressed: `scale(.95)`.
- [ ] On open, focus moves to the primary CTA button (WCAG 2.1 AA SC 2.4.3). On close, focus
      returns to the triggering card button.
- [ ] Section headings inside the sheet: 11px / 700, uppercase, letter-spacing 1.5px, `var(--t3)`.
- [ ] Dividers between sections: `border-top: 1px solid var(--border-s)`, margin 16px.
- [ ] No emojis. All icons are Lucide, stroke-width 2, `aria-hidden="true"`.
- [ ] Sheet verified at 375px (full-width) and 768px/1024px (max-w-lg centred) per spec §2.9.

Out of scope:
- In-sheet mini-map is a static SVG thumbnail, not an interactive map widget.
- "About This Animal" conservation copy is static data on the animal record — it is not
  generated dynamically in this sprint.
```

---

### Story 5 — Starting a mission and seeing progress toast

```
As Harry,
I need to see a toast notification after each qualifying game session that counts toward
my rescue mission,
So that I know my progress is being tracked without having to go back to the Store to check.

Acceptance criteria:
- [ ] Tapping "Begin Mission" in the sheet writes the mission as in-progress in the database.
      The button shows a `Loader2` spinner while the write is pending and `pointer-events: none`.
      On success the sheet closes and a progress toast fires.
- [ ] After each qualifying game session (WordSafari round, CoinRush round, etc.), the session
      completion hook fires a toast.
- [ ] Toast type: info (blue). Auto-dismiss: 5 seconds.
- [ ] Toast message format: "Mission progress: 2 of 3 sessions complete for [Animal Name] rescue!"
      No emojis. Lucide `Leaf` icon (size 16) in the toast icon circle.
- [ ] Toast is rendered via the existing toast system (portal-rendered, glass surface). It must
      not interfere with any active Framer Motion animated ancestor.
- [ ] If no active mission exists for the completing session type, no toast fires. Silent.
- [ ] Progress persists across sessions. Closing the app mid-mission does not reset any completed
      task. On reopen, the Mission Brief Sheet shows the updated progress count.
- [ ] If two missions are active simultaneously, each fires its own independent toast on the
      appropriate session type completing. Toast messages are distinct per animal.
- [ ] The "Begin Mission" write is wrapped in a `try/catch`. On failure, an error toast fires:
      "Could not start the mission — please try again." (type: error, persistent). No silent
      swallow.

Out of scope:
- Which specific game sessions count as qualifying triggers is defined per-mission in the data
  model. The session hook reads this data; it does not hard-code session types.
- Push notifications or background reminders are not in this sprint.
```

---

### Story 6 — Claiming the rescue when all missions are complete

```
As Harry,
I need to see a celebration moment when I complete all my rescue missions and tap "Claim Rescue",
So that the rescue feels like a significant achievement and I understand the animal is now in
my care.

Acceptance criteria:
- [ ] When all missions for a card are marked complete, the Rewards tab card button shows
      "Claim Rescue" (variant: accent/pink). The Mission Brief Sheet also shows "Claim Rescue"
      as the CTA.
- [ ] Tapping "Claim Rescue" writes the card to Harry's collection with `status: 'rescued'`.
      The button shows a `Loader2` spinner while pending and `pointer-events: none`.
- [ ] On successful claim, a full-viewport celebration overlay fires immediately.
- [ ] The celebration overlay is rendered via `createPortal(content, document.body)`. Fixed
      children inside Framer Motion animated parents without a portal are a build defect.
- [ ] Overlay surface: `background: linear-gradient(135deg, #E8247C, #3772FF)` (--grad-hero).
      Entrance: scale 0.95 + opacity 0 → scale 1 + opacity 1, spring `{ stiffness: 300, damping: 30 }`.
- [ ] Overlay contains: animal image (120×120, rounded-xl), animal name (28px / 700), "Rescued!"
      label (14px / 600, uppercase, letter-spacing 2px), "[Animal Name] is now in your care"
      (16px / 400), confetti burst (particle animation, 1.5s), "View in My Animals" button
      (outline variant, 44px), "Continue" button (closes overlay).
- [ ] Confetti particles: initial state `scale: 1, opacity: 1, x: 0, y: 0`. Animate `x`, `y`,
      `rotate`, `opacity` outward. Never `initial={{ scale: 0 }}` on burst particles (per
      CLAUDE.md Framer Motion rule §3).
- [ ] "View in My Animals" navigates to My Animals and closes the overlay. Overlay role:
      `alertdialog`, `aria-live="assertive"`.
- [ ] The card is NOT removed from the Rewards tab — it is simply shown as claimed/in-progress
      so Harry knows it is in his collection. It does not disappear from the list.
- [ ] The "Claim Rescue" write is wrapped in a `try/catch`. On failure, an error toast fires:
      "Could not claim [Animal Name] — please try again." (type: error, persistent).
- [ ] No emojis on the overlay. All icons are Lucide.

Out of scope:
- Badge moments at claim time — the Conservation Hero badge is awarded at release, not at claim.
- XP award at claim time — XP is awarded at release only.
```

---

### Story 7 — Seeing the "In your care" badge in My Animals

```
As Harry,
I need to see a clear visual indicator on rescued animals in My Animals showing they are
temporarily in my care,
So that I understand immediately that these animals are different from animals I own outright
and that I am fostering them.

Acceptance criteria:
- [ ] Rescued cards (`status: 'rescued'`) appear in the My Animals grid.
- [ ] Each rescued card shows an "In your care" badge: `background: var(--green-sub)`,
      `border: 1px solid var(--green)`, `color: var(--green-t)`, 11px / 600, uppercase,
      letter-spacing 0.5px, padding 2px 8px, border-radius `var(--r-pill)`.
- [ ] The badge is tint-pair — never solid `var(--green)` background with white text.
- [ ] The badge stacks below the rarity badge in the top-right corner of the card.
      Stacking order (top to bottom): rarity → tier → status. If three badges would appear,
      suppress the tier badge to prevent overflow.
- [ ] Rescued cards are NOT shown with a "List for Sale" action anywhere. They cannot be
      listed in the marketplace at the data layer. If a marketplace listing is attempted for
      a rescued card (e.g. programmatically), an error toast fires: "Rescued animals cannot
      be listed for sale while in your care."
- [ ] Rescued cards are NOT tradeable and do NOT appear as options in any trade or auction flow.
- [ ] No emojis. The "In your care" label text is plain text, no icons embedded in the string.

Out of scope:
- A dedicated "Fostered" filter in My Animals — rescued cards appear in the main grid
  alongside owned animals, visually distinguished by badge only.
- Care actions are unchanged — rescued cards support the same care actions (feed, water, rest,
  play) as active-status cards.
```

---

### Story 8 — Viewing homing progress in PetDetailSheet

```
As Harry,
I need to open a rescued card's detail sheet and see a clear homing progress block showing
how far along I am toward releasing it,
So that I understand exactly what I still need to do and the release feels earned, not arbitrary.

Acceptance criteria:
- [ ] Opening PetDetailSheet for a card with `status: 'rescued'` shows the "In your care"
      badge in the header row (green tint-pair, below the rarity badge).
- [ ] Below the stat grid and above the action buttons, a Homing Status block renders.
- [ ] Homing Status block surface: `background: var(--elev)`, `border-radius: 12px (--r-md)`,
      `padding: 16px`.
- [ ] Block contains: `Leaf` Lucide icon (size 20, `var(--green-t)`), heading "Homing until
      ready for release" (14px / 600, `var(--t1)`), "CARE PROGRESS" section label (11px / 700,
      hairline style, `var(--t3)`), progress bar (4px, `var(--card)` track, `var(--green)` fill,
      300ms transition), and progress text ("X days until release ready", 13px / 400, `var(--t2)`).
- [ ] Progress bar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`,
      `aria-valuemax`.
- [ ] When the day counter reaches 0, the progress text changes to "Ready for release" in
      `var(--green-t)`.
- [ ] While homing is not yet complete, the action button area shows only "Keep caring for
      [Name]" (outline variant, full-width). "List for Sale" is not shown.
- [ ] When the release criteria are met (day counter at 0 and care actions complete), a
      "Release to wild" button appears above "Keep caring for [Name]": variant accent (pink),
      full-width, 48px height.
- [ ] If the release timer reaches 0 while PetDetailSheet is open, the screen updates live
      via the reactive query — the "Release to wild" button appears without requiring a reload.
- [ ] No emojis. All icons are Lucide, stroke-width 2.
- [ ] "List for Sale" is entirely absent from the action button area for rescued cards.

Out of scope:
- Displaying the specific individual mission tasks that were completed to earn the rescue —
  that detail is in the Rewards tab, not the PetDetailSheet.
- Allowing Harry to abandon or cancel the foster relationship before release.
```

---

### Story 9 — Releasing a rescued animal to the wild

```
As Harry,
I need to be able to choose to release a rescued animal back to the wild when it is ready,
and see a celebration when I do,
So that the release feels like the most powerful thing I can do for the animal rather than
a loss, and I am rewarded for my care.

Acceptance criteria:
- [ ] Tapping "Release to wild" in PetDetailSheet opens a confirmation modal (not a BottomSheet).
- [ ] The modal is rendered via `createPortal(content, document.body)`.
- [ ] Modal surface: `background: rgba(13,13,17,.88)`, `backdrop-filter: blur(24px)`,
      `border: 1px solid rgba(255,255,255,.06)`, `border-radius: 16px (--r-lg)`, `padding: 28px`,
      `max-width: 420px`.
- [ ] Modal content: animal image (64×64, rounded-xl), heading "Release [Name] to the wild?"
      (18px / 700, `var(--t1)`), body text "[Name] will leave your care. You'll earn bonus XP
      and a Conservation Hero badge as a thank you for your care." (14px / 400, `var(--t2)`,
      mt-2), "Release" button (variant accent/pink, full-width, 44px, mt-6), "Cancel" button
      (outline variant, full-width, 44px, mt-2).
- [ ] On "Release" confirm: card is removed from Harry's collection. Two things fire immediately:
      (a) info toast (green, 5s): "[Name] has been released! You earned 50 XP.",
      (b) badge moment: "Conservation Hero" badge using purple tint-pair:
      `var(--purple-sub)` bg, `1px solid var(--purple)` border, `var(--purple-t)` text.
      The badge moment follows the existing badge notification pattern.
- [ ] The celebration fires BEFORE the card visually disappears from the collection view.
      Removing the card then celebrating is the wrong order.
- [ ] "Release" button shows `Loader2` spinner while pending, `pointer-events: none`.
      On failure, error toast: "Could not release [Name] — please try again." (type: error,
      persistent). No silent swallow.
- [ ] Focus on modal open lands on the "Release" button (primary destructive action). Cancel
      is the second focusable element. Focus is trapped in the modal. On close, focus returns
      to the triggering button.
- [ ] "Release to wild" button interaction states: hover `var(--pink-h)` bg + `box-shadow:
      var(--glow-pink)`, 300ms; pressed `scale(.97)`; loading `Loader2` spinner.
- [ ] "Cancel" button interaction states: hover `rgba(255,255,255,.03)` bg, border
      → `var(--t3)`, 300ms; pressed `scale(.97)`.
- [ ] No emojis on the modal. All icons are Lucide.

Out of scope:
- The World Map pin for the released animal is created in the data layer by this story's
  write path. Displaying that pin on the World Map UI is covered by Story 10 and depends
  on the World Map screen existing.
- The specific XP value (50 XP in the spec) is a starting point. [OWNER] may adjust.
```

---

### Story 10 — Keeping a rescued animal rather than releasing it

```
As Harry,
I need to be able to choose to keep a rescued animal in my care after it is release-ready
rather than being forced to release it,
So that I have agency over my animals and the game never takes something away from me
without my consent.

Acceptance criteria:
- [ ] When the release confirmation modal is open, Harry can tap "Cancel" to dismiss it.
      No release occurs. The card remains in Harry's collection with `status: 'rescued'`.
- [ ] On tapping "Cancel", the modal closes and a toast fires:
      "Great choice! [Name]'s care timer has been reset." (type: info/blue, 3s).
- [ ] The care timer resets (the day counter restarts). Harry must again meet the minimum
      care days to see the release option again. The progress bar in PetDetailSheet reflects
      the reset immediately.
- [ ] "Keep caring for [Name]" (outline button, full-width, 44px) remains visible in
      PetDetailSheet as the secondary action at all times during homing, whether or not
      the animal is release-ready. Tapping it does NOT open the confirmation modal — it
      simply provides reassurance that Harry can keep the animal and triggers the timer reset.
- [ ] No deadline, expiry, or forced release exists in the system. Harry can choose to never
      release a rescued animal. The card remains in "In your care" state indefinitely.
- [ ] No negative consequence (no XP penalty, no coin loss, no badge revocation) results from
      choosing not to release.

Out of scope:
- A "keep forever" ownership conversion (rescued cards do not convert to `status: 'active'`
  in this sprint).
- A cap on simultaneous foster cards (flagged as a risk — see §7 Open Questions). Not
  enforced in this sprint; [OWNER] to confirm.
```

---

### Story 11 — Seeing a released animal on the World Map

```
As Harry,
I need to see a pin on the World Map showing where a rescued animal has been released,
So that I know the animal is not gone — it lives somewhere real — and my conservation work
has a visible, lasting record.

Acceptance criteria:
- [ ] On successful release, the system writes a release record to the database containing:
      animal ID, release region/coordinates, timestamp, and Harry's user ID.
- [ ] The World Map (when built) renders a distinct "released" pin for each release record.
      The pin state is separate from "rescue available" and "rescue in progress" pins.
- [ ] Tapping a released pin on the World Map shows the animal's card detail (read-only)
      even though the animal is no longer in Harry's collection.
- [ ] The release record is permanent. It is not deleted if Harry starts a new mission for
      a different animal. His conservation map grows over time.
- [ ] If the World Map screen does not yet exist at the time this story ships, the database
      write still occurs so that release pins can be displayed once the Map screen is built.
      The release write must not be blocked on the Map screen existing.

Out of scope:
- The World Map screen itself — that is a separate feature. This story only specifies the
  data write and the contract the Map screen will consume.
- Showing the animal's release location within the Mission Brief Sheet or PetDetailSheet
  in this sprint.
- Community/global release statistics ("X animals released by all players") — future feature.
```

---

## Out of Scope (this sprint)

The following are explicitly excluded from Phase C for `store-rewards`:

1. **World Map screen** — The Map route and its pin rendering are a dependency (see §6). The
   data layer writes release records; the Map UI reads them. The Map screen is not built here.
2. **Home screen mission surfacing** — The owner's brief mentions the Home screen surfacing
   active missions. This is a separate feature or a follow-on sprint. Not in scope.
3. **Educational game session triggers** — WordSafari, CoinRush, and other game screens firing
   the session completion hook that advances mission progress are a data contract only. The
   hook integration point is in scope; changes to the game screens themselves are not unless
   they require a new hook call.
4. **Conservation copy per animal** — The "About This Animal" text in the Mission Brief Sheet
   is static data. Writing that copy for each rescue-eligible animal is a content task, not
   a build task. Placeholder copy is acceptable for Phase C.
5. **Maximum simultaneous foster card cap** — The UR findings flag this as an open question.
   No cap is enforced in this sprint. [OWNER] to confirm after observing Harry's behaviour.
6. **Release certificate / achievement document** — The UR findings mention a release
   certificate analogue (a document naming Harry as rescuer). This is a future enhancement.
7. **Two-stage rescues for epic/legendary animals** — The UR findings recommend a second mission
   set for higher-rarity animals. Phase 1 uses a single mission sequence regardless of rarity.
8. **Community/global release statistics** — Not in scope.
9. **Push notifications / background reminders** — Not in scope.
10. **Sorting or filtering within the Rewards tab** — No sort control in this sprint.

---

## Dependencies

The following must exist or be confirmed before Phase C can begin:

1. **[OWNER] Phase B approval** — This document must be approved before any code is written.
   Write the feature name to `.claude/current-feature` immediately after approval.

2. **Catalogue audit: eligible rescue animals** — The Rewards tab needs a meaningful set of
   Wild/Sea/Lost World animals with conservation status NT or higher. The current catalogue
   has not been audited for this count (UR findings Open Question 1). If fewer than 3 eligible
   animals exist, the Rewards tab will feel empty at launch. Developer to confirm count and
   identify if new animal records need to be added before Phase C begins.

3. **`status: 'rescued'` field on the animal/pet data model** — The rescued card state requires
   a `rescued` status value alongside the existing `active`, `for_sale` values. Developer must
   confirm this field exists or plan its addition as part of Phase C. Schema change required
   if not present.

4. **Mission data model** — A missions table (or structure within the animal record) is needed
   to store: available missions per animal, task types and completion states, mission progress
   per user. This must be specced by the Developer before Frontend work on the Rewards tab
   card grid begins. The FE renders from this data structure.

5. **Wild/Sea/Lost World generation gate** — UR findings Risk 2 requires that these animals
   cannot be obtained through any path other than rescue missions. Developer must confirm the
   Generate Wizard and marketplace hooks already block Wild/Sea/Lost World animals, or add that
   gate as part of Phase C.

6. **Release record schema** — The release write (Story 11) must be defined before Phase C
   ends, even if the World Map screen does not exist yet. Developer to confirm the schema for
   the release record table.

7. **`CategoryPills` component is reusable** — FE must confirm `src/components/explore/CategoryPills.tsx`
   can accept the three Market tabs without modification, or identify any prop changes needed.

8. **Session completion hook contract** — Developer must define the hook event that game screens
   fire on session completion, and what data it carries (session type, animal ID context if any).
   FE game screens need to call this hook; the mission progress logic lives inside it.

---

## Risks

The following risks from the UR findings remain open at Phase B. Each must be tracked to a
resolution before Phase D sign-off.

### Risk 1: Over-attachment — release causing distress (Severity: High)

Harry may form strong emotional attachment to a foster card and experience "Release to wild"
as a loss rather than an achievement. The UX spec addresses this through: a celebration overlay
before card removal, a World Map pin as persistent presence, and the "Keep caring" option with
no penalty for not releasing.

**Required mitigation before Phase C complete:** [OWNER] must confirm that the release flow
(Story 9) matches Harry's emotional response profile. This is not a UX call alone. [OWNER]
review of the Story 9 acceptance criteria, particularly the ordering of celebration before
removal and the "Keep caring" option, is required.

### Risk 2: Wild/Sea/Lost World acquisition exclusivity (Severity: Medium)

If any code path other than the rescue mechanic can produce Wild/Sea/Lost World animals (e.g.
Generate Wizard, marketplace glitch, data seeding), the rescue mechanic loses its specialness.

**Owner:** Developer. Must be confirmed and, if not already gated, gated before Phase C ships.

### Risk 3: "Rewards" naming mismatches user expectation (Severity: Medium)

The owner's brief uses "Rewards" for the tab label. The UR findings note this word implies
passive receipt, whereas missions require active effort. If Harry enters "Rewards" expecting
to receive something and finds a task list, the gap between expectation and reality may cause
disengagement.

**Owner:** [OWNER] to confirm. Current spec uses "Rewards" as the tab label per the owner's
brief. The spec notes "Rescue" or "Missions" as alternatives. If [OWNER] approves a label
change before Phase C, update the tab key and label in the implementation. If the label
remains "Rewards", no further action needed.

### Risk 4: Accidental sale/trade of foster cards (Severity: High)

A rescued card listed in the marketplace or traded would cause Harry to lose a card he has
invested care effort in. This is a data-layer requirement: rescued cards must be blocked from
all marketplace and trade flows.

**Owner:** Developer. The `for_sale` and marketplace hooks must check `status === 'rescued'`
and reject the action. This is a Phase C build requirement, not a future polish item.

### Risk 5: World Map dependency sequencing (Severity: Medium)

Stories 3 and 11 reference the World Map. If the World Map screen is not built before these
stories ship, the empty state CTA ("Go to World Map") navigates to a placeholder, and release
pins are written to the database but not displayed.

**Mitigation:** This is acceptable for the MVP. The data layer writes correctly; the Map
screen consumes it when built. The UR findings recommend [OWNER] confirm whether the World Map
should be built in this sprint or a subsequent one. This does not block Phase C for
`store-rewards` — only Story 11's visual component is deferred.

**Owner:** [OWNER] to confirm sequencing. PO recommendation: build World Map as the next
sprint after `store-rewards`, using the release record schema defined here.

---

## Open Questions (requiring [OWNER] decision)

1. **Maximum simultaneous foster cards** — Should Harry be capped at N active rescues at once
   (e.g. 3)? If so, what happens when he tries to start a fourth? The UR findings note this
   as an open question. PO recommendation: no cap in Phase 1; observe before adding one.

2. **What happens if a rescued animal is never released?** — A card can sit in "In your care"
   indefinitely under Story 10. Is this acceptable? Is there a nudge mechanism (e.g. a gentle
   notification after 30 days)? PO recommendation: no forced release and no nudge in Phase 1.

3. **XP reward quantum** — Story 9 specifies 50 XP on release. [OWNER] to confirm this value
   is appropriate relative to the existing XP scale in the app.

4. **How many missions per rescue?** — The UR findings recommend 3 tasks for common animals
   and 5 for uncommon/rare. The interaction spec shows 3 mission rows in examples. [OWNER] to
   confirm the standard task count before the data model is specced. This determines how
   the mission table is structured.

5. **Conservation copy per animal** — Is Harry's dad (or [OWNER]) writing the "About This Animal"
   text, or is it generated from the existing `animal` data? Placeholder text is acceptable for
   Phase C, but the source must be confirmed.

---

## Definition of Done references

Phase C is not complete until all of the following are met. These reference the project-wide
DoD rules in `CLAUDE.md` and the UX spec checklist in `spec/features/store-rewards/interaction-spec.md`.

### Build requirements (Phase C)

- `store-rewards` written to `.claude/current-feature` before any source file is opened.
- All three-tab filter pills use `CategoryPills` component — no inline reimplementation.
- No `ghost` variant on any visible action button. Check every file individually.
- No emojis in JSX, data files, toast messages, or button labels. Lucide only.
- All colour values trace to `var(--...)` tokens. No hardcoded hex except DS-documented
  alpha composites (e.g. `rgba(13,13,17,.88)` for glass surfaces).
- All overlays (BottomSheet, celebration overlay, confirmation modal) use `createPortal`.
- All fixed-position elements traced up ancestor tree for Framer Motion containing-block risk.
- Confetti particles: `initial={{ scale: 1 }}`, never `initial={{ scale: 0 }}`.
- `MarketplaceContent` does not render its own tab row. Dual navigation is a build defect.
- Rescued card is blocked from marketplace and trade at the data layer.
- Every `spend()` (if any) and its associated DB write are inside a single `db.transaction`.
- Every async operation has a `try/catch` with a user-facing error toast. No silent swallows.
- Layout verified at 375px, 768px, and 1024px.
- Content containers use `pb-24` minimum. All scrollable content clears the fixed nav.
- Content containers use `pt-4` minimum below the glass header border.
- `max-w-3xl mx-auto w-full` applied to all content columns.
- BottomSheet max-height 85vh, inner content scrollable.
- Body scroll lock (if applied) uses reference-counted mechanism, not direct set.
- All progress bars use `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`.

### Tester sign-off requirements (Phase D)

Before Tester sign-off in `tests/store-rewards/test-results.md`, the 10-point DS checklist
from `CLAUDE.md` must be explicitly listed and passed:

1. No emojis used as icons — Lucide only, everywhere.
2. No `ghost` variant on visible actions — full codebase search, not scoped to this feature.
3. All colours trace to `var(--...)` tokens.
4. Surface stack correct — glass rule on all fixed/absolute overlays.
5. Layout verified at 375px, 768px, and 1024px — physically resized, not CSS inspection.
6. All scrollable content has `pb-24` minimum.
7. Top-of-screen breathing room — `pt-4` below every sticky glass header.
8. Navigation controls compact and consistent — filter pill row compared against Explore screen.
9. Animation parameters match spec — confetti `initial: scale 1`, overlay spring values checked.
10. Spec-to-build element audit — every screen scrolled top to bottom, every element listed
    and cross-referenced against the interaction spec.

Tester must also physically hover over every card in every breakpoint (375px, 768px, 1024px)
and confirm hover lift does not clip at scroll container edges.

---

*Stories ready for [OWNER] Phase B approval. Phase C must not begin until approval is recorded.*
