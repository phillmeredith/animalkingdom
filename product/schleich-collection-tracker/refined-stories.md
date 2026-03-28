# Refined Stories — Schleich Collection Tracker

**Feature:** schleich-collection-tracker
**Phase:** B (Product Owner)
**Date:** 2026-03-28
**Status:** Ready for [OWNER] approval

---

## Phase B Open Questions

All questions are answered here before any story is written. No questions are left open.

---

### Q1 — Should the interaction spec's detail-sheet-only toggle override the UR finding that recommended a direct card tap?

**Resolved: Yes — the interaction spec decision stands.**

UR finding F-01 recommended a single-tap card toggle to support setup sessions. The UX designer reviewed this and made a deliberate counter-decision (spec section 3.3): card tap opens the detail sheet; the toggle lives in the sheet. The rationale is sound: a 566-item virtual grid has high mis-tap probability during scroll. The two-step path (tap card → tap toggle) is a deliberate interaction, reduces accidental state changes, and matches the model used throughout the app for state-changing actions. The toggle in the detail sheet still requires only two taps total and needs no confirmation dialog — this satisfies UR's core concern about friction.

**Acceptance criteria will test the two-step path, not a one-tap card toggle.**

---

### Q2 — Do the enriched fields (releaseYear, discontinued, discontinuedYear, breed, animalFacts) need to be present in the current data file, or are they coming in a separate enriched file?

**Resolved: Separate enriched file — schleich_animals_enriched.json.**

The owner data requirements document confirms these fields will be in `/schleich/schleich_animals_enriched.json`. The existing `/schleich/schleich_animals.json` does not contain them. The data layer story must specify that FE imports from the enriched file, not the original. If the enriched file is not yet available when Phase C begins, the Dev must raise a blocker with [OWNER] before building the detail sheet sections that depend on enriched fields. The core grid, filter, search, and ownership stories can proceed against the base data.

---

### Q3 — The interaction spec does not include the discontinued badge or breed subtitle on the card. The owner data requirements document says the spec "must decide" on breed display on the card. Which is it?

**Resolved: Breed is omitted from the card. Discontinued badge IS shown on the card. Both are confirmed decisions.**

The interaction spec (section 6) defines the card anatomy completely and does not include a breed subtitle line on the card. This is a valid decision: the card name strip is a single line (`12px / 600 / var(--t1)`, 1-line clamp). Adding a breed line would require a second text line, increasing card height and disrupting the fixed-height virtual grid calculation. Breed appears on the detail sheet only.

The owner data requirements document (section 1) specifies a "Retired" badge on the card using `--red-sub / --red-t`. The interaction spec does not explicitly add this badge to the card anatomy in section 6, but the owner data requirements document is an owner-level instruction that supersedes the spec where the spec is silent. The card will show a "Retired" badge (using `--red-sub` bg + `--red` border + `--red-t` text tint pair) in the bottom-right of the image area when `discontinued: true`. This is additive to the spec, not contradictory.

The spec uses the copy "Retired" throughout (per the brief); the owner data requirements use "Discontinued". The brief explicitly states: "Retired" not "Discontinued" in all copy. **All user-facing copy uses "Retired". The data field remains `discontinued: boolean` internally.**

---

### Q4 — The filter row includes a discontinued filter. Should it be a pill ("Retired") or a toggle ("Hide Retired")?

**Resolved: A separate "Retired" filter pill is added to the category pill row.**

The owner data requirements document offers two options and requires the spec to choose. The interaction spec does not address this explicitly. As PO, I am making this decision:

A "Retired" filter pill is added to the end of the category pill row. When active, it filters to show only retired items. This is consistent with the existing tint-pair pill pattern and does not introduce a new UI control type. The pill uses the standard blue tint-pair active style (`--blue-sub / --blue / --blue-t`) — not the red tint pair — because it is a content filter, not a status badge. Red tint pair is reserved for the badge on the card and detail sheet.

**Default:** The "Retired" pill is inactive by default — retired items are shown in the full grid (consistent with owner data requirements section 2: default is shown, not hidden). The pill filters TO retired items, not away from them.

**Label:** "Retired" — matching the copy rule from the brief.

---

### Q5 — The interaction spec shows the My Collection tab empty state CTA as "Browse All" which switches the tab. But what category does the All tab show after this navigation?

**Resolved: The All tab retains whatever category was last active — it does not reset to Horses on CTA tap.**

The CTA switches the active tab to "All". The `activeCategory` state is not reset by this action. If Harry has never changed the category, it will be "Horses" (the default). If he changed it to "Dinosaurs" and then switched to My Collection and found it empty, tapping "Browse All" takes him back to All with Dinosaurs still active. This is the correct behaviour: filter state is persistent within a session (interaction spec section 8, cross-tab filter sharing).

---

### Q6 — The current Dexie schema is at version 10. What version number does this feature's migration use?

**Resolved: Version 11.**

The db.ts file shows v9 as the base schema and v10 as the card-collection-detail upgrade. This feature adds `schleichOwned: 'id'` to the stores and must use `.version(11)`. No upgrade callback is needed — this is a new table with no existing data to backfill.

---

### Q7 — The BottomNav file was not found at `src/components/ui/BottomNav.tsx`. Where is it?

**Resolved: FE must locate the BottomNav component before Phase C begins.**

A glob search for `BottomNav*` in `src/components/ui/` returned no results. The interaction spec (section 20, item 2) references `BottomNav.tsx` as the file to modify. Dev or FE must locate the actual file path at Phase C start. The story AC will reference "the BottomNav component" without hardcoding the path. This is not a blocker for Phase B.

---

## User Stories

---

### Story 1 — Nav: Sixth tab added

```
As Harry,
I need a "Collection" tab in the bottom navigation bar,
So that I can reach the Schleich collection tracker from anywhere in the app
in one tap.

Acceptance criteria:
- [ ] A sixth tab is added to the bottom navigation with the label "Collection"
      and the Lucide Package icon (stroke-width 2, size 22px)
- [ ] The tab routes to /schleich and renders SchleichScreen
- [ ] The tab is highlighted (active state) when the current route is /schleich
- [ ] All six tab labels are fully visible without truncation on a 375px screen
      (FE must resize browser to 375px to verify — not rely on CSS inspection alone)
- [ ] All six tab icons and labels are aligned and consistent with the existing
      five tabs — same height, same font size, same icon size
- [ ] On a 1024px screen all six tabs have comfortable tap target width
      (minimum 44px each — verified by measurement, not assumption)
- [ ] No badge dot appears on the Collection tab

Out of scope:
- Any changes to the labels, icons, or routes of the existing five tabs
  (the spec permits shortening "My Animals" to "Animals" if truncation occurs —
  this is handled as a defect if it occurs, not proactively)
- First-launch onboarding or tooltip for the new tab
```

---

### Story 2 — All tab: Virtual grid with default Horses filter

```
As Harry,
I need the Collection screen to open showing all Horses figurines in a browsable grid,
So that my primary interest is immediately in front of me without any extra steps.

Acceptance criteria:
- [ ] On mount, SchleichScreen renders the "All" tab with activeCategory = 'horses'
      (the Horses filter pill is active, not "All")
- [ ] The grid renders all items matching the active category using react-window
      FixedSizeGrid (no pagination, no load-more button)
- [ ] Grid column counts are: 2 columns at 375px, 3 columns at 768px,
      4 columns at 1024px
- [ ] Grid gap is: 12px (gap-3) at 375px, 16px (gap-4) at 768px and 1024px
- [ ] Content container uses: px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
- [ ] pt-4 (16px) breathing room is visually confirmed between the PageHeader
      glass border-bottom and the first card in the grid at all three breakpoints
- [ ] pb-24 ensures the last row of cards is not hidden behind the fixed BottomNav
- [ ] Switching from a filtered category to "All" renders all 566 items in the
      virtual grid with no visible jank or blank flash
- [ ] The grid is scrollable; virtual scroll means only visible rows are in the DOM
      (verify via browser DevTools: no more than ~3 rows worth of DOM nodes
      should be rendered at any time when the list is long)
- [ ] The screen renders correctly at 375px, 768px, and 1024px without wasted
      space or cut-off content

Out of scope:
- Staggered card entrance animation (no animation on grid mount — per spec section 12)
- Scroll position restoration between sessions
- Alphabetical AZRail (explicitly excluded per spec section 13)
```

---

### Story 3 — Category filter pills

```
As Harry,
I need to tap a category pill to see only that category of figurines,
So that I can browse horses, dinosaurs, or any other category without
scrolling past everything else.

Acceptance criteria:
- [ ] The filter pill row shows six pills in this order:
      All · Horses · Wild Animals · Farm · Dragons · Dinosaurs
- [ ] Raw category keys are mapped to display labels:
      horses → Horses
      wild-animals-adventure → Wild Animals
      farm-animals-farm-toys → Farm
      monsters-and-dragons → Dragons
      dinosaurs-and-volcano → Dinosaurs
- [ ] Active pill uses tint-pair style: bg-[var(--blue-sub)], border 1px solid
      var(--blue), text var(--blue-t)
- [ ] Inactive pill uses: bg-[var(--card)], border 1px solid var(--border-s),
      text var(--t2)
- [ ] Solid fill (bg-[var(--blue)] with white text) is NOT used on any pill
- [ ] Tapping an inactive category pill sets it as active and filters the grid
      to only that category's items
- [ ] Tapping the already-active category pill (other than All) returns to All
      (deactivate toggle behaviour — matches CategoryPills.tsx pattern)
- [ ] Tapping "All" when already active is a no-op
- [ ] A "Retired" filter pill is added after the Dinosaurs pill (seventh pill total)
      with the same tint-pair active style as category pills
- [ ] When "Retired" is active, the grid shows only items where discontinued: true
      from within the active category (or all categories if "All" is active)
- [ ] "Retired" is inactive by default — retired items are included in the normal
      grid view without activating this pill
- [ ] Filter pills row uses: flex items-center gap-2 overflow-x-auto scrollbar-hide
      -mx-6 px-6 (bleeding to screen edges)
- [ ] Each pill uses: h-9, px-4, rounded-[var(--r-pill)], 13px/600,
      whitespace-nowrap, shrink-0, transition-colors duration-150
- [ ] Pill state transition is colour-only, 150ms, no scale or movement
- [ ] The SchleichCategoryPills component is new — it does not import from
      src/components/explore/CategoryPills.tsx (which depends on AnimalCategory type)
      but it replicates the exact anatomy

Out of scope:
- Multi-select category filtering (one active category at a time)
- Category item counts shown on pills
- Sub-category filtering within a category
```

---

### Story 4 — Search

```
As Harry,
I need to type a name into a search box to find a specific figurine,
So that I can locate a figurine quickly when I know part of its name.

Acceptance criteria:
- [ ] The SearchBar component (src/components/ui/SearchBar.tsx) is used without
      re-implementation; placeholder text is "Search figurines…"
- [ ] Search is case-insensitive and partial-match (contains, not starts-with):
      typing "pony" returns all items with "pony" anywhere in the name
- [ ] Search applies within the active category filter (AND logic):
      if Horses is active and query is "pony", only horse ponies are returned
- [ ] If "All" is active and query is set, all 566 items are searched
- [ ] The search query state is shared between the All tab and My Collection tab
      (switching tabs does not clear the query)
- [ ] Typing in the search field updates the grid in real time (no submit required)
- [ ] A clear (x) button appears when the query is non-empty; tapping it resets
      the query to '' without changing the active category
- [ ] When search + filter produces zero results, the no-results empty state is
      shown: Lucide Search icon (48px, var(--t4)), title "No figurines found"
      (17px/600/var(--t1)), description "Try a different search or change the
      filter." (14px/var(--t2)), and a "Clear filters" button (variant="outline",
      size="md") that resets query to '' and activeCategory to 'horses'
- [ ] The SearchBar is positioned in the below slot of PageHeader, row 1
      (above the category pills row)

Out of scope:
- Search across all categories when the active category returns no results
  (the UR recommended this as a "sensible fallback" but it adds conditional
  scope without confirmed user need — deferred to a future iteration)
- Fuzzy/typo-tolerant search
- Search history or saved searches
```

---

### Story 5 — Retired items in the grid

```
As Harry,
I need to see retired (discontinued) figurines in the grid with a clear "Retired"
badge on their card,
So that I know which figurines I might not be able to buy new, and my collection
feels complete rather than missing items.

Acceptance criteria:
- [ ] Items where discontinued: true display a "Retired" badge on the card
- [ ] Badge position: absolute, bottom-right of the image area (bottom-8px right-8px
      inside the image, distinct from the owned checkmark badge which is top-right)
- [ ] Badge styling: tint-pair using --red-sub background, 1px solid --red border,
      --red-t text; padding 3px 8px; radius 100px (pill); font 10px/600;
      label text: "Retired"
- [ ] Items where discontinued: false (or discontinued field absent) show no
      Retired badge
- [ ] Retired items are visible in the grid by default (the Retired filter pill
      is inactive by default — see Story 3)
- [ ] The Retired badge does not interfere with the owned checkmark badge:
      checkmark is top-right, Retired is bottom-right — they can both appear on
      the same card simultaneously
- [ ] No grayscale or image desaturation is applied to retired items
      (the badge alone is the sufficient visual signal per owner decision)
- [ ] The Retired badge label uses "Retired" (not "Discontinued") throughout —
      this is a copy rule, not a data rule; the field is still named `discontinued`

Out of scope:
- Any business logic preventing Harry from marking a retired item as owned
- Different sort order for retired items
- A retirement date displayed on the card (retirement year is detail sheet only)
```

---

### Story 6 — Card anatomy

```
As Harry,
I need every Schleich figurine card in the grid to show the figurine's image,
name, category, and owned/retired status at a glance,
So that I can scan the grid and identify figurines without tapping any of them.

Acceptance criteria:
- [ ] Card surface: var(--card) (#18181D), border 1px solid var(--border-s), radius
      var(--r-lg) (16px), overflow hidden
- [ ] Image area: 1:1 aspect ratio, 100% card width, object-fit: contain (NOT cover),
      background var(--elev) to fill letterbox space around transparent backgrounds
- [ ] Image source: item.image_url (Shopify CDN URL) — NOT item.image (relative path)
- [ ] Image fallback when image_url fails: var(--elev) background with centred Lucide
      Package icon (48px, var(--t4))
- [ ] Name strip below image: padding 8px 10px; font 12px/600/var(--t1); 1-line clamp
      with ellipsis; full name visible in detail sheet only
- [ ] No breed subtitle on the card (breed is detail sheet only — see Story 7)
- [ ] Category badge on card: absolute overlay, bottom-left of image (bottom-8px
      left-8px); tint pair per category colour map; short label (Horses/Wild/Farm/
      Dragons/Dinos); padding 3px 8px; radius 100px; font 10px/600
- [ ] Category colour map:
        horses → --amber-sub bg + --amber-t text
        wild-animals-adventure → --green-sub bg + --green-t text
        farm-animals-farm-toys → --green-sub bg + --green-t text
        monsters-and-dragons → --purple-sub bg + --purple-t text
        dinosaurs-and-volcano → --red-sub bg + --red-t text
- [ ] Owned indicator badge (All tab only): absolute, top-right of image
      (top-8px right-8px); 24x24px circle; background var(--green) (#45B26B);
      Lucide Check icon (14px, stroke-width 2.5, #fff); border 2px solid var(--card)
- [ ] Owned badge is shown only when figurine id is in the owned set; hidden for
      unowned figurines
- [ ] In My Collection tab the owned badge is NOT shown (every card there is owned —
      badge is redundant per spec section 7)
- [ ] Retired badge as specified in Story 5 (bottom-right of image)
- [ ] No hardcoded hex values — all colours use CSS variable tokens
- [ ] No emojis anywhere on the card — Lucide icons only
- [ ] Card is implemented as a <button> or element with role="button" and
      aria-label: "View {name}" or "View {name}, owned" when owned
- [ ] Hover state: translateY(-2px), shadow 0 4px 24px rgba(0,0,0,.25),
      border 1px solid var(--border); transition-all duration-300
- [ ] Active state: scale(0.97) via motion-safe:active:scale-[.97]
- [ ] Focus state: outline 2px solid var(--blue), outline-offset 2px
- [ ] Hover lift does not clip — parent grid has pt-1 if clipping is observed

Out of scope:
- Breed shown on the card
- Article number or release year on the card
- Price information
```

---

### Story 7 — Detail sheet

```
As Harry,
I need to tap a figurine card to see full details about it including the figurine's
image, breed, description, animal facts, and release/retirement information,
So that I can read about figurines I'm interested in and mark them as owned.

Acceptance criteria:
- [ ] Tapping any card in either the All tab or My Collection tab opens
      SchleichDetailSheet as a BottomSheet overlay
- [ ] The BottomSheet uses createPortal(content, document.body) — existing
      Modal.tsx/BottomSheet behaviour; FE must confirm it is already in place
- [ ] Sheet glass surface: rgba(13,13,17,.80) + backdrop-filter blur(24px) +
      border 1px solid rgba(255,255,255,.06); radius 16px 16px 0 0
- [ ] Backdrop: bg-black/10 (never higher)
- [ ] Max height: 85vh (BottomSheet default)
- [ ] Dismiss: tap backdrop OR drag handle downward; no explicit close button
      in the sheet body; no title prop passed to BottomSheet
- [ ] Inner content: max-w-2xl mx-auto w-full px-6 pt-2 pb-10

Section 1 — Hero image:
- [ ] Aspect ratio 4:3 (landscape); object-fit: contain; background var(--elev);
      border-radius var(--r-lg) (16px); width 100%; margin-bottom 16px
- [ ] Image source: image_url (CDN); fallback: var(--elev) bg + Lucide Package
      (48px, var(--t4)); alt text: "{figurine name}"

Section 2 — Name and category:
- [ ] Item name: 22px/600/var(--t1), line-height 1.35, wraps onto 2 lines if needed
      (NOT truncated in the sheet)
- [ ] Breed subtitle: if breed is not null, display directly below the name;
      font: 14px/400/var(--t2); always shown when present
- [ ] If discontinued: true, show a "Retired" pill badge near the item name;
      tint pair: --red-sub bg + 1px solid --red border + --red-t text;
      if discontinuedYear is known, label is "Retired {year}" (e.g. "Retired 2021");
      if discontinuedYear is null, label is "Retired"
- [ ] Category badge: tinted pill using category colour map (full label e.g. Horses,
      Wild Animals); padding 4px 10px; radius 100px; font 12px/600;
      positioned to the right of the name (flex row, gap 8px, align-items flex-start,
      shrink-0)

Section 3 — Ownership toggle (must appear ABOVE the description):
- [ ] Margin-top 16px from name/badge row
- [ ] Unowned state: variant="primary" (--blue background, #fff text), size="lg",
      w-full; Lucide Plus icon (20px, stroke-width 2, #fff); label "I own this"
- [ ] Owned state: variant="outline" (transparent, 1.5px solid --border), size="lg",
      w-full; Lucide Check icon (20px, stroke-width 2, var(--green-t));
      label "In my collection"; text colour var(--green-t) (#7DD69B)
- [ ] aria-pressed="true" when owned, "false" when not owned
- [ ] aria-label: "Mark as owned" (unowned) / "Remove from collection" (owned)
- [ ] State updates immediately on tap (optimistic UI — DB write in background)
- [ ] No confirmation dialog

Section 4 — Description:
- [ ] Separator: 1px solid var(--border-s), full width, margin-bottom 12px
- [ ] Text: 13px/400/var(--t2), line-height 1.5, CSS line-clamp-3 by default
- [ ] "Read more" expand control below truncated text: 12px/500/var(--blue-t)
- [ ] Tapping "Read more" removes line-clamp and shows full text; control changes
      to "Show less"
- [ ] No animation on expand — instant reveal

Section 5 — Animal facts:
- [ ] A dedicated section below the description
- [ ] Separator: 1px solid var(--border-s), full width above the section
- [ ] Section heading: if breed is not null: "About the {breed}" (e.g.
      "About the Hanoverian"); if breed is null: "About this animal"
- [ ] Heading font: 14px/600/var(--t1)
- [ ] Body text: animalFacts field content; 13px/400/var(--t2), line-height 1.5
- [ ] If animalFacts is absent or empty string: this section is not rendered

Section 6 — Release year:
- [ ] Rendered below the animal facts section (or below description if no facts)
- [ ] Format: "Released {releaseYear}" (e.g. "Released 2019")
- [ ] Font: 13px/400/var(--t3)
- [ ] If releaseYear is absent: this field is not rendered

Out of scope:
- The figurine's article number (data field exists but is not displayed)
- Product URL / link to Schleich website
- Sharing functionality
- Image zoom or gallery view
```

---

### Story 8 — Ownership toggle behaviour

```
As Harry,
I need to tap a button in the detail sheet to mark a figurine as owned or not owned,
So that my collection reflects what I actually have without any extra steps
or confirmation prompts.

Acceptance criteria:
- [ ] Tapping "I own this" adds the figurine's derived id to the schleichOwned
      Dexie table and immediately updates the button to the owned state
      ("In my collection" with Check icon in var(--green-t))
- [ ] Tapping "In my collection" (owned state) removes the id from schleichOwned
      and immediately updates the button to the unowned state
- [ ] The grid in the All tab updates reactively: when ownership is toggled in the
      sheet, the owned indicator badge on the card appears or disappears without
      requiring a page refresh or closing the sheet
- [ ] Reactivity is achieved via useLiveQuery(() => db.schleichOwned.toArray())
      (Dexie live query — not polling or manual state sync)
- [ ] The owned indicator badge on the card animates in when ownership is set:
      scale 0→1, opacity 0→1, 200ms, cubic-bezier(0.16, 1, 0.3, 1)
- [ ] When ownership is removed, the badge disappears instantly (no exit animation)
- [ ] Both transitions respect prefers-reduced-motion: with reduced motion active,
      badge appears and disappears instantly with no scale or opacity animation
- [ ] No toast notification fires for ownership toggle (per UR finding section 10b)
- [ ] No confirmation dialog before toggle in either direction
- [ ] Optimistic UI: card state updates in local/reactive state before DB write
      confirms; if DB write fails, a toast is shown with a user-facing error message
      and the toggle reverts (error handling per CLAUDE.md build defect rules)
- [ ] The button state change (primary → outline) transitions over 150ms, linear

Out of scope:
- Quantity tracking ("how many do I own")
- Ownership date recording
- Undo toast after toggle
- Bulk ownership marking
```

---

### Story 9 — My Collection tab

```
As Harry,
I need a "My Collection" tab where I can see all my owned figurines in one place,
So that I can browse my collection, show it to others, and see how many I have.

Acceptance criteria:
- [ ] Tapping "My Collection" in the tab switcher switches to the owned-items view
      with a 150ms cross-fade (AnimatePresence mode="wait" wrapping content area only;
      tab switcher is NOT inside AnimatePresence)
- [ ] The My Collection view shows only items whose derived id is in schleichOwned
- [ ] The same category filter pills and search bar are present in My Collection
      as in All; activeCategory and query are shared state — switching tabs does not
      reset them
- [ ] A count label is shown inside the content container, above the grid:
      "{n} figurines" (plural) or "1 figurine" (singular), reflecting the
      filtered result count; font 13px/400/var(--t3)
- [ ] Count label is shown in My Collection tab only (not in All tab)
- [ ] The grid uses the same column counts and card anatomy as the All tab
      (2 / 3 / 4 columns at 375 / 768 / 1024px)
- [ ] Cards in My Collection do NOT show the owned checkmark badge (redundant —
      every card here is owned)
- [ ] Cards DO retain the Retired badge where applicable
- [ ] Tapping a card opens the detail sheet (same behaviour as All tab)
- [ ] The detail sheet ownership toggle shows "In my collection" state for all
      cards in this tab; tapping it removes the item from the collection and
      it disappears from the grid reactively

Empty state (no owned items):
- [ ] Layout: flex flex-col items-center text-center; padding pt-16 pb-24 px-6
- [ ] Icon: Lucide Package, 48px, var(--t4), margin-bottom 16px
- [ ] Title: "Your collection is empty"; 22px/600/var(--t1); margin-bottom 8px
- [ ] Description: "Tap a figurine in All to mark it as owned.";
      15px/400/var(--t3); max-width 280px; margin 0 auto
- [ ] CTA button: variant="primary", size="md", label "Browse All";
      margin-top 20px; onClick switches active tab to All
- [ ] Empty state does not show a "0" count; the count label is not shown
      in the empty state

Out of scope:
- Collection statistics or percentage complete
- Sharing or exporting the collection
- Category-level progress indicators
- Sorting by date added
```

---

### Story 10 — Data layer: schema migration and static data import

```
As a developer,
I need a Dexie schema migration to version 11 and a static import of the enriched
Schleich catalogue data,
So that ownership state persists across sessions and all figurine data is available
at build time with no runtime API calls.

Acceptance criteria:
- [ ] db.ts is updated to version 11 with `schleichOwned: 'id'` added to the stores
      definition (primary key: string; no auto-increment)
- [ ] A TypeScript interface `SchleichOwned { id: string }` is exported from db.ts
- [ ] The `AnimalKingdomDB` class declares `schleichOwned!: Table<SchleichOwned>`
- [ ] The version 11 migration has no upgrade callback (new table, no backfill needed)
- [ ] Existing data in all prior tables is unaffected by the migration
- [ ] FE imports catalogue data from `/schleich/schleich_animals_enriched.json`
      at build time as a static JSON module (no API call, no loading state
      for the catalogue itself)
- [ ] If schleich_animals_enriched.json is not yet available at Phase C start,
      the blocker is raised with [OWNER] immediately; the grid, filter, search,
      and ownership stories can proceed against the base data file with a
      TypeScript stub for the enriched fields (releaseYear: null, discontinued: false,
      discontinuedYear: null, animalFacts: '', breed: null)
- [ ] TypeScript type `SchleichAnimal` is defined covering all fields:
      name, description, image, image_url, category, url (from base file) plus
      articleNumber, releaseYear, discontinued, discontinuedYear, animalFacts, breed
      (from enriched file); all enriched fields are typed as nullable to allow
      graceful rendering when data is incomplete
- [ ] Derived id is computed per the spec rule: image filename without extension
      e.g. "images/haflinger-foal-13951.jpg" → "haflinger-foal-13951"
- [ ] The useSchleichOwned hook (src/hooks/useSchleichOwned.ts) is implemented:
      returns { ownedIds: Set<string>, toggleOwned: (id: string) => Promise<void> }
      where ownedIds is populated via useLiveQuery and updates the grid reactively
- [ ] toggleOwned wraps Dexie add/delete in a try/catch; on error, calls
      toast({ type: 'error', ... }) with a user-facing message (build defect
      rule from CLAUDE.md — silent swallow is prohibited)
- [ ] No coins, badges, or transaction records are created or modified by
      any action in this feature

Out of scope:
- Cloud sync or backup of ownership data
- Import/export of ownership state
- Schleich data refresh mechanism (catalogue is static at build time)
- Any connection between SchleichAnimal data and the SavedName / digital animal system
```

---

### Story 11 — Retired items filter pill

```
As Harry,
I need to be able to tap a "Retired" filter pill to see only retired figurines,
So that I can browse the figurines that are no longer available to buy.

Acceptance criteria:
- [ ] A "Retired" pill is the seventh (last) pill in the category filter row,
      after the Dinosaurs pill
- [ ] The pill uses the standard blue tint-pair active style (not red) because
      it is a content filter, not a status signal
- [ ] Default state: inactive — retired items ARE shown in the main grid;
      activating the pill restricts the view to ONLY retired items
- [ ] When Retired pill is active and a category filter is also active, both
      filters apply (AND logic): only retired items in the active category are shown
- [ ] When Retired pill is active and search is also entered, all three conditions
      apply: retired + category + name match
- [ ] Tapping the active Retired pill deactivates it and returns to showing
      all items (including retired) within the current category
- [ ] The Retired pill is present in both the All tab and My Collection tab
- [ ] In My Collection tab, when Retired is active, only owned retired items
      are shown
- [ ] The filter pill row scrolls horizontally if all seven pills do not fit
      at 375px; at 1024px all pills should be visible without scrolling

Out of scope:
- A "Hide Retired" toggle (the pill approach was chosen over a toggle — scope is closed)
- Filtering by retirement year range
```

---

## Out of Scope

The following are explicitly not part of this feature. Any request to add these
during Phase C or D is scope creep and requires a new story.

- **Wish list or "want" state** — binary owned/not-owned; no third state
- **Quantity tracking** — no "I have 2 of this" counter; one boolean per item
- **Coin integration** — no coins earned, spent, or displayed for any collection action
- **Badge or achievement integration** — no badges for collection milestones
- **Cloud sync** — ownership data is local (Dexie/IndexedDB) only
- **Sharing or export** — no share sheet, screenshot feature, or CSV export
- **Notifications or reminders** — no notification for new releases, retired items, etc
- **Collection statistics dashboard** — no percentage complete, no total value
- **Category-level progress bars** — no "32 of 198 horses" display (flagged as a
  future enhancement in UR findings G-09; not in scope now)
- **Wishlist / "want" items** (UR gap G-08) — deferred explicitly
- **Schleich website deep-links** — the url field in the data is not rendered
- **Article number display** — the articleNumber enriched field is not displayed
- **New animal generation using Schleich data** — this feature has no connection to
  the virtual animal / SavedName system
- **AZRail alphabetical scroll navigation** — explicitly excluded per spec section 13
- **Onboarding tooltip or walkthrough** — the UI must be self-explanatory

---

## Definition of Done

All of the following must be true before the backlog status is updated to `complete`.

### Functional completeness
- [ ] All 11 stories are built and pass their acceptance criteria
- [ ] SchleichScreen renders correctly at 375px, 768px, and 1024px
- [ ] The sixth nav tab is present and active when route is /schleich
- [ ] Ownership persists across browser refresh (Dexie IndexedDB)
- [ ] The virtual grid renders without jank when switching categories or filtering
- [ ] The detail sheet opens and closes correctly; ownership toggle updates the grid
      reactively without closing the sheet

### Design system compliance
- [ ] No hardcoded hex values — all colours reference CSS variable tokens
- [ ] No emojis in JSX, data files, toast messages, or button labels
- [ ] No ghost variant on any visible action button
- [ ] All surfaces, cards, and overlays use correct DS tokens
- [ ] The detail sheet uses the glass treatment (rgba(13,13,17,.80) + blur(24px))
- [ ] The category pill row uses the CategoryPills tint-pair pattern exactly
- [ ] No solid fill on any filter pill

### Responsive layout
- [ ] All three breakpoints verified by FE resizing the browser (not just CSS inspection)
- [ ] Grid shows 2 / 3 / 4 columns at 375 / 768 / 1024px respectively
- [ ] Content column uses max-w-3xl mx-auto w-full on all scrollable content
- [ ] All scrollable content has pb-24 minimum
- [ ] pt-4 breathing room below PageHeader confirmed at all breakpoints

### Accessibility and interaction
- [ ] All interactive elements have minimum 44px touch target
      (filter pill height h-9 = 36px is an accepted exception per spec)
- [ ] Ownership toggle has correct aria-pressed and aria-label values
- [ ] Card tiles have correct aria-label values
- [ ] All animations respect prefers-reduced-motion
- [ ] No confirmation dialogs for the ownership toggle

### Data and error handling
- [ ] Dexie schema is at version 11 with schleichOwned table defined
- [ ] toggleOwned error path calls toast with user-facing message (not silent swallow)
- [ ] Image load failures show the Package fallback (var(--elev) bg + icon)
- [ ] No build defects from CLAUDE.md error handling rules

### Test sign-off
- [ ] tests/schleich-collection-tracker/test-results.md exists with Tester sign-off
- [ ] All 10 DS checklist items are explicitly listed and passed in test-results.md
- [ ] spec/features/schleich-collection-tracker/done-check.md has been run

---

*Phase B complete. Awaiting [OWNER] approval before Phase C begins.*
